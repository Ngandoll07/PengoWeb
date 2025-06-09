import React from 'react'
import { Col } from 'antd';
import './style.css';
import { FaBell, FaUser } from 'react-icons/fa';

const HeaderComponent = () => {
  return (
    <header className="header">
      <div className="logo-area">
        <img src="/assets/user/logo.png" alt="Logo" className="logo" />
      </div>
      <nav className="nav">
        <a href="#">TRANG CHỦ</a>
        <a href="#">KHÓA HỌC</a>
        <a href="#">LUYỆN TẬP</a>
        <a href="#">GIỚI THIỆU</a>
      </nav>
      <div className="icon-area">
        <FaBell className="icon" />
        <FaUser className="icon" />
        <span className="login"> <a href="login">ĐĂNG NHẬP</a></span>
      </div>
    </header>
  );
};

export default HeaderComponent