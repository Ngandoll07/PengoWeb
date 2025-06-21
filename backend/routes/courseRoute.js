import express from "express";
import multer from "multer";
import fs from "fs";
import Course from "../models/Course.js";

const router = express.Router();
const upload = multer({ dest: "uploads/" });

// 📤 API upload file JSON chứa danh sách khóa học
router.post("/upload-courses", upload.single("file"), async (req, res) => {
    try {
        const raw = fs.readFileSync(req.file.path, "utf-8");
        const courses = JSON.parse(raw);

        await Course.insertMany(courses); // ghi toàn bộ vào MongoDB
        fs.unlinkSync(req.file.path); // xoá file sau khi xử lý

        res.status(201).json({ message: "✅ Đã upload thành công", count: courses.length });
    } catch (err) {
        console.error("❌ Lỗi upload:", err);
        res.status(500).json({ message: "❌ Upload thất bại" });
    }
});

// 📥 API lấy tất cả khoá học
router.get("/courses", async (req, res) => {
    try {
        const all = await Course.find();
        res.json(all);
    } catch (err) {
        res.status(500).json({ message: "Lỗi server" });
    }
});

export default router;
