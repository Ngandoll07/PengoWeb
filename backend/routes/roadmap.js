// routes/roadmap.js — USER-SCOPED + DAILY BUDGET + GROUP ROUNDING + FORCE REBUILD
import express from "express";
import jwt from "jsonwebtoken";
import RoadmapItem from "../models/RoadmapItem.js";
import StudyPlan from "../models/StudyPlan.js";
import UserLessonResult from "../models/UserLessonResult.js";
import { pickListeningIds, pickReadingIds } from "../utils/questionPicker.js";

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || "123";

/* ================== CẤU HÌNH ================== */

// Ngân sách tổng mỗi ngày (để người học tiêu ~20–30 phút)
const DAILY_BUDGET = 10;

// Đơn vị “nhóm câu” của từng Part (để không xén lẻ bộ)
const GROUP_UNIT = {
  listening: { 1: 6, 2: 1, 3: 3, 4: 3 },
  reading: { 5: 1, 6: 4, 7: 5 },
};

// Giới hạn cứng theo Part (để không lố)
const DEFAULT_COUNTS = {
  listening: { 1: 6, 2: 10, 3: 12, 4: 12 },
  reading: { 5: 10, 6: 16, 7: 20 },
};

const MAX_PART = { listening: 4, reading: 7 };
const DEFAULT_SECONDARY_PART = { listening: 2, reading: 5 };

/** Làm tròn ngân sách theo GROUP_UNIT của part.
 *  - mode "nearest": làm tròn gần nhất (5 với unit=3 → 6)
 *  - luôn >= 1 group (hoặc 1 câu với unit=1)
 *  - không vượt DEFAULT_COUNTS
 */
function roundedNeed(skill, part, budget, mode = "nearest") {
  const unit = GROUP_UNIT[skill]?.[part] ?? 1;
  const hardMax = DEFAULT_COUNTS[skill]?.[part] ?? Math.max(budget, unit);
  if (unit <= 1) return Math.max(1, Math.min(budget, hardMax));

  const ratio = budget / unit;
  const k =
    mode === "up" ? Math.max(1, Math.ceil(ratio)) :
      mode === "down" ? Math.max(1, Math.floor(ratio)) :
    /* nearest */         Math.max(1, Math.round(ratio));

  return Math.min(k * unit, hardMax);
}

/* ================== AUTH ================== */
function requireAuth(req, res, next) {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "Thiếu token" });
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.userId = decoded.userId || decoded.id;
    next();
  } catch {
    return res.status(401).json({ error: "Token không hợp lệ" });
  }
}

/* ================== HELPERS ================== */

// Tổng hợp label yếu từ DB theo day đã chấm
async function aggLabelFromDB(userId, day) {
  const last = await UserLessonResult.findOne({ userId, day }).lean();
  if (!last?.answers?.length) return { labelAgg: [], meta: null };

  const counter = {};
  for (const a of last.answers) {
    const L = a.label || "unknown";
    counter[L] ||= { total: 0, wrong: 0 };
    counter[L].total += 1;
    counter[L].wrong += a.isCorrect ? 0 : 1;
  }

  const labelAgg = Object.entries(counter).map(([label, v]) => ({
    label,
    total: v.total,
    wrong: v.wrong,
    ratio: v.total ? v.wrong / v.total : 0,
    skill: last.skill,
    part: last.part,
  }));

  return {
    labelAgg,
    meta: { score: Number(last.score || 0), skill: last.skill, part: Number(last.part) },
  };
}

// Fallback: lấy label yếu từ summary FE gửi lên
function aggLabelFromFE(perf) {
  const stats = perf?.labelStats || {};
  const skill = perf?.skill;
  const part = Number(perf?.part);
  const score = Number(perf?.accuracy || 0);

  const labelAgg = Object.entries(stats)
    .filter(([, v]) => (v?.total || 0) > 0)
    .map(([label, v]) => ({
      label,
      total: v.total || 0,
      wrong: v.wrong || 0,
      ratio: v.total ? v.wrong / v.total : 0,
      skill,
      part,
    }));

  return { labelAgg, meta: { score, skill, part } };
}

// Chọn nhãn yếu: ưu tiên số lượng sai, rồi đến tỉ lệ sai
function pickWeakLabel(labelAgg = [], skill, partHint) {
  const pool = labelAgg.filter(x => x.skill === skill && x.wrong > 0);
  if (!pool.length) return null;

  const exact = pool.find(x => partHint != null && Number(x.part) === Number(partHint));
  if (exact) return exact.label || null;

  const sorted = [...pool].sort((a, b) => (b.wrong - a.wrong) || (b.ratio - a.ratio));
  return sorted[0]?.label || null;
}

// Tính Part kế tiếp (không dùng level)
async function deriveNextPart({ userId, skill, basePart, score }) {
  const max = MAX_PART[skill];
  const stayCount = await UserLessonResult.countDocuments({ userId, skill, part: basePart });
  let next = basePart;
  if (score >= 70) next = Math.min(basePart + 1, max);
  else if (stayCount >= 2 && score >= 55) next = Math.min(basePart + 1, max);
  return next;
}

/* ================== APIs ================== */

/** GET /api/roadmap — trả lộ trình của user hiện tại */
router.get("/", requireAuth, async (req, res) => {
  try {
    const items = await RoadmapItem.find({ userId: req.userId }).sort({ day: 1, createdAt: 1 });
    res.json(items);
  } catch (e) {
    console.error("GET /roadmap failed:", e);
    res.status(500).json({ error: "Không thể lấy dữ liệu lộ trình." });
  }
});

/** PUT /api/roadmap/:id/progress — cập nhật tiến độ item của user hiện tại */
router.put("/:id/progress", requireAuth, async (req, res) => {
  const { id } = req.params;
  const { progress, status } = req.body || {};
  try {
    const updated = await RoadmapItem.findOneAndUpdate(
      { _id: id, userId: req.userId },
      { $set: { progress, status } },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Không tìm thấy item" });
    res.json(updated);
  } catch (e) {
    console.error("update progress failed:", e);
    res.status(500).json({ error: "Không thể cập nhật tiến độ." });
  }
});

/** POST /api/roadmap/day1
 *  - Idempotent (trừ khi force=1): đã có Day 1 thì trả lại
 *  - Nếu chưa có: đọc StudyPlan mới nhất → lấy gợi ý ngày 1 (có labelFocus từ test đầu vào)
 *  - Fallback: Listening Part 1
 *  - Luôn dùng ngân sách DAILY_BUDGET và làm tròn theo nhóm
 */
router.post("/day1", requireAuth, async (req, res) => {
  const userId = req.userId;

  try {
    const force = String(req.query.force || "").trim() === "1";
    if (force) await RoadmapItem.deleteMany({ userId, day: 1 });

    if (!force) {
      const existed = await RoadmapItem.findOne({ userId, day: 1 }).lean();
      if (existed) return res.json({ day: 1, item: existed, saved: true });
    }

    const sp = await StudyPlan.findOne({ userId }).sort({ createdAt: -1 }).lean();

    let suggestion = null;
    if (sp?.suggestion) {
      if (Array.isArray(sp.suggestion)) suggestion = sp.suggestion;
      else if (typeof sp.suggestion === "string") {
        try { const p = JSON.parse(sp.suggestion); if (Array.isArray(p)) suggestion = p; } catch { }
      }
    }

    let skill = "listening", part = 1, labelFocus = null, title = "Lesson - Listening Part 1";
    if (Array.isArray(suggestion) && suggestion.length) {
      const d1 = suggestion.find(x => Number(x?.day) === 1) || suggestion[0];
      if (d1?.skill && d1?.part) {
        skill = d1.skill;
        part = Number(d1.part);
        labelFocus = d1.labelFocus || null;   // 👈 label yếu từ test đầu vào
        title = d1.title || `Lesson - ${skill} Part ${part}`;
      }
    }

    const need = roundedNeed(skill, part, DAILY_BUDGET, "nearest");
    const ids = (skill === "listening")
      ? await pickListeningIds({ userId, part, labelFocus, need })
      : await pickReadingIds({ userId, part, labelFocus, need });

    const saved = await new RoadmapItem({
      userId, day: 1, title, skill, part, labelFocus,
      questionIds: ids, status: "pending", progress: 0, type: "lesson",
    }).save();

    res.json({ day: 1, item: saved, saved: true });
  } catch (e) {
    console.error("POST /day1 failed:", e);
    res.status(500).json({ error: "Không thể tạo Day 1." });
  }
});

/** POST /api/roadmap/next-day
 *  - Dùng kết quả ngày trước (ưu tiên DB, thiếu thì FE) để tính part/label
 *  - Mini test mỗi 5 ngày (5 + 5)
 *  - Ngày ≥ 3 có 2 item (6 + 4)
 *  - Idempotent (trừ khi force=1)
 */
router.post("/next-day", requireAuth, async (req, res) => {
  const userId = req.userId;

  try {
    const force = String(req.query.force || "").trim() === "1";
    const { currentDay, baseItemId, performance } = req.body || {};

    const baseItem = baseItemId ? await RoadmapItem.findOne({ _id: baseItemId, userId }).lean() : null;
    const last = await RoadmapItem.findOne({ userId }).sort({ day: -1 }).lean();
    const nextDay = (currentDay ?? baseItem?.day ?? last?.day ?? 0) + 1;

    // Idempotent
    const existed = await RoadmapItem.find({ userId, day: nextDay }).sort({ _id: 1 }).lean();
    if (existed.length && !force) {
      return res.json({ day: nextDay, item: existed[0], items: existed, saved: true, reused: true });
    }
    if (force && existed.length) {
      await RoadmapItem.deleteMany({ userId, day: nextDay });
    }

    // Tổng hợp label yếu / meta từ DB → fallback FE
    let fromDB = { labelAgg: [], meta: null };
    const dayLookup = currentDay ?? baseItem?.day ?? last?.day;
    if (dayLookup != null) fromDB = await aggLabelFromDB(userId, dayLookup);

    let labelAgg = fromDB.labelAgg || [];
    let meta = fromDB.meta || null;
    if ((!labelAgg.length || !meta) && performance) {
      const f = aggLabelFromFE(performance);
      if (!labelAgg.length) labelAgg = f.labelAgg;
      if (!meta) meta = f.meta;
    }
    if (!meta?.skill || !meta?.part) {
      return res.status(400).json({ error: "Thiếu dữ liệu skill/part để lập kế hoạch." });
    }

    const skill = meta.skill;
    const part = Number(meta.part);
    const score = Number(meta.score || 0);
    const isMini = nextDay % 5 === 0;

    // Tính part & label tiếp theo
    const nextPart = await deriveNextPart({ userId, skill, basePart: part, score });
    const labelFocus = pickWeakLabel(labelAgg, skill, nextPart);

    // Helper tạo 1 item theo ngân sách và làm tròn theo group
    const saveItemWithBudget = async ({ title, skill, part, labelFocus, type, budget }) => {
      const need = roundedNeed(skill, part, budget, "nearest");
      const ids = (skill === "listening")
        ? await pickListeningIds({ userId, part, labelFocus, need })
        : await pickReadingIds({ userId, part, labelFocus, need });

      return new RoadmapItem({
        userId, day: nextDay, title, skill, part, labelFocus,
        questionIds: ids, status: "pending", progress: 0, type: type || "lesson",
      }).save();
    };

    /* ---- Mini test: 5 + 5 ---- */
    if (isMini) {
      const priSkill = skill;
      const secSkill = (skill === "listening") ? "reading" : "listening";

      const peakPri = await UserLessonResult.find({ userId, skill: priSkill }).sort({ part: -1 }).limit(1);
      const peakSec = await UserLessonResult.find({ userId, skill: secSkill }).sort({ part: -1 }).limit(1);

      const p1 = Math.min(peakPri?.[0]?.part || part, MAX_PART[priSkill]);
      const p2 = Math.min(peakSec?.[0]?.part || DEFAULT_SECONDARY_PART[secSkill], MAX_PART[secSkill]);

      const lf1 = pickWeakLabel(labelAgg, priSkill, p1);
      const lf2 = pickWeakLabel(labelAgg, secSkill, p2);

      const [a, b] = await Promise.all([
        saveItemWithBudget({
          title: `Mini Test - ${priSkill} Part ${p1}`,
          skill: priSkill, part: p1, labelFocus: lf1, type: "minitest", budget: 5,
        }),
        saveItemWithBudget({
          title: `Mini Test - ${secSkill} Part ${p2}`,
          skill: secSkill, part: p2, labelFocus: lf2, type: "minitest", budget: 5,
        }),
      ]);
      return res.json({ day: nextDay, item: a, items: [a, b], saved: true });
    }

    /* ---- Ngày thường ---- */
    if (nextDay < 3) {
      // Chỉ 1 item ~10 câu
      const primary = await saveItemWithBudget({
        title: `Lesson - ${skill} Part ${nextPart}`,
        skill, part: nextPart, labelFocus, type: "lesson", budget: DAILY_BUDGET,
      });
      return res.json({ day: nextDay, item: primary, items: [primary], saved: true });
    }

    // Day ≥ 3: 2 item (6 + 4) — sau khi làm tròn theo đơn vị nhóm
    const primary = await saveItemWithBudget({
      title: `Lesson - ${skill} Part ${nextPart}`,
      skill, part: nextPart, labelFocus, type: "lesson", budget: 6,
    });

    const secSkill = (skill === "listening") ? "reading" : "listening";
    const peakSec = await UserLessonResult.find({ userId, skill: secSkill }).sort({ part: -1 }).limit(1);
    const secPart = Math.min(peakSec?.[0]?.part || DEFAULT_SECONDARY_PART[secSkill], MAX_PART[secSkill]);
    const secLabel = pickWeakLabel(labelAgg, secSkill, secPart);

    const secondary = await saveItemWithBudget({
      title: `Balance - ${secSkill} Part ${secPart}`,
      skill: secSkill, part: secPart, labelFocus: secLabel, type: "lesson", budget: 4,
    });

    return res.json({ day: nextDay, item: primary, items: [primary, secondary], saved: true });
  } catch (e) {
    console.error("POST /next-day failed:", e);
    res.status(500).json({ error: "Không thể tạo ngày tiếp theo." });
  }
});

export default router;
