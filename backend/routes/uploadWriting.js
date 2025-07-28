import express from "express";
import multer from "multer";
import xlsx from "xlsx";
import WritingTask from "../models/WritingTask.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

// Helper: lấy giá trị từ nhiều khả năng tên cột
const getValue = (row, keys) => {
  for (const key of keys) {
    if (row[key] !== undefined) return row[key];
  }
  return "";
};

router.post("/upload-writing", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: "Thiếu file Excel" });
  }

  try {
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });

    const part1Sheet = workbook.Sheets["Part1"];
    const part2Sheet = workbook.Sheets["Part2"];
    const part3Sheet = workbook.Sheets["Part3"];

    if (!part1Sheet || !part2Sheet || !part3Sheet) {
      return res.status(400).json({ error: "Thiếu 1 trong các sheet: Part1, Part2, Part3" });
    }

    const part1Data = xlsx.utils.sheet_to_json(part1Sheet);
    const part2Data = xlsx.utils.sheet_to_json(part2Sheet);
    const part3Data = xlsx.utils.sheet_to_json(part3Sheet);

    const formattedPart1 = part1Data.map(row => ({
      image: getValue(row, ["image", "Image"]),
      keywords: getValue(row, ["keywords", "Keywords", "keyword s", "keyword\ns", "Key words"])
        .split(",")
        .map(k => k.trim())
        .filter(k => k),
      minWords: parseInt(getValue(row, ["minWords", "MinWords"])) || 0,
      maxWords: parseInt(getValue(row, ["maxWords", "MaxWords"])) || 100,
    }));

    const formattedPart2 = {
      part: 2,
      instruction: getValue(part2Data[0], ["instruction", "Instruction"]),
      questions: part2Data.map((row, idx) => ({
        id: idx + 1,
        prompt: getValue(row, ["prompt", "Prompt"]),
        email: getValue(row, ["email", "Email"]),
        minWords: parseInt(getValue(row, ["minWords", "MinWords"])) || 0,
        maxWords: parseInt(getValue(row, ["maxWords", "MaxWords"])) || 100,
      })),
    };

    const formattedPart3 = {
      part: 3,
      instruction: getValue(part3Data[0], ["instruction", "Instruction"]),
      question: {
        id: 1,
        prompt: getValue(part3Data[0], ["prompt", "Prompt"]),
        minWords: parseInt(getValue(part3Data[0], ["minWords", "MinWords"])) || 0,
        maxWords: parseInt(getValue(part3Data[0], ["maxWords", "MaxWords"])) || 100,
      },
    };

    // ✅ THÊM MỚI (create) thay vì update
    const newWritingTask = new WritingTask({
      part1: formattedPart1,
      part2: formattedPart2,
      part3: formattedPart3,
      createdAt: new Date(), // nếu bạn cần thêm thời gian
    });

    await newWritingTask.save();

    res.status(200).json({ message: "✅ Upload và thêm mới thành công!" });

  } catch (err) {
    console.error("❌ Upload lỗi:", err);
    res.status(500).json({ error: "Lỗi khi xử lý file Excel." });
  }
});



export default router;
