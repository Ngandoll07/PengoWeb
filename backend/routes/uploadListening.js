import express from "express";
import multer from "multer";
import fs from "fs";
import ListeningQuestion from "../models/ListeningQuestion.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

router.post("/upload-listening", upload.single("file"), async (req, res) => {
    try {
        const raw = fs.readFileSync(req.file.path, "utf-8");
        const questions = JSON.parse(raw);
        await ListeningQuestion.insertMany(questions);
        fs.unlinkSync(req.file.path);
        res.status(201).json({ message: "Upload thành công", count: questions.length });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Upload thất bại" });
    }
});

// Route xoá tất cả câu hỏi Listening
// router.delete("/listening/clear", async (req, res) => {
//     try {
//         await ListeningQuestion.deleteMany({});
//         res.json({ message: "🧹 Đã xoá toàn bộ câu hỏi Listening" });
//     } catch (err) {
//         console.error("❌ Lỗi xoá Listening:", err);
//         res.status(500).json({ message: "Lỗi server khi xoá" });
//     }
// });

export default router;
