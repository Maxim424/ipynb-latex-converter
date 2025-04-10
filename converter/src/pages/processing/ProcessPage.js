import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import "./styles/ProcessPage.css";
import ControlsPanel from "./ControlsPanel";
import NotebookStructurePanel from "./NotebookStructurePanel";
import PreviewPanel from "./PreviewPanel";
import SegmentedControl from "../../design_kit/segmented_control/SegmentedControl";

function ProcessPage({
    fileContent,
    handleFileLoad,
    onConvert,
    handleDownload,
    selectedCells,
    setSelectedCells,
    handleCellToggle,
    handleOutputToggle,
    selectionMode,
    setSelectionMode,
    outputSelectionMode,
    setOutputSelectionMode,
    previewPdfUrl,
    previewTexUrl,
    codeBg,
    setCodeBg
}) {
    const [screenWidth, setScreenWidth] = useState(window.innerWidth);
    const location = useLocation();
    const file = location.state?.file;
    const fileLoaded = useRef(false);

    const [leftWidth, setLeftWidth] = useState(350); // Начальная ширина левой панели
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

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
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

    return (
        <div className="process-parent-container">
            <div className="process-settings-column">
                <div className="process-settins-column-header">Settings</div>
                <div className="process-settings">
                    <ControlsPanel
                        file={file}
                        onConvert={onConvert}
                        handleDownload={handleDownload}
                        selectionMode={selectionMode}
                        setSelectionMode={setSelectionMode}
                        outputSelectionMode={outputSelectionMode}
                        setOutputSelectionMode={setOutputSelectionMode}
                        setSelectedCells={setSelectedCells}
                        cells={cells}
                        codeBg={codeBg}
                        setCodeBg={setCodeBg}
                    />
                </div>
            </div>
            <div ref={leftContainerRef} className="process-file-structure-column" style={{ width: leftWidth }}>
                <div className="process-file-structure-column-header">Notebook cells</div>
                <NotebookStructurePanel
                    jsonString={fileContent}
                    selectedCells={selectedCells}
                    handleCellToggle={handleCellToggle}
                    handleOutputToggle={handleOutputToggle}
                />
            </div>
            <div className="resizer" onMouseDown={handleMouseDown} />
            <div className="process-preview-column" style={{ width: 0.8 * screenWidth - leftWidth - 16 }}>
                <div className="process-preview-column-header">
                    <span>Preview</span>
                    <SegmentedControl
                        options={[
                            { label: "LaTeX", value: "latex" },
                            { label: "PDF", value: "pdf" }
                        ]}
                        selected={viewMode}
                        onChange={setViewMode}
                    />
                </div>
                <PreviewPanel
                    viewMode={viewMode}
                    previewTexUrl={previewTexUrl}
                    previewPdfUrl={previewPdfUrl}
                />
            </div>
        </div>
    );
}

export default ProcessPage;
