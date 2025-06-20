// backend/server.js
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");    
const multer = require("multer");
const xlsx = require("xlsx");
const path = require("path");
const fs = require("fs");
const ReadingTest = require("./models/ReadingTest"); // <-- Đảm bảo đúng path!

const upload = multer({ dest: "uploads/" }); // tạo thư mục nếu chưa có
const uploadReadingRoutes = require("./routes/uploadReading"); // Import đúng


const app = express();
app.use(cors());
app.use(express.json());

app.use("/api", uploadReadingRoutes); // Mount đúng route
app.use("/api", require("./routes/readingRoutes"))

// Kết nối MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/Pengo", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => {
    console.log("✅ Đã kết nối MongoDB");
}).catch(err => {
    console.error("❌ Lỗi kết nối MongoDB:", err);
});

// Secret key cho JWT (nên đưa vào biến môi trường .env khi deploy)
const JWT_SECRET = "123";

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

// ✅ API Đăng nhập
app.post("/api/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Tài khoản không tồn tại!" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Mật khẩu không đúng!" });
        }

        // Tạo token
        const token = jwt.sign(
            { userId: user._id, email: user.email, role: user.role },
            JWT_SECRET,
            { expiresIn: "1d" } // Token hết hạn sau 1 ngày
        );

        res.json({ message: "Đăng nhập thành công!", token, user });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Đăng nhập thất bại!" });
    }
});
// ✅ API mới: Lấy danh sách user (cho admin)
app.get("/api/users", async (req, res) => {
    try {
        const users = await User.find().select("-password"); // Ẩn password
        res.json(users);
    } catch (err) {
        res.status(500).json({ message: "Lỗi server khi lấy danh sách user!" });
    }
});

// Trang gốc (tuỳ chọn)
app.get("/", (req, res) => {
    res.send("✅ Backend Pengo đang hoạt động!");
});
// GET /api/reading-tests
app.get("/api/reading-tests", async (req, res) => {
    try {
        const tests = await ReadingTest.find();
        res.json(tests);
    } catch (err) {
        res.status(500).json({ message: "Lỗi khi lấy danh sách đề" });
    }
});

// Khởi động server
app.listen(5000, () => {
    console.log("🚀 Backend chạy tại http://localhost:5000");
});
