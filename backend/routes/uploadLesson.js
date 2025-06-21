// routes/uploadLesson.js
import express from "express";
import multer from "multer";
import xlsx from "xlsx";
import Lesson from "../models/Lesson.js";

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/upload-lesson", upload.single("file"), async (req, res) => {
  const { title, part, level, skill, day } = req.body;

  try {
    const partNumber = Number(part);
    const workbook = xlsx.read(req.file.buffer, { type: "buffer" });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const rows = xlsx.utils.sheet_to_json(sheet, { defval: "" });

    let questions = [];

    if (skill === "reading") {
      if (partNumber === 6 || partNumber === 7) {
        // Part 6, 7 – có đoạn văn
        const passageCol = Object.keys(rows[0]).find(key =>
          key.toLowerCase().includes("passenger") || key.toLowerCase().includes("paragraph")
        );

        const blocks = new Map();
        let currentPassage = "";

        rows.forEach(row => {
          const newPassage = row[passageCol]?.trim();
          if (newPassage) currentPassage = newPassage;
          if (!currentPassage) return;

          const question = {
            question: row["Column B (Question Text)"],
            options: [
              row["Column C (Option A)"],
              row["Column D (Option B)"],
              row["Column E (Option C)"],
              row["Column F (Option D)"]
            ],
            answer: row["Answer"]
          };

          if (!blocks.has(currentPassage)) {
            blocks.set(currentPassage, []);
          }

          blocks.get(currentPassage).push(question);
        });

        questions = Array.from(blocks.entries()).map(([passage, qs]) => ({
          passage,
          questions: qs
        }));
      } else {
        // Part 5 – câu hỏi rời, bọc vào block
        const qs = rows.slice(1).map(row => ({
          question: row["Column B (Question Text)"],
          options: [
            row["Column C (Option A)"],
            row["Column D (Option B)"],
            row["Column E (Option C)"],
            row["Column F (Option D)"]
          ],
          answer: row["Answer"]
        }));

        questions = [
          {
            passage: "",
            questions: qs
          }
        ];
      }

    } else if (skill === "listening") {
      if (partNumber === 1) {
        questions = rows.map(row => ({
          image: row["Image"] || null,
          questions: [
            {
              question: row["Column B (Question Text)"],
              options: [
                row["Column C (Option A)"],
                row["Column D (Option B)"],
                row["Column E (Option C)"],
                row["Column F (Option D)"]
              ],
              answer: row["Answer"]
            }
          ]
        }));
      } else if (partNumber === 3 || partNumber === 4) {
        const groupMap = new Map();

        rows.forEach(row => {
          const audioFile = row["Audio"];
          const question = {
            question: row["Column B (Question Text)"],
            options: [
              row["Column C (Option A)"],
              row["Column D (Option B)"],
              row["Column E (Option C)"],
              row["Column F (Option D)"]
            ],
            answer: row["Answer"]
          };

          if (!groupMap.has(audioFile)) {
            groupMap.set(audioFile, []);
          }

          groupMap.get(audioFile).push(question);
        });

        questions = Array.from(groupMap.entries()).map(([audio, qs]) => ({
          audio,
          questions: qs
        }));
      } else {
        return res.status(400).json({ message: `❌ Part ${partNumber} chưa hỗ trợ cho kỹ năng listening.` });
      }
    } else {
      return res.status(400).json({ message: "❌ Skill không hợp lệ" });
    }

    const newLesson = new Lesson({
      title,
      part: partNumber,
      level,
      skill,
      day: day ? Number(day) : undefined,
      questions
    });

    await newLesson.save();
    res.status(201).json({ message: "✅ Upload thành công", lesson: newLesson });

  } catch (err) {
    console.error("❌ Upload lỗi:", err);
    res.status(500).json({ message: "❌ Upload thất bại" });
  }
});

export default router;
