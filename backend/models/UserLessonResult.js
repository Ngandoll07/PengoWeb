// models/UserLessonResult.js
import mongoose from "mongoose";

const QuestionResultSchema = new mongoose.Schema({
  questionId: String,
  userAnswer: String,
  correctAnswer: String,
  isCorrect: Boolean,
});

const UserLessonResultSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  roadmapItemId: String,
  day: Number,
  skill: String,
  part: Number,
  score: Number,
  answers: [QuestionResultSchema],
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.model("UserLessonResult", UserLessonResultSchema);
