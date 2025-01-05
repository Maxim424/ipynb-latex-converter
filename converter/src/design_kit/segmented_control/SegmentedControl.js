import React from "react";
import "./SegmentedControl.css";

const SegmentedControl = ({ options, selected, onChange }) => {
    return (
        <div className="segmented-control">
            {options.map((option) => (
                <button
                    key={option.value}
                    className={selected === option.value ? "active" : ""}
                    onClick={() => onChange(option.value)}
                    title={option.title}
                >
                    {option.label}
                </button>
            ))}
        </div>
    );
};

export default SegmentedControl;
