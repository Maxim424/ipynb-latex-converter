import React, { useState } from "react";
import ProcessPage from "./ProcessPage";
import { useToast } from "../../design_kit/notification/ToastContext";

const ProcessPageController = () => {
    const [fileContent, setFileContent] = useState("");
    const [fileId, setFileId] = useState("");
    const [previewPdfUrl, setPreviewPdfUrl] = useState("");
    const [previewTexUrl, setPreviewTexUrl] = useState("");

    const [selectedCells, setSelectedCells] = useState([]);
    const [selectionMode, setSelectionMode] = useState("all");
    const [outputSelectionMode, setOutputSelectionMode] = useState("all");

    const [codeBg, setCodeBg] = useState("#f6f8fa");

    const { showToast } = useToast();
    const baseUrl = "http://127.0.0.1:8000/";

    const handleFileLoad = (fileContent) => {
        try {
            const notebook = JSON.parse(fileContent);

            const allCellIndices = notebook.cells ?
                notebook.cells.map((_, index) => ({
                    index: index,
                    includeSource: true,
                    includeResults: true
                })) : [];

            setSelectedCells(allCellIndices);
            setFileContent(fileContent);
        } catch (error) {
            showToast("Ошибка при чтении файла")
        }
    };

    const handleCellToggle = (cellIndex) => {
        setSelectedCells((prev) => {
            const existing = prev.find(cell => cell.index === cellIndex);

            if (existing) {
                // Переключаем includeSource
                const updated = {
                    ...existing,
                    includeSource: !existing.includeSource
                };

                // Если ни код, ни вывод не выбраны — убираем вообще
                if (!updated.includeSource && !updated.includeResults) {
                    return prev.filter(cell => cell.index !== cellIndex);
                }

                return prev.map(cell => cell.index === cellIndex ? updated : cell);
            } else {
                // Добавляем новую запись с кодом, без вывода
                return [...prev, { index: cellIndex, includeSource: true, includeResults: false }];
            }
        });

        setSelectionMode("custom");
    };

    const handleOutputToggle = (cellIndex) => {
        setSelectedCells((prev) => {
            const existing = prev.find(cell => cell.index === cellIndex);

            if (existing) {
                const updated = {
                    ...existing,
                    includeResults: !existing.includeResults
                };

                if (!updated.includeSource && !updated.includeResults) {
                    return prev.filter(cell => cell.index !== cellIndex);
                }

                return prev.map(cell => cell.index === cellIndex ? updated : cell);
            } else {
                // Если до этого не было — добавляем только output
                return [...prev, { index: cellIndex, includeSource: false, includeResults: true }];
            }
        });

        setSelectionMode("custom");
    };

    const handleConvert = async (file) => {
        if (!file) {
            showToast("Сначала необходимо выбрать файл");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("selectedCells", JSON.stringify(selectedCells));
        formData.append("codeBg", codeBg);

        try {
            const response = await fetch(`${baseUrl}convert/`, {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setFileId(data.file_id);
                setPreviewPdfUrl(`${baseUrl}preview/${data.file_id}.pdf`);
                setPreviewTexUrl(`${baseUrl}preview/${data.file_id}.tex`);
            } else {
                showToast("Ошибка конвертации файла!");
            }
        } catch (error) {
            showToast(`Ошибка ${error}`);
        }
    };

    const handleDownload = async (file, format) => {
        if (!fileId) {
            showToast("Сначала необходимо сконвертировать файл");
            return;
        }

        const fileExtension = format === "pdf" ? ".pdf" : ".tex";

        try {
            const url = `${baseUrl}download/${fileId}${fileExtension}`
            const response = await fetch(url);
            const blob = await response.blob();
            const blobUrl = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = file.name.replace(".ipynb", fileExtension);
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(blobUrl);
        } catch (error) {
            showToast(`Ошибка ${error}`);
        }
    };

    return (
        <ProcessPage
            fileContent={fileContent}
            handleFileLoad={handleFileLoad}
            onConvert={handleConvert}
            handleDownload={handleDownload}
            selectedCells={selectedCells}
            setSelectedCells={setSelectedCells}
            handleCellToggle={handleCellToggle}
            handleOutputToggle={handleOutputToggle}
            selectionMode={selectionMode}
            setSelectionMode={setSelectionMode}
            outputSelectionMode={outputSelectionMode}
            setOutputSelectionMode={setOutputSelectionMode}
            previewPdfUrl={previewPdfUrl}
            previewTexUrl={previewTexUrl}
            codeBg={codeBg}
            setCodeBg={setCodeBg}
        />
    );
};

export default ProcessPageController;
