import React from 'react';
import './Footer.css';
import {
  FaFacebookF,
  FaYoutube,
  FaInstagram,
  FaBookOpen,
  FaRoute,
  FaChartLine,
  FaEnvelope,
  FaMapMarkerAlt,
} from 'react-icons/fa';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="footer1">
      <div className="footer-container">
        {/* Column 1: Logo & Social */}
        <div className="footer-section left">
          <img src="/assets/user/logo.png" alt="Pengo Logo" className="footer-logo" />
          <p className="footer-description">
            "Luyện thi TOEIC hiệu quả với kho đề thi phong phú, bài giảng chi tiết và lộ trình học thông minh!"
          </p>
          <p className="footer-subtitle">Kết nối với chúng tôi</p>
           <div className="footer-social-icons">
            <a href="#" aria-label="Facebook" target="_blank" rel="noopener noreferrer">
              <FaFacebookF />
            </a>
            <a href="#" aria-label="YouTube" target="_blank" rel="noopener noreferrer">
              <FaYoutube />
            </a>
            <a href="#" aria-label="Instagram" target="_blank" rel="noopener noreferrer">
              <FaInstagram />
            </a>
          </div>
          <div className="contact-line">
              <FaEnvelope className="contact-icon" />
            <span>support@pengo.vn</span>
          </div>
        </div>

        {/* Column 2: Features */}
        <div className="footer-section center">
          <h3 className="footer-title1">Tính năng nổi bật</h3>
          <ul className="feature-list1">
            <li><FaBookOpen className="icon2" /> Luyện TOEIC 2 kỹ năng</li>
            <li><FaRoute className="icon2" /> Tạo lộ trình học cá nhân</li>
            <li><FaChartLine className="icon2" /> Theo dõi tiến độ học tập</li>
          </ul>
        </div>

        {/* Column 3: Contact Info */}
        <div className="footer-section right">
          <h3 className="footer-title1">Liên hệ</h3>
          <div className="contact-info">
            <div className="info-block">
                 <FaEnvelope className="contact-icon" />
              <div>
                <strong>Văn phòng Pengo</strong>
                <p>Quận 1, TP. Hồ Chí Minh, Việt Nam</p>
              </div>
            </div>
            <div className="info-block">
                <FaEnvelope className="contact-icon" /> 
              <div>
                <strong>Email hỗ trợ</strong>
                <p>support@pengo.vn</p>
              </div>
            </div>
          </div>
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

      {/* Bottom copyright */}
      <div className="footer-bottom">
        <span>© {currentYear} Pengo. All rights reserved.</span>
        <span>Thiết kế bởi Pengo Team</span>
      </div>
    </footer>
  );
}
