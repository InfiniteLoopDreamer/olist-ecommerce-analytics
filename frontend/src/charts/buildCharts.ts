import type { Insights } from "../types";
import {
  zhCategory,
  zhPayment,
  zhSegment,
  zhState,
  zhStatus,
} from "../i18n";

export const COLORS = ["#0d9488", "#f43f5e", "#3b82f6", "#f59e0b", "#7c3aed", "#06b6d4", "#10b981", "#fb7185"];

export const money = (n: number) =>
  n >= 1_000_000
    ? `R$ ${(n / 1_000_000).toFixed(2)}M`
    : `R$ ${n.toLocaleString("zh-CN", { maximumFractionDigits: 0 })}`;

export const pct = (n: number) => `${(n * 100).toFixed(1)}%`;
export const num = (n: number) => n.toLocaleString("zh-CN");

export const chartBase = {
  color: COLORS,
  textStyle: { fontFamily: "Manrope, Noto Sans SC, sans-serif", color: "#334155" },
  grid: { left: 52, right: 28, top: 48, bottom: 48, containLabel: true },
  tooltip: {
    trigger: "axis" as const,
    backgroundColor: "rgba(15,23,42,0.92)",
    borderWidth: 0,
    textStyle: { color: "#fff", fontSize: 12 },
  },
  legend: {
    textStyle: { color: "#64748b" },
    top: 8,
  },
};


export function buildCharts(data: Insights) {
    const {
      monthly,
      by_state,
      by_category,
      by_payment,
      rfm_segments,
      freq_dist,
      delay_review,
      score_dist,
      state_delivery,
      by_installment,
      order_status,
      seller_summary,
      cohort_retention,
    } = data;

    const monthLabel = (m: string) => {
      const [y, mo] = m.split("-");
      return `${y.slice(2)}年${Number(mo)}月`;
    };

    return {
      monthly: {
        ...chartBase,
        legend: { ...chartBase.legend, data: ["成交额", "订单数"] },
        tooltip: {
          ...chartBase.tooltip,
          formatter: (params: { seriesName: string; axisValue: string; data: number; marker: string }[]) => {
            const head = params[0]?.axisValue ?? "";
            return (
              `${head}<br/>` +
              params
                .map((p) =>
                  p.seriesName === "成交额"
                    ? `${p.marker}${p.seriesName}：${money(p.data)}`
                    : `${p.marker}${p.seriesName}：${num(p.data)}`
                )
                .join("<br/>")
            );
          },
        },
        xAxis: {
          type: "category",
          data: monthly.map((d) => monthLabel(d.purchase_month)),
          axisLabel: { rotate: 35, fontSize: 10, interval: 8 },
          axisTick: { alignWithLabel: true },
        },
        yAxis: [
          {
            type: "value",
            name: "成交额",
            axisLabel: { formatter: (v: number) => (v >= 1e6 ? `${(v / 1e6).toFixed(1)}M` : `${Math.round(v / 1000)}k`) },
          },
          { type: "value", name: "订单" },
        ],
        series: [
          {
            name: "成交额",
            type: "bar",
            data: monthly.map((d) => d.gmv),
            itemStyle: {
              borderRadius: [8, 8, 0, 0],
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: "#2dd4bf" },
                  { offset: 1, color: "#0d9488" },
                ],
              },
            },
          },
          {
            name: "订单数",
            type: "line",
            yAxisIndex: 1,
            data: monthly.map((d) => d.orders),
            smooth: true,
            symbolSize: 7,
            lineStyle: { width: 3, color: "#f43f5e" },
            itemStyle: { color: "#f43f5e" },
            areaStyle: { color: "rgba(244,63,94,0.08)" },
          },
        ],
      },
      state: {
        ...chartBase,
        grid: { left: 16, right: 16, top: 28, bottom: 28, containLabel: true },
        tooltip: {
          ...chartBase.tooltip,
          formatter: (params: { name: string; data: number; marker: string }[]) =>
            `${params[0].marker}${params[0].name}<br/>成交额：${money(params[0].data)}`,
        },
        xAxis: {
          type: "category",
          data: by_state.slice(0, 10).map((d) => zhState(d.customer_state)),
          axisLabel: { fontSize: 11, interval: 10 },
        },
        yAxis: {
          type: "value",
          axisLabel: { formatter: (v: number) => `${(v / 1e6).toFixed(1)}M` },
        },
        series: [
          {
            type: "bar",
            data: by_state.slice(0, 10).map((d, i) => ({
              value: d.gmv,
              itemStyle: {
                borderRadius: [8, 8, 0, 0],
                color: COLORS[i % COLORS.length],
              },
            })),
          },
        ],
      },
      payment: {
        color: COLORS,
        tooltip: {
          trigger: "item",
          backgroundColor: "rgba(15,23,42,0.92)",
          borderWidth: 0,
          textStyle: { color: "#fff" },
          formatter: "{b}<br/>成交额：{c}<br/>占比：{d}%",
        },
        legend: { bottom: 0, textStyle: { color: "#64748b" } },
        series: [
          {
            type: "pie",
            radius: ["46%", "70%"],
            center: ["50%", "46%"],
            data: by_payment.map((d) => ({ name: zhPayment(d.payment_type), value: d.gmv })),
            label: { formatter: "{b}\n{d}%", fontSize: 11, color: "#334155" },
            itemStyle: { borderColor: "#fff", borderWidth: 3 },
          },
        ],
      },
      category: {
        ...chartBase,
        grid: { left: 8, right: 28, top: 16, bottom: 16, containLabel: true },
        tooltip: {
          ...chartBase.tooltip,
          formatter: (params: { name: string; data: number; marker: string }[]) =>
            `${params[0].marker}${params[0].name}<br/>成交额：${money(params[0].data)}`,
        },
        xAxis: {
          type: "value",
          axisLabel: { formatter: (v: number) => `${(v / 1e6).toFixed(1)}M` },
        },
        yAxis: {
          type: "category",
          data: [...by_category].reverse().map((d) => zhCategory(d.category)),
          axisLabel: { width: 96, overflow: "truncate", fontSize: 11 },
        },
        series: [
          {
            type: "bar",
            data: [...by_category].reverse().map((d, i) => ({
              value: d.gmv,
              itemStyle: {
                borderRadius: [0, 8, 8, 0],
                color: COLORS[i % COLORS.length],
              },
            })),
          },
        ],
      },
      rfm: {
        ...chartBase,
        grid: { left: 48, right: 28, top: 48, bottom: 72, containLabel: true },
        legend: { ...chartBase.legend, data: ["客户数", "成交额占比"] },
        tooltip: {
          ...chartBase.tooltip,
          formatter: (params: { seriesName: string; axisValue: string; data: number; marker: string }[]) => {
            const head = params[0]?.axisValue ?? "";
            return (
              `${head}<br/>` +
              params
                .map((p) =>
                  p.seriesName.includes("占比")
                    ? `${p.marker}${p.seriesName}：${pct(p.data)}`
                    : `${p.marker}${p.seriesName}：${num(p.data)}`
                )
                .join("<br/>")
            );
          },
        },
        xAxis: {
          type: "category",
          data: rfm_segments.map((d) => zhSegment(d.segment)),
          axisLabel: { rotate: 22, fontSize: 11, interval: 10 },
        },
        yAxis: [
          { type: "value", name: "客户" },
          {
            type: "value",
            name: "占比",
            max: 1,
            axisLabel: { formatter: (v: number) => pct(v) },
          },
        ],
        series: [
          {
            name: "客户数",
            type: "bar",
            data: rfm_segments.map((d) => d.customers),
            itemStyle: {
              borderRadius: [8, 8, 0, 0],
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: "#60a5fa" },
                  { offset: 1, color: "#3b82f6" },
                ],
              },
            },
          },
          {
            name: "成交额占比",
            type: "line",
            yAxisIndex: 1,
            data: rfm_segments.map((d) => d.gmv_share),
            smooth: true,
            lineStyle: { width: 3, color: "#f59e0b" },
            itemStyle: { color: "#f59e0b" },
          },
        ],
      },
      freq: {
        ...chartBase,
        tooltip: {
          ...chartBase.tooltip,
          formatter: (params: { name: string; data: number; marker: string }[]) =>
            `${params[0].marker}${params[0].name}<br/>客户数：${num(params[0].data)}`,
        },
        xAxis: { type: "category", data: freq_dist.map((d) => `${d.orders} 单`) },
        yAxis: { type: "value", name: "客户数" },
        series: [
          {
            type: "bar",
            data: freq_dist.map((d, i) => ({
              value: d.customers,
              itemStyle: { borderRadius: [8, 8, 0, 0], color: COLORS[i % COLORS.length] },
            })),
          },
        ],
      },
      delay: {
        ...chartBase,
        legend: { ...chartBase.legend, data: ["平均评分", "一星占比"] },
        tooltip: {
          ...chartBase.tooltip,
          formatter: (params: { seriesName: string; axisValue: string; data: number; marker: string }[]) => {
            const head = params[0]?.axisValue ?? "";
            return (
              `${head}<br/>` +
              params
                .map((p) =>
                  p.seriesName.includes("占比")
                    ? `${p.marker}${p.seriesName}：${pct(p.data)}`
                    : `${p.marker}${p.seriesName}：${p.data.toFixed(2)}`
                )
                .join("<br/>")
            );
          },
        },
        xAxis: { type: "category", data: delay_review.map((d) => d.label) },
        yAxis: [
          { type: "value", min: 0, max: 5, name: "评分" },
          {
            type: "value",
            max: 0.55,
            axisLabel: { formatter: (v: number) => pct(v) },
          },
        ],
        series: [
          {
            name: "平均评分",
            type: "bar",
            data: delay_review.map((d) => d.avg_review),
            itemStyle: {
              borderRadius: [8, 8, 0, 0],
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: "#34d399" },
                  { offset: 1, color: "#059669" },
                ],
              },
            },
          },
          {
            name: "一星占比",
            type: "line",
            yAxisIndex: 1,
            data: delay_review.map((d) => d.share_1star),
            smooth: true,
            lineStyle: { width: 3, color: "#f43f5e" },
            itemStyle: { color: "#f43f5e" },
          },
        ],
      },
      scores: {
        ...chartBase,
        tooltip: {
          ...chartBase.tooltip,
          formatter: (params: { name: string; data: number; marker: string }[]) =>
            `${params[0].marker}${params[0].name}<br/>订单数：${num(params[0].data)}`,
        },
        xAxis: { type: "category", data: score_dist.map((d) => `${d.score} 星`) },
        yAxis: { type: "value", name: "订单数" },
        series: [
          {
            type: "bar",
            data: score_dist.map((d, i) => ({
              value: d.orders,
              itemStyle: {
                borderRadius: [8, 8, 0, 0],
                color: ["#f43f5e", "#fb7185", "#f59e0b", "#34d399", "#0d9488"][i] ?? COLORS[i],
              },
            })),
          },
        ],
      },
      stateDelivery: {
        ...chartBase,
        legend: { ...chartBase.legend, data: ["超时率", "平均送达天数"] },
        tooltip: {
          ...chartBase.tooltip,
          formatter: (params: { seriesName: string; axisValue: string; data: number; marker: string }[]) => {
            const head = params[0]?.axisValue ?? "";
            return (
              `${head}<br/>` +
              params
                .map((p) =>
                  p.seriesName.includes("率")
                    ? `${p.marker}${p.seriesName}：${pct(p.data)}`
                    : `${p.marker}${p.seriesName}：${p.data.toFixed(1)} 天`
                )
                .join("<br/>")
            );
          },
        },
        xAxis: {
          type: "category",
          data: state_delivery.map((d) => zhState(d.customer_state)),
          axisLabel: { fontSize: 11, interval: 8 },
        },
        yAxis: [
          { type: "value", axisLabel: { formatter: (v: number) => pct(v) } },
          { type: "value", name: "天数" },
        ],
        series: [
          {
            name: "超时率",
            type: "bar",
            data: state_delivery.map((d) => d.late_rate),
            itemStyle: {
              borderRadius: [8, 8, 0, 0],
              color: {
                type: "linear",
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: "#fb7185" },
                  { offset: 1, color: "#e11d48" },
                ],
              },
            },
          },
          {
            name: "平均送达天数",
            type: "line",
            yAxisIndex: 1,
            data: state_delivery.map((d) => d.avg_delivery_days),
            smooth: true,
            lineStyle: { width: 3, color: "#3b82f6" },
            itemStyle: { color: "#3b82f6" },
          },
        ],
      },
      installment: {
        ...chartBase,
        tooltip: {
          ...chartBase.tooltip,
          formatter: (params: { name: string; data: number; marker: string }[]) =>
            `${params[0].marker}${params[0].name}<br/>客单价：R$ ${params[0].data.toFixed(0)}`,
        },
        xAxis: { type: "category", data: by_installment.map((d) => `${d.installment_group} 期`) },
        yAxis: { type: "value", name: "客单价 (R$)" },
        series: [
          {
            type: "bar",
            data: by_installment.map((d, i) => ({
              value: d.aov,
              itemStyle: { borderRadius: [8, 8, 0, 0], color: COLORS[i % COLORS.length] },
            })),
          },
        ],
      },
      status: {
        color: COLORS,
        tooltip: {
          trigger: "item",
          backgroundColor: "rgba(15,23,42,0.92)",
          borderWidth: 0,
          textStyle: { color: "#fff" },
          formatter: "{b}<br/>订单数：{c}<br/>占比：{d}%",
        },
        legend: { bottom: 0, textStyle: { color: "#64748b", fontSize: 11 } },
        series: [
          {
            type: "pie",
            radius: ["44%", "68%"],
            center: ["50%", "45%"],
            data: order_status.map((d) => ({ name: zhStatus(d.status), value: d.count })),
            label: { formatter: "{b}\n{d}%", fontSize: 11 },
            itemStyle: { borderColor: "#fff", borderWidth: 3 },
          },
        ],
      },
      sellers: {
        ...chartBase,
        legend: { ...chartBase.legend, data: ["成交额", "累计占比"] },
        tooltip: {
          ...chartBase.tooltip,
          formatter: (params: { seriesName: string; axisValue: string; data: number; marker: string }[]) => {
            const head = params[0]?.axisValue ?? "";
            return (
              `${head}<br/>` +
              params
                .map((p) =>
                  p.seriesName.includes("占比")
                    ? `${p.marker}${p.seriesName}：${pct(p.data)}`
                    : `${p.marker}${p.seriesName}：${money(p.data)}`
                )
                .join("<br/>")
            );
          },
        },
        xAxis: { type: "category", data: seller_summary.top10.map((d) => `第${d.rank}名`) },
        yAxis: [
          {
            type: "value",
            axisLabel: { formatter: (v: number) => `${(v / 1000).toFixed(0)}k` },
          },
          {
            type: "value",
            max: 1,
            axisLabel: { formatter: (v: number) => pct(v) },
          },
        ],
        series: [
          {
            name: "成交额",
            type: "bar",
            data: seller_summary.top10.map((d, i) => ({
              value: d.gmv,
              itemStyle: { borderRadius: [8, 8, 0, 0], color: COLORS[i % COLORS.length] },
            })),
          },
          {
            name: "累计占比",
            type: "line",
            yAxisIndex: 1,
            data: seller_summary.top10.map((d) => d.cum_share),
            smooth: true,
            lineStyle: { width: 3, color: "#7c3aed" },
            itemStyle: { color: "#7c3aed" },
          },
        ],
      },
      cohort: (() => {
        const { cohorts, periods, matrix } = cohort_retention;
        // 当月恒为 100%，不进色阶；只画第 1–5 月，避免空白/被洗白
        const laterPeriods = periods.slice(1);
        const laterMatrix = matrix.map((row) => row.slice(1));
        const maxLater = Math.max(...laterMatrix.flat(), 0.001);
        const yLabels = cohorts.map((c) => {
          const [y, m] = c.split("-");
          return `${y.slice(2)}/${Number(m)}`;
        });
        const heatData = laterMatrix.flatMap((row, yi) =>
          row.map((v, xi) => [xi, yi, Number(v) || 0])
        );

        return {
          animation: false,
          textStyle: chartBase.textStyle,
          grid: { left: 8, right: 16, top: 24, bottom: 64, containLabel: true },
          tooltip: {
            position: "top",
            backgroundColor: "rgba(15,23,42,0.92)",
            borderWidth: 0,
            textStyle: { color: "#fff" },
            formatter: (p: { value: number[] }) => {
              const [x, y, v] = p.value;
              return `${yLabels[y]} · ${laterPeriods[x]}<br/>留存 ${(v * 100).toFixed(2)}%`;
            },
          },
          xAxis: {
            type: "category",
            data: laterPeriods,
            axisTick: { show: false },
            axisLine: { show: false },
            axisLabel: { color: "#64748b", fontWeight: 600 },
          },
          yAxis: {
            type: "category",
            data: yLabels,
            inverse: true,
            axisTick: { show: false },
            axisLine: { show: false },
            axisLabel: { color: "#64748b", fontSize: 11 },
          },
          visualMap: {
            min: 0,
            max: maxLater,
            calculable: false,
            orient: "horizontal",
            left: "center",
            bottom: 8,
            itemWidth: 14,
            itemHeight: 180,
            inRange: {
              color: ["#fff7ed", "#fdba74", "#f97316", "#ea580c", "#c2410c"],
            },
            text: ["高", "低"],
            textStyle: { color: "#64748b", fontSize: 11 },
            formatter: (v: string | number) => `${(Number(v) * 100).toFixed(1)}%`,
          },
          series: [
            {
              type: "heatmap",
              data: heatData,
              label: {
                show: true,
                fontSize: 11,
                fontWeight: 600,
                formatter: (p: { value: number[] }) => `${(p.value[2] * 100).toFixed(1)}%`,
                color: "#7c2d12",
              },
              itemStyle: {
                borderColor: "#ffffff",
                borderWidth: 2,
                borderRadius: 4,
              },
              emphasis: {
                itemStyle: { shadowBlur: 10, shadowColor: "rgba(15,23,42,0.2)" },
              },
            },
          ],
        };
      })(),
    };
}
