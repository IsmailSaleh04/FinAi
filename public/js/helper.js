// Show/hide chatbot window
document.querySelector('.finai-chatbot-btn').addEventListener('click', () => {
  document.querySelector('.finai-chat-window').style.display = 'flex';
});

document.querySelector('.finai-chatbot-close-btn').addEventListener('click', () => {
  document.querySelector('.finai-chat-window').style.display = 'none';
});

document.querySelector('.finai-chatbot-send-btn').addEventListener('click', async () => {
  const input = document.querySelector('.finai-chatbot-input');
  const content = document.querySelector('.finai-chat-content');
  const userMessage = input.value.trim();

  if (!userMessage) return;

  // Show user message
  content.innerHTML += `<div class="finai-user-message">${userMessage}</div>`;
  input.value = '';
  content.scrollTop = content.scrollHeight;

  try {
    // Call backend endpoint with message
    const res = await fetch('/api/chatbot/message', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMessage })
    });

    const data = await res.json();

    // Show bot response
    content.innerHTML += `<div class="finai-bot-message">${data.reply || 'No reply available.'}</div>`;
    content.scrollTop = content.scrollHeight;

  } catch (err) {
    console.error('Chatbot error:', err);
    content.innerHTML += `<div class="finai-bot-message">Something went wrong. Try again.</div>`;
  }
});
