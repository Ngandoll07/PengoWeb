import mongoose from "mongoose";

const StudyPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  listeningScore: Number,
  readingScore: Number,
  suggestion: String,
  createdAt: { type: Date, default: Date.now }
});

const StudyPlan = mongoose.model("StudyPlan", StudyPlanSchema);
export default StudyPlan;

