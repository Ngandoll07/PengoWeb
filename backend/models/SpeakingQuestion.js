import mongoose from "mongoose";

const speakingSchema = new mongoose.Schema({
    part: Number,
    id: String,
    text: String,
    image: String,
    context: String,
    questions: [String],
    imageDescription: String,
});

export default mongoose.model("SpeakingQuestion", speakingSchema);
