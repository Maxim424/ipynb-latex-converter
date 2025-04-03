import React, { useState } from "react";
import ProcessPage from "./ProcessPage";
import { useToast } from "../../design_kit/notification/ToastContext";

const ProcessPageController = () => {
    const [fileContent, setFileContent] = useState("");
    const [texContent, setTexContent] = useState("");
    const [pdfUrl, setPdfUrl] = useState(null);
    const [fileId, setFileId] = useState("");
    const [selectedCells, setSelectedCells] = useState([]);
    const [selectionMode, setSelectionMode] = useState("custom"); // Выбранный режим

    const { showToast } = useToast();

    const handleFileLoad = (fileContent) => {
        try {
            const notebook = JSON.parse(fileContent);
            const allCellIndices = notebook.cells ? notebook.cells.map((_, index) => index) : [];
            setSelectedCells(allCellIndices);
            setFileContent(fileContent);
        } catch (error) {
            console.error("Ошибка при парсинге файла:", error);
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
            showToast("Файл не найден!")
            return;
        }

        const formData = new FormData();
        formData.append("file", file);
        formData.append("selectedCells", JSON.stringify(selectedCells));

        try {
            const response = await fetch("http://127.0.0.1:8000/convert/", {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setTexContent(data.tex_content);
                setFileId(data.file_id);
                if (data.pdf_url) {
                    setPdfUrl(`http://localhost:8000${data.pdf_url}`);
                }
            } else {
                showToast("Ошибка конвертации файла!")
            }
        } catch (error) {
            console.error("Ошибка:", error);
        }
    };

    const handleDownload = async (file, format) => {
        if (!fileId) {
            showToast("Файл не готов для скачивания!");
            return;
        }

        const fileExtension = format === "pdf" ? ".pdf" : ".tex";

        if (fileExtension === ".pdf" && pdfUrl) {
            try {
                const response = await fetch(pdfUrl);
                const blob = await response.blob();
                const blobUrl = URL.createObjectURL(blob);

                const link = document.createElement("a");
                link.href = blobUrl;
                link.download = file.name.replace(".ipynb", ".pdf");
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);

                // Освобождаем память
                URL.revokeObjectURL(blobUrl);
            } catch (error) {
                showToast("Ошибка при скачивании PDF!");
                console.error("Ошибка скачивания PDF:", error);
            }
        } else {
            const link = document.createElement("a");
            link.href = `http://127.0.0.1:8000/download/${fileId}`;
            link.download = file.name.replace(".ipynb", ".tex");
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    return (
        <ProcessPage
            fileContent={fileContent}
            handleFileLoad={handleFileLoad}
            texContent={texContent}
            pdfUrl={pdfUrl}
            onConvert={handleConvert}
            handleDownload={handleDownload}
            selectedCells={selectedCells}
            setSelectedCells={setSelectedCells}
            onCheckboxChange={handleCheckboxChange}
            selectionMode={selectionMode}
            setSelectionMode={setSelectionMode}
        />
    );
};

export default ProcessPageController;
