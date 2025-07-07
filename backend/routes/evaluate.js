import express from "express";
import fs from "fs";
import { execFile } from "child_process";
import { fileURLToPath } from "url";
import path from "path";
import os from "os";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const router = express.Router();

// ✅ Đường dẫn đến Python trong venv (chỉnh lại nếu cần)
const PYTHON_PATH = "C:/Users/LENOVO/Documents/KLTN/PengoWeb/ai/venv/Scripts/python.exe";

// ✅ Load toàn bộ dữ liệu Listening
const listeningData = JSON.parse(
    fs.readFileSync(path.join(__dirname, "../data/test1_listening.json"), "utf-8")
);

// ✅ Tạo file tạm chứa câu hỏi để truyền vào Whisper
function createTempQuestionFile(questions) {
    const tempPath = path.join(os.tmpdir(), `temp_questions_${Date.now()}.json`);
    fs.writeFileSync(tempPath, JSON.stringify(questions), "utf-8");
    return tempPath;
}

// ✅ API: POST /api/evaluate
router.post("/evaluate", async (req, res) => {
    try {
        const { questionIds, selectedAnswers } = req.body;

        const questions = listeningData.filter((q) => questionIds.includes(q.id));

        // Gom nhóm các câu theo file audio (dùng chung audio thì chấm 1 lần)
        const audioMap = {};
        for (const q of questions) {
            if (!audioMap[q.audio]) audioMap[q.audio] = [];
            audioMap[q.audio].push(q);
        }

        const results = [];
        let correct = 0;
        let transcript = "";

        // ✅ Gọi Whisper Python cho từng nhóm
        for (const [audioRelPath, group] of Object.entries(audioMap)) {
            const audioAbsPath = path.join(__dirname, "../../reactbassic/public", audioRelPath);
            const scriptPath = path.join(__dirname, "../../ai/analyze_audio.py");

            // ✅ Tạo file tạm cho nhóm câu hỏi
            const questionFilePath = createTempQuestionFile(group);

            // ✅ Gọi Whisper
            const output = await new Promise((resolve, reject) => {
                execFile(
                    PYTHON_PATH,
                    [scriptPath, audioAbsPath, questionFilePath],
                    { maxBuffer: 1024 * 1024 * 10 },
                    (err, stdout, stderr) => {
                        if (err) {
                            console.error("❌ Whisper error:", stderr.toString());
                            return reject(err);
                        }
                        try {
                            resolve(JSON.parse(stdout));
                        } catch (e) {
                            reject(e);
                        }
                    }
                );
            });

            // ✅ Xoá file tạm sau khi dùng
            fs.unlinkSync(questionFilePath);

            transcript += output.transcript + "\n";

            for (const q of output.results) {
                const userAnswer = selectedAnswers[q.id];
                const isCorrect = userAnswer === q.correct;
                if (isCorrect) correct++;
                results.push({
                    id: q.id,
                    question: q.question,
                    correctAnswer: q.correct,
                    userAnswer,
                    isCorrect,
                    requiresImage: q.requires_image,
                    image: q.image
                });
            }
        }

        // ✅ Gửi kết quả về frontend
        res.json({
            total: questionIds.length,
            correct,
            results,
            transcript: transcript.trim()
        });
    } catch (err) {
        console.error("❌ Evaluation error:", err);
        res.status(500).json({ message: "Đã xảy ra lỗi khi chấm điểm" });
    }
});

export default router;
