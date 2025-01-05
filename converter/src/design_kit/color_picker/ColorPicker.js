import React, { useState } from "react";
import "./ColorPicker.css";

const ColorPicker = ({ label, value, onChange, title }) => {
    return (
        <div className="picker-container">
            <label className="picker-label">{label}</label>
            <input className="picker-input"
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                title={title}
            />
        </div>
    );
};

export default ColorPicker;
