// utils/questionPicker.js
import ListeningQuestion from "../models/ListeningQuestion.js";
import ReadingTest from "../models/ReadingTest.js";
import UserLessonResult from "../models/UserLessonResult.js";

async function getSeenIds(userId) {
    const rows = await UserLessonResult.aggregate([
        { $match: { userId } },
        { $unwind: "$answers" },
        { $project: { qid: "$answers.questionId" } },
    ]);
    const s = new Set();
    rows.forEach(r => { if (r.qid) s.add(String(r.qid)); });
    return s;
}
function pushUnique(dst, src) {
    const set = new Set(dst);
    for (const x of src) if (!set.has(x)) set.add(x);
    return Array.from(set);
}

/** LISTENING — ưu tiên labelFocus → bỏ label → bỏ exclude; random tuyệt đối */
export async function pickListeningIds({ userId, part, labelFocus, need = 10 }) {
    const seen = await getSeenIds(userId);
    const passes = [
        { match: { part, ...(labelFocus ? { label: labelFocus } : {}), id: { $nin: [...seen] } } },
        { match: { part, id: { $nin: [...seen] } } },
        { match: { part } },
    ];
    let out = [];
    for (const p of passes) {
        if (out.length >= need) break;
        const left = need - out.length;
        const batch = await ListeningQuestion.aggregate([
            { $match: p.match },
            { $sample: { size: left } },
            { $project: { _id: 0, id: 1 } },
        ]);
        out.push(...batch.map(d => d.id));
    }
    return out.slice(0, need);
}

/** READING — unwind từng câu lẻ theo part; random; ưu tiên labelFocus */
export async function pickReadingIds({ userId, part, labelFocus, need = 10 }) {
    const seen = await getSeenIds(userId);
    let picked = [];

    if (part === 5) {
        const passes = [
            [
                { $match: { part: 5 } },
                { $unwind: "$questions" },
                ...(labelFocus ? [{ $match: { "questions.label": labelFocus } }] : []),
                { $match: { "questions.questionNumber": { $exists: true } } },
                { $sample: { size: need } },
                { $project: { _id: 1, qno: "$questions.questionNumber" } },
            ],
            [
                { $match: { part: 5 } },
                { $unwind: "$questions" },
                { $match: { "questions.questionNumber": { $exists: true } } },
                { $sample: { size: need } },
                { $project: { _id: 1, qno: "$questions.questionNumber" } },
            ],
        ];
        for (const pipe of passes) {
            if (picked.length >= need) break;
            const batch = await ReadingTest.aggregate(pipe);
            picked = pushUnique(
                picked,
                batch.map(d => `${d._id}:q:${d.qno}`).filter(id => !seen.has(id))
            ).slice(0, need);
        }
        if (picked.length < need) {
            const extra = await ReadingTest.aggregate([
                { $match: { part: 5 } },
                { $unwind: "$questions" },
                { $sample: { size: need - picked.length } },
                { $project: { _id: 1, qno: "$questions.questionNumber" } },
            ]);
            picked = pushUnique(picked, extra.map(d => `${d._id}:q:${d.qno}`)).slice(0, need);
        }
    } else {
        const passes = [
            [
                { $match: { part } },
                { $unwind: { path: "$blocks", includeArrayIndex: "bi" } },
                { $unwind: "$blocks.questions" },
                ...(labelFocus ? [{ $match: { "blocks.questions.label": labelFocus } }] : []),
                { $match: { "blocks.questions.questionNumber": { $exists: true } } },
                { $sample: { size: need } },
                { $project: { _id: 1, bi: "$bi", qno: "$blocks.questions.questionNumber" } },
            ],
            [
                { $match: { part } },
                { $unwind: { path: "$blocks", includeArrayIndex: "bi" } },
                { $unwind: "$blocks.questions" },
                { $match: { "blocks.questions.questionNumber": { $exists: true } } },
                { $sample: { size: need } },
                { $project: { _id: 1, bi: "$bi", qno: "$blocks.questions.questionNumber" } },
            ],
        ];
        for (const pipe of passes) {
            if (picked.length >= need) break;
            const batch = await ReadingTest.aggregate(pipe);
            picked = pushUnique(
                picked,
                batch.map(d => `${d._id}:b${d.bi}:q:${d.qno}`).filter(id => !seen.has(id))
            ).slice(0, need);
        }
        if (picked.length < need) {
            const extra = await ReadingTest.aggregate([
                { $match: { part } },
                { $unwind: { path: "$blocks", includeArrayIndex: "bi" } },
                { $unwind: "$blocks.questions" },
                { $sample: { size: need - picked.length } },
                { $project: { _id: 1, bi: "$bi", qno: "$blocks.questions.questionNumber" } },
            ]);
            picked = pushUnique(
                picked,
                extra.map(d => `${d._id}:b${d.bi}:q:${d.qno}`)
            ).slice(0, need);
        }
    }
    return picked.slice(0, need);
}
