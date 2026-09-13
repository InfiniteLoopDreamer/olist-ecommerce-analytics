"""月度同期群留存（M0–M5）。"""
from __future__ import annotations

import pandas as pd


def build_cohort_retention(delivered: pd.DataFrame, min_cohort_size: int = 500) -> dict:
    first_month = delivered.groupby("customer_unique_id")["purchase_month"].min().rename("cohort")
    cohort_df = delivered[["customer_unique_id", "purchase_month"]].merge(
        first_month, on="customer_unique_id", how="left"
    )
    cohort_df["cohort_p"] = pd.PeriodIndex(cohort_df["cohort"], freq="M")
    cohort_df["order_p"] = pd.PeriodIndex(cohort_df["purchase_month"], freq="M")
    cohort_df["period"] = (cohort_df["order_p"] - cohort_df["cohort_p"]).apply(lambda x: x.n)

    cohort_sizes = cohort_df.groupby("cohort")["customer_unique_id"].nunique().rename("size")
    valid_cohorts = cohort_sizes[cohort_sizes >= min_cohort_size].index
    cohort_df = cohort_df[
        cohort_df["cohort"].isin(valid_cohorts) & (cohort_df["period"].between(0, 5))
    ]

    retained = (
        cohort_df.groupby(["cohort", "period"])["customer_unique_id"]
        .nunique()
        .rename("active")
        .reset_index()
    )
    retained = retained.merge(cohort_sizes.reset_index(), on="cohort", how="left")
    retained["rate"] = (retained["active"] / retained["size"]).round(4)

    pivot = retained.pivot(index="cohort", columns="period", values="rate").fillna(0)
    for p in range(6):
        if p not in pivot.columns:
            pivot[p] = 0.0
    pivot = pivot[[0, 1, 2, 3, 4, 5]].sort_index()
    avg_m1 = float(pivot[1].mean()) if len(pivot) else 0.0

    return {
        "cohorts": pivot.index.tolist(),
        "periods": ["当月", "第1月", "第2月", "第3月", "第4月", "第5月"],
        "matrix": [[round(float(v), 4) for v in row] for row in pivot.values.tolist()],
        "sizes": [int(cohort_sizes.loc[c]) for c in pivot.index],
        "avg_m1_retention": round(avg_m1, 4),
    }
