"""Gera o modelo em branco do PET-SD a partir da ficha oficial preenchida.

Mantém só a estrutura (cabeçalho, título, campos, colunas, rodapé, instruções)
e remove nome, GAT, perfil marcado, mês, total, todas as linhas de atividade e
metadados de pacote (IDs do Google Docs e do Grammarly).
Uso (requer python-docx): python scripts/gerar-modelo-em-branco.py <ficha-preenchida.docx> <destino.docx>
A ficha de origem fica fora do repositório; confira o resultado com unzip + grep antes de versionar.
"""
import copy
import datetime
import re
import sys
import zipfile
from io import BytesIO

from docx import Document

src, dst = sys.argv[1], sys.argv[2]
EMPTY_ROWS = 12

doc = Document(src)


def clear_cell(cell):
    for paragraph in cell.paragraphs:
        for run in paragraph.runs:
            run.text = ""


ident, activities = doc.tables[0], doc.tables[1]
assert ident.cell(0, 0).text.strip().startswith("Nome")
for row in (0, 1, 3):
    clear_cell(ident.cell(row, 1))
# Perfil: desmarca todas as caixas mantendo o texto das opções.
for paragraph in ident.cell(2, 1).paragraphs:
    for run in paragraph.runs:
        run.text = re.sub(r"\(\s*[Xx]\s*\)", "(   )", run.text)

header = activities.rows[0]
assert header.cells[0].text.strip() == "Data", header.cells[0].text
total_row = activities.rows[-1]
assert "Total de CH" in total_row.cells[0].text
body_rows = activities.rows[1:-1]
template_tr = copy.deepcopy(body_rows[-1]._tr)  # linha vazia do modelo
for row in body_rows:
    activities._tbl.remove(row._tr)
for _ in range(EMPTY_ROWS):
    new_tr = copy.deepcopy(template_tr)
    total_row._tr.addprevious(new_tr)
for row in activities.rows[1:-1]:
    for cell in row.cells:
        clear_cell(cell)
# Total: mantém o rótulo e apaga o número.
runs = [run for p in total_row.cells[0].paragraphs for run in p.runs]
full = "".join(run.text for run in runs)
assert full.strip().startswith("Total de CH no mês"), full
for run in runs:
    run.text = ""
runs[0].text = "Total de CH no mês:            horas"

props = doc.core_properties
for field in ("author", "last_modified_by", "title", "subject", "keywords", "comments", "category"):
    setattr(props, field, "")
props.revision = 1
fixed = datetime.datetime(2026, 1, 1)
props.created = fixed
props.modified = fixed

buffer = BytesIO()
doc.save(buffer)

# Remove partes com identificadores externos e reescreve as referências.
DROP = re.compile(r"^(customXML/|customXml/|docProps/custom\.xml$)")
with zipfile.ZipFile(buffer) as zin, zipfile.ZipFile(dst, "w", zipfile.ZIP_DEFLATED) as zout:
    for item in zin.infolist():
        if DROP.match(item.filename):
            continue
        data = zin.read(item.filename)
        if item.filename == "[Content_Types].xml":
            text = data.decode("utf8")
            text = re.sub(r'<Override PartName="/(customXML|customXml)/[^"]*"[^>]*/>', "", text)
            text = re.sub(r'<Override PartName="/docProps/custom\.xml"[^>]*/>', "", text)
            data = text.encode("utf8")
        elif item.filename.endswith(".rels"):
            text = data.decode("utf8")
            text = re.sub(r'<Relationship [^>]*Target="[^"]*(customXML|customXml|custom\.xml)[^"]*"[^>]*/>', "", text)
            data = text.encode("utf8")
        fixed_info = zipfile.ZipInfo(item.filename, date_time=(2026, 1, 1, 0, 0, 0))
        fixed_info.compress_type = zipfile.ZIP_DEFLATED
        zout.writestr(fixed_info, data)
print("ok", dst)
