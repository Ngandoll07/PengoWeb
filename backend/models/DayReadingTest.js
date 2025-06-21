// models/DayReadingTest.js

import mongoose from 'mongoose';

const dayReadingTestSchema = new mongoose.Schema({
  title:     { type: String, required: true },
  questions: [{ 
    question: String,
    options:  [String],
    answer:   String
  }],
  day:       { type: Number, required: true },       // Day 1, Day 2...
  skill:     { type: String, enum: ['reading'], default: 'reading' },
  level:     { type: String, enum: ['easy', 'medium', 'hard'], default: 'medium' },
  createdAt: { type: Date, default: Date.now }
});

export default mongoose.model('DayReadingTest', dayReadingTestSchema);
