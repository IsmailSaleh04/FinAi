const express = require('express');
const router = express.Router();
const pool = require('../../db');

router.get('/', async (req, res) => {
  const userId = parseInt(req.query.userId);
  if (!userId) return res.status(400).json({ error: "Missing userId" });

  try {
    const result = await pool.query(
      `SELECT * FROM bank_accounts WHERE user_id = $1`, [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Error fetching accounts:", err);
    res.status(500).json({ error: "Failed to fetch accounts" });
  }
});

module.exports = router;
