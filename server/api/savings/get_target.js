const express = require("express");
const router = express.Router();
const db = require("../../db");

router.post("/", async (req, res) => {
  const { userId } = req.body;
  try {
    const result = await db.query(
      `SELECT target_amount FROM saving_targets WHERE user_id = $1`,
      [userId]
    );
    res.json({ totalTarget: result.rows[0]?.target_amount || 0 });
  } catch (err) {
    console.error("Get target error:", err);
    res.status(500).json({ error: "Failed to get target" });
  }
});

module.exports = router;
