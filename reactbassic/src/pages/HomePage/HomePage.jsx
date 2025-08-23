import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";
import HeroSlider from "../../components/HeroSlider/HeroSlider"; // nếu vẫn dùng hero slider trên, hoặc thay bằng hero tĩnh
import ScrollToTopButton from "../../components/ScrollToTopButton/ScrollToTopButton";
import Footer from "../../components/FooterComponents/FooterComponent";
import { useCart } from "../../context/CartContext"; // Thêm dòng này
import { FiAward, FiZap, FiBookOpen, FiRefreshCw } from "react-icons/fi";

const skills = [
  { name: "Grammar", subtitle: "Luyện ngữ pháp", icon: "🧠" , href: "/toeicframe"},
  { name: "Listening", subtitle: "Luyện nghe", icon: "🎧" },
  { name: "Writing", subtitle: "Luyện viết", icon: "✍️" },
  { name: "Speaking", subtitle: "Luyện nói", icon: "🗣️" },
  { name: "Reading", subtitle: "Luyện đọc", icon: "📖" },
  { name: "Vocabulary", subtitle: "Từ vựng", icon: "📝" },
  // thêm mở rộng
  { name: "Story-based Learning", subtitle: "Học qua câu chuyện", icon: "🔍" },
  { name: "12 Tenses Mastery ", subtitle: "Bài giảng 12 thì tiếng Anh", icon: "💡" },
  // { name: "Test Strategies", subtitle: "Chiến thuật thi", icon: "🧭" },
  // { name: "Mock Tests", subtitle: "Thi thử", icon: "🧪" },
  // { name: "Error Analysis", subtitle: "Phân tích lỗi", icon: "🔍" },
];

const courses = [
  {
    title: "TOEIC LISTENING & READING",
    subtitle: "Khóa học cơ bản đến nâng cao",
    tag: "Popular",
    image: "/assets/user/course1.jpg",
    price: "Free",
    lessons: 24,
  },
  {
    title: "TOEIC SPEAKING & WRITING",
    subtitle: "Phát triển kỹ năng nói & viết",
    tag: "New",
    image: "/assets/user/course2.jpg",
    price: "600.000VND",
    lessons: 18,
  },
  {
    title: "TOEIC 4 KỸ NĂNG",
    subtitle: "Tổng hợp toàn diện",
    tag: "Recommend",
    image: "/assets/user/course3.jpg",
    price: "Free",
    lessons: 40,
  },
];


export default function HomePage({ course }) {
  const navigate = useNavigate();
  
 const [showModal, setShowModal] = useState(false);
    const { addToCart } = useCart(); // Lấy hàm từ context
  return (
    <div className="homepage-root">
      <HeroSlider/> 
      {/* Courses Preview */}
      <section className="courses-section">
        <div className="section-header">
          <div className="small-label"></div>
          <h2>Khóa học tiêu biểu của chúng tôi</h2>
          <p className="desc">
            Hành trình học tập được cá nhân hoá, giúp bạn tiến bộ từng ngày.
          </p>
        </div>
        <div className="course-cards">
          {courses.map((c, i) => (
            <div key={i} className="course-card1">
              <div className="card-top">
                <div className="tag">{c.tag}</div>
                <img src={c.image} alt={c.title} className="course-img" />
              </div>
              <div className="card-body">
                <h3>{c.title}</h3>
                <p className="subtitle">{c.subtitle}</p>
                <div className="meta">
                  <span>{c.lessons} Lessons</span>
                  <span className="price">{c.price}</span>
                </div>
             <div className="course-actions">
                        <button className="preview-button" onClick={() => setShowModal(true)}>
                            Xem trước
                        </button>
                        <button
                            className="buy-button"
                            onClick={() => addToCart(course)}
                        >
                            Mua ngay
                        </button>
                    </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Welcome Section */}
      <section className="welcome-section">
        <div className="welcome-content">
          <div className="welcome-images">
            <div className="photo-group">
              <img src="/assets/user/photo1.jpg" alt="student" className="photo photo-1" />
              <img src="/assets/user/photo2.jpg" alt="graduate" className="photo photo-2" />
            </div>
          </div>
          <div className="welcome-text">
  <h2>Pengo - Hỗ trợ học TOEIC 2 kỹ năng</h2>
  <p className="small">
    Pengo giúp bạn cải thiện Listening & Reading với lộ trình cá nhân hóa, phản hồi
    thông minh và chiến lược nâng điểm hiệu quả.
  </p>
  <div className="features">
    <div className="feature">
      <div className="icon-wrapper"><FiAward /></div>
      <div>
        <div className="title">Phân tích chính xác</div>
        <div className="desc">AI đánh giá chi tiết từng kỹ năng Listening & Reading</div>
      </div>
    </div>
    <div className="feature">
      <div className="icon-wrapper"><FiZap /></div>
      <div>
        <div className="title">Lộ trình cá nhân hóa</div>
        <div className="desc">Đề xuất bài học dựa trên điểm mạnh, điểm yếu của bạn</div>
      </div>
    </div>
    <div className="feature">
      <div className="icon-wrapper"><FiBookOpen /></div>
      <div>
        <div className="title">Tài liệu thực chiến</div>
        <div className="desc">Bài tập giống đề thi thật, luyện theo chủ đề</div>
      </div>
    </div>
    <div className="feature">
      <div className="icon-wrapper"><FiRefreshCw /></div>
      <div>
        <div className="title">Theo dõi tiến bộ</div>
        <div className="desc">So sánh kết quả qua thời gian, tối ưu hóa việc ôn tập</div>
      </div>
    </div>
  </div>

  <button className="read-more">Tìm hiểu thêm →</button>
</div>

        </div>
      </section>

      {/* CTA Strip */}
          <section className="cta-strip">
            <div className="cta-inner">
              <div className="cta-illustration">
                <img
                  src="/assets/user/lnr.jpg"
                  alt="Test TOEIC"
                />
              </div>
              <div className="cta-text">
                <h2>Kiểm tra trình độ TOEIC 2 kỹ năng</h2>
                <p>
                  Tự đánh giá nhanh khả năng Listening & Reading của bạn để nhận lộ trình cá nhân hóa phù hợp.
                </p>
                <a href="/practicelisnread">
                <button
            className="cta-btn"
            onClick={() => {
              // tracking example
              console.log("User clicked test CTA");
              navigate("/practicelisnread");
            }}
          >
            Làm bài thi thử
          </button>

                </a>
              </div>
            </div>
          </section>

           <section className="skill-blocks">
      <div className="header1">
        <h2>Chọn kỹ năng bạn muốn cải thiện</h2>
        <p>Học từng phần với AI hỗ trợ: nghe, nói, đọc, viết, từ vựng, ngữ pháp và hơn thế nữa.</p>
      </div>
      <div className="grid">
        {skills.map((s) => (
          <div className="card2" key={s.name}>
            <div className="icon1">{s.icon}</div>
            <div className="info">
              <div className="title"><a href= {s.href}>{s.name}</a></div>
              <div className="subtitle">{s.subtitle}</div>
            </div>
          </div>
        ))}
      </div>
    </section>
      <Footer />
      <ScrollToTopButton />
    </div>
  );
}
