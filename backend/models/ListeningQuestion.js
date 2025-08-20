import mongoose from "mongoose";

const ListeningQuestionSchema = new mongoose.Schema({
    testId: { type: String, required: true },  // testId phải có khi insert
    id: { type: String, required: true, unique: true },
    part: Number,                   // Phần nghe (Part 1,2,3...)
    label: String,                  // Nhãn câu hỏi, ví dụ: "Listening: main idea", "Listening: detail"
    question: String,               // Nội dung câu hỏi
    options: {                      // Các lựa chọn
        A: String,
        B: String,
        C: String,
        D: String
    },
    answer: String,                 // Đáp án đúng
    audio: String,                  // Đường dẫn file audio
    image: String,                  // Đường dẫn file ảnh (nếu có)
    transcript: String,             // Kết quả chuyển audio -> text
    explanation: String             // Giải thích AI cho câu hỏi
});

export default mongoose.model("ListeningQuestion", ListeningQuestionSchema);
