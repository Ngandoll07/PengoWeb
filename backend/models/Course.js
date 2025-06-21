import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
    id: Number, // ID riêng theo JSON đầu vào
    title: String,
    image: String,
    price: Number,
    originalPrice: Number,
    tag: String,
    description: String,
    details: [String] // mảng các chi tiết khóa học
});

const Course = mongoose.model("Course", courseSchema);

export default Course;
