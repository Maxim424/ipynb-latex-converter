import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./ProcessPage.css";
import NotebookCells from "./NotebookCells";

function ProcessPage() {
    const location = useLocation();
    const [fileContent, setFileContent] = useState("");
    const [texContent, setTexContent] = useState("");
    const [fileId, setFileId] = useState("");

    const file = location.state?.file;

    useEffect(() => {
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => setFileContent(e.target.result);
            reader.readAsText(file);
        }
    }, [file]);

    const handleConvert = async () => {
        if (!file) {
            alert("Файл не найден!");
            return;
        }

        const formData = new FormData();
        formData.append("file", file);

        try {
            const response = await fetch("http://127.0.0.1:8000/convert/", {
                method: "POST",
                body: formData,
            });

            if (response.ok) {
                const data = await response.json();
                setTexContent(data.tex_content);
                setFileId(data.file_id);
            } else {
                alert("Ошибка конвертации файла.");
            }
        } catch (error) {
            console.error("Ошибка:", error);
        }
    };

    const handleDownload = async () => {
        if (!fileId) {
            alert("Файл не готов для скачивания!");
            return;
        }

        const link = document.createElement("a");
        link.href = `http://127.0.0.1:8000/download/${fileId}`;
        link.download = `${file.name.replace(".ipynb", ".tex")}`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const formatJson = (jsonString) => {
        try {
            const jsonObject = JSON.parse(jsonString);
            return JSON.stringify(jsonObject, null, 2);
        } catch (error) {
            return "Ошибка при парсинге JSON";
        }
    };

    return (
        <div class="process-parent-container">
            <div class="process-container">
                <div class="process-column process-column-1">
                    <div class="process-settings-header">Settings</div>

                    <div class="process-settings">
                        <button
                            onClick={handleConvert}
                            class="process-download-button"
                        >
                            Конвертировать
                        </button>

                        <button
                            onClick={handleDownload}
                            class="process-download-button"
                        >
                            Скачать
                        </button>
                    </div>
                </div>
                <div class="process-column process-column-2">
                    <div class="process-column-header">Notebook cells</div>
                    <pre><NotebookCells jsonString={fileContent} /></pre>
                </div>
                <div class="process-column process-column-3">
                    <div class="process-column-header">LaTeX</div>
                    <div class="process-settings">
                        <pre>{texContent}</pre>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default ProcessPage;
