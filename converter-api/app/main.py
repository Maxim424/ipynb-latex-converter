from fastapi import FastAPI, File, Form, UploadFile, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
import shutil
from pathlib import Path
import subprocess
import uuid
import json

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

def filter_cells(input_file, cell_indices, output_file):
    with open(input_file, 'r', encoding='utf-8') as f:
        notebook = json.load(f)

    filtered_cells = [cell for i, cell in enumerate(notebook['cells']) if i in cell_indices]

    notebook['cells'] = filtered_cells

    temp_file = UPLOAD_DIR / 'temp_filtered.ipynb'
    with open(temp_file, 'w', encoding='utf-8') as f:
        json.dump(notebook, f)

    subprocess.run(['jupyter', 'nbconvert', '--to', 'latex', str(temp_file), '--output', output_file], check=True)
    subprocess.run(['jupyter', 'nbconvert', '--to', 'pdf', str(temp_file), '--output', output_file], check=True)

@app.post("/convert/")
async def convert_ipynb(file: UploadFile, selectedCells: str = Form(...)):
    unique_id = str(uuid.uuid4())
    file_extension = file.filename.split(".")[-1]
    file_path = UPLOAD_DIR / f"{unique_id}.{file_extension}"
    output_tex = UPLOAD_DIR / f"{unique_id}.tex"
    output_pdf = UPLOAD_DIR / f"{unique_id}.pdf"

    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    selected_cells = json.loads(selectedCells)

    try:
        filter_cells(file_path, selected_cells, output_tex.stem)
    except subprocess.CalledProcessError as e:
        return JSONResponse(content={"error": "Ошибка конвертации файла."}, status_code=500)

    try:
        with output_tex.open("r", encoding="utf-8") as tex_file:
            tex_content = tex_file.read()
        with output_pdf.open("rb") as pdf_file:
            pdf_bytes = pdf_file.read()
    except Exception as e:
        return JSONResponse(content={"error": "Ошибка чтения файла."}, status_code=500)

    return {
        "file_id": unique_id,
        "tex_content": tex_content,
        "pdf_url": f"/files/{unique_id}.pdf"
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

@app.get("/files/{file_name}")
async def get_file(file_name: str):
    file_path = UPLOAD_DIR / file_name
    if file_path.exists():
        return FileResponse(file_path, media_type='application/pdf')
    return JSONResponse(content={"error": "Файл не найден."}, status_code=404)
