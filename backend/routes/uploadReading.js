const express = require("express");
const multer = require("multer");
const xlsx = require("xlsx");
const ReadingTest = require("../models/ReadingTest");

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

     const questions = rows.map(row => ({
      question: row["Column B (Question Text)"],
      options: {
        A: row["Column C (Option A)"],
        B: row["Column D (Option B)"],
        C: row["Column E (Option C)"],
        D: row["Column F (Option D)"]
      },
      answer: row["Answer"],
      part: parseInt(row["Part"]) || 5
    }));

    const test = new ReadingTest({
      title,
      part: parseInt(part),
      questions
    });

    const saved = await test.save();
    res.status(200).json(saved);
  } catch (err) {
    console.error("❌ Lỗi xử lý file:", err);
    res.status(500).json({ message: "Lỗi xử lý file Excel" });
  }
});

module.exports = router;
