// models/RoadmapItem.js
import mongoose from "mongoose";

const RoadmapItemSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  day: { type: Number, required: true },
  title: { type: String, default: "" },

  // listening | reading
  skill: { type: String, enum: ["listening", "reading"], required: true },

  // TOEIC part: listening 1..4, reading 5..7
  part: { type: Number, required: true },

  // easy | medium | hard
  level: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },

  // Nhãn trọng tâm để chọn câu theo label (nếu có)
  labelFocus: { type: String, default: null },

  // Danh sách id câu hỏi đã "đóng băng" cho item này
  questionIds: { type: [String], default: [] },

  // pending | doing | done
  status: { type: String, enum: ["pending", "doing", "done"], default: "pending" },

  progress: { type: Number, default: 0, min: 0, max: 100 },

  // lesson | minitest  (⚠️ đây là field "type" của ITEM, không phải schema.type)
  type: { type: String, enum: ["lesson", "minitest"], default: "lesson" },

  createdAt: { type: Date, default: Date.now }
});

// (Không bắt buộc) nếu muốn mỗi user chỉ có 1 item cho mỗi day:
RoadmapItemSchema.index({ userId: 1, day: 1 });

export default mongoose.model("RoadmapItem", RoadmapItemSchema);
