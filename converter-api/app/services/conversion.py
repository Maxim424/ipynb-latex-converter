import json
import subprocess
import uuid
from pathlib import Path
from . import tex_utils

UPLOAD_DIR = Path("./uploaded_files")


def convert_file(input_file, selected_cells, output_file, code_bg, text_bg, output_bg, remove_prompt_numbers):
    temp_ipynb = input_file.parent / f"temp_filtered_{uuid.uuid4().hex}.ipynb"
    output_tex = input_file.parent / f"{output_file}.tex"

    with open(input_file, 'r', encoding='utf-8') as f:
        notebook = json.load(f)

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

    notebook["cells"] = filtered_cells

    with open(temp_ipynb, 'w', encoding='utf-8') as f:
        json.dump(notebook, f)

    subprocess.run([
        "jupyter", "nbconvert",
        "--to", "latex",
        "--output", output_file,
        str(temp_ipynb)
    ], check=True)

    with open(output_tex, 'r', encoding='utf-8') as f:
        tex = f.read()

    tex = tex_utils.patch_tex_file(tex, code_bg, text_bg,
                                   output_bg, remove_prompt_numbers)

    with open(output_tex, 'w', encoding='utf-8') as f:
        f.write(tex)

    print(f"❗️ {output_file}")
    subprocess.run([
        "xelatex",
        "-interaction=nonstopmode",
        f"{output_file}.tex"
    ], check=True, cwd=input_file.parent)

    temp_ipynb.unlink()
