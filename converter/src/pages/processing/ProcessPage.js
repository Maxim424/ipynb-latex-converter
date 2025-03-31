import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import "./styles/ProcessPage.css";
import NotebookCells from "./NotebookCells";
import AsyncButton from "../../design_kit/button/AsyncButton";

function ProcessPage({
    fileContent,
    handleFileLoad,
    texContent,
    pdfUrl,
    onConvert,
    onDownload,
    selectedCells,
    setSelectedCells,
    onCheckboxChange,
    selectionMode,
    setSelectionMode
}) {
    const [screenWidth, setScreenWidth] = useState(window.innerWidth);
    const location = useLocation();
    const file = location.state?.file;
    const fileLoaded = useRef(false);

    const [leftWidth, setLeftWidth] = useState(250); // Начальная ширина левой панели
    const leftContainerRef = useRef(null);
    const isResizing = useRef(false);
    const [viewMode, setViewMode] = useState("latex"); // 'latex' или 'pdf'

    const handleMouseDown = (event) => {
        isResizing.current = true;
        document.addEventListener("mousemove", handleMouseMove);
        document.addEventListener("mouseup", handleMouseUp);
    };

    const handleMouseUp = () => {
        isResizing.current = false;
        document.removeEventListener("mousemove", handleMouseMove);
        document.removeEventListener("mouseup", handleMouseUp);
    };

    const handleMouseMove = (event) => {
        if (!isResizing.current || !leftContainerRef.current) return;

        const leftContainerRect = leftContainerRef.current.getBoundingClientRect();
        const newLeftWidth = event.clientX - leftContainerRect.left;

        // Ограничиваем минимальную и максимальную ширину колонок

        if (newLeftWidth > 300) {
            setLeftWidth(newLeftWidth - 8);
        }
    };

    useEffect(() => {
        if (file && !fileLoaded.current) {
            const reader = new FileReader();
            reader.onload = (e) => handleFileLoad(e.target.result);
            reader.readAsText(file);
            fileLoaded.current = true;
        }
        const handleResize = () => {
            setScreenWidth(window.innerWidth); // Обновление ширины при изменении размера экрана
        };

        window.addEventListener("resize", handleResize); // Добавляем слушатель события изменения размера окна

        return () => {
            window.removeEventListener("resize", handleResize); // Убираем слушатель при размонтировании компонента
        };
    }, [file, handleFileLoad]);

    const parseCells = (jsonString) => {
        try {
            const notebook = JSON.parse(jsonString);
            return notebook.cells || [];
        } catch (error) {
            console.error("Error parsing JSON:", error);
            return [];
        }
    };

    const cells = parseCells(fileContent);

    const updateSelection = (mode) => {
        setSelectionMode(mode);

        switch (mode) {
            case "all":
                setSelectedCells(cells.map((_, index) => index)); // Все ячейки
                break;
            case "code":
                setSelectedCells(
                    cells
                        .map((cell, index) => (cell.cell_type === "code" ? index : null))
                        .filter((index) => index !== null)
                );
                break;
            case "text":
                setSelectedCells(
                    cells
                        .map((cell, index) => (cell.cell_type === "markdown" ? index : null))
                        .filter((index) => index !== null)
                );
                break;
            case "custom":
                // Оставляем selectedCells как есть
                break;
            default:
                break;
        }
    };

    return (
        <div className="process-parent-container">
            <div className="process-settings-column">
                <div className="process-settins-column-header">Settings</div>
                <div className="process-settings">
                    <AsyncButton action={() => onConvert(file)} title="Convert" />
                    <AsyncButton action={() => onDownload(file)} title="Download" />

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
            </div>
            <div ref={leftContainerRef} className="process-file-structure-column" style={{ width: leftWidth }}>
                <div className="process-file-structure-column-header">Notebook cells</div>
                <NotebookCells jsonString={fileContent} selectedCells={selectedCells} onCheckboxChange={onCheckboxChange} />
            </div>
            <div className="resizer" onMouseDown={handleMouseDown} />
            <div className="process-preview-column" style={{ width: 0.8 * screenWidth - leftWidth - 16 }}>
                <div className="process-preview-column-header">
                    <span>Preview</span>

                    {/* Переключатель */}
                    <div className="preview-toggle">
                        <button
                            className={viewMode === "latex" ? "active" : ""}
                            onClick={() => setViewMode("latex")}
                        >
                            LaTeX
                        </button>
                        <button
                            className={viewMode === "pdf" ? "active" : ""}
                            onClick={() => setViewMode("pdf")}
                        >
                            PDF
                        </button>
                    </div>
                </div>
                {viewMode === "latex" ? (
                    <pre
                        style={{
                            whiteSpace: "pre-wrap",
                            wordWrap: "break-word",
                            padding: "0px 16px",
                        }}
                    >
                        {texContent}
                    </pre>
                ) : (
                    pdfUrl && (
                        <iframe
                            src={pdfUrl}
                            width="calc(100% - 16px)"
                            height="100%"
                            title="Generated PDF"
                        ></iframe>
                    )
                )}
            </div>
        </div>
    );
}

export default ProcessPage;
