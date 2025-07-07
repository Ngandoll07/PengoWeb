// models/PracticeHistory.js
import mongoose from 'mongoose';

const PracticeHistorySchema = new mongoose.Schema({
  userId: { type: String, required: true },     // ID người dùng
  part: { type: Number, enum: [5, 6, 7], required: true },
  testId: { type: mongoose.Schema.Types.ObjectId, ref: 'ReadingTest', required: true },
  score: Number,
  correct: Number,
  total: Number,
  startedAt: Date,
  submittedAt: Date
});

export default mongoose.model('PracticeHistory', PracticeHistorySchema);
