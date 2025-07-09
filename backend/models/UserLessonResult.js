import mongoose from "mongoose";

const QuestionResultSchema = new mongoose.Schema({
  questionId: String,
  userAnswer: String,
  correctAnswer: String,
  isCorrect: Boolean,
  timeTaken: Number,         // ✅ thêm dòng này
  mistakeType: String        // ✅ thêm dòng này
});

const UserLessonResultSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  day: { type: Number, required: true },
  skill: String,
  part: Number,
  level: String,
  totalQuestions: Number,
  correct: Number,
  averageTime: Number,
  mistakes: [String], // e.g. ["inference", "grammar"]
  answers: [QuestionResultSchema],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("UserLessonResult", UserLessonResultSchema);
