from fastapi import FastAPI, File, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
import shutil
from pathlib import Path
import subprocess
import uuid

app = FastAPI()

# Путь для сохранения загруженных файлов
UPLOAD_DIR = Path("./uploaded_files")
UPLOAD_DIR.mkdir(exist_ok=True)  # Создаем папку, если ее нет

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.post("/convert/")
async def convert_ipynb(file: UploadFile):
    # Генерация уникального имени файла
    unique_id = str(uuid.uuid4())
    file_extension = file.filename.split(".")[-1]
    file_path = UPLOAD_DIR / f"{unique_id}.{file_extension}"
    output_path = UPLOAD_DIR / f"{unique_id}.tex"

    # Сохранение загруженного файла
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    # Конвертация в .tex с помощью nbconvert
    try:
        # Выполнение команды с перехватом вывода
        result = subprocess.run(
            ["jupyter", "nbconvert", "--to", "latex", f"{unique_id}.{file_extension}", "--output", unique_id],
            check=True,
            cwd=UPLOAD_DIR,  # Рабочая директория
            stdout=subprocess.PIPE,  # Перехват стандартного вывода
            stderr=subprocess.PIPE,  # Перехват ошибок
            text=True  # Автоматическая декодировка в строки
        )
        
        # Вывод стандартного вывода и ошибок
        print("STDOUT:\n", result.stdout)
        print("STDERR:\n", result.stderr)

    except subprocess.CalledProcessError as e:
        # Вывод ошибок при неудачном выполнении команды
        print("Команда завершилась с ошибкой!")
        print("STDOUT:\n", e.stdout)
        print("STDERR:\n", e.stderr)
        return JSONResponse(content={"error": "Ошибка конвертации файла."}, status_code=500)

    # Чтение содержимого .tex файла
    try:
        with output_path.open("r", encoding="utf-8") as tex_file:
            tex_content = tex_file.read()
    except Exception as e:
        return JSONResponse(content={"error": "Ошибка чтения файла."}, status_code=500)

    return {
        "file_id": unique_id,
        "tex_content": tex_content
    }

@app.get("/download/{file_id}")
async def download_file(file_id: str):
    tex_path = UPLOAD_DIR / f"{file_id}.tex"

    if not tex_path.exists():
        raise HTTPException(status_code=404, detail="Файл не найден")

    return FileResponse(
        tex_path,
        media_type="application/x-tex",
        filename=f"{file_id}.tex"
    )

@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    try:
        file_path = UPLOAD_DIR / file.filename
        with file_path.open("wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
        return JSONResponse(content={"filename": file.filename, "message": "File uploaded successfully"})
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"File upload failed: {str(e)}")
