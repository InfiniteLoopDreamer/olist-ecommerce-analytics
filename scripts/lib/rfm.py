"""RFM 分层（customer_unique_id）。"""
from __future__ import annotations

import numpy as np
import pandas as pd


def rfm_segment(row: pd.Series) -> str:
    r, f, m = int(row["R"]), int(row["F"]), int(row["M"])
    if r >= 4 and f >= 2 and m >= 4:
        return "Champions"
    if r >= 3 and f >= 2 and m >= 3:
        return "Loyal"
    if r >= 4 and f == 1 and m >= 3:
        return "Promising"
    if r >= 4 and f == 1:
        return "New / Recent"
    if r <= 2 and f >= 2:
        return "At Risk"
    if r <= 2 and f == 1 and m >= 3:
        return "Hibernating High-Value"
    if r <= 2:
        return "Lost / One-time"
    return "Need Attention"


def build_rfm(delivered: pd.DataFrame) -> tuple[pd.DataFrame, pd.DataFrame]:
    """返回 (分层汇总 seg, 频次分布 freq_dist)。"""
    snapshot = delivered["order_purchase_timestamp"].max() + pd.Timedelta(days=1)
    rfm = delivered.groupby("customer_unique_id").agg(
        recency_days=("order_purchase_timestamp", lambda s: (snapshot - s.max()).days),
        frequency=("order_id", "nunique"),
        monetary=("gmv", "sum"),
    )
    rfm["R"] = pd.qcut(rfm["recency_days"], 5, labels=[5, 4, 3, 2, 1]).astype(int)
    rfm["F"] = pd.cut(
        rfm["frequency"],
        bins=[0, 1, 2, 3, 5, np.inf],
        labels=[1, 2, 3, 4, 5],
    ).astype(int)
    rfm["M"] = pd.qcut(rfm["monetary"].rank(method="first"), 5, labels=[1, 2, 3, 4, 5]).astype(int)
    rfm["segment"] = rfm.apply(rfm_segment, axis=1)

    seg = (
        rfm.groupby("segment", as_index=False)
        .agg(
            customers=("frequency", "count"),
            gmv=("monetary", "sum"),
            avg_orders=("frequency", "mean"),
            avg_monetary=("monetary", "mean"),
        )
        .sort_values("gmv", ascending=False)
    )
    seg["customer_share"] = (seg["customers"] / len(rfm)).round(4)
    seg["gmv_share"] = (seg["gmv"] / seg["gmv"].sum()).round(4)
    seg["gmv"] = seg["gmv"].round(2)
    seg["avg_orders"] = seg["avg_orders"].round(2)
    seg["avg_monetary"] = seg["avg_monetary"].round(2)

    freq_dist = (
        rfm["frequency"]
        .clip(upper=5)
        .value_counts()
        .rename_axis("orders")
        .reset_index(name="customers")
        .sort_values("orders")
    )
    freq_dist["orders"] = freq_dist["orders"].astype(int).astype(str).replace({"5": "5+"})
    return seg, freq_dist
