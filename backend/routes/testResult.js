const express = require("express");
const jwt = require("jsonwebtoken");
const TestResult = require("../models/TestResult");
const router = express.Router();

const JWT_SECRET = "123"; // Nếu bạn muốn dùng chung, nên import từ file config

// Lưu kết quả làm bài
router.post("/save-result", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];

  if (!token) return res.status(401).json({ message: "Không có token!" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const {
      correct,
      incorrect,
      skipped,
      score,
      listeningCorrect,
      readingCorrect,
      listeningScore,
      readingScore,
      partsSubmitted,
      time
    } = req.body;

    const result = new TestResult({
      userId: decoded.userId,
      correct,
      incorrect,
      skipped,
      score,
      listeningCorrect,
      readingCorrect,
      listeningScore,
      readingScore,
      partsSubmitted,
      time
    });

    await result.save();
    res.json({ message: "Lưu kết quả thành công!" });
  } catch (err) {
    console.error("❌ Lỗi khi lưu kết quả:", err);
    res.status(500).json({ message: "Lỗi khi lưu kết quả!" });
  }
});

module.exports = router;
