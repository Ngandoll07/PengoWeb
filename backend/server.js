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
import crypto from "crypto"; // ✅ Phải import crypto ở đây
import nodemailer from "nodemailer";
import path from "path";
import fetch from "node-fetch";


import ReadingTest from "./models/ReadingTest.js";
import StudyPlan from "./models/StudyPlan.js";
import RoadmapItem from "./models/RoadmapItem.js";
import SpeakingQuestion from "./models/SpeakingQuestion.js";
import { parseSpeakingExcel } from "./utils/excelToQuestions.js";


import uploadReadingRoutes from "./routes/uploadReading.js";
import readingRoutes from "./routes/readingRoutes.js";

import uploadDayReadingRoutes from './routes/uploadDayReading.js';
import dayReadingRoutes from "./routes/dayReadingRoutes.js";
import uploadLessonRoutes from "./routes/uploadLesson.js";
import lessonRoutes from "./routes/lessonRoutes.js";
import recommendRoutes from "./routes/recommend.js";


import uploadListeningRoutes from "./routes/uploadListening.js"; // ✅ Đã sửa đúng vị trí
import listeningRoutes from "./routes/listeningRoutes.js";

import courseRoute from "./routes/courseRoute.js";
import purchaseRoutes from "./routes/purchase.js";

import evaluateRoutes from "./routes/evaluate.js";
import analyzeAI from './routes/ai-analyzeread.js';
import practiceHistoryRoutes from './routes/practiceHistory.js';

import grammarCheckRoute from './routes/grammarCheck.js';
import readingCheckRouter from './routes/readingCheck.js';
import readingCheckRoute from './routes/readingCheck.js';

import uploadWritingRouter from "./routes/uploadWriting.js";
import writingRoutes from "./routes/writing.js";
import groqWritingRoute from './routes/writingscore23.js';

import readingTestsRoutes from "./routes/readingTest.js";
import testResultRoutes from "./routes/testResult.js";

import generateLessonRoutes from "./routes/generateLesson.js";
import lessonResultRouter from "./routes/lessonResult.js";
import gradeLessonRoute from "./routes/gradeLesson.js";
import roadmapRoutes from "./routes/roadmap.js";
import speakingEvaluateRoutes from "./routes/speaking.js";

import uploadLisnRead from "./routes/uploadLisnRead.js";
import questionsRouter from "./routes/questions.js";
import coachRoutes from "./routes/coach.js";


const app = express();
app.use(cors());
app.use(express.json());

// ✅ Mount tất cả routes TRƯỚC khi listen
app.use("/api", uploadDayReadingRoutes);
app.use("/api", dayReadingRoutes);
app.use("/api", uploadLessonRoutes);
app.use("/api", lessonRoutes);
app.use("/api", recommendRoutes);
app.use("/api", evaluateRoutes);


app.use("/api", uploadListeningRoutes); // ✅ Quan trọng!
app.use("/api", listeningRoutes);

app.use("/api", uploadWritingRouter);
app.use("/api", writingRoutes);
app.use('/api/writing', groqWritingRoute);

app.use("/api/test-results", testResultRoutes);

app.use('/api/grammar-check', grammarCheckRoute);
app.use('/api/reading', readingCheckRouter); // ✅ Cho đúng với FE
app.use('/api', readingCheckRoute); // đúng

app.use('/api', analyzeAI); // thêm dòng này
app.use("/api", uploadReadingRoutes); // 👈 đảm bảo dòng này có
app.use('/api', readingRoutes);

app.use('/api/practice-history', practiceHistoryRoutes);
app.use("/api", readingTestsRoutes);

app.use("/api", generateLessonRoutes);
app.use("/api", lessonResultRouter); // ✅ Đường dẫn gốc là /api
app.use("/api", gradeLessonRoute);
app.use("/api/roadmap", roadmapRoutes);
app.use("/api/speaking", speakingEvaluateRoutes);
// MongoDB


app.use("/api", courseRoute);
app.use("/api/purchase", purchaseRoutes);

app.use('/api/grammar-check', grammarCheckRoute);
app.use('/api/reading', readingCheckRouter);
app.use('/api', readingCheckRoute);

app.use("/api/upload-excel-reading", uploadLisnRead);
app.use("/questions", questionsRouter);
app.use("/api/coach", coachRoutes);

// ✅ Route test kết nối backend
app.get("/api/test", (req, res) => {
  res.send("✅ Backend đang hoạt động");
});

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

const JWT_SECRET = "123"; // 👉 Nên để vào .env thay vì hardcode
// MongoDB
mongoose.connect("mongodb://127.0.0.1:27017/Pengo", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
}).then(() => {
  console.log("✅ Đã kết nối MongoDB");
}).catch(err => {
  console.error("❌ Lỗi kết nối MongoDB:", err);
});

// User model
const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  password: String,
  avatar: String,
  role: { type: String, default: "user" },
  createdAt: { type: Date, default: Date.now },
  isLocked: { type: Boolean, default: false },
  resetPasswordToken: String,
  resetPasswordExpires: Date
});
const User = mongoose.model("User", userSchema);

//
// Đăng ký
//
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

//
// Đăng nhập thường
//
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

    if (user.isLocked === true) {
      return res
        .status(403)
        .json({ message: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên." });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ message: "Đăng nhập thành công!", token, user });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Đăng nhập thất bại!" });
  }
});

//
// Đăng nhập bằng Google
//
app.post("/api/google-login", async (req, res) => {
  try {
    const { email, name, avatar } = req.body;

    let user = await User.findOne({ email });

    if (!user) {
      // Nếu chưa có thì tạo mới
      user = new User({
        email,
        name,
        avatar,
        password: "", // Google login không cần password
        role: "user",
        isLocked: false,
      });
      await user.save();
    }

    if (user.isLocked) {
      return res
        .status(403)
        .json({ message: "Tài khoản của bạn đã bị khóa. Vui lòng liên hệ quản trị viên." });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ message: "Đăng nhập Google thành công!", token, user });
  } catch (err) {
    console.error("Google login error:", err);
    res.status(500).json({ message: "Đăng nhập Google thất bại!" });
  }
});

//
// Lấy danh sách user
//
app.get("/api/users", async (req, res) => {
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: "Lỗi server khi lấy danh sách user!" });
  }
});

//
// Khóa/mở khóa user
//
app.put("/api/users/:id/lock", async (req, res) => {
  try {
    const { isLocked } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { isLocked },
      { new: true }
    );
    if (!user) return res.status(404).json({ message: "User not found" });
    res.json(user);
  } catch (err) {
    console.error("Error locking user:", err);
    res.status(500).json({ message: "Server error" });
  }
});
//
// Đổi mật khẩu
//
app.put("/api/users/change-password", async (req, res) => {
  try {
    const { userId, currentPassword, newPassword } = req.body;

    if (!userId || !currentPassword || !newPassword) {
      return res.status(400).json({ message: "Thiếu thông tin!" });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: "Không tìm thấy người dùng!" });
    }

    // Nếu user login bằng Google thì có thể không có password
    if (!user.password) {
      return res.status(400).json({ message: "Tài khoản này không thể đổi mật khẩu (Google login)!" });
    }

    // Kiểm tra mật khẩu cũ
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
      return res.status(400).json({ message: "Mật khẩu hiện tại không đúng!" });
    }

    // Hash mật khẩu mới
    const hashed = await bcrypt.hash(newPassword, 10);
    user.password = hashed;
    await user.save();

    res.json({ message: "Đổi mật khẩu thành công!" });
  } catch (err) {
    console.error("Change password error:", err);
    res.status(500).json({ message: "Lỗi server khi đổi mật khẩu!" });
  }
});
// =============================
// Quên mật khẩu
// =============================
// Forgot password
app.post("/api/forgot-password", async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ message: "Vui lòng nhập email!" });

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Email không tồn tại!" });

    const token = crypto.randomBytes(32).toString("hex");
    user.resetPasswordToken = token;
    user.resetPasswordExpires = Date.now() + 15 * 60 * 1000; // 15 phút
    await user.save();

    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.status(500).json({ message: "Server chưa cấu hình email!" });
    }

    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const resetUrl = `http://localhost:3000/reset-password/${token}`;

    // ... trong route forgot-password
    await transporter.sendMail({
      from: `"Support" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Đặt lại mật khẩu",
      html: `<p>Nhấn vào link để đặt lại mật khẩu:</p>
         <a href="${resetUrl}">${resetUrl}</a>
         <p>Link chỉ có hiệu lực 15 phút.</p>`,
    });


    res.json({ message: "Email đặt lại mật khẩu đã được gửi!" });
  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ message: "Lỗi server khi gửi email!" });
  }
});
// =============================
// Reset mật khẩu
// =============================
app.post("/api/reset-password/:token", async (req, res) => {
  try {
    const { token } = req.params;
    const { newPassword } = req.body;

    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) return res.status(400).json({ message: "Token không hợp lệ hoặc đã hết hạn!" });

    user.password = await bcrypt.hash(newPassword, 10);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.json({ message: "Đặt lại mật khẩu thành công!" });
  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ message: "Lỗi server!" });
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

// ✅ Upload đề Speaking từ Excel
app.post("/api/speaking/upload", multer({ dest: "uploads/" }).single("file"), async (req, res) => {
  try {
    const questions = await parseSpeakingExcel(req.file.path);
    fs.unlinkSync(req.file.path);

    // Lọc ra các câu hỏi chưa tồn tại (ID chưa có)
    const ids = questions.map(q => q.id);
    const existing = await SpeakingQuestion.find({ id: { $in: ids } }).select("id");
    const existingIds = new Set(existing.map(e => e.id));

    const newQuestions = questions.filter(q => !existingIds.has(q.id));

    if (newQuestions.length === 0) {
      return res.status(200).json({ message: "❗Tất cả ID trong file đã tồn tại.", count: 0 });
    }

    await SpeakingQuestion.insertMany(newQuestions);
    res.json({
      message: `✅ Đã thêm ${newQuestions.length} câu mới. (${questions.length - newQuestions.length} bị bỏ qua do trùng ID)`,
      count: newQuestions.length,
    });
  } catch (err) {
    console.error("❌ Lỗi upload:", err);
    res.status(500).json({ message: "Lỗi xử lý file Excel" });
  }
});


// ✅ Lấy toàn bộ đề Speaking
app.get("/api/speaking/all", async (req, res) => {
  try {
    const questions = await SpeakingQuestion.find().sort({ part: 1 });
    res.json(questions);
  } catch (err) {
    console.error("❌ Lỗi lấy đề Speaking:", err);
    res.status(500).json({ message: "Không thể lấy danh sách đề Speaking" });
  }
});
// ✅ Xoá toàn bộ câu hỏi Speaking
app.delete("/api/speaking/clear", async (req, res) => {
  try {
    await SpeakingQuestion.deleteMany({});
    res.json({ message: "🧹 Đã xoá toàn bộ câu hỏi Speaking" });
  } catch (err) {
    console.error("❌ Lỗi xoá toàn bộ:", err);
    res.status(500).json({ message: "Không thể xoá toàn bộ dữ liệu" });
  }
});

// ✅ Xoá một câu hỏi Speaking theo _id
app.delete("/api/speaking/:id", async (req, res) => {
  try {
    const result = await SpeakingQuestion.findByIdAndDelete(req.params.id);
    if (!result) {
      return res.status(404).json({ message: "❌ Không tìm thấy câu hỏi để xoá" });
    }
    res.json({ message: "🗑️ Đã xoá thành công" });
  } catch (err) {
    console.error("❌ Lỗi xoá câu hỏi:", err);
    res.status(500).json({ message: "Lỗi server khi xoá câu hỏi" });
  }
});

// ✅ Lấy 1 câu hỏi ngẫu nhiên theo Part (1–5)
app.get("/api/speaking/random/:part", async (req, res) => {
  const part = parseInt(req.params.part);
  if (![1, 2, 3, 4, 5].includes(part)) {
    return res.status(400).json({ message: "Part không hợp lệ (chỉ 1–5)" });
  }

  try {
    const count = await SpeakingQuestion.countDocuments({ part });
    const randomIndex = Math.floor(Math.random() * count);
    const randomQuestion = await SpeakingQuestion.findOne({ part }).skip(randomIndex);
    if (!randomQuestion) {
      return res.status(404).json({ message: "Không tìm thấy câu hỏi nào" });
    }
    res.json(randomQuestion);
  } catch (err) {
    console.error("❌ Lỗi lấy câu hỏi ngẫu nhiên:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});


// Trang gốc
app.get("/", (req, res) => {
  res.send("✅ Backend Pengo đang hoạt động!");
});

// ✅ Start server cuối cùng
app.listen(5000, () => {
  console.log("🚀 Backend chạy tại http://localhost:5000");
});
