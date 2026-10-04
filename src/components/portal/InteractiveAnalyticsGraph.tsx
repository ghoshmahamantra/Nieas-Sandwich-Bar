import React, { useState } from "react";
import {
  TrendingUp,
  BarChart3,
  Calendar,
  Layers,
  Sparkles,
  ArrowUpRight,
  Flame,
  CreditCard,
  DollarSign,
  ShoppingBag,
  PieChart as PieIcon,
  Clock,
  Info,
} from "lucide-react";
import { TimeSeriesPoint } from "../../utils/analyticsData";

interface InteractiveAnalyticsGraphProps {
  timeSeriesData: TimeSeriesPoint[];
  isSingleDay: boolean;
  periodLabel: string;
}

export const InteractiveAnalyticsGraph: React.FC<InteractiveAnalyticsGraphProps> = ({
  timeSeriesData,
  isSingleDay,
  periodLabel,
}) => {
  const [metric, setMetric] = useState<"sales" | "orders">("sales");
  const [viewType, setViewType] = useState<"area" | "bar" | "stacked_payment" | "channels">("area");
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  // If no data points, fallback
  const points = timeSeriesData.length > 0 ? timeSeriesData : [
    {
      key: "empty",
      label: "No Data",
      totalSales: 0,
      ordersCount: 0,
      successfulCount: 0,
      cancelledCount: 0,
      cashSales: 0,
      upiSales: 0,
      cardSales: 0,
      onlineSales: 0,
      dineInCount: 0,
      takeawayCount: 0,
      walkInCount: 0,
      onlineCount: 0,
    }
  ];

  // Aggregated totals for the selected period
  const totalPeriodSales = points.reduce((acc, p) => acc + p.totalSales, 0);
  const totalPeriodOrders = points.reduce((acc, p) => acc + p.ordersCount, 0);
  const totalUpiSales = points.reduce((acc, p) => acc + p.upiSales, 0);
  const totalCashSales = points.reduce((acc, p) => acc + p.cashSales, 0);
  const totalCardSales = points.reduce((acc, p) => acc + p.cardSales, 0);
  const avgTicket = totalPeriodOrders > 0 ? Math.round(totalPeriodSales / totalPeriodOrders) : 0;

  // Max values for chart scaling
  const maxSales = Math.max(...points.map((p) => p.totalSales), 1);
  const maxOrders = Math.max(...points.map((p) => p.ordersCount), 1);
  const maxValue = metric === "sales" ? maxSales : maxOrders;

  // Peak window calculation
  const peakPoint = points.reduce((max, p) => {
    const val = metric === "sales" ? p.totalSales : p.ordersCount;
    const maxVal = metric === "sales" ? max.totalSales : max.ordersCount;
    return val > maxVal ? p : max;
  }, points[0]);

  // Active hover point or fallback to latest point
  const activePoint = hoveredIndex !== null && points[hoveredIndex] ? points[hoveredIndex] : points[points.length - 1];

  // SVG dimensions
  const svgWidth = 860;
  const svgHeight = 240;
  const paddingX = 45;
  const paddingY = 28;
  const innerWidth = svgWidth - paddingX * 2;
  const innerHeight = svgHeight - paddingY * 2;

  // Compute coordinates for spline
  const coordinates = points.map((p, idx) => {
    const val = metric === "sales" ? p.totalSales : p.ordersCount;
    const x = paddingX + (idx / Math.max(points.length - 1, 1)) * innerWidth;
    const y = svgHeight - paddingY - (val / maxValue) * innerHeight;
    return { x, y, point: p, idx };
  });

  // Bezier smooth curve generator
  const createSmoothPath = (pts: { x: number; y: number }[]) => {
    if (pts.length === 0) return "";
    if (pts.length === 1) return `M ${pts[0].x} ${pts[0].y}`;
    let d = `M ${pts[0].x} ${pts[0].y}`;
    for (let i = 0; i < pts.length - 1; i++) {
      const p0 = pts[i];
      const p1 = pts[i + 1];
      const mx = (p0.x + p1.x) / 2;
      d += ` C ${mx} ${p0.y}, ${mx} ${p1.y}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const linePath = createSmoothPath(coordinates);
  const areaPath = coordinates.length > 0
    ? `${linePath} L ${coordinates[coordinates.length - 1].x} ${svgHeight - paddingY} L ${coordinates[0].x} ${svgHeight - paddingY} Z`
    : "";

  return (
    <div className="bg-[#24332D] p-5 sm:p-6 rounded-3xl border border-white/10 shadow-xl space-y-5">
      {/* Top Header & Chart Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="p-1.5 rounded-xl bg-[#F5E086]/10 text-[#F5E086]">
              <TrendingUp className="w-5 h-5" />
            </span>
            <h3 className="font-niea font-bold text-lg text-[#F5E086]">
              Interactive Velocity Graph
            </h3>
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              {isSingleDay ? "Hourly Timeline (11 AM – 10 PM)" : "Daily Trajectory"}
            </span>
          </div>
          <p className="text-xs text-white/60 mt-1">
            Analyzing {periodLabel} • Multi-channel sales & order volume
          </p>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Metric Selector */}
          <div className="flex rounded-xl bg-[#1A2520] p-1 border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setMetric("sales")}
              className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
                metric === "sales"
                  ? "bg-[#F5E086] text-[#24332D] shadow"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <DollarSign className="w-3.5 h-3.5" />
              <span>Money (₹)</span>
            </button>
            <button
              type="button"
              onClick={() => setMetric("orders")}
              className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
                metric === "orders"
                  ? "bg-[#F5E086] text-[#24332D] shadow"
                  : "text-white/60 hover:text-white"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Orders (#)</span>
            </button>
          </div>

          {/* Visualization Modes */}
          <div className="flex rounded-xl bg-[#1A2520] p-1 border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setViewType("area")}
              className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                viewType === "area"
                  ? "bg-[#374C44] text-[#F5E086] font-bold"
                  : "text-white/50 hover:text-white"
              }`}
              title="Smooth Curve"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Trend</span>
            </button>
            <button
              type="button"
              onClick={() => setViewType("bar")}
              className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                viewType === "bar"
                  ? "bg-[#374C44] text-[#F5E086] font-bold"
                  : "text-white/50 hover:text-white"
              }`}
              title="Single Bar"
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Bars</span>
            </button>
            <button
              type="button"
              onClick={() => setViewType("stacked_payment")}
              className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                viewType === "stacked_payment"
                  ? "bg-[#374C44] text-[#F5E086] font-bold"
                  : "text-white/50 hover:text-white"
              }`}
              title="Stacked Payment Breakdown"
            >
              <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
              <span className="hidden sm:inline">Payments Stack</span>
            </button>
            <button
              type="button"
              onClick={() => setViewType("channels")}
              className={`px-2.5 py-1 rounded-lg transition flex items-center gap-1 ${
                viewType === "channels"
                  ? "bg-[#374C44] text-[#F5E086] font-bold"
                  : "text-white/50 hover:text-white"
              }`}
              title="Channel Mix"
            >
              <Layers className="w-3.5 h-3.5 text-amber-300" />
              <span className="hidden sm:inline">Channels</span>
            </button>
          </div>
        </div>
      </div>

      {/* Snapshot Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-2xl bg-[#1E2B25] border border-white/5">
          <span className="text-white/50 text-[10px] uppercase font-bold block">
            Selected Period Revenue
          </span>
          <span className="font-niea font-black text-xl text-[#F5E086] mt-0.5 block">
            ₹{totalPeriodSales.toLocaleString("en-IN")}
          </span>
          <span className="text-[10px] text-emerald-400 flex items-center gap-0.5 mt-0.5 font-semibold">
            <ArrowUpRight className="w-3 h-3" />
            {points.length} {isSingleDay ? "hourly windows" : "days tracked"}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#1E2B25] border border-white/5">
          <span className="text-white/50 text-[10px] uppercase font-bold block">Total Orders</span>
          <span className="font-niea font-black text-xl text-white mt-0.5 block">
            {totalPeriodOrders}
          </span>
          <span className="text-[10px] text-white/50 mt-0.5 block">
            {isSingleDay
              ? `${(totalPeriodOrders / Math.max(points.length, 1)).toFixed(1)} orders / hour`
              : `${Math.round(totalPeriodOrders / Math.max(points.length, 1))} orders / day`}
          </span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#1E2B25] border border-white/5">
          <span className="text-white/50 text-[10px] uppercase font-bold block">Avg Order Value (AOV)</span>
          <span className="font-niea font-black text-xl text-emerald-300 mt-0.5 block">
            ₹{avgTicket}
          </span>
          <span className="text-[10px] text-white/50 mt-0.5 block">Per completed transaction</span>
        </div>

        <div className="p-3.5 rounded-2xl bg-[#1E2B25] border border-white/5">
          <span className="text-white/50 text-[10px] uppercase font-bold block">Peak Velocity Point</span>
          <span className="font-niea font-black text-xl text-amber-300 mt-0.5 block truncate">
            {peakPoint ? peakPoint.label : "—"}
          </span>
          <span className="text-[10px] text-amber-400/80 mt-0.5 block truncate">
            ₹{(peakPoint ? peakPoint.totalSales : 0).toLocaleString("en-IN")} ({peakPoint ? peakPoint.ordersCount : 0} orders)
          </span>
        </div>
      </div>

      {/* Main Graph Visualization Surface */}
      <div className="relative bg-[#1A2520] p-4 rounded-2xl border border-white/5 overflow-hidden">
        {/* Dynamic Tooltip on Hover */}
        {activePoint && (
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 mb-2 border-b border-white/10 text-xs">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-[#F5E086]" />
              <strong className="text-[#F5E086] text-sm">{activePoint.label}</strong>
              {activePoint.subLabel && (
                <span className="text-white/50 text-[11px] font-mono">
                  ({activePoint.subLabel})
                </span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs font-mono">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-[#F5E086]" />
                <span className="text-white/60">Revenue:</span>
                <strong className="text-white">₹{activePoint.totalSales.toLocaleString("en-IN")}</strong>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                <span className="text-white/60">UPI:</span>
                <strong className="text-emerald-300">₹{activePoint.upiSales.toLocaleString("en-IN")}</strong>
              </div>

              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                <span className="text-white/60">Cash:</span>
                <strong className="text-amber-200">₹{activePoint.cashSales.toLocaleString("en-IN")}</strong>
              </div>

              {activePoint.cardSales > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                  <span className="text-white/60">Card:</span>
                  <strong className="text-purple-300">₹{activePoint.cardSales.toLocaleString("en-IN")}</strong>
                </div>
              )}

              <div className="flex items-center gap-1.5">
                <ShoppingBag className="w-3 h-3 text-white/50" />
                <span className="text-white/60">Orders:</span>
                <strong className="text-white">{activePoint.ordersCount}</strong>
                {activePoint.cancelledCount > 0 && (
                  <span className="text-rose-400 text-[10px]">({activePoint.cancelledCount} canc)</span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Responsive SVG Chart */}
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-56 select-none"
            preserveAspectRatio="none"
          >
            <defs>
              <linearGradient id="areaGradientPrimary" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#F5E086" stopOpacity="0.45" />
                <stop offset="50%" stopColor="#F5E086" stopOpacity="0.15" />
                <stop offset="100%" stopColor="#F5E086" stopOpacity="0.0" />
              </linearGradient>

              <linearGradient id="barUpiGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#34D399" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#059669" stopOpacity="0.8" />
              </linearGradient>

              <linearGradient id="barCashGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FBBF24" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#D97706" stopOpacity="0.75" />
              </linearGradient>

              <linearGradient id="barCardGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#C084FC" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#7E22CE" stopOpacity="0.75" />
              </linearGradient>

              <linearGradient id="channelDineInGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#0284C7" stopOpacity="0.75" />
              </linearGradient>

              <linearGradient id="channelTakeawayGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FB923C" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#EA580C" stopOpacity="0.75" />
              </linearGradient>
            </defs>

            {/* Horizontal Grid lines */}
            {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
              const y = svgHeight - paddingY - ratio * innerHeight;
              const labelValue = Math.round(ratio * maxValue);
              return (
                <g key={ratio}>
                  <line
                    x1={paddingX}
                    y1={y}
                    x2={svgWidth - paddingX}
                    y2={y}
                    stroke="rgba(255,255,255,0.08)"
                    strokeDasharray="3 3"
                  />
                  <text
                    x={paddingX - 8}
                    y={y + 3}
                    textAnchor="end"
                    fill="rgba(255,255,255,0.35)"
                    fontSize="9"
                    fontFamily="monospace"
                  >
                    {metric === "sales" ? `₹${labelValue >= 1000 ? `${(labelValue / 1000).toFixed(0)}k` : labelValue}` : labelValue}
                  </text>
                </g>
              );
            })}

            {/* VIEW MODE 1: Smooth Spline Curve + Area */}
            {viewType === "area" && (
              <>
                <path d={areaPath} fill="url(#areaGradientPrimary)" />
                <path
                  d={linePath}
                  fill="none"
                  stroke="#F5E086"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />

                {/* Interactive Points */}
                {coordinates.map((c) => {
                  const isHovered = hoveredIndex === c.idx;
                  return (
                    <g
                      key={c.idx}
                      onMouseEnter={() => setHoveredIndex(c.idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      className="cursor-pointer"
                    >
                      {/* Vertical crosshair line */}
                      {isHovered && (
                        <line
                          x1={c.x}
                          y1={paddingY}
                          x2={c.x}
                          y2={svgHeight - paddingY}
                          stroke="rgba(245, 224, 134, 0.6)"
                          strokeWidth="1.5"
                          strokeDasharray="2 2"
                        />
                      )}

                      {/* Ping ring */}
                      {isHovered && (
                        <circle
                          cx={c.x}
                          cy={c.y}
                          r="9"
                          fill="#F5E086"
                          fillOpacity="0.3"
                          className="animate-ping"
                        />
                      )}

                      {/* Dot */}
                      <circle
                        cx={c.x}
                        cy={c.y}
                        r={isHovered ? 6 : 4}
                        fill={isHovered ? "#F5E086" : "#24332D"}
                        stroke="#F5E086"
                        strokeWidth="2.5"
                        className="transition-all duration-200"
                      />

                      {/* Hover Hotspot */}
                      <rect
                        x={c.x - (innerWidth / Math.max(points.length, 1)) / 2}
                        y={paddingY}
                        width={innerWidth / Math.max(points.length, 1)}
                        height={innerHeight}
                        fill="transparent"
                      />
                    </g>
                  );
                })}
              </>
            )}

            {/* VIEW MODE 2: Single Metric Bar */}
            {viewType === "bar" && (
              <>
                {points.map((p, idx) => {
                  const val = metric === "sales" ? p.totalSales : p.ordersCount;
                  const ratio = val / maxValue;
                  const barH = ratio * innerHeight;
                  const barW = Math.max(10, Math.min(36, (innerWidth / points.length) - 8));
                  const x = paddingX + (idx / points.length) * innerWidth + ((innerWidth / points.length) - barW) / 2;
                  const y = svgHeight - paddingY - barH;
                  const isHovered = hoveredIndex === idx;

                  return (
                    <g
                      key={idx}
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      className="cursor-pointer"
                    >
                      <rect
                        x={x}
                        y={y}
                        width={barW}
                        height={Math.max(barH, 3)}
                        rx="4"
                        fill={isHovered ? "#F8E79B" : "#F5E086"}
                        opacity={isHovered ? 1 : 0.85}
                        className="transition-colors"
                      />
                      <rect
                        x={x - 2}
                        y={paddingY}
                        width={barW + 4}
                        height={innerHeight}
                        fill="transparent"
                      />
                    </g>
                  );
                })}
              </>
            )}

            {/* VIEW MODE 3: Stacked Payments (UPI bottom, Cash middle, Card top) */}
            {viewType === "stacked_payment" && (
              <>
                {points.map((p, idx) => {
                  const barW = Math.max(12, Math.min(40, (innerWidth / points.length) - 8));
                  const x = paddingX + (idx / points.length) * innerWidth + ((innerWidth / points.length) - barW) / 2;
                  const isHovered = hoveredIndex === idx;

                  // UPI segment
                  const upiRatio = (p.upiSales / maxValue);
                  const upiH = upiRatio * innerHeight;
                  const upiY = svgHeight - paddingY - upiH;

                  // Cash segment
                  const cashRatio = (p.cashSales / maxValue);
                  const cashH = cashRatio * innerHeight;
                  const cashY = upiY - cashH;

                  // Card segment
                  const cardRatio = ((p.cardSales || 0) / maxValue);
                  const cardH = cardRatio * innerHeight;
                  const cardY = cashY - cardH;

                  return (
                    <g
                      key={idx}
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      className="cursor-pointer"
                    >
                      {/* UPI */}
                      <rect
                        x={x}
                        y={upiY}
                        width={barW}
                        height={Math.max(upiH, 0)}
                        rx="3"
                        fill="url(#barUpiGrad)"
                        opacity={isHovered ? 1 : 0.85}
                      />
                      {/* Cash */}
                      <rect
                        x={x}
                        y={cashY}
                        width={barW}
                        height={Math.max(cashH, 0)}
                        rx="3"
                        fill="url(#barCashGrad)"
                        opacity={isHovered ? 1 : 0.85}
                      />
                      {/* Card */}
                      {p.cardSales > 0 && (
                        <rect
                          x={x}
                          y={cardY}
                          width={barW}
                          height={Math.max(cardH, 0)}
                          rx="3"
                          fill="url(#barCardGrad)"
                          opacity={isHovered ? 1 : 0.85}
                        />
                      )}
                      {/* Hover Hotspot */}
                      <rect
                        x={x - 2}
                        y={paddingY}
                        width={barW + 4}
                        height={innerHeight}
                        fill="transparent"
                      />
                    </g>
                  );
                })}
              </>
            )}

            {/* VIEW MODE 4: Channels Mix (Dine In vs Takeaway) */}
            {viewType === "channels" && (
              <>
                {points.map((p, idx) => {
                  const barW = Math.max(12, Math.min(40, (innerWidth / points.length) - 8));
                  const x = paddingX + (idx / points.length) * innerWidth + ((innerWidth / points.length) - barW) / 2;
                  const isHovered = hoveredIndex === idx;

                  // Dine In
                  const dineRatio = (p.dineInCount / (maxOrders || 1));
                  const dineH = dineRatio * innerHeight;
                  const dineY = svgHeight - paddingY - dineH;

                  // Takeaway
                  const takeRatio = (p.takeawayCount / (maxOrders || 1));
                  const takeH = takeRatio * innerHeight;
                  const takeY = dineY - takeH;

                  return (
                    <g
                      key={idx}
                      onMouseEnter={() => setHoveredIndex(idx)}
                      onMouseLeave={() => setHoveredIndex(null)}
                      className="cursor-pointer"
                    >
                      <rect
                        x={x}
                        y={dineY}
                        width={barW}
                        height={Math.max(dineH, 0)}
                        rx="3"
                        fill="url(#channelDineInGrad)"
                        opacity={isHovered ? 1 : 0.85}
                      />
                      <rect
                        x={x}
                        y={takeY}
                        width={barW}
                        height={Math.max(takeH, 0)}
                        rx="3"
                        fill="url(#channelTakeawayGrad)"
                        opacity={isHovered ? 1 : 0.85}
                      />
                      <rect
                        x={x - 2}
                        y={paddingY}
                        width={barW + 4}
                        height={innerHeight}
                        fill="transparent"
                      />
                    </g>
                  );
                })}
              </>
            )}

            {/* X-Axis Labels */}
            {points.map((p, idx) => {
              const x = paddingX + (idx / Math.max(points.length - 1, 1)) * innerWidth;
              const isHovered = hoveredIndex === idx;
              // If there are more than 15 points, show label every 2nd or 3rd to avoid overlap
              const shouldShowLabel = points.length <= 15 || idx % Math.ceil(points.length / 10) === 0 || idx === points.length - 1;

              if (!shouldShowLabel && !isHovered) return null;

              return (
                <text
                  key={idx}
                  x={x}
                  y={svgHeight - 6}
                  textAnchor="middle"
                  fill={isHovered ? "#F5E086" : "rgba(255,255,255,0.45)"}
                  fontWeight={isHovered ? "bold" : "normal"}
                  fontSize="9"
                  fontFamily="sans-serif"
                >
                  {p.label}
                </text>
              );
            })}
          </svg>
        </div>

        {/* Legend */}
        <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-3 border-t border-white/5 text-[11px] text-white/60">
          <div className="flex flex-wrap items-center gap-4">
            {viewType === "stacked_payment" ? (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" />
                  <span>UPI / QR Scan (₹{totalUpiSales.toLocaleString("en-IN")})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400" />
                  <span>Counter Cash (₹{totalCashSales.toLocaleString("en-IN")})</span>
                </div>
                {totalCardSales > 0 && (
                  <div className="flex items-center gap-1.5">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-400" />
                    <span>Card / POS (₹{totalCardSales.toLocaleString("en-IN")})</span>
                  </div>
                )}
              </>
            ) : viewType === "channels" ? (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-sky-400" />
                  <span>Dine-In Tables</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-orange-400" />
                  <span>Takeaway / Packaging</span>
                </div>
              </>
            ) : (
              <>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-[#F5E086]" />
                  <span>{metric === "sales" ? "Total Revenue Velocity" : "Total Order Count"}</span>
                </div>
                <div className="flex items-center gap-1.5 text-white/40">
                  <span>Hover any point to inspect exact hourly/daily breakdown</span>
                </div>
              </>
            )}
          </div>

          <div className="flex items-center gap-1.5 text-[#F5E086]">
            <Flame className="w-3.5 h-3.5" />
            <span>Peak Operational Windows: 1:30 PM - 3:30 PM & 8:00 PM - 9:30 PM</span>
          </div>
        </div>
      </div>
    </div>
  );
};
