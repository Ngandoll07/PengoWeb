import express from "express";
import multer from "multer";
import xlsx from "xlsx";
import axios from "axios";
import ReadingTest from "../models/ReadingTest.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// helper: chia mảng thành các chunk nhỏ
function chunkArray(arr, size) {
  const chunks = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

// helper delay
const sleep = ms => new Promise(r => setTimeout(r, ms));

async function callAnalyzeLabelWithBackoff(payload, maxRetries = 4) {
  let attempt = 0;
  let wait = 1000;
  const systemMessage = `
You are an AI assistant for TOEIC Reading (Part 5/6/7).
Task: For each question, analyze and assign one of the following labels:
- "vocabulary", "grammar", "main_idea", "detail", "inference", "scanning",
  "skimming", "context", "reference", "cohesion", "organization",
  "tone_purpose", "logical_connection", "paraphrase", "other"

Additionally, provide a short explanation (1–2 sentences) for why this answer is correct.

Return only a valid JSON array, no extra text.
Each element must follow this format:
{
  "questionIndex": "<example: '1' or '2.3'>",
  "label": "<one of the labels above>",
  "explanation": "<short explanation (1–2 sentences) in English for why this answer is correct>"
}
`;

  while (attempt < maxRetries) {
    try {
      const res = await axios.post(
        "https://api.groq.com/openai/v1/chat/completions",
        {
          model: "llama3-8b-8192",
          messages: [
            { role: "system", content: systemMessage },
            { role: "user", content: JSON.stringify(payload, null, 2) },
          ],
          temperature: 0.4,
        },
        {
          headers: {
            Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json",
          },
        }
      );
      let aiText = res.data.choices?.[0]?.message?.content?.trim() || "";
      if (!aiText.startsWith("[")) {
        const first = aiText.indexOf("[");
        const last = aiText.lastIndexOf("]");
        if (first !== -1 && last !== -1) {
          aiText = aiText.slice(first, last + 1);
        }
      }
      return JSON.parse(aiText);
    } catch (err) {
      attempt++;
      if (attempt >= maxRetries) throw err;
      await sleep(wait);
      wait *= 2;
    }
  }
}

// --- New helper: call OpenRouter to extract text from image
/**
 * Gọi OpenRouter để phân tích ảnh Part 7 từ local file
 * @param {string} localPath - đường dẫn file local
 * @returns {string} - Text trích xuất từ ảnh
 */
async function callOpenRouterAnalyzeImage(localPath) {
  try {
    // Đọc file và encode base64
    const absolutePath = path.resolve(localPath);
    const fileData = fs.readFileSync(absolutePath, { encoding: "base64" });
    const dataUrl = `data:image/png;base64,${fileData}`;

    const res = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "gpt-4.1-mini",
        messages: [
          { role: "system", content: "You are an AI assistant for TOEIC Part 7 image reading." },
          { role: "user", content: `Extract the text content and relevant info from this image: ${dataUrl}` }
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
    console.error("❌ OpenRouter error:", err.message);
    return "";
  }
}

// --- Route
router.post("/upload-reading", upload.single("file"), async (req, res) => {
  const { title, part } = req.body;
  if (!req.file || !title || !part) {
    return res.status(400).json({ message: "Thiếu dữ liệu!" });
  }

  try {
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    const partNumber = parseInt(part);
    const payload = { title, part: partNumber };

    if (partNumber === 6) {
      // --- Part 6: passage text ---
      const passageCol = Object.keys(rows[0] || {}).find(key =>
        key.toLowerCase().includes("passage")
      );
      if (!passageCol) return res.status(400).json({ message: "Không tìm thấy cột passage." });

      const blockMap = new Map();
      let currentPassage = "";

      rows.forEach(row => {
        const newPassage = String(row[passageCol] || "").trim();
        if (newPassage) currentPassage = newPassage;
        if (!currentPassage) return;

        const questionObj = {
          questionNumber: row["Column A (Question Number)"] || "",
          question: row["Column B (Question Text)"] || "[blank]",
          options: {
            A: row["Column C (Option A)"] || "",
            B: row["Column D (Option B)"] || "",
            C: row["Column E (Option C)"] || "",
            D: row["Column F (Option D)"] || ""
          },
          answer: row["Answer"] || "",
          part: partNumber
        };

        if (!blockMap.has(currentPassage)) blockMap.set(currentPassage, []);
        blockMap.get(currentPassage).push(questionObj);
      });

      payload.blocks = Array.from(blockMap.entries()).map(([passage, questions]) => ({ passage, questions }));

    } else if (partNumber === 7) {
  // --- Part 7: multiple images per block + OpenRouter OCR (with cache) ---
  const blockMap = new Map(); // key = imagesKey (join bằng "|")
  const ocrCache = new Map(); // imagePath -> extractedText
  let currentImages = [];

  for (const row of rows) {
    // 1) Tách nhiều ảnh trong 1 ô (xuống dòng)
    const imagesInCell = String(row["imagePath"] || "")
      .split(/\r?\n/)
      .map(s => s.trim())
      .filter(Boolean);

    // nếu ô có ảnh -> cập nhật "currentImages", nếu trống -> dùng ảnh của block hiện tại
    if (imagesInCell.length > 0) currentImages = imagesInCell;
    if (currentImages.length === 0) continue; // chưa có ảnh để gán block

    // 2) Tạo key cho block theo bộ ảnh hiện tại
    const imagesKey = currentImages.join("|");

    // 3) Nếu block chưa tồn tại -> OCR tất cả ảnh (dùng cache) và tạo context gộp
    if (!blockMap.has(imagesKey)) {
      const extractedList = [];
      for (const img of currentImages) {
        let txt = ocrCache.get(img);
        if (!txt) {
          txt = await callOpenRouterAnalyzeImage(img); // OCR 1 lần/ảnh
          ocrCache.set(img, txt);
        }
        extractedList.push({ imagePath: img, text: txt });
      }

      const context =
        extractedList
          .map((e, i) => `[Image ${i + 1}] ${e.imagePath}\n${e.text}`)
          .join("\n\n");

      blockMap.set(imagesKey, {
        images: [...currentImages],          // <-- nhiều hình trong 1 block
        imagePath: currentImages.join("\n"), // (giữ để tương thích cũ nếu cần)
        context,                             // <-- OCR gộp
        questions: []
      });
    }

    // 4) Push câu hỏi vào đúng block
    const block = blockMap.get(imagesKey);
    block.questions.push({
      questionNumber: row["Column A (Question Number)"] || "",
      question: row["Column B (Question Text)"] || "[blank]",
      options: {
        A: row["Column C (Option A)"] || "",
        B: row["Column D (Option B)"] || "",
        C: row["Column E (Option C)"] || "",
        D: row["Column F (Option D)"] || ""
      },
      answer: row["Answer"] || "",
      part: partNumber
    });
  }

  // 5) Chuyển thành payload.blocks
  payload.blocks = Array.from(blockMap.values());

  // 6) Gọi Groq AI để gán label/explanation cho từng block (dùng context gộp)
  for (const block of payload.blocks) {
    try {
      const aiRes = await callAnalyzeLabelWithBackoff(
        block.questions.map((q, i) => ({
          questionIndex: q.questionNumber || `${i + 1}`,
          question: q.question,
          options: q.options,
          context: block.context   // <-- dùng context gộp nhiều hình
        }))
      );

      block.questions.forEach(q => {
        const match = aiRes.find(p => String(p.questionIndex) === String(q.questionNumber));
        if (match) {
          q.label = match.label;
          q.explanation = match.explanation;
        }
      });
    } catch (err) {
      block.questions.forEach(q => {
        q.label = "other";
        q.explanation = "Default label due to AI error.";
      });
    }
  }
}
else {
      // --- Part 5 ---
      const questions = rows.map((row, i) => ({
        question: row["Column B (Question Text)"] || "[blank]",
        options: {
          A: row["Column C (Option A)"] || "",
          B: row["Column D (Option B)"] || "",
          C: row["Column E (Option C)"] || "",
          D: row["Column F (Option D)"] || ""
        },
        answer: row["Answer"] || "",
        part: partNumber
      }));

      try {
        const aiRes = await callAnalyzeLabelWithBackoff(
          questions.map((q, i) => ({
            questionIndex: `${i + 1}`,
            question: q.question,
            options: q.options
          }))
        );
        questions.forEach((q, i) => {
          const match = aiRes.find(p => String(p.questionIndex) === String(i + 1));
          if (match) {
            q.label = match.label;
            q.explanation = match.explanation;
          }
        });
      } catch (err) {
        questions.forEach(q => {
          q.label = "grammar";
          q.explanation = "Default label due to AI error.";
        });
      }

      payload.questions = questions;
    }

    const test = new ReadingTest(payload);
    const saved = await test.save();
    res.status(200).json(saved);

  } catch (err) {
    console.error("❌ Lỗi xử lý file:", err);
    res.status(500).json({ message: "Lỗi xử lý file Excel" });
  }
});

export default router;
