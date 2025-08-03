import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';

dotenv.config();
const router = express.Router();

const GROQ_API_KEY = process.env.GROQ_API_KEY;

// 🧠 Strict, English-language system prompt
const systemMessage = `
You are an assistant for grading TOEIC Reading comprehension questions.

🎯 Your task:
- Compare the learner's selected answer with the correct answer (already provided).
- Judge whether each answer is correct or incorrect.
- Provide a short explanation in **Vietnamese** explaining:
  • Why the correct answer is right (based on grammar, vocabulary, or reading context).
  • Why the other options are incorrect.
- ❗ You must NOT change the correct answer. Just evaluate based on the provided correct answer.

📌 JSON format requirements:
- Your response must be a **valid JSON object only** — no comments, no explanations outside of the JSON.
- Each \`comment\` must be **on a single line** (no line breaks).
- Do not use double quotes \`"\` inside the \`comment\`. Use single quotes \`'\` or none at all.
- If the learner did not choose an answer, use \`"Không chọn"\` as \`userAnswer\`.
- If you cannot provide an explanation, write \`"Chưa có giải thích"\` as the comment.

🛑 Output strictly in the following JSON format — nothing more, nothing less:

{
  "correct": <number of correct answers>,
  "total": <total number of questions>,
  "skipped": <number of skipped answers>,
  "feedback": [
    {
      "index": <question number>,
      "userAnswer": "B",
      "correctAnswer": "A",
      "correct": false,
      "comment": "Explanation in Vietnamese on a single line, no double quotes, no line breaks"
    }
  ]
}
`;

// 🧱 Tạo prompt cho mỗi batch
const buildPrompt = (chunk, offset, part, answers) => `
Below are TOEIC Reading Part ${part} questions. For each question, judge the learner's answer and explain the result.

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

router.post('/score-reading-part', async (req, res) => {
  const { part, questions, answers } = req.body;

  if (![5, 6, 7].includes(part)) {
    return res.status(400).json({ error: 'Invalid reading part. Must be 5, 6, or 7.' });
  }

  try {
    if (part === 5) {
      const prompt = buildPrompt(questions, 0, part, answers);
      const aiText = await callGroq(prompt);
      console.log("🧠 AI Response (Part 5):", aiText);

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
      const batchSize = 5;
      const allFeedback = [];
      let correct = 0, skipped = 0;

      for (let i = 0; i < questions.length; i += batchSize) {
        const chunk = questions.slice(i, i + batchSize);
        const prompt = buildPrompt(chunk, i, part, answers);

        try {
          const aiText = await callGroq(prompt);
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
            ...chunk.map((_, j) => ({
              index: i + j + 1,
              userAnswer: answers[i + j] || 'Không chọn',
              correctAnswer: questions[j].answer,
              correct: false,
              comment: 'Lỗi định dạng phản hồi từ AI. Không thể chấm.'
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
