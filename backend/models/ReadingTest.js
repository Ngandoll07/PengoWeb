const mongoose = require("mongoose");

const ReadingQuestionSchema = new mongoose.Schema({
  question: String,
  options: {
    A: String,
    B: String,
    C: String,
    D: String
  },
  answer: String,
  part: Number
});

const ReadingTestSchema = new mongoose.Schema({
  title: String,
  part: Number,
  questions: [ReadingQuestionSchema],
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("ReadingTest", ReadingTestSchema);
