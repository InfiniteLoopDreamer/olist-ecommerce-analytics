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
