import React, { useState, useEffect } from "react";
import { FiArrowUp } from "react-icons/fi";
import './ScrollToTopButton.css'

export default function ScrollToTopButton() {
  const [visible, setVisible] = useState(false);
  const [rippleStyle, setRippleStyle] = useState(null);

  useEffect(() => {
    const onScroll = () => setVisible(window.scrollY > 300);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const handleClick = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const size = Math.max(rect.width, rect.height);
    const x = e.clientX - rect.left - size / 2;
    const y = e.clientY - rect.top - size / 2;
    setRippleStyle({ top: y + "px", left: x + "px", width: size + "px", height: size + "px" });

    window.scrollTo({ top: 0, behavior: "smooth" });

    // clear ripple after animation
    setTimeout(() => setRippleStyle(null), 500);
  };

  return (
    <button
      aria-label="Lên đầu trang"
      className={`scroll-to-top dynamic ${visible ? "show" : ""}`}
      onClick={handleClick}
    >
      {rippleStyle && <span className="ripple" style={rippleStyle} />}
      <FiArrowUp size={20} />
    </button>
  );
}
