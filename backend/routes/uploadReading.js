import express from "express";
import multer from "multer";
import xlsx from "xlsx";
import axios from "axios";
import ReadingTest from "../models/ReadingTest.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// POST /api/upload-reading
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

            const blockMap = new Map();
            let currentPassage = "";

            rows.forEach(row => {
                const newPassage = row[passageCol]?.trim();
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
                    part: partNumber
                };

                if (!blockMap.has(currentPassage)) {
                    blockMap.set(currentPassage, []);
                }

                blockMap.get(currentPassage).push(questionObj);
            });

            const blocks = Array.from(blockMap.entries()).map(([passage, questions]) => ({ passage, questions }));
            payload.blocks = blocks;
            try {
  const aiRes = await axios.post("http://localhost:5000/api/analyze-difficulty", {
    part: partNumber,
    questions: payload.questions || [],
    blocks: payload.blocks || [],
  });
  payload.level = aiRes.data.level || "medium"; // fallback
} catch (err) {
  console.warn("⚠️ Không thể phân tích độ khó bằng AI:", err.message);
  payload.level = "medium"; // fallback nếu AI lỗi
}
        } else {
  const questions = rows.map(row => ({
    question: row["Column B (Question Text)"],
    options: {
      A: row["Column C (Option A)"],
      B: row["Column D (Option B)"],
      C: row["Column E (Option C)"],
      D: row["Column F (Option D)"]
    },
    answer: row["Answer"],
    part: partNumber
  }));
  payload.questions = questions;

  // 🔍 Gọi AI để phân tích độ khó đề Part 5
  try {
    const aiRes = await axios.post("http://localhost:5000/api/analyze-difficulty", {
      part: partNumber,
      questions: questions,
      blocks: [],
    });
    payload.level = aiRes.data.level || "medium";
  } catch (err) {
    console.warn("⚠️ AI lỗi khi phân tích độ khó Part 5:", err.message);
    payload.level = "medium"; // fallback
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