import React from "react";
import "./SelectionDropdown.css";

const SelectionDropdown = ({ label, value, options, onChange }) => {
    return (
        <div className="select-container">
            <label>{label}</label>
            <select value={value} onChange={(e) => onChange(e.target.value)}>
                {options.map((option) => (
                    <option key={option.value} value={option.value} title={option.title}>
                        {option.label}
                    </option>
                ))}
            </select>
        </div>
    );
};

export default SelectionDropdown;
