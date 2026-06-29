# backend/app/services/analytics.py
# Generates chart-ready data for the frontend analytics panel.
# All outputs are JSON-serialisable plain dicts / lists.

from __future__ import annotations
import pandas as pd
import numpy as np
from typing import Any


def _safe_float(v: Any) -> float | None:
    try:
        f = float(v)
        return None if (np.isnan(f) or np.isinf(f)) else round(f, 4)
    except Exception:
        return None


# ─── 1. Column histograms ─────────────────────────────────────────────────────

def column_distributions(df: pd.DataFrame, max_cols: int = 12) -> list[dict]:
    """
    For numeric columns  → histogram buckets (10 bins).
    For string columns   → top-10 value frequency bar.
    Returns up to max_cols columns.
    """
    results = []
    cols = list(df.columns)[:max_cols]

    for col in cols:
        s = df[col].dropna()
        if len(s) == 0:
            continue

        if pd.api.types.is_numeric_dtype(s):
            counts, edges = np.histogram(s, bins=10)
            results.append({
                "column": col,
                "type": "histogram",
                "data": [
                    {
                        "label": f"{_safe_float(edges[i]):.3g}–{_safe_float(edges[i+1]):.3g}",
                        "count": int(counts[i]),
                    }
                    for i in range(len(counts))
                ],
                "stats": {
                    "min":    _safe_float(s.min()),
                    "max":    _safe_float(s.max()),
                    "mean":   _safe_float(s.mean()),
                    "median": _safe_float(s.median()),
                    "std":    _safe_float(s.std()),
                },
            })
        else:
            top = s.astype(str).value_counts().head(10)
            results.append({
                "column": col,
                "type": "bar",
                "data": [
                    {"label": str(k)[:30], "count": int(v)}
                    for k, v in top.items()
                ],
                "stats": {
                    "unique": int(s.nunique()),
                    "top":    str(top.index[0]) if len(top) else "",
                    "top_count": int(top.iloc[0]) if len(top) else 0,
                },
            })

    return results


# ─── 2. Missing values heatmap ────────────────────────────────────────────────

def missing_heatmap(df: pd.DataFrame, max_rows: int = 60, max_cols: int = 30) -> dict:
    """
    Returns a sampled grid of {row, col, missing: bool} for a visual heatmap,
    plus per-column missing counts for a bar chart.
    """
    sample = df.iloc[:max_rows, :max_cols]
    cells = []
    for r in range(len(sample)):
        for c, col in enumerate(sample.columns):
            if pd.isnull(sample.iloc[r, c]):
                cells.append({"row": r, "col": c})

    per_col = [
        {
            "column": col[:20],
            "missing": int(df[col].isnull().sum()),
            "pct": round(df[col].isnull().mean() * 100, 1),
        }
        for col in df.columns[:max_cols]
        if df[col].isnull().sum() > 0
    ]
    per_col.sort(key=lambda x: -x["missing"])

    return {
        "cells":    cells,
        "rows":     len(sample),
        "cols":     len(sample.columns),
        "col_names": [c[:20] for c in sample.columns],
        "per_col":  per_col,
    }


# ─── 3. Correlation matrix ────────────────────────────────────────────────────

def correlation_matrix(df: pd.DataFrame, max_cols: int = 12) -> dict:
    """
    Pearson correlation for numeric columns.
    Returns column names + flat list of {x, y, value} cells.
    """
    num_df = df.select_dtypes(include=[np.number]).iloc[:, :max_cols].dropna(axis=1, how="all")
    if num_df.shape[1] < 2:
        return {"columns": [], "cells": []}

    corr = num_df.corr(numeric_only=True)
    cols = list(corr.columns)
    cells = []
    for i, c1 in enumerate(cols):
        for j, c2 in enumerate(cols):
            v = _safe_float(corr.loc[c1, c2])
            cells.append({"x": i, "y": j, "value": v if v is not None else 0})

    return {"columns": cols, "cells": cells}


# ─── 4. Outlier summary ───────────────────────────────────────────────────────

def outlier_summary(df: pd.DataFrame) -> list[dict]:
    """IQR-based outlier count per numeric column."""
    results = []
    for col in df.select_dtypes(include=[np.number]).columns:
        s = df[col].dropna()
        if len(s) < 10:
            continue
        q1, q3 = s.quantile(0.25), s.quantile(0.75)
        iqr = q3 - q1
        if iqr == 0:
            continue
        n_out = int(((s < q1 - 1.5 * iqr) | (s > q3 + 1.5 * iqr)).sum())
        if n_out == 0:
            continue
        results.append({
            "column": col,
            "outliers": n_out,
            "pct": round(n_out / len(df) * 100, 1),
            "q1":  _safe_float(q1),
            "q3":  _safe_float(q3),
            "iqr": _safe_float(iqr),
            "lower": _safe_float(q1 - 1.5 * iqr),
            "upper": _safe_float(q3 + 1.5 * iqr),
        })
    results.sort(key=lambda x: -x["outliers"])
    return results


# ─── 5. Before / after quality comparison ────────────────────────────────────

def quality_comparison(original_profile: dict, cleaned_profile: dict) -> dict:

    before = original_profile
    after = cleaned_profile

    def metric(label, key, higher_is_better=False):
        before_value = before.get(key, 0)
        after_value = after.get(key, 0)

        if higher_is_better:
            improvement = round(after_value - before_value, 2)
        else:
            improvement = round(before_value - after_value, 2)

        return {
            "label": label,
            "before": before_value,
            "after": after_value,
            "improvement": improvement,
        }

    improvement = round(
        after.get("quality_score", 0)
        - before.get("quality_score", 0),
        1,
    )

    memory_saved = max(
        0,
        round(
            before.get("memory_kb", 0)
            - after.get("memory_kb", 0),
            2,
        )
    )

    return {

        "before_score": before.get("quality_score", 0),

        "after_score": after.get("quality_score", 0),

        "score_change": improvement,

        "summary": {

            "missing_fixed": max(
                0,
                before.get("missing_values", 0) - after.get("missing_values", 0),
            ),

            "duplicates_removed": max(
                0,
                before.get("duplicates", 0) - after.get("duplicates", 0),
            ),

            "memory_saved_kb":
                memory_saved,

            "rows_removed": max(
                0,
                before.get("rows", 0) - after.get("rows", 0),
            ),

            "quality_gain":
                improvement,

        },

        "metrics": [

            metric("Missing Values", "missing_values"),

            metric("Duplicate Rows", "duplicates"),

            {
                "label": "Memory (KB)",
                "before": before.get("memory_kb", 0),
                "after": after.get("memory_kb", 0),
                "improvement": memory_saved,
            },

            metric(
                "Completeness (%)",
                "completeness",
                higher_is_better=True,
            ),

        ],

    }


# ─── Master entry point ───────────────────────────────────────────────────────

def generate_analytics(df: pd.DataFrame) -> dict:
    return {
        "distributions": column_distributions(df),
        "missing":       missing_heatmap(df),
        "correlation":   correlation_matrix(df),
        "outliers":      outlier_summary(df),
    }