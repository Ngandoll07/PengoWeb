// backend/routes/recommend.js
import express from "express";
import jwt from "jsonwebtoken";
import fetch from "node-fetch";
import StudyPlan from "../models/StudyPlan.js";
import UserLessonResult from "../models/UserLessonResult.js";

const router = express.Router();

// Đổi qua env nếu có
const JWT_SECRET = process.env.JWT_SECRET || "123";
const GROQ_API_KEY = process.env.GROQ_API_KEY || "";

/** Helper: gom thống kê label của Day 0 (test đầu vào) */
async function getLabelStats(userId) {
  const rows = await UserLessonResult.aggregate([
    { $match: { userId, day: 0 } }, // chỉ test đầu vào
    { $unwind: "$answers" },
    {
      $group: {
        _id: { skill: "$skill", part: "$part", label: "$answers.label" },
        total: { $sum: 1 },
        correct: { $sum: { $cond: ["$answers.isCorrect", 1, 0] } },
      },
    },
    {
      $project: {
        skill: "$_id.skill",
        part: "$_id.part",
        label: "$_id.label",
        total: 1,
        correct: 1,
        accuracy: {
          $cond: [
            { $gt: ["$total", 0] },
            { $multiply: [{ $divide: ["$correct", "$total"] }, 100] },
            0,
          ],
        },
      },
    },
    { $sort: { accuracy: 1, total: -1 } },
  ]);
  return rows;
}

/** Helper: pick nhãn yếu nhất theo skill/part (nếu có) */
function pickWeakLabel(labelStats, skill, part) {
  return (
    labelStats.find((r) => r.skill === skill && Number(r.part) === Number(part))
      ?.label || null
  );
}

/** Helper: chuẩn hoá 1 kế hoạch Day 1 */
function sanitizeDay1(raw, labelStats, prefSkillFromScore) {
  let skill =
    raw?.skill === "reading" ? "reading" : raw?.skill === "listening" ? "listening" : null;

  // Nếu AI không trả skill, chọn theo điểm đầu vào (ưu tiên skill yếu hơn)
  if (!skill) skill = prefSkillFromScore || "listening";

  let part = Number(raw?.part);
  if (skill === "listening") {
    if (!Number.isFinite(part)) part = 1;
    part = Math.min(4, Math.max(1, part)); // 1..4
  } else {
    if (!Number.isFinite(part)) part = 5;
    part = Math.min(7, Math.max(5, part)); // 5..7
  }

  const level = ["easy", "medium", "hard"].includes(raw?.level) ? raw.level : "easy";

  return {
    day: 1,
    title:
      raw?.title ||
      (skill === "listening" ? "Luyện nghe TOEIC" : "Luyện đọc TOEIC"),
    skill,
    part,
    level,
    status: "pending",
    progress: 0,
    type: "lesson",
    labelFocus: raw?.labelFocus || pickWeakLabel(labelStats, skill, part),
  };
}

/** POST /api/recommend
 * - Phân tích test đầu vào (Day 0) + gợi ý Day 1
 * - Lưu StudyPlan chỉ với **1** item Day 1
 */
router.post("/recommend", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Thiếu token!" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    const {
      listeningScore = 0,
      readingScore = 0,
      targetScore = 600,
      studyDuration = 6,
    } = req.body || {};

    // 1) Label stats từ Day 0
    const labelStats = await getLabelStats(userId);

    // Quyết định skill ưu tiên nếu AI fail: ưu tiên skill có điểm thấp hơn
    const prefSkillFromScore =
      Number(readingScore) <= Number(listeningScore) ? "reading" : "listening";

    // 2) Gọi AI (nếu có key), yêu cầu trả đúng JSON
    let analysis = "";
    let day1Plan = null;

    if (GROQ_API_KEY) {
      const prompt = `
Bạn là trợ lý học TOEIC.
Kết quả đầu vào:
- Listening: ${listeningScore}/450
- Reading: ${readingScore}/450
Mục tiêu: ~${targetScore} trong ${studyDuration} tuần.

Nhãn yếu theo test đầu vào (accuracy thấp trước):
${JSON.stringify(labelStats)}

Chỉ trả về **JSON hợp lệ**:
{
  "analysis": "nhận xét ngắn gọn 2-4 câu",
  "plan": [
    {
      "day": 1,
      "title": "Tên bài học",
      "skill": "listening|reading",
      "part": SỐ,
      "level": "easy|medium|hard",
      "status": "pending",
      "progress": 0,
      "type": "lesson",
      "labelFocus": "..."
    }
  ]
}
`.trim();

      try {
        const aiRes = await fetch(
          "https://api.groq.com/openai/v1/chat/completions",
          {
            method: "POST",
            headers: {
              Authorization: `Bearer ${GROQ_API_KEY}`,
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              model: "llama-3.1-8b-instant",
              messages: [{ role: "user", content: prompt }],
              temperature: 0.5,
            }),
          }
        );

        const data = await aiRes.json();
        let content = data?.choices?.[0]?.message?.content || "{}";
        const s = content.indexOf("{");
        const e = content.lastIndexOf("}");
        if (s !== -1 && e !== -1) content = content.slice(s, e + 1);

        const parsed = JSON.parse(content);
        analysis =
          typeof parsed.analysis === "string"
            ? parsed.analysis
            : JSON.stringify(parsed.analysis || "");
        const rawPlan = Array.isArray(parsed.plan) ? parsed.plan : [];
        const rawDay1 =
          rawPlan.find((p) => Number(p?.day) === 1) || rawPlan[0] || {};
        day1Plan = sanitizeDay1(rawDay1, labelStats, prefSkillFromScore);
      } catch (e) {
        // AI lỗi → fallback
        day1Plan = sanitizeDay1({}, labelStats, prefSkillFromScore);
        analysis =
          analysis ||
          `Điểm mạnh/yếu: Listening: ${listeningScore}/450, Reading: ${readingScore}/450. 
Cần tập trung vào kỹ năng ${prefSkillFromScore} và các nhãn có độ chính xác thấp.`;
      }
    } else {
      // Không có GROQ_API_KEY → fallback
      day1Plan = sanitizeDay1({}, labelStats, prefSkillFromScore);
      analysis = `Điểm mạnh/yếu: Listening: ${listeningScore}/450, Reading: ${readingScore}/450. 
Cần tập trung vào kỹ năng ${prefSkillFromScore} và các nhãn có độ chính xác thấp.`;
    }

    // 3) Ghi đè StudyPlan chỉ với **1** item
    await StudyPlan.deleteMany({ userId });
    await new StudyPlan({
      userId,
      listeningScore,
      readingScore,
      suggestion: [day1Plan],
      analysis: JSON.stringify(analysis),
    }).save();

    return res.json({ analysis, plan: [day1Plan] });
  } catch (err) {
    console.error("❌ /api/recommend error:", err);
    return res.status(500).json({ error: "Không thể gợi ý lộ trình." });
  }
});

/** GET /api/recommend
 * - Trả lại analysis + **1** Day 1 đã lưu trong StudyPlan
 */
router.get("/recommend", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Thiếu token!" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;

    const last = await StudyPlan.findOne({ userId })
      .sort({ createdAt: -1 })
      .lean();

    if (!last) return res.json({ analysis: "", suggestion: [] });

    const all = Array.isArray(last.suggestion) ? last.suggestion : [];
    const one = all.find((p) => Number(p?.day) === 1) || all[0] || null;

    return res.json({
      analysis: last.analysis ? JSON.parse(last.analysis) : "",
      suggestion: one ? [one] : [],
    });
  } catch (e) {
    console.error("❌ GET /api/recommend error:", e);
    return res.status(500).json({ error: "Không lấy được lộ trình đã lưu." });
  }
});

export default router;
