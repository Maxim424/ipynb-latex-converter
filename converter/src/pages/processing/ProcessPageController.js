import React, { useState } from "react";
import ProcessPage from "./ProcessPage";
import { useToast } from "../../design_kit/notification/ToastContext";

const ProcessPageController = () => {
    const [fileContent, setFileContent] = useState("");
    const [fileId, setFileId] = useState("");
    const [selectedCells, setSelectedCells] = useState([]);
    const [selectionMode, setSelectionMode] = useState("custom");
    const [previewPdfUrl, setPreviewPdfUrl] = useState("");
    const [previewTexUrl, setPreviewTexUrl] = useState("");

    const { showToast } = useToast();
    const baseUrl = "http://127.0.0.1:8000/";

    const handleFileLoad = (fileContent) => {
        try {
            const notebook = JSON.parse(fileContent);
            const allCellIndices = notebook.cells ? notebook.cells.map((_, index) => index) : [];
            setSelectedCells(allCellIndices);
            setFileContent(fileContent);
        } catch (error) {
            showToast("Ошибка при чтении файла")
        }
    };

    const handleCheckboxChange = (cellIndex) => {
        setSelectedCells((prevSelected) => {
            const updated = prevSelected.includes(cellIndex)
                ? prevSelected.filter((index) => index !== cellIndex)
                : [...prevSelected, cellIndex];
            return updated.sort((a, b) => a - b);
        });

        // Если пользователь вручную меняет чекбоксы – переключаемся в "custom"
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
            onCheckboxChange={handleCheckboxChange}
            selectionMode={selectionMode}
            setSelectionMode={setSelectionMode}
            previewPdfUrl={previewPdfUrl}
            previewTexUrl={previewTexUrl}
        />
    );
};

export default ProcessPageController;
