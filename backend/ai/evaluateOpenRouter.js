// backend/ai/evaluateOpenRouter.js
import axios from "axios";

export async function evaluateSpeaking(transcript) {
    const safeTranscript = typeof transcript === "string" ? transcript : JSON.stringify(transcript);
    const prompt = `
Bạn là giám khảo TOEIC Speaking. Dưới đây là câu trả lời của thí sinh. Hãy đánh giá theo các tiêu chí: Fluency, Pronunciation, Grammar, Vocabulary, tổng điểm (X/3), và nhận xét ngắn gọn bằng tiếng Việt.

Transcript: ${safeTranscript.slice(0, 2000)}
`;


    try {
        const res = await axios.post(
            "https://openrouter.ai/api/v1/chat/completions",
            {
                model: "mistralai/mistral-7b-instruct:free", // Model miễn phí
                messages: [
                    { role: "system", content: "Bạn là giám khảo TOEIC Speaking." },
                    { role: "user", content: prompt }
                ]
            },
            {
                headers: {
                    Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
                    "Content-Type": "application/json",
                    "HTTP-Referer": "http://localhost:3000", // hoặc domain của bạn
                    "X-Title": "toeic-speaking-app"
                }
            }
        );

        return res.data.choices[0].message.content;
    } catch (err) {
        console.error("❌ Lỗi OpenRouter:", err.response?.data || err.message);
        return "⚠️ Không thể chấm điểm hiện tại. Vui lòng thử lại sau.";
    }
}
