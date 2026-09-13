"""读取 Olist 原始 CSV。"""
from __future__ import annotations

import pandas as pd

from .paths import RAW


def load_raw() -> dict[str, pd.DataFrame]:
    files = {
        "customers": "olist_customers_dataset.csv",
        "orders": "olist_orders_dataset.csv",
        "items": "olist_order_items_dataset.csv",
        "payments": "olist_order_payments_dataset.csv",
        "reviews": "olist_order_reviews_dataset.csv",
        "products": "olist_products_dataset.csv",
        "sellers": "olist_sellers_dataset.csv",
        "translation": "product_category_name_translation.csv",
    }
    dfs = {k: pd.read_csv(RAW / v) for k, v in files.items()}
    for col in [
        "order_purchase_timestamp",
        "order_approved_at",
        "order_delivered_carrier_date",
        "order_delivered_customer_date",
        "order_estimated_delivery_date",
    ]:
        dfs["orders"][col] = pd.to_datetime(dfs["orders"][col], errors="coerce")
    return dfs
