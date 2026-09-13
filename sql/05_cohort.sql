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
