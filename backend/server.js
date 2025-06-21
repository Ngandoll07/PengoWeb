
import dotenv from "dotenv";
dotenv.config();

import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import multer from "multer";
import xlsx from "xlsx";
import fs from "fs";
import path from "path";
import fetch from "node-fetch";

import ReadingTest from "./models/ReadingTest.js";
import StudyPlan from "./models/StudyPlan.js";
import uploadReadingRoutes from "./routes/uploadReading.js";
import readingRoutes from "./routes/readingRoutes.js";
import uploadListeningRoutes from "./routes/uploadListening.js";
import listeningRoutes from "./routes/listeningRoutes.js";
import courseRoute from "./routes/courseRoute.js";




const app = express();
app.use(cors());
app.use(express.json());


// MongoDB

mongoose.connect("mongodb://127.0.0.1:27017/Pengo", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("✅ Đã kết nối MongoDB");
}).catch(err => {
    console.error("❌ Lỗi kết nối MongoDB:", err);
});

const JWT_SECRET = "123";

// User model
const userSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: String,
    role: { type: String, default: "user" },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model("User", userSchema);

// Đăng ký
app.post("/api/register", async (req, res) => {
    const { email, password } = req.body;
    try {
        const hashed = await bcrypt.hash(password, 10);
        const newUser = new User({ email, password: hashed });
        await newUser.save();
        res.status(201).json({ message: "Đăng ký thành công!" });
    } catch (err) {
        if (err.code === 11000) {
            res.status(400).json({ message: "Email đã tồn tại!" });
        } else {
            res.status(500).json({ message: "Đăng ký thất bại!" });
        }
    }
});

// Đăng nhập
app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: "Tài khoản không tồn tại!" });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: "Mật khẩu không đúng!" });

        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: "1d" }
        );

        res.json({ message: "Đăng nhập thành công!", token, user });
    } catch (err) {
        res.status(500).json({ message: "Đăng nhập thất bại!" });
    }
});

// Lấy danh sách user
app.get("/api/users", async (req, res) => {
    try {
        const users = await User.find().select("-password");
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: "Lỗi server khi lấy danh sách user!" });
    }
});

// Lấy đề đọc
app.get("/api/reading-tests", async (req, res) => {
    try {
        const tests = await ReadingTest.find();
        res.json(tests);
    } catch (err) {
        res.status(500).json({ message: "Lỗi khi lấy danh sách đề" });
    }
});

// API đề xuất lộ trình học từ Groq
app.post("/api/recommend", async (req, res) => {

    const { listeningScore, readingScore, targetScore, studyDuration } = req.body;
    const token = req.headers.authorization?.split(" ")[1];


    const prompt = `
Tôi là học viên đang luyện thi TOEIC.
Kết quả đầu vào:
- Listening: ${listeningScore}/50
- Reading: ${readingScore}/50


🎯 Mục tiêu của tôi là đạt khoảng ${targetScore} điểm TOEIC.
⏰ Tôi có khoảng ${studyDuration} để luyện thi.

Hãy:
1. Phân tích điểm mạnh, điểm yếu của tôi.
2. Đề xuất một lộ trình học phù hợp với mục tiêu và thời gian học.
3. Chia rõ theo từng tuần và từng kỹ năng nếu có thể.
`;

    try {
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {

            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.1-8b-instant",
                messages: [{ role: "user", content: prompt }],
                temperature: 0.7
            })
        });

        const data = await response.json();
        console.log("🧠 Groq response:", JSON.stringify(data, null, 2));

        let suggestion = "Không có phản hồi từ Groq.";
        if (Array.isArray(data.choices) && data.choices[0]?.message?.content) {
            suggestion = data.choices[0].message.content;
        }


        if (token) {
            try {
                const decoded = jwt.verify(token, JWT_SECRET);
                const plan = new StudyPlan({
                    userId: decoded.userId,
                    listeningScore,
                    readingScore,
                    suggestion
                });
                await plan.save();
            } catch {
                console.warn("⚠️ Token không hợp lệ hoặc hết hạn, không lưu lộ trình.");
            }
        }

        res.json({ suggestion });
    } catch (err) {
        console.error("❌ Lỗi khi gọi Groq:", err);
        res.status(500).json({ error: "Không thể tạo lộ trình học từ Groq." });
    }
});

// Mount routes
app.use("/api", uploadReadingRoutes);
app.use("/api", readingRoutes);

// Trang gốc
app.get("/", (req, res) => {
    res.send("✅ Backend Pengo đang hoạt động!");
});

// Start server
app.listen(5000, () => {
    console.log("🚀 Backend chạy tại http://localhost:5000");
});


app.use("/api", uploadListeningRoutes);
app.use("/api", listeningRoutes);

app.use("/api", courseRoute);


