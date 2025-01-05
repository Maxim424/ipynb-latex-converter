from fastapi import APIRouter, Form, UploadFile, Header
from fastapi.responses import JSONResponse
from .services import conversion, file_utils, tex_utils
import json
from pathlib import Path
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
    includeCellNumbers: str = Form("true"),
    indent: int = Form(0),
    removeComments: str = Form("false"),
    mergeMode: str = Form("single")  # "single" или "include"
):
    # Если директория для данной сессии уже существовала, удаляем её
    file_utils.clear_directory(UPLOAD_DIR / session_id)
    unique_id = session_id
    remove_prompt_numbers = includeCellNumbers != "true"
    selected_cells = json.loads(selectedCells)

    # Директория для хранения итоговых файлов
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

        # Выполняем конвертацию
        conversion.convert_file(
            input_file=merged_file_path,
            selected_cells=selected_cells,
            output_file=unique_id,
            code_bg=codeBg,
            remove_prompt_numbers=remove_prompt_numbers,
            indent=indent,
            remove_comments=removeComments == "true"
        )

    elif mergeMode == "include":
        tex_filenames = []
        for i, file in enumerate(files):
            # Сохраняем по отдельности каждый .ipynb файл
            content = await file.read()
            input_file = output_tex_dir / f"{i}_{file.filename}"
            with open(input_file, "wb") as f:
                f.write(content)

            output_file = output_tex_dir / f"{i}_{Path(file.filename).stem}"

            # Выполняем конвертацию
            conversion.convert_file(
                input_file=input_file,
                selected_cells=selected_cells,
                output_file=output_file.stem,
                code_bg=codeBg,
                remove_prompt_numbers=remove_prompt_numbers,
                indent=indent,
                remove_comments=removeComments == "true"
            )

            # Удаляем из сконвертирвоанного файла перамбулу
            tex_path = output_file.with_suffix(".tex")
            if i == 0:
                main_preamble, _ = tex_utils.split_tex_file(tex_path)
            tex_utils.overwrite_with_body_only(tex_path)
            tex_filenames.append(output_file.stem)

        # Создаем main.tex с преамбулой, включаем в него ранее сконвертированные файлы
        main_tex_path = output_tex_dir / "main.tex"
        with open(main_tex_path, "w", encoding="utf-8") as f:
            f.write(main_preamble + "\n\\begin{document}\n")
            for tex in tex_filenames:
                f.write(f"\\include{{{tex}}}\n")
            f.write("\\end{document}")

        try:
            # Выполняем конвертацию main.tex в PDF
            subprocess.run([
                "xelatex",
                "-interaction=nonstopmode",
                "main.tex"
            ], check=True, cwd=output_tex_dir)
        except:
            print("[WARNING] xelatex finished with non zero exit value")

    else:
        # Обрабатываем некорректное указание merge_mode в запросе
        return JSONResponse(content={"error": f"Wrong merge mode"}, status_code=404)

    # Перемещаем PDF файл в правильную директорию
    pdf_file_name = f"{unique_id}.pdf" if mergeMode == "single" else "main.pdf"
    pdf_file_path = output_dir / pdf_file_name
    final_pdf_path = output_tex_dir / pdf_file_name
    final_pdf_path.rename(pdf_file_path)

    # Удаляем вспомогательные файлы LaTeX
    file_utils.delete_aux_files(output_tex_dir=output_tex_dir)

    # Cоздаём ZIP
    file_utils.create_zip_with_images(output_dir, unique_id)

    return {"file_id": unique_id, "merged": mergeMode == "include"}


@router.get("/preview/{file_name}")
async def preview_file(file_name: str):
    return file_utils.get_preview_response(file_name)


@router.get("/download/{file_name}")
async def download_file(file_name: str):
    return file_utils.get_download_response(file_name)
