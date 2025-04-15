from fastapi.responses import JSONResponse, FileResponse
from pathlib import Path

UPLOAD_DIR = Path("./uploaded_files")


def get_file_response(file_name: str, inline: bool):
    file_path = UPLOAD_DIR / file_name
    if not file_path.exists():
        return JSONResponse(content={"error": f"File not found: {file_name}"}, status_code=404)

    if file_name.endswith(".pdf"):
        media_type = "application/pdf"
    elif file_name.endswith(".tex"):
        media_type = "text/plain" if inline else "application/x-tex"
    else:
        return JSONResponse(content={"error": "Invalid file format"}, status_code=400)

    return FileResponse(
        file_path,
        media_type=media_type,
        filename=file_name,
        headers={
            "Content-Disposition": "inline" if inline else f"attachment; filename={file_name}"}
    )
