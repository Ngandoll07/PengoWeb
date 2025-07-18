import express from "express";
import UserLessonResult from "../models/UserLessonResult.js";

const router = express.Router();

router.post("/lesson-result", async (req, res) => {
  try {
    const result = new UserLessonResult(req.body);
    await result.save();
    res.json({ message: "✅ Lưu kết quả thành công", result });
  } catch (err) {
    console.error("❌ Lỗi lưu kết quả:", err);
    res.status(500).json({ error: "Không thể lưu kết quả" });
  }
});

export default router;
