import express from "express";
import ListeningQuestion from "../models/ListeningQuestion.js";

const router = express.Router();

router.get("/listening-tests/part/:partNumber", async (req, res) => {
    const part = parseInt(req.params.partNumber);
    try {
        const questions = await ListeningQuestion.find({ part });
        res.json(questions);
    } catch (err) {
        console.error("Lỗi tải Listening:", err);
        res.status(500).json({ message: "Lỗi server!" });
    }
});

export default router;
