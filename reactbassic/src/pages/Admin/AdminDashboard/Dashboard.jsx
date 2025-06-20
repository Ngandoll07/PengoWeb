import AdminHeader from "../../../components/admin/HeaderAdmin/Header";
import "./Dashboard.css";
import { FaStar } from "react-icons/fa";
import { PieChart, Pie, Cell, Tooltip } from "recharts";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

const COLORS = ["#FFD0D0", "#FF9EAA", "#fd6d6d"];

// Dữ liệu mẫu (mock)
const dashboardData = {
  bestSellers: [
    { name: "Sản phẩm A", value: 400 },
    { name: "Sản phẩm B", value: 300 },
    { name: "Sản phẩm C", value: 200 }
  ],
  userJoins: 1234,
  revenue: [
    { name: "Tháng 1", value: 1200 },
    { name: "Tháng 2", value: 1500 },
    { name: "Tháng 3", value: 1700 }
  ]
};

const reviews = [
  {
    reviewTime: "2024-06-01",
    comment: "Rất tốt!",
    rating: 5,
    image: "https://via.placeholder.com/100"
  },
  {
    reviewTime: "2024-06-02",
    comment: "Hài lòng",
    rating: 4,
    image: "https://via.placeholder.com/100"
  }
];

const AdminDashboard = () => {
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    autoplay: true,
    autoplaySpeed: 3000
  };

  return (
    <div className="admin-dashboard">
      <AdminHeader />

      <div className="chart-container">
        <div className="chart-wrapper-large">
          <h3 className="chart-title">Best Sellers</h3>
          <div className="chart-wrapper">
            <PieChart width={220} height={220}>
              <Pie
                data={dashboardData.bestSellers}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {dashboardData.bestSellers.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </div>
        </div>

        <div className="chart-wrapper-large user-join-card">
          <h3 className="chart-title">User Join</h3>
          <div className="chart-wrapper">
            <div className="user-join-content">
              <div className="user-join-number">
                {dashboardData.userJoins}
              </div>
            </div>
          </div>
        </div>

        <div className="chart-wrapper-large">
          <h3 className="chart-title">Revenue</h3>
          <div className="chart-wrapper">
            <PieChart width={220} height={220}>
              <Pie
                data={dashboardData.revenue}
                cx="50%"
                cy="50%"
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {dashboardData.revenue.map((entry, i) => (
                  <Cell key={`rev-${i}`} fill={COLORS[i % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </div>
        </div>
      </div>

      <div className="chart-slider-container">
        <div className="bar-chart-container">
          <h2>Top Selling Products</h2>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={dashboardData.bestSellers}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Legend />
              <Bar dataKey="value" fill="#fd6d6d" name="Sales" />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="comment-slider">
          <Slider {...sliderSettings}>
            {reviews.map((review, index) => (
              <div className="comment-card" key={index}>
                <h4>{review.reviewTime}</h4>
                <img
                  src={review.image}
                  alt="product"
                  className="image-product-comment"
                />
                <p>"{review.comment}"</p>
                <p>
                  {review.rating}/5 <FaStar className="star-comment-slider" />
                </p>
              </div>
            ))}
          </Slider>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
