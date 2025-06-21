import mongoose from "mongoose";

const lessonSchema = new mongoose.Schema({
  title: { type: String, required: true },
  part: { type: Number, required: true },
  day: { type: Number },
  level: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
  skill: { type: String, enum: ["reading", "listening"], required: true },
  questions: [
    {
      passage: String,
      audio: String,
      image: String,
      questions: [
        {
          question: String,
          options: [String],
          answer: String
        }
      ]
    }
  ],
  createdAt: { type: Date, default: Date.now }
});

const Lesson = mongoose.model("Lesson", lessonSchema);
export default Lesson;
