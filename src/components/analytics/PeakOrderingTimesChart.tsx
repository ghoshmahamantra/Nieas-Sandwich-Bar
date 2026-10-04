import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  BarChart,
  Bar,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
  Cell,
} from "recharts";
import {
  Clock,
  Users,
  Flame,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  UtensilsCrossed,
  Sliders,
  Sparkles,
  Info,
  Layers,
  ArrowRight,
} from "lucide-react";
import { OrderRecord } from "../../types/niea";

export interface HourlyProductionPoint {
  hour: number;
  hourLabel: string;
  timeRange: string;
  ordersCount: number;
  sandwichesCount: number;
  revenue: number;
  avgWaitMinutes: number;
  dineInOrders: number;
  takeawayOrders: number;
  griddleUtilizationPct: number;
  rushTier: "low" | "steady" | "peak" | "surge";
  recommendedStaff: {
    total: number;
    grillArtisans: number;
    prepChefs: number;
    frontExpo: number;
    actionNote: string;
  };
}

interface PeakOrderingTimesChartProps {
  orders: OrderRecord[];
  className?: string;
}

export type DayFilterOption = "all" | "weekends" | "weekdays" | "today";
export type VisualizationMode = "velocity" | "staffing" | "griddle";

export const PeakOrderingTimesChart: React.FC<PeakOrderingTimesChartProps> = ({
  orders,
  className = "",
}) => {
  const [dayFilter, setDayFilter] = useState<DayFilterOption>("all");
  const [viewMode, setViewMode] = useState<VisualizationMode>("velocity");
  const [griddleCount, setGriddleCount] = useState<number>(2); // 2 standard commercial cast-iron griddles (8 sandwiches each = 16 simultaneous)

  // Operating cafe hours (10:00 AM to 10:00 PM)
  const OPERATING_HOURS = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21];

  // Filter orders by day selection
  const filteredOrders = useMemo(() => {
    const todayStr = new Date().toISOString().slice(0, 10);

    return orders.filter((o) => {
      const orderDate = new Date(o.createdAt);
      if (isNaN(orderDate.getTime())) return false;

      if (dayFilter === "today") {
        return o.createdAt.startsWith(todayStr);
      }

      const dayOfWeek = orderDate.getDay(); // 0 = Sun, 6 = Sat, 5 = Fri
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 5 || dayOfWeek === 6; // Fri, Sat, Sun

      if (dayFilter === "weekends") {
        return isWeekend;
      }
      if (dayFilter === "weekdays") {
        return !isWeekend;
      }
      return true;
    });
  }, [orders, dayFilter]);

  // Compute hourly metrics & staffing recommendations
  const hourlyData = useMemo<HourlyProductionPoint[]>(() => {
    // Determine number of unique days represented in filtered set to compute true hourly averages
    const uniqueDates = new Set(
      filteredOrders.map((o) => o.createdAt.slice(0, 10)).filter(Boolean)
    );
    const daysDivisor = Math.max(1, uniqueDates.size);

    return OPERATING_HOURS.map((hr) => {
      const hrOrders = filteredOrders.filter((o) => {
        const d = new Date(o.createdAt);
        return d.getHours() === hr;
      });

      // Total sandwiches across these orders
      let totalSandwiches = 0;
      let totalRev = 0;
      let dineIn = 0;
      let takeaway = 0;
      let totalWaitMins = 0;

      hrOrders.forEach((o) => {
        totalRev += Number(o.grandTotal) || 0;
        totalWaitMins += Number(o.estimatedWaitingMinutes) || 25;
        if (o.orderType === "dine-in") dineIn++;
        else takeaway++;

        if (Array.isArray(o.items)) {
          o.items.forEach((it) => {
            totalSandwiches += Number(it.quantity) || 1;
          });
        } else {
          totalSandwiches += 2; // conservative average per order
        }
      });

      // Normalize by days divisor to get hourly average rate
      const avgOrders = Math.round((hrOrders.length / daysDivisor) * 10) / 10;
      const avgSandwiches = Math.round((totalSandwiches / daysDivisor) * 10) / 10;
      const avgRevenue = Math.round(totalRev / daysDivisor);
      const avgWait = hrOrders.length > 0 ? Math.round(totalWaitMins / hrOrders.length) : 15;

      // 1 Griddle has 8 simultaneous sourdough slots. Each toasting cycle takes ~5-6 minutes.
      // Maximum theoretical output = (griddleCount * 8) * (60 / 5.5) ~ griddleCount * 87 sandwiches/hr,
      // but realistic practical peak throughput with loading, buttering, and plating is ~20 sandwiches/hr per griddle.
      const practicalMaxCapacity = griddleCount * 18;
      const griddleUtil = Math.min(100, Math.round((avgSandwiches / practicalMaxCapacity) * 100));

      // Classify Rush Tier based on sandwich velocity
      let rushTier: "low" | "steady" | "peak" | "surge" = "low";
      if (avgSandwiches >= 28) rushTier = "surge";
      else if (avgSandwiches >= 18) rushTier = "peak";
      else if (avgSandwiches >= 10) rushTier = "steady";
      else rushTier = "low";

      // Calculate Staffing Recommendation for artisan sandwich production
      // Formula based on production stages: Cast-Iron Toasting, Sourdough Prep/Assembly, and Counter/Expo.
      let grillArtisans = 1;
      let prepChefs = 1;
      let frontExpo = 1;
      let actionNote = "Standard prep rhythm";

      if (rushTier === "surge") {
        grillArtisans = 2; // 2 dedicated chefs handling both cast-iron griddles full-time
        prepChefs = 2;    // 1 slicing/buttering sourdough, 1 assembling fillings & gourmet cheeses
        frontExpo = 1;    // dedicated expeditor, KOT caller & barista
        actionNote = "Peak surge: activate 2nd cast-iron skillet, prep 40 bread slices beforehand";
      } else if (rushTier === "peak") {
        grillArtisans = 2; // 1 head toasting chef + 1 griddle assist
        prepChefs = 1;    // continuous assembly
        frontExpo = 1;    // packing & counter service
        actionNote = "Lunch/Dinner peak: pre-portion Normandy butter & gruyère";
      } else if (rushTier === "steady") {
        grillArtisans = 1;
        prepChefs = 1;
        frontExpo = 1;
        actionNote = "Smooth artisan pacing: 1 on grill, 1 on prep & counter";
      } else {
        grillArtisans = 1;
        prepChefs = 0; // grill chef can prep during lull
        frontExpo = 1;
        actionNote = "Light shift: 1 artisan chef handles toasting & prep, 1 barista";
      }

      const totalStaff = grillArtisans + prepChefs + frontExpo;

      const hrDisplay = hr === 12 ? "12 PM" : hr > 12 ? `${hr - 12} PM` : `${hr} AM`;
      const nextHr = hr + 1;
      const nextHrDisplay = nextHr === 12 ? "12 PM" : nextHr > 12 ? `${nextHr - 12} PM` : `${nextHr} AM`;

      return {
        hour: hr,
        hourLabel: hrDisplay,
        timeRange: `${hrDisplay} – ${nextHrDisplay}`,
        ordersCount: avgOrders,
        sandwichesCount: avgSandwiches,
        revenue: avgRevenue,
        avgWaitMinutes: avgWait,
        dineInOrders: Math.round((dineIn / daysDivisor) * 10) / 10,
        takeawayOrders: Math.round((takeaway / daysDivisor) * 10) / 10,
        griddleUtilizationPct: griddleUtil,
        rushTier,
        recommendedStaff: {
          total: totalStaff,
          grillArtisans,
          prepChefs,
          frontExpo,
          actionNote,
        },
      };
    });
  }, [filteredOrders, griddleCount]);

  // Key Peak Statistics
  const peakStats = useMemo(() => {
    let peakHour = hourlyData[0];
    let maxSandwiches = 0;
    let totalDailySandwiches = 0;
    let totalDailyOrders = 0;
    let peakStaff = 3;

    hourlyData.forEach((pt) => {
      totalDailySandwiches += pt.sandwichesCount;
      totalDailyOrders += pt.ordersCount;
      if (pt.sandwichesCount > maxSandwiches) {
        maxSandwiches = pt.sandwichesCount;
        peakHour = pt;
        peakStaff = pt.recommendedStaff.total;
      }
    });

    // Identify primary rush windows (Lunch vs Dinner)
    const lunchRush = hourlyData.filter((h) => h.hour >= 12 && h.hour <= 14);
    const dinnerRush = hourlyData.filter((h) => h.hour >= 19 && h.hour <= 21);

    const lunchPeakSandwiches = Math.max(...lunchRush.map((r) => r.sandwichesCount), 0);
    const dinnerPeakSandwiches = Math.max(...dinnerRush.map((r) => r.sandwichesCount), 0);

    return {
      peakHour,
      maxSandwiches,
      totalDailySandwiches: Math.round(totalDailySandwiches),
      totalDailyOrders: Math.round(totalDailyOrders),
      peakStaff,
      lunchPeakSandwiches,
      dinnerPeakSandwiches,
      griddleCapacity: griddleCount * 18,
    };
  }, [hourlyData, griddleCount]);

  // Color mapper based on rush tier
  const getBarColor = (tier: string) => {
    switch (tier) {
      case "surge":
        return "#EF4444"; // Red (Surge)
      case "peak":
        return "#F59E0B"; // Amber (Peak)
      case "steady":
        return "#10B981"; // Emerald (Steady)
      default:
        return "#3B82F6"; // Sky/Blue (Low)
    }
  };

  // Custom Rich Recharts Tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data: HourlyProductionPoint = payload[0].payload;
      return (
        <div className="bg-[#1C2822] border border-white/20 p-4 rounded-2xl shadow-2xl text-xs space-y-2.5 min-w-[260px] text-white">
          <div className="flex items-center justify-between border-b border-white/10 pb-2">
            <span className="font-bold text-sm text-[#F5E086] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>{data.timeRange}</span>
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                data.rushTier === "surge"
                  ? "bg-red-500/20 text-red-300 border border-red-500/30"
                  : data.rushTier === "peak"
                  ? "bg-amber-500/20 text-amber-300 border border-amber-500/30"
                  : data.rushTier === "steady"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/30"
                  : "bg-blue-500/20 text-blue-300 border border-blue-500/30"
              }`}
            >
              {data.rushTier} rush
            </span>
          </div>

          <div className="grid grid-cols-2 gap-2 text-white/80">
            <div>
              <div className="text-[10px] text-white/50">Sandwiches Toasted</div>
              <div className="font-mono font-bold text-base text-white">
                {data.sandwichesCount}{" "}
                <span className="text-[11px] text-white/60 font-normal">units/hr</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-white/50">Total Orders</div>
              <div className="font-mono font-bold text-base text-white">
                {data.ordersCount}{" "}
                <span className="text-[11px] text-white/60 font-normal">tickets</span>
              </div>
            </div>
            <div>
              <div className="text-[10px] text-white/50">Griddle Load</div>
              <div className="font-mono font-bold text-emerald-400">
                {data.griddleUtilizationPct}%
              </div>
            </div>
            <div>
              <div className="text-[10px] text-white/50">Est. Waiting Time</div>
              <div className="font-mono font-bold text-amber-300">
                {data.avgWaitMinutes} mins
              </div>
            </div>
          </div>

          {/* Recommended Staff Roster */}
          <div className="p-2.5 rounded-xl bg-black/40 border border-white/10 space-y-1.5 mt-1">
            <div className="flex items-center justify-between text-xs font-bold text-[#F5E086]">
              <span className="flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                <span>Recommended Staff:</span>
              </span>
              <span>{data.recommendedStaff.total} Team Members</span>
            </div>
            <div className="text-[11px] text-white/70 space-y-0.5 font-mono">
              <div>• {data.recommendedStaff.grillArtisans}x Cast-Iron Grill Master(s)</div>
              <div>• {data.recommendedStaff.prepChefs}x Sourdough Prep & Assembly</div>
              <div>• {data.recommendedStaff.frontExpo}x Counter / Barista & Expo</div>
            </div>
            <div className="text-[10px] text-amber-200/90 pt-1 border-t border-white/5 italic">
              💡 {data.recommendedStaff.actionNote}
            </div>
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div
      className={`rounded-3xl bg-[#1E2B25] border border-white/10 p-5 sm:p-6 shadow-xl space-y-6 ${className}`}
    >
      {/* Header with Title and Filtering Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 rounded-xl bg-amber-400/20 text-[#F5E086] border border-amber-400/30">
              <Flame className="w-4 h-4 text-amber-400" />
            </span>
            <div>
              <h3 className="font-niea font-bold text-lg text-[#F5E086] tracking-wide flex items-center gap-2">
                <span>Peak Ordering Times & Staffing Scaler</span>
                <span className="text-[10px] font-sans font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  Kitchen KDS Intelligence
                </span>
              </h3>
              <p className="text-xs text-white/60">
                Identify rush surges and scale griddle artisans for cultured sourdough toasting
              </p>
            </div>
          </div>
        </div>

        {/* Interactive Segmented Controls for Filter & Visualization */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Day of Week Filter */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setDayFilter("all")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                dayFilter === "all"
                  ? "bg-[#F5E086] text-[#24332D] shadow-sm"
                  : "text-white/70 hover:text-white"
              }`}
            >
              All Days Avg
            </button>
            <button
              type="button"
              onClick={() => setDayFilter("weekends")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                dayFilter === "weekends"
                  ? "bg-[#F5E086] text-[#24332D] shadow-sm"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Weekends (Fri–Sun)
            </button>
            <button
              type="button"
              onClick={() => setDayFilter("weekdays")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                dayFilter === "weekdays"
                  ? "bg-[#F5E086] text-[#24332D] shadow-sm"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Weekdays (Mon–Thu)
            </button>
            <button
              type="button"
              onClick={() => setDayFilter("today")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                dayFilter === "today"
                  ? "bg-[#F5E086] text-[#24332D] shadow-sm"
                  : "text-white/70 hover:text-white"
              }`}
            >
              Today Live
            </button>
          </div>

          {/* Perspective View Mode */}
          <div className="flex items-center gap-1 bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setViewMode("velocity")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1 ${
                viewMode === "velocity"
                  ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <UtensilsCrossed className="w-3.5 h-3.5" />
              <span>Production Velocity</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("staffing")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1 ${
                viewMode === "staffing"
                  ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Staffing Matrix</span>
            </button>
            <button
              type="button"
              onClick={() => setViewMode("griddle")}
              className={`px-2.5 py-1 rounded-lg font-semibold transition flex items-center gap-1 ${
                viewMode === "griddle"
                  ? "bg-sky-400/20 text-sky-300 border border-sky-400/30"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Griddle Load</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards: Rush Windows & Peak Capacity */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
        <div className="p-3.5 rounded-2xl bg-black/30 border border-white/10 space-y-1">
          <div className="text-[11px] text-white/50 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Peak Rush Window</span>
            <Flame className="w-3.5 h-3.5 text-amber-400" />
          </div>
          <div className="text-base sm:text-lg font-black text-[#F5E086]">
            {peakStats.peakHour.timeRange}
          </div>
          <div className="text-[11px] text-white/60">
            {peakStats.maxSandwiches} sandwiches/hr volume
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-black/30 border border-white/10 space-y-1">
          <div className="text-[11px] text-white/50 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Peak Staffing Level</span>
            <Users className="w-3.5 h-3.5 text-emerald-400" />
          </div>
          <div className="text-base sm:text-lg font-black text-emerald-300">
            {peakStats.peakStaff} Team Members
          </div>
          <div className="text-[11px] text-white/60">
            2 Grill, 1-2 Prep, 1 Front Barista
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-black/30 border border-white/10 space-y-1">
          <div className="text-[11px] text-white/50 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Lunch vs Dinner Peak</span>
            <TrendingUp className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="text-base sm:text-lg font-black text-sky-300">
            {peakStats.lunchPeakSandwiches} vs {peakStats.dinnerPeakSandwiches}
          </div>
          <div className="text-[11px] text-white/60">
            Sandwiches/hr (Lunch/Dinner)
          </div>
        </div>

        <div className="p-3.5 rounded-2xl bg-black/30 border border-white/10 space-y-1">
          <div className="text-[11px] text-white/50 font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Griddle Station Capacity</span>
            <div className="flex items-center gap-1 text-[10px] text-white/60">
              <button
                type="button"
                onClick={() => setGriddleCount(Math.max(1, griddleCount - 1))}
                className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white font-bold"
                title="Decrease active griddles"
              >
                -
              </button>
              <span className="font-mono text-white font-bold">{griddleCount}</span>
              <button
                type="button"
                onClick={() => setGriddleCount(Math.min(4, griddleCount + 1))}
                className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white font-bold"
                title="Increase active griddles"
              >
                +
              </button>
            </div>
          </div>
          <div className="text-base sm:text-lg font-black text-white">
            {peakStats.griddleCapacity}{" "}
            <span className="text-xs text-white/60 font-normal">toasties/hr max</span>
          </div>
          <div className="text-[11px] text-white/60">
            {griddleCount} cast-iron griddles (210°C)
          </div>
        </div>
      </div>

      {/* Main Recharts Visualization */}
      <div className="w-full h-80 pt-2">
        <ResponsiveContainer width="100%" height="100%">
          {viewMode === "velocity" ? (
            <ComposedChart
              data={hourlyData}
              margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis
                dataKey="hourLabel"
                stroke="rgba(255,255,255,0.5)"
                fontSize={11}
                tickLine={false}
              />
              <YAxis
                yAxisId="sandwiches"
                stroke="rgba(255,255,255,0.5)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                label={{
                  value: "Sandwiches / Hour",
                  angle: -90,
                  position: "insideLeft",
                  fill: "rgba(255,255,255,0.4)",
                  fontSize: 10,
                  offset: 15,
                }}
              />
              <YAxis
                yAxisId="orders"
                orientation="right"
                stroke="rgba(255,255,255,0.5)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 10, fontSize: 11 }}
              />

              {/* Threshold for Single Griddle Bottleneck (18 sandwiches/hr) */}
              <ReferenceLine
                yAxisId="sandwiches"
                y={18}
                stroke="#F59E0B"
                strokeDasharray="4 4"
                label={{
                  value: "1-Grill Max (18/hr)",
                  fill: "#F59E0B",
                  fontSize: 10,
                  position: "insideTopRight",
                }}
              />

              {/* Threshold for Dual Griddle Capacity */}
              <ReferenceLine
                yAxisId="sandwiches"
                y={griddleCount * 18}
                stroke="#10B981"
                strokeDasharray="3 3"
                label={{
                  value: `${griddleCount}-Grill Max (${griddleCount * 18}/hr)`,
                  fill: "#10B981",
                  fontSize: 10,
                  position: "insideTopLeft",
                }}
              />

              {/* Bar: Sandwiches toasting volume per hour */}
              <Bar
                yAxisId="sandwiches"
                dataKey="sandwichesCount"
                name="Sandwiches Toasted"
                radius={[6, 6, 0, 0]}
              >
                {hourlyData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getBarColor(entry.rushTier)}
                    opacity={0.85}
                  />
                ))}
              </Bar>

              {/* Line: Order tickets count */}
              <Line
                yAxisId="orders"
                type="monotone"
                dataKey="ordersCount"
                name="Order Tickets"
                stroke="#F5E086"
                strokeWidth={2.5}
                dot={{ r: 3, fill: "#F5E086" }}
                activeDot={{ r: 5 }}
              />
            </ComposedChart>
          ) : viewMode === "staffing" ? (
            /* Staffing Roster Perspective */
            <BarChart
              data={hourlyData}
              margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="hourLabel" stroke="rgba(255,255,255,0.5)" fontSize={11} tickLine={false} />
              <YAxis
                stroke="rgba(255,255,255,0.5)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
                ticks={[0, 1, 2, 3, 4, 5]}
                label={{
                  value: "Staff Count",
                  angle: -90,
                  position: "insideLeft",
                  fill: "rgba(255,255,255,0.4)",
                  fontSize: 10,
                  offset: 15,
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 10, fontSize: 11 }}
              />

              {/* Stacked Bars for Roles */}
              <Bar
                dataKey="recommendedStaff.grillArtisans"
                name="Grill Masters (Cast Iron)"
                stackId="staff"
                fill="#F59E0B"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="recommendedStaff.prepChefs"
                name="Sourdough Prep & Assembly"
                stackId="staff"
                fill="#10B981"
                radius={[0, 0, 0, 0]}
              />
              <Bar
                dataKey="recommendedStaff.frontExpo"
                name="Counter Barista & Expo"
                stackId="staff"
                fill="#38BDF8"
                radius={[6, 6, 0, 0]}
              />
            </BarChart>
          ) : (
            /* Griddle Utilization & Wait Time Curve */
            <ComposedChart
              data={hourlyData}
              margin={{ top: 10, right: 15, left: -10, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" vertical={false} />
              <XAxis dataKey="hourLabel" stroke="rgba(255,255,255,0.5)" fontSize={11} tickLine={false} />
              <YAxis
                yAxisId="util"
                domain={[0, 100]}
                unit="%"
                stroke="rgba(255,255,255,0.5)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                yAxisId="wait"
                orientation="right"
                unit="m"
                stroke="rgba(255,255,255,0.5)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Legend
                verticalAlign="top"
                align="right"
                wrapperStyle={{ paddingBottom: 10, fontSize: 11 }}
              />
              <Area
                yAxisId="util"
                type="monotone"
                dataKey="griddleUtilizationPct"
                name="Griddle Utilization %"
                stroke="#10B981"
                fill="url(#griddleGradient)"
                fillOpacity={0.25}
              />
              <Line
                yAxisId="wait"
                type="monotone"
                dataKey="avgWaitMinutes"
                name="Customer Wait Time (mins)"
                stroke="#F5E086"
                strokeWidth={2}
                dot={{ r: 3, fill: "#F5E086" }}
              />
              <defs>
                <linearGradient id="griddleGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#10B981" stopOpacity={0.6} />
                  <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                </linearGradient>
              </defs>
            </ComposedChart>
          )}
        </ResponsiveContainer>
      </div>

      {/* Legend & Rush Category Indicators */}
      <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-[11px] text-white/70 border-t border-white/5">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
            <span>Surge (28+ toasties/hr) • 4-5 Staff</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span>Peak Rush (18-27/hr) • 3-4 Staff</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span>Steady (10-17/hr) • 2-3 Staff</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
            <span>Low (1-9/hr) • 1-2 Staff</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 text-white/50">
          <Info className="w-3.5 h-3.5 text-amber-400" />
          <span>Recommended staffing scales to eliminate KDS queue bottlenecks</span>
        </div>
      </div>

      {/* Production Roster & Operational Strategy Schedule Matrix */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <h4 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Users className="w-3.5 h-3.5 text-[#F5E086]" />
            <span>Optimal Artisan Sandwich Staffing Roster</span>
          </h4>
          <span className="text-[11px] text-white/50">
            Based on {filteredOrders.length} analyzed orders
          </span>
        </div>

        <div className="overflow-x-auto no-scrollbar rounded-2xl border border-white/10 bg-black/20">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-white/10 bg-white/5 text-white/60 font-semibold text-[11px]">
                <th className="py-2.5 px-3.5">Time Window</th>
                <th className="py-2.5 px-3.5">Traffic Rush Level</th>
                <th className="py-2.5 px-3.5">Volume (Hourly Avg)</th>
                <th className="py-2.5 px-3.5">Total Staff</th>
                <th className="py-2.5 px-3.5">Role Allocations</th>
                <th className="py-2.5 px-3.5">Artisan Kitchen Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-white/80">
              {hourlyData.map((pt) => (
                <tr
                  key={pt.hour}
                  className={`hover:bg-white/5 transition ${
                    pt.rushTier === "surge"
                      ? "bg-red-500/5 font-semibold"
                      : pt.rushTier === "peak"
                      ? "bg-amber-500/5"
                      : ""
                  }`}
                >
                  <td className="py-2.5 px-3.5 font-mono font-bold text-white whitespace-nowrap">
                    {pt.timeRange}
                  </td>
                  <td className="py-2.5 px-3.5 whitespace-nowrap">
                    <span
                      className={`inline-flex items-center gap-1.5 text-[11px] font-bold ${
                        pt.rushTier === "surge"
                          ? "text-red-400"
                          : pt.rushTier === "peak"
                          ? "text-amber-400"
                          : pt.rushTier === "steady"
                          ? "text-emerald-400"
                          : "text-blue-400"
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          pt.rushTier === "surge"
                            ? "bg-red-400 animate-pulse"
                            : pt.rushTier === "peak"
                            ? "bg-amber-400"
                            : pt.rushTier === "steady"
                            ? "bg-emerald-400"
                            : "bg-blue-400"
                        }`}
                      />
                      <span>
                        {pt.rushTier === "surge"
                          ? "Surge 🔥"
                          : pt.rushTier === "peak"
                          ? "Peak Rush"
                          : pt.rushTier === "steady"
                          ? "Steady Flow"
                          : "Casual / Prep"}
                      </span>
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 whitespace-nowrap font-mono text-[11px]">
                    <span className="text-white font-bold">{pt.sandwichesCount}</span> toasties ·{" "}
                    <span className="text-white/60">{pt.ordersCount} tickets</span>
                  </td>
                  <td className="py-2.5 px-3.5 whitespace-nowrap">
                    <span className="px-2 py-0.5 rounded-lg bg-white/10 text-[#F5E086] font-mono font-bold text-xs border border-white/10">
                      {pt.recommendedStaff.total} Staff
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 whitespace-nowrap text-[11px] text-white/70">
                    <span className="text-amber-300 font-semibold">
                      {pt.recommendedStaff.grillArtisans} Grill
                    </span>
                    {" · "}
                    <span className="text-emerald-300 font-semibold">
                      {pt.recommendedStaff.prepChefs} Prep
                    </span>
                    {" · "}
                    <span className="text-sky-300 font-semibold">
                      {pt.recommendedStaff.frontExpo} Front
                    </span>
                  </td>
                  <td className="py-2.5 px-3.5 text-[11px] text-white/60 truncate max-w-[260px]">
                    {pt.recommendedStaff.actionNote}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
