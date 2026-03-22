const express = require("express");
const router = express.Router();
const db = require("../../db");

router.post("/", async (req, res) => {
  const { goal, userId } = req.body;
  const { goal_name, target_amount, current_amount, priority } = goal;

  try {
    const result = await db.query(
      `INSERT INTO saving_goals (user_id, goal_name, target_amount, current_amount, priority)
       VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [userId, goal_name, target_amount, current_amount, priority]
    );
    res.json({ id: result.rows[0].id });
  } catch (err) {
    console.error("Add goal error:", err);
    res.status(500).json({ error: "Failed to add goal" });
  }
});

module.exports = router;