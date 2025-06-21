import mongoose from "mongoose";

const ListeningQuestionSchema = new mongoose.Schema({
    id: { type: String, required: true, unique: true },
    part: Number,
    question: String,
    options: {
        A: String,
        B: String,
        C: String,
        D: String
    },
    answer: String,
    audio: String,
    image: String
});

export default mongoose.model("ListeningQuestion", ListeningQuestionSchema);
