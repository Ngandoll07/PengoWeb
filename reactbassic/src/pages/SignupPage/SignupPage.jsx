import React, { useState } from 'react';
import './SignupPage.css';
import { FiEye, FiEyeOff } from 'react-icons/fi';
import { FaArrowLeft } from 'react-icons/fa';
import axios from 'axios';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { useNavigate } from 'react-router-dom';

// ✅ HÀM KIỂM TRA DỮ LIỆU ĐẦU VÀO
function validateSignup(email, password) {
    if (!email) return "Vui lòng nhập email.";
    if (!email.endsWith("@gmail.com")) return "Email phải kết thúc bằng @gmail.com.";
    if (!password) return "Vui lòng nhập mật khẩu.";
    if (password.length < 6) return "Mật khẩu phải có ít nhất 6 ký tự.";
    return null;
}

export default function SignupPage() {
    const [showPassword, setShowPassword] = useState(false);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const togglePasswordVisibility = () => {
        setShowPassword(!showPassword);
    };

    const handleSignup = async () => {
        const error = validateSignup(email, password);
        if (error) {
            toast.warn(error);
            return;
        }

        try {
            const res = await axios.post('http://localhost:5000/api/register', {
                email,
                password
            });

            toast.success(res.data.message || 'Đăng ký thành công!', {
                autoClose: 2000,
                onClose: () => navigate('/login')
            });
        } catch (err) {
            const msg = err.response?.data?.message || 'Đăng ký thất bại!';
            toast.error(msg);
        }
    };

    return (
        <div className="signup-page">
            <div className="signup-box">
                <div className="signup-left">
                    <img src="/assets/user/signup.png" alt="signup" className="signup" />
                </div>

                <div className="signup-right">
                    <div className="back-to-login" onClick={() => navigate('/login')}>
                        <FaArrowLeft className="back-icon" />
                        <span>Đăng nhập</span>
                    </div>

                    <h2>Đăng ký</h2>

                    <input
                        type="email"
                        placeholder="Email"
                        value={email}
                        onChange={e => setEmail(e.target.value)}
                    />

                    <div className="password-wrapper">
                        <input
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Mật khẩu"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                        />
                        {showPassword ? (
                            <FiEyeOff className="eye-icon" onClick={togglePasswordVisibility} />
                        ) : (
                            <FiEye className="eye-icon" onClick={togglePasswordVisibility} />
                        )}
                    </div>

                    <button className="signup-btn" onClick={handleSignup}>Đăng ký</button>
                </div>
            </div>

            <ToastContainer
                position="top-right"
                autoClose={3000}
                hideProgressBar={false}
                newestOnTop={true}
                closeOnClick
                rtl={false}
                pauseOnFocusLoss
                draggable
                pauseOnHover
                theme="colored"
            />
        </div>
    );
}
