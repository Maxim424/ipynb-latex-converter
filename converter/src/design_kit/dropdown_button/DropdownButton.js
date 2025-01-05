import React, { useState } from "react";
import "./DropdownButton.css";

const DropdownButton = ({ title, options, disabled }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const handleClick = (option) => {
        option.action();
        setIsMenuOpen(false);
    };

    return (
        <div className="dropdown-button-container">
            <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="dropdown-button"
                disabled={disabled}
            >
                {title}
            </button>

            <div className={`dropdown-menu ${isMenuOpen ? "show" : ""}`}>
                {options.map((option) => (
                    <button
                        key={option.label}
                        className="dropdown-item"
                        onClick={() => handleClick(option)}
                    >
                        {option.label}
                    </button>
                ))}
            </div>
        </div>
    );
};

export default DropdownButton;
