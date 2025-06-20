const mongoose = require("mongoose");

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

module.exports = mongoose.model("TestResult", TestResultSchema);
