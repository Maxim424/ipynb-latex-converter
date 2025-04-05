import React from "react";
import "./styles/PreviewPanel.css";

const PreviewPanel = ({ viewMode, previewTexUrl, previewPdfUrl }) => {
    const src =
        viewMode === "latex" ? previewTexUrl : previewPdfUrl;

    return (
        <div className="preview-panel">
            {src && (
                <iframe
                    src={src}
                    width="100%"
                    height="100%"
                    title="Preview"
                    style={{ border: "none", margin: "8px" }}
                />
            )}
        </div>
    );
};

export default PreviewPanel;
