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
        <a href="/">TRANG CHỦ</a>
        <a href="#">KHÓA HỌC</a>
     <div className="dropdown">
          <span className="dropbtn">LUYỆN TẬP</span>
          <div className="dropdown-content">
            <a href="/practicelistening">Luyện nghe</a>
            <a href="/practiceread">Luyện đọc</a>
            <a href="/practicespeak">Luyện nói</a>
            <a href="/practicewrite">Luyện viết</a>
          </div>
        </div>

        <a href="#">GIỚI THIỆU</a>
      </nav>
      <div className="icon-area">
        <FaBell className="icon" />
      <div className="user-menu-container">
      <FaUser className="icon" />
      <div className="user-dropdown">
        <a href="/roadmap">Lộ trình</a>
        <a href="/profile">Thông tin</a>
      </div>
    </div>

        <span className="login"> <a href="login">ĐĂNG NHẬP</a></span>
        <span className="signup"> <a href="signup">ĐĂNG KÍ</a></span>
      </div>
    </header>
  );
};

export default HeaderComponent