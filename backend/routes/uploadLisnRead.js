import express from "express";
import multer from "multer";
import xlsx from "xlsx";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import LisnReadQuestion from "../models/LisnReadQuestions.js";
import { spawn } from "child_process";
import axios from "axios";

dotenv.config();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

const PYTHON_PATH = "C:/Users/LENOVO/Documents/KLTN/PengoWeb/backend/ai/venv/Scripts/python.exe";
const SCRIPT_PATH = path.join(__dirname, "../ai/analyze_audio.py");
const GROQ_KEY = process.env.GROQ_API_KEY;

// ----- Hàm Whisper (Listening) -----
async function transcribeAudio(audioPath) {
  return new Promise((resolve) => {
    const process = spawn(PYTHON_PATH, [SCRIPT_PATH, audioPath]);
    let output = "";
    process.stdout.on("data", (data) => output += data.toString());
    process.stderr.on("data", (err) => console.error(err.toString()));
    process.on("close", () => resolve(output.trim()));
  });
}

// ----- Hàm phân tích Listening -----
async function analyzeWithGroq(transcript, question) {
  try {
    const systemMessage = `
Bạn là trợ lý AI TOEIC Listening. Phân tích câu hỏi và trả về JSON với 2 trường:
{
 "label": "Nhãn câu hỏi, ví dụ: Listening: main idea, Listening: detail, Mô tả hình ảnh...",
 "explanation": "Giải thích chi tiết"
}
Chỉ trả về JSON, không thêm text khác.
`;
    const userMessage = { transcript, question: question.questionText, options: question.options };

    const res = await axios.post(
      "https://api.groq.com/openai/v1/chat/completions",
      {
        model: "llama-3.1-8b-instant",
        messages: [
          { role: "system", content: systemMessage },
          { role: "user", content: JSON.stringify(userMessage) }
        ],
        temperature: 0.2,
        max_tokens: 500
      },
      {
        headers: { Authorization: `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" }
      }
    );

    const message = res.data.choices?.[0]?.message?.content;
    if (!message) return { label: "Listening: general", explanation: "" };
    try { return JSON.parse(message); } catch { return { label: "Listening: general", explanation: message }; }
  } catch (err) {
    console.error("❌ Lỗi GROQ Listening:", err.toString());
    return { label: "Listening: general", explanation: "" };
  }
}

// ----- Hàm phân tích Reading -----
async function analyzeReadingWithGroq(questions) {
  const systemMessage = `
Bạn là trợ lý AI TOEIC Reading (Part 5/6/7).
Task: Phân tích từng câu hỏi và gán 1 nhãn từ:
"vocabulary", "grammar", "main_idea", "detail", "inference", "scanning",
"skimming", "context", "reference", "cohesion", "organization",
"tone_purpose", "logical_connection", "paraphrase", "other"

Return only a valid JSON array, no extra text.
Each element must follow this format:
{
  "questionIndex": "<example: '1' or '2.3'>",
  "label": "<one of the labels above>",
  "explanation": "<short explanation (1–2 sentences) in English for why this answer is correct>"
}
`;

  // Escape special chars
  const safeQuestions = questions.map(q => ({
    ...q,
    questionText: q.questionText?.replace(/\n/g, " ").replace(/"/g, "'"),
    passage: q.passage?.replace(/\n/g, " ").replace(/"/g, "'")
  }));

  let attempts = 0;
  const maxAttempts = 3;

  while (attempts < maxAttempts) {
    try {
      const res = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama-3.1-8b-instant",
          messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: JSON.stringify(safeQuestions) }
          ],
          temperature: 0.3,
          max_tokens: 500
        },
        { headers: { Authorization: `Bearer ${GROQ_KEY}`, "Content-Type": "application/json" } }
      );

      let message = res.data.choices?.[0]?.message?.content?.trim();

      if (!message.startsWith("[")) {
        const first = message.indexOf("[");
        const last = message.lastIndexOf("]");
        if (first !== -1 && last !== -1) message = message.slice(first, last + 1);
      }

      return JSON.parse(message);
    } catch (err) {
      attempts++;
      if (err.response?.status === 429) {
        console.warn("⚠️ GROQ Reading 429, retrying in 2s...");
        await new Promise(r => setTimeout(r, 2000));
      } else {
        console.error("❌ Lỗi GROQ Reading:", err.message, "attempt:", attempts);
        break;
      }
    }
  }

  return questions.map(q => ({
    questionIndex: q.questionIndex,
    label: "other",
    explanation: "Default due to API error or JSON parsing error."
  }));
}

// ----- OCR Part 7 -----
async function callOpenRouterAnalyzeImage(imagePath) {
  try {
    if (!fs.existsSync(imagePath)) return "";
    const data = fs.readFileSync(imagePath);
    const dataUrl = `data:image/png;base64,${data.toString("base64")}`;

    const res = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: "AI assistant for TOEIC Part 7 image reading." },
          { role: "user", content: `Extract the text content from this image: ${dataUrl}` }
        ],
        temperature: 0.3
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );
    return res.data.choices?.[0]?.message?.content || "";
  } catch (err) {
    console.error("❌ Lỗi OpenRouter OCR:", err.toString());
    return "";
  }
}

// ----- Upload + phân tích -----
router.post("/", upload.single("file"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ message: "Chưa có file upload" });

    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheet = xlsx.utils.sheet_to_json(workbook.Sheets[workbook.SheetNames[0]]);
    const results = [];

    for (let row of sheet) {
      const partNum = parseInt(row.part);
      let questionText = row.questionText || "";
      let transcript = null;

      // Listening
      if ([1, 2, 3, 4].includes(partNum) && row.audioPath) {
        const audioAbsPath = path.join("C:/Users/LENOVO/Documents/KLTN/PengoWeb/reactbassic/public", row.audioPath.replace(/^\//, ""));
        if (fs.existsSync(audioAbsPath)) transcript = await transcribeAudio(audioAbsPath);
      }

      // Reading Part 7: OCR nếu có ảnh
      if (partNum === 7 && row.imagePath) {
        const imagePath = path.join("C:/Users/LENOVO/Documents/KLTN/PengoWeb/reactbassic/public", row.imagePath.replace(/^\//, ""));
        if (fs.existsSync(imagePath)) {
          const extractedText = await callOpenRouterAnalyzeImage(imagePath);
          if (extractedText) questionText += ` ${extractedText}`;
        }
      }

      const questionPayload = {
        questionIndex: row.questionId,
        questionText,
        options: [row.optionA, row.optionB, row.optionC, row.optionD].filter(Boolean),
        transcript,
        passage: partNum === 6 ? row.passage || "" : undefined
      };

      // Phân tích
      let analysis;
      if ([5, 6, 7].includes(partNum)) {
        analysis = await analyzeReadingWithGroq([questionPayload]);
        analysis = analysis[0] || { label: "other", explanation: "" };
      } else {
        analysis = await analyzeWithGroq(transcript, questionPayload);
      }

      results.push({
        testId: row.testId,
        part: row.part,
        groupId: row.groupId,
        questionId: row.questionId,
        questionText,
        options: [row.optionA, row.optionB, row.optionC, row.optionD].filter(Boolean),
        answerAdmin: row.answerAdmin || null,
        audioPath: row.audioPath || null,
        imagePath: row.imagePath || null,
        transcript,
        label: analysis.label,
        explanation: analysis.explanation,
        passage: row.passage || null
      });
    }

    await LisnReadQuestion.insertMany(results);
    res.json({ message: "✅ Upload + phân tích AI thành công", count: results.length, data: results });

  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Lỗi upload hoặc phân tích AI", error: err.message });
  }
});

router.get("/lisnread-tests", async (req, res) => {
  try {
    const data = await LisnReadQuestion.find();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
