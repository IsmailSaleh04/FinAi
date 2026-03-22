const express = require("express");
const router = express.Router();
const pool = require("../../db"); // PostgreSQL connection pool

router.post("/", async (req, res) => {
  const { name, email, phone, password, nationalId } = req.body;

  try {
    const result = await pool.query(
      "INSERT INTO users (name, email, phone_number, password, national_id) VALUES ($1, $2, $3, $4, $5) RETURNING id",
      [name, email, phone, password, nationalId]
    );
    res.json({ message: "Signup successful", userId: result.rows[0].id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Signup failed" });
  }
});

module.exports = router;
