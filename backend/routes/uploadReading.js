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

// gọi AI với retry + backoff
async function callAnalyzeDifficultyWithBackoff(payload, maxRetries = 4) {
  let attempt = 0;
  let wait = 1000; // bắt đầu 1s
  while (attempt < maxRetries) {
    try {
      const res = await axios.post("http://localhost:5000/api/analyze-difficulty", payload);
      return res.data;
    } catch (err) {
      const code = err.response?.data?.error?.code;
      const isRateLimit = code === "rate_limit_exceeded";
      attempt++;
      if (attempt >= maxRetries) throw err;
      // tăng dần thời gian chờ, nếu rate limit thì nhân thêm
      const backoff = isRateLimit ? wait * 2 : wait;
      console.warn(`⚠️ Thử lại lần ${attempt} sau ${backoff}ms vì lỗi:`, err.response?.data || err.message);
      await sleep(backoff);
      wait *= 2;
    }
  }
}

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

    if (partNumber === 6 || partNumber === 7) {
      const passageCol = Object.keys(rows[0] || {}).find(key =>
        key.toLowerCase().includes("passage") || key.toLowerCase().includes("passenger")
      );

      if (!passageCol) {
        return res.status(400).json({ message: "Không tìm thấy cột chứa đoạn văn (passage/passenger) trong file Excel." });
      }

      // Xây blocks
      const blockMap = new Map();
      let currentPassage = "";

      rows.forEach(row => {
        const newPassage = String(row[passageCol] || "").trim();
        if (newPassage) currentPassage = newPassage;
        if (!currentPassage) return;

        const questionObj = {
          question: row["Column B (Question Text)"],
          options: {
            A: row["Column C (Option A)"],
            B: row["Column D (Option B)"],
            C: row["Column E (Option C)"],
            D: row["Column F (Option D)"]
          },
          answer: row["Answer"],
          part: partNumber,
        };

        if (!blockMap.has(currentPassage)) {
          blockMap.set(currentPassage, []);
        }
        blockMap.get(currentPassage).push(questionObj);
      });

      const blocks = Array.from(blockMap.entries()).map(([passage, questions]) => ({ passage, questions }));
      payload.blocks = blocks;

      // Flatten từng câu kèm passage và index để chunk
      const flatList = [];
      payload.blocks.forEach((block, bi) => {
        block.questions.forEach((q, qi) => {
          flatList.push({
            questionObj: q,
            questionIndex: `${bi + 1}.${qi + 1}`,
            passage: block.passage,
          });
        });
      });

      // Chunk nhỏ để tránh prompt quá dài; chỉnh size nếu cần
      const CHUNK_SIZE = 5;
      const chunks = chunkArray(flatList, CHUNK_SIZE);
      const perQuestionAccum = [];

      for (const chunk of chunks) {
        // Tái cấu trúc block nhỏ giữ nguyên passage để gửi
        const batchBlocksMap = new Map();
        chunk.forEach(item => {
          if (!batchBlocksMap.has(item.passage)) {
            batchBlocksMap.set(item.passage, []);
          }
          // giữ câu nguyên dạng để analyze-difficulty hiểu block + câu
          batchBlocksMap.get(item.passage).push({
            question: item.questionObj.question,
            options: item.questionObj.options,
          });
        });

        const batchBlocks = Array.from(batchBlocksMap.entries()).map(([passage, questions]) => ({
          passage,
          questions: questions.map(q => ({
            question: q.question,
            options: q.options,
          })),
        }));

        // Gọi AI với retry
        let perQuestionBatch = [];
        try {
          const aiRes = await callAnalyzeDifficultyWithBackoff({
            part: partNumber,
            questions: [],
            blocks: batchBlocks,
          });
          perQuestionBatch = aiRes.perQuestion || [];
          // merge vào tổng
          perQuestionAccum.push(...perQuestionBatch);
        } catch (err) {
          console.warn("⚠️ Batch AI lỗi hoàn toàn, fallback medium cho chunk:", err.message);
          // fallback medium cho mỗi câu trong chunk
          chunk.forEach(item => {
            perQuestionAccum.push({ questionIndex: item.questionIndex, level: "medium" });
          });
        }
      }

      // Gán level trở lại đúng câu trong payload.blocks
      payload.blocks.forEach((block, bi) => {
        block.questions.forEach((q, qi) => {
          const idx = `${bi + 1}.${qi + 1}`;
          const match = perQuestionAccum.find(p => String(p.questionIndex) === idx);
          if (match) {
            q.level = match.level;
          }
          // nếu không có match thì giữ default 'medium'
        });
      });
    } else {
      // Part 5
      const questions = rows.map(row => ({
        question: row["Column B (Question Text)"],
        options: {
          A: row["Column C (Option A)"],
          B: row["Column D (Option B)"],
          C: row["Column E (Option C)"],
          D: row["Column F (Option D)"]
        },
        answer: row["Answer"],
        part: partNumber,
      }));
      payload.questions = questions;

      try {
        const aiRes = await callAnalyzeDifficultyWithBackoff({
          part: partNumber,
          questions: questions,
          blocks: [],
        });
        const perQuestion = aiRes.perQuestion || [];
        questions.forEach((q, i) => {
          const match = perQuestion.find(p => String(p.questionIndex) === String(i + 1));
          if (match) q.level = match.level;
        });
      } catch (err) {
        console.warn("⚠️ AI lỗi khi phân tích độ khó Part 5:", err.message);
        // giữ default mỗi câu là 'medium'
      }
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
