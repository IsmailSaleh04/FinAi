const express = require('express');
const multer = require('multer');
const path = require('path');
const pool = require('../../db');
const router = express.Router();

// Configure multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'public/uploads');
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, 'user-' + req.body.userId + '-' + uniqueSuffix + ext);
  }
});

const upload = multer({ storage: storage });

// Upload and save path to DB
router.post('/', upload.single('profileImage'), async (req, res) => {
  const userId = req.body.userId;
  const imagePath = `/uploads/${req.file.filename}`;

  try {
    await pool.query(
      'UPDATE users SET profile_image = $1 WHERE id = $2',
      [imagePath, userId]
    );
    res.json({ message: 'Profile image uploaded successfully', imagePath });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to upload image' });
  }
});

module.exports = router;
