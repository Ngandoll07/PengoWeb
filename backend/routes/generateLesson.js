import express from "express";
import fetch from "node-fetch";

const router = express.Router();

router.post("/generate-lesson", async (req, res) => {
  const { day, skill } = req.body;

const prompt = `
You are an English TOEIC training assistant.

Today is Day ${day}, and the learner wants to practice the "${skill}" skill.

🎯 Please generate a TOEIC-style lesson focused on the "${skill}" skill, with realistic and diverse questions.

✅ Return only valid **JSON** in the format below:

{
  "title": "Lesson title in English",
  "description": "Short lesson description in English",
  "questions": [
    {
      "question": "Question in English?",
      "options": ["Option A", "Option B", "Option C", "Option D"],
      "answer": "A"
    },
    ...
    // At least 5 questions
  ]
}

⚠️ DO NOT include any explanation, markdown formatting, or non-JSON text.
⚠️ Make sure the JSON is syntactically correct and fully in English.
`;


  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
      }),
    });

    const data = await response.json();
    const content = data.choices?.[0]?.message?.content || "";
const first = content.indexOf("{");
const last = content.lastIndexOf("}");

try {
  const jsonText = content.substring(first, last + 1);
  const lesson = JSON.parse(jsonText);
  res.json({ lesson });
} catch (e) {
  console.error("❌ Invalid JSON from AI:", content);
  res.status(500).json({ error: "Invalid JSON from AI", raw: content });
}


    const lesson = JSON.parse(jsonText); // hoặc dùng jsonrepair nếu lỗi
    res.json({ lesson });

  } catch (err) {
    console.error("❌ Lỗi khi sinh bài học:", err);
    res.status(500).json({ error: "Không thể tạo bài học" });
  }
});


export default router;
