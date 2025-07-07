// routes/dayReadingRoutes.js

import express from "express";
import DayReadingTest from "../models/DayReadingTest.js";

const router = express.Router();

// GET: /api/day-reading?day=1
router.get("/day-reading", async (req, res) => {
  const { day } = req.query;
  console.log("🔍 Query param day:", day);
  try {
    const test = await DayReadingTest.findOne({ day: Number(day) });
    console.log("🔍 Result from DB:", test);
    if (!test) {
      return res.status(404).json({ message: `Không tìm thấy đề cho Day ${day}` });
    }
    res.json(test);
  } catch (err) {
    console.error("❌ Lỗi khi lấy bài theo ngày:", err);
    res.status(500).json({ message: "Lỗi server khi truy vấn đề theo ngày" });
  }
});


export default router;
