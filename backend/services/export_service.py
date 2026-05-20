from __future__ import annotations

import csv
import io
from typing import Any

from fastapi import Response


def csv_response(rows: list[dict[str, Any]], filename: str) -> Response:
    buffer = io.StringIO()
    fieldnames = sorted({key for row in rows for key in row.keys()}) or ["message"]
    writer = csv.DictWriter(buffer, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(rows or [{"message": "No schedule rows available"}])
    return Response(
        content=buffer.getvalue(),
        media_type="text/csv",
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )


def pdf_response(title: str, metrics: dict[str, Any], rows: list[dict[str, Any]], filename: str) -> Response:
    buffer = io.BytesIO()
    try:
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import landscape, letter
        from reportlab.lib.styles import getSampleStyleSheet
        from reportlab.platypus import Paragraph, SimpleDocTemplate, Spacer, Table, TableStyle

        doc = SimpleDocTemplate(buffer, pagesize=landscape(letter), rightMargin=24, leftMargin=24)
        styles = getSampleStyleSheet()
        story = [Paragraph(title, styles["Title"]), Spacer(1, 12)]
        metric_rows = [["Metric", "Value"]] + [[k.replace("_", " ").title(), str(v)] for k, v in metrics.items()]
        metric_table = Table(metric_rows, colWidths=[180, 260])
        metric_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#0f172a")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#94a3b8")),
                    ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
                ]
            )
        )
        story.append(metric_table)
        story.append(Spacer(1, 16))

        sample = rows[:32]
        columns = ["exam", "room", "date", "time", "students in room", "status"]
        table_data = [columns]
        for row in sample:
            table_data.append([str(row.get(col, row.get(col.replace(" ", "_"), "")))[:42] for col in columns])
        schedule_table = Table(table_data, repeatRows=1)
        schedule_table.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#1d4ed8")),
                    ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
                    ("GRID", (0, 0), (-1, -1), 0.25, colors.HexColor("#cbd5e1")),
                    ("FONTSIZE", (0, 0), (-1, -1), 8),
                ]
            )
        )
        story.append(schedule_table)
        doc.build(story)
        content = buffer.getvalue()
        media_type = "application/pdf"
    except Exception:
        text = [title, "", "Metrics:"]
        text.extend(f"{key}: {value}" for key, value in metrics.items())
        text.append("")
        text.append("Install reportlab for formatted PDF export.")
        content = "\n".join(text).encode("utf-8")
        media_type = "text/plain"

    return Response(
        content=content,
        media_type=media_type,
        headers={"Content-Disposition": f'attachment; filename="{filename}"'},
    )

