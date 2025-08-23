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

// POST /api/lessons/submit
router.post("/lessons/submit", async (req, res) => {
  try {
    const { roadmapItemId, answers, summary } = req.body;
    if (!roadmapItemId || !summary) {
      return res.status(400).json({ message: "Thiếu roadmapItemId hoặc summary" });
    }

    const item = await (await import("../models/RoadmapItem.js")).default.findById(roadmapItemId);
    if (!item) return res.status(404).json({ message: "RoadmapItem không tồn tại" });

    const UserLessonResult = (await import("../models/UserLessonResult.js")).default;
    const toLetter = (idx) => ["A", "B", "C", "D"][idx] || null;

    const doc = await UserLessonResult.create({
      userId: item.userId,
      roadmapItemId,
      day: item.day,
      skill: item.skill,
      part: item.part,
      score: Number(summary.accuracy || 0),
      answers: (summary.items || []).map(it => ({
        questionId: it.questionId || "",
        userAnswer: toLetter(it.userIdx),
        correctAnswer: toLetter(it.correctIdx),
        isCorrect: it.userIdx != null && it.userIdx === it.correctIdx,
        label: it.label || null,
      })),
    });

    return res.json({ saved: true, resultId: doc._id });
  } catch (err) {
    console.error("lessons/submit error:", err);
    return res.status(500).json({ message: "Lỗi lưu kết quả" });
  }
});


export default router;
