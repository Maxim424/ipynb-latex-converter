import json
import subprocess
import uuid
from pathlib import Path
from . import tex_utils

UPLOAD_DIR = Path("./uploaded_files")


def convert_file(
        input_file,
        selected_cells,
        output_file,
        code_bg,
        remove_prompt_numbers,
        indent: int,
        remove_comments: bool
):
    temp_ipynb = input_file.parent / f"temp_filtered_{uuid.uuid4().hex}.ipynb"
    output_tex = input_file.parent / f"{output_file}.tex"

    with open(input_file, 'r', encoding='utf-8') as f:
        notebook = json.load(f)

    # Оставляем в ноутбуке только указанные пользователем ячейки
    # и результаты их исполнения
    filtered_cells = []
    for i, cell in enumerate(notebook.get("cells", [])):
        match = next((c for c in selected_cells if c.get("index") == i), None)
        if not match:
            continue

        include_source = match.get("includeSource", False)
        include_results = match.get("includeResults", False)

        filtered_cells.append({
            **cell,
            "source": cell.get("source", []) if include_source else [],
            "outputs": cell.get("outputs", []) if include_results else []
        })

    # Разбиваем Markdown-ячейки с несколькими заголовками
    final_cells = []
    for cell in filtered_cells:
        if cell.get("cell_type") == "markdown":
            source_lines = cell.get("source", [])
            if isinstance(source_lines, str):
                source_lines = source_lines.splitlines(keepends=True)

            current_chunk = []
            for line in source_lines:
                if line.lstrip().startswith("#") and current_chunk:
                    # Добавляем предыдущий фрагмент как отдельную ячейку
                    final_cells.append({
                        "cell_type": "markdown",
                        "metadata": cell.get("metadata", {}),
                        "source": current_chunk
                    })
                    current_chunk = [line]
                else:
                    current_chunk.append(line)

            if current_chunk:
                final_cells.append({
                    "cell_type": "markdown",
                    "metadata": cell.get("metadata", {}),
                    "source": current_chunk
                })
        else:
            final_cells.append(cell)

    notebook["cells"] = final_cells

    # Создаем временный .ipynb файл для конвертации
    with open(temp_ipynb, 'w', encoding='utf-8') as f:
        json.dump(notebook, f)

    # Выполняем конвертацию
    subprocess.run([
        "jupyter", "nbconvert",
        "--to", "latex",
        "--output", output_file,
        str(temp_ipynb)
    ], check=True)

    with open(output_tex, 'r', encoding='utf-8') as f:
        tex = f.read()

    # Применяем настройки к сконвертированному файлу
    tex = tex_utils.patch_tex_file(
        tex,
        code_bg,
        remove_prompt_numbers,
        indent,
        remove_comments
    )

    with open(output_tex, 'w', encoding='utf-8') as f:
        f.write(tex)

    # Выполняем конвертацию в PDF
    try:
        subprocess.run([
            "xelatex",
            "-interaction=nonstopmode",
            f"{output_file}.tex"
        ], check=True, cwd=input_file.parent)
    except:
        print("[WARNING] xelatex finished with non zero exit value")

    # Удаляем временный файл
    temp_ipynb.unlink()
