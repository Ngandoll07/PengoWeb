import React from "react";
import AdminHeader from "../../../components/admin/HeaderAdmin/Header";
import "./Dashboard.css";
import { FaStar } from "react-icons/fa";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Legend,
  ResponsiveContainer
} from "recharts";
import Slider from "react-slick";
import { motion } from "framer-motion";
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
  testStats: [
    { name: "Tháng 1", value: 800 },
    { name: "Tháng 2", value: 1200 },
    { name: "Tháng 3", value: 1500 }
  ],
  progress: [
    { name: "Hoàn thành", value: 60 },
    { name: "Đang học", value: 30 },
    { name: "Bỏ dở", value: 10 }
  ],
  skillStats: [
    { name: "Nghe", value: 7.5 },
    { name: "Đọc", value: 7.2 },
    { name: "Viết", value: 6.8 },
    { name: "Nói", value: 7.0 }
  ]
};

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
        <div className="chart-wrapper-large user-join-card">
          <h3 className="chart-title">Tỉ lệ hoàn thành lộ trình</h3>
          <PieChart width={220} height={220}>
            <Pie
              data={dashboardData.progress}
              cx="50%"
              cy="50%"
              outerRadius={80}
              dataKey="value"
            >
              {dashboardData.progress.map((entry, i) => (
                <Cell key={`progress-${i}`} fill={COLORS[i % COLORS.length]} />
              ))}
            </Pie>
            <Tooltip />
          </PieChart>
        </div>

        <div className="chart-wrapper-large">
          <h3 className="chart-title">Điểm trung bình theo kỹ năng</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dashboardData.skillStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis domain={[0, 10]} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#FF9EAA" name="Điểm trung bình" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="chart-slider-container">
        <div className="bar-chart-container">
          <h3 className="chart-title">Bài test theo tháng</h3>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={dashboardData.testStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#fd6d6d" name="Bài test" />
            </BarChart>
          </ResponsiveContainer>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
