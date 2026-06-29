# backend/app/services/cleaner.py
# Executes cleaning operations against a DataFrame.
# Each operation is keyed by `type` and maps to a pure function.
# Returns the cleaned DataFrame + a structured log of what changed.

from __future__ import annotations
import re
import pandas as pd
import numpy as np
from typing import Any


# ─── Types ────────────────────────────────────────────────────────────────────

class CleanResult:
    def __init__(self, df: pd.DataFrame, log: list[dict]):
        self.df = df
        self.log = log  # list of {operation, rows_affected, detail}


# ─── Individual operation handlers ────────────────────────────────────────────

def _remove_duplicates(df: pd.DataFrame, _op: dict) -> tuple[pd.DataFrame, dict]:
    before = len(df)
    df = df.drop_duplicates().reset_index(drop=True)
    removed = before - len(df)
    return df, {"rows_affected": removed, "detail": f"Removed {removed} duplicate rows."}


def _remove_empty_rows(df: pd.DataFrame, _op: dict) -> tuple[pd.DataFrame, dict]:
    before = len(df)
    df = df.dropna(how="all").reset_index(drop=True)
    removed = before - len(df)
    return df, {"rows_affected": removed, "detail": f"Removed {removed} fully empty rows."}


def _remove_empty_columns(df: pd.DataFrame, op: dict) -> tuple[pd.DataFrame, dict]:
    cols = op.get("columns") or [c for c in df.columns if df[c].isnull().all()]
    existing = [c for c in cols if c in df.columns]
    df = df.drop(columns=existing)
    return df, {"rows_affected": len(df), "detail": f"Removed {len(existing)} empty column(s): {', '.join(existing)}."}


def _remove_constant_columns(df: pd.DataFrame, op: dict) -> tuple[pd.DataFrame, dict]:
    cols = op.get("columns") or [c for c in df.columns if df[c].nunique(dropna=False) <= 1]
    existing = [c for c in cols if c in df.columns]
    df = df.drop(columns=existing)
    return df, {"rows_affected": len(df), "detail": f"Removed {len(existing)} constant column(s): {', '.join(existing)}."}


def _trim_whitespace(df: pd.DataFrame, op: dict):

    cols = op.get("columns") or list(df.select_dtypes(include="object").columns)

    affected_rows = set()

    for col in cols:

        if col not in df.columns:
            continue

        before = df[col].astype(str)

        after = before.str.strip()

        changed = before != after

        affected_rows.update(df.index[changed])

        df[col] = after.replace("nan", np.nan)

    return df, {
        "rows_affected": len(affected_rows),
        "detail": f"Trimmed whitespace in {len(cols)} column(s).",
    }

def _fill_missing(df: pd.DataFrame, op: dict) -> tuple[pd.DataFrame, dict]:

    col = op["column"]
    strategy = op.get("strategy", "median")

    if col not in df.columns:
        return df, {
            "rows_affected": 0,
            "detail": f"Column '{col}' not found."
        }

    missing_before = int(df[col].isnull().sum())

    if missing_before == 0:
        return df, {
            "rows_affected": 0,
            "detail": f"No missing values in '{col}'."
        }

    # ---------- Numeric ----------
    if pd.api.types.is_numeric_dtype(df[col]):

        if strategy == "mean":
            fill = df[col].mean()

        elif strategy == "median":
            fill = df[col].median()

        elif strategy == "mode":
            m = df[col].mode()
            fill = m.iloc[0] if len(m) else 0

        else:
            fill = op.get("value", 0)

        df[col] = df[col].fillna(fill)

    # ---------- Text ----------
    else:

        if strategy == "forward_fill":

            df[col] = (
                df[col]
                .ffill()
                .fillna("Unknown")
            )

        elif strategy == "backward_fill":

            df[col] = (
                df[col]
                .bfill()
                .fillna("Unknown")
            )

        elif strategy == "mode":

            m = df[col].mode()

            fill = (
                str(m.iloc[0])
                if len(m)
                else "Unknown"
            )

            df[col] = df[col].fillna(fill)

        elif strategy == "custom":

            df[col] = df[col].fillna(
                op.get("value", "Unknown")
            )

        else:

            df[col] = df[col].fillna("Unknown")

        # Remove whitespace

        df[col] = (
            df[col]
            .astype(str)
            .str.strip()
        )

        # Empty strings → Unknown

        df[col] = df[col].replace(
            ["", "nan", "None"],
            "Unknown"
        )

    return df, {
        "rows_affected": missing_before,
        "detail": (
            f"Filled {missing_before:,} missing values "
            f"in '{col}' using {strategy}."
        ),
    }
    
def _standardize_case(df: pd.DataFrame, op: dict) -> tuple[pd.DataFrame, dict]:

    cols = op.get("columns") or list(df.select_dtypes(include="object").columns)
    mode = op.get("mode", "title")

    affected_rows = set()

    for col in cols:

        if col not in df.columns:
            continue

        before = df[col].astype(str)

        if mode == "title":
            after = before.str.title()

        elif mode == "lower":
            after = before.str.lower()

        elif mode == "upper":
            after = before.str.upper()

        else:
            after = before.str.capitalize()

        changed = before != after

        affected_rows.update(df.index[changed])

        df[col] = after

    return df, {
        "rows_affected": len(affected_rows),
        "detail": f"Standardized text case in {len(cols)} column(s).",
    }


def _convert_type(df: pd.DataFrame, op: dict) -> tuple[pd.DataFrame, dict]:
    col = op["column"]
    target = op["target_type"]
    if col not in df.columns:
        return df, {"rows_affected": 0, "detail": f"Column '{col}' not found."}

    affected = int(df[col].notna().sum())
    if target == "numeric":
        cleaned = df[col].astype(str).str.replace(r"[,\$€£%\s]", "", regex=True)
        df[col] = pd.to_numeric(cleaned, errors="coerce")
    elif target == "datetime":
        df[col] = pd.to_datetime(
            df[col],
            errors="coerce",
            cache=True,
        )
        df[col] = (
            pd.to_datetime(
                df[col],
                errors="coerce"
            )
            .dt.strftime("%Y-%m-%d")
            .fillna("Unknown")
        )
    elif target == "string":
        df[col] = df[col].astype(str)
    elif target == "integer":
        df[col] = pd.to_numeric(df[col], errors="coerce").astype("Int64")
    elif target == "boolean":
        true_vals = {"true", "1", "yes", "y"}
        df[col] = df[col].astype(str).str.lower().isin(true_vals)

    return df, {"rows_affected": affected, "detail": f"Converted '{col}' to {target}."}


def _rename_duplicate_columns(df: pd.DataFrame, op: dict) -> tuple[pd.DataFrame, dict]:
    seen: dict[str, int] = {}
    new_cols = []
    for col in df.columns:
        norm = col.strip().lower()
        if norm in seen:
            seen[norm] += 1
            new_cols.append(f"{col}_{seen[norm]}")
        else:
            seen[norm] = 0
            new_cols.append(col)
    renamed = sum(1 for a, b in zip(df.columns, new_cols) if a != b)
    df.columns = new_cols
    return df, {"rows_affected": len(df), "detail": f"Renamed {renamed} duplicate column(s)."}


def _flag_outliers(df: pd.DataFrame, op: dict) -> tuple[pd.DataFrame, dict]:
    """
    Clip outliers instead of creating an extra flag column.
    This keeps the dataset shape unchanged while improving data quality.
    """

    col = op["column"]

    if col not in df.columns:
        return df, {
            "rows_affected": 0,
            "detail": f"Column '{col}' not found."
        }

    if not pd.api.types.is_numeric_dtype(df[col]):
        return df, {
            "rows_affected": 0,
            "detail": f"'{col}' is not numeric."
        }

    s = df[col].dropna()

    if len(s) < 5:
        return df, {
            "rows_affected": 0,
            "detail": "Not enough data."
        }

    q1 = s.quantile(0.25)
    q3 = s.quantile(0.75)

    iqr = q3 - q1

    lower = float(q1 - 1.5 * iqr)
    upper = float(q3 + 1.5 * iqr)

    mask = (df[col] < lower) | (df[col] > upper)

    affected = int(mask.sum())

    df.loc[df[col] < lower, col] = lower
    df.loc[df[col] > upper, col] = upper

    return df, {
        "rows_affected": affected,
        "detail": f"Clipped {affected} outliers in '{col}'."
    }


def _flag_invalid_emails(df: pd.DataFrame, op: dict) -> tuple[pd.DataFrame, dict]:
    col = op["column"]
    if col not in df.columns:
        return df, {"rows_affected": 0, "detail": f"Column '{col}' not found."}
    EMAIL_RE = re.compile(r"^[^@\s]+@[^@\s]+\.[^@\s]+$")
    flag_col = f"{col}_valid_email"
    df[flag_col] = df[col].astype(str).str.match(EMAIL_RE)
    invalid = int((~df[flag_col] & df[col].notna()).sum())
    return df, {"rows_affected": invalid, "detail": f"Flagged {invalid} invalid emails in '{col}'."}


def _remove_special_characters(df: pd.DataFrame, op: dict):

    cols = op.get("columns") or list(df.select_dtypes(include="object").columns)

    pattern = op.get("pattern", r"[^\w\s\.,\-]")

    affected_rows = set()

    for col in cols:

        if col not in df.columns:
            continue

        before = df[col].astype(str)

        after = before.str.replace(pattern, "", regex=True)

        changed = before != after

        affected_rows.update(df.index[changed])

        df[col] = after.replace("nan", np.nan)

    return df, {
        "rows_affected": len(affected_rows),
        "detail": f"Removed special characters from {len(cols)} column(s).",
    }

def _normalize_categories(df: pd.DataFrame, op: dict) -> tuple[pd.DataFrame, dict]:
    """Replace known aliases with a canonical value."""
    col = op["column"]
    mapping: dict[str, str] = op.get("mapping", {})
    if col not in df.columns or not mapping:
        return df, {"rows_affected": 0, "detail": "No mapping provided."}
    before = df[col].copy()
    df[col] = df[col].replace(mapping)
    changed = int((before != df[col]).sum())
    return df, {"rows_affected": changed, "detail": f"Normalised {changed} category values in '{col}'."}


def _optimize_memory(df: pd.DataFrame, _op: dict) -> tuple[pd.DataFrame, dict]:
    """
    Reduce dataframe memory usage by downcasting numeric types
    and converting suitable object columns to category.
    """

    before = df.memory_usage(deep=True).sum()

    for col in df.columns:

        # Integer
        if pd.api.types.is_integer_dtype(df[col]):
            df[col] = pd.to_numeric(df[col], downcast="integer")

        # Float
        elif pd.api.types.is_float_dtype(df[col]):
            df[col] = pd.to_numeric(df[col], downcast="float")

        # Object -> Category
        elif df[col].dtype == "object":

            unique_ratio = df[col].nunique(dropna=False) / max(len(df), 1)

            if unique_ratio < 0.5:
                df[col] = df[col].astype("category")

    after = df.memory_usage(deep=True).sum()

    saved_kb = round((before - after) / 1024, 2)

    return df, {
        "rows_affected": len(df),
        "detail": f"Optimized memory usage (saved {saved_kb} KB).",
    }

# ─── Dispatcher ───────────────────────────────────────────────────────────────

_HANDLERS: dict[str, Any] = {
    "remove_duplicates":        _remove_duplicates,
    "remove_empty_rows":        _remove_empty_rows,
    "remove_empty_columns":     _remove_empty_columns,
    "remove_constant_columns":  _remove_constant_columns,
    "trim_whitespace":          _trim_whitespace,
    "fill_missing":             _fill_missing,
    "standardize_case":         _standardize_case,
    "convert_type":             _convert_type,
    "rename_duplicate_columns": _rename_duplicate_columns,
    "flag_outliers":            _flag_outliers,
    "flag_invalid_emails":      _flag_invalid_emails,
    "remove_special_characters":_remove_special_characters,
    "normalize_categories":     _normalize_categories,
    "optimize_memory": _optimize_memory,
}


def apply_operations(df: pd.DataFrame, operations: list[dict]) -> CleanResult:
    """
    Apply a list of operations sequentially.
    Each operation dict must have a `type` key.
    Returns a CleanResult with the final DataFrame and full audit log.
    """
    log: list[dict] = []
    original_shape = df.shape

    for op in operations:
        op_type: str = op["type"]
        handler = _HANDLERS.get(op_type)
        if not handler:
            log.append({
                "operation": op_type,
                "rows_affected": 0,
                "detail": f"Unknown operation type: '{op_type}'. Skipped.",
                "status": "skipped",
            })
            continue
        try:
            df, entry = handler(df, op)
            log.append({
                "operation": op_type,
                "column": op.get("column") or op.get("columns"),
                "rows_affected": entry["rows_affected"],
                "detail": entry["detail"],
                "status": "ok",
            })
        except Exception as exc:
            log.append({
                "operation": op_type,
                "rows_affected": 0,
                "detail": f"Error: {exc}",
                "status": "error",
            })

    return CleanResult(df=df, log=log)


def diff_summary(original: pd.DataFrame, cleaned: pd.DataFrame) -> dict:
    """High-level before/after statistics."""
    return {
        "original_rows":    len(original),
        "cleaned_rows":     len(cleaned),
        "rows_removed":     len(original) - len(cleaned),
        "original_columns": len(original.columns),
        "cleaned_columns":  len(cleaned.columns),
        "columns_removed":  max(0, len(original.columns) - len(cleaned.columns)),
        "original_missing": int(original.isnull().sum().sum()),
        "cleaned_missing":  int(cleaned.isnull().sum().sum()),
        "missing_fixed":    max(0, int(original.isnull().sum().sum()) - int(cleaned.isnull().sum().sum())),
        "original_memory_kb": round(original.memory_usage(deep=True).sum() / 1024, 2),
        "cleaned_memory_kb":  round(cleaned.memory_usage(deep=True).sum() / 1024, 2),
    }