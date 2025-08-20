// ✅ File: models/StudyPlan.js
import mongoose from "mongoose";

const StudyPlanSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  listeningScore: Number,
  readingScore: Number,
  suggestion: [
    {
      day: Number,
      title: String,
      skill: String,
      part: Number,
      level: String,
      status: String,
      progress: Number
    }
  ], // Giờ là mảng object thay vì chuỗi JSON
  analysis: { type: mongoose.Schema.Types.Mixed }, // 🔹 cho phép object
  createdAt: { type: Date, default: Date.now }
});

const StudyPlan = mongoose.model("StudyPlan", StudyPlanSchema);
export default StudyPlan;
