// models/RoadmapItem.js
import mongoose from "mongoose";

const RoadmapItemSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  day: { type: Number, required: true },
  title: { type: String, required: true },
  skill: { type: String, required: true },
  status: { type: String, default: "pending" }, // "pending" | "done"
  progress: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model("RoadmapItem", RoadmapItemSchema);
