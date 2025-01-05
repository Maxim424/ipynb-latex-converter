import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialDark } from "react-syntax-highlighter/dist/esm/styles/prism";
import { prism } from 'react-syntax-highlighter/dist/esm/styles/prism';
import "./styles/NotebookStructurePanel.css";

const NotebookStructurePanel = ({
    jsonString,
    selectedCells,
    handleCellToggle,
    handleOutputToggle
}) => {
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

    const renderOutputs = (outputs) => {
        return outputs.map((output, idx) => {
            switch (output.output_type) {
                case 'stream':
                    return (
                        <pre key={idx} className="execution-result-container">
                            {output.text.join('')}
                        </pre>
                    );
                case 'display_data':
                    return (
                        <div key={idx} className="execution-result-container">
                            {output.data['text/plain'] && (
                                <pre>{output.data['text/plain'].join('')}</pre>
                            )}
                            {output.data['image/png'] && (
                                <img src={`data:image/png;base64,${output.data['image/png']}`} alt="Execution Output" />
                            )}
                        </div>
                    );
                default:
                    return null;
            }
        })
    };

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
                                    checked={selectedCells.find(cell => cell.index === index)?.includeSource || false}
                                    onChange={() => handleCellToggle(index)}
                                    title="Включить ячейку в итоговый файл или исключить из него"
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
                                        {cell.outputs.length > 0 && (
                                            <div>
                                                <div className="execution-result-header">
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedCells.find(cell => cell.index === index)?.includeResults || false}
                                                        onChange={() => handleOutputToggle(index)}
                                                        title="Включить результаты исполнения в итоговый файл или исключить из него"
                                                    />
                                                    <span>OUTPUT</span>
                                                </div>
                                                <div className="execution-result-container">
                                                    {renderOutputs(cell.outputs)}
                                                </div>
                                            </div>
                                        )}
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

export default NotebookStructurePanel;
