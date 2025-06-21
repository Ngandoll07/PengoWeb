import express from "express";
import Order from "../models/Order.js";
import authenticate from "../middlewares/auth.js";
import Course from "../models/Course.js";

const router = express.Router();

router.post("/", authenticate, async (req, res) => {
    try {
        const { cartItems } = req.body;

        if (!cartItems || cartItems.length === 0) {
            return res.status(400).json({ message: "Giỏ hàng trống!" });
        }

        const newOrder = new Order({
            user: {
                _id: req.user.userId,
                email: req.user.email
            },
            courses: cartItems,
            createdAt: new Date()
        });

        await newOrder.save();

        res.status(201).json({ message: "🛍️ Mua thành công!" });
    } catch (err) {
        console.error("❌ Lỗi mua hàng:", err);
        res.status(500).json({ message: "Lỗi máy chủ!" });
    }
});


// 🆕 API: Admin xem danh sách đơn hàng đã mua
router.get("/orders", async (req, res) => {
    try {
        const orders = await Order.find().sort({ createdAt: -1 });
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: "Lỗi khi lấy danh sách đơn hàng" });
    }
});

// 🆕 API: Lấy các khoá học đã mua của user
router.get("/my-courses", authenticate, async (req, res) => {
    try {
        const orders = await Order.find({ "user._id": req.user.userId });

        // Lấy tất cả courseIds đã mua
        const purchasedCourseIds = orders.flatMap(order =>
            order.courses.map(c => c.id)
        );

        // Lấy đầy đủ thông tin các khóa học từ DB
        const fullCourses = await Course.find({ id: { $in: purchasedCourseIds } });

        res.json(fullCourses);
    } catch (err) {
        console.error("❌ Lỗi lấy khoá học đã mua:", err);
        res.status(500).json({ message: "Lỗi máy chủ!" });
    }
});


export default router;
