import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import './LoadingResultPage.css';

const LoadingResultPage = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { handleSubmitFn } = location.state || {};

  useEffect(() => {
    const run = async () => {
      if (handleSubmitFn) {
        await handleSubmitFn(); // gọi hàm chấm điểm
      }
    };
    run();
  }, [handleSubmitFn]);

  return (
    <div className="loading-container">
      <div className="spinner" />
      <p>Đang chấm bài... Vui lòng chờ trong giây lát.</p>
    </div>
  );
};

export default LoadingResultPage;
