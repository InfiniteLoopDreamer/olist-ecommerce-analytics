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
