// ✅ File: routes/recommend.js
import express from "express";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";
import StudyPlan from "../models/StudyPlan.js";
import RoadmapItem from "../models/RoadmapItem.js";

const router = express.Router();
const JWT_SECRET = "123";

// POST: Phân tích từ AI ➝ sinh roadmap ngày 1 duy nhất
router.post("/recommend", async (req, res) => {
  const { listeningScore, readingScore, targetScore, studyDuration } = req.body;
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Thiếu token!" });

const prompt = `
Tôi là một học viên đang luyện thi TOEIC.

🧪 Kết quả đầu vào của tôi:
- Listening: ${listeningScore}/450
- Reading: ${readingScore}/450

🎯 Mục tiêu của tôi là đạt khoảng ${targetScore} điểm TOEIC.
⏰ Tôi có khoảng ${studyDuration} tuần để luyện thi.

🎓 Hãy giúp tôi:

1. Phân tích **chi tiết** điểm mạnh và điểm yếu.
2. Chỉ tạo **1 ngày đầu tiên** (day 1) với 1 kỹ năng duy nhất (listening hoặc reading), tập trung vào Part phù hợp nhất.
3. Gợi ý **level**: easy / medium / hard.

⚠️ Trả về **chỉ JSON**, đúng định dạng:

{
  "analysis": "Phân tích chi tiết điểm mạnh, điểm yếu, nêu ví dụ cụ thể",
  "plan": [
    {
      "day": 1,
      "title": "Tên bài học gợi ý cho ngày 1",
      "skill": "listening hoặc reading",
      "part": Số Part phù hợp (1-7),
      "level": "easy hoặc medium hoặc hard",
      "status": "pending",
      "progress": 0
    }
  ]
}

Chỉ trả về JSON, không thêm giải thích hay text nào khác.
`;

  try {
    const aiRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    const data = await aiRes.json();
    const content = data.choices?.[0]?.message?.content || "";

    const parsed = JSON.parse(content);
    const { analysis, plan } = parsed;

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    // Xóa roadmap cũ
    await RoadmapItem.deleteMany({ userId });

    // Lưu StudyPlan
    await new StudyPlan({
      userId,
      listeningScore,
      readingScore,
      suggestion: plan,
      analysis: JSON.stringify(analysis),  // 🔹 stringify trước khi lưu
    }).save();

    // Tạo RoadmapItem
    const roadmapItems = plan.map(item => ({ ...item, userId }));
    const saved = await RoadmapItem.insertMany(roadmapItems);

    res.json({ suggestion: saved, analysis });
  } catch (err) {
    console.error("❌ Lỗi khi tạo lộ trình:", err);
    res.status(500).json({ error: "Không thể tạo lộ trình." });
  }
});

// GET: Lấy roadmap + cập nhật tiến trình nếu có
router.get("/recommend", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Thiếu token!" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    const roadmapItems = await RoadmapItem.find({ userId }).sort({ day: 1 });
    const results = await import("../models/UserLessonResult.js").then(m => m.default.find({ userId }));

    const scoreMap = {};
    results.forEach(result => {
      if (result.roadmapItemId) scoreMap[result.roadmapItemId.toString()] = result.score;
    });

    const updatedItems = await Promise.all(
      roadmapItems.map(async item => {
        const score = scoreMap[item._id.toString()];
        if (score !== undefined) {
          const newStatus = score >= 50 ? "done" : "pending";
          const newProgress = score;
          if (item.status !== newStatus || item.progress !== newProgress) {
            item.status = newStatus;
            item.progress = newProgress;
            await item.save();
          }
        }
        return item;
      })
    );

    const plan = await StudyPlan.findOne({ userId }).sort({ createdAt: -1 });

    res.json({
      suggestion: updatedItems,
      analysis: plan?.analysis || "",
    });
  } catch (err) {
    console.error("❌ Lỗi khi lấy lộ trình:", err);
    res.status(500).json({ error: "Lỗi server khi lấy lộ trình." });
  }
});

export default router;
