// GET /api/reading-tests/part/:partNumber
const express = require("express");
const router = express.Router();
const ReadingTest = require("../models/ReadingTest");

router.get("/reading-tests/part/:partNumber", async (req, res) => {
  const part = parseInt(req.params.partNumber);
  try {
    // Lấy đề mới nhất chứa part
    const tests = await ReadingTest.find({ "questions.part": part }).sort({ createdAt: -1 });
    if (!tests.length) return res.status(404).json({ message: "Không có đề nào." });

    const latestTest = tests[0];
    const partQuestions = latestTest.questions.filter(q => q.part === part);

    res.json(partQuestions);
  } catch (err) {
    console.error("Lỗi đọc part:", err);
    res.status(500).json({ message: "Lỗi server!" });
  }
});

module.exports = router;
