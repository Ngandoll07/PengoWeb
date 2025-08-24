import express from "express";
import multer from "multer";
import fs from "fs";
import xlsx from "xlsx";
import path from "path";
import os from "os";
import { execFile } from "child_process";
import ListeningQuestion from "../models/ListeningQuestion.js";
import { fileURLToPath } from "url";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const router = express.Router();
const upload = multer({ dest: "uploads/" });

// ===== Cấu hình Whisper =====
const PYTHON_PATH = "D:/KLTN/PengoWeb/backend/ai/venv/Scripts/python.exe";
const SCRIPT_PATH = path.join(__dirname, "../ai/analyze_audio.py");

// ===== Cấu hình GROQ =====
const GROQ_KEY = process.env.GROQ_API_KEY;
const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";

// ===== Tạo file tạm =====
function createTempQuestionFile(questions) {
  const tempPath = path.join(os.tmpdir(), `temp_questions_${Date.now()}.json`);
  fs.writeFileSync(tempPath, JSON.stringify(questions), "utf-8");
  return tempPath;
}

// ===== Hàm gọi GROQ =====
// ===== Hàm gọi GROQ =====
async function analyzeWithGroq(transcript, question) {
  try {
    const systemMessage = `
Bạn là trợ lý AI TOEIC Listening. Phân tích câu hỏi và trả về JSON với 2 trường:
{
  "label": "Nhãn câu hỏi, ví dụ: Listening: main idea, Listening: detail, Mô tả hình ảnh...",
  "explanation": "Giải thích chi tiết cho câu hỏi"
}
Chỉ trả về JSON, không thêm text khác.
`;

    const userMessage = {
      transcript,
      question: question.question,
      options: question.options
    };

    const response = await axios.post(
      GROQ_URL,
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
        headers: {
          Authorization: `Bearer ${GROQ_KEY}`,
          "Content-Type": "application/json"
        }
      }
    );

    const message = response.data.choices?.[0]?.message?.content;
    if (!message) return { explanation: "", label: "Listening: general" };

    try {
      const parsed = JSON.parse(message);
      return {
        label: parsed.label || "Listening: general",
        explanation: parsed.explanation || ""
      };
    } catch {
      // fallback nếu AI trả về string không chuẩn JSON
      return { label: "Listening: general", explanation: message };
    }
  } catch (err) {
    console.error("❌ Lỗi gọi GROQ:", err.toString());
    return { label: "Listening: general", explanation: "" };
  }
}

// ===== API: Lấy danh sách sheet =====
router.post("/listening/sheets", upload.single("file"), async (req, res) => {
  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheetNames = workbook.SheetNames;
    fs.unlinkSync(req.file.path);
    res.json({ sheets: sheetNames });
  } catch (err) {
    console.error("❌ Lỗi lấy danh sách sheet:", err);
    res.status(500).json({ message: "Không thể đọc file Excel" });
  }
});

// ===== API: Upload Excel, phân tích và lưu =====
router.post("/upload-excel-listening", upload.single("file"), async (req, res) => {
  try {
    let sheetName = req.body.sheetName?.trim();
    const filePath = req.file.path;
    const workbook = xlsx.readFile(filePath);

    if (!sheetName) sheetName = workbook.SheetNames[0];
    if (!workbook.SheetNames.includes(sheetName)) {
      return res.status(400).json({ message: `Không tìm thấy sheet '${sheetName}'` });
    }

    const rawRows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
    const formattedQuestions = rawRows.map(row => ({
      testId: row.testId || row.id.split("_")[0], // test1 từ id như "test1_q01"
      id: row.questionId,
      part: Number(row.part),
      question: row.questionText,
      options: { A: row.optionA, B: row.optionB, C: row.optionC, D: row.optionD },
      answer: row.answerAdmin,
      audio: row.audioPath,
      image: row.imagePath || null
    }));

    const results = [];

    for (const q of formattedQuestions) {
      const audioAbsPath = path.join(__dirname, "../../reactbassic/public", q.audio);
      if (!fs.existsSync(audioAbsPath)) {
        console.warn(`⚠️ Audio không tồn tại: ${audioAbsPath}`);
        continue;
      }

      const tempFile = createTempQuestionFile([q]);

      try {
        // --- Whisper ---
        const whisperOutput = await new Promise((resolve, reject) => {
          execFile(PYTHON_PATH, [SCRIPT_PATH, audioAbsPath, tempFile], { maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
            if (err) return reject(stderr.toString());
            try { resolve(JSON.parse(stdout)); }
            catch (e) { reject(e); }
          });
        });

        const transcript = whisperOutput.transcript || "";

        // --- GROQ ---
        const groqResult = await analyzeWithGroq(transcript, q);

        results.push({
          ...q,
          transcript,
          explanation: groqResult.explanation,
          label: groqResult.label
        });


      } catch (err) {
        console.warn(`⚠️ Bỏ qua câu hỏi ID ${q.id} do lỗi AI/Whisper:`, err.toString());
      } finally {
        fs.unlinkSync(tempFile);
      }
    }

    if (results.length > 0) await ListeningQuestion.insertMany(results);
    fs.unlinkSync(filePath);

    res.json({ message: "✅ Upload và phân tích thành công", count: results.length });

  } catch (err) {
    console.error("❌ Lỗi upload Excel:", err);
    res.status(500).json({ message: "Lỗi xử lý file Excel" });
  }
});

// ===== Xoá toàn bộ câu hỏi =====
router.delete("/listening/clear", async (req, res) => {
  try {
    await ListeningQuestion.deleteMany({});
    res.json({ message: "🧹 Đã xoá toàn bộ câu hỏi Listening" });
  } catch (err) {
    console.error("❌ Lỗi xoá Listening:", err);
    res.status(500).json({ message: "Lỗi server khi xoá" });
  }
});
// 📌 GET /api/listening-questions?part=1
router.get("/listening-questions", async (req, res) => {
  try {
    const { part } = req.query;
    const filter = { testId: "test1" }; // chỉ lấy test1
    if (part) filter.part = Number(part);

    const questions = await ListeningQuestion.find(filter).lean();

    res.json({
      success: true,
      testId: "test1-q01",
      count: questions.length,
      questions,
    });
  } catch (err) {
    console.error("❌ Error fetching listening questions:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});


export default router;
