const express = require("express");
const router = express.Router();
const db = require("../../db");

router.post("/", async (req, res) => {
  const { goals, userId } = req.body;

  const client = await db.connect();
  try {
    await client.query("BEGIN");
    for (const goal of goals) {
      await client.query(
        `UPDATE saving_goals SET current_amount = $1 WHERE id = $2 AND user_id = $3`,
        [goal.current_amount, goal.id, userId]
      );
    }
    await client.query("COMMIT");
    res.sendStatus(200);
  } catch (err) {
    await client.query("ROLLBACK");
    console.error("Bulk update error:", err);
    res.status(500).json({ error: "Failed to update goals" });
  } finally {
    client.release();
  }
});

module.exports = router;