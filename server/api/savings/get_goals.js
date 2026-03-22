const express = require("express");
const router = express.Router();
const db = require("../../db");

router.post("/", async (req, res) => {
  const { userId } = req.body;
  try {
    const result = await db.query(
      `SELECT id, goal_name, target_amount, current_amount, priority
       FROM saving_goals WHERE user_id = $1`,
      [userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error("Goals fetch error:", err);
    res.status(500).json({ error: "Failed to fetch goals" });
  }
});

module.exports = router;