// routes/writing.js
import express from "express";
import WritingTopic from "../models/WritingTask.js";

const router = express.Router();

// GET /api/writing-topics
router.get("/writing-topics", async (req, res) => {
  try {
    const topics = await WritingTopic.find(); // <-- lấy tất cả
    res.json(topics);
  } catch (err) {
    console.error("Lỗi khi lấy dữ liệu WritingTopic:", err);
    res.status(500).json({ error: "Lỗi server." });
  }
});

router.delete('/writing-topics/:id', async (req, res) => {
  try {
    await WritingTopic.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting topic' });
  }
});


export default router;
