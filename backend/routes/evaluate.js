// routes/evaluate.js
import express from "express";
import fs from "fs";
import { execFile } from "child_process";
import { fileURLToPath } from "url";
import path from "path";
import os from "os";
import fetch from "node-fetch";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// Path to your Python in venv
const PYTHON_PATH = "C:/Users/LENOVO/Documents/KLTN/PengoWeb/backend/ai/venv/Scripts/python.exe";

// Load listening data
const listeningData = JSON.parse(
  fs.readFileSync(path.join(__dirname, "../data/test1_listening.json"), "utf-8")
);

// Temporary question file
function createTempQuestionFile(questions) {
  const tempPath = path.join(os.tmpdir(), `temp_questions_${Date.now()}.json`);
  fs.writeFileSync(tempPath, JSON.stringify(questions), "utf-8");
  return tempPath;
}

// Call Groq/OpenAI to get per-question analysis
async function getAiFeedbackForQuestion({
  transcript,
  questionText,
  options,
  userAnswer,
  correctAnswer,
}) {
  // Build prompt
  const prompt = `
You are an expert TOEIC listening tutor. Given the transcript of the audio and a single question, do the following:

Input:
- Transcript: "${transcript.replaceAll('"', '\\"')}"
- Question: "${questionText.replaceAll('"', '\\"')}"
- Options: ${JSON.stringify(options)}
- Student's answer: "${userAnswer || "No answer"}"
- Correct answer: "${correctAnswer}"

Tasks:
1. Determine if the student's answer is correct.
2. If incorrect, assign a concise focusTopic. Choose among: "Listening: main idea", "Listening: detail", "Listening: inference". If correct, you can use "None".
3. Provide a brief explanation (1-2 sentences) why the answer is correct or incorrect, referencing the transcript.
4. Return strictly valid JSON with these fields: 
{
  "isCorrect": <true|false>,
  "focusTopic": "<focusTopic or None>",
  "explanation": "<explanation>"
}
`;

  const resp = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "You are a TOEIC expert that outputs strict JSON only." },
        { role: "user", content: prompt },
      ],
      temperature: 0.2,
      max_tokens: 500,
    }),
  });

  if (!resp.ok) {
    const text = await resp.text();
    console.error("AI feedback fetch failed:", text);
    throw new Error("AI feedback error");
  }

  const data = await resp.json();
  const raw = data.choices?.[0]?.message?.content || "";
  let parsed = null;
  try {
    parsed = JSON.parse(raw);
  } catch (e) {
    // Try to extract JSON substring if wrapper exists
    const match = raw.match(/\{[\s\S]*\}$/);
    if (match) {
      try {
        parsed = JSON.parse(match[0]);
      } catch {}
    }
  }
  if (!parsed || typeof parsed.isCorrect !== "boolean") {
    // fallback: simple rule-based if parsing failed
    const fallbackIsCorrect = userAnswer === correctAnswer;
    const fallbackFocus =
      fallbackIsCorrect ? "None" : "Listening: detail"; // naive
    const fallbackExplanation = fallbackIsCorrect
      ? "Correct answer."
      : `Expected ${correctAnswer} but got ${userAnswer || "no answer"}.`;
    return {
      isCorrect: fallbackIsCorrect,
      focusTopic: fallbackFocus,
      explanation: fallbackExplanation,
    };
  }

  return {
    isCorrect: parsed.isCorrect,
    focusTopic: parsed.focusTopic === "None" ? null : parsed.focusTopic,
    explanation: parsed.explanation,
  };
}

// Main evaluate route
router.post("/evaluate", async (req, res) => {
  try {
    const { questionIds, selectedAnswers } = req.body;
    if (!Array.isArray(questionIds) || typeof selectedAnswers !== "object") {
      return res.status(400).json({ message: "Invalid payload" });
    }

    const questions = listeningData.filter((q) => questionIds.includes(q.id));

    // Group by shared audio file
    const audioMap = {};
    for (const q of questions) {
      if (!audioMap[q.audio]) audioMap[q.audio] = [];
      audioMap[q.audio].push(q);
    }

    const results = [];
    let correctCount = 0;
    let fullTranscript = "";

    // To accumulate focusTopic counts
    const wrongTopicCount = {};

    for (const [audioRelPath, group] of Object.entries(audioMap)) {
      const audioAbsPath = path.join(__dirname, "../../reactbassic/public", audioRelPath);
      const scriptPath = path.join(__dirname, "../ai/analyze_audio.py");

      const questionFilePath = createTempQuestionFile(group);

      // Run Whisper via Python script
      const output = await new Promise((resolve, reject) => {
        execFile(
          PYTHON_PATH,
          [scriptPath, audioAbsPath, questionFilePath],
          { maxBuffer: 1024 * 1024 * 10 },
          (err, stdout, stderr) => {
            if (err) {
              console.error("❌ Whisper error:", stderr.toString());
              return reject(err);
            }
            try {
              resolve(JSON.parse(stdout));
            } catch (e) {
              console.error("❌ JSON parse error from Whisper:", stdout);
              return reject(e);
            }
          }
        );
      });

      fs.unlinkSync(questionFilePath);
      const groupTranscript = output.transcript || "";
      fullTranscript += groupTranscript + "\n";

      // For each question in this audio group, ask AI for fine-grained feedback
      for (const q of group) {
        const userAnswer = selectedAnswers[q.id];
        const correctAnswer = q.answer;
        // Call AI for explanation/focusTopic
        let aiFeedback;
        try {
          aiFeedback = await getAiFeedbackForQuestion({
            transcript: groupTranscript,
            questionText: q.question || "",
            options: q.options || {},
            userAnswer: userAnswer || "",
            correctAnswer,
          });
        } catch (e) {
          console.warn("AI feedback failed for question", q.id, e);
          // fallback simple
          const isCorrectFallback = userAnswer === correctAnswer;
          aiFeedback = {
            isCorrect: isCorrectFallback,
            focusTopic: isCorrectFallback ? null : "Listening: detail",
            explanation: isCorrectFallback
              ? "Bạn trả lời đúng."
              : `Đáp án đúng ${correctAnswer}, bạn chọn ${userAnswer || "không chọn"}.`,
          };
        }

        if (aiFeedback.isCorrect) correctCount++;
        if (!aiFeedback.isCorrect && aiFeedback.focusTopic) {
          wrongTopicCount[aiFeedback.focusTopic] =
            (wrongTopicCount[aiFeedback.focusTopic] || 0) + 1;
        }

        results.push({
          id: q.id,
          question: q.question || null,
          options: q.options || null,
          correctAnswer,
          userAnswer: userAnswer || null,
          isCorrect: aiFeedback.isCorrect,
          transcript: groupTranscript,
          explanation: aiFeedback.explanation,
          focusTopic: aiFeedback.focusTopic,
          requiresImage: q.requires_image || false,
          image: q.image || null,
          audio: q.audio || null,
        });
      }
    }

    // Build suggestedFocusTopics (top 3 frequent)
    const suggestedFocusTopics = Object.entries(wrongTopicCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([topic]) => topic);

    // Feedback summary
    let feedbackSummary = "";
    if (suggestedFocusTopics.length) {
      feedbackSummary = suggestedFocusTopics
        .map((t) => `Bạn thường sai ở ${t} (${wrongTopicCount[t]} lần)`)
        .join("; ");
    } else {
      feedbackSummary = "Không phát hiện lỗi lặp lại rõ rệt.";
    }

    const totalQuestions = questionIds.length;
    res.json({
      total: totalQuestions,
      correct: correctCount,
      results,
      transcript: fullTranscript.trim(),
      suggestedFocusTopics,
      feedbackSummary,
    });
  } catch (err) {
    console.error("❌ Evaluation error:", err);
    res.status(500).json({ message: "Đã xảy ra lỗi khi chấm điểm", error: err.message });
  }
});

export default router;
