// routes/lessonRoutes.js
import express from "express";
import Lesson from "../models/Lesson.js";

const router = express.Router();

router.get("/lessons", async (req, res) => {
  try {
    const lessons = await Lesson.find().sort({ createdAt: -1 });
    res.json(lessons);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server khi lấy danh sách bài học" });
  }
});

// ✅ API: lấy bài học theo day và skill
router.get("/lessons-by-day", async (req, res) => {
  const { day, skill } = req.query;

  try {
    const query = {};
    if (day) query.day = Number(day);
    if (skill) query.skill = skill;

    const lessons = await Lesson.find(query).sort({ part: 1 });
    res.json(lessons);
  } catch (err) {
    res.status(500).json({ message: "Lỗi khi lấy bài học", error: err });
  }
});

router.get("/lessons/:id", async (req, res) => {
  try {
    const lesson = await Lesson.findById(req.params.id);
    if (!lesson) return res.status(404).json({ message: "Không tìm thấy bài học." });
    res.json(lesson);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server khi lấy bài học" });
  }
});

export default router;
