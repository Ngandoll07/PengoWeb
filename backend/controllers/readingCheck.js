import { groq } from '../utils/groqClient.js';

export const scoreReadingPart = async (req, res) => {
  try {
    const { part, questions, answers } = req.body;

    if (![5, 6, 7].includes(part)) {
      return res.status(400).json({ error: 'Phần đọc không hợp lệ (phải là 5, 6 hoặc 7)' });
    }

    const systemMessage = `
BBạn là trợ lý luyện thi TOEIC phần Đọc hiểu.
Nhiệm vụ của bạn là:
- Xác định đáp án đúng cho từng câu hỏi (A, B, C hoặc D).
- So sánh với đáp án người dùng đã chọn.
- Cho biết đáp án đúng, sai, và giải thích bằng tiếng Việt **vì sao đáp án đó là chính xác** (ngữ pháp, từ vựng, cấu trúc, ngữ cảnh v.v).

Chỉ trả về kết quả ở định dạng JSON sau, không thêm bất kỳ giải thích, giới thiệu, hoặc văn bản nào khác:
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
      "comment": "Giải thích bằng tiếng Việt tại sao đừng có ký tự đặc biệt"
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

    const result = await groq.chat.completions.create({
      model: 'llama3-8b-8192',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: prompt }
      ],
      temperature: 0.4
    });

   const aiTextRaw = result.choices[0].message.content;
console.log("🧠 AI trả về:", aiTextRaw);

// Tìm đoạn JSON hợp lệ
const jsonMatch = aiTextRaw.match(/\{[\s\S]*\}/); // lấy đoạn {...} đầu tiên
if (!jsonMatch) {
  return res.status(500).json({ error: 'Không tìm thấy JSON trong phản hồi AI', raw: aiTextRaw });
}

let cleanedJson = jsonMatch[0]
  .replace(/“|”/g, '"')                      // thay ngoặc kép tiếng Việt
  .replace(/\\n/g, ' ')                      // bỏ ký tự xuống dòng
  .replace(/\\'/g, "'")                      // bỏ escape dấu nháy đơn
  .replace(/(?<!\\)"/g, '\\"')               // escape các dấu " chưa escape
  .replace(/\\"(\s*[:,}\]])/g, '"$1');        // khôi phục dấu " cuối value

try {
  const aiResult = JSON.parse(cleanedJson);

  if (!Array.isArray(aiResult.feedback)) {
    aiResult.feedback = [];
  }

  return res.json(aiResult);
} catch (err) {
  console.error("❌ JSON Parse Error:", err.message);
  return res.status(500).json({ error: 'Phân tích JSON thất bại', raw: cleanedJson });
}
};
