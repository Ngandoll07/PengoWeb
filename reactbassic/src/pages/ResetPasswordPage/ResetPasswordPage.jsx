// ResetPasswordPage.jsx
import React, { useState } from "react";
import axios from "axios";
import './ResetPasswordPage.css';
import { useParams, useNavigate } from "react-router-dom";

export default function ResetPasswordPage() {
  const { token } = useParams();
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newPassword) {
      setMessage("Vui lòng nhập mật khẩu mới!");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post(`http://localhost:5000/api/reset-password/${token}`, {
        newPassword,
      });
      setMessage(res.data.message || "Đổi mật khẩu thành công!");
      setNewPassword("");
      setLoading(false);
      setTimeout(() => navigate("/login"), 2000); // quay về login
    } catch (err) {
      setMessage(err.response?.data?.message || "Đặt lại mật khẩu thất bại!");
      setLoading(false);
    }
  };

  return (
    <div className="reset-page">
      <div className="reset-box">
        <h2>Đặt lại mật khẩu</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="password"
            placeholder="Mật khẩu mới"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Đang gửi..." : "Đổi mật khẩu"}
          </button>
        </form>
        {message && <p className="message">{message}</p>}
      </div>
    </div>
  );
}
