// models/Order.js
import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema({
    user: {
        _id: String,
        email: String,
    },
    courses: [
        {
            id: Number,
            title: String,
            price: Number,
            quantity: Number,
        }
    ],
    createdAt: {
        type: Date,
        default: Date.now
    }
});

export default mongoose.model("Order", OrderSchema);
