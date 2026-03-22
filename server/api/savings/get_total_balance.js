const express = require("express");
const router = express.Router();
const db = require("../../db"); // your database client

router.post("/", async (req, res) => {
  const { userId } = req.body;
  try {
    const result = await db.query(
      `SELECT SUM(balance) AS totalBalance FROM bank_accounts WHERE user_id = $1 AND status = 'active'`,
      [userId]
    );
    res.json({ totalBalance: parseFloat(result.rows[0].totalbalance) || 0 });
  } catch (err) {
    console.error("Balance fetch error:", err);
    res.status(500).json({ error: "Failed to fetch balance" });
  }
});

module.exports = router;
