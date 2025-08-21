import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./ForgotPasswordPage.css";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) {
      setMessage("Vui lòng nhập email!");
      return;
    }

    try {
      setLoading(true);
      const res = await axios.post("http://localhost:5000/api/forgot-password", {
        email,
      });
      setMessage(res.data.message || "Email đặt lại mật khẩu đã được gửi!");
      setEmail(""); // reset input
      setLoading(false);
    } catch (err) {
      setMessage(err.response?.data?.message || "Gửi email thất bại!");
      setLoading(false);
    }
  };

  return (
    <div className="forgot-page">
      <div className="forgot-box">
        <h2>Quên mật khẩu</h2>
        <p>Nhập email để nhận link đặt lại mật khẩu.</p>
        <form onSubmit={handleSubmit}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Đang gửi..." : "Gửi link"}
          </button>
        </form>
        {message && <p className="message">{message}</p>}
        <p className="back-login" onClick={() => navigate("/login")}>
          Quay lại đăng nhập
        </p>
      </div>
    </div>
  );
}
