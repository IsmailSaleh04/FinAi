# mcp/mcp_server.py

import sys
import logging
import psycopg2
from psycopg2 import pool
from mcp.server.fastmcp import FastMCP

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)s | %(name)s | %(message)s",
    handlers=[
        logging.StreamHandler(sys.stderr),
        logging.FileHandler("mcp_server.log")
    ]
)
logger = logging.getLogger("banking-mcp")

# DATABASE
try:
    db_pool = psycopg2.pool.SimpleConnectionPool(
        1, 10,
        dbname="finai",
        user="postgres",
        password="1",
        host="localhost",
        port=5432
    )
    conn = db_pool.getconn()
    conn.cursor().execute("SELECT 1")
    db_pool.putconn(conn)
    logger.info("Database connection pool initialized successfully.")
except Exception:
    logger.exception("Failed to initialize DB pool.")
    raise

mcp = FastMCP("banking-mcp")

def get_conn():
    return db_pool.getconn()

def put_conn(conn):
    db_pool.putconn(conn)

#  TOOLS
@mcp.tool(name="get_user_accounts", description="Get all active bank accounts for the user")
def get_user_accounts(user_id: int) -> list:
    logger.info(f"Tool: get_user_accounts | user_id={user_id}")
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT iban, bank_name, balance
            FROM bank_accounts
            WHERE user_id = %s AND status = 'active'
            ORDER BY bank_name
        """, (user_id,))
        rows = cur.fetchall()
        cur.close()
        return [{"iban": r[0], "bank_name": r[1], "balance": float(r[2])} for r in rows]
    finally:
        put_conn(conn)


@mcp.tool(name="get_total_balance", description="Get the total combined balance across all active bank accounts for the user.")
def get_total_balance(user_id: int) -> dict:
    logger.info(f"Tool: get_total_balance | user_id={user_id}")
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT COALESCE(SUM(balance), 0)
            FROM bank_accounts
            WHERE user_id = %s AND status = 'active'
        """, (user_id,))
        total = cur.fetchone()[0]
        cur.close()
        return {"total_balance": float(total)}
    finally:
        put_conn(conn)


@mcp.tool(name="get_saving_goals", description="Get all saving goals for the user, including goal name, target amount, current amount, and priority.")
def get_saving_goals(user_id: int) -> list:
    logger.info(f"Tool: get_saving_goals | user_id={user_id}")
    conn = get_conn()
    try:
        cur = conn.cursor()
        cur.execute("""
            SELECT goal_name, target_amount, current_amount, priority
            FROM saving_goals
            WHERE user_id = %s
            ORDER BY priority ASC
        """, (user_id,))
        rows = cur.fetchall()
        cur.close()
        return [
            {
                "goal_name": r[0],
                "target_amount": float(r[1]),
                "current_amount": float(r[2]),
                "priority": r[3]
            }
            for r in rows
        ]
    finally:
        put_conn(conn)


@mcp.tool(name="internal_transfer", description="Transfer money between two of the user's own bank accounts. Requires source IBAN, destination IBAN, and a positive amount.")
def internal_transfer(user_id: int, from_iban: str, to_iban: str, amount: float) -> dict:
    logger.info(f"Tool: internal_transfer | user_id={user_id} from={from_iban} to={to_iban} amount={amount}")

    if amount <= 0:
        return {"success": False, "error": "Amount must be positive."}
    if from_iban == to_iban:
        return {"success": False, "error": "Source and destination accounts must be different."}

    conn = get_conn()
    try:
        conn.autocommit = False
        cur = conn.cursor()

        # Lock both rows for update to prevent race conditions
        cur.execute("""
            SELECT iban, bank_name, balance FROM bank_accounts
            WHERE iban = %s AND user_id = %s AND status = 'active'
            FOR UPDATE
        """, (from_iban, user_id))
        from_row = cur.fetchone()

        cur.execute("""
            SELECT iban, bank_name, balance FROM bank_accounts
            WHERE iban = %s AND user_id = %s AND status = 'active'
            FOR UPDATE
        """, (to_iban, user_id))
        to_row = cur.fetchone()

        if not from_row:
            conn.rollback()
            return {"success": False, "error": f"Source account {from_iban} not found or not active."}
        if not to_row:
            conn.rollback()
            return {"success": False, "error": f"Destination account {to_iban} not found or not active."}
        if from_row[2] < amount:
            conn.rollback()
            return {"success": False, "error": f"Insufficient funds. Available balance: {float(from_row[2]):.2f}"}

        cur.execute("UPDATE bank_accounts SET balance = balance - %s WHERE iban = %s", (amount, from_iban))
        cur.execute("UPDATE bank_accounts SET balance = balance + %s WHERE iban = %s", (amount, to_iban))
        conn.commit()

        return {
            "success": True,
            "from_bank": from_row[1],
            "from_iban": from_iban,
            "from_new_balance": float(from_row[2]) - amount,
            "to_bank": to_row[1],
            "to_iban": to_iban,
            "to_new_balance": float(to_row[2]) + amount,
            "amount": amount
        }

    except Exception as e:
        conn.rollback()
        logger.exception("Transfer failed")
        return {"success": False, "error": str(e)}
    finally:
        cur.close()
        put_conn(conn)


if __name__ == "__main__":
    mcp.run()