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

    notebook["cells"] = [
        {
            **cell,
            "source": cell["source"] if match.get("includeSource", False) else [],
            "outputs": cell["outputs"] if match.get("includeResults", False) else []
        }
        for i, cell in enumerate(notebook.get("cells", []))
        if (match := next((c for c in selected_cells if c["index"] == i), None))
    ]

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

    subprocess.run([
        "xelatex",
        "-interaction=nonstopmode",
        f"{output_file}.tex"
    ], check=True, cwd=input_file.parent)

    temp_ipynb.unlink()
