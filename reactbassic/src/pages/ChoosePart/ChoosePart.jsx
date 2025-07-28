// src/pages/ChoosePart.jsx
import React from "react";
import { useNavigate } from "react-router-dom";
import "./ChoosePart.css";

export default function ChoosePart() {
    const navigate = useNavigate();

    const handleSelect = (part) => {
        navigate(`/practice-speaking/${part}`);
    };

    return (
        <div className="choose-part-container">
            <h2>🎙️ Chọn Part để luyện Speaking</h2>
            <div className="part-button-group">
                {[1, 2, 3, 4, 5].map((part) => (
                    <button key={part} onClick={() => handleSelect(part)}>
                        Part {part}
                    </button>
                ))}
            </div>
        </div>
    );
}
