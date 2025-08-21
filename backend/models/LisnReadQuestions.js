import mongoose from "mongoose";

const LisnReadQuestionSchema = new mongoose.Schema({
  testId: { type: String, required: true },
  part: { type: Number, required: true },
  groupId: { type: String },   // 👈 Đổi từ ObjectId sang String
  questionId: { type: String, required: true },
  questionText: { type: String, required: true },
  options: [{ type: String }],
  answerAdmin: { type: String },
  answerAI: { type: String },
  correct: { type: String },
  audioPath: { type: String },
  imagePath: { type: String },
  transcript: { type: String },
  passage: { type: String },
    // 👇 Thêm 2 trường mới cho phân tích AI
  label: { type: String },
  explanation: { type: String },
});

export default mongoose.model("LisnReadQuestion", LisnReadQuestionSchema);
