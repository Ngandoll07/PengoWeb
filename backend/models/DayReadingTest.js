// models/DayReadingTest.js

import mongoose from 'mongoose';

const dayReadingTestSchema = new mongoose.Schema({
  title: { type: String, required: true },
  day:   { type: Number, required: true },
  part:  { type: Number },
  skill: { type: String, enum: ['reading'], default: 'reading' },
  level: { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  questions: [
    {
      passage: String,
      questions: [
        {
          question: String,
          options: [String],
          answer: String,
        }
      ]
    }
  ],
  createdAt: { type: Date, default: Date.now }
});


export default mongoose.model('DayReadingTest', dayReadingTestSchema);
