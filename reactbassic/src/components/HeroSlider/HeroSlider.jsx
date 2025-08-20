import React from "react";
import './slider.css';

const HeroSection = () => {
  return (
    <section className="hero">
      <div className="hero-left">
        <h1>
        <span className="highlight">Học thông minh</span>, cảm giác như lớp học thực tế
        </h1>
        <p className="subtitle1">
        Lộ trình cá nhân hóa giúp bạn tiến bộ từng ngày
        </p>
        <button className="btn-get-started">Bắt đầu ngay</button>
      </div>

      <div className="hero-right">
        <img
          src="/assets/user/slide.png"
          alt="Hero Illustration"
          className="hero-main"
        />
        {/* Icon trang trí */}
        <img
          src="/assets/user/phantu.png"
          alt="Globe"
          className="icon globe"
        />
        <img
          src="/assets/user/note.png"
          alt="Flask"
          className="icon flask"
        />
        <img
          src="/assets/user/book.jpg"
          alt="Book"
          className="icon book"
        />
          <img
          src="/assets/user/pen.png"
          alt="Phantu"
          className="icon phantu"
        />
      </div>
    </section>
  );
};

export default HeroSection;
