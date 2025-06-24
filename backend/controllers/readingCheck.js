import { groq } from '../utils/groqClient.js';

export const scoreReadingPart = async (req, res) => {
  try {
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
}
    `;

    const buildPrompt = () => `
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

    const prompt = buildPrompt();

    // Hàm gọi Groq có retry
    const sendToGroqWithRetry = async (payload, retries = 3) => {
      for (let attempt = 0; attempt < retries; attempt++) {
        try {
          return await groq.chat.completions.create(payload);
        } catch (err) {
          const code = err?.error?.code;
          if (code === 'rate_limit_exceeded') {
            const waitTime = 3000 + Math.random() * 2000;
            console.warn(`⚠️ Bị rate limit. Chờ ${waitTime}ms rồi thử lại...`);
            await new Promise(resolve => setTimeout(resolve, waitTime));
          } else {
            throw err;
          }
        }
      }
      throw new Error("❌ Gửi Groq thất bại sau nhiều lần thử.");
    };

    const groqResult = await sendToGroqWithRetry({
      model: 'llama3-8b-8192',
      messages: [
        { role: 'system', content: systemMessage },
        { role: 'user', content: prompt }
      ],
      temperature: 0.4
    });

    const aiTextRaw = groqResult.choices[0].message.content;
    console.log("🧠 AI trả về:", aiTextRaw);

    const jsonMatch = aiTextRaw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      return res.status(500).json({ error: 'Không tìm thấy JSON trong phản hồi AI', raw: aiTextRaw });
    }
const cleanedJson = jsonMatch[0]
  .replace(/“|”/g, '"')                    // ngoặc kép tiếng Việt → "
  .replace(/[‘’]/g, "'")                   // nháy đơn đặc biệt → '
  .replace(/\\n/g, ' ')                    // dòng mới → space
  .replace(/\t/g, ' ')                     // tab → space
  .replace(/\r/g, '')                      // xóa carriage return
  .replace(/–/g, '-')                      // dash đặc biệt → "-"
  .replace(/\.\.\./g, '...')              // ba chấm
  .replace(/•/g, '-')                      // bullet → dash
  .replace(/\\'/g, "'")                    // escaped single quote
  .replace(/\\,/g, ',')                    // escaped comma
 .replace(/"comment"\s*:\s*"([\s\S]*?)"/g, (_, val) => {
  const fixedVal = val
    .replace(/\\/g, '\\\\')   // escape backslash trước
    .replace(/"/g, '\\"');    // escape dấu ngoặc kép
  return `"comment": "${fixedVal}"`;
});


    let aiResult;
    try {
      aiResult = JSON.parse(cleanedJson);
      if (!Array.isArray(aiResult.feedback)) {
        aiResult.feedback = [];
      }
      return res.json(aiResult);
    } catch (err) {
      console.error("❌ JSON Parse Error:", err.message);
      return res.status(500).json({ error: 'Phân tích JSON thất bại', raw: cleanedJson });
    }
  } catch (err) {
    console.error("❌ Lỗi AI chấm điểm:", err);
    return res.status(500).json({ error: "AI scoring failed", detail: err.message });
  }
};
