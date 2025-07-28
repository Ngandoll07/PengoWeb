import express from "express";
import multer from "multer";
import fs from "fs";
import path from "path";
import { execSync } from "child_process";
import SpeakingQuestion from "../models/SpeakingQuestion.js";
import { parseSpeakingExcel } from "../utils/excelToQuestions.js";
import { transcribeAudio } from "../ai/whisper.js";
import { evaluateSpeaking } from "../ai/evaluateOpenRouter.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// ✅ Upload đề từ Excel
router.post("/upload-speaking", upload.single("file"), async (req, res) => {
    try {
        // ✅ Sửa: thêm await
        const questions = await parseSpeakingExcel(req.file.path);

        for (const q of questions) {
            console.log("✅ Đang thêm câu hỏi:", q);
        }

        await SpeakingQuestion.insertMany(questions);

        res.json({ message: "✅ Đã thêm câu hỏi Speaking", count: questions.length });
    } catch (err) {
        console.error("❌ Lỗi khi upload Speaking:", err);
        res.status(500).json({ error: "❌ Lỗi khi xử lý file Speaking" });
    }
});


// ✅ Lấy toàn bộ đề
router.get("/all", async (req, res) => {
    try {
        const questions = await SpeakingQuestion.find().sort({ part: 1 });
        res.json(questions);
    } catch (err) {
        console.error("❌ Lỗi lấy câu hỏi:", err);
        res.status(500).json({ message: "Không lấy được dữ liệu" });
    }
});

// ✅ Lấy random 1 câu hỏi theo Part
router.get("/random/:part", async (req, res) => {
    try {
        const part = parseInt(req.params.part);
        const questions = await SpeakingQuestion.find({ part });
        if (questions.length === 0) return res.status(404).json({ message: "Không có câu hỏi." });

        const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
        res.json(randomQuestion);
    } catch (err) {
        console.error("❌ Lỗi random:", err);
        res.status(500).json({ message: "Không lấy được câu hỏi." });
    }
});

// ✅ API chấm điểm Speaking (convert .webm → .wav trước khi gửi vào Whisper)
router.post("/evaluate", upload.single("audio"), async (req, res) => {
    const inputPath = req.file.path;
    const wavPath = `${inputPath}.wav`;
    const questionId = req.body.questionId;

    try {
        // 👉 Convert file .webm → .wav
        execSync(`ffmpeg -i ${inputPath} -ar 16000 -ac 1 -c:a pcm_s16le ${wavPath}`);

        // 📘 Nếu có questionId thì lấy nội dung câu hỏi từ DB
        let expectedText = "";
        if (questionId) {
            const question = await SpeakingQuestion.findById(questionId);
            if (question) {
                if (question.text) expectedText = question.text;
                else if (question.context) expectedText = question.context;
                else if (question.questions?.length > 0) expectedText = question.questions[0];
            }
        }

        // 🔈 Whisper nhận file .wav và nội dung câu hỏi (nếu có)
        const result = await transcribeAudio(req.file.path, expectedText);
        const evaluation = await evaluateSpeaking(result.transcript);


        res.json({ transcript: result.transcript, evaluation });
    } catch (err) {
        console.error("❌ Lỗi evaluate:", err);
        res.status(500).json({ message: "Không xử lý được audio." });
    } finally {
        try {
            if (fs.existsSync(inputPath)) fs.unlinkSync(inputPath);
            if (fs.existsSync(wavPath)) fs.unlinkSync(wavPath);
        } catch (unlinkErr) {
            console.warn("⚠️ Không thể xoá file:", unlinkErr.message);
        }
    }
});


export default router;
