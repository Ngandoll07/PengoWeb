import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();
const router = express.Router();

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// Đường dẫn chấm theo Part
router.post('/score-reading-part', async (req, res) => {
  const { part, questions, answers } = req.body;

  if (![5, 6, 7].includes(part)) {
    return res.status(400).json({ error: 'Phần đọc không hợp lệ (phải là 5, 6 hoặc 7)' });
  }

  const systemMessage = `
Bạn là trợ lý luyện thi TOEIC phần Đọc hiểu.
Nhiệm vụ của bạn là:
- Xác định đáp án đúng cho từng câu hỏi (A, B, C hoặc D).
- So sánh với đáp án người dùng đã chọn.
- Cho biết đáp án đúng, sai, và giải thích bằng tiếng Việt **vì sao đáp án đó là chính xác** (ngữ pháp, từ vựng, cấu trúc, ngữ cảnh v.v).
- ❗ Không được dùng dấu ngoặc kép " trong phần comment. Nếu cần trích dẫn, dùng dấu nháy đơn ' thay thế.

❗ Chỉ trả về đúng định dạng JSON sau, không được thêm bất kỳ văn bản, chú thích hay tiêu đề nào khác:

{
  "correct": <số câu đúng>,
  "total": <tổng số câu>,
  "skipped": <số câu bỏ trống>,
  "feedback": [
    {
      "index": <số thứ tự câu hỏi>,
      "userAnswer": "B",
      "correctAnswer": "A",
      "correct": false,
      "comment": "Giải thích tại sao đáp án A đúng, và vì sao các đáp án kia sai bằng tiếng Việt"
    }
  ]
}`;

  const buildPrompt = (chunk, offset) => `
Dưới đây là các câu hỏi TOEIC Part ${part}:

${chunk.map((q, i) => `
Câu ${offset + i + 1}:
${q.question}
A. ${q.options[0]}
B. ${q.options[1]}
C. ${q.options[2]}
D. ${q.options[3]}
Người học chọn: ${answers[offset + i] || 'Không chọn'}
`).join('\n')}`;

  const callGroq = async (prompt) => {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama3-8b-8192',
        messages: [
          { role: 'system', content: systemMessage },
          { role: 'user', content: prompt }
        ],
        temperature: 0.4
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );
    return response.data.choices[0].message.content;
  };

  try {
    if (part === 5) {
      const fullPrompt = buildPrompt(questions, 0);
      const aiText = await callGroq(fullPrompt);
      console.log("🧠 AI trả về:", aiText);

      let jsonOnly = aiText.trim();
      if (!jsonOnly.startsWith('{')) {
        const first = jsonOnly.indexOf('{');
        const last = jsonOnly.lastIndexOf('}');
        jsonOnly = jsonOnly.slice(first, last + 1);
      }
      const aiResult = JSON.parse(jsonOnly);
      return res.json({
        correct: aiResult.correct || 0,
        total: aiResult.total || questions.length,
        skipped: aiResult.skipped || 0,
        feedback: aiResult.feedback || []
      });
    } else {
      const batchSize = 8;
      const allFeedback = [];
      let correct = 0, skipped = 0;

      for (let i = 0; i < questions.length; i += batchSize) {
        const chunk = questions.slice(i, i + batchSize);
        const prompt = buildPrompt(chunk, i);
        const aiText = await callGroq(prompt);
        console.log(`🧠 Batch ${i / batchSize + 1} trả về:`, aiText);

        let jsonOnly = aiText.trim();
        if (!jsonOnly.startsWith('{')) {
          const first = jsonOnly.indexOf('{');
          const last = jsonOnly.lastIndexOf('}');
          jsonOnly = jsonOnly.slice(first, last + 1);
        }
        const aiResult = JSON.parse(jsonOnly);
        correct += aiResult.correct || 0;
        skipped += aiResult.skipped || 0;
        allFeedback.push(...(aiResult.feedback || []));
      }

      return res.json({
        correct,
        total: questions.length,
        skipped,
        feedback: allFeedback
      });
    }
  } catch (err) {
    console.error("❌ Lỗi AI chấm điểm:", err.response?.data || err.message);
    return res.status(500).json({
      error: 'AI trả về không hợp lệ hoặc lỗi mạng',
      raw: err.response?.data || err.message
    });
  }
});

export default router;
