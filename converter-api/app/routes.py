from fastapi import APIRouter, Form, UploadFile, Header
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
    session_id: str = Header(..., alias="X-Session-ID"),
    selectedCells: str = Form(...),
    codeBg: str = Form("#f6f8fa"),
    textBg: str = Form("#ffffff"),
    outputBg: str = Form("#f9f2f4"),
    includeCellNumbers: str = Form("true"),
    mergeMode: str = Form("single")  # "single" or "include"
):
    file_utils.clear_directory(UPLOAD_DIR / session_id)
    unique_id = session_id
    remove_prompt_numbers = includeCellNumbers != "true"
    selected_cells = json.loads(selectedCells)

    # директория для хранения итоговых файлов
    output_dir = UPLOAD_DIR / unique_id
    output_tex_dir = output_dir / "tex"
    output_tex_dir.mkdir(parents=True, exist_ok=True)

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

        merged_file_path = output_tex_dir / f"{unique_id}_merged.ipynb"
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

    elif mergeMode == "include":
        tex_filenames = []

        for i, file in enumerate(files):
            content = await file.read()
            input_file = output_tex_dir / f"{i}_{file.filename}"
            with open(input_file, "wb") as f:
                f.write(content)

            output_file = output_tex_dir / f"{i}_{Path(file.filename).stem}"
            conversion.convert_file(
                input_file=input_file,
                selected_cells=selected_cells,
                output_file=output_file.stem,
                code_bg=codeBg,
                text_bg=textBg,
                output_bg=outputBg,
                remove_prompt_numbers=remove_prompt_numbers
            )

            tex_path = output_file.with_suffix(".tex")
            if i == 0:
                main_preamble, _ = tex_utils.split_tex_file(tex_path)
            tex_utils.overwrite_with_body_only(tex_path)

            tex_filenames.append(output_file.stem)

        main_tex_path = output_tex_dir / "main.tex"
        with open(main_tex_path, "w", encoding="utf-8") as f:
            f.write(main_preamble + "\n\\begin{document}\n")
            for tex in tex_filenames:
                f.write(f"\\include{{{tex}}}\n")
            f.write("\\end{document}")

        try:
            subprocess.run([
                "xelatex",
                "-interaction=nonstopmode",
                "main.tex"
            ], check=True, cwd=output_tex_dir)
        except:
            print("silence warning")

    else:
        return JSONResponse(content={"error": f"Wrong merge mode"}, status_code=404)

    # преобразуем main.tex в PDF формат
    pdf_file_name = f"{unique_id}.pdf" if mergeMode == "single" else "main.pdf"
    pdf_file_path = output_dir / pdf_file_name
    final_pdf_path = output_tex_dir / pdf_file_name
    final_pdf_path.rename(pdf_file_path)

    # удаляем вспомогательные файлы LaTeX
    for aux_file in output_tex_dir.glob("*.aux"), output_tex_dir.glob("*.log"), output_tex_dir.glob("*.out"), output_tex_dir.glob("*.toc"), output_tex_dir.glob("*.ipynb"), output_tex_dir.glob("*.pdf"):
        for f in aux_file:
            f.unlink(missing_ok=True)

    # создаём ZIP
    file_utils.create_zip_with_images(output_dir, unique_id)

    return {"file_id": unique_id, "merged": mergeMode == "include"}


@router.get("/preview/{file_name}")
async def preview_file(file_name: str):
    return file_utils.get_preview_response(file_name)


@router.get("/download/{file_name}")
async def download_file(file_name: str):
    return file_utils.get_download_response(file_name)
