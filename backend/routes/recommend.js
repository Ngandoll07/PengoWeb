import express from "express";
import jwt from "jsonwebtoken";
import StudyPlan from "../models/StudyPlan.js";
import fetch from "node-fetch";

const router = express.Router();
const JWT_SECRET = "123";

// POST: Tạo lộ trình học mới từ AI Groq
router.post("/recommend", async (req, res) => {
  const { listeningScore, readingScore, targetScore, studyDuration } = req.body;
  const token = req.headers.authorization?.split(" ")[1];

  const prompt = `
Tôi là học viên đang luyện thi TOEIC.
Kết quả đầu vào:
- Listening: ${listeningScore}/50
- Reading: ${readingScore}/50

🎯 Mục tiêu của tôi là đạt khoảng ${targetScore} điểm TOEIC.
⏰ Tôi có khoảng ${studyDuration} để luyện thi.

Hãy:
1. Phân tích điểm mạnh, điểm yếu của tôi, Đề xuất một lộ trình học phù hợp với mục tiêu và thời gian học và Chia rõ theo từng ngày và từng kỹ năng nếu có thể.
2. Chỉ đề xuất kế hoạch cho **ngày 1**, một kỹ năng duy nhất (nghe, đọc, từ vựng hoặc ngữ pháp).
3. Trả về JSON theo định dạng:

[
  {
    "day": 1,
    "title": "Luyện đọc Part 1",
    "skill": "listening",
    "status": "pending",
    "progress": 0
  }
]

Chỉ trả về phần phân tích và JSON, không thêm mô tả ngoài.
`;

  let roadmapJson = [];
  let planText = "";

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";

    // Phân tách phần JSON và phân tích
    const first = content.indexOf("[");
    const last = content.lastIndexOf("]");
    const jsonText = content.substring(first, last + 1);
    planText = content.substring(0, first).trim();

    try {
      roadmapJson = JSON.parse(jsonText);
    } catch (err) {
      console.error("❌ Lỗi khi parse JSON:", err);
      return res.status(500).json({ error: "Lỗi parse JSON từ Groq." });
    }

    // Lưu vào DB nếu có token
    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const plan = new StudyPlan({
          userId: decoded.userId,
          listeningScore,
          readingScore,
          suggestion: JSON.stringify(roadmapJson),
          analysis: planText,
        });
        await plan.save();
      } catch (err) {
        console.warn("⚠️ Token không hợp lệ hoặc hết hạn:", err.message);
      }
    }

    // Gửi về client
    res.json({
      suggestion: roadmapJson,
      analysis: planText,
    });
  } catch (err) {
    console.error("❌ Lỗi khi gọi Groq:", err);
    res.status(500).json({ error: "Không thể tạo lộ trình học từ Groq." });
  }
});

// GET: Lấy lộ trình học mới nhất từ DB
router.get("/recommend", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Thiếu token!" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const plans = await StudyPlan.find({ userId: decoded.userId })
      .sort({ createdAt: -1 })
      .limit(1);

    if (!plans.length) {
      return res.status(404).json({ message: "Chưa có lộ trình!" });
    }

    const plan = plans[0];
    res.json({
      suggestion: JSON.parse(plan.suggestion),
      analysis: plan.analysis || "",
    });
  } catch (err) {
    console.error("❌ Lỗi khi lấy lộ trình:", err);
    res.status(500).json({ message: "Lỗi server khi lấy lộ trình." });
  }
});

export default router;