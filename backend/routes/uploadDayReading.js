// routes/uploadDayReading.js

import express from 'express';
import multer from 'multer';
import xlsx from 'xlsx';
import fs from 'fs';
import DayReadingTest from '../models/DayReadingTest.js';

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

router.post('/upload-day-reading', upload.single('file'), async (req, res) => {
  const { day, level, title } = req.body;

  try {
    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { header: 1 });

    const questions = rows.slice(1).map(r => ({
      question: r[0],
      options: [r[1], r[2], r[3], r[4]],
      answer: r[5]
    }));

    const test = new DayReadingTest({
      title: title || `Reading Day ${day}`,
      questions,
      day: Number(day),
      level,
    });

    await test.save();

    fs.unlinkSync(req.file.path); // Xóa file sau khi xử lý

    res.status(201).json({ message: "Upload thành công!", test });
  } catch (error) {
    console.error("❌ Lỗi khi upload:", error);
    res.status(500).json({ message: "Lỗi khi xử lý file upload!" });
  }
});

export default router;
