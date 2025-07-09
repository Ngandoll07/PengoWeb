// routes/practiceHistory.js
import express from 'express';
import PracticeHistory from '../models/PracticeHistory.js';
const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { userId, part, testId, score, correct, total, startedAt } = req.body;

    const history = await PracticeHistory.create({
      userId,
      part,
      testId,
      score,
      correct,
      total,
      startedAt: new Date(startedAt),
      submittedAt: new Date()
    });

    res.json({ message: "Lưu lịch sử thành công", history });
  } catch (err) {
    console.error("❌ Lỗi lưu lịch sử:", err);
    res.status(500).json({ error: "Lỗi lưu lịch sử" });
  }
});

export default router;
