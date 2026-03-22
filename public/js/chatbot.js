const chatbotBtn = document.querySelector('.finai-chatbot-btn');
const chatWindow = document.querySelector('.finai-chat-window');
const closeBtn = document.querySelector('.finai-chatbot-close-btn');
const sendBtn = document.querySelector('.finai-chatbot-send-btn');
const inputEl = document.querySelector('.finai-chatbot-input');
const chatContent = document.querySelector('.finai-chat-content');

// Toggle chatbot open/close when clicking the chatbot button
chatbotBtn.addEventListener('click', () => {
  const isVisible = chatWindow.style.display === 'flex';
  chatWindow.style.display = isVisible ? 'none' : 'flex';
});

// Also allow explicit close with ✖ button
closeBtn.addEventListener('click', () => {
  chatWindow.style.display = 'none';
});

// Handle send button click
sendBtn.addEventListener('click', async () => {
  const userMessage = inputEl.value.trim();
  if (!userMessage) return;

  // Show user message
  chatContent.innerHTML += `<div class="finai-user-message">${userMessage}</div>`;
  inputEl.value = '';
  chatContent.scrollTop = chatContent.scrollHeight;

  // Send to backend
  try {
    const res = await fetch('/api/chatbot', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: userMessage, userId: localStorage.getItem('userId') })
    });

    const data = await res.json();

    // Show bot response
    chatContent.innerHTML += `<div class="finai-bot-message">${data.reply || 'No reply available.'}</div>`;
    chatContent.scrollTop = chatContent.scrollHeight;
  } catch (err) {
    console.error('Chatbot error:', err);
    chatContent.innerHTML += `<div class="finai-bot-message">Something went wrong. Try again.</div>`;
  }
});

inputEl.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    sendBtn.click();
  }
})