import React, { useEffect, useState } from 'react';
import './MyProfilePage.css';
import Footer from '../../components/FooterComponents/FooterComponent';
import axios from 'axios';

export default function MyProfilePage() {
  const [formData, setFormData] = useState({
    email: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [image, setImage] = useState(null);
  const [user, setUser] = useState(null); // thêm state user

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user'));
    if (storedUser) {
      setUser(storedUser);
      setFormData(prev => ({
        ...prev,
        email: storedUser.email || ''
      }));
    }
  }, []);

  // Xử lý thay đổi input
  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // Xử lý ảnh đại diện (tạm thời chỉ preview)
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
    }
  };

  // Xử lý lưu
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.currentPassword || !formData.newPassword || !formData.confirmPassword) {
      alert("Vui lòng nhập đầy đủ mật khẩu!");
      return;
    }
    if (formData.newPassword !== formData.confirmPassword) {
      alert("Mật khẩu mới và xác nhận không khớp!");
      return;
    }

    try {
      const userId = localStorage.getItem("userId");
      const res = await axios.put("http://localhost:5000/api/users/change-password", {
        userId,
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword
      });
      alert(res.data.message || "Đổi mật khẩu thành công!");
    } catch (err) {
      alert(err.response?.data?.message || "Đổi mật khẩu thất bại!");
    }
  };

  return (
    <div className="profile-container">
      <div className="main">
        <div className="content">
          {/* Avatar + Email + Đổi mật khẩu */}
          <div className="avatar-container">
            <img
              src={image || user?.avatar || '/assets/user/logo.png'}
              alt="Avatar"
              className="avatar"
            />
            <label className="upload-label">
              Chọn ảnh
              <input type="file" className="hidden" onChange={handleImageChange} />
            </label>
          </div>

          <form className="form" onSubmit={handleSubmit}>
            <input
              type="email"
              name="email"
              value={formData.email}
              readOnly
            />

            <input
              type="password"
              name="currentPassword"
              placeholder="Mật khẩu hiện tại"
              value={formData.currentPassword}
              onChange={handleInputChange}
            />

            <input
              type="password"
              name="newPassword"
              placeholder="Mật khẩu mới"
              value={formData.newPassword}
              onChange={handleInputChange}
            />

            <input
              type="password"
              name="confirmPassword"
              placeholder="Xác nhận mật khẩu"
              value={formData.confirmPassword}
              onChange={handleInputChange}
            />

            <div className="form-buttons">
              <button type="button" className="cancel">Hủy</button>
              <button type="submit" className="save">Lưu</button>
            </div>
          </form>
        </div>
      </div>

      <Footer />
    </div>
  );
}
