import React, { useState } from 'react';
import './LoginPage.css';
import { FaFacebook, FaGoogle } from 'react-icons/fa';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import axios from 'axios';
import { useNavigate } from 'react-router-dom'; // import useNavigate

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate(); // dùng để chuyển trang

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleLogin = async () => {
    try {
      const response = await axios.post("http://localhost:5000/api/login", {
        email,
        password,
      });
       // 👉 Lưu token và thông tin user vào localStorage
    localStorage.setItem("token", response.data.token);
      localStorage.setItem("userId", response.data.user._id); // ✅ Cần dòng này!
    localStorage.setItem("user", JSON.stringify(response.data.user));
      alert("Đăng nhập thành công!");

     if (response.data.user.role === "admin") {
  navigate("/admin"); // 👉 Trang quản trị
} else {
  navigate("/"); // 👉 Trang người dùng thường (Home)
}
    } catch (err) {
      alert("Sai email hoặc mật khẩu!");
    }
  };

  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-left">
          <h2>Đăng nhập</h2>
          <input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
          <div className="password-wrapper">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Mật khẩu"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            {showPassword ? (
              <FiEyeOff className="eye-icon" onClick={togglePasswordVisibility} />
            ) : (
              <FiEye className="eye-icon" onClick={togglePasswordVisibility} />
            )}
          </div>
          <div className="login-links">
            <a href="#">Quên mật khẩu?</a>
            <a href="/signup">Đăng ký</a>
          </div>
          <button className="login-btn" onClick={handleLogin}>Đăng nhập</button>
          <p className="or-text">Đăng nhập bằng:</p>
          <div className="social-login">
            <FaFacebook className="social-icon facebook" />
            <FaGoogle className="social-icon google" />
          </div>
        </div>
        <div className="login-right">
          <img src="/assets/user/logo.png" alt="login" className="login" />
        </div>
      </div>
    </div>
  );
}
