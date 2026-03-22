# mcp/agent.py

import json
import sys
import re
from pathlib import Path
from fastapi import FastAPI
from pydantic import BaseModel
import ollama
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client
import uvicorn

import logging

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    handlers=[
        logging.StreamHandler(sys.stderr),
        logging.FileHandler("mcp_server.log")
    ]
)
logger = logging.getLogger("agent")

app = FastAPI()


class ChatRequest(BaseModel):
    message: str
    user_id: int


# ------------------------------------------------------------------ #
#  SYSTEM PROMPT
# ------------------------------------------------------------------ #

def build_system_prompt(tools: list, user_id: int) -> str:
    tool_descriptions = []
    for t in tools:
        props = (t.inputSchema or {}).get("properties", {})
        # Exclude user_id from the displayed params since we inject it automatically
        params = {k: v for k, v in props.items() if k != "user_id"}
        param_str = json.dumps(params, indent=2) if params else "none"
        tool_descriptions.append(
            f"  • {t.name}: {t.description or 'no description'}\n    params (excluding user_id): {param_str}"
        )

    tools_block = "\n".join(tool_descriptions)

    return f"""You are a friendly and professional banking assistant.
The authenticated user's ID is {user_id}. All tool calls must use this user_id automatically.

== HOW TO CALL A TOOL ==
When you need data or need to perform an action, respond with ONLY a raw JSON object — no prose before or after it:
{{"action": "<tool_name>", "args": {{<args except user_id>}}}}

user_id is ALWAYS injected automatically — never include it in args yourself.

== AVAILABLE TOOLS ==
{tools_block}

== AFTER RECEIVING TOOL RESULTS ==
Respond in clear, friendly, plain English. Never show raw JSON or IBANs unless the user asks.
Use the bank name (e.g. "Barclays") instead of IBAN when referring to accounts in conversation.
Format currency amounts with 2 decimal places and include "JOD" as the currency.

== GENERAL RULES ==
- Never invent, guess, or assume any balance or account data. Always call a tool.
- For transfers: use the IBANs returned from get_user_accounts to identify accounts by bank name.
- If the user mentions a bank name for a transfer (e.g. "from Barclays"), call get_user_accounts first to resolve the IBAN, then call internal_transfer.
- If a transfer fails, explain why clearly.
- For non-banking questions, politely redirect the user.
"""


# ------------------------------------------------------------------ #
#  ACTION EXTRACTION
# ------------------------------------------------------------------ #

def extract_action(text: str) -> dict | None:
    """
    Extract a JSON action from model output.
    Handles: bare JSON, <functioncall> / <tool_call> wrappers, prose+JSON mix, single-quoted JSON.
    Normalises whatever key the model uses (action/name/function/tool) to always return {"action": ..., "args": ...}
    """
    cleaned = re.sub(r'<[^>]+>', '', text).strip()
    logger.info(f'cleaned action: {cleaned!r}')

    def fix_quotes(s: str) -> str:
        return re.sub(r"(?<!\\)'", '"', s)

    NAME_KEYS = ("action", "name", "function", "tool", "tool_name")
    ARGS_KEYS = ("args", "arguments", "parameters", "params")

    candidates = re.findall(r'{[^{}]+}', cleaned, re.DOTALL)
    for candidate in candidates:
        for attempt in [candidate, fix_quotes(candidate)]:
            try:
                data = json.loads(attempt)
            except json.JSONDecodeError:
                continue
            tool_name = None
            for key in NAME_KEYS:
                if key in data and isinstance(data[key], str):
                    tool_name = data[key]
                    break
            if not tool_name:
                continue
            args = {}
            for key in ARGS_KEYS:
                if key in data and isinstance(data[key], dict):
                    args = data[key]
                    break
            logger.info(f"Extracted action: tool={tool_name!r} args={args}")
            return {"action": tool_name, "args": args}
    return None


# ------------------------------------------------------------------ #
#  CHAT ENDPOINT
# ------------------------------------------------------------------ #

@app.post("/chat")
async def chat(request: ChatRequest):
    
    logger.info(f"user_id={request.user_id} | message={request.message!r}")
    user_id = request.user_id
    message = request.message

    if user_id is None:
        raise ValueError("user_id is required")

    server_script = Path(__file__).with_name("mcp_server.py")
    server_params = StdioServerParameters(command="python", args=[str(server_script)])

    async with stdio_client(server_params) as (reader, writer):
        async with ClientSession(reader, writer) as session:
            await session.initialize()

            list_tools_result = await session.list_tools()
            mcp_tools = list_tools_result.tools
            known_tool_names = {t.name for t in mcp_tools}
            logger.info(f"Tools available: {sorted(known_tool_names)}")

            system_prompt = build_system_prompt(mcp_tools, user_id)

            messages = [
                {"role": "system", "content": system_prompt},
                {"role": "user",   "content": message},
            ]

            client = ollama.AsyncClient()
            max_iterations = 8

            for iteration in range(max_iterations):
                logger.info(f"--- LLM iteration {iteration + 1} ---")

                response = await client.chat(
                    model="qwen2.5-coder:3b",
                    messages=messages,
                )
                raw = response["message"]["content"].strip()
                logger.info(f"Model output: {raw}")

                action = extract_action(raw)
                logger.info(f'Extracted action: {action!r}')
                # ---- TOOL CALL ----
                if action:
                    tool_name = action.get("action", "")
                    tool_args = action.get("args", {})

                    if tool_name not in known_tool_names:
                        logger.warning(f"Unknown tool requested: {tool_name!r}")
                        messages.append({"role": "assistant", "content": raw})
                        messages.append({
                            "role": "user",
                            "content": f"Error: tool '{tool_name}' does not exist. Available tools: {', '.join(sorted(known_tool_names))}. Please try again."
                        })
                        continue

                    # Always inject user_id
                    tool_args["user_id"] = user_id
                    logger.info(f"Calling tool: {tool_name}({tool_args})")

                    # Store only the clean action (no hallucinated prose) in history
                    messages.append({"role": "assistant", "content": json.dumps({"action": tool_name, "args": action.get("args", {})})})

                    try:
                        result = await session.call_tool(tool_name, tool_args)
                        content = result.content
                        if isinstance(content, list):
                            result_text = " ".join(
                                b.text if hasattr(b, "text") else str(b) for b in content
                            )
                        else:
                            result_text = json.dumps(content)
                    except Exception as e:
                        logger.exception(f"Tool call failed: {tool_name}")
                        result_text = json.dumps({"error": str(e)})

                    logger.info(f"Tool result: {result_text}")

                    messages.append({
                        "role": "user",
                        "content": (
                            f"Tool '{tool_name}' returned the following real data:\n{result_text}\n\n"
                            "Using ONLY this data, give the user a clear and friendly plain-English response. "
                            "Do not show JSON, do not show IBANs unless asked, use bank names, format amounts as JOD."
                        )
                    })

                    logger.info(f"messages: {messages}")

                # ---- FINAL ANSWER ----
                else:
                    logger.info("Final answer from model.")
                    return {"reply": raw}

            logger.warning("Max iterations reached.")
            return {"reply": "I'm sorry, I wasn't able to complete your request. Please try again."}


if __name__ == "__main__":
    uvicorn.run(app, host="0.0.0.0", port=8000)