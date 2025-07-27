import express from "express";
import multer from "multer";
import fs from "fs";
import xlsx from "xlsx";
import path from "path";
import os from "os";
import { execFile } from "child_process";
import ListeningQuestion from "../models/ListeningQuestion.js";
import { fileURLToPath } from "url";

// ===== Đường dẫn hiện tại =====
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// ===== Cấu hình đường dẫn Whisper =====
const PYTHON_PATH = "D:/KLTN/PengoWeb/backend/ai/venv/Scripts/python.exe";
const SCRIPT_PATH = path.join(__dirname, "../ai/analyze_audio.py");

// ===== Tạo file tạm cho Whisper =====
function createTempQuestionFile(questions) {
    const tempPath = path.join(os.tmpdir(), `temp_questions_${Date.now()}.json`);
    fs.writeFileSync(tempPath, JSON.stringify(questions), "utf-8");
    return tempPath;
}

// ===== API: Lấy danh sách sheet từ file Excel =====
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

// ===== API: Upload Excel → phân tích bằng Whisper → lưu MongoDB =====
router.post("/upload-excel-listening", upload.single("file"), async (req, res) => {
    try {
        const sheetName = req.body.sheetName;
        if (!sheetName) return res.status(400).json({ message: "Thiếu tên sheet." });

        const filePath = req.file.path;
        const workbook = xlsx.readFile(filePath);
        if (!workbook.SheetNames.includes(sheetName)) {
            return res.status(400).json({ message: `Không tìm thấy sheet '${sheetName}'` });
        }

        const rawRows = xlsx.utils.sheet_to_json(workbook.Sheets[sheetName]);
        const formattedQuestions = rawRows.map((row) => ({
            id: row.questionId,
            part: Number(row.part),
            question: row.questionText,
            options: {
                A: row.optionA,
                B: row.optionB,
                C: row.optionC,
                D: row.optionD,
            },
            answer: row.answerAdmin,
            audio: row.audioPath,
            image: row.imagePath || null,
        }));

        const results = [];

        for (const q of formattedQuestions) {
            const audioRelPath = q.audio;
            const audioAbsPath = path.join(__dirname, "../../reactbassic/public", audioRelPath);
            const tempQuestionFile = createTempQuestionFile([q]);

            try {
                const output = await new Promise((resolve, reject) => {
                    execFile(
                        PYTHON_PATH,
                        [SCRIPT_PATH, audioAbsPath, tempQuestionFile],
                        { maxBuffer: 1024 * 1024 * 10 },
                        (err, stdout, stderr) => {
                            if (err) {
                                console.error("❌ Whisper error:", stderr.toString());
                                return reject(err);
                            }
                            try {
                                resolve(JSON.parse(stdout));
                            } catch (parseErr) {
                                console.error("❌ Lỗi phân tích JSON:", parseErr);
                                reject(parseErr);
                            }
                        }
                    );
                });

                results.push({
                    ...q,
                    transcript: output.transcript,
                    level: output.level,
                });
            } catch (e) {
                console.warn(`⚠️ Bỏ qua câu hỏi ID ${q.id} do lỗi Whisper.`);
            } finally {
                fs.unlinkSync(tempQuestionFile);
            }
        }

        await ListeningQuestion.insertMany(results);
        fs.unlinkSync(filePath);

        res.json({ message: "✅ Upload và phân tích thành công", count: results.length });
    } catch (err) {
        console.error("❌ Lỗi upload Excel:", err);
        res.status(500).json({ message: "Lỗi xử lý file Excel" });
    }
});

// ===== API: Xoá toàn bộ câu hỏi =====
router.delete("/listening/clear", async (req, res) => {
    try {
        await ListeningQuestion.deleteMany({});
        res.json({ message: "🧹 Đã xoá toàn bộ câu hỏi Listening" });
    } catch (err) {
        console.error("❌ Lỗi xoá Listening:", err);
        res.status(500).json({ message: "Lỗi server khi xoá" });
    }
});

export default router;
