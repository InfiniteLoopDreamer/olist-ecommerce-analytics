export type Insights = {
  meta: {
    project: string;
    source: string;
    license: string;
    generated_note: string;
  };
  kpis: {
    orders: number;
    customers: number;
    gmv: number;
    aov: number;
    repeat_rate: number;
    avg_review: number;
    on_time_rate: number;
    late_rate: number;
    avg_delivery_days: number;
    date_start: string;
    date_end: string;
    total_orders_all_status: number;
    sellers: number;
    products: number;
    avg_m1_retention?: number;
  };
  findings: { title: string; metric: string; detail: string }[];
  recommendations: string[];
  methodology: { q: string; a: string }[];
  data_quality: {
    tables: { name: string; rows: number }[];
    delivered_share: number;
    id_trap: {
      customer_id_count: number;
      customer_unique_id_count: number;
      note: string;
    };
    rules: string[];
  };
  cohort_retention: {
    cohorts: string[];
    periods: string[];
    matrix: number[][];
    sizes: number[];
    avg_m1_retention: number;
  };
  monthly: {
    purchase_month: string;
    orders: number;
    gmv: number;
    customers: number;
    aov: number;
    avg_review: number;
    late_rate: number;
  }[];
  by_state: {
    customer_state: string;
    orders: number;
    gmv: number;
    avg_review: number;
    gmv_share: number;
  }[];
  by_category: {
    category: string;
    orders: number;
    gmv: number;
    items: number;
    gmv_share: number;
  }[];
  by_payment: { payment_type: string; orders: number; gmv: number; aov: number }[];
  by_installment: { installment_group: string; orders: number; aov: number }[];
  delay_review: {
    label: string;
    orders: number;
    avg_review: number;
    share_1star: number;
    share_5star: number;
  }[];
  score_dist: { score: number; orders: number }[];
  state_delivery: {
    customer_state: string;
    orders: number;
    late_rate: number;
    avg_delivery_days: number;
    avg_review: number;
  }[];
  rfm_segments: {
    segment: string;
    customers: number;
    gmv: number;
    avg_orders: number;
    avg_monetary: number;
    customer_share: number;
    gmv_share: number;
  }[];
  freq_dist: { orders: string; customers: number }[];
  seller_summary: {
    total_sellers: number;
    top_sellers_for_80pct_gmv: number;
    top_10_gmv_share: number;
    top10: {
      rank: number;
      seller_id: string;
      orders: number;
      gmv: number;
      cum_share: number;
    }[];
  };
  order_status: { status: string; count: number }[];
};
