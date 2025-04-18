import React from "react";
import AsyncButton from "../../design_kit/async_button/AsyncButton";
import DropdownButton from "../../design_kit/dropdown_button/DropdownButton";
import SelectionDropdown from "../../design_kit/selection_dropdown/SelectionDropdown";
import ColorPicker from "../../design_kit/color_picker/ColorPicker";
import "./styles/ControlsPanel.css";

const ControlsPanel = ({
    file,
    onConvert,
    handleDownload,
    selectionMode,
    setSelectionMode,
    outputSelectionMode,
    setOutputSelectionMode,
    setSelectedCells,
    cells,
    codeBg,
    setCodeBg,
    includeCellNumbers,
    setIncludeCellNumbers
}) => {
    const updateSelectionMode = (mode) => {
        setSelectionMode(mode);

        switch (mode) {
            case "all":
                setSelectedCells(
                    cells.map((_, index) => ({
                        index,
                        includeSource: true,
                        includeResults: false
                    }))
                );
                break;
            case "code":
                setSelectedCells(
                    cells
                        .map((cell, index) =>
                            cell.cell_type === "code"
                                ? { index, includeSource: true, includeResults: false }
                                : null
                        )
                        .filter((cell) => cell !== null)
                );
                break;
            case "text":
                setSelectedCells(
                    cells
                        .map((cell, index) =>
                            cell.cell_type === "markdown"
                                ? { index, includeSource: true, includeResults: false }
                                : null
                        )
                        .filter((cell) => cell !== null)
                );
                break;
            case "custom":
            default:
                // ничего не меняем
                break;
        }
    };

    const updateOutputSelectionMode = (mode) => {
        setOutputSelectionMode(mode);

        switch (mode) {
            case "all":
                setSelectedCells((prev) => {
                    // включаем вывод у всех кодовых ячеек
                    const updated = [...prev];

                    cells.forEach((cell, index) => {
                        if (cell.cell_type === "code") {
                            const existing = updated.find((c) => c.index === index);
                            if (existing) {
                                existing.includeResults = true;
                            } else {
                                updated.push({
                                    index,
                                    includeSource: false,
                                    includeResults: true
                                });
                            }
                        }
                    });

                    return updated;
                });
                break;
            case "none":
                setSelectedCells((prev) =>
                    prev
                        .map((cell) =>
                            cells[cell.index]?.cell_type === "code"
                                ? { ...cell, includeResults: false }
                                : cell
                        )
                        .filter((cell) => cell.includeSource || cell.includeResults)
                );
                break;
            case "custom":
            default:
                // ничего не делаем
                break;
        }
    };

    return (
        <div className="controls-panel">
            <AsyncButton action={() => onConvert(file)} title="Сконвертировать" />
            <DropdownButton
                title="Скачать"
                options={[
                    { label: "Скачать .tex", action: () => handleDownload(file, "tex") },
                    { label: "Скачать .pdf", action: () => handleDownload(file, "pdf") }
                ]}
            />

            <div className="block-container">
                <label className="block-label">
                    Выбор ячеек для конвертации
                </label>

                <SelectionDropdown
                    label="Тип ячейки:"
                    value={selectionMode}
                    onChange={updateSelectionMode}
                    options={[
                        { label: "Все", value: "all" },
                        { label: "Код", value: "code" },
                        { label: "Текст", value: "text" },
                        { label: "Custom", value: "custom" }
                    ]}
                />

                <SelectionDropdown
                    label="Вывод кодовых ячеек:"
                    value={outputSelectionMode}
                    onChange={updateOutputSelectionMode}
                    options={[
                        { label: "Включить", value: "all" },
                        { label: "Исключить", value: "none" },
                        { label: "Custom", value: "custom" }
                    ]}
                />
            </div>

            <div className="block-container">
                <label className="block-label">
                    Форматирование
                </label>

                <SelectionDropdown
                    label="Номера ячеек:"
                    value={includeCellNumbers}
                    onChange={setIncludeCellNumbers}
                    options={[
                        { label: "Включить", value: "true" },
                        { label: "Исключить", value: "false" }
                    ]}
                />

                <ColorPicker title="Цвет фона ячеек:" value={codeBg} onChange={(e) => setCodeBg(e)} />
            </div>
        </div>
    );
};

export default ControlsPanel;
