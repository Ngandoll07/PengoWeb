// routes/testResult.js
import express from "express";
import TestResult from "../models/TestResult.js"; // Đảm bảo đường dẫn chính xác

const router = express.Router();

// Nên import từ file config nếu dùng chung
const JWT_SECRET = "123";

// POST /api/test-results
router.post("/", async (req, res) => {
  try {
    const {
      userId,
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

    const newResult = new TestResult({
      userId,
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

    await newResult.save();
    res.status(201).json({ message: "Kết quả thi đã được lưu", result: newResult });
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lưu kết quả thi", error: error.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const results = await TestResult.find()
      .populate("userId", "email") // chỉ lấy name và email nếu cần
      .sort({ createdAt: -1 });

    res.json(results);
  } catch (error) {
    res.status(500).json({ message: "Lỗi khi lấy kết quả", error });
  }
});
// DELETE /api/test-results/:id
router.delete('/:id', async (req, res) => {
  try {
    const deleted = await TestResult.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).json({ message: 'Không tìm thấy kết quả' });
    res.json({ message: 'Đã xoá thành công' });
  } catch (err) {
    res.status(500).json({ message: 'Lỗi server' });
  }
});

export default router;
