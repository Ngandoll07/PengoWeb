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

    const user = response.data.user;

    localStorage.setItem("token", response.data.token);
    localStorage.setItem("userId", user._id);
    localStorage.setItem("user", JSON.stringify(user));
    alert("Đăng nhập thành công!");

    if (user.role === "admin") {
      navigate("/admin");
    } else {
      navigate("/");
    }
  } catch (err) {
    if (err.response && err.response.status === 403) {
      alert(err.response.data.message); // Tài khoản bị khóa
    } else if (err.response && err.response.data.message) {
      alert(err.response.data.message); // Các lỗi khác như sai mật khẩu
    } else {
      alert("Đăng nhập thất bại. Vui lòng thử lại.");
    }
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
