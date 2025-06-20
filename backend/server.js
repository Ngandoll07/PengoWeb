require("dotenv").config();
const express = require("express");
const app = express();

const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const xlsx = require("xlsx");
const fs = require("fs");
const path = require("path");

const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const ReadingTest = require("./models/ReadingTest");
const StudyPlan = require("./models/StudyPlan");
const uploadReadingRoutes = require("./routes/uploadReading");

app.use(cors());
app.use(express.json());

// Mount routes
app.use("/api", uploadReadingRoutes);
app.use("/api", require("./routes/readingRoutes"));

// MongoDB connection
mongoose.connect("mongodb://127.0.0.1:27017/Pengo", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("✅ Đã kết nối MongoDB");
}).catch(err => {
    console.error("❌ Lỗi kết nối MongoDB:", err);
});

// JWT secret
const JWT_SECRET = "123";

// User schema
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: String,
    role: { type: String, default: "user" },
    createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model("User", UserSchema);

// Đăng ký
app.post("/api/register", async (req, res) => {
    const { email, password } = req.body;
    try {
        const hashedPassword = await bcrypt.hash(password, 10);
        const newUser = new User({ email, password: hashedPassword });
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

// Gợi ý lộ trình học dùng Gemini API thủ công (v1)
app.post("/api/recommend", async (req, res) => {
    const { listeningScore, readingScore } = req.body;
    const token = req.headers.authorization?.split(" ")[1];

    const prompt = `
Tôi là học viên đang luyện thi TOEIC.
Kết quả đầu vào của tôi là:
- Listening: ${listeningScore}/50
- Reading: ${readingScore}/50

Hãy:
1. Phân tích điểm mạnh, điểm yếu của tôi.
2. Đề xuất một lộ trình học trong 4 tuần.
3. Chia rõ theo từng tuần và từng kỹ năng nếu có thể.
`;

    try {
        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({ error: "Thiếu GEMINI_API_KEY trong .env" });
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1/models/gemini-pro:generateContent?key=${process.env.GEMINI_API_KEY}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                contents: [{ parts: [{ text: prompt }] }]
            })
        });

        const data = await response.json();
        console.log("📦 Gemini raw response:", JSON.stringify(data, null, 2));

        const suggestion = data?.candidates?.[0]?.content?.parts?.[0]?.text ||
            "⚠️ Gemini không trả lời nội dung nào. Vui lòng thử lại sau.";

        // Lưu nếu user đăng nhập
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
            } catch (err) {
                console.warn("⚠️ Token không hợp lệ hoặc hết hạn, không lưu lộ trình.");
            }
        }

        res.json({ suggestion });

    } catch (err) {
        console.error("❌ Lỗi khi gọi Gemini:", err);
        res.status(500).json({
            error: "Không thể tạo lộ trình học từ Gemini.",
            debug: err.message || err
        });
    }
});

// Trang gốc
app.get("/", (req, res) => {
    res.send("✅ Backend Pengo đang hoạt động!");
});

// Chạy server
app.listen(5000, () => {
    console.log("🚀 Backend chạy tại http://localhost:5000");
});
