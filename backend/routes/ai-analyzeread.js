import express from "express";
import dotenv from "dotenv";
import axios from "axios";

dotenv.config();
const router = express.Router();
const GROQ_API_KEY = process.env.GROQ_API_KEY;

const systemMessage = `
Bạn là một trợ lý AI luyện thi TOEIC phần Đọc hiểu (Part 5, 6, 7). Nhiệm vụ của bạn là phân tích toàn bộ nội dung đề thi và **trả về một đánh giá tổng thể về độ khó**.

🎯 Cách đánh giá:
- Dễ: ≥80% từ vựng thuộc danh sách Oxford 3000 hoặc trình độ CEFR A1–A2
- Trung bình: 60%–79%
- Khó: <60%

❗❗ Trả về đúng định dạng JSON sau, **không kèm lời giải thích**:

{
  "difficulty": "Dễ" | "Trung bình" | "Khó"
}
`;





router.post("/analyze-difficulty", async (req, res) => {
  const { part, questions, blocks } = req.body;

  let prompt = `Dưới đây là đề TOEIC Part ${part}:\n\n`;

  if (part === 5 || part === 7) {
    questions.forEach((q, i) => {
      prompt += `Câu ${i + 1}:\n${q.question}\nA. ${q.options.A}\nB. ${q.options.B}\nC. ${q.options.C}\nD. ${q.options.D}\n\n`;
    });
  } else if (part === 6 || part === 7) {
    blocks.forEach((block, idx) => {
      prompt += `Đoạn ${idx + 1}:\n${block.passage}\n`;
      block.questions.forEach((q, i) => {
        prompt += `Câu ${i + 1}: ${q.question}\nA. ${q.options.A}\nB. ${q.options.B}\nC. ${q.options.C}\nD. ${q.options.D}\n`;
      });
      prompt += '\n';
    });
  }

  try {
     console.log("📝 Nội dung gửi AI:", prompt); // ✅ Thêm dòng này để debug
    const response = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama3-8b-8192",
        messages: [
          { role: "system", content: systemMessage  },
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

  let aiText = response.data.choices[0].message.content.trim();

// 👉 Lọc phần JSON từ chuỗi trả về (nếu có chữ như "Here is ..." thì loại bỏ)
if (!aiText.startsWith("{")) {
  const firstBrace = aiText.indexOf("{");
  const lastBrace = aiText.lastIndexOf("}");
  aiText = aiText.slice(firstBrace, lastBrace + 1);
}

console.log("📦 Phản hồi từ AI (đã xử lý):", aiText);

const result = JSON.parse(aiText); // Lúc này mới parse an toàn

    return res.json(result);
  } catch (err) {
    console.error("❌ Lỗi đánh giá độ khó:", err.response?.data || err.message);
    return res.status(500).json({ message: "Lỗi AI", raw: err.response?.data || err.message });
  }
});

export default router;
