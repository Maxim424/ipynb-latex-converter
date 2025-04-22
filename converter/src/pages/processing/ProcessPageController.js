import React, { useState } from "react";
import ProcessPage from "./ProcessPage";
import { useToast } from "../../design_kit/notification/ToastContext";
import { v4 as uuidv4 } from "uuid";

const ProcessPageController = () => {
    const [fileContent, setFileContent] = useState("");
    const [fileId, setFileId] = useState("");
    const [previewPdfUrl, setPreviewPdfUrl] = useState("");
    const [previewTexUrl, setPreviewTexUrl] = useState("");

    const [selectedCells, setSelectedCells] = useState([]);
    const [selectionMode, setSelectionMode] = useState("all");
    const [outputSelectionMode, setOutputSelectionMode] = useState("all");

    const [codeBg, setCodeBg] = useState("#f6f8fa");
    const [includeCellNumbers, setIncludeCellNumbers] = useState("true");

    const { showToast } = useToast();
    // const baseUrl = "http://127.0.0.1:8000/";
    const baseUrl = "http://ipynb-converter.ru:8000/";
    const sessionId = getSessionId();

    function getSessionId() {
        let sessionId = localStorage.getItem("session_id");
        if (!sessionId) {
            sessionId = uuidv4();
            localStorage.setItem("session_id", sessionId);
        }
        return sessionId;
    }

    const handleFileLoad = async (files) => {
        try {
            let allCells = [];
            let selected = [];
            let totalIndex = 0;

            for (const file of files) {
                const content = await file.text();
                const notebook = JSON.parse(content);

                const cells = notebook.cells || [];

                const fileCells = cells.map((cell, index) => {
                    selected.push({
                        index: totalIndex + index,
                        includeSource: true,
                        includeResults: true
                    });
                    return cell;
                });

                allCells = allCells.concat(fileCells);
                totalIndex += cells.length;
            }

            setSelectedCells(selected);
            setFileContent(JSON.stringify({ cells: allCells }));

        } catch (error) {
            showToast("Ошибка при чтении файлов");
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

    const handleConvert = async (files, mergeMode = "single") => {
        if (!files || files.length === 0) {
            showToast("Сначала необходимо выбрать файл(ы)");
            return;
        }

        const formData = new FormData();

        // Добавляем все файлы в formData
        files.forEach((file) => {
            formData.append("files", file);
        });

        // Прочие параметры
        formData.append("selectedCells", JSON.stringify(selectedCells));
        formData.append("codeBg", codeBg);
        formData.append("includeCellNumbers", includeCellNumbers);
        formData.append("mergeMode", mergeMode); // "single" или "include"

        try {
            const response = await fetch(`${baseUrl}convert/`, {
                method: "POST",
                body: formData,
                headers: {
                    "X-Session-ID": sessionId
                }
            });

            if (response.ok) {
                const data = await response.json();
                setFileId(data.file_id);
                setPreviewPdfUrl(`${baseUrl}preview/${data.file_id}.pdf`);
                setPreviewTexUrl(`${baseUrl}preview/${data.file_id}.tex`);
            } else {
                showToast("Ошибка конвертации файла(ов)!");
            }
        } catch (error) {
            showToast(`Ошибка: ${error}`);
        }
    };

    const handleDownload = async (file, format) => {
        if (!fileId) {
            showToast("Сначала необходимо сконвертировать файл");
            return;
        }

        const fileExtension = format === "pdf" ? ".pdf" : ".zip";

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
            includeCellNumbers={includeCellNumbers}
            setIncludeCellNumbers={setIncludeCellNumbers}
        />
    );
};

export default ProcessPageController;
