// backend/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");

const app = express();
app.use(cors());
app.use(express.json());

// Kết nối MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/Pengo", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("✅ Đã kết nối MongoDB");
}).catch(err => {
    console.error("❌ Lỗi kết nối MongoDB:", err);
});

// Schema user
const UserSchema = new mongoose.Schema({
    email: { type: String, required: true, unique: true },
    password: String,
    role: { type: String, default: "user" },
    createdAt: { type: Date, default: Date.now }
});

const User = mongoose.model("User", UserSchema);

// API Đăng ký
app.post("/api/register", async (req, res) => {
    const { email, password } = req.body;

    try {
        // Mã hóa mật khẩu
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

// Khởi động server
app.listen(5000, () => {
    console.log("🚀 Backend chạy tại http://localhost:5000");
});
