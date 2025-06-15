import React, { useState } from 'react';
import './SignupPage.css';
import { FiEye, FiEyeOff } from 'react-icons/fi'; // thêm FiEyeOff để đổi icon khi đang hiển mật khẩu

export default function SignupPage() {
    const [showPassword, setShowPassword] = useState(false); // tạo state

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword); // đổi true <-> false khi click
    };

    return (
        <div className="signup-page">
            <div className="signup-box">
                <div className="signup-left">
                    <img src="/assets/user/signup.png" alt="signup" className="signup" />
                </div>
                <div className="signup-right">
                    <h2>Đăng ký</h2>
                    <input type="email" placeholder="Email" />
                    <div className="password-wrapper">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Mật khẩu"
                        />
                        {showPassword ? (
                            <FiEyeOff className="eye-icon" onClick={togglePasswordVisibility} />
                        ) : (
                            <FiEye className="eye-icon" onClick={togglePasswordVisibility} />
                        )}
                    </div>
                    <button className="signup-btn">Đăng ký</button>
                </div>
            </div>
        </div>
    );
}
