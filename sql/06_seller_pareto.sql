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
