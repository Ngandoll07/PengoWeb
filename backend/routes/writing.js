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



export default router;
