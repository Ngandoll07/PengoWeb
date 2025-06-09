// src/pages/LoginPage/LoginPage.jsx
import React from 'react';
import './LoginPage.css';
import { FaFacebook, FaGoogle } from 'react-icons/fa';
import { FiEye } from 'react-icons/fi';

export default function LoginPage() {
  return (
    <div className="login-page">
      <div className="login-box">
        <div className="login-left">
      <h2>Đăng nhập</h2>
          <input type="email" placeholder="Email" />
          <div className="password-wrapper">
            <input type="text" placeholder="Mật khẩu" />
            <FiEye className="eye-icon" />
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
