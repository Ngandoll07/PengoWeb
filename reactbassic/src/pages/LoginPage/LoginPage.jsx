// src/pages/LoginPage/LoginPage.jsx
import React, { useState } from 'react';
import './LoginPage.css';
import { FaFacebook, FaGoogle } from 'react-icons/fa';
import { FiEye, FiEyeOff } from 'react-icons/fi'; // thêm FiEyeOff để đổi icon khi đang hiển mật khẩu

export default function LoginPage() {
   const [showPassword, setShowPassword] = useState(false); // tạo state
  
      const togglePasswordVisibility = () => {
          setShowPassword(!showPassword); // đổi true <-> false khi click
      };
  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-left">
      <h2>Đăng nhập</h2>
          <input type="email" placeholder="Email" />
          <div className="password-wrapper">
           <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Mật khẩu"
                        />
         {showPassword ? (
                                   <FiEyeOff className="eye-icon" onClick={togglePasswordVisibility} />
                               ) : (
                                   <FiEye className="eye-icon" onClick={togglePasswordVisibility} />
                               )}
          </div>
          <div className="login-links">
            <a href="#">Quên mật khẩu?</a>
            <a href="#">Đăng ký</a>
          </div>
          <button className="login-btn">Đăng nhập</button>
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
