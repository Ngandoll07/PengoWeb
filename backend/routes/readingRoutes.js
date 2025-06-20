// GET /api/reading-tests/part/:partNumber
const express = require("express");
const router = express.Router();
const ReadingTest = require("../models/ReadingTest");

// GET /api/reading-tests/part/:partNumber
router.get("/reading-tests/part/:partNumber", async (req, res) => {
  const part = parseInt(req.params.partNumber);
  try {
    let test;

    if (part === 6 || part === 7) {
  test = await ReadingTest.findOne({ part }).sort({ createdAt: -1 });
  if (!test || !test.blocks?.length) {
    return res.status(404).json({ message: "Không có đề nào." });
  }
  return res.json(test.blocks); // ✅ return blocks instead
}
else {
      // 🔍 Tìm đề mới nhất có part 5 hoặc 7
      test = await ReadingTest.findOne({ part }).sort({ createdAt: -1 });
      if (!test || !test.questions?.length) {
        return res.status(404).json({ message: "Không có đề nào." });
      }
      return res.json(test.questions); // ✅ trả về mảng câu hỏi
    }
  } catch (err) {
    console.error("Lỗi đọc part:", err);
    res.status(500).json({ message: "Lỗi server!" });
  }
});

module.exports = router;
