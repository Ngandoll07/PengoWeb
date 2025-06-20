import express from "express";
import ReadingTest from "../models/ReadingTest.js";

const router = express.Router();

// GET /api/reading-tests/part/:partNumber
router.get("/reading-tests/part/:partNumber", async (req, res) => {
  const part = parseInt(req.params.partNumber);
  try {
    const test = await ReadingTest.findOne({ part }).sort({ createdAt: -1 });

    if (!test) {
      return res.status(404).json({ message: "Không có đề nào." });
    }

    if ((part === 6 || part === 7) && test.blocks?.length) {
      return res.json(test.blocks); // trả về blocks cho Part 6, 7
    }

    if (test.questions?.length) {
      return res.json(test.questions); // trả về questions cho Part 5, 7
    }

    return res.status(404).json({ message: "Không có câu hỏi hoặc đoạn văn." });

  } catch (err) {
    console.error("Lỗi đọc part:", err);
    res.status(500).json({ message: "Lỗi server!" });
  }
});

export default router;
