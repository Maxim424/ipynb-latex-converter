from fastapi.responses import JSONResponse, FileResponse
from pathlib import Path
import os
import zipfile
import shutil

UPLOAD_DIR = Path("./uploaded_files")


def remove_extension(file_name):
    return os.path.splitext(file_name)[0]


def get_extension(file_name):
    _, extension = os.path.splitext(file_name)
    return extension.lstrip('.')


def create_zip_with_images(output_dir, unique_id):
    zip_path = output_dir / f"{unique_id}.zip"
    output_tex_dir = output_dir / "tex"

    with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
        for folder_path, _, filenames in os.walk(output_tex_dir):
            for filename in filenames:
                file_path = Path(folder_path) / filename
                arcname = file_path.relative_to(output_dir)
                zipf.write(file_path, arcname=arcname)


def get_preview_response(file_name: str):
    requiredFileExtension = get_extension(file_name)
    file_name = remove_extension(file_name)
    pdf_file_path_single = UPLOAD_DIR / file_name / f"{file_name}.pdf"
    pdf_file_path_include = UPLOAD_DIR / file_name / "main.pdf"
    tex_file_path_single = UPLOAD_DIR / file_name / "tex" / f"{file_name}.tex"
    tex_file_path_include = UPLOAD_DIR / file_name / "tex" / "main.tex"

    if requiredFileExtension == "pdf":
        if pdf_file_path_single.exists():
            return FileResponse(pdf_file_path_single, media_type="application/pdf")
        elif pdf_file_path_include.exists():
            return FileResponse(pdf_file_path_include, media_type="application/pdf")
    elif requiredFileExtension == "tex":
        if tex_file_path_single.exists():
            return FileResponse(tex_file_path_single, media_type="text/plain")
        elif tex_file_path_include.exists():
            return FileResponse(tex_file_path_include, media_type="text/plain")
    return JSONResponse(content={"error": f"File not found: {file_name}"}, status_code=404)


def get_download_response(file_name: str):
    requiredFileExtension = get_extension(file_name)
    file_name = remove_extension(file_name)
    pdf_file_path_single = UPLOAD_DIR / file_name / f"{file_name}.pdf"
    pdf_file_path_include = UPLOAD_DIR / file_name / "main.pdf"
    tex_file_path = UPLOAD_DIR / file_name / f"{file_name}.zip"

    if requiredFileExtension == "pdf":
        if pdf_file_path_single.exists():
            return FileResponse(
                pdf_file_path_single,
                media_type="application/pdf",
                filename=f"{file_name}.pdf",
                headers={
                    "Content-Disposition": f"attachment; filename={file_name}.pdf"}
            )
        elif pdf_file_path_include.exists():
            return FileResponse(
                pdf_file_path_include,
                media_type="application/pdf",
                filename=f"{file_name}.pdf",
                headers={
                    "Content-Disposition": f"attachment; filename={file_name}.pdf"}
            )
    elif requiredFileExtension == "zip" and tex_file_path.exists():
        return FileResponse(
            tex_file_path,
            media_type="application/zip",
            filename=f"{file_name}.zip",
            headers={"Content-Disposition": f"attachment; filename={file_name}.zip"}
        )
    return JSONResponse(content={"error": f"File not found: {file_name}"}, status_code=404)


def clear_directory(directory_path: Path):
    if directory_path.exists() and directory_path.is_dir():
        try:
            shutil.rmtree(directory_path)
        except Exception as e:
            print(f"[ERROR] Failed to delete directory {directory_path}: {e}")


def delete_aux_files(output_tex_dir: Path):
    for aux_files in (output_tex_dir.glob("*.aux"),
                      output_tex_dir.glob("*.log"),
                      output_tex_dir.glob("*.out"),
                      output_tex_dir.glob("*.toc"),
                      output_tex_dir.glob("*.ipynb"),
                      output_tex_dir.glob("*.pdf")):
        for f in aux_files:
            f.unlink(missing_ok=True)
