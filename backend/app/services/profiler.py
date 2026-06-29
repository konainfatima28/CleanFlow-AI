import pandas as pd
import numpy as np

def profile_dataframe(df: pd.DataFrame) -> dict:
    rows = len(df)
    cols = len(df.columns)
    total_cells = max(rows * cols, 1)

    missing = int(df.isnull().sum().sum())
    duplicates = int(df.duplicated().sum())
    memory_kb = round(df.memory_usage(deep=True).sum() / 1024, 2)

    numeric_cols = list(df.select_dtypes(include=np.number).columns)
    categorical_cols = list(df.select_dtypes(exclude=np.number).columns)

    columns = []

    completeness_sum = 0

    for col in df.columns:
        s = df[col]

        col_missing = int(s.isnull().sum())
        completeness = round((1 - col_missing / max(len(s), 1)) * 100, 2)

        completeness_sum += completeness

        info = {
            "name": col,
            "dtype": str(s.dtype),
            "missing": col_missing,
            "missing_pct": round(col_missing / max(len(s), 1) * 100, 2),
            "unique": int(s.nunique(dropna=True)),
            "completeness": completeness,
        }

        if pd.api.types.is_numeric_dtype(s):

            info.update({
                "min": float(s.min()) if s.notna().any() else None,
                "max": float(s.max()) if s.notna().any() else None,
                "mean": round(float(s.mean()), 4) if s.notna().any() else None,
                "median": round(float(s.median()), 4) if s.notna().any() else None,
                "std": round(float(s.std()), 4) if s.notna().any() else None,
            })

        else:

            vc = s.dropna().astype(str).value_counts().head(5)

            info["top_values"] = {
                str(k): int(v)
                for k, v in vc.items()
            }

        columns.append(info)

    # -------------------------
    # Better Quality Score
    # -------------------------

    missing_ratio = missing / total_cells
    duplicate_ratio = duplicates / max(rows, 1)

    completeness_score = completeness_sum / max(cols, 1)

    missing_score = max(0, 100 - missing_ratio * 100)

    duplicate_score = max(0, 100 - duplicate_ratio * 100)

    dtype_score = 100

    memory_score = 100

    quality_score = round(
        (
            missing_score * 0.35
            + duplicate_score * 0.20
            + completeness_score * 0.25
            + dtype_score * 0.10
            + memory_score * 0.10
        )
    )

    quality_score = max(0, min(100, quality_score))

    return {
        "rows": rows,
        "columns": cols,
        "missing_values": missing,
        "missing_pct": round(missing_ratio * 100, 2),
        "duplicates": duplicates,
        "memory_kb": memory_kb,

        "quality_score": quality_score,

        "numeric_columns": len(numeric_cols),
        "categorical_columns": len(categorical_cols),

        "completeness": round(completeness_score, 2),

        "columns_detail": columns,
    }