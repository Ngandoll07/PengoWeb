import mongoose from "mongoose";

const writingTaskSchema = new mongoose.Schema({
  part1: [
    {
      image: String,
      keywords: [String],
      minWords: Number,
      maxWords: Number,
    }
  ],
  part2: {
    part: Number,
    instruction: String,
    questions: [
      {
        id: Number,
        prompt: String,
        email: String,
        minWords: Number,
        maxWords: Number,
      }
    ]
  },
  part3: {
    part: Number,
    instruction: String,
    question: {
      id: Number,
      prompt: String,
      minWords: Number,
      maxWords: Number,
    }
  }
});

export default mongoose.model('WritingTask', writingTaskSchema);
