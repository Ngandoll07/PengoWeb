const express = require("express");
const router = express.Router();
const User = require("../models/User");
const auth = require("../middleware/auth");

// GET user profile
router.get("/me", auth, async (req, res) => {
  const user = await User.findById(req.user.id).select("-password");
  res.json(user);
});

// PUT update user info
router.put("/me", auth, async (req, res) => {
  const { name, email, phone, birthdate, avatar } = req.body;
  const updated = await User.findByIdAndUpdate(
    req.user.id,
    { name, email, phone, birthdate, avatar },
    { new: true }
  );
  res.json(updated);
});

// PUT update password
router.put("/change-password", auth, async (req, res) => {
  const { currentPassword, newPassword } = req.body;
  const user = await User.findById(req.user.id);
  const bcrypt = require("bcryptjs");

  const isMatch = await bcrypt.compare(currentPassword, user.password);
  if (!isMatch) return res.status(400).json({ msg: "Sai mật khẩu hiện tại" });

  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(newPassword, salt);
  user.password = hashed;
  await user.save();

  res.json({ msg: "Đổi mật khẩu thành công" });
});
// PUT /api/users/:id/lock



module.exports = router;
