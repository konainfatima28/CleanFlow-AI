# backend/app/services/exporter.py
# Generates downloadable exports from a cleaned DataFrame + operation log.
# Supports: CSV, XLSX, JSON, Pandas Python script, Markdown report.

from __future__ import annotations
import io
import json
import textwrap
from datetime import datetime
from typing import Any

import numpy as np
import pandas as pd


# ─── CSV ──────────────────────────────────────────────────────────────────────

def to_csv(df: pd.DataFrame) -> bytes:
    buf = io.StringIO()
    df.to_csv(buf, index=False)
    return buf.getvalue().encode("utf-8")


# ─── XLSX ─────────────────────────────────────────────────────────────────────

def to_xlsx(df: pd.DataFrame) -> bytes:
    buf = io.BytesIO()
    with pd.ExcelWriter(buf, engine="openpyxl") as writer:
        df.to_excel(writer, index=False, sheet_name="Cleaned Data")
        # Auto-fit column widths
        ws = writer.sheets["Cleaned Data"]
        for col_cells in ws.columns:
            max_len = max(
                len(str(cell.value)) if cell.value is not None else 0
                for cell in col_cells
            )
            ws.column_dimensions[col_cells[0].column_letter].width = min(max_len + 4, 40)
    return buf.getvalue()


# ─── JSON ─────────────────────────────────────────────────────────────────────

def to_json(df: pd.DataFrame) -> bytes:
    df = df.replace([np.inf, -np.inf], None)
    df = df.where(pd.notnull(df), None)

    return json.dumps(
        df.to_dict(orient="records"),
        default=str,
        ensure_ascii=False,
        indent=2,
    ).encode("utf-8")

# ─── Pandas script ────────────────────────────────────────────────────────────

def _op_to_pandas(op: dict) -> str | None:
    """Convert one operation dict into a Pandas code snippet."""
    t = op.get("type", "")

    if t == "remove_duplicates":
        return "df = df.drop_duplicates().reset_index(drop=True)"

    if t == "remove_empty_rows":
        return "df = df.dropna(how='all').reset_index(drop=True)"

    if t == "remove_empty_columns":
        cols = op.get("columns", [])
        return f"df = df.drop(columns={cols!r})"

    if t == "remove_constant_columns":
        cols = op.get("columns", [])
        return f"df = df.drop(columns={cols!r})"

    if t == "trim_whitespace":
        cols = op.get("columns", [])
        lines = [f"# Trim whitespace in {len(cols)} column(s)"]
        for c in cols:
            lines.append(f"df[{c!r}] = df[{c!r}].astype(str).str.strip()")
        return "\n".join(lines)

    if t == "fill_missing":
        col      = op.get("column", "")
        strategy = op.get("strategy", "median")
        if strategy == "mean":
            return f"df[{col!r}] = df[{col!r}].fillna(df[{col!r}].mean())"
        if strategy == "median":
            return f"df[{col!r}] = df[{col!r}].fillna(df[{col!r}].median())"
        if strategy == "mode":
            return f"df[{col!r}] = df[{col!r}].fillna(df[{col!r}].mode()[0])"
        if strategy == "forward_fill":
            return f"df[{col!r}] = df[{col!r}].ffill()"
        if strategy == "backward_fill":
            return f"df[{col!r}] = df[{col!r}].bfill()"
        if strategy in ("zero", "custom"):
            val = op.get("value", 0)
            return f"df[{col!r}] = df[{col!r}].fillna({val!r})"

    if t == "standardize_case":
        cols = op.get("columns", [])
        mode = op.get("mode", "title")
        method_map = {
            "title": "str.title()",
            "lower": "str.lower()",
            "upper": "str.upper()",
            "sentence": "str.capitalize()",
        }
        method = method_map.get(mode, "str.title()")
        lines = [f"# Standardise case ({mode}) in {len(cols)} column(s)"]
        for c in cols:
            lines.append(f"df[{c!r}] = df[{c!r}].astype(str).{method}")
        return "\n".join(lines)

    if t == "convert_type":
        col    = op.get("column", "")
        target = op.get("target_type", "")
        if target == "numeric":
            return (
                f"df[{col!r}] = pd.to_numeric(\n"
                f"    df[{col!r}].astype(str).str.replace(r'[,\\$€£%\\s]', '', regex=True),\n"
                f"    errors='coerce'\n"
                f")"
            )
        if target == "datetime":
            return (
                f"df[{col!r}] = pd.to_datetime(df[{col!r}], errors='coerce')\n"
                f"df[{col!r}] = df[{col!r}].dt.strftime('%Y-%m-%d')"
            )
        if target == "string":
            return f"df[{col!r}] = df[{col!r}].astype(str)"
        if target == "integer":
            return f"df[{col!r}] = pd.to_numeric(df[{col!r}], errors='coerce').astype('Int64')"

    if t == "rename_duplicate_columns":
        return textwrap.dedent("""
            # Rename duplicate column names
            seen = {}
            new_cols = []
            for col in df.columns:
                norm = col.strip().lower()
                if norm in seen:
                    seen[norm] += 1
                    new_cols.append(f"{col}_{seen[norm]}")
                else:
                    seen[norm] = 0
                    new_cols.append(col)
            df.columns = new_cols
        """).strip()

    if t == "flag_outliers":
        col    = op.get("column", "")
        lower  = op.get("lower")
        upper  = op.get("upper")
        return (
            f"# Detect outliers in '{col}' using IQR\n"
            f"mask = ~df[{col!r}].between({lower}, {upper}) & df[{col!r}].notna()\n"
            f"df['{col}_outlier_flag'] = mask\n"
            f"# Optional: clip values\n"
            f"df[{col!r}] = df[{col!r}].clip({lower}, {upper})"
        )

    if t == "flag_invalid_emails":
        col = op.get("column", "")
        return (
            f"import re\n"
            f"_email_re = re.compile(r'^[^@\\s]+@[^@\\s]+\\.[^@\\s]+$')\n"
            f"df['{col}_valid_email'] = df[{col!r}].astype(str).str.match(_email_re)"
        )

    if t == "remove_special_characters":
        cols    = op.get("columns", [])
        pattern = op.get("pattern", r"[^\w\s\.,\-]")
        lines   = [f"# Remove special characters from {len(cols)} column(s)"]
        for c in cols:
            lines.append(f"df[{c!r}] = df[{c!r}].astype(str).str.replace(r{pattern!r}, '', regex=True)")
        return "\n".join(lines)

    return (
        f"# Operation '{t}' is handled internally by CleanFlow AI\n"
        f"# No equivalent Pandas code is required."
    )


def to_pandas_script(
    original_filename: str,
    operations: list[dict],
    cleaned_shape: tuple[int, int],
) -> bytes:
    """Generate a reproducible Pandas cleaning script."""
    ts   = datetime.now().strftime("%Y-%m-%d %H:%M")
    rows, cols = cleaned_shape

    header = textwrap.dedent(f'''
        """
        CleanFlow AI — Auto-generated Pandas Cleaning Script
        Generated : {ts}
        Source    : {original_filename}
        Result    : {rows} rows × {cols} columns
        Operations: {len(operations)}

        Usage:
            pip install pandas openpyxl
            python cleanflow_script.py
        """

        import pandas as pd
        import numpy as np
        import re

        # ── Load your file ──────────────────────────────────────────────────
        # Adjust the path and read function as needed.
        df = pd.read_csv({original_filename!r})
        # df = pd.read_excel({original_filename!r})   # for XLSX files

        print(f"Loaded: {{len(df)}} rows × {{len(df.columns)}} columns")

    ''').lstrip()

    steps: list[str] = []
    for i, op in enumerate(operations, 1):
        snippet = _op_to_pandas(op)
        if snippet:
            steps.append(f"# ── Step {i}: {op.get('type', 'unknown')} ──\n{snippet}\n")

    footer = textwrap.dedent(f'''

        # ── Save the cleaned file ───────────────────────────────────────────
        output_path = "cleaned_{original_filename}"
        df.to_csv(output_path, index=False)
        print(f"Saved cleaned file to: {{output_path}}")
        print(f"Final shape: {{df.shape[0]}} rows × {{df.shape[1]}} columns")
    ''')

    script = header + "\n".join(steps) + footer
    return script.encode("utf-8")


# ─── Markdown report ──────────────────────────────────────────────────────────

def to_markdown_report(
    original_filename: str,
    original_profile: dict,
    cleaned_profile:  dict,
    log: list[dict],
    operations: list[dict],
) -> bytes:
    ts       = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    o        = original_profile
    c        = cleaned_profile
    rows_rem = o.get("rows", 0) - c.get("rows", 0)
    miss_fix = o.get("missing_values", 0) - c.get("missing_values", 0)
    score_up = c.get("quality_score", 0) - o.get("quality_score", 0)

    applied = [e for e in log if e.get("status") == "ok"]
    
    memory_saved = round(
        o.get("memory_kb", 0) - c.get("memory_kb", 0),
        2,
    )

    duplicates_removed = max(
        0,
        o.get("duplicates", 0) - c.get("duplicates", 0),
    )

    rows_removed = max(
        0,
        o.get("rows", 0) - c.get("rows", 0),
    )

    md = f"""# CleanFlow AI — Cleaning Report

**File:** `{original_filename}`
**Generated:** {ts}

---

## Summary

| Metric | Before | After | Change |
|--------|--------|-------|--------|
| Quality score | {o.get("quality_score", "—")} | {c.get("quality_score", "—")} | {f"+{score_up}" if score_up >= 0 else score_up} |
| Rows | {o.get("rows", "—"):,} | {c.get("rows", "—"):,} | −{rows_rem:,} |
| Columns | {o.get("columns", "—")} | {c.get("columns", "—")} | {c.get("columns", 0) - o.get("columns", 0)} |
| Missing values | {o.get("missing_values", "—"):,} | {c.get("missing_values", "—"):,} | −{miss_fix:,} |
| Duplicates | {o.get("duplicates", "—"):,} | {c.get("duplicates", "—"):,} | -{duplicates_removed:,} |
| Memory | {o.get("memory_kb", 0):.1f} KB | {c.get("memory_kb", 0):.1f} KB | {memory_saved:.2f} KB |
---

## Operations Applied ({len(applied)})

"""

    for i, entry in enumerate(applied, 1):
        md += f"### {i}. `{entry.get('operation', 'unknown')}`\n"
        md += f"- **Rows affected:** {entry.get('rows_affected', 0):,}\n"
        md += f"- **Detail:** {entry.get('detail', '')}\n"
        md += f"- **Status:** ✅ {entry.get('status', '')}\n\n"

    if not applied:
        md += "_No operations were applied._\n\n"

    md += """---

## Column Profile (After Cleaning)

| Column | Type | Missing | Unique | Completeness |
|--------|------|---------|--------|--------------|
"""
    for col in c.get("columns_detail", []):
        md += (
            f"| `{col['name']}` "
            f"| {col['dtype']} "
            f"| {col['missing']} ({col['missing_pct']}%) "
            f"| {col['unique']} "
            f"| {col['completeness']}% |\n"
        )

    md += "\n---\n\n*Report generated by [CleanFlow AI](https://github.com/konainfatima28)*\n"

    return md.encode("utf-8")
