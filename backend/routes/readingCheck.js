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

Hãy trả kết quả dưới dạng JSON sau:
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
      "comment": "Giải thích bằng tiếng Việt tại sao đáp án A đúng, và vì sao B sai."
    }
  ]
}
`;

  const prompt = `
Dưới đây là các câu hỏi TOEIC Part ${part}:

${questions.map((q, i) => `
Câu ${i + 1}:
${q.question}
A. ${q.options[0]}
B. ${q.options[1]}
C. ${q.options[2]}
D. ${q.options[3]}
Người học chọn: ${answers[i] || 'Không chọn'}
`).join('\n')}
`;

  try {
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

    const aiText = response.data.choices[0].message.content;
    console.log("🧠 AI trả về:", aiText);

    // Tìm đoạn JSON trong response
    let jsonOnly = aiText.trim();
    if (!jsonOnly.startsWith('{')) {
      const first = jsonOnly.indexOf('{');
      const last = jsonOnly.lastIndexOf('}');
      jsonOnly = jsonOnly.slice(first, last + 1);
    }

    const aiResult = JSON.parse(jsonOnly);

    // Trả về kết quả an toàn
    return res.json({
      correct: aiResult.correct || 0,
      total: aiResult.total || questions.length,
      skipped: aiResult.skipped || 0,
      feedback: aiResult.feedback || []
    });

  } catch (err) {
    console.error("❌ Lỗi AI chấm điểm:", err.response?.data || err.message);
    return res.status(500).json({
      error: 'AI trả về không hợp lệ hoặc lỗi mạng',
      raw: err.response?.data || err.message
    });
  }
});

// Endpoint chấm toàn bài (nếu cần)
router.post('/', async (req, res) => {
  const { questions, answers } = req.body;

  if (!questions || !answers) {
    return res.status(400).json({ error: 'Thiếu dữ liệu.' });
  }

  const tokenEstimate = questions.length * 100 + answers.length * 10;
  if (tokenEstimate > 5000) {
    return res.status(400).json({
      error: 'Quá nhiều câu hỏi. Hãy gửi từng Part để tránh vượt giới hạn token.'
    });
  }

  const prompt = `
Tôi có bài đọc TOEIC gồm các câu hỏi trắc nghiệm A, B, C, D. Bạn hãy:
- Tự xác định đáp án đúng.
- So sánh với đáp án người dùng chọn.
- Giải thích bằng tiếng Việt vì sao đáp án đúng.

Trả về kết quả dạng JSON:
[
  {
    "index": 1,
    "userAnswer": "B",
    "correctAnswer": "A",
    "correct": false,
    "comment": "Giải thích tiếng Việt..."
  },
  ...
]

Dữ liệu như sau:
${questions.map((q, i) => `
Câu ${i + 1}: ${q.question}
A. ${q.options[0]} | B. ${q.options[1]} | C. ${q.options[2]} | D. ${q.options[3]}
Người dùng chọn: ${answers[i] || "Không chọn"}
`).join('\n')}
`;

  try {
    const response = await axios.post(
      'https://api.groq.com/openai/v1/chat/completions',
      {
        model: 'llama3-8b-8192',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.4
      },
      {
        headers: {
          Authorization: `Bearer ${GROQ_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const content = response.data.choices[0].message.content;

    const first = content.indexOf('[');
    const last = content.lastIndexOf(']');
    const json = content.slice(first, last + 1);

    res.json(JSON.parse(json));
  } catch (err) {
    console.error('❌ Lỗi AI chấm toàn bài:', err.response?.data || err.message);
    res.status(500).json({ error: 'Lỗi từ GROQ AI' });
  }
});

export default router;
