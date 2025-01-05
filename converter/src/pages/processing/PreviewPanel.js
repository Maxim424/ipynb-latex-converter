import React, { useEffect, useState } from "react";
import { Document, Page, pdfjs } from 'react-pdf';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import "./styles/PreviewPanel.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url,
).toString();

const PreviewPanel = ({ viewMode, previewTexUrl, previewPdfUrl, width }) => {
    const src = viewMode === "latex" ? previewTexUrl : previewPdfUrl;
    const [numPages, setNumPages] = useState(null);
    const [latexText, setLatexText] = useState("");

    useEffect(() => {
        if (!previewTexUrl) return;

        fetch(previewTexUrl)
            .then((res) => {
                if (!res.ok) {
                    throw new Error("Ошибка загрузки .tex файла");
                }
                return res.text();
            })
            .then(setLatexText)
            .catch(() => setLatexText("Не удалось загрузить документ"));
    }, [previewTexUrl]);

    return (
        <div className="preview-panel">
            {viewMode === "latex" ? (
                previewTexUrl === '' ? (
                    <div className="no-preview-block">
                        <img src={require('./../../design_kit/icons/note.svg').default} alt="Note" className="no-preview-block-image" />
                        <span>Сконвертируйте, чтобы увидеть превью</span>
                    </div>
                ) : (
                    previewTexUrl === 'loading' ? (
                        <div className="no-preview-block">
                            <img
                                src={require('./../../design_kit/icons/cloud.svg').default}
                                alt="Note"
                                className="no-preview-block-image"
                            />
                            <span>Загрузка превью</span>
                        </div>
                    ) : (
                        <pre
                            style={{
                                whiteSpace: "pre-wrap",
                                wordBreak: "break-word",
                                fontFamily: "monospace",
                                fontSize: "14px",
                                lineHeight: "1.5",
                                margin: "0",
                                padding: "16px",
                                overflowY: "auto",
                                height: "100%",
                                boxSizing: "border-box"
                            }}
                        >
                            {latexText}
                        </pre>
                    )
                )
            ) : (
                <div
                    style={{
                        overflowY: "auto",
                        height: "100%",
                        boxSizing: "border-box",
                        width: width,
                        display: "block"
                    }}
                >
                    {previewPdfUrl === '' ? (
                        <div className="no-preview-block" style={{
                            height: "100%",
                            alignItems: "center",
                            justifyContent: "center"
                        }}>
                            <img
                                src={require('./../../design_kit/icons/note.svg').default}
                                alt="Note"
                                className="no-preview-block-image"
                            />
                            <span>Сконвертируйте, чтобы увидеть превью</span>
                        </div>
                    ) : (previewPdfUrl === 'loading' ? (
                        <div className="no-preview-block" style={{
                            height: "100%",
                            alignItems: "center",
                            justifyContent: "center"
                        }}>
                            <img
                                src={require('./../../design_kit/icons/cloud.svg').default}
                                alt="Note"
                                className="no-preview-block-image"
                            />
                            <span>Загрузка превью</span>
                        </div>
                    ) : (
                        <Document
                            file={src}
                            key={src}
                            onLoadSuccess={({ numPages }) => setNumPages(numPages)}
                            loading="Загрузка PDF..."
                            error="Не удалось загрузить PDF"
                        >
                            {width > 0 && Array.from(new Array(numPages), (_, index) => (
                                <Page
                                    key={`page_${index + 1}`}
                                    pageNumber={index + 1}
                                    width={width}
                                    renderTextLayer={false}
                                    renderAnnotationLayer={false}
                                />
                            ))}
                        </Document>
                    )
                    )}
                </div>
            )}
        </div >
    );
};

export default PreviewPanel;
