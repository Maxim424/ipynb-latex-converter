import React, { useState } from "react";
import AsyncButton from "../../design_kit/async_button/AsyncButton";
import DropdownButton from "../../design_kit/dropdown_button/DropdownButton";
import SelectionDropdown from "../../design_kit/selection_dropdown/SelectionDropdown";
import ColorPicker from "../../design_kit/color_picker/ColorPicker";
import TextInput from "../../design_kit/text_input/TextInput"
import "./styles/ControlsPanel.css";

const ControlsPanel = ({
    files,
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
    setIncludeCellNumbers,
    indent,
    setIndent,
    removeComments,
    setRemoveComments,
    downloadDisabled
}) => {
    const [mergeMode, setMergeMode] = useState("single");

    const updateSelectionMode = (mode) => {
        setSelectionMode(mode);

        switch (mode) {
            case "all":
                setSelectedCells(
                    cells.map((_, index) => ({
                        index,
                        includeSource: true,
                        includeResults: true
                    }))
                );
                break;
            case "code":
                setSelectedCells(
                    cells
                        .map((cell, index) =>
                            cell.cell_type === "code"
                                ? { index, includeSource: true, includeResults: true }
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
                break;
        }
    };

    const updateOutputSelectionMode = (mode) => {
        setOutputSelectionMode(mode);

        switch (mode) {
            case "all":
                setSelectedCells((prev) => {
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
                break;
        }
    };

    return (
        <div className="controls-panel">
            <AsyncButton action={() => onConvert(files, mergeMode)} title="Сконвертировать" />
            <DropdownButton
                title="Скачать"
                options={[
                    { label: "Скачать .tex", action: () => handleDownload(files[0], "tex") },
                    { label: "Скачать .pdf", action: () => handleDownload(files[0], "pdf") }
                ]}
                disabled={downloadDisabled}
            />

            {files.length > 1 && (
                <div className="block-container">
                    <label className="block-label">
                        Файлы для конвертации
                    </label>

                    {files.map((file, index) => (
                        <span key={index} className="block-description">
                            {file.name}
                        </span>
                    ))}

                    <SelectionDropdown
                        label="Количество итоговых .tex файлов"
                        value={mergeMode}
                        onChange={setMergeMode}
                        options={[
                            { label: "Один", value: "single" },
                            { label: "Несколько", value: "include" }
                        ]}
                    />
                </div>
            )}

            <div className="block-container">
                <label className="block-label">
                    Выбор ячеек
                </label>

                <SelectionDropdown
                    label="Тип ячейки"
                    value={selectionMode}
                    onChange={updateSelectionMode}
                    options={[
                        { label: "Все", value: "all", title: "Включить все ячейки в итоговый документ" },
                        { label: "Код", value: "code", title: "Включить в итоговый документ только ячейки с кодом" },
                        { label: "Текст", value: "text", title: "Включить в итоговый документ только ячейки с текстом" },
                        { label: "Custom", value: "custom", title: "Включить в итоговый документ только выбранные ячейки" }
                    ]}
                />

                <SelectionDropdown
                    label="Вывод ячеек"
                    value={outputSelectionMode}
                    onChange={updateOutputSelectionMode}
                    options={[
                        { label: "Включить", value: "all", title: "Включить в итоговый документ результаты исполнения ячеек с кодом" },
                        { label: "Исключить", value: "none", title: "Исключить из итогового документа результаты исполнения ячеек с кодом" },
                        { label: "Custom", value: "custom", title: "Включить в итоговый документ только выбранные результаты исполнения ячеек с кодом" }
                    ]}
                />
            </div>

            <div className="block-container">
                <label className="block-label">
                    Форматирование
                </label>

                <ColorPicker
                    label="Цвет фона ячеек"
                    value={codeBg}
                    onChange={(e) => setCodeBg(e)}
                    title="Нажмите для выбора цвета фона ячеек с кодом"
                />

                <TextInput
                    label="Отступ текста"
                    value={indent}
                    onChange={setIndent}
                    title="Укажите отступ для текста (в мм)"
                />

                <SelectionDropdown
                    label="Номера ячеек"
                    value={includeCellNumbers}
                    onChange={setIncludeCellNumbers}
                    options={[
                        { label: "Включить", value: "true", title: "Включить в итоговый документ номера ячеек" },
                        { label: "Исключить", value: "false", title: "Исключить из итогового документа номера ячеек" }
                    ]}
                />

                <SelectionDropdown
                    label="Комментарии"
                    value={removeComments}
                    onChange={setRemoveComments}
                    options={[
                        { label: "Включить", value: "false", title: "Включить в итоговый .tex-файл добавленные при конвертации комментарии" },
                        { label: "Исключить", value: "true", title: "Исключить из итогового .tex-файла добавленные при конвертации комментарии" }
                    ]}
                />
            </div>
        </div>
    );
};

export default ControlsPanel;
