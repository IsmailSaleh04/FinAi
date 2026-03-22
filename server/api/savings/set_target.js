const express = require("express");
const router = express.Router();
const db = require("../../db");

router.post("/", async (req, res) => {
  const { userId, totalTarget } = req.body;
  try {
    await db.query(`
      INSERT INTO saving_targets (user_id, target_amount)
      VALUES ($1, $2)
      ON CONFLICT (user_id) DO UPDATE SET target_amount = EXCLUDED.target_amount
    `, [userId, totalTarget]);
    res.sendStatus(200);
  } catch (err) {
    console.error("Set target error:", err);
    res.status(500).json({ error: "Failed to set target" });
  }
});

module.exports = router;