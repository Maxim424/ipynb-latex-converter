import React from "react";
import AsyncButton from "../../design_kit/async_button/AsyncButton";
import DropdownButton from "../../design_kit/dropdown_button/DropdownButton";
import "./styles/ControlsPanel.css";

const ControlsPanel = ({
    file,
    onConvert,
    handleDownload,
    selectionMode,
    updateSelection
}) => {
    return (
        <div className="controls-panel">
            <AsyncButton action={() => onConvert(file)} title="Convert" />
            <DropdownButton
                title="Download"
                options={[
                    { label: "Скачать .tex", action: () => handleDownload(file, "tex") },
                    { label: "Скачать .pdf", action: () => handleDownload(file, "pdf") }
                ]}
            />

            <div className="select-container">
                <label>Cell selection:</label>
                <select value={selectionMode} onChange={(e) => updateSelection(e.target.value)}>
                    <option value="all">All</option>
                    <option value="code">Code</option>
                    <option value="text">Text</option>
                    <option value="custom">Custom</option>
                </select>
            </div>
        </div>
    );
};

export default ControlsPanel;
