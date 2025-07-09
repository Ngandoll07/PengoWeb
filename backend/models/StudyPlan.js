import mongoose from "mongoose";

const StudyPlanSchema = new mongoose.Schema({
  userId: String,
  listeningScore: Number,
  readingScore: Number,
  suggestion: String, // JSON.stringify([...])
  analysis: String, // 🆕 phần phân tích
  createdAt: { type: Date, default: Date.now }
});

const StudyPlan = mongoose.model("StudyPlan", StudyPlanSchema);
export default StudyPlan;
