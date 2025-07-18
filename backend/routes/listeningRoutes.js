import express from "express";
import ListeningQuestion from "../models/ListeningQuestion.js";

const router = express.Router();

router.get("/listening-tests/part/:partNumber", async (req, res) => {
    const part = parseInt(req.params.partNumber);
    const level = req.query.level;

    if (isNaN(part)) {
        return res.status(400).json({ message: "Part không hợp lệ!" });
    }

    // ✅ Nếu có level thì thêm vào query
    const query = { part };
    if (level && ["easy", "medium", "hard"].includes(level)) {
        query.level = level;
    }

    try {
        const questions = await ListeningQuestion.find(query);
        res.json(questions);
    } catch (err) {
        console.error("❌ Lỗi tải câu hỏi:", err);
        res.status(500).json({ message: "Lỗi server!" });
    }
});


export default router;
