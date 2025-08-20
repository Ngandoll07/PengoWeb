import mongoose from "mongoose";

const QuestionSchema = new mongoose.Schema({
  questionNumber: String,   // ví dụ: 147 (Part 7) hoặc số thứ tự (Part 6/5)
  question: String,
  options: {
    A: String,
    B: String,
    C: String,
    D: String,
  },
  answer: String,          // đáp án đúng (A/B/C/D)
  label: String,           // nhãn AI phân tích: grammar/vocabulary/inference...
  explanation: String,     // giải thích ngắn (AI sinh ra)
});

const BlockSchema = new mongoose.Schema({
  passage: String,          // dùng cho Part 6
  imagePath: String,        // dùng cho Part 7
  questions: [QuestionSchema],
});

const ReadingTestSchema = new mongoose.Schema({
  title: { type: String, required: true },   // tên đề thi
  part: { type: Number, required: true },    // Part 5 / 6 / 7
  questions: [QuestionSchema],               // Part 5: lưu trực tiếp
  blocks: [BlockSchema],                     // Part 6 & 7: gom theo passage hoặc imagePath
}, { timestamps: true });

export default mongoose.model("ReadingTest", ReadingTestSchema);
