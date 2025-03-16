import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import "../styles/NotebookCells.css";

const NotebookCells = ({ jsonString, selectedCells, onCheckboxChange }) => {
    const [isDarkMode, setIsDarkMode] = useState(false);

    useEffect(() => {
        const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
        setIsDarkMode(mediaQuery.matches);
        const handleChange = (event) => setIsDarkMode(event.matches);
        mediaQuery.addEventListener("change", handleChange);
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

    const cells = parseCells(jsonString);

    return (
        <div className="scroll-parent-container">
            {cells.length === 0 ? (
                <p>No cells available</p>
            ) : (
                <div className="scroll-container">
                    {cells.map((cell, index) => (
                        <div key={index} className="cell-parent-container">
                            <label className="cell-header-container">
                                <input
                                    type="checkbox"
                                    checked={selectedCells.includes(index)}
                                    className="cell-checkbox"
                                    onChange={() => onCheckboxChange(index)}
                                />
                                <span style={{ fontWeight: "bold" }}>
                                    {cell.cell_type.toUpperCase()}
                                </span>
                            </label>
                            <div>
                                {cell.cell_type === "markdown" ? (
                                    <div className="cell-markdown-container">
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
                    ))}
                </div>
            )}
        </div>
    );
};

export default NotebookCells;
