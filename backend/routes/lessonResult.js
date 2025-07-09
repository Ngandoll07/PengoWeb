import express from "express";
import jwt from "jsonwebtoken";
import LessonResult from "../models/UserLessonResult.js";

const router = express.Router();
const JWT_SECRET = "123";

router.post("/submit-day-result", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Thiếu token" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;
    const { day, skill, part, level, answers } = req.body;

    if (!day || !answers || !Array.isArray(answers) || answers.length === 0) {
      return res.status(400).json({ error: "Thiếu dữ liệu đầu vào" });
    }

    const correctCount = answers.filter((a) => a.isCorrect).length;
    const totalTime = answers.reduce((t, a) => t + (a.timeTaken || 0), 0);
    const averageTime = answers.length ? totalTime / answers.length : 0;

    const result = new LessonResult({
      userId,
      day,
      skill,
      part,
      level,
      totalQuestions: answers.length,
      correct: correctCount,
      averageTime: isNaN(averageTime) ? 0 : averageTime,
      mistakes: answers
        .filter((a) => !a.isCorrect)
        .map((a) => a.mistakeType || "unknown"),
      answers,
    });

    await result.save();
    res.json({ message: "Đã lưu kết quả", correct: correctCount });
  } catch (err) {
    console.error("❌ Lỗi lưu kết quả:", err);
    res.status(500).json({ error: "Lỗi server khi lưu kết quả" });
  }
});


export default router;
