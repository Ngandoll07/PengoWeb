import express from "express";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();
const router = express.Router();
const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Hệ thống message rút gọn, rõ ràng, chỉ yêu cầu trả về mảng per-question
const systemMessageBatch = `
Bạn là trợ lý AI TOEIC phần Đọc hiểu (Part 5/6/7).
Nhiệm vụ: Phân tích từng câu và trả về độ khó của mỗi câu theo quy tắc:
- easy: ≥80% từ vựng thuộc Oxford 3000 hoặc trình độ CEFR A1–A2
- medium: 60%–79%
- hard: <60%

Chỉ trả về đúng JSON duy nhất dạng mảng, không lời giải thích. Mỗi phần tử:
{
  "questionIndex": "<ví dụ: '1' hoặc '2.3'>",
  "level": "easy" | "medium" | "hard"
}
`;

router.post("/analyze-difficulty", async (req, res) => {
  const { part, questions = [], blocks = [] } = req.body;

  // Chuẩn bị danh sách câu để gửi AI
  const listCau = [];
  if (part === 5 || part === 7) {
    questions.forEach((q, i) => {
      listCau.push({
        index: `${i + 1}`,
        question: q.question,
        options: q.options,
      });
    });
  }
  if (part === 6 || part === 7) {
    blocks.forEach((block, bi) => {
      block.questions.forEach((q, qi) => {
        listCau.push({
          index: `${bi + 1}.${qi + 1}`,
          passage: block.passage,
          question: q.question,
          options: q.options,
        });
      });
    });
  }

  if (listCau.length === 0) {
    return res.status(400).json({ message: "Không có câu để phân tích" });
  }

  // Xây prompt chi tiết
  let prompt = "Dưới đây là các câu cần đánh giá độ khó:\n\n";
  listCau.forEach(item => {
    prompt += `Câu ${item.index}:\n`;
    if (item.passage) prompt += `Đoạn: ${item.passage}\n`;
    prompt += `${item.question}\nA. ${item.options.A}\nB. ${item.options.B}\nC. ${item.options.C}\nD. ${item.options.D}\n\n`;
  });

  try {
    console.log("📝 Prompt gửi AI (per-question):", prompt);
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama3-8b-8192",
        messages: [
          { role: "system", content: systemMessageBatch },
          { role: "user", content: prompt },
        ],
        temperature: 0.4,
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("📬 Raw response.data từ AI:", response.data);

    let aiText = response.data.choices?.[0]?.message?.content?.trim() || "";

    if (!aiText) {
      console.warn("⚠️ AI không trả nội dung, fallback toàn bộ câu medium");
      const fallback = listCau.map(c => ({ questionIndex: c.index, level: "medium" }));
      return res.json({ perQuestion: fallback });
    }

    if (!aiText.startsWith("[")) {
      const first = aiText.indexOf("[");
      const last = aiText.lastIndexOf("]");
      if (first !== -1 && last !== -1) {
        aiText = aiText.slice(first, last + 1);
      }
    }

    let resultArray;
    try {
      resultArray = JSON.parse(aiText);
    } catch (parseErr) {
      console.warn("⚠️ Không parse được JSON từ AI, fallback medium:", parseErr.message);
      resultArray = listCau.map(c => ({ questionIndex: c.index, level: "medium" }));
    }

    return res.json({ perQuestion: resultArray });
  } catch (err) {
    console.error("❌ Lỗi đánh giá độ khó:", err.response?.data || err.message);
    // fallback medium cho tất cả
    const fallback = [];
    if (part === 5 || part === 7) {
      questions.forEach((q, i) => fallback.push({ questionIndex: `${i + 1}`, level: "medium" }));
    }
    if (part === 6 || part === 7) {
      blocks.forEach((block, bi) => {
        block.questions.forEach((q, qi) => {
          fallback.push({ questionIndex: `${bi + 1}.${qi + 1}`, level: "medium" });
        });
      });
    }
    return res.status(500).json({ message: "Lỗi AI", perQuestion: fallback, raw: err.response?.data || err.message });
  }
});

export default router;