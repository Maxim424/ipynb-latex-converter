import re
from pathlib import Path


def html_to_rgb(color: str) -> str:
    color = color.lstrip('#')
    r, g, b = tuple(int(color[i:i + 2], 16) for i in (0, 2, 4))
    return f"{r},{g},{b}"


def patch_tex_file(
        tex: str,
        code_bg: str,
        remove_prompt: bool,
        indent: int,
        remove_comments: bool
) -> str:
    rgb_code = html_to_rgb(code_bg)

    # Настраиваем шрифты, цвет кодовых ячеек и отступ текста
    tex = tex.replace(
        r"\usepackage{graphicx}",
        r"""\usepackage{graphicx}
\usepackage{tcolorbox}
\tcbuselibrary{listings, breakable}
\definecolor{codebg}{RGB}{""" + rgb_code + r"""}
\usepackage{fontspec}
\usepackage{polyglossia}
\setdefaultlanguage{russian}
\setmainfont{DejaVu Serif}
\newfontfamily\cyrillicfonttt{DejaVu Sans Mono}
\setlength{\parindent}{""" + str(indent) + r"""mm}
"""
    )

    # Заменяем стандартный цвет кодовых ячеек на свой
    tex = tex.replace("colback=cellbackground", "colback=codebg")

    # Удаляем автоматически сгенерированный заголовок
    tex = tex.replace(r"\maketitle", "")

    # Удаляем номера ячеек, если требуется
    if remove_prompt:
        tex = re.sub(
            r"\\prompt\{In\}\{incolor\}\{[^\}]*\}\{\\boxspacing\}\n?", "", tex)
        tex = re.sub(
            r"\\prompt\{Out\}\{outcolor\}\{[^\}]*\}\{[^\}]*\}", "", tex)

    # Удаляем комментарии, если требуется
    if remove_comments:
        tex = re.sub(r'(?m)^\s*%.*\n?', '', tex)

    return tex


def split_tex_file(tex_path: Path):
    with tex_path.open("r", encoding="utf-8") as f:
        tex = f.read()

    preamble_match = re.search(r"^(.*?)\\begin{document}", tex, re.DOTALL)
    body_match = re.search(
        r"\\begin{document}(.*?)\\end{document}", tex, re.DOTALL)

    if not preamble_match or not body_match:
        raise ValueError(
            f"Не удалось найти преамбулу или тело документа в файле {tex_path}")

    preamble = preamble_match.group(1).strip()
    body = body_match.group(1).strip()

    return preamble, body


def overwrite_with_body_only(tex_path: Path):
    _, body = split_tex_file(tex_path)
    with tex_path.open("w", encoding="utf-8") as f:
        f.write(body)
