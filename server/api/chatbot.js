const express = require('express');
const router = express.Router();

router.post('/', async (req, res) => {
  const { message, userId } = req.body;
  console.log(message, userId);

  try {
      const response = await fetch("http://localhost:8000/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message,
          user_id: userId
        })
      });

      const data = await response.json();
      res.json({ reply: data.reply });

  } catch (err) {
    console.error('Ollama error:', err);
    res.status(500).json({ reply: 'Local AI failed.' });
  }
});

module.exports = router;