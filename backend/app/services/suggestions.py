# backend/app/services/suggestions.py
# Analyses a DataFrame and returns a ranked list of cleaning suggestions.
# Each suggestion is self-contained: it knows what to fix, why, how many rows
# are affected, and carries an `operation_id` the cleaning engine can execute.

from __future__ import annotations
import re
import pandas as pd
import numpy as np
from typing import Any


# ─── Helpers ──────────────────────────────────────────────────────────────────

def _pct(n: int, total: int) -> float:
    return round(n / total * 100, 1) if total else 0.0


def _impact(pct: float) -> str:
    if pct >= 20:
        return "high"
    if pct >= 5:
        return "medium"
    return "low"


def _preview(series: pd.Series, n: int = 3) -> list[str]:
    """Return up to n sample values as strings."""
    sample = series.dropna().head(n)
    return [str(v) for v in sample]


# ─── Individual detectors ─────────────────────────────────────────────────────

def _detect_duplicates(df: pd.DataFrame) -> dict | None:
    count = int(df.duplicated().sum())
    if count == 0:
        return None
    pct = _pct(count, len(df))
    return {
        "id": "remove_duplicates",
        "title": "Remove duplicate rows",
        "problem": f"{count} rows are exact duplicates of another row.",
        "reason": "Duplicate rows skew aggregations, inflate training sets, and distort model metrics.",
        "impact": _impact(pct),
        "affected_rows": count,
        "affected_pct": pct,
        "preview": [],
        "operation": {"type": "remove_duplicates"},
    }


def _detect_empty_rows(df: pd.DataFrame) -> dict | None:
    mask = df.isnull().all(axis=1)
    count = int(mask.sum())
    if count == 0:
        return None
    pct = _pct(count, len(df))
    return {
        "id": "remove_empty_rows",
        "title": "Remove fully empty rows",
        "problem": f"{count} rows contain no data at all.",
        "reason": "Empty rows add noise and can crash downstream pipelines.",
        "impact": _impact(pct),
        "affected_rows": count,
        "affected_pct": pct,
        "preview": [],
        "operation": {"type": "remove_empty_rows"},
    }


def _detect_empty_columns(df: pd.DataFrame) -> dict | None:
    empty_cols = [c for c in df.columns if df[c].isnull().all()]
    if not empty_cols:
        return None
    return {
        "id": "remove_empty_columns",
        "title": "Remove fully empty columns",
        "problem": f"{len(empty_cols)} column(s) are entirely empty: {', '.join(empty_cols[:5])}.",
        "reason": "Empty columns carry no information and waste memory.",
        "impact": "medium",
        "affected_rows": len(df),
        "affected_pct": 100.0,
        "preview": empty_cols[:5],
        "operation": {"type": "remove_empty_columns", "columns": empty_cols},
    }


def _detect_whitespace(df: pd.DataFrame) -> dict | None:
    text_cols = df.select_dtypes(include="object").columns
    affected = 0
    cols_hit: list[str] = []
    samples: list[str] = []
    for col in text_cols:
        s = df[col].dropna().astype(str)
        has_ws = s[s != s.str.strip()]
        if len(has_ws):
            affected += len(has_ws)
            cols_hit.append(col)
            if len(samples) < 3:
                samples.extend(has_ws.head(2).tolist())
    if affected == 0:
        return None
    pct = _pct(affected, len(df) * max(len(text_cols), 1))
    return {
        "id": "trim_whitespace",
        "title": "Trim leading / trailing whitespace",
        "problem": f"{affected} cells across {len(cols_hit)} column(s) have extra spaces.",
        "reason": "Hidden whitespace causes failed joins, broken group-bys, and silent mismatches.",
        "impact": _impact(pct),
        "affected_rows": affected,
        "affected_pct": pct,
        "preview": samples[:3],
        "operation": {"type": "trim_whitespace", "columns": cols_hit},
    }


def _detect_missing_values(df: pd.DataFrame) -> list[dict]:
    results = []

    for col in df.columns:

        missing = int(df[col].isnull().sum())

        if missing == 0:
            continue

        pct = round(missing / len(df) * 100, 1)

        # Recommend dropping extremely sparse columns
        if pct >= 80:
            results.append({
                "id": f"drop_{col}",
                "title": f"Drop '{col}'",
                "problem": f"{pct}% of values are missing.",
                "reason": "Column contains too little usable information.",
                "impact": "high",
                "affected_rows": missing,
                "affected_pct": pct,
                "preview": [],
                "operation": {
                    "type": "remove_empty_columns",
                    "columns": [col],
                },
            })
            continue

        if pd.api.types.is_numeric_dtype(df[col]):

            strategy = "median"
            value = df[col].median()
            preview = f"{value:.4g}"

        else:

            lname = col.lower()

            if any(k in lname for k in [
                "director",
                "cast",
                "actor",
                "producer",
                "writer",
            ]):

                strategy = "custom"
                value = "Unknown"

            elif any(k in lname for k in [
                "country",
                "city",
                "state",
            ]):

                mode = df[col].mode()
                strategy = "mode"
                value = str(mode.iloc[0]) if len(mode) else "Unknown"

            elif "date" in lname:

                strategy = "forward_fill"
                value = ""

            else:

                mode = df[col].mode()

                if len(mode):
                    strategy = "mode"
                    value = str(mode.iloc[0])
                else:
                    strategy = "custom"
                    value = "Unknown"

            preview = str(value)

        results.append({
            "id": f"fill_missing_{col}",
            "title": f"Fix missing values — {col}",
            "problem": f"{missing:,} missing values ({pct}%).",
            "reason": f"Recommended strategy: {strategy}.",
            "impact": "high" if pct > 20 else "medium",
            "affected_rows": missing,
            "affected_pct": pct,
            "preview": [preview],
            "operation": {
                "type": "fill_missing",
                "column": col,
                "strategy": strategy,
                "value": value,
            },
        })

    return results


def _detect_capitalisation(df: pd.DataFrame) -> dict | None:
    text_cols = df.select_dtypes(include="object").columns
    affected = 0
    cols_hit: list[str] = []
    for col in text_cols:
        s = df[col].dropna().astype(str)
        mixed = s[(s != s.str.lower()) & (s != s.str.upper()) & (s != s.str.title())]
        if len(mixed) > len(s) * 0.1:
            affected += len(mixed)
            cols_hit.append(col)
    if not cols_hit:
        return None
    pct = _pct(affected, len(df))
    return {
        "id": "standardize_case",
        "title": "Standardise text capitalisation",
        "problem": f"Inconsistent casing found in {len(cols_hit)} column(s).",
        "reason": "Mixed case breaks grouping — 'UK' and 'uk' are treated as different categories.",
        "impact": _impact(pct),
        "affected_rows": affected,
        "affected_pct": pct,
        "preview": [],
        "operation": {"type": "standardize_case", "columns": cols_hit, "mode": "title"},
    }


def _detect_outliers(df: pd.DataFrame) -> list[dict]:
    results = []
    numeric_cols = df.select_dtypes(include=[np.number]).columns
    for col in numeric_cols:
        s = df[col].dropna()
        if len(s) < 10:
            continue
        q1, q3 = s.quantile(0.25), s.quantile(0.75)
        iqr = q3 - q1
        if iqr == 0:
            continue
        outlier_mask = (s < q1 - 1.5 * iqr) | (s > q3 + 1.5 * iqr)
        count = int(outlier_mask.sum())
        if count == 0:
            continue
        pct = _pct(count, len(df))
        if pct > 30:  # Skip — likely a legit distribution
            continue
        results.append({
            "id": f"flag_outliers_{col}",
            "title": f"Outliers detected — {col}",
            "problem": f"{count} outlier values in '{col}' (IQR method). Range: [{s.min():.4g}, {s.max():.4g}].",
            "reason": "Outliers skew means, damage regression models, and may indicate data entry errors.",
            "impact": _impact(pct),
            "affected_rows": count,
            "affected_pct": pct,
            "preview": [f"{v:.4g}" for v in s[outlier_mask].head(3)],
            "operation": {
                "type": "flag_outliers",
                "column": col,
                "method": "iqr",
                "lower": float(q1 - 1.5 * iqr),
                "upper": float(q3 + 1.5 * iqr),
            },
        })
    return results


def _detect_duplicate_columns(df: pd.DataFrame) -> dict | None:
    seen: dict[str, str] = {}
    dupes: list[str] = []
    for col in df.columns:
        norm = col.strip().lower()
        if norm in seen:
            dupes.append(col)
        else:
            seen[norm] = col
    if not dupes:
        return None
    return {
        "id": "rename_duplicate_columns",
        "title": "Rename duplicate column names",
        "problem": f"{len(dupes)} column name(s) are duplicates: {', '.join(dupes)}.",
        "reason": "Duplicate column names cause silent data overwriting during merges and exports.",
        "impact": "high",
        "affected_rows": len(df),
        "affected_pct": 100.0,
        "preview": dupes[:3],
        "operation": {"type": "rename_duplicate_columns", "duplicates": dupes},
    }


def _detect_type_conversion(df: pd.DataFrame) -> list[dict]:
    """Detect object columns that are actually numeric or dates."""
    results = []
    for col in df.select_dtypes(include="object").columns:
        s = df[col].dropna()
        if len(s) == 0:
            continue

        # Numeric disguised as string
        cleaned = s.astype(str).str.replace(r"[,\$€£%\s]", "", regex=True)
        try:
            pd.to_numeric(cleaned, errors="raise")
            pct = _pct(len(s), len(df))
            results.append({
                "id": f"convert_numeric_{col}",
                "title": f"Convert '{col}' to numeric",
                "problem": f"'{col}' is stored as text but contains numeric data.",
                "reason": "Numeric columns stored as strings cannot be used in calculations or ML features.",
                "impact": "high",
                "affected_rows": len(s),
                "affected_pct": pct,
                "preview": _preview(s),
                "operation": {"type": "convert_type", "column": col, "target_type": "numeric"},
            })
            continue
        except (ValueError, TypeError):
            pass

        # Date disguised as string
        try:
            parsed = pd.to_datetime(
                s.head(20),
                errors="raise",
                cache=True
            )
            if parsed.notna().mean() > 0.8:
                results.append({
                    "id": f"convert_date_{col}",
                    "title": f"Convert '{col}' to datetime",
                    "problem": f"'{col}' appears to contain dates stored as plain text.",
                    "reason": "Date columns stored as strings block time-series operations and sorting.",
                    "impact": "medium",
                    "affected_rows": int(df[col].notna().sum()),
                    "affected_pct": _pct(int(df[col].notna().sum()), len(df)),
                    "preview": _preview(s),
                    "operation": {"type": "convert_type", "column": col, "target_type": "datetime"},
                })
        except Exception:
            pass

    return results


def _detect_invalid_emails(df: pd.DataFrame) -> list[dict]:
    EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    results = []
    for col in df.select_dtypes(include="object").columns:
        if "email" not in col.lower() and "mail" not in col.lower():
            continue
        s = df[col].dropna().astype(str)
        invalid = s[~s.str.match(EMAIL_RE)]
        if len(invalid) == 0:
            continue
        pct = _pct(len(invalid), len(df))
        results.append({
            "id": f"fix_emails_{col}",
            "title": f"Invalid email addresses — {col}",
            "problem": f"{len(invalid)} values in '{col}' fail email validation.",
            "reason": "Invalid emails cause bounce rates, CRM failures, and compliance issues.",
            "impact": _impact(pct),
            "affected_rows": len(invalid),
            "affected_pct": pct,
            "preview": invalid.head(3).tolist(),
            "operation": {"type": "flag_invalid_emails", "column": col},
        })
    return results


def _detect_constant_columns(df: pd.DataFrame) -> dict | None:
    const_cols = [c for c in df.columns if df[c].nunique(dropna=False) <= 1]
    if not const_cols:
        return None
    return {
        "id": "remove_constant_columns",
        "title": "Remove constant columns",
        "problem": f"{len(const_cols)} column(s) have only one unique value: {', '.join(const_cols[:4])}.",
        "reason": "Constant columns provide zero information and inflate dimensionality.",
        "impact": "medium",
        "affected_rows": len(df),
        "affected_pct": 100.0,
        "preview": const_cols[:4],
        "operation": {"type": "remove_constant_columns", "columns": const_cols},
    }


# ─── Master entry point ───────────────────────────────────────────────────────

def generate_suggestions(df: pd.DataFrame) -> list[dict]:
    """Return a ranked list of cleaning suggestions for df."""
    suggestions: list[dict] = []

    # Single-shot detectors
    for detector in [
        _detect_duplicates,
        _detect_empty_rows,
        _detect_empty_columns,
        _detect_whitespace,
        _detect_capitalisation,
        _detect_duplicate_columns,
        _detect_constant_columns,
    ]:
        result = detector(df)
        if result:
            suggestions.append(result)

    # Multi-result detectors
    suggestions.extend(_detect_missing_values(df))
    suggestions.extend(_detect_outliers(df))
    suggestions.extend(_detect_type_conversion(df))
    suggestions.extend(_detect_invalid_emails(df))
    
    suggestions.append({
        "id": "optimize_memory",
        "title": "Optimize memory usage",
        "problem": "The dataframe can use more efficient data types.",
        "reason": "Downcast numeric columns and convert repetitive text columns to category.",
        "impact": "low",
        "affected_rows": len(df),
        "affected_pct": 100,
        "preview": [],
        "operation": {
            "type": "optimize_memory"
        },
    })

    # Sort: high impact first, then by affected_rows desc
    priority = {"high": 0, "medium": 1, "low": 2}
    suggestions.sort(key=lambda s: (priority.get(s["impact"], 3), -s["affected_rows"]))

    return suggestions