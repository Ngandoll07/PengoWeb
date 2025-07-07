import express from "express";
import fetch from "node-fetch";
import jwt from "jsonwebtoken";

const router = express.Router();
const JWT_SECRET = "123";

router.post("/grade-lesson", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Thiếu token" });

  const decoded = jwt.verify(token, JWT_SECRET);
  const userId = decoded.userId;

  const { day, skill, part, level, questions } = req.body;

  const prompt = `
You are a TOEIC grading assistant.

The user has completed the following lesson in skill "${skill}" on Day ${day}.

Each item contains:
- The question
- The 4 options
- The correct answer
- The user's answer

Evaluate the answers and return:

{
  "correct": <number of correct answers>,
  "total": <total questions>,
  "feedback": [
    {
      "index": 1,
      "question": "...",
      "userAnswer": "...",
      "correctAnswer": "...",
      "isCorrect": true/false,
      "mistakeType": "vocabulary" // optional
    }
  ]
}

Only return valid JSON. Do not explain.
  `;

  const formattedQuestions = questions.map((q, index) => ({
    index: index + 1,
    question: q.question,
    options: q.options,
    userAnswer: q.userAnswer,
    correctAnswer: q.correctAnswer,
  }));

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "user", content: prompt },
          { role: "user", content: JSON.stringify(formattedQuestions, null, 2) },
        ],
        temperature: 0.3,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
    const first = content.indexOf("{");
    const last = content.lastIndexOf("}");
    const json = JSON.parse(content.slice(first, last + 1));

    // Nếu muốn lưu lại kết quả, có thể insert vào MongoDB tại đây

    res.json(json);
  } catch (err) {
    console.error("❌ AI grading error:", err);
    res.status(500).json({ error: "Grading failed" });
  }
});

export default router;
