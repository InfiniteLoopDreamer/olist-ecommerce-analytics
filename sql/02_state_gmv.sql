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
