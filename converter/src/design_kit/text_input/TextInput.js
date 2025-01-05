import React from "react";
import "./TextInput.css";

const TextInput = ({ label, value, onChange, title }) => {
    return (
        <div className="text-input-container">
            <label>{label}</label>
            <input
                type="number"
                id="indent"
                min="0"
                max="50"
                step="5"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                title={title}
            />
        </div>
    );
};

export default TextInput;