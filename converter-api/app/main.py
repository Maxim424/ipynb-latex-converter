from fastapi import FastAPI, Form, UploadFile
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

def filter_cells(input_file, selected_cells, output_file):
    with open(input_file, 'r', encoding='utf-8') as f:
        notebook = json.load(f)

    filtered_cells = []

    for i, cell in enumerate(notebook['cells']):
        match = next(
            (item for item in selected_cells if item['index'] == i), None)
        if not match:
            continue  # ячейка не выбрана

        new_cell = {
            "cell_type": cell["cell_type"],
            "metadata": cell.get("metadata", {})
        }

        # Включаем source (код или markdown)
        if match.get("includeSource", False):
            new_cell["source"] = cell.get("source", [])
        else:
            new_cell["source"] = []

        # Включаем outputs (только для кодовых ячеек)
        if cell["cell_type"] == "code" and match.get("includeResults", False):
            new_cell["outputs"] = cell.get("outputs", [])
            new_cell["execution_count"] = cell.get("execution_count")
        else:
            new_cell["outputs"] = []
            new_cell["execution_count"] = None

        filtered_cells.append(new_cell)

    notebook["cells"] = filtered_cells

    temp_file = UPLOAD_DIR / 'temp_filtered.ipynb'
    with open(temp_file, 'w', encoding='utf-8') as f:
        json.dump(notebook, f)

    subprocess.run(['jupyter', 'nbconvert', '--to', 'latex',
                   str(temp_file), '--output', output_file], check=True)
    subprocess.run(['jupyter', 'nbconvert', '--to', 'pdf',
                   str(temp_file), '--output', output_file], check=True)


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
        return JSONResponse(content={"error": "File conversion error"}, status_code=500)

    return {
        "file_id": unique_id
    }


@app.get("/preview/{file_name}")
async def preview_file(file_name: str):
    file_path = UPLOAD_DIR / file_name
    if not file_path.exists():
        return JSONResponse(content={"error": f"File not found. Filename: {file_name}"}, status_code=404)

    if file_name.endswith(".pdf"):
        return FileResponse(file_path, media_type="application/pdf")
    elif file_name.endswith(".tex"):
        return FileResponse(file_path, media_type="text/plain")
    else:
        return JSONResponse(content={"error": "Invalid file format"}, status_code=400)


@app.get("/download/{file_name}")
async def download_file(file_name: str):
    file_path = UPLOAD_DIR / file_name
    if not file_path.exists():
        return JSONResponse(content={"error": f"File not found. Filename: {file_name}"}, status_code=404)

    if file_name.endswith(".pdf"):
        media_type = "application/pdf"
    elif file_name.endswith(".tex"):
        media_type = "application/x-tex"
    else:
        return JSONResponse(content={"error": "Invalid file format"}, status_code=400)

    return FileResponse(
        file_path,
        media_type=media_type,
        filename=file_name,
        headers={"Content-Disposition": f"attachment; filename={file_name}"}
    )
