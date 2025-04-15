from fastapi import APIRouter, Form, UploadFile
from fastapi.responses import JSONResponse
from .services import conversion, file_utils
import shutil
import uuid
import json
from pathlib import Path

router = APIRouter()
UPLOAD_DIR = Path("./uploaded_files")


@router.post("/convert/")
async def convert_ipynb(
    file: UploadFile,
    selectedCells: str = Form(...),
    codeBg: str = Form("#f6f8fa"),
    textBg: str = Form("#ffffff"),
    outputBg: str = Form("#f9f2f4"),
    includeCellNumbers: str = Form("true")
):
    unique_id = str(uuid.uuid4())
    file_path = UPLOAD_DIR / f"{unique_id}.ipynb"
    with file_path.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    selected_cells = json.loads(selectedCells)
    remove_prompt_numbers = includeCellNumbers != "true"

    try:
        conversion.convert_file(
            input_file=file_path,
            selected_cells=selected_cells,
            output_file=unique_id,
            code_bg=codeBg,
            text_bg=textBg,
            output_bg=outputBg,
            remove_prompt_numbers=remove_prompt_numbers
        )
    except Exception:
        return JSONResponse(content={"error": "File conversion error"}, status_code=500)

    return {"file_id": unique_id}


@router.get("/preview/{file_name}")
async def preview_file(file_name: str):
    return file_utils.get_file_response(file_name, inline=True)


@router.get("/download/{file_name}")
async def download_file(file_name: str):
    return file_utils.get_file_response(file_name, inline=False)
