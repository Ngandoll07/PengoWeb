// routes/recommend.js
import express from "express";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";
import StudyPlan from "../models/StudyPlan.js";
import RoadmapItem from "../models/RoadmapItem.js";

const router = express.Router();
const JWT_SECRET = "123";

// POST: Gọi AI tạo lộ trình và lưu vào DB
router.post("/recommend", async (req, res) => {
  const { listeningScore, readingScore, targetScore, studyDuration } = req.body;
  const token = req.headers.authorization?.split(" ")[1];

  const prompt = `
Tôi là học viên đang luyện thi TOEIC.
Kết quả đầu vào:
- Listening: ${listeningScore}/50
- Reading: ${readingScore}/50
🎯 Mục tiêu: ${targetScore} điểm TOEIC.
⏰ Thời gian ôn: ${studyDuration}.
1. Phân tích điểm mạnh/yếu và đề xuất lộ trình học phù hợp từng ngày.
2. Chỉ đề xuất kế hoạch cho **ngày 1**, một kỹ năng duy nhất.
3. Trả về JSON như sau:
[
  {
    "day": 1,
    "title": "Luyện nghe Part 1",
    "skill": "listening",
    "status": "pending",
    "progress": 0
  }
]
Chỉ trả về phân tích và JSON.`;

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

    const first = content.indexOf("[");
    const last = content.lastIndexOf("]");
    const jsonText = content.substring(first, last + 1);
    const analysisText = content.substring(0, first).trim();

    let roadmapJson;
    try {
      roadmapJson = JSON.parse(jsonText);
    } catch (err) {
      console.error("❌ Lỗi khi parse JSON từ AI:", err);
      return res.status(500).json({ error: "Không đọc được JSON từ AI." });
    }

    if (!token) return res.status(401).json({ error: "Thiếu token!" });

    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    // Xoá roadmap cũ nếu có
    await RoadmapItem.deleteMany({ userId });

    // Lưu StudyPlan
    await new StudyPlan({
      userId,
      listeningScore,
      readingScore,
      suggestion: JSON.stringify(roadmapJson),
      analysis: analysisText,
    }).save();

    // Tạo mới RoadmapItem
    const itemsToInsert = roadmapJson.map((item) => ({
      ...item,
      userId,
      progress: item.progress || 0,
      status: item.status || "pending",
    }));

    const savedItems = await RoadmapItem.insertMany(itemsToInsert);

    res.json({
      suggestion: savedItems, // có _id đầy đủ
      analysis: analysisText,
    });
  } catch (err) {
    console.error("❌ Lỗi khi tạo lộ trình:", err);
    res.status(500).json({ error: "Không thể tạo lộ trình học." });
  }
});

// GET: Lấy lộ trình từ DB
router.get("/recommend", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Thiếu token!" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    const items = await RoadmapItem.find({ userId }).sort({ day: 1 });
    const plan = await StudyPlan.findOne({ userId }).sort({ createdAt: -1 });

    if (!items.length && !plan) return res.status(404).json({ message: "Chưa có lộ trình!" });

    res.json({
      suggestion: items,
      analysis: plan?.analysis || "",
    });
  } catch (err) {
    console.error("❌ Lỗi khi lấy lộ trình:", err);
    res.status(500).json({ error: "Lỗi server khi lấy lộ trình." });
  }
});

export default router;
