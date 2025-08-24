// backend/routes/questions.js
import express from "express";
import ListeningQuestion from "../models/ListeningQuestion.js";
import ReadingTest from "../models/ReadingTest.js";

const router = express.Router();

/** Helper: build URL asset đúng theo FE (reactbassic/public/assets/...) */
function normalizeAsset(name, meta = {}, kind = "audio") {
    if (!name) return null;
    if (/^https?:\/\//i.test(name)) return name;   // absolute
    if (name.startsWith("/assets/")) return name;  // đã đúng trong public
    if (name.startsWith("/")) return name;         // các path khác vẫn giữ nguyên

    // Trường hợp DB chỉ lưu "q1.mp3" hoặc "q1.jpg"
    const testFolder = meta.testId || "Test1";               // nếu có trường testId thì dùng, không thì Test1
    const partFolder = `part${Number(meta.part || 1)}`;
    const base = kind === "audio" ? "/assets/audio" : "/assets/images";
    return `${base}/${testFolder}/${partFolder}/${name}`;
}

/** Listening: /questions/listening/by-ids?ids=id1,id2,... */
router.get("/listening/by-ids", async (req, res) => {
    const ids = String(req.query.ids || "").split(",").filter(Boolean);
    if (!ids.length) return res.json([]);
    try {
        const docs = await ListeningQuestion
            .find({ id: { $in: ids } })
            .select("id testId part label audio image transcript question options answer explanation")
            .lean();

        const out = docs.map(d => ({
            questionId: d.id,
            part: d.part,
            label: d.label,
            audio: normalizeAsset(d.audio, d, "audio"),
            image: normalizeAsset(d.image, d, "image"),
            transcript: d.transcript,
            question: d.question,
            options: d.options,
            answer: d.answer,
            explanation: d.explanation,
        }));
        res.json(out);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Cannot fetch listening questions." });
    }
});

/** Reading Part 5: /questions/reading/p5/by-ids?ids=tid:q:147,tid:q:148 */
router.get("/reading/p5/by-ids", async (req, res) => {
    const ids = String(req.query.ids || "").split(",").filter(Boolean);
    if (!ids.length) return res.json([]);
    try {
        const group = {};
        for (const id of ids) {
            const [testId, tag, qno] = id.split(":");
            if (tag !== "q") continue;
            (group[testId] ||= new Set()).add(String(qno));
        }

        const out = [];
        for (const [testId, qset] of Object.entries(group)) {
            const t = await ReadingTest.findById(testId).lean();
            if (!t) continue;
            for (const q of (t.questions || [])) {
                if (qset.has(String(q.questionNumber))) {
                    out.push({
                        questionId: `${testId}:q:${q.questionNumber}`,
                        part: 5,
                        label: q.label,
                        passage: null,
                        imagePath: null,
                        question: q.question,
                        options: q.options,
                        answer: q.answer,
                        explanation: q.explanation,
                    });
                }
            }
        }
        res.json(out);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Cannot fetch reading P5." });
    }
});

/** Reading Part 6/7: /questions/reading/p6p7/by-ids?ids=tid:b0:q:1,tid:b2:q:3 */
router.get("/reading/p6p7/by-ids", async (req, res) => {
    const ids = String(req.query.ids || "").split(",").filter(Boolean);
    if (!ids.length) return res.json([]);
    try {
        const group = {};
        for (const id of ids) {
            const [testId, b, qtag, qno] = id.split(":"); // tid:b0:q:1
            if (!b?.startsWith("b") || qtag !== "q") continue;
            const key = `${testId}__${b.substring(1)}`;
            (group[key] ||= new Set()).add(String(qno));
        }

        const out = [];
        for (const key of Object.keys(group)) {
            const [testId, blockIndexStr] = key.split("__");
            const t = await ReadingTest.findById(testId).lean();
            if (!t) continue;
            const bi = Number(blockIndexStr);
            const block = (t.blocks || [])[bi];
            if (!block) continue;

            for (const q of (block.questions || [])) {
                if (group[key].has(String(q.questionNumber))) {
                    out.push({
                        questionId: `${testId}:b${bi}:q:${q.questionNumber}`,
                        part: t.part, // 6 hoặc 7
                        label: q.label,
                        passage: block.passage || null,
                        imagePath: block.imagePath || null, // nếu có ảnh thì FE vẫn hiển thị bình thường
                        question: q.question,
                        options: q.options,
                        answer: q.answer,
                        explanation: q.explanation,
                    });
                }
            }
        }
        res.json(out);
    } catch (e) {
        console.error(e);
        res.status(500).json({ error: "Cannot fetch reading P6/P7." });
    }
});

export default router;
