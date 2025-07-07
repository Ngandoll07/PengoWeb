import mongoose from "mongoose";

const ListeningQuestionSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    part: Number,
    level: { type: String, enum: ["easy", "medium", "hard"], default: "medium" },
    question: String,
    options: {
        A: String,
        B: String,
        C: String,
        D: String
    },
    answer: String,
    audio: String,
    image: String,
    transcript: String
});

export default mongoose.model("ListeningQuestion", ListeningQuestionSchema);
