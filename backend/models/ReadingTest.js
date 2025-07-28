import mongoose from "mongoose";

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
  level: {
    type: String, // 'Dễ', 'Trung bình', 'Khó'
    enum: ['easy', 'medium', 'hard'],
    default: 'medium',
  },
  questions: [ReadingQuestionSchema], // Part 5 & 7
  blocks: [ReadingBlockSchema],       // Part 6 & 7
  createdAt: { type: Date, default: Date.now },
});

const ReadingTest = mongoose.model("ReadingTest", ReadingTestSchema);
export default ReadingTest;
