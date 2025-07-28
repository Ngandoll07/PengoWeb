// routes/roadmap.js
import express from "express";
import jwt from "jsonwebtoken";
import RoadmapItem from "../models/RoadmapItem.js";
import fetch from "node-fetch";
import UserLessonResult from "../models/UserLessonResult.js";     

const router = express.Router();
const JWT_SECRET = "123";

// PUT: Cập nhật tiến độ
router.put("/:id/progress", async (req, res) => {
  const { progress, status } = req.body;
  const { id } = req.params;

  try {
    const item = await RoadmapItem.findByIdAndUpdate(
      id,
      { progress, status },
      { new: true }
    );
    res.json(item);
  } catch (err) {
    console.error("❌ Lỗi cập nhật tiến độ:", err);
    res.status(500).json({ error: "Không thể cập nhật tiến độ." });
  }
});

router.post("/next-day", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Thiếu token!" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;
    const { currentDay } = req.body;

    // 🔍 Lấy kết quả bài học hiện tại
   const currentResult = await UserLessonResult
  .findOne({ userId, day: currentDay })
  .sort({ createdAt: -1 }); // lấy kết quả mới nhất

    if (!currentResult) return res.status(400).json({ error: "Chưa có kết quả của ngày này" });

    // 🛑 CHẶN nếu chưa hoàn thành
    if (currentResult.score < 50) {
      return res.status(400).json({ error: "Bài học hiện tại chưa đủ điều kiện để tạo ngày tiếp theo." });
    }

    const { score, skill, part, level } = currentResult;
    const nextDay = currentDay + 1;
let skillHistoryNote = "";

// 🧠 Bỏ qua nếu chưa có 5 ngày học trước đó
if (currentDay >= 5) {
  const lastFiveDays = await UserLessonResult
    .find({ userId })
    .sort({ day: -1 })
    .limit(5);

  const skillHistory = lastFiveDays.map(r => r.skill).join(", ");
  skillHistoryNote = `\n5 ngày gần nhất học kỹ năng: ${skillHistory}`;
}

    let prompt = "";

    // 📌 Nếu là Mini Test (mỗi 5 ngày)
    if (nextDay % 5 === 0) {
      // Đảm bảo không vượt quá Part tối đa
const maxPart = skill === "listening" ? 4 : 7;

// Lấy phần cao nhất mà user đã học cho kỹ năng đó
const pastParts = await UserLessonResult.find({ userId, skill }).sort({ part: -1 });
const highestPartLearned = pastParts?.[0]?.part || part;
const miniTestPart = Math.min(highestPartLearned, maxPart);


  prompt = `
Tôi vừa hoàn thành ngày ${currentDay} với:
- Skill: ${skill}
- Part: ${part}
- Level: ${level}
- Score: ${score}%
${skillHistoryNote}

🎯 Hãy đề xuất bài Mini Test tổng hợp cho ngày ${nextDay}, tuân theo quy tắc:

- Độ khó:
  + ≥ 80%: hard
  + 60–79%: medium
  + < 60%: easy
- Skill giữ nguyên: ${skill}
- Part của Mini Test là **phần cao nhất mà người học đã học trước đó trong kỹ năng này**: Part ${miniTestPart}

Trả JSON:
{
  "day": ${nextDay},
  "title": "Mini Test - TOEIC Part ${miniTestPart}",
  "skill": "${skill}",
  "part": ${miniTestPart},
  "level": "${score >= 80 ? "hard" : score >= 60 ? "medium" : "easy"}",
  "status": "pending",
  "progress": 0,
  "type": "minitest"
}
⚠️ Chỉ trả JSON hợp lệ, không thêm mô tả, không chú thích!
`;
}
 else {
      // 🔁 Học bình thường ➝ tăng level hoặc sang part nếu đủ điều kiện
     prompt = `
Tôi vừa hoàn thành ngày ${currentDay} với:
- Skill: ${skill}
- Part: ${part}
- Level: ${level}
- Score: ${score}%

📘 Hãy đề xuất bài học tiếp theo cho ngày ${nextDay} theo các quy tắc sau:

1. Nếu Score ≥ 60%:
   - Nếu Level là "easy", nâng lên "medium"
   - Nếu "medium", nâng lên "hard"
   - Nếu "hard" và Score ≥ 70% ➝ sang Part tiếp theo và quay lại "easy"
2. Nếu Score < 60% ➝ giữ nguyên hoặc giảm Level, không thay đổi Part
3. KHÔNG BAO GIỜ chuyển sang Part tiếp theo nếu chưa hoàn thành level "hard" của Part hiện tại
4. Sau mỗi 5 ngày học cùng một kỹ năng (ví dụ listening), hãy chuyển sang kỹ năng còn lại (ví dụ reading)
5. Nếu vừa hoàn thành kỹ năng "listening", và đã học liên tục 5 ngày listening, hãy chuyển sang "reading" bắt đầu từ part 5, level easy
6. Nếu đang ở skill "reading" thì áp dụng quy tắc như trên để quay về "listening" khi học đủ 5 ngày
7. Các Part hợp lệ:
   - Nếu skill là "listening" ➝ chỉ được chọn Part từ 1 đến 4
   - Nếu skill là "reading" ➝ chỉ được chọn Part từ 5 đến 7

Trả JSON:
{
  "day": ${nextDay},
  "title": "Tên bài học",
  "skill": "listening | reading",
  "part": Số nguyên,
  "level": "easy | medium | hard",
  "status": "pending",
  "progress": 0
}
⚠️ Chỉ trả JSON hợp lệ, không thêm mô tả, không chú thích!
`;

    }

    const aiRes = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.5,
      }),
    });

    const data = await aiRes.json();
    let content = data.choices?.[0]?.message?.content || "{}";

// 👉 Tự động trích đoạn JSON nếu AI trả lẫn văn bản
const jsonStart = content.indexOf("{");
const jsonEnd = content.lastIndexOf("}");
if (jsonStart !== -1 && jsonEnd !== -1) {
  content = content.slice(jsonStart, jsonEnd + 1);
}

let plan;
try {
  plan = JSON.parse(content);
} catch (parseErr) {
  console.error("❌ Không thể parse JSON AI trả về:", content);
  return res.status(500).json({ error: "Phản hồi từ AI không hợp lệ." });
}


    const newItem = new RoadmapItem({ ...plan, userId });
    await newItem.save();

    res.json({ item: newItem });
  } catch (err) {
    console.error("❌ Lỗi tạo lộ trình:", err);
    res.status(500).json({ error: "Không thể tạo lộ trình mới." });
  }
});
// ✅ GET: Lấy lộ trình
router.get("/", async (req, res) => {
  const { userId } = req.query;

  try {
    let items;

    if (userId) {
      // 👤 Người học chỉ lấy roadmap của họ
      items = await RoadmapItem.find({ userId }).sort({ day: 1 });
    } else {
      // 👨‍💼 Admin lấy toàn bộ roadmap
      items = await RoadmapItem.find().sort({ day: 1 }).populate("userId", "name email");
    }

    res.json(items);
  } catch (err) {
    console.error("❌ Lỗi khi lấy roadmap:", err);
    res.status(500).json({ error: "Không thể lấy dữ liệu lộ trình." });
  }
});


export default router;
