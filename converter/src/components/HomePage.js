import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./HomePage.css";

function HomePage() {
  const [file, setFile] = useState(null);
  const navigate = useNavigate();

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    if (!selectedFile) {
      alert("Файл не выбран");
      return;
    }

    setFile(selectedFile);
    navigate("/process", { state: { file: selectedFile } });
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
            Выбрать файл
          </label>
          <input
            id="file-input"
            type="file"
            className="file-input"
            onChange={handleFileChange}
          />
        </div>
      </div>
      <div className="footer">
          <a
            href="https://github.com/"
            target="_blank"
            rel="noopener noreferrer"
          >
            Исходный код на GitHub
          </a>
          <a href="http://127.0.0.1:8000/docs">Документация</a>
        </div>
    </div>
  );
}

export default HomePage;