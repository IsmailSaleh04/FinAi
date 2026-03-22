const express = require("express");
const router = express.Router();
const db = require("../../db");

// 1. Internal transfer (same user)
router.post("/internal", async (req, res) => {
  const { userId, fromIban, toIban, amount } = req.body;

  if (!userId || !fromIban || !toIban || !amount) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    await db.query("BEGIN");

    const fromRes = await db.query(
      "SELECT balance FROM bank_accounts WHERE iban = $1 AND user_id = $2",
      [fromIban, userId]
    );
    const toRes = await db.query(
      "SELECT balance FROM bank_accounts WHERE iban = $1 AND user_id = $2",
      [toIban, userId]
    );

    if (fromRes.rowCount === 0 || toRes.rowCount === 0) {
      await db.query("ROLLBACK");
      return res.status(404).json({ error: "Accounts not found" });
    }

    if (parseFloat(fromRes.rows[0].balance) < amount) {
      await db.query("ROLLBACK");
      return res.status(400).json({ error: "Insufficient funds" });
    }

    await db.query("UPDATE bank_accounts SET balance = balance - $1 WHERE iban = $2", [amount, fromIban]);
    await db.query("UPDATE bank_accounts SET balance = balance + $1 WHERE iban = $2", [amount, toIban]);

    await db.query("COMMIT");
    res.sendStatus(200);
  } catch (err) {
    await db.query("ROLLBACK");
    console.error("Internal transfer error:", err);
    res.status(500).json({ error: "Transfer failed" });
  }
});

// 2. External transfer (to other person)
router.post("/external", async (req, res) => {
  const { userId, fromIban, toIban, amount } = req.body;

  if (!userId || !fromIban || !toIban || !amount) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  try {
    await db.query("BEGIN");

    const fromRes = await db.query(
      "SELECT balance FROM bank_accounts WHERE iban = $1 AND user_id = $2",
      [fromIban, userId]
    );
    const toRes = await db.query(
      "SELECT balance FROM bank_accounts WHERE iban = $1",
      [toIban]
    );

    if (fromRes.rowCount === 0 || toRes.rowCount === 0) {
      await db.query("ROLLBACK");
      return res.status(404).json({ error: "Accounts not found" });
    }

    if (parseFloat(fromRes.rows[0].balance) < amount) {
      await db.query("ROLLBACK");
      return res.status(400).json({ error: "Insufficient funds" });
    }

    await db.query("UPDATE bank_accounts SET balance = balance - $1 WHERE iban = $2", [amount, fromIban]);
    await db.query("UPDATE bank_accounts SET balance = balance + $1 WHERE iban = $2", [amount, toIban]);

    await db.query("COMMIT");
    res.sendStatus(200);
  } catch (err) {
    await db.query("ROLLBACK");
    console.error("External transfer error:", err);
    res.status(500).json({ error: "Transfer failed" });
  }
});

module.exports = router;
