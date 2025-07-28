import mongoose from "mongoose";

const RoadmapItemSchema = new mongoose.Schema({
  userId: String,
  day: Number,
  title: String,
  skill: String,
  part: Number,   // ✅ THÊM
  level: String,  // ✅ THÊM
  status: String,
  progress: Number,
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("RoadmapItem", RoadmapItemSchema);
