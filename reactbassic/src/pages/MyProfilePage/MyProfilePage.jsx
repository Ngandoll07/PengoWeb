import React, { useState } from 'react';
import './MyProfilePage.css';
import Footer from '../../components/FooterComponents/FooterComponent';

export default function MyProfilePage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    birthdate: '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [activeTab, setActiveTab] = useState('info');
  const [image, setImage] = useState(null);

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(URL.createObjectURL(file));
    }
  };

  return (
    <div className="profile-container">

      {/* Main Content */}
      <div className="main">
        {/* Sidebar */}
        <div className="sidebar-custom">
      <button
        className={`sidebar-btn ${activeTab === 'info' ? 'active' : ''}`}
        onClick={() => setActiveTab('info')}
      >
        <span className="icon">👁‍🗨</span> Thông tin
      </button>
      <button
        className={`sidebar-btn ${activeTab === 'password' ? 'active' : ''}`}
        onClick={() => setActiveTab('password')}
      >
        <span className="icon key">🗝️</span> Mật khẩu
      </button>
    </div>

        {/* Form */}
        <div className="content">
          {activeTab === 'info' && (
            <>
              <div className="avatar-container">
                <img src={image || '/assets/user/logo.png'} alt="Avatar" className="avatar" />
                <label className="upload-label">
                  Chọn ảnh
                  <input type="file" className="hidden" onChange={handleImageChange} />
                </label>
              </div>
              <div className="form">
                <input name="name" placeholder="Tên" value={formData.name} onChange={handleInputChange} />
                <input name="email" placeholder="Email" value={formData.email} onChange={handleInputChange} />
                <input name="phone" placeholder="Số điện thoại" value={formData.phone} onChange={handleInputChange} />
                <input name="birthdate" type="date" value={formData.birthdate} onChange={handleInputChange} />
                <div className="form-buttons">
                  <button className="cancel">Hủy</button>
                  <button className="save">Lưu</button>
                </div>
              </div>
            </>
          )}

          {activeTab === 'password' && (
            <div className="form">
              <input name="currentPassword" type="password" placeholder="Mật khẩu hiện tại" onChange={handleInputChange} />
              <input name="newPassword" type="password" placeholder="Mật khẩu mới" onChange={handleInputChange} />
              <input name="confirmPassword" type="password" placeholder="Xác nhận mật khẩu" onChange={handleInputChange} />
              <div className="form-buttons">
                <button className="cancel">Hủy</button>
                <button className="save">Đổi mật khẩu</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer */}
<Footer/>
    </div>
  );
}
