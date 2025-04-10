import React, { useState } from "react";
import "./ColorPicker.css";

const ColorPicker = ({ title, value, onChange }) => {
    return (
        <div>
            <label className="picker-label">{title}</label>
            <input className="picker-input"
                type="color"
                value={value}
                onChange={(e) => onChange(e.target.value)}
            />
        </div>
    );
};

export default ColorPicker;
