import express from 'express';
import fetch from 'node-fetch';
import { Groq } from 'groq-sdk';
import dotenv from 'dotenv';

dotenv.config();
const router = express.Router();
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// 🟩 Chấm Part 1 (có hình ảnh)
async function scorePart1WithOpenRouter(imageUrl, keywords, userSentence) {
  const prompt = `
Bạn là giáo viên tiếng Anh. Dưới đây là một câu học viên viết dựa vào ảnh và từ khóa.

Ảnh (URL): ${imageUrl}
Từ khóa: ${keywords.join(', ')}
Câu học viên: "${userSentence}"

Hãy nhận xét câu này đúng/sai và giải thích ngắn gọn bằng tiếng Việt.
  `.trim();

  const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
    },
    body: JSON.stringify({
      model: "mistralai/mistral-7b-instruct",
      messages: [
        { role: "system", content: "Bạn là một giáo viên TOEIC." },
        { role: "user", content: prompt }
      ],
    }),
  });

  const data = await response.json();

  if (!data.choices || !data.choices[0]?.message?.content) {
    console.error("❌ OpenRouter không trả về hợp lệ:", data);
    return "Không có phản hồi từ OpenRouter.";
  }

  return data.choices[0].message.content;
}

// 🟨 Chấm Part 2
function buildPromptPart2(item) {
  return `
Bạn là giám khảo TOEIC Writing Part 2.

📩 Email đề bài:
${item.prompt}

✍️ Câu trả lời của học sinh:
${item.text}

🎯 Yêu cầu:
1. Đánh giá bài viết bằng tiếng Việt về: cấu trúc email, mức độ phù hợp, từ vựng và ngữ pháp.
2. Sau đó, **đưa ra 2-3 gợi ý cải thiện câu trả lời này** (gợi ý cụ thể, dễ hiểu cho người học).
`.trim();
}

// 🟨 Chấm Part 3
function buildPromptPart3(part3) {
  return `
Bạn là giám khảo TOEIC Writing Part 3.

📖 Đề bài:
${part3.question}

✍️ Bài viết học sinh:
${part3.text}

🎯 Yêu cầu:
1. Đánh giá bài viết bằng tiếng Việt theo các tiêu chí: tổ chức ý, phát triển nội dung, chính xác ngữ pháp.
2. Cho điểm từ 0 đến 15.
3. **Đưa ra gợi ý cải thiện bài viết (ít nhất 2 điểm)** để học sinh viết tốt hơn lần sau.
`.trim();
}

async function scoreWithGroq(prompt) {
  const response = await groq.chat.completions.create({
    model: 'llama3-70b-8192',
    messages: [
      { role: 'system', content: 'Bạn là giám khảo TOEIC Writing chuyên nghiệp.' },
      { role: 'user', content: prompt }
    ],
    temperature: 0.5
  });

  return response.choices[0].message.content.trim();
}

// ✅ API CHÍNH
router.post('/fullscore', async (req, res) => {
  try {
    const { part1 = [], part2 = [], part3 = {} } = req.body;

    // Chấm Part 1
    const part1Feedback = await Promise.all(
      part1.map(async (q) => {
        try {
          return await scorePart1WithOpenRouter(q.imageUrl, q.keywords, q.userSentence);
        } catch (err) {
          console.error("❌ Lỗi Part 1:", err.message);
          return "Không thể chấm câu này.";
        }
      })
    );

    // Chấm Part 2 (Groq, từng câu)
    const part2Feedback = await Promise.all(
      part2.map((item) => scoreWithGroq(buildPromptPart2(item)))
    );

    // Chấm Part 3 (Groq, toàn bài)
    const part3Feedback = part3.text ? await scoreWithGroq(buildPromptPart3(part3)) : '';

    res.json({
      part1Feedback,
      part2Feedback,
      part3Feedback
    });
  } catch (err) {
    console.error("❌ Lỗi khi chấm điểm:", err);
    res.status(500).json({ error: 'Lỗi khi chấm điểm.' });
  }
});

export default router;
