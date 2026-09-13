"""汇总看板所需的全部洞察。"""
from __future__ import annotations

import pandas as pd

from .cohort import build_cohort_retention
from .rfm import build_rfm


def build_insights(dfs: dict[str, pd.DataFrame]) -> dict:
    customers = dfs["customers"]
    orders = dfs["orders"]
    items = dfs["items"]
    payments = dfs["payments"]
    reviews = dfs["reviews"]
    products = dfs["products"].merge(dfs["translation"], on="product_category_name", how="left")
    sellers = dfs["sellers"]

    order_value = items.groupby("order_id", as_index=False).agg(
        items_price=("price", "sum"),
        freight=("freight_value", "sum"),
        n_items=("order_item_id", "count"),
    )
    order_value["gmv"] = order_value["items_price"]

    pay_agg = payments.groupby("order_id", as_index=False).agg(
        payment_value=("payment_value", "sum"),
        installments=("payment_installments", "max"),
        payment_type=("payment_type", lambda s: s.mode().iloc[0] if len(s) else "unknown"),
    )
    review_agg = (
        reviews.sort_values("review_creation_date")
        .groupby("order_id", as_index=False)
        .agg(review_score=("review_score", "mean"))
    )

    base = (
        orders.merge(customers, on="customer_id", how="left")
        .merge(order_value, on="order_id", how="left")
        .merge(pay_agg, on="order_id", how="left")
        .merge(review_agg, on="order_id", how="left")
    )

    delivered = base[base["order_status"] == "delivered"].copy()
    delivered = delivered.dropna(subset=["gmv"])
    delivered["purchase_month"] = delivered["order_purchase_timestamp"].dt.to_period("M").astype(str)
    delivered["delivery_days"] = (
        delivered["order_delivered_customer_date"] - delivered["order_purchase_timestamp"]
    ).dt.total_seconds() / 86400
    delivered["delay_days"] = (
        delivered["order_delivered_customer_date"] - delivered["order_estimated_delivery_date"]
    ).dt.total_seconds() / 86400
    delivered["is_late"] = delivered["delay_days"] > 0

    n_orders = int(len(delivered))
    n_customers = int(delivered["customer_unique_id"].nunique())
    gmv = float(delivered["gmv"].sum())
    aov = float(delivered["gmv"].mean())
    repeat_rate = float((delivered.groupby("customer_unique_id")["order_id"].nunique() > 1).mean())
    avg_review = float(delivered["review_score"].mean())
    late_rate = float(delivered["is_late"].mean())

    kpis = {
        "orders": n_orders,
        "customers": n_customers,
        "gmv": round(gmv, 2),
        "aov": round(aov, 2),
        "repeat_rate": round(repeat_rate, 4),
        "avg_review": round(avg_review, 2),
        "on_time_rate": round(1 - late_rate, 4),
        "late_rate": round(late_rate, 4),
        "avg_delivery_days": round(float(delivered["delivery_days"].mean()), 1),
        "date_start": str(delivered["order_purchase_timestamp"].min().date()),
        "date_end": str(delivered["order_purchase_timestamp"].max().date()),
        "total_orders_all_status": int(len(orders)),
        "sellers": int(sellers["seller_id"].nunique()),
        "products": int(products["product_id"].nunique()),
    }

    monthly = (
        delivered.groupby("purchase_month", as_index=False)
        .agg(
            orders=("order_id", "nunique"),
            gmv=("gmv", "sum"),
            customers=("customer_unique_id", "nunique"),
            aov=("gmv", "mean"),
            avg_review=("review_score", "mean"),
            late_rate=("is_late", "mean"),
        )
        .sort_values("purchase_month")
    )
    monthly["gmv"] = monthly["gmv"].round(2)
    monthly["aov"] = monthly["aov"].round(2)
    monthly["avg_review"] = monthly["avg_review"].round(2)
    monthly["late_rate"] = monthly["late_rate"].round(4)

    by_state = (
        delivered.groupby("customer_state", as_index=False)
        .agg(orders=("order_id", "nunique"), gmv=("gmv", "sum"), avg_review=("review_score", "mean"))
        .sort_values("gmv", ascending=False)
    )
    by_state["gmv_share"] = (by_state["gmv"] / gmv).round(4)
    by_state["gmv"] = by_state["gmv"].round(2)
    by_state["avg_review"] = by_state["avg_review"].round(2)

    delivered_ids = set(delivered["order_id"])
    item_cat = items.merge(
        products[["product_id", "product_category_name_english", "product_category_name"]],
        on="product_id",
        how="left",
    )
    item_cat["category"] = (
        item_cat["product_category_name_english"]
        .fillna(item_cat["product_category_name"])
        .fillna("unknown")
    )
    item_cat = item_cat[item_cat["order_id"].isin(delivered_ids)]
    by_category = (
        item_cat.groupby("category", as_index=False)
        .agg(orders=("order_id", "nunique"), gmv=("price", "sum"), items=("order_item_id", "count"))
        .sort_values("gmv", ascending=False)
        .head(15)
    )
    by_category["gmv_share"] = (by_category["gmv"] / gmv).round(4)
    by_category["gmv"] = by_category["gmv"].round(2)

    by_payment = (
        delivered.groupby("payment_type", as_index=False)
        .agg(orders=("order_id", "nunique"), gmv=("gmv", "sum"), aov=("gmv", "mean"))
        .sort_values("gmv", ascending=False)
    )
    by_payment["gmv"] = by_payment["gmv"].round(2)
    by_payment["aov"] = by_payment["aov"].round(2)

    installment_bins = pd.cut(
        delivered["installments"].fillna(1),
        bins=[0, 1, 3, 6, 12, 24],
        labels=["1", "2-3", "4-6", "7-12", "13+"],
    )
    by_installment = (
        delivered.assign(installment_group=installment_bins)
        .groupby("installment_group", observed=True, as_index=False)
        .agg(orders=("order_id", "nunique"), aov=("gmv", "mean"))
    )
    by_installment["aov"] = by_installment["aov"].round(2)
    by_installment["installment_group"] = by_installment["installment_group"].astype(str)

    delay_review = (
        delivered.dropna(subset=["review_score", "is_late"])
        .groupby("is_late", as_index=False)
        .agg(
            orders=("order_id", "nunique"),
            avg_review=("review_score", "mean"),
            share_1star=("review_score", lambda s: (s <= 1.5).mean()),
            share_5star=("review_score", lambda s: (s >= 4.5).mean()),
        )
    )
    delay_review["label"] = delay_review["is_late"].map({False: "按时/提前", True: "超时"})
    delay_review["avg_review"] = delay_review["avg_review"].round(2)
    delay_review["share_1star"] = delay_review["share_1star"].round(4)
    delay_review["share_5star"] = delay_review["share_5star"].round(4)

    score_dist = (
        delivered.dropna(subset=["review_score"])
        .assign(score=lambda d: d["review_score"].round().astype(int))
        .groupby("score", as_index=False)
        .agg(orders=("order_id", "nunique"))
        .sort_values("score")
    )

    state_delivery = (
        delivered.groupby("customer_state", as_index=False)
        .agg(
            orders=("order_id", "nunique"),
            late_rate=("is_late", "mean"),
            avg_delivery_days=("delivery_days", "mean"),
            avg_review=("review_score", "mean"),
        )
        .sort_values("orders", ascending=False)
        .head(12)
    )
    state_delivery["late_rate"] = state_delivery["late_rate"].round(4)
    state_delivery["avg_delivery_days"] = state_delivery["avg_delivery_days"].round(1)
    state_delivery["avg_review"] = state_delivery["avg_review"].round(2)

    seg, freq_dist = build_rfm(delivered)
    cohort_retention = build_cohort_retention(delivered)
    avg_m1 = float(cohort_retention["avg_m1_retention"])

    data_quality = {
        "tables": [
            {"name": "客户表", "rows": int(len(customers))},
            {"name": "订单表", "rows": int(len(orders))},
            {"name": "订单明细", "rows": int(len(items))},
            {"name": "支付表", "rows": int(len(payments))},
            {"name": "评价表", "rows": int(len(reviews))},
            {"name": "商品表", "rows": int(len(products))},
            {"name": "卖家表", "rows": int(len(sellers))},
        ],
        "delivered_share": round(float((orders["order_status"] == "delivered").mean()), 4),
        "id_trap": {
            "customer_id_count": int(customers["customer_id"].nunique()),
            "customer_unique_id_count": int(customers["customer_unique_id"].nunique()),
            "note": "Olist 为每笔订单生成新的 customer_id；同一自然人对应 customer_unique_id。客户级指标均按 customer_unique_id 聚合。",
        },
        "rules": [
            "成交额 / 客单价 / RFM 仅统计 order_status = delivered",
            "客户聚合使用 customer_unique_id",
            "超时定义：实际签收时间晚于承诺送达时间",
            "RFM 的 F 按订单次数分箱（数据中频次高度集中在 1）",
        ],
    }

    seller_gmv = (
        items[items["order_id"].isin(delivered_ids)]
        .groupby("seller_id", as_index=False)
        .agg(gmv=("price", "sum"), orders=("order_id", "nunique"))
        .sort_values("gmv", ascending=False)
    )
    seller_gmv["cum_share"] = (seller_gmv["gmv"].cumsum() / seller_gmv["gmv"].sum()).round(4)
    top_n_for_80 = int((seller_gmv["cum_share"] <= 0.8).sum()) + 1
    seller_summary = {
        "total_sellers": int(len(seller_gmv)),
        "top_sellers_for_80pct_gmv": top_n_for_80,
        "top_10_gmv_share": round(float(seller_gmv.head(10)["gmv"].sum() / seller_gmv["gmv"].sum()), 4),
        "top10": seller_gmv.head(10)
        .assign(gmv=lambda d: d["gmv"].round(2), rank=lambda d: range(1, len(d) + 1))[
            ["rank", "seller_id", "orders", "gmv", "cum_share"]
        ]
        .to_dict(orient="records"),
    }

    status = orders["order_status"].value_counts().rename_axis("status").reset_index(name="count")

    late_1star = (
        float(delay_review.loc[delay_review["is_late"] == True, "share_1star"].iloc[0])
        if (delay_review["is_late"] == True).any()
        else 0
    )
    ontime_1star = (
        float(delay_review.loc[delay_review["is_late"] == False, "share_1star"].iloc[0])
        if (delay_review["is_late"] == False).any()
        else 0
    )
    top_state = by_state.iloc[0]
    top5_cat_share = float(by_category.head(5)["gmv_share"].sum())

    findings = [
        {
            "title": "复购率",
            "metric": f"{repeat_rate:.1%}",
            "detail": f"在 {n_customers:,} 名真实用户（customer_unique_id）中，有过 ≥2 笔已送达订单的用户约占 {repeat_rate:.1%}。",
        },
        {
            "title": "同期群次月留存",
            "metric": f"{avg_m1:.2%}",
            "detail": f"样本量 ≥500 的月度队列，平均次月留存约为 {avg_m1:.2%}（当月留存按定义均为 100%）。",
        },
        {
            "title": "超时与一星评价",
            "metric": f"{late_1star:.1%} / {ontime_1star:.1%}",
            "detail": f"超时订单一星占比约 {late_1star:.1%}；按时/提前送达订单一星占比约 {ontime_1star:.1%}。",
        },
        {
            "title": "州级成交集中度",
            "metric": f"{top_state['customer_state']} {top_state['gmv_share']:.1%}",
            "detail": f"成交额最高的州为 {top_state['customer_state']}，约占全部已送达成交额的 {top_state['gmv_share']:.1%}。",
        },
        {
            "title": "品类与卖家集中度",
            "metric": f"Top5 {top5_cat_share:.1%}",
            "detail": f"成交额前 5 品类合计约占 {top5_cat_share:.1%}；按成交额累计，约 {top_n_for_80} 名卖家贡献 80% 成交额（卖家总数 {len(seller_gmv):,}）。",
        },
    ]

    return {
        "meta": {
            "project": "Olist 巴西电商经营分析",
            "source": "Brazilian E-Commerce Public Dataset by Olist (Kaggle)",
            "license": "CC BY-NC-SA 4.0",
            "generated_note": "指标基于已送达订单；客户标识使用 customer_unique_id。",
        },
        "kpis": {**kpis, "avg_m1_retention": round(avg_m1, 4)},
        "findings": findings,
        "recommendations": [],
        "methodology": [
            {
                "q": "成交额如何统计？",
                "a": "仅统计 order_status = delivered 的订单商品金额合计（不含运费）。",
            },
            {
                "q": "用户如何识别？",
                "a": "聚合键使用 customer_unique_id；customer_id 随订单重置，不代表同一自然人。",
            },
            {
                "q": "超时如何定义？",
                "a": "实际签收时间晚于承诺送达时间记为超时。",
            },
        ],
        "data_quality": data_quality,
        "cohort_retention": cohort_retention,
        "monthly": monthly.to_dict(orient="records"),
        "by_state": by_state.head(15).to_dict(orient="records"),
        "by_category": by_category.to_dict(orient="records"),
        "by_payment": by_payment.to_dict(orient="records"),
        "by_installment": by_installment.to_dict(orient="records"),
        "delay_review": delay_review[
            ["label", "orders", "avg_review", "share_1star", "share_5star"]
        ].to_dict(orient="records"),
        "score_dist": score_dist.to_dict(orient="records"),
        "state_delivery": state_delivery.to_dict(orient="records"),
        "rfm_segments": seg.to_dict(orient="records"),
        "freq_dist": freq_dist.to_dict(orient="records"),
        "seller_summary": seller_summary,
        "order_status": status.to_dict(orient="records"),
    }
