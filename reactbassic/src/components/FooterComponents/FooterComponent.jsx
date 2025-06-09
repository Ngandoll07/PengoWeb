import React from 'react';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="footer-section left">
        <img src="/assets/user/logo.png" alt="Pengo Logo" className="footer-logo" />
        <p className="footer-description">
          "Luyện thi TOEIC hiệu quả với kho đề thi phong phú, bài giảng chi tiết và lộ trình học thông minh!"
        </p>
        <p className="footer-connect">KẾT NỐI VỚI CHÚNG TÔI</p>
        <div className="footer-social-icons">
          <i className="fab fa-facebook fa-lg"></i>
          <i className="fab fa-youtube fa-lg"></i>
          <i className="fab fa-instagram fa-lg"></i>
        </div>
      </div>

      <div className="footer-section middle">
        <h3 className="footer-title">TÍNH NĂNG NỔI BẬT</h3>
        <p className="footer-feature">Luyện TOEIC 4 kỹ năng</p>
        <p className="footer-feature">Tạo lộ trình học cá nhân</p>
      </div>

      <div className="footer-section right">
        <h3 className="footer-title">BẢN ĐỒ</h3>
        <div className="footer-map"></div>
      </div>
    </footer>
  );
}
