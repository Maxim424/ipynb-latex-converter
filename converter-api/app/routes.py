from fastapi import APIRouter, Form, UploadFile
from fastapi.responses import JSONResponse
from .services import conversion, file_utils, tex_utils
import shutil
import uuid
import json
from pathlib import Path
from typing import List
from fastapi import UploadFile
import subprocess

router = APIRouter()
UPLOAD_DIR = Path("./uploaded_files")


@router.post("/convert/")
async def convert_ipynb(
    files: list[UploadFile],
    selectedCells: str = Form(...),
    codeBg: str = Form("#f6f8fa"),
    textBg: str = Form("#ffffff"),
    outputBg: str = Form("#f9f2f4"),
    includeCellNumbers: str = Form("true"),
    mergeMode: str = Form("single")  # "single" or "include"
):
    unique_id = str(uuid.uuid4())
    remove_prompt_numbers = includeCellNumbers != "true"
    selected_cells = json.loads(selectedCells)

    if mergeMode == "single":
        # Объединяем все ячейки в один список
        all_cells = []
        for file in files:
            notebook = json.loads((await file.read()).decode("utf-8"))
            all_cells.extend(notebook.get("cells", []))

        # Формируем объединённый ноутбук
        merged_notebook = {
            "cells": all_cells,
            "metadata": {},
            "nbformat": 4,
            "nbformat_minor": 5
        }

        merged_file_path = UPLOAD_DIR / f"{unique_id}_merged.ipynb"
        with open(merged_file_path, "w", encoding="utf-8") as f:
            json.dump(merged_notebook, f)

        # Вызываем конвертацию
        conversion.convert_file(
            input_file=merged_file_path,
            selected_cells=selected_cells,
            output_file=unique_id,
            code_bg=codeBg,
            text_bg=textBg,
            output_bg=outputBg,
            remove_prompt_numbers=remove_prompt_numbers
        )

        return {"file_id": unique_id, "merged": False}

    else:
        temp_dir = UPLOAD_DIR / unique_id
        tex_filenames = []
        for file in files:
            filename = file.filename.replace(".ipynb", "")
            tex_filenames.append(filename)

        master_tex = temp_dir / "main.tex"
        with open(master_tex, "w", encoding="utf-8") as f:
            f.write(r"""\documentclass{article}
\usepackage{graphicx}
\usepackage{tcolorbox}
\tcbuselibrary{listings, breakable}
\definecolor{codebg}{RGB}{""" + tex_utils.html_to_rgb(codeBg) + r"""}
\definecolor{textbg}{RGB}{""" + tex_utils.html_to_rgb(textBg) + r"""}
\definecolor{outputbg}{RGB}{""" + tex_utils.html_to_rgb(outputBg) + r"""}
\usepackage{fontspec}
\usepackage{polyglossia}
\setdefaultlanguage{russian}
\setmainfont{Times New Roman}
\newfontfamily\cyrillicfonttt{Courier New}
\begin{document}
""")
            for tex in tex_filenames:
                f.write(f"\\include{{{Path(tex).stem}}}\n")
            f.write(r"\end{document}")

        subprocess.run([
            "xelatex",
            "-interaction=nonstopmode",
            "main.tex"
        ], check=True, cwd=temp_dir)

        return {"file_id": unique_id, "merged": True}


@router.get("/preview/{file_name}")
async def preview_file(file_name: str):
    return file_utils.get_file_response(file_name, inline=True)


@router.get("/download/{file_name}")
async def download_file(file_name: str):
    return file_utils.get_file_response(file_name, inline=False)
