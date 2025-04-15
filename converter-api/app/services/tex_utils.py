import re


def html_to_rgb(color: str) -> str:
    color = color.lstrip('#')
    r, g, b = tuple(int(color[i:i + 2], 16) for i in (0, 2, 4))
    return f"{r},{g},{b}"


def patch_tex_file(tex: str, code_bg: str, text_bg: str, output_bg: str, remove_prompt: bool) -> str:
    rgb_code = html_to_rgb(code_bg)
    rgb_text = html_to_rgb(text_bg)
    rgb_output = html_to_rgb(output_bg)

    tex = tex.replace(
        r"\usepackage{graphicx}",
        r"""\usepackage{graphicx}
\usepackage{tcolorbox}
\tcbuselibrary{listings, breakable}
\definecolor{codebg}{RGB}{""" + rgb_code + r"""}
\definecolor{textbg}{RGB}{""" + rgb_text + r"""}
\definecolor{outputbg}{RGB}{""" + rgb_output + r"""}
\usepackage{fontspec}
\usepackage{polyglossia}
\setdefaultlanguage{russian}
\setmainfont{Times New Roman}
\newfontfamily\cyrillicfonttt{Courier New}
"""
    )

    tex = tex.replace("colback=cellbackground", "colback=codebg")

    if remove_prompt:
        tex = re.sub(
            r"\\prompt\{In\}\{incolor\}\{[^\}]*\}\{\\boxspacing\}\n?", "", tex)

    return tex
