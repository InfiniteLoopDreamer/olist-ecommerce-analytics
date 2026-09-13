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
