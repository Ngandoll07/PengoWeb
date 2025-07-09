// routes/roadmap.js
import express from "express";
import jwt from "jsonwebtoken";
import RoadmapItem from "../models/RoadmapItem.js";

const router = express.Router();
const JWT_SECRET = "123";

router.put("/:id", async (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const userId = decoded.userId;
    const { progress, status } = req.body;

    const updated = await RoadmapItem.findOneAndUpdate(
      { _id: req.params.id, userId },
      { $set: { progress, status } },
      { new: true }
    );

    if (!updated) return res.status(404).json({ message: "Không tìm thấy roadmap item" });

    res.json({ message: "Đã cập nhật", item: updated });
  } catch (err) {
    console.error("❌ Lỗi cập nhật:", err);
    res.status(500).json({ message: "Lỗi server" });
  }
});

export default router;
