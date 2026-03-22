const express = require("express");
const router = express.Router();
const pool = require("../../db");

router.post("/", async (req, res) => {
  const { email, password } = req.body;
  try {
    const result = await pool.query("SELECT * FROM users WHERE email = $1", [email]);

    if (result.rows.length === 0 || result.rows[0].password !== password) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const user = result.rows[0];
    res.json({
      message: "Login successful",
      userId: user.id,
      name: user.name,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Login failed" });
  }
});

module.exports = router;
