import React from 'react';
import './Footer.css';

export default function Footer() {
  return (
   <footer className="footer">
  <div className="footer-container">
    {/* LEFT */}
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

    {/* MIDDLE */}
    <div className="footer-section middle">
      <h3 className="footer-title">TÍNH NĂNG NỔI BẬT</h3>
      <ul className="footer-feature-list">
        <li><i className="fas fa-book-open"></i> Luyện TOEIC 4 kỹ năng</li>
        <li><i className="fas fa-route"></i> Tạo lộ trình học cá nhân</li>
        <li><i className="fas fa-chart-line"></i> Theo dõi tiến độ học tập</li>
      </ul>
    </div>

    {/* RIGHT */}
    <div className="footer-section right">
      <h3 className="footer-title">BẢN ĐỒ</h3>
      <div className="footer-map">
        <iframe
          title="Google Map"
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3919.455416663797!2d106.700423775034!3d10.776893959273925!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x31752eddf6b4b3ed%3A0xf2a55a3a3bb7b9c6!2zQ8O0bmcgdHkgQ-G7lSBwaOG6p24gU0FJVEVDSA!5e0!3m2!1svi!2s!4v1692868973057!5m2!1svi!2s"
          width="100%"
          height="200"
          style={{ border: 0 }}
          allowFullScreen=""
          loading="lazy"
          referrerPolicy="no-referrer-when-downgrade"
        ></iframe>
      </div>
    </div>
  </div>
</footer>

  );
}
