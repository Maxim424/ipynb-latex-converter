import React from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";
import { useToast } from "../../design_kit/notification/ToastContext";

function HomePage() {
  const navigate = useNavigate();
  const { showToast } = useToast();

  const handleFileChange = (event) => {
    const selectedFiles = Array.from(event.target.files);

    if (selectedFiles.length === 0) {
      showToast("Файлы не выбраны!");
      return;
    }

    navigate("/process", { state: { files: selectedFiles } });
  };

  return (
    <div className="parent-container">
      <div className="container">
        <h1 className="title">
          Веб-приложение
          <br></br>для обработки текста, полученного nbconvert
          <br></br>и содержащего формулы Latex</h1>
        <div>
          <label htmlFor="file-input" className="file-label">
            Выбрать файлы
          </label>
          <input
            id="file-input"
            type="file"
            className="file-input"
            accept=".ipynb"
            multiple
            onChange={handleFileChange}
          />
        </div>
      </div>
      <div className="footer">
        <a
          href="https://github.com/Maxim424/ipynb-latex-converter.git"
          target="_blank"
          rel="noopener noreferrer"
        >
          Исходный код на GitHub
        </a>
        <a href={`${process.env.REACT_APP_API_URL}docs`}>Документация</a>
      </div>
    </div>
  );
}

export default HomePage;