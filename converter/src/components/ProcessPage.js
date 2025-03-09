import React, { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import "./ProcessPage.css";
import NotebookCells from "./NotebookCells";

function ProcessPage({
    fileContent,
    handleFileLoad,
    texContent,
    onConvert,
    onDownload,
    selectedCells,
    onCheckboxChange
}) {
    const location = useLocation();
    const file = location.state?.file;
    const fileLoaded = useRef(false);

    useEffect(() => {
        if (file && !fileLoaded.current) {
            const reader = new FileReader();
            reader.onload = (e) => handleFileLoad(e.target.result);
            reader.readAsText(file);
            fileLoaded.current = true;
        }
    }, [file, handleFileLoad]);
    

    return (
        <div className="process-parent-container">
            <div className="process-container">
                <div className="process-column process-column-1">
                    <div className="process-settings-header">Settings</div>
                    <div className="process-settings">
                        <button onClick={() => onConvert(file)} className="process-download-button">
                            Конвертировать
                        </button>
                        <button onClick={() => onDownload(file)} className="process-download-button">
                            Скачать
                        </button>
                    </div>
                </div>
                <div className="process-column process-column-2">
                    <div className="process-column-header">Notebook cells</div>
                    <NotebookCells jsonString={fileContent} selectedCells={selectedCells} onCheckboxChange={onCheckboxChange} />
                </div>
                <div className="process-column process-column-3">
                    <div className="process-column-header">LaTeX</div>
                    <pre>{texContent}</pre>
                </div>
            </div>
        </div>
    );
}

export default ProcessPage;
