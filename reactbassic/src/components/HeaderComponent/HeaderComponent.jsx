import React, { useEffect, useState } from 'react';
import './style.css';
import { FaBell, FaUser, FaSignOutAlt } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const HeaderComponent = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    alert("Bạn đã đăng xuất");
    navigate("/");
  };

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
        {isLoggedIn ? (
          <div
            className="user-menu-container"
            onMouseEnter={() => setDropdownOpen(true)}
            onMouseLeave={() => setDropdownOpen(false)}
          >
            <FaUser className="icon" />
            {dropdownOpen && (
              <div className="user-dropdown">
                <a href="/roadmap">🧭 Lộ trình</a>
                <a href="/profile">👤 Thông tin</a>
                <button onClick={handleLogout} className="logout-btn">
                  <FaSignOutAlt /> Đăng xuất
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <span className="login"><a href="/login">ĐĂNG NHẬP</a></span>
            <span className="signup"><a href="/signup">ĐĂNG KÝ</a></span>
          </>
        )}
      </div>
    </header>
  );
};

export default HeaderComponent;
