# SQL 脚本说明

口径：客户用 `customer_unique_id`；营收类指标建议只统计 `delivered`。

| 文件 | 内容 |
|------|------|
| 01_repeat.sql | 复购率 |
| 02_state_gmv.sql | 州级成交额与集中度 |
| 03_delivery_review.sql | 超时 vs 评分 |
| 04_rfm.sql | RFM（窗口函数） |
| 05_cohort.sql | 月度同期群留存 |
| 06_seller_pareto.sql | 卖家帕累托 |

`core_metrics.sql` 为合集对照，可只看分文件。
