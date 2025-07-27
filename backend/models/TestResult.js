// models/TestResult.js (ES module chuẩn)

import mongoose from "mongoose";

const TestResultSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  correct: Number,
  incorrect: Number,
  skipped: Number,
  score: Number,
  listeningCorrect: Number,
  readingCorrect: Number,
  listeningScore: Number,
  readingScore: Number,
  partsSubmitted: [Number],
  time: String,
  createdAt: { type: Date, default: Date.now }
});

const TestResult = mongoose.model("TestResult", TestResultSchema);

export default TestResult;
