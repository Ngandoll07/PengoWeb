// ✅ File: routes/recommend.js
import express from "express";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";
import StudyPlan from "../models/StudyPlan.js";
import RoadmapItem from "../models/RoadmapItem.js";

const router = express.Router();
const JWT_SECRET = "123";

// ✅ POST: Phân tích từ AI ➝ sinh roadmap ngày 1
router.post("/recommend", async (req, res) => {
  const { listeningScore, readingScore, targetScore, studyDuration } = req.body;
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Thiếu token!" });

const prompt = `
Tôi là một học viên đang luyện thi TOEIC.

🧪 Kết quả đầu vào của tôi:
- Listening: ${listeningScore}/50
- Reading: ${readingScore}/50

🎯 Mục tiêu của tôi là đạt khoảng ${targetScore} điểm TOEIC.
⏰ Tôi có khoảng ${studyDuration} để luyện thi.

🎓 Hãy giúp tôi:
1. Phân tích điểm mạnh, điểm yếu của tôi
2. **Đề xuất kế hoạch ôn luyện cho ngày 1** với 1 kỹ năng duy nhất (listening hoặc reading), tập trung vào phần (Part) phù hợp nhất với năng lực hiện tại.
3. Gợi ý **mức độ phù hợp** (level: easy / medium / hard) để bắt đầu ôn luyện ngày đầu sao cho hiệu quả nhất.

📋 Trả về JSON đúng định dạng sau:

{
  "analysis": "Phân tích điểm mạnh và điểm yếu**",
  "plan": [
    {
      "day": 1,
      "title": "Tên bài học gợi ý cho ngày 1",
      "skill": "listening hoặc reading",
      "part": Số, // part phù hợp như 1, 2, 5, v.v.
      "level": "easy hoặc medium hoặc hard",
      "status": "pending",
      "progress": 0
    }
  ]
}

⚠️ Chỉ trả về đúng định dạng JSON trên. Không viết bất kỳ lời giải thích nào bên ngoài JSON.
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

    // Xoá roadmap cũ nếu có
    await RoadmapItem.deleteMany({ userId });

    // Lưu StudyPlan
    await new StudyPlan({
      userId,
      listeningScore,
      readingScore,
      suggestion: plan,
      analysis
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

// ✅ GET: Lấy roadmap
// ✅ GET: Lấy roadmap kèm cập nhật tiến trình nếu có kết quả
router.get("/recommend", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Thiếu token!" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    // 🔍 Tìm roadmap của user
    const roadmapItems = await RoadmapItem.find({ userId }).sort({ day: 1 });

    // 🔍 Tìm kết quả làm bài
    const results = await import("../models/UserLessonResult.js").then(m => m.default.find({ userId }));

    // 🧠 Tạo map từ roadmapItemId -> score
    const scoreMap = {};
    results.forEach(result => {
      if (result.roadmapItemId) {
        scoreMap[result.roadmapItemId.toString()] = result.score;
      }
    });

    // ✅ Cập nhật trạng thái dựa vào score
    const updatedItems = await Promise.all(
      roadmapItems.map(async (item) => {
        const score = scoreMap[item._id.toString()];
        if (score !== undefined) {
          const newStatus = score >= 50 ? "done" : "pending";
          const newProgress = score;

          // Chỉ update nếu khác
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
