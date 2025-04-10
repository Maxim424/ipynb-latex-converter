from fastapi import FastAPI, Form, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, FileResponse
import shutil
from pathlib import Path
import subprocess
import uuid
import json
import re

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


def html_to_rgb(color: str) -> str:
    color = color.lstrip('#')
    r, g, b = tuple(int(color[i:i + 2], 16) for i in (0, 2, 4))
    return f"{r},{g},{b}"


def filter_cells(input_file, selected_cells, output_file, code_bg, text_bg, output_bg, remove_prompt_numbers=True):
    input_file = Path(input_file)
    output_file = Path(output_file)

    temp_ipynb = input_file.parent / f"temp_filtered_{uuid.uuid4().hex}.ipynb"

    # Шаг 1: отфильтровать ячейки
    with open(input_file, 'r', encoding='utf-8') as f:
        notebook = json.load(f)

    filtered_cells = []
    for i, cell in enumerate(notebook.get("cells", [])):
        match = next(
            (item for item in selected_cells if item['index'] == i), None)
        if not match:
            continue

        include_source = match.get("includeSource", False)
        include_output = match.get("includeResults", False)

        new_cell = {**cell}

        if not include_source:
            new_cell["source"] = []

        if not include_output:
            new_cell["outputs"] = []

        filtered_cells.append(new_cell)

    notebook["cells"] = filtered_cells

    with open(temp_ipynb, 'w', encoding='utf-8') as f:
        json.dump(notebook, f)

    # Шаг 2: вызвать nbconvert
    subprocess.run([
        "jupyter", "nbconvert",
        "--to", "latex",
        "--output", output_file.stem,
        str(temp_ipynb)
    ], check=True)

    tex_file = input_file.parent / f"{output_file.stem}.tex"

    with open(tex_file, 'r', encoding='utf-8') as f:
        tex = f.read()

    rgb_code = html_to_rgb(code_bg)
    rgb_text = html_to_rgb(text_bg)
    rgb_output = html_to_rgb(output_bg)

    # Добавляем необходимые пакеты и определения цветов
    tex = tex.replace(
        r"\usepackage{graphicx}",
        r"""\usepackage{graphicx}
\usepackage{tcolorbox}
\tcbuselibrary{listings, breakable}
\definecolor{codebg}{RGB}{""" + rgb_code + r"""}
\definecolor{textbg}{RGB}{""" + rgb_text + r"""}
\definecolor{outputbg}{RGB}{""" + rgb_output + r"""}
\usepackage{fontspec}
\usepackage{polyglossia}
\setdefaultlanguage{russian}
\setmainfont{Times New Roman}
\newfontfamily\cyrillicfonttt{Courier New} % моноширинный шрифт с кириллицей
"""
    )

    # Шаг 3: заменить цвет фона у кодовых ячеек
    tex = tex.replace("colback=cellbackground", "colback=codebg")

    if remove_prompt_numbers:
        import re
        tex = re.sub(
            r"\\prompt\{In\}\{incolor\}\{[^\}]*\}\{\\boxspacing\}\n?", "", tex)

    # Сохраняем .tex файл
    with open(tex_file, 'w', encoding='utf-8') as f:
        f.write(tex)

    # Шаг 4: собрать PDF
    subprocess.run([
        "xelatex",
        "-interaction=nonstopmode",
        str(tex_file.name)
    ], check=True, cwd=str(input_file.parent))

    # Удалить временный .ipynb файл
    temp_ipynb.unlink()


@app.post("/convert/")
async def convert_ipynb(
    file: UploadFile,
    selectedCells: str = Form(...),
    codeBg: str = Form("#f6f8fa"),
    textBg: str = Form("#ffffff"),
    outputBg: str = Form("#f9f2f4")
):
    unique_id = str(uuid.uuid4())
    file_extension = file.filename.split(".")[-1]
    file_path = UPLOAD_DIR / f"{unique_id}.{file_extension}"
    output_tex = UPLOAD_DIR / f"{unique_id}.tex"
    output_pdf = UPLOAD_DIR / f"{unique_id}.pdf"

    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    selected_cells = json.loads(selectedCells)

    try:
        filter_cells(file_path, selected_cells,
                     output_tex.stem, codeBg, textBg, outputBg)
    except subprocess.CalledProcessError as e:
        if output_tex.exists() and output_pdf.exists():
            return {
                "file_id": unique_id
            }

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
