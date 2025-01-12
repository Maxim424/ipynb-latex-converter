import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import "./NotebookCells.css";

const NotebookCells = ({ jsonString }) => {
    const [selectedCells, setSelectedCells] = useState([]);
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        // Определяем, активирована ли темная тема
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        setIsDarkMode(mediaQuery.matches); // Устанавливаем начальное значение

        // Добавляем слушатель изменений темы
        const handleChange = (event) => setIsDarkMode(event.matches);
        mediaQuery.addEventListener("change", handleChange);

        // Убираем слушатель при размонтировании компонента
        return () => mediaQuery.removeEventListener("change", handleChange);
    }, []);

    const parseCells = (jsonString) => {
        try {
            const notebook = JSON.parse(jsonString);
            return notebook.cells || [];
        } catch (error) {
            console.error("Error parsing JSON:", error);
            return [];
        }
    };

    const handleCheckboxChange = (cellIndex) => {
        setSelectedCells((prevSelected) =>
            prevSelected.includes(cellIndex)
                ? prevSelected.filter((index) => index !== cellIndex) // Remove if already selected
                : [...prevSelected, cellIndex] // Add if not selected
        );
    };

    const cells = parseCells(jsonString);

    return (
        <div class="scroll-parent-container">
            {cells.length === 0 ? (
                <p>No cells available</p>
            ) : (
                <div class="scroll-container">
                    {cells.map((cell, index) => (
                        <div key={index} class="cell-parent-container">
                            <div>
                                <label class="cell-header-container">
                                    <input
                                        type="checkbox"
                                        checked={selectedCells.includes(index)}
                                        class="cell-checkbox"
                                        onChange={() => handleCheckboxChange(index)}
                                    />
                                    <span style={{ fontWeight: "bold" }}>
                                        {cell.cell_type.toUpperCase()}
                                    </span>
                                </label>

                                <div>
                                    {cell.cell_type === "markdown" ? (
                                        <div class="cell-markdown-container">
                                            <ReactMarkdown>{cell.source.join("")}</ReactMarkdown>
                                        </div>
                                    ) : (
                                        <div class="cell-code-container">
                                            <SyntaxHighlighter
                                                class="syntax-highlighter"
                                                language="python"
                                                style={isDarkMode ? materialDark : prism}
                                            >
                                                {cell.source.join("")}
                                            </SyntaxHighlighter>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default NotebookCells;
