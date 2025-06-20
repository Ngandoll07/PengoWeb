import mongoose from "mongoose";

const StudyPlanSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    listeningScore: { type: Number, required: true },
    readingScore: { type: Number, required: true },
    suggestion: { type: String, required: true },
    createdAt: { type: Date, default: Date.now }
});

const StudyPlan = mongoose.model("StudyPlan", StudyPlanSchema);
export default StudyPlan;
