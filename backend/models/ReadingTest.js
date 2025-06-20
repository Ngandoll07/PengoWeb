const mongoose = require("mongoose");

const ReadingQuestionSchema = new mongoose.Schema({
  question: String,
  options: {
    A: String,
    B: String,
    C: String,
    D: String,
  },
  answer: String,
  part: Number,
});

const ReadingBlockSchema = new mongoose.Schema({
  passage: String,
  questions: [ReadingQuestionSchema],
});

const ReadingTestSchema = new mongoose.Schema({
  title: String,
  part: Number,
  questions: [ReadingQuestionSchema], // ✅ Chỉ dùng cho Part 5 và 7
  blocks: [ReadingBlockSchema],       // ✅ Chỉ dùng cho Part 6
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("ReadingTest", ReadingTestSchema);
