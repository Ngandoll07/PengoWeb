import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();
const router = express.Router();

const GROQ_API_KEY = process.env.GROQ_API_KEY;

const systemMessage = `
You are an assistant for grading TOEIC Reading comprehension questions.

🎯 Your task:
- Compare the learner's selected answer with the correct answer (provided below).
- Mark whether each answer is correct.
- If incorrect or skipped, explain in **Vietnamese**:
  • Why the learner's answer is incorrect.
  • Why the correct answer is correct.
  • Optionally mention why other choices are wrong.
  • Assign a detailed error label based on the TOEIC reading criteria.

🏷️ Use one of the following labels:
- "vocabulary": từ vựng
- "grammar": ngữ pháp
- "main_idea": không hiểu ý chính
- "detail": không nắm chi tiết
- "inference": suy luận sai
- "scanning": tìm thông tin sai
- "context": hiểu sai ngữ cảnh thực tế
- "not_answered": học viên không chọn
- "other": không rõ nguyên nhân

📌 Formatting rules:
- Response must be a valid JSON object — no extra explanations.
- Each 'comment' must be one line in Vietnamese (no line breaks).
- Do NOT use double quotes inside comment — use single quotes or none.
- If skipped, set "userAnswer": "Không chọn", label: "not_answered", comment: "Không chọn đáp án"
- If explanation is unclear, set label: "other", comment: "Chưa có giải thích"

🛑 Output format:

{
  "correct": <number>,
  "total": <number>,
  "skipped": <number>,
  "feedback": [
    {
      "index": <number>,
      "userAnswer": "B",
      "correctAnswer": "A",
      "correct": false,
      "label": "grammar",
      "comment": "Giải thích vì sao ngắn gọn bằng tiếng Việt, một dòng duy nhất"
    }
  ]
}
`;

const buildPrompt = (chunk, offset, part, answers) => `
Below are TOEIC Reading Part ${part} questions. For each, compare learner's answer with the correct one, then evaluate and label the type of error based on reading skill criteria.

${chunk.map((q, i) => `
Question ${offset + i + 1}:
${q.question}
A. ${q.options[0]}
B. ${q.options[1]}
C. ${q.options[2]}
D. ${q.options[3]}
Learner's answer: ${answers[offset + i] || 'Không chọn'}
Correct answer: ${q.answer}
`).join('\n')}
`;

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

// Retry logic when hitting rate limits or temporary failures
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const callGroqWithRetry = async (prompt, retries = 2, delayMs = 3000) => {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await callGroq(prompt);
    } catch (err) {
      const status = err.response?.status;
      const code = err.code;
      const message = err.response?.data || err.message;

      if (status === 429 || code === 'ECONNABORTED' || code === 'ETIMEDOUT') {
        console.warn(`⚠️ Attempt ${attempt + 1} failed: ${status || code}. Retrying after ${delayMs}ms...`);
        if (attempt < retries) {
          await delay(delayMs);
        } else {
          throw err;
        }
      } else {
        throw err;
      }
    }
  }
};

router.post('/score-reading-part', async (req, res) => {
  const { part, questions, answers } = req.body;

  if (![5, 6, 7].includes(part)) {
    return res.status(400).json({ error: 'Invalid reading part. Must be 5, 6, or 7.' });
  }

  try {
      if (part === 5) {
        const batchSize = 5; // hoặc 10 tùy dung lượng
        const allFeedback = [];
        let correct = 0, skipped = 0;

        for (let i = 0; i < questions.length; i += batchSize) {
          const chunk = questions.slice(i, i + batchSize);
          const prompt = buildPrompt(chunk, i, part, answers);

          try {
            const aiText = await callGroqWithRetry(prompt);
            console.log(`🧠 AI Response (Part 5, Batch ${i / batchSize + 1}):`, aiText);

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
          } catch (parseErr) {
            console.error(`❌ JSON parse error in batch ${i / batchSize + 1}:`, parseErr.message);
            allFeedback.push(
              ...chunk.map((q, j) => ({
                index: i + j + 1,
                userAnswer: answers[i + j] || 'Không chọn',
                correctAnswer: q.answer,
                correct: false,
                comment: 'Lỗi định dạng phản hồi từ AI hoặc vượt giới hạn request.'
              }))
            );
          }
        }

        return res.json({
          correct,
          total: questions.length,
          skipped,
          feedback: allFeedback
        });
      }else {
      const batchSize = 5;
      const allFeedback = [];
      let correct = 0, skipped = 0;

      for (let i = 0; i < questions.length; i += batchSize) {
        const chunk = questions.slice(i, i + batchSize);
        const prompt = buildPrompt(chunk, i, part, answers);

        try {
          const aiText = await callGroqWithRetry(prompt);
          console.log(`🧠 AI Response (Part ${part}, Batch ${i / batchSize + 1}):`, aiText);

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

        } catch (parseErr) {
          console.error(`❌ JSON parse error in batch ${i / batchSize + 1}:`, parseErr.message);
          allFeedback.push(
            ...chunk.map((q, j) => ({
              index: i + j + 1,
              userAnswer: answers[i + j] || 'Không chọn',
              correctAnswer: q.answer,
              correct: false,
              comment: 'Lỗi định dạng phản hồi từ AI hoặc vượt giới hạn request.'
            }))
          );
        }
      }

      return res.json({
        correct,
        total: questions.length,
        skipped,
        feedback: allFeedback
      });
    }
  } catch (err) {
    console.error("❌ AI scoring failed:", err.response?.data || err.message);
    return res.status(500).json({
      error: 'AI returned invalid data or network error.',
      raw: err.response?.data || err.message
    });
  }
});

export default router;
