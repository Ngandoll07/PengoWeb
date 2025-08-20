import React, { useEffect, useState } from 'react';
import './style.css';
import { FaChevronDown } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const HeaderComponent = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
    // Giả sử bạn lưu tên user trong localStorage sau login
    const name = localStorage.getItem("userName") || '';
    setUserName(name);
  }, []);
useEffect(() => {
  const onScroll = () => {
    const header = document.querySelector('.header-edtech');
    if (window.scrollY > 60) header.classList.add('shrink');
    else header.classList.remove('shrink');
  };
  window.addEventListener('scroll', onScroll);
  return () => window.removeEventListener('scroll', onScroll);
}, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    setIsLoggedIn(false);
    alert("Bạn đã đăng xuất");
    navigate("/");
  };

  return (
    <header className="header-edtech">
      <div className="logo-edtech" onClick={() => navigate("/")}>
        <img src="/assets/user/logo.png" alt="Logo" className="logo-image" />
      </div>

     <nav className="nav-edtech">
  <a href="/" className="nav-item">Trang chủ</a>
  <a href="/coursespage" className="nav-item">Khóa học</a>

  <div className="nav-dropdown">
    <button
      className="nav-item dropdown-toggle"
      aria-haspopup="true"
      aria-expanded="false"
      type="button"
    >
      Luyện tập
      <span className="arrow">▾</span>
    </button>
    <div className="dropdown-menu">
      <a href="/practicelistening" className="dropdown-link">Luyện nghe</a>
      <a href="/practiceread" className="dropdown-link">Luyện đọc</a>
      <a href="/speakingpractice" className="dropdown-link">Luyện nói</a>
      <a href="/practicewrite" className="dropdown-link">Luyện viết</a>
    </div>
  </div>

  <a href="#" className="nav-item">Giới thiệu</a>
</nav>

      <div className="auth-edtech">
        {isLoggedIn ? (
          <div
            className="user-dropdown-wrapper"
            onMouseEnter={() => setDropdownOpen(true)}
            onMouseLeave={() => setDropdownOpen(false)}
          >
            <div className="user-button">
              <span className="user-name">{userName || 'Tài khoản'}</span>
              <FaChevronDown className="chevron" />
            </div>
            {dropdownOpen && (
              <div className="user-menu">
                <a href="/roadmap">🧭 Lộ trình</a>
                <a href="/profile">👤 Thông tin</a>
                <a href="/mycourses">🎓 Khoá học của tôi</a>
                <button onClick={handleLogout} className="logout-btn">
                  Đăng xuất
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <button className="btn-outline" onClick={() => navigate("/signup")}>Đăng ký</button>
            <button className="btn-primary" onClick={() => navigate("/login")}>Đăng nhập</button>
          </>
        )}
      </div>
    </header>
  );
};

export default HeaderComponent;




