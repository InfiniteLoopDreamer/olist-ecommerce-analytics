import { useEffect, useMemo, useState } from "react";
import ReactECharts from "echarts-for-react";
import type { Insights } from "./types";
import { zhSegment, zhState } from "./i18n";
import { buildCharts, money, num, pct } from "./charts/buildCharts";

const TABS = [
  { id: "overview", label: "经营总览" },
  { id: "customers", label: "客户分层" },
  { id: "delivery", label: "履约体验" },
  { id: "assortment", label: "品类与卖家" },
  { id: "insights", label: "结论摘要" },
] as const;

type TabId = (typeof TABS)[number]["id"];

function Skeleton() {
  return (
    <div className="skeleton-wrap" aria-busy="true" aria-label="正在加载">
      <div className="skeleton-hero" />
      <div className="skeleton-row" />
      <div className="skeleton-grid">
        <div className="skeleton-card" />
        <div className="skeleton-card" />
      </div>
    </div>
  );
}

export default function App() {
  const [data, setData] = useState<Insights | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<TabId>("overview");

  useEffect(() => {
    fetch("./data/insights.json")
      .then((r) => {
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then(setData)
      .catch((e) => setError(String(e)));
  }, []);

  const charts = useMemo(() => (data ? buildCharts(data) : null), [data]);

  if (error) return <div className="error">数据加载失败：{error}</div>;
  if (!data || !charts) return <Skeleton />;

  const { kpis, findings } = data;
  const topState = data.by_state[0];
  const late = data.delay_review.find((d) => d.label.includes("超时"));
  const ontime = data.delay_review.find((d) => d.label.includes("按时"));

  const kpisForTab = (() => {
    const all = [
      {
        key: "gmv",
        label: "成交总额",
        value: money(kpis.gmv),
        hint: "已送达订单商品额",
        accent: "#0d9488",
      },
      {
        key: "aov",
        label: "客单价",
        value: `R$ ${kpis.aov.toFixed(0)}`,
        hint: "已送达订单均值",
        accent: "#3b82f6",
      },
      {
        key: "repeat",
        label: "复购率",
        value: pct(kpis.repeat_rate),
        hint: "下单≥2次用户占比",
        accent: "#f43f5e",
        emphasis: true,
      },
      {
        key: "ontime",
        label: "按时送达率",
        value: pct(kpis.on_time_rate),
        hint: "相对承诺时效",
        accent: "#10b981",
        emphasis: true,
        good: true,
      },
      {
        key: "review",
        label: "平均评分",
        value: kpis.avg_review.toFixed(2),
        hint: "1–5 分制",
        accent: "#f59e0b",
      },
      {
        key: "delivery",
        label: "平均配送",
        value: `${kpis.avg_delivery_days} 天`,
        hint: "下单到签收",
        accent: "#7c3aed",
      },
    ];
    if (tab === "customers") return all.filter((k) => ["repeat", "aov", "gmv", "review"].includes(k.key));
    if (tab === "delivery") return all.filter((k) => ["ontime", "delivery", "review", "repeat"].includes(k.key));
    if (tab === "assortment") return all.filter((k) => ["gmv", "aov", "ontime", "review"].includes(k.key));
    if (tab === "insights") return all.filter((k) => ["repeat", "ontime", "gmv", "aov"].includes(k.key));
    return all;
  })();

  return (
    <div className="app">
      <header className="hero">
        <h1>Olist 巴西电商经营分析</h1>
        <p>
          基于约 10 万笔订单的多表统计结果。客户聚合使用 customer_unique_id；成交额仅统计已送达订单的商品金额。
        </p>
        <div className="meta-row">
          <span className="chip">
            <span className="kw kw-date">{kpis.date_start} → {kpis.date_end}</span>
          </span>
          <span className="chip">
            <span className="kw kw-order">已送达</span> {num(kpis.orders)} 单
          </span>
          <span className="chip">
            {num(kpis.customers)} <span className="kw kw-user">位用户</span>
          </span>
          <span className="chip">
            {num(kpis.sellers)} <span className="kw kw-seller">位卖家</span>
          </span>
          <span className="chip">
            {num(kpis.products)} <span className="kw kw-product">件商品</span>
          </span>
        </div>
      </header>

      <section className="highlight-strip" aria-label="关键指标">
        <article className="hl-card">
          <div className="tag">复购率</div>
          <div className="metric">{pct(kpis.repeat_rate)}</div>
          <p>真实用户中，约 {(100 - kpis.repeat_rate * 100).toFixed(0)}% 仅有 1 笔已送达订单。</p>
        </article>
        <article className="hl-card">
          <div className="tag">超时 vs 按时 · 一星占比</div>
          <div className="metric">
            {late && ontime
              ? `${(late.share_1star / Math.max(ontime.share_1star, 1e-6)).toFixed(0)}×`
              : findings[1]?.metric}
          </div>
          <p>
            超时单约 {late ? pct(late.share_1star) : "—"}，按时/提前约{" "}
            {ontime ? pct(ontime.share_1star) : "—"}。
          </p>
        </article>
        <article className="hl-card">
          <div className="tag">州级成交集中度</div>
          <div className="metric">
            {zhState(topState.customer_state)} {pct(topState.gmv_share)}
          </div>
          <p>
            {zhState(topState.customer_state)} 成交额占比最高，为 {pct(topState.gmv_share)}。
          </p>
        </article>
      </section>

      <nav className="nav" role="tablist" aria-label="分析模块">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            aria-selected={tab === t.id}
            className={tab === t.id ? "active" : ""}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </nav>

      <section className="kpi-grid">
        {kpisForTab.map((k) => (
          <div
            key={k.key}
            className={`kpi${k.emphasis ? " emphasis" : ""}${k.good ? " good" : ""}`}
            style={{ ["--accent" as string]: k.accent }}
          >
            <div className="label">{k.label}</div>
            <div className="value" style={k.emphasis ? { color: k.accent } : undefined}>
              {k.value}
            </div>
            <div className="hint">{k.hint}</div>
          </div>
        ))}
      </section>

      <div key={tab} className="panel" role="tabpanel">
        {tab === "overview" && (
          <>
            <div className="grid-2">
              <div className="card">
                <div className="card-head">
                  <h3>月度成交额与订单</h3>
                </div>
                <p className="sub">2016-09 至 2018-08 的月度成交额与订单量。</p>
                <ReactECharts option={charts.monthly} style={{ height: 340 }} opts={{ renderer: "canvas" }} />
              </div>
              <div className="card">
                <div className="card-head">
                  <h3>支付方式结构</h3>
                </div>
                <p className="sub">各支付方式成交额占比。</p>
                <ReactECharts option={charts.payment} style={{ height: 340 }} />
              </div>
            </div>
            <div className="grid-2 equal">
              <div className="card">
                <div className="card-head">
                  <h3>州级成交额前十</h3>
                </div>
                <p className="sub">
                  {zhState(topState.customer_state)} 成交额占比 {pct(topState.gmv_share)}，为各州最高。
                </p>
                <ReactECharts option={charts.state} style={{ height: 320 }} />
              </div>
              <div className="card">
                <div className="card-head">
                  <h3>订单状态分布</h3>
                </div>
                <p className="sub">各订单状态的数量占比。</p>
                <ReactECharts option={charts.status} style={{ height: 320 }} />
              </div>
            </div>
          </>
        )}

        {tab === "customers" && (
          <>
            <div className="card">
              <div className="card-head">
                <h3>月度同期群留存（第 1–5 月）</h3>
              </div>
              <p className="sub">当月留存定义为 100%。有效队列平均次月留存 {pct(data.cohort_retention.avg_m1_retention)}。</p>
              <ReactECharts option={charts.cohort} style={{ height: 520 }} />
            </div>
            <div className="card">
              <div className="card-head">
                <h3>RFM 客户价值分层</h3>
              </div>
              <p className="sub">按近度、频次、金额三个维度分层后的客户数量与成交额。</p>
              <ReactECharts option={charts.rfm} style={{ height: 380 }} />
            </div>
            <div className="grid-2 equal">
              <div className="card">
                <div className="card-head">
                  <h3>购买频次分布</h3>
                </div>
                <p className="sub">真实用户按已送达订单次数统计的人数分布。</p>
                <ReactECharts option={charts.freq} style={{ height: 300 }} />
              </div>
              <div className="card">
                <div className="card-head">
                  <h3>分期期数与客单价</h3>
                </div>
                <p className="sub">不同分期期数组的客单价均值。</p>
                <ReactECharts option={charts.installment} style={{ height: 300 }} />
              </div>
            </div>
            <div className="card table-wrap">
              <h3>分层明细表</h3>
              <p className="sub">按成交额降序排列。</p>
              <table>
                <thead>
                  <tr>
                    <th>分层</th>
                    <th>客户数</th>
                    <th>客户占比</th>
                    <th>成交额</th>
                    <th>成交占比</th>
                    <th>人均贡献</th>
                  </tr>
                </thead>
                <tbody>
                  {data.rfm_segments.map((r) => (
                    <tr key={r.segment}>
                      <td>{zhSegment(r.segment)}</td>
                      <td>{num(r.customers)}</td>
                      <td>{pct(r.customer_share)}</td>
                      <td>{money(r.gmv)}</td>
                      <td>{pct(r.gmv_share)}</td>
                      <td>R$ {r.avg_monetary.toFixed(0)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {tab === "delivery" && (
          <>
            <div className="grid-2 equal">
              <div className="card">
                <div className="card-head">
                  <h3>超时配送与评分</h3>
                </div>
                <p className="sub">
                  超时组平均评分 {late ? late.avg_review.toFixed(2) : "—"}，按时/提前组{" "}
                  {ontime ? ontime.avg_review.toFixed(2) : "—"}。
                </p>
                <ReactECharts option={charts.delay} style={{ height: 320 }} />
              </div>
              <div className="card">
                <div className="card-head">
                  <h3>评分分布</h3>
                </div>
                <p className="sub">评分分值（1–5）对应的订单数量分布。</p>
                <ReactECharts option={charts.scores} style={{ height: 320 }} />
              </div>
            </div>
            <div className="card">
              <div className="card-head">
                <h3>主要州：超时率与配送天数</h3>
              </div>
              <p className="sub">按订单量前十二州统计超时率与平均配送天数。</p>
              <ReactECharts option={charts.stateDelivery} style={{ height: 340 }} />
            </div>
          </>
        )}

        {tab === "assortment" && (
          <>
            <div className="grid-2">
              <div className="card">
                <div className="card-head">
                  <h3>品类成交额前十五</h3>
                </div>
                <p className="sub">按成交额排序的前十五品类。</p>
                <ReactECharts option={charts.category} style={{ height: 440 }} />
              </div>
              <div className="card">
                <div className="card-head">
                  <h3>卖家帕累托（前十）</h3>
                </div>
                <p className="sub">
                  共 {num(data.seller_summary.total_sellers)} 位卖家；累计贡献 80% 成交额的卖家约{" "}
                  {data.seller_summary.top_sellers_for_80pct_gmv} 位；前十位合计约占{" "}
                  {pct(data.seller_summary.top_10_gmv_share)}。
                </p>
                <ReactECharts option={charts.sellers} style={{ height: 380 }} />
              </div>
            </div>
          </>
        )}

        {tab === "insights" && (
          <>
            <div className="card">
              <div className="card-head">
                <h3>关键结果摘要</h3>
              </div>
              <p className="sub">以下为可复核的统计结果。</p>
              <div className="findings">
                {findings.map((f) => (
                  <article className="finding" key={f.title}>
                    <div className="metric">{f.metric}</div>
                    <div>
                      <h4>{f.title}</h4>
                      <p>{f.detail}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
            <div className="card">
              <div className="card-head">
                <h3>数据口径</h3>
              </div>
              <p className="sub">{data.data_quality.id_trap.note}</p>
              <p className="sub">
                customer_id 数：{num(data.data_quality.id_trap.customer_id_count)} ｜
                customer_unique_id 数：{num(data.data_quality.id_trap.customer_unique_id_count)} ｜
                已送达占比：{pct(data.data_quality.delivered_share)}
              </p>
              <ul className="plain-list">
                {data.data_quality.rules.map((r) => (
                  <li key={r}>{r}</li>
                ))}
              </ul>
              <div className="table-wrap" style={{ marginTop: 8 }}>
                <table>
                  <thead>
                    <tr>
                      <th>数据表</th>
                      <th>行数</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.data_quality.tables.map((t) => (
                      <tr key={t.name}>
                        <td>{t.name}</td>
                        <td>{num(t.rows)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      <footer className="footer">
        数据来源：巴西电商公开数据集（Olist）· 许可 {data.meta.license} ·{" "}
        {data.meta.generated_note}
      </footer>
    </div>
  );
}
