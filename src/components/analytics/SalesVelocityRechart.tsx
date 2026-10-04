import React, { useState } from "react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  ComposedChart,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from "recharts";
import {
  TrendingUp,
  BarChart3,
  LineChart as LineChartIcon,
  PieChart as PieChartIcon,
  Layers,
  Activity,
  Award,
  DollarSign,
  ShoppingBag,
  CreditCard,
  Split,
  Sparkles,
} from "lucide-react";
import {
  TimeSeriesPoint,
  HistogramBucket,
  ParetoPoint,
  RadarMetricPoint,
} from "../../types/analyticsDashboard";

export type AnalyticsChartType =
  | "trend"
  | "bars"
  | "line"
  | "combo"
  | "pie"
  | "histogram"
  | "pareto"
  | "radar";

interface SalesVelocityRechartProps {
  timeSeries: TimeSeriesPoint[];
  histogramData: HistogramBucket[];
  paretoData: ParetoPoint[];
  radarData: RadarMetricPoint[];
  isSingleDay: boolean;
  periodLabel: string;
}

const PIE_COLORS = [
  "#F5E086", // gold
  "#34D399", // emerald
  "#38BDF8", // sky
  "#FB923C", // orange
  "#C084FC", // purple
  "#F43F5E", // rose
  "#A3E635", // lime
  "#60A5FA", // blue
];

export const SalesVelocityRechart: React.FC<SalesVelocityRechartProps> = React.memo(({
  timeSeries,
  histogramData,
  paretoData,
  radarData,
  isSingleDay,
  periodLabel,
}) => {
  const [metricMode, setMetricMode] = useState<"revenue" | "orders" | "payments">("revenue");
  const [chartType, setChartType] = useState<AnalyticsChartType>("trend");

  // Format currency on Y axis
  const formatYAxis = (val: number) => {
    if (metricMode === "orders") return val.toString();
    if (val >= 100000) return `₹${(val / 100000).toFixed(1)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(0)}k`;
    return `₹${val}`;
  };

  // Peak calculation memoized
  const peak = React.useMemo(() => {
    return timeSeries.reduce((max, pt) => {
      const val = metricMode === "revenue" ? pt.revenue : pt.ordersCount;
      const maxVal = metricMode === "revenue" ? max.revenue : max.ordersCount;
      return val > maxVal ? pt : max;
    }, timeSeries[0] || { label: "N/A", revenue: 0, ordersCount: 0 });
  }, [timeSeries, metricMode]);

  const { totalPeriodRevenue, totalPeriodOrders } = React.useMemo(() => {
    return {
      totalPeriodRevenue: timeSeries.reduce((s, p) => s + p.revenue, 0),
      totalPeriodOrders: timeSeries.reduce((s, p) => s + p.ordersCount, 0),
    };
  }, [timeSeries]);

  // Pie chart data: top 7 intervals + remainder as "Other"
  const pieData = React.useMemo(() => {
    const sorted = [...timeSeries].sort((a, b) => b.revenue - a.revenue);
    const top = sorted.slice(0, 6);
    const rest = sorted.slice(6);
    const restRev = rest.reduce((s, p) => s + p.revenue, 0);

    const result = top.map((t) => ({
      name: t.label,
      value: t.revenue,
      orders: t.ordersCount,
    }));

    if (restRev > 0) {
      result.push({
        name: "Other Intervals",
        value: restRev,
        orders: rest.reduce((s, p) => s + p.ordersCount, 0),
      });
    }
    return result;
  }, [timeSeries]);

  // Custom Recharts Dark Tooltip for time series
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint: TimeSeriesPoint = payload[0].payload;
      return (
        <div className="bg-[#1A2520] p-3.5 rounded-2xl border border-white/20 shadow-2xl text-xs space-y-2 backdrop-blur-md min-w-[210px]">
          <div className="flex items-center justify-between border-b border-white/10 pb-1.5">
            <span className="font-bold text-[#F5E086] text-sm">{label}</span>
            {dataPoint.subLabel && (
              <span className="text-white/40 text-[10px] font-mono">{dataPoint.subLabel}</span>
            )}
          </div>

          <div className="space-y-1 font-mono text-[11px]">
            <div className="flex justify-between items-center text-white">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#F5E086]" />
                Gross Revenue:
              </span>
              <strong className="text-[#F5E086]">₹{dataPoint.revenue.toLocaleString("en-IN")}</strong>
            </div>

            <div className="flex justify-between items-center text-white/80">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                UPI & QR:
              </span>
              <strong className="text-emerald-300">₹{dataPoint.upiSales.toLocaleString("en-IN")}</strong>
            </div>

            <div className="flex justify-between items-center text-white/80">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                Cash Billing:
              </span>
              <strong className="text-amber-200">₹{dataPoint.cashSales.toLocaleString("en-IN")}</strong>
            </div>

            <div className="flex justify-between items-center text-white/80">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                Card / POS:
              </span>
              <strong className="text-purple-300">₹{dataPoint.cardSales.toLocaleString("en-IN")}</strong>
            </div>

            <div className="flex justify-between items-center text-white/90 pt-1 border-t border-white/10">
              <span>Orders Placed:</span>
              <strong className="text-white">
                {dataPoint.ordersCount} ({dataPoint.successfulCount} OK, {dataPoint.cancelledCount} canc)
              </strong>
            </div>

            <div className="flex justify-between items-center text-emerald-300 text-[10px]">
              <span>Avg Order Value (AOV):</span>
              <strong>₹{dataPoint.avgOrderValue}</strong>
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Pareto Tooltip
  const ParetoTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const pt: ParetoPoint = payload[0].payload;
      return (
        <div className="bg-[#1A2520] p-3 rounded-2xl border border-white/20 shadow-2xl text-xs space-y-1.5 min-w-[190px]">
          <span className="font-bold text-[#F5E086] block border-b border-white/10 pb-1">{label}</span>
          <div className="flex justify-between items-center text-white">
            <span>Interval Revenue:</span>
            <strong className="text-[#F5E086] font-mono">₹{pt.revenue.toLocaleString("en-IN")}</strong>
          </div>
          <div className="flex justify-between items-center text-amber-300">
            <span>Cumulative Share:</span>
            <strong className="font-mono font-bold">{pt.cumulativePercent}%</strong>
          </div>
          <div className="flex justify-between items-center text-white/70 text-[10px]">
            <span>Total Orders:</span>
            <strong className="font-mono">{pt.ordersCount}</strong>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Histogram Tooltip
  const HistogramTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const h: HistogramBucket = payload[0].payload;
      return (
        <div className="bg-[#1A2520] p-3 rounded-2xl border border-white/20 shadow-2xl text-xs space-y-1 min-w-[180px]">
          <span className="font-bold text-[#F5E086] block border-b border-white/10 pb-1">
            Bill Size: {h.rangeLabel}
          </span>
          <div className="flex justify-between text-white">
            <span>Orders Count:</span>
            <strong className="text-white font-mono">{h.orderCount} orders</strong>
          </div>
          <div className="flex justify-between text-emerald-300">
            <span>Revenue Generated:</span>
            <strong className="font-mono">₹{h.totalRevenue.toLocaleString("en-IN")}</strong>
          </div>
          <div className="flex justify-between text-[#F5E086] text-[10px]">
            <span>Order Volume Share:</span>
            <strong>{h.percentage}%</strong>
          </div>
        </div>
      );
    }
    return null;
  };

  // Custom Radar Tooltip
  const RadarCustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const r: RadarMetricPoint = payload[0].payload;
      return (
        <div className="bg-[#1A2520] p-2.5 rounded-xl border border-white/20 shadow-xl text-xs space-y-1">
          <span className="font-bold text-[#F5E086]">{r.subject}</span>
          <div className="text-white">
            Actual: <strong className="text-emerald-300">{r.actualValue}</strong>
          </div>
          <div className="text-white/60 text-[10px]">
            Benchmark: <strong>{r.benchmark}/100</strong>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#24332D] p-5 sm:p-6 rounded-3xl border border-white/10 shadow-xl space-y-4">
      {/* Top Header & Chart View Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="p-1.5 rounded-xl bg-[#F5E086]/10 text-[#F5E086]">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h3 className="font-niea font-bold text-lg text-[#F5E086]">
              Sales Velocity & Analytics Trajectory
            </h3>
            <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {isSingleDay ? "Single Day Hourly (11 AM – 10 PM)" : "Multi-Day Timeline"}
            </span>
          </div>
          <p className="text-xs text-white/60 mt-1">
            Visualizing {periodLabel} • 8 selectable enterprise graph perspectives
          </p>
        </div>

        {/* Primary Controls: Metric Mode Toggle */}
        {(chartType === "trend" || chartType === "bars" || chartType === "line") && (
          <div className="flex rounded-xl bg-[#1A2520] p-1 border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setMetricMode("revenue")}
              className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
                metricMode === "revenue"
                  ? "bg-[#F5E086] text-[#24332D] shadow"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Revenue (₹)</span>
            </button>
            <button
              type="button"
              onClick={() => setMetricMode("orders")}
              className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
                metricMode === "orders"
                  ? "bg-[#F5E086] text-[#24332D] shadow"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Orders (#)</span>
            </button>
            <button
              type="button"
              onClick={() => setMetricMode("payments")}
              className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
                metricMode === "payments"
                  ? "bg-[#F5E086] text-[#24332D] shadow"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Payments Split</span>
            </button>
          </div>
        )}
      </div>

      {/* Graph Option Toggles Bar */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 rounded-2xl bg-[#1A2520] border border-white/10 text-xs">
        <span className="text-white/40 text-[11px] font-bold px-2 flex items-center gap-1 uppercase tracking-wider">
          <Layers className="w-3 h-3 text-[#F5E086]" /> Chart Style:
        </span>

        {/* 1. Trends (Area) */}
        <button
          type="button"
          onClick={() => setChartType("trend")}
          className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
            chartType === "trend"
              ? "bg-[#F5E086] text-[#24332D] shadow"
              : "text-white/70 hover:text-white hover:bg-white/5"
          }`}
          title="Smooth gradient area trajectory"
        >
          <TrendingUp className="w-3.5 h-3.5" />
          <span>Trends</span>
        </button>

        {/* 2. Bars */}
        <button
          type="button"
          onClick={() => setChartType("bars")}
          className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
            chartType === "bars"
              ? "bg-[#F5E086] text-[#24332D] shadow"
              : "text-white/70 hover:text-white hover:bg-white/5"
          }`}
          title="Column bar chart"
        >
          <BarChart3 className="w-3.5 h-3.5" />
          <span>Bars</span>
        </button>

        {/* 3. Multi-Line */}
        <button
          type="button"
          onClick={() => setChartType("line")}
          className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
            chartType === "line"
              ? "bg-[#F5E086] text-[#24332D] shadow"
              : "text-white/70 hover:text-white hover:bg-white/5"
          }`}
          title="Precision line curve"
        >
          <LineChartIcon className="w-3.5 h-3.5" />
          <span>Line</span>
        </button>

        {/* 4. Composed Combo */}
        <button
          type="button"
          onClick={() => setChartType("combo")}
          className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
            chartType === "combo"
              ? "bg-[#F5E086] text-[#24332D] shadow"
              : "text-white/70 hover:text-white hover:bg-white/5"
          }`}
          title="Dual axis: Orders (Bars) + Revenue (Line)"
        >
          <Split className="w-3.5 h-3.5" />
          <span>Combo (Orders + ₹)</span>
        </button>

        {/* 5. Pie / Donut */}
        <button
          type="button"
          onClick={() => setChartType("pie")}
          className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
            chartType === "pie"
              ? "bg-[#F5E086] text-[#24332D] shadow"
              : "text-white/70 hover:text-white hover:bg-white/5"
          }`}
          title="Interval composition"
        >
          <PieChartIcon className="w-3.5 h-3.5" />
          <span>Pie Chart</span>
        </button>

        {/* 6. Histogram */}
        <button
          type="button"
          onClick={() => setChartType("histogram")}
          className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
            chartType === "histogram"
              ? "bg-[#F5E086] text-[#24332D] shadow"
              : "text-white/70 hover:text-white hover:bg-white/5"
          }`}
          title="Order bill size distribution buckets"
        >
          <BarChart3 className="w-3.5 h-3.5 text-sky-400" />
          <span>Histogram</span>
        </button>

        {/* 7. Pareto Chart */}
        <button
          type="button"
          onClick={() => setChartType("pareto")}
          className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
            chartType === "pareto"
              ? "bg-[#F5E086] text-[#24332D] shadow"
              : "text-white/70 hover:text-white hover:bg-white/5"
          }`}
          title="80/20 Rule: Descending revenue + cumulative % line"
        >
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <span>Pareto (80/20)</span>
        </button>

        {/* 8. Radar Chart */}
        <button
          type="button"
          onClick={() => setChartType("radar")}
          className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 ${
            chartType === "radar"
              ? "bg-[#F5E086] text-[#24332D] shadow"
              : "text-white/70 hover:text-white hover:bg-white/5"
          }`}
          title="360-degree operational vectors"
        >
          <Activity className="w-3.5 h-3.5 text-emerald-400" />
          <span>Radar Graph</span>
        </button>
      </div>

      {/* Snapshot badges */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3 rounded-2xl bg-[#1E2B25] border border-white/5">
          <span className="text-white/50 text-[10px] uppercase font-bold block">Scope Revenue</span>
          <span className="font-niea font-black text-xl text-[#F5E086] mt-0.5 block">
            ₹{totalPeriodRevenue.toLocaleString("en-IN")}
          </span>
          <span className="text-[10px] text-emerald-400 mt-0.5 block">
            {timeSeries.length} active time intervals
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-[#1E2B25] border border-white/5">
          <span className="text-white/50 text-[10px] uppercase font-bold block">Total Orders</span>
          <span className="font-niea font-black text-xl text-white mt-0.5 block">
            {totalPeriodOrders}
          </span>
          <span className="text-[10px] text-white/50 mt-0.5 block">
            {(totalPeriodOrders / Math.max(timeSeries.length, 1)).toFixed(1)} orders / interval
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-[#1E2B25] border border-white/5">
          <span className="text-white/50 text-[10px] uppercase font-bold block">Peak Traffic Hour/Day</span>
          <span className="font-niea font-black text-xl text-amber-300 mt-0.5 block truncate">
            {peak ? peak.label : "—"}
          </span>
          <span className="text-[10px] text-amber-400/80 mt-0.5 block truncate">
            ₹{(peak ? peak.revenue : 0).toLocaleString("en-IN")} ({peak ? peak.ordersCount : 0} orders)
          </span>
        </div>

        <div className="p-3 rounded-2xl bg-[#1E2B25] border border-white/5">
          <span className="text-white/50 text-[10px] uppercase font-bold block">Avg Order Value (AOV)</span>
          <span className="font-niea font-black text-xl text-emerald-300 mt-0.5 block">
            ₹{totalPeriodOrders > 0 ? Math.round(totalPeriodRevenue / totalPeriodOrders) : 0}
          </span>
          <span className="text-[10px] text-white/50 mt-0.5 block">Billed per customer</span>
        </div>
      </div>

      {/* Main Interactive Recharts Viewport */}
      <div className="w-full h-80 sm:h-96 bg-[#1A2520] p-2 sm:p-4 rounded-2xl border border-white/5 relative">
        <ResponsiveContainer width="100%" height="100%">
          {/* 1. TRENDS (AREA) */}
          {chartType === "trend" ? (
            <AreaChart data={timeSeries} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#F5E086" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#F5E086" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#38BDF8" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#38BDF8" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorUpi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#34D399" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#34D399" stopOpacity={0.0} />
                </linearGradient>
                <linearGradient id="colorCash" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FBBF24" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#FBBF24" stopOpacity={0.0} />
                </linearGradient>
              </defs>

              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} tickFormatter={formatYAxis} />
              <Tooltip content={<CustomTooltip />} />

              {metricMode === "revenue" && (
                <Area
                  type="monotone"
                  dataKey="revenue"
                  name="Gross Revenue"
                  stroke="#F5E086"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              )}

              {metricMode === "orders" && (
                <Area
                  type="monotone"
                  dataKey="ordersCount"
                  name="Total Orders"
                  stroke="#38BDF8"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#colorOrders)"
                />
              )}

              {metricMode === "payments" && (
                <>
                  <Area type="monotone" dataKey="upiSales" name="UPI & QR" stackId="1" stroke="#34D399" fill="url(#colorUpi)" />
                  <Area type="monotone" dataKey="cashSales" name="Cash" stackId="1" stroke="#FBBF24" fill="url(#colorCash)" />
                  <Area type="monotone" dataKey="cardSales" name="Card / POS" stackId="1" stroke="#C084FC" fill="#C084FC" fillOpacity={0.3} />
                </>
              )}
            </AreaChart>
          ) : chartType === "bars" ? (
            /* 2. BARS */
            <BarChart data={timeSeries} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} tickFormatter={formatYAxis} />
              <Tooltip content={<CustomTooltip />} />

              {metricMode === "revenue" && (
                <Bar dataKey="revenue" name="Gross Revenue" fill="#F5E086" radius={[4, 4, 0, 0]} />
              )}
              {metricMode === "orders" && (
                <Bar dataKey="ordersCount" name="Total Orders" fill="#38BDF8" radius={[4, 4, 0, 0]} />
              )}
              {metricMode === "payments" && (
                <>
                  <Bar dataKey="upiSales" name="UPI" stackId="a" fill="#34D399" />
                  <Bar dataKey="cashSales" name="Cash" stackId="a" fill="#FBBF24" />
                  <Bar dataKey="cardSales" name="Card" stackId="a" fill="#C084FC" radius={[4, 4, 0, 0]} />
                </>
              )}
            </BarChart>
          ) : chartType === "line" ? (
            /* 3. MULTI-LINE */
            <LineChart data={timeSeries} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} />
              <YAxis stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} tickFormatter={formatYAxis} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "11px", color: "white" }} />
              <Line type="monotone" dataKey="revenue" name="Gross Revenue (₹)" stroke="#F5E086" strokeWidth={2.5} dot={{ r: 3 }} />
              <Line type="monotone" dataKey="netSales" name="Net F&B Sales (₹)" stroke="#34D399" strokeWidth={2} dot={{ r: 2 }} />
              <Line type="monotone" dataKey="upiSales" name="UPI Collections (₹)" stroke="#38BDF8" strokeWidth={1.5} strokeDasharray="4 4" />
            </LineChart>
          ) : chartType === "combo" ? (
            /* 4. COMBO (BARS FOR ORDERS + LINE FOR REVENUE) */
            <ComposedChart data={timeSeries} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" stroke="rgba(255,255,255,0.4)" fontSize={10} tickLine={false} />
              <YAxis yAxisId="left" stroke="#38BDF8" fontSize={10} tickLine={false} />
              <YAxis yAxisId="right" orientation="right" stroke="#F5E086" fontSize={10} tickLine={false} tickFormatter={formatYAxis} />
              <Tooltip content={<CustomTooltip />} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <Bar yAxisId="left" dataKey="ordersCount" name="Orders Volume (#)" fill="#38BDF8" radius={[4, 4, 0, 0]} opacity={0.8} />
              <Line yAxisId="right" type="monotone" dataKey="revenue" name="Gross Revenue (₹)" stroke="#F5E086" strokeWidth={3} dot={{ r: 3 }} />
            </ComposedChart>
          ) : chartType === "pie" ? (
            /* 5. PIE / DONUT */
            <PieChart>
              <Tooltip
                formatter={(val: any, name: any) => [
                  `₹${Number(val || 0).toLocaleString("en-IN")}`,
                  name,
                ]}
                contentStyle={{
                  backgroundColor: "#1A2520",
                  borderRadius: "16px",
                  border: "1px solid rgba(255,255,255,0.15)",
                  color: "#fff",
                  fontSize: "12px",
                }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", color: "white" }} />
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={65}
                outerRadius={105}
                paddingAngle={3}
                label={({ name, percent }: any) => `${name} (${(percent * 100).toFixed(0)}%)`}
                labelLine={false}
              >
                {pieData.map((_, index) => (
                  <Cell key={`cell_${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                ))}
              </Pie>
            </PieChart>
          ) : chartType === "histogram" ? (
            /* 6. HISTOGRAM (ORDER TICKET SIZES) */
            <BarChart data={histogramData} margin={{ top: 15, right: 10, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="rangeLabel" stroke="rgba(255,255,255,0.5)" fontSize={11} tickLine={false} />
              <YAxis stroke="rgba(255,255,255,0.5)" fontSize={11} tickLine={false} />
              <Tooltip content={<HistogramTooltip />} />
              <Bar dataKey="orderCount" name="Orders Count" fill="#38BDF8" radius={[6, 6, 0, 0]}>
                {histogramData.map((_, idx) => (
                  <Cell key={`hist_${idx}`} fill={PIE_COLORS[idx % PIE_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          ) : chartType === "pareto" ? (
            /* 7. PARETO (80/20 LAW: REVENUE DESCENDING + CUMULATIVE %) */
            <ComposedChart data={paretoData} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="label" stroke="rgba(255,255,255,0.5)" fontSize={10} tickLine={false} />
              <YAxis yAxisId="left" stroke="#F5E086" fontSize={10} tickLine={false} tickFormatter={formatYAxis} />
              <YAxis yAxisId="right" orientation="right" domain={[0, 100]} stroke="#FB923C" fontSize={10} tickLine={false} tickFormatter={(v) => `${v}%`} />
              <Tooltip content={<ParetoTooltip />} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
              <ReferenceLine yAxisId="right" y={80} stroke="#EF4444" strokeDasharray="3 3" label={{ value: "80% Cutoff", fill: "#EF4444", fontSize: 10 }} />
              <Bar yAxisId="left" dataKey="revenue" name="Interval Revenue (₹)" fill="#F5E086" radius={[4, 4, 0, 0]} opacity={0.9} />
              <Line yAxisId="right" type="monotone" dataKey="cumulativePercent" name="Cumulative %" stroke="#FB923C" strokeWidth={2.5} dot={{ r: 3 }} />
            </ComposedChart>
          ) : (
            /* 8. RADAR GRAPH */
            <RadarChart cx="50%" cy="50%" outerRadius={95} data={radarData}>
              <PolarGrid stroke="rgba(255,255,255,0.15)" />
              <PolarAngleAxis dataKey="subject" stroke="#F5E086" fontSize={10} />
              <PolarRadiusAxis stroke="rgba(255,255,255,0.3)" domain={[0, 100]} fontSize={8} />
              <Tooltip content={<RadarCustomTooltip />} />
              <Radar name="Cafe Current" dataKey="value" stroke="#34D399" fill="#34D399" fillOpacity={0.4} />
              <Radar name="Target Benchmark" dataKey="benchmark" stroke="#F5E086" fill="#F5E086" fillOpacity={0.15} />
              <Legend wrapperStyle={{ fontSize: "11px" }} />
            </RadarChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Interactive Helper Caption */}
      <div className="flex flex-wrap items-center justify-between text-[11px] text-white/50 pt-2 px-1">
        <span>
          {chartType === "trend" && "Displaying smooth volumetric sales area with monetary gradient fill."}
          {chartType === "bars" && "Displaying discrete interval columns for volume & revenue comparisons."}
          {chartType === "line" && "Displaying high-definition spline curves for sales vs net food collections."}
          {chartType === "combo" && "Dual Y-axes: Left axis tracks order frequency (#), Right axis tracks billing (₹)."}
          {chartType === "pie" && "Radial interval composition representing gross share across time buckets."}
          {chartType === "histogram" && "Frequency distribution of guest checkout ticket sizes from <₹300 to >₹1,200."}
          {chartType === "pareto" && "80/20 Pareto principle: Identifies the top 20% high-velocity hours/days generating 80% of revenue."}
          {chartType === "radar" && "360-degree operational polygon comparing fulfillment, dine-in share, takeaways & digital payments."}
        </span>
        <span className="text-[#F5E086] font-semibold">100% Genuine POS & Online Data</span>
      </div>
    </div>
  );
});
