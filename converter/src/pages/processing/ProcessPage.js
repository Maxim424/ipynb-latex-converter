import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router-dom";
import "./styles/ProcessPage.css";
import ControlsPanel from "./ControlsPanel";
import NotebookStructurePanel from "./NotebookStructurePanel";
import PreviewPanel from "./PreviewPanel";
import SegmentedControl from "../../design_kit/segmented_control/SegmentedControl";
import { useToast } from "../../design_kit/notification/ToastContext";

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
    setCodeBg,
    includeCellNumbers,
    setIncludeCellNumbers,
    indent,
    setIndent,
    removeComments,
    setRemoveComments
}) {
    const [screenWidth, setScreenWidth] = useState(window.innerWidth);
    const location = useLocation();
    const files = location.state?.files || [];
    const filesLoaded = useRef(false);
    const { showToast } = useToast();
    const [showModal, setShowModal] = useState(false);

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

        if (newLeftWidth > 300) {
            setLeftWidth(newLeftWidth - 8);
        }
    };

    const loadSelectedFile = async () => {
        try {
            await handleFileLoad(files);
            filesLoaded.current = true
        } catch (error) {
            showToast("Ошибка при загрузке файла");
        }
    };

    useEffect(() => {
        if (files.length > 0 && !filesLoaded.current) {
            loadSelectedFile();
        }

        const handleResize = () => {
            setScreenWidth(window.innerWidth);
        };

        window.addEventListener("resize", handleResize);

        return () => {
            window.removeEventListener("resize", handleResize);
        };
    }, [files, loadSelectedFile]);

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
                <div className="process-settins-column-header">
                    <button
                        className="home-button"
                        onClick={() => setShowModal(true)}
                        title="К новому проекту"
                    >
                        <img src={require('./../../design_kit/icons/house.svg').default} alt="House" />
                    </button>
                    <span>Настройки</span>
                </div>
                <div className="process-settings">
                    <ControlsPanel
                        files={files}
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
                        includeCellNumbers={includeCellNumbers}
                        setIncludeCellNumbers={setIncludeCellNumbers}
                        indent={indent}
                        setIndent={setIndent}
                        removeComments={removeComments}
                        setRemoveComments={setRemoveComments}
                        downloadDisabled={previewTexUrl === ''}
                    />
                </div>
            </div>
            <div ref={leftContainerRef} className="process-file-structure-column" style={{ width: leftWidth }}>
                <div className="process-file-structure-column-header">
                    <span>Ячейки .ipynb</span>
                </div>
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
                            { label: "LaTeX", value: "latex", title: "Показать LaTeX превью" },
                            { label: "PDF", value: "pdf", title: "Показать PDF превью" }
                        ]}
                        selected={viewMode}
                        onChange={setViewMode}
                    />
                </div>
                <PreviewPanel
                    viewMode={viewMode}
                    previewTexUrl={previewTexUrl}
                    previewPdfUrl={previewPdfUrl}
                    width={0.8 * screenWidth - leftWidth - 32}
                />
            </div>
            {showModal && (
                <div className="modal-overlay">
                    <div className="modal-window">
                        <span>Вы точно хотите создать новый проект?</span>
                        <p>Все изменения будут потеряны.</p>
                        <div className="modal-buttons-container">
                            <button className="modal-button" onClick={() => setShowModal(false)}>
                                Отмена
                            </button>

                            <button className="modal-button" onClick={() => {
                                setShowModal(false);
                                window.location.href = "/";
                            }}>
                                Да
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}

export default ProcessPage;
