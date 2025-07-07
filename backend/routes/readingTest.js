// routes/readingTest.js
import express from 'express';
import ReadingTest from '../models/ReadingTest.js';
import PracticeHistory from '../models/PracticeHistory.js'; // ✅ đúng model lưu lịch sử

const router = express.Router();

router.get("/unseen", async (req, res) => {
  const { userId, part } = req.query;
  try {
    const allTests = await ReadingTest.find({ part: Number(part) });

    // ✅ Tìm lịch sử làm bài
    const history = await PracticeHistory.findOne({ userId });
    const doneTestIds = history?.testIds?.[part] || [];

    // ✅ Lọc ra đề chưa làm
    const unseen = allTests.filter(test => !doneTestIds.includes(test._id.toString()));

    // ✅ Trả về 1 đề random chưa làm
    const selected = unseen[Math.floor(Math.random() * unseen.length)] || null;

    res.json(selected);
  } catch (error) {
    console.error("❌ Error fetching unseen test:", error);
    res.status(500).json({ error: "Internal Server Error" });
  }
});

export default router;
