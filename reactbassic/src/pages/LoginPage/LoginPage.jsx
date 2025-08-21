import React, { useState } from 'react';
import './LoginPage.css';
import { FaGoogle } from 'react-icons/fa';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';
import { auth } from "../../firebaseConfig"; 
import { signInWithPopup, GoogleAuthProvider } from "firebase/auth"; // thêm GoogleAuthProvider
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const provider = new GoogleAuthProvider(); // khởi tạo provider
  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  // Đăng nhập thường
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

      if (user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (err) {
      if (err.response && err.response.status === 403) {
        alert(err.response.data.message);
      } else if (err.response && err.response.data.message) {
        alert(err.response.data.message);
      } else {
        alert("Đăng nhập thất bại. Vui lòng thử lại.");
      }
    }
  };

  // Đăng nhập bằng Google
// Đăng nhập bằng Google
const handleGoogleLogin = async () => {
  try {
    const result = await signInWithPopup(auth, provider); // truyền provider
    const user = result.user;

    // Gửi thông tin Google user lên backend
    const response = await axios.post("http://localhost:5000/api/google-login", {
      email: user.email,
      name: user.displayName,
      avatar: user.photoURL,
    });

    const userData = response.data.user;
    localStorage.setItem("token", response.data.token);
    localStorage.setItem("userId", userData._id);
    localStorage.setItem("user", JSON.stringify(userData));

    navigate("/");
  } catch (error) {
    console.error("Google login failed:", error);
    alert("Đăng nhập Google thất bại");
  }
};


  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-left">
          <div className="back-to-home" onClick={() => navigate('/')}>
      <FaArrowLeft className="back-icon" />
      <span>Trang chủ</span>
    </div>
          <h2>Đăng nhập</h2>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
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
            <a href="/forgot-password">Quên mật khẩu?</a>
            <a href="/signup">Đăng ký</a>
          </div>
          <button className="login-btn" onClick={handleLogin}>Đăng nhập</button>
          <p className="or-text">Đăng nhập bằng:</p>
          <div className="social-login">
            <FaGoogle className="social-icon google" onClick={handleGoogleLogin} />
          </div>
        </div>
        <div className="login-right">
          <img src="/assets/user/logo.png" alt="login" className="login" />
        </div>
      </div>
    </div>
  );
}
