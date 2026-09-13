-- Olist 巴西电商经营分析 · 面试向核心 SQL
-- 口径：客户用 customer_unique_id；营收类指标建议只统计 delivered
-- 表名按你本地建表命名调整（orders / customers / order_items / order_reviews）

/* ========== 1. 复购率（先证明会用对客户主键） ========== */
WITH cust_orders AS (
  SELECT
    c.customer_unique_id,
    COUNT(DISTINCT o.order_id) AS order_cnt
  FROM orders o
  JOIN customers c ON o.customer_id = c.customer_id
  WHERE o.order_status = 'delivered'
  GROUP BY c.customer_unique_id
)
SELECT
  COUNT(*) AS customers,
  SUM(CASE WHEN order_cnt > 1 THEN 1 ELSE 0 END) AS repeat_customers,
  ROUND(AVG(CASE WHEN order_cnt > 1 THEN 1.0 ELSE 0.0 END), 4) AS repeat_rate
FROM cust_orders;

/* ========== 2. 州级成交额与集中度 ========== */
WITH state_gmv AS (
  SELECT
    c.customer_state,
    COUNT(DISTINCT o.order_id) AS orders,
    SUM(i.price) AS gmv
  FROM orders o
  JOIN customers c ON o.customer_id = c.customer_id
  JOIN order_items i ON o.order_id = i.order_id
  WHERE o.order_status = 'delivered'
  GROUP BY c.customer_state
)
SELECT
  customer_state,
  orders,
  ROUND(gmv, 2) AS gmv,
  ROUND(gmv / SUM(gmv) OVER (), 4) AS gmv_share,
  ROUND(SUM(gmv) OVER (ORDER BY gmv DESC) / SUM(gmv) OVER (), 4) AS cum_share
FROM state_gmv
ORDER BY gmv DESC;

/* ========== 3. 超时 vs 评分（履约杠杆） ========== */
SELECT
  CASE
    WHEN o.order_delivered_customer_date > o.order_estimated_delivery_date THEN '超时'
    ELSE '按时/提前'
  END AS delivery_flag,
  COUNT(*) AS orders,
  ROUND(AVG(r.review_score), 2) AS avg_review,
  ROUND(AVG(CASE WHEN r.review_score <= 1 THEN 1.0 ELSE 0.0 END), 4) AS one_star_rate
FROM orders o
LEFT JOIN order_reviews r ON o.order_id = r.order_id
WHERE o.order_status = 'delivered'
  AND o.order_delivered_customer_date IS NOT NULL
GROUP BY 1;

/* ========== 4. RFM 分层（窗口函数 NTILE） ========== */
WITH base AS (
  SELECT
    c.customer_unique_id,
    MAX(o.order_purchase_timestamp) AS last_order_at,
    COUNT(DISTINCT o.order_id) AS frequency,
    SUM(i.price) AS monetary
  FROM orders o
  JOIN customers c ON o.customer_id = c.customer_id
  JOIN order_items i ON o.order_id = i.order_id
  WHERE o.order_status = 'delivered'
  GROUP BY c.customer_unique_id
),
scored AS (
  SELECT
    customer_unique_id,
    frequency,
    monetary,
    JULIANDAY((SELECT MAX(last_order_at) FROM base)) - JULIANDAY(last_order_at) AS recency_days,
    NTILE(5) OVER (ORDER BY JULIANDAY((SELECT MAX(last_order_at) FROM base)) - JULIANDAY(last_order_at) DESC) AS r_score,
    CASE
      WHEN frequency = 1 THEN 1
      WHEN frequency = 2 THEN 2
      WHEN frequency = 3 THEN 3
      WHEN frequency <= 5 THEN 4
      ELSE 5
    END AS f_score,
    NTILE(5) OVER (ORDER BY monetary) AS m_score
  FROM base
)
SELECT
  r_score,
  f_score,
  m_score,
  COUNT(*) AS customers,
  ROUND(AVG(monetary), 2) AS avg_monetary
FROM scored
GROUP BY 1, 2, 3
ORDER BY 1 DESC, 2 DESC, 3 DESC;

/* ========== 5. 月度同期群次月留存（面试加分） ========== */
WITH first_order AS (
  SELECT
    c.customer_unique_id,
    DATE(MIN(o.order_purchase_timestamp), 'start of month') AS cohort_month
  FROM orders o
  JOIN customers c ON o.customer_id = c.customer_id
  WHERE o.order_status = 'delivered'
  GROUP BY c.customer_unique_id
),
activity AS (
  SELECT DISTINCT
    c.customer_unique_id,
    DATE(o.order_purchase_timestamp, 'start of month') AS activity_month
  FROM orders o
  JOIN customers c ON o.customer_id = c.customer_id
  WHERE o.order_status = 'delivered'
),
labeled AS (
  SELECT
    f.cohort_month,
    f.customer_unique_id,
    CAST((JULIANDAY(a.activity_month) - JULIANDAY(f.cohort_month)) / 30 AS INT) AS period_num
  FROM first_order f
  JOIN activity a ON f.customer_unique_id = a.customer_unique_id
),
cohort_size AS (
  SELECT cohort_month, COUNT(*) AS size
  FROM first_order
  GROUP BY cohort_month
  HAVING COUNT(*) >= 500
)
SELECT
  l.cohort_month,
  l.period_num,
  COUNT(DISTINCT l.customer_unique_id) AS active_customers,
  cs.size AS cohort_size,
  ROUND(1.0 * COUNT(DISTINCT l.customer_unique_id) / cs.size, 4) AS retention_rate
FROM labeled l
JOIN cohort_size cs ON l.cohort_month = cs.cohort_month
WHERE l.period_num BETWEEN 0 AND 5
GROUP BY l.cohort_month, l.period_num, cs.size
ORDER BY l.cohort_month, l.period_num;

/* ========== 6. 卖家帕累托：多少卖家贡献 80% 成交额 ========== */
WITH seller_gmv AS (
  SELECT
    i.seller_id,
    SUM(i.price) AS gmv
  FROM order_items i
  JOIN orders o ON i.order_id = o.order_id
  WHERE o.order_status = 'delivered'
  GROUP BY i.seller_id
),
ranked AS (
  SELECT
    seller_id,
    gmv,
    SUM(gmv) OVER (ORDER BY gmv DESC) AS cum_gmv,
    SUM(gmv) OVER () AS total_gmv
  FROM seller_gmv
)
SELECT
  COUNT(*) AS sellers_for_80pct
FROM ranked
WHERE cum_gmv / total_gmv <= 0.80;
