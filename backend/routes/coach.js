// routes/coach.js
import express from "express";
import fetch from "node-fetch";
const router = express.Router();

// Heuristic fallback nếu không gọi AI được
function heuristic(summary) {
    const acc = Number(summary?.accuracy || 0);
    const labelStats = summary?.labelStats || {};
    const weak = Object.entries(labelStats)
        .filter(([, v]) => (v.wrong || 0) > 0)
        .sort((a, b) => (b[1].wrong || 0) - (a[1].wrong || 0))
        .slice(0, 3).map(([k, v]) => `${k} (${v.wrong}/${v.total})`);
    const head = acc >= 85 ? "Rất tốt! Duy trì phong độ."
        : acc >= 60 ? "Ổn, nhưng cần siết lại vài điểm."
            : "Kết quả chưa cao, cần củng cố trọng tâm.";
    const tail = summary?.skill === "listening"
        ? `Tập trung từ khóa hành động/vị trí, phân biệt âm cuối, luyện tốc độ ghi nhớ phương án.`
        : `Luyện từ vựng theo ngữ cảnh, nhận diện cấu trúc ngữ pháp và dùng chiến thuật loại trừ.`;
    return `${head} Điểm yếu nổi bật: ${weak.join(", ") || "chưa rõ"}. ${tail}`;
}

router.post("/feedback", async (req, res) => {
    const { summary } = req.body || {};
    const fbFallback = heuristic(summary);

    try {
        const apiKey = process.env.GROQ_API_KEY || process.env.OPENAI_API_KEY;
        if (!apiKey) return res.json({ feedback: fbFallback });

        const prompt = `
Bạn là giáo viên TOEIC. Dựa trên kết quả:
${JSON.stringify({
            accuracy: summary?.accuracy,
            skill: summary?.skill,
            part: summary?.part,
            labelStats: summary?.labelStats,
        }).slice(0, 4000)}

Viết 3-6 câu nhận xét NGẮN GỌN, có hành động cụ thể cho ngày sau.
Bố cục: (1) tổng quan (2) 2-3 lỗi chính kèm label (3) gợi ý luyện tập.
Dùng tiếng Việt, không liệt kê quá dài.`;

        let feedback = "";

        if (process.env.GROQ_API_KEY) {
            // dùng Groq
            const r = await fetch("https://api.groq.com/openai/v1/chat/completions", {
                method: "POST",
                headers: { Authorization: `Bearer ${process.env.GROQ_API_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "llama-3.1-8b-instant",
                    temperature: 0.5,
                    messages: [{ role: "user", content: prompt }],
                }),
            });
            const data = await r.json();
            feedback = data?.choices?.[0]?.message?.content?.trim() || "";
        } else {
            // dùng OpenAI
            const r = await fetch("https://api.openai.com/v1/chat/completions", {
                method: "POST",
                headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, "Content-Type": "application/json" },
                body: JSON.stringify({
                    model: "gpt-4o-mini",
                    temperature: 0.5,
                    messages: [{ role: "user", content: prompt }],
                }),
            });
            const data = await r.json();
            feedback = data?.choices?.[0]?.message?.content?.trim() || "";
        }

        if (!feedback) feedback = fbFallback;
        return res.json({ feedback });
    } catch (e) {
        console.warn("coach/feedback error:", e.message || e);
        return res.json({ feedback: fbFallback });
    }
});

export default router;
