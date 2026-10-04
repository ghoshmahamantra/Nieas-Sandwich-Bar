import React, { useState, useMemo } from "react";
import {
  Calendar,
  TrendingUp,
  Award,
  DollarSign,
  Percent,
  ShoppingBag,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Trash2,
  Sparkles,
  BarChart3,
  LineChart as LineChartIcon,
  CreditCard,
  Building2,
  Clock,
  Layers,
  ChevronRight,
  Receipt,
  RotateCcw,
  Zap,
} from "lucide-react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { OrderRecord, PosSalesRecord } from "../../types/niea";
import { OwnerFinanceConfig } from "../../types/ownerFinanceConfig";
import { computeDateComparison, COMPARISON_PALETTE } from "../../utils/comparisonEngine";
import { DateComparisonItem } from "../../types/comparisonTypes";

interface DateComparisonViewProps {
  allOrders: OrderRecord[];
  allPos: PosSalesRecord[];
  ownerConfig: OwnerFinanceConfig;
  onOpenCostConfig?: () => void;
}

export const DateComparisonView: React.FC<DateComparisonViewProps> = ({
  allOrders,
  allPos,
  ownerConfig,
  onOpenCostConfig,
}) => {
  const today = useMemo(() => new Date(), []);
  const todayStr = useMemo(() => today.toISOString().slice(0, 10), [today]);

  // Helper to format ISO date string
  const formatOffsetDate = (offsetDays: number) => {
    const d = new Date();
    d.setDate(d.getDate() - offsetDays);
    return d.toISOString().slice(0, 10);
  };

  // Initial selected dates (e.g. Past 3 days: Today, Yesterday, 2 days ago)
  const [selectedDates, setSelectedDates] = useState<string[]>([
    todayStr,
    formatOffsetDate(1),
    formatOffsetDate(2),
  ]);

  // Manager View Mode: Current Snapshot vs Historical Trend
  const [viewMode, setViewMode] = useState<"snapshot" | "trend">("snapshot");
  const [trendTab, setTrendTab] = useState<"intraday_pace" | "date_growth" | "hourly_rush">("intraday_pace");

  const [dateToAdd, setDateToAdd] = useState<string>(formatOffsetDate(3));
  const [activeChartTab, setActiveChartTab] = useState<"bars" | "hourly" | "orders_aov" | "payments">("bars");

  // Presets
  const applyPreset = (presetType: "last5" | "last3" | "today_yesterday" | "saturdays" | "weekend_clash") => {
    if (presetType === "last5") {
      setSelectedDates([
        todayStr,
        formatOffsetDate(1),
        formatOffsetDate(2),
        formatOffsetDate(3),
        formatOffsetDate(4),
      ]);
    } else if (presetType === "last3") {
      setSelectedDates([todayStr, formatOffsetDate(1), formatOffsetDate(2)]);
    } else if (presetType === "today_yesterday") {
      setSelectedDates([todayStr, formatOffsetDate(1)]);
    } else if (presetType === "saturdays") {
      // Find past 4 Saturdays
      const saturdays: string[] = [];
      const cursor = new Date();
      while (saturdays.length < 4 && cursor > new Date(Date.now() - 60 * 86400000)) {
        if (cursor.getDay() === 6) {
          saturdays.push(cursor.toISOString().slice(0, 10));
        }
        cursor.setDate(cursor.getDate() - 1);
      }
      if (saturdays.length >= 2) {
        setSelectedDates(saturdays.slice(0, 4));
      }
    } else if (presetType === "weekend_clash") {
      // Saturday vs Sunday
      const cursor = new Date();
      let sat = "";
      let sun = "";
      while ((!sat || !sun) && cursor > new Date(Date.now() - 30 * 86400000)) {
        if (cursor.getDay() === 6 && !sat) sat = cursor.toISOString().slice(0, 10);
        if (cursor.getDay() === 0 && !sun) sun = cursor.toISOString().slice(0, 10);
        cursor.setDate(cursor.getDate() - 1);
      }
      if (sat && sun) {
        setSelectedDates([sat, sun]);
      }
    }
  };

  const handleAddDate = () => {
    if (!dateToAdd) return;
    if (selectedDates.includes(dateToAdd)) return;
    if (selectedDates.length >= 5) return;
    setSelectedDates([...selectedDates, dateToAdd].sort().reverse());
  };

  const handleRemoveDate = (dt: string) => {
    if (selectedDates.length <= 2) return; // Keep at least 2 dates
    setSelectedDates(selectedDates.filter((d) => d !== dt));
  };

  // Compute master comparison result
  const comparison = useMemo(() => {
    return computeDateComparison(selectedDates, allOrders, allPos, ownerConfig);
  }, [selectedDates, allOrders, allPos, ownerConfig]);

  // Hourly Recharts Data format:
  // Array of hours with dynamic keys for each date
  const hourlyChartData = useMemo(() => {
    const hours = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
    return hours.map((hr) => {
      const hrLabel = hr === 12 ? "12 PM" : hr > 12 ? `${hr - 12} PM` : `${hr} AM`;
      const pt: any = { hourLabel: hrLabel };
      comparison.items.forEach((item) => {
        const found = item.hourlyTrajectory.find((h) => h.hour === hr);
        pt[item.shortLabel] = found ? found.revenue : 0;
        pt[`${item.shortLabel}_orders`] = found ? found.ordersCount : 0;
      });
      return pt;
    });
  }, [comparison]);

  // Chronologically sorted dates for sequence trend analysis
  const chronologicalDates = useMemo(() => {
    return [...comparison.items].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  }, [comparison.items]);

  // Cumulative Intraday Revenue Pace (11 AM to 10 PM)
  const cumulativePaceData = useMemo(() => {
    const hours = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
    const cumulatives: Record<string, number> = {};
    comparison.items.forEach((item) => {
      cumulatives[item.shortLabel] = 0;
    });

    return hours.map((hr) => {
      const hrLabel = hr === 12 ? "12 PM" : hr > 12 ? `${hr - 12} PM` : `${hr} AM`;
      const row: Record<string, any> = { hourLabel: hrLabel, hour: hr };
      comparison.items.forEach((item) => {
        const found = item.hourlyTrajectory.find((h) => h.hour === hr);
        const rev = found ? found.revenue : 0;
        cumulatives[item.shortLabel] += rev;
        row[item.shortLabel] = cumulatives[item.shortLabel];
        row[`${item.shortLabel}_hourly`] = rev;
      });
      return row;
    });
  }, [comparison]);

  // Multi-Date Sequence Growth dataset
  const dateSequenceData = useMemo(() => {
    let prevRev = 0;
    return chronologicalDates.map((item, idx) => {
      const growthPct = idx > 0 && prevRev > 0
        ? Number((((item.grossSales - prevRev) / prevRev) * 100).toFixed(1))
        : 0;
      prevRev = item.grossSales;
      return {
        date: item.shortLabel,
        fullDate: item.date,
        dayOfWeek: item.dayOfWeek,
        color: item.color,
        grossRevenue: item.grossSales,
        netFoodSales: item.netFoodSales,
        netProfit: item.netProfit,
        totalOrders: item.totalOrders,
        aov: Math.round(item.avgOrderValue),
        foodCostPercent: item.grossSales > 0 ? Number(((item.cogs / item.grossSales) * 100).toFixed(1)) : 0,
        growthPct,
      };
    });
  }, [chronologicalDates]);

  // Time-Series Trend summary statistics
  const dateTrendStats = useMemo(() => {
    if (chronologicalDates.length < 2) return null;
    const first = chronologicalDates[0];
    const last = chronologicalDates[chronologicalDates.length - 1];
    const revenueGrowth = first.grossSales > 0
      ? Number((((last.grossSales - first.grossSales) / first.grossSales) * 100).toFixed(1))
      : 0;
    const ordersGrowth = first.totalOrders > 0
      ? Number((((last.totalOrders - first.totalOrders) / first.totalOrders) * 100).toFixed(1))
      : 0;
    const profitGrowth = first.netProfit > 0
      ? Number((((last.netProfit - first.netProfit) / first.netProfit) * 100).toFixed(1))
      : 0;

    let peakHourlyVelocity = 0;
    let peakHourlyDate = "";
    let peakHourTime = "";
    comparison.items.forEach((item) => {
      item.hourlyTrajectory.forEach((h) => {
        if (h.revenue > peakHourlyVelocity) {
          peakHourlyVelocity = h.revenue;
          peakHourlyDate = item.shortLabel;
          peakHourTime = h.hour === 12 ? "12 PM" : h.hour > 12 ? `${h.hour - 12} PM` : `${h.hour} AM`;
        }
      });
    });

    return {
      first,
      last,
      revenueGrowth,
      ordersGrowth,
      profitGrowth,
      peakHourlyVelocity,
      peakHourlyDate,
      peakHourTime,
    };
  }, [chronologicalDates, comparison]);

  // Milestone Pace comparison dataset
  const milestonePaceData = useMemo(() => {
    const milestones = [
      { name: "Morning (11 AM - 1 PM)", hours: [11, 12, 13] },
      { name: "Lunch Rush (1 PM - 4 PM)", hours: [13, 14, 15, 16] },
      { name: "Afternoon Tea (4 PM - 7 PM)", hours: [16, 17, 18, 19] },
      { name: "Dinner Peak (7 PM - 10 PM)", hours: [19, 20, 21, 22] },
    ];

    return milestones.map((m) => {
      const row: Record<string, any> = { milestone: m.name };
      comparison.items.forEach((item) => {
        const sum = item.hourlyTrajectory
          .filter((h) => m.hours.includes(h.hour))
          .reduce((total, h) => total + h.revenue, 0);
        row[item.shortLabel] = sum;
      });
      return row;
    });
  }, [comparison]);

  // Format currency
  const formatRupees = (val: number) => {
    if (val >= 100000) return `₹${(val / 100000).toFixed(2)}L`;
    if (val >= 1000) return `₹${(val / 1000).toFixed(1)}k`;
    return `₹${val.toLocaleString("en-IN")}`;
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* 1. Header & Date Selection Bar */}
      <div className="bg-[#1E2B25] p-5 sm:p-6 rounded-3xl border border-white/10 shadow-xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="p-2 rounded-2xl bg-[#F5E086]/15 text-[#F5E086] border border-[#F5E086]/30">
                <Calendar className="w-5 h-5" />
              </span>
              <h3 className="font-niea font-bold text-xl text-[#F5E086]">
                Multi-Date Analytics & Performance Comparison
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F5E086]/20 text-[#F5E086] border border-[#F5E086]/30">
                Compare 2 to 5 Dates
              </span>
            </div>
            <p className="text-xs text-white/60 mt-1">
              Side-by-side analysis of Gross Revenue, Net Margin, Food COGS, Profits, Order Ticket (AOV), and Hourly Trajectory Curves.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-white/40 text-[11px] font-semibold mr-1">Presets:</span>
            <button
              type="button"
              onClick={() => applyPreset("last5")}
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/80 hover:text-white font-medium transition border border-white/5"
            >
              Last 5 Days
            </button>
            <button
              type="button"
              onClick={() => applyPreset("last3")}
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/80 hover:text-white font-medium transition border border-white/5"
            >
              Past 3 Days
            </button>
            <button
              type="button"
              onClick={() => applyPreset("today_yesterday")}
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/80 hover:text-white font-medium transition border border-white/5"
            >
              Today vs Yesterday
            </button>
            <button
              type="button"
              onClick={() => applyPreset("saturdays")}
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/80 hover:text-white font-medium transition border border-white/5"
            >
              Last 4 Saturdays
            </button>
            <button
              type="button"
              onClick={() => applyPreset("weekend_clash")}
              className="px-2.5 py-1.5 rounded-xl bg-[#F5E086]/20 text-[#F5E086] hover:bg-[#F5E086]/30 font-bold transition border border-[#F5E086]/30"
            >
              Sat vs Sun
            </button>
          </div>
        </div>

        {/* Active Selected Dates Pills & Add Date Picker */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#141C18] p-3 rounded-2xl border border-white/5">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-white/50 text-xs font-semibold">Comparing ({selectedDates.length}/5):</span>
            {comparison.items.map((item, idx) => (
              <div
                key={item.date}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1E2B25] border border-white/15 text-xs text-white shadow-sm"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="font-bold">{item.formattedDate}</span>
                <span className="text-white/40 text-[10px]">({item.dayOfWeek})</span>
                {selectedDates.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveDate(item.date)}
                    className="text-white/40 hover:text-rose-400 transition ml-1"
                    title="Remove date from comparison"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add Date Input */}
          {selectedDates.length < 5 && (
            <div className="flex items-center gap-2 text-xs">
              <input
                type="date"
                value={dateToAdd}
                onChange={(e) => setDateToAdd(e.target.value)}
                className="bg-[#1E2B25] border border-white/15 rounded-xl px-2.5 py-1.5 text-white font-mono focus:outline-none focus:border-[#F5E086] text-xs"
              />
              <button
                type="button"
                onClick={handleAddDate}
                className="px-3 py-1.5 rounded-xl bg-[#F5E086] text-[#24332D] font-bold hover:bg-[#F8E79B] transition flex items-center gap-1 shadow"
              >
                <Plus className="w-3.5 h-3.5 stroke-[3]" />
                <span>Add Date</span>
              </button>
            </div>
          )}
        </div>
      </div>

      {/* MANAGER VIEW TOGGLE: CURRENT SNAPSHOT vs HISTORICAL TREND */}
      <div className="bg-[#1E2B25] p-3 sm:p-4 rounded-3xl border border-white/10 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`p-2 rounded-2xl ${viewMode === "snapshot" ? "bg-[#F5E086]/20 text-[#F5E086]" : "bg-emerald-500/20 text-emerald-300"}`}>
            {viewMode === "snapshot" ? <Layers className="w-5 h-5" /> : <TrendingUp className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase font-bold text-white/50 tracking-wider">Analysis Mode:</span>
              <span className="font-bold text-sm text-[#F5E086]">
                {viewMode === "snapshot" ? "Current Snapshot (Financial Ledger & Bars)" : "Historical Trend (Time-Series Growth)"}
              </span>
            </div>
            <p className="text-xs text-white/60">
              {viewMode === "snapshot"
                ? "Side-by-side date comparison matrix, gross/net margins, food COGS, and payment shares"
                : "Intraday cumulative revenue pace, multi-date growth curves, and hourly surge velocity"}
            </p>
          </div>
        </div>

        <div className="flex rounded-2xl bg-[#141C18] p-1 border border-white/10 self-start sm:self-auto shrink-0 shadow-inner">
          <button
            type="button"
            onClick={() => setViewMode("snapshot")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              viewMode === "snapshot"
                ? "bg-[#F5E086] text-[#24332D] shadow-md"
                : "text-white/70 hover:text-white"
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Current Snapshot</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode("trend")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              viewMode === "trend"
                ? "bg-[#F5E086] text-[#24332D] shadow-md"
                : "text-white/70 hover:text-white"
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
            <span>Historical Trend</span>
          </button>
        </div>
      </div>

      {viewMode === "snapshot" ? (
        <>
          {/* 2. Champions Podium & Winner Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 text-xs">
        {/* Top Gross Revenue */}
        <div className="bg-[#24332D] p-4 rounded-2xl border border-white/10 space-y-1.5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-white/60">
            <span className="font-bold uppercase tracking-wider text-[10px]">🏆 Top Gross Revenue</span>
            <Award className="w-4 h-4 text-[#F5E086]" />
          </div>
          <div className="font-niea font-black text-xl text-[#F5E086]">
            {formatRupees(comparison.highestRevenueDate.grossSales)}
          </div>
          <div className="text-[11px] font-bold text-white flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: comparison.highestRevenueDate.color }}
            />
            <span>{comparison.highestRevenueDate.formattedDate}</span>
          </div>
          <span className="text-[10px] text-white/40 block">
            {comparison.highestRevenueDate.totalOrders} total orders placed
          </span>
        </div>

        {/* Highest Net Profit */}
        <div className="bg-[#24332D] p-4 rounded-2xl border border-white/10 space-y-1.5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-white/60">
            <span className="font-bold uppercase tracking-wider text-[10px]">💰 Best Net Profit</span>
            <DollarSign className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-niea font-black text-xl text-emerald-400">
            {formatRupees(comparison.highestNetProfitDate.netProfit)}
          </div>
          <div className="text-[11px] font-bold text-white flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: comparison.highestNetProfitDate.color }}
            />
            <span>{comparison.highestNetProfitDate.formattedDate}</span>
          </div>
          <span className="text-[10px] text-emerald-300/80 block">
            {comparison.highestNetProfitDate.netProfitMarginPercent}% pure net margin
          </span>
        </div>

        {/* Highest Profit Margin % */}
        <div className="bg-[#24332D] p-4 rounded-2xl border border-white/10 space-y-1.5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-white/60">
            <span className="font-bold uppercase tracking-wider text-[10px]">🎯 Highest Margin %</span>
            <Percent className="w-4 h-4 text-sky-400" />
          </div>
          <div className="font-niea font-black text-xl text-sky-300">
            {comparison.highestMarginDate.netProfitMarginPercent}%
          </div>
          <div className="text-[11px] font-bold text-white flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: comparison.highestMarginDate.color }}
            />
            <span>{comparison.highestMarginDate.formattedDate}</span>
          </div>
          <span className="text-[10px] text-white/40 block">
            Lowest relative waste & platform fees
          </span>
        </div>

        {/* Most Orders Volume */}
        <div className="bg-[#24332D] p-4 rounded-2xl border border-white/10 space-y-1.5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-white/60">
            <span className="font-bold uppercase tracking-wider text-[10px]">🛒 Highest Volume</span>
            <ShoppingBag className="w-4 h-4 text-purple-400" />
          </div>
          <div className="font-niea font-black text-xl text-purple-300">
            {comparison.highestOrdersDate.totalOrders} Orders
          </div>
          <div className="text-[11px] font-bold text-white flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: comparison.highestOrdersDate.color }}
            />
            <span>{comparison.highestOrdersDate.formattedDate}</span>
          </div>
          <span className="text-[10px] text-white/40 block">
            {comparison.highestOrdersDate.successfulOrders} successfully served
          </span>
        </div>

        {/* Best AOV (Ticket Size) */}
        <div className="bg-[#24332D] p-4 rounded-2xl border border-white/10 space-y-1.5 shadow-lg relative overflow-hidden">
          <div className="flex items-center justify-between text-white/60">
            <span className="font-bold uppercase tracking-wider text-[10px]">⚡ Highest AOV</span>
            <Sparkles className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-niea font-black text-xl text-amber-300">
            ₹{comparison.highestAovDate.avgOrderValue}
          </div>
          <div className="text-[11px] font-bold text-white flex items-center gap-1">
            <span
              className="w-2 h-2 rounded-full"
              style={{ backgroundColor: comparison.highestAovDate.color }}
            />
            <span>{comparison.highestAovDate.formattedDate}</span>
          </div>
          <span className="text-[10px] text-white/40 block">
            Best basket size per customer
          </span>
        </div>
      </div>

      {/* 3. Visual Comparative Graphs */}
      <div className="bg-[#24332D] p-5 sm:p-6 rounded-3xl border border-white/10 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <h4 className="font-niea font-bold text-lg text-[#F5E086] flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-[#F5E086]" />
              Comparative Visual Trajectory
            </h4>
            <p className="text-xs text-white/60">
              Interactive side-by-side clustered bars and superimposed hourly sales curves
            </p>
          </div>

          {/* Chart View Mode Controls */}
          <div className="flex rounded-xl bg-[#1A2520] p-1 border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setActiveChartTab("bars")}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeChartTab === "bars"
                  ? "bg-[#F5E086] text-[#24332D] shadow"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5" />
              <span>Revenue & Profit Bars</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveChartTab("hourly")}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeChartTab === "hourly"
                  ? "bg-[#F5E086] text-[#24332D] shadow"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <LineChartIcon className="w-3.5 h-3.5" />
              <span>Hourly Rush Overlay</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveChartTab("orders_aov")}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeChartTab === "orders_aov"
                  ? "bg-[#F5E086] text-[#24332D] shadow"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>Orders & Ticket (AOV)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveChartTab("payments")}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeChartTab === "payments"
                  ? "bg-[#F5E086] text-[#24332D] shadow"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <CreditCard className="w-3.5 h-3.5" />
              <span>Payments Split</span>
            </button>
          </div>
        </div>

        {/* Viewport */}
        <div className="w-full h-80 bg-[#1A2520] p-3 sm:p-4 rounded-2xl border border-white/5">
          <ResponsiveContainer width="100%" height="100%">
            {activeChartTab === "bars" ? (
              /* 1. Clustered Bar: Gross Sales, Net Food Sales & Net Profit */
              <BarChart data={comparison.items} margin={{ top: 15, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="shortLabel" stroke="rgba(255,255,255,0.5)" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="rgba(255,255,255,0.5)"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1A2520",
                    borderRadius: "16px",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString("en-IN")}`, ""]}
                />
                <Legend wrapperStyle={{ fontSize: "11px", color: "white" }} />
                <Bar dataKey="grossSales" name="Gross Sales (₹)" fill="#F5E086" radius={[4, 4, 0, 0]} />
                <Bar dataKey="netFoodSales" name="Net F&B Food (₹)" fill="#38BDF8" radius={[4, 4, 0, 0]} />
                <Bar dataKey="netProfit" name="Net Store Profit (₹)" fill="#34D399" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : activeChartTab === "hourly" ? (
              /* 2. Hourly Rush Overlay (Multi-Line) */
              <LineChart data={hourlyChartData} margin={{ top: 15, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="hourLabel" stroke="rgba(255,255,255,0.5)" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="rgba(255,255,255,0.5)"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1A2520",
                    borderRadius: "16px",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  formatter={(val: any, name: any) => [`₹${Number(val).toLocaleString("en-IN")}`, name]}
                />
                <Legend wrapperStyle={{ fontSize: "11px", color: "white" }} />
                {comparison.items.map((item) => (
                  <Line
                    key={item.date}
                    type="monotone"
                    dataKey={item.shortLabel}
                    name={`${item.shortLabel} (${item.dayOfWeek.slice(0, 3)})`}
                    stroke={item.color}
                    strokeWidth={2.5}
                    dot={{ r: 3 }}
                  />
                ))}
              </LineChart>
            ) : activeChartTab === "orders_aov" ? (
              /* 3. Orders Volume vs AOV */
              <BarChart data={comparison.items} margin={{ top: 15, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="shortLabel" stroke="rgba(255,255,255,0.5)" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="rgba(255,255,255,0.5)"
                  fontSize={10}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1A2520",
                    borderRadius: "16px",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: "11px", color: "white" }} />
                <Bar dataKey="totalOrders" name="Orders Count (#)" fill="#C084FC" radius={[4, 4, 0, 0]} />
                <Bar dataKey="avgOrderValue" name="Avg Order Value (₹)" fill="#F5E086" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              /* 4. Payment Modes Stacked Bar */
              <BarChart data={comparison.items} margin={{ top: 15, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="shortLabel" stroke="rgba(255,255,255,0.5)" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="rgba(255,255,255,0.5)"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1A2520",
                    borderRadius: "16px",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  formatter={(val: any) => [`₹${Number(val).toLocaleString("en-IN")}`, ""]}
                />
                <Legend wrapperStyle={{ fontSize: "11px", color: "white" }} />
                <Bar dataKey="upiSales" name="UPI & QR (₹)" stackId="a" fill="#34D399" />
                <Bar dataKey="cashSales" name="Cash (₹)" stackId="a" fill="#FBBF24" />
                <Bar dataKey="cardSales" name="Card / POS (₹)" stackId="a" fill="#38BDF8" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Side-by-Side Date Performance Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${comparison.items.length} gap-4`}>
        {comparison.items.map((item) => {
          const isRevWinner = item.date === comparison.highestRevenueDate.date;
          const isProfitWinner = item.date === comparison.highestNetProfitDate.date;
          const isAovWinner = item.date === comparison.highestAovDate.date;

          return (
            <div
              key={item.date}
              className={`bg-[#24332D] p-5 rounded-3xl border transition shadow-xl space-y-4 relative ${
                isRevWinner ? "border-[#F5E086]/60 shadow-[#F5E086]/5" : "border-white/10"
              }`}
            >
              {/* Card Header */}
              <div className="flex items-center justify-between border-b border-white/10 pb-3">
                <div>
                  <div className="flex items-center gap-1.5">
                    <span
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    <h5 className="font-niea font-bold text-base text-white">
                      {item.formattedDate}
                    </h5>
                  </div>
                  <span className="text-[11px] text-white/50">{item.dayOfWeek}</span>
                </div>

                {/* Badges */}
                <div className="flex flex-col items-end gap-1">
                  {isRevWinner && (
                    <span className="px-2 py-0.5 rounded-full bg-[#F5E086]/20 text-[#F5E086] text-[9px] font-black border border-[#F5E086]/30">
                      🏆 Revenue Leader
                    </span>
                  )}
                  {isProfitWinner && !isRevWinner && (
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[9px] font-black border border-emerald-400/30">
                      💰 Profit Leader
                    </span>
                  )}
                  {isAovWinner && (
                    <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[9px] font-black border border-amber-400/30">
                      ⚡ Best AOV
                    </span>
                  )}
                </div>
              </div>

              {/* Key Financial KPIs */}
              <div className="space-y-2 text-xs">
                <div className="bg-[#1A2520] p-3 rounded-xl border border-white/5 space-y-1">
                  <div className="flex justify-between items-center text-white/60">
                    <span>Gross Sales:</span>
                    <strong className="text-base text-[#F5E086] font-mono">
                      ₹{item.grossSales.toLocaleString("en-IN")}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-white/60 text-[11px]">
                    <span>Net F&B Food:</span>
                    <strong className="text-white font-mono">
                      ₹{item.netFoodSales.toLocaleString("en-IN")}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-white/60 text-[11px]">
                    <span>Food COGS ({ownerConfig.cogsPercentage}%):</span>
                    <span className="text-white/80 font-mono">
                      ₹{item.cogs.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                <div className="bg-[#1A2520] p-3 rounded-xl border border-white/5 space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">Net Profit:</span>
                    <strong className="text-base text-emerald-400 font-mono">
                      ₹{item.netProfit.toLocaleString("en-IN")}
                    </strong>
                  </div>
                  <div className="flex justify-between items-center text-[11px]">
                    <span className="text-white/60">Net Profit Margin:</span>
                    <span className="px-2 py-0.5 rounded-md bg-emerald-400/10 text-emerald-300 font-bold text-[10px]">
                      {item.netProfitMarginPercent}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center text-[11px] text-white/60">
                    <span>Gross Margin:</span>
                    <strong className="text-white font-mono">{item.grossMarginPercent}%</strong>
                  </div>
                </div>

                {/* Operations & Volume */}
                <div className="bg-[#1A2520] p-3 rounded-xl border border-white/5 space-y-1 text-[11px]">
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">Total Orders:</span>
                    <strong className="text-white font-mono">
                      {item.totalOrders} ({item.successfulOrders} OK, {item.cancelledOrders} canc)
                    </strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">Average Ticket (AOV):</span>
                    <strong className="text-[#F5E086] font-mono">₹{item.avgOrderValue}</strong>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-white/60">Cancellation Rate:</span>
                    <strong className={item.cancellationRate > 0 ? "text-rose-400 font-mono" : "text-emerald-400 font-mono"}>
                      {item.cancellationRate}%
                    </strong>
                  </div>
                </div>

                {/* Channel & Top Seller */}
                <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 space-y-1 text-[10px]">
                  <div className="flex justify-between text-white/70">
                    <span>Dine-in vs Delivery:</span>
                    <strong className="text-white">
                      ₹{item.dineInRevenue.toLocaleString("en-IN")} / ₹{item.onlineAggregatorRevenue.toLocaleString("en-IN")}
                    </strong>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span>Bestseller Item:</span>
                    <strong className="text-[#F5E086] truncate max-w-[130px]">
                      {item.topItemName} ({item.topItemUnits} sold)
                    </strong>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Granular Side-by-Side Comparison Matrix Table */}
      <div className="bg-[#1E2B25] p-5 sm:p-6 rounded-3xl border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h4 className="font-niea font-bold text-lg text-[#F5E086]">
              Detailed Metric-by-Metric Audit Matrix
            </h4>
            <p className="text-xs text-white/60">
              Direct line-by-line comparison with group average and leader highlighting
            </p>
          </div>
          {onOpenCostConfig && (
            <button
              type="button"
              onClick={onOpenCostConfig}
              className="text-xs text-[#F5E086] hover:underline font-semibold flex items-center gap-1"
            >
              Configure Margin Parameters
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-white/10 text-white/50 text-[10px] uppercase font-bold tracking-wider">
                <th className="py-2.5 px-3">Operational Metric</th>
                <th className="py-2.5 px-3 bg-white/5 text-center text-white/80">Group Average</th>
                {comparison.items.map((it) => (
                  <th key={it.date} className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-white">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: it.color }} />
                      <span>{it.shortLabel}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {/* Row 1: Gross Billed Sales */}
              <tr className="hover:bg-white/5 transition">
                <td className="py-2.5 px-3 font-sans font-semibold text-white">Gross Billed Sales</td>
                <td className="py-2.5 px-3 text-center bg-white/5 text-white/80">
                  ₹{comparison.averageGrossSales.toLocaleString("en-IN")}
                </td>
                {comparison.items.map((it) => {
                  const isLeader = it.date === comparison.highestRevenueDate.date;
                  return (
                    <td
                      key={it.date}
                      className={`py-2.5 px-3 text-center font-bold ${
                        isLeader ? "text-[#F5E086] bg-[#F5E086]/10 rounded-lg" : "text-white"
                      }`}
                    >
                      ₹{it.grossSales.toLocaleString("en-IN")} {isLeader && "👑"}
                    </td>
                  );
                })}
              </tr>

              {/* Row 2: Net Food Sales */}
              <tr className="hover:bg-white/5 transition">
                <td className="py-2.5 px-3 font-sans text-white/80">Net F&B Food Sales</td>
                <td className="py-2.5 px-3 text-center bg-white/5 text-white/60">
                  ₹{Math.round(comparison.averageGrossSales * 0.94).toLocaleString("en-IN")}
                </td>
                {comparison.items.map((it) => (
                  <td key={it.date} className="py-2.5 px-3 text-center text-white/90">
                    ₹{it.netFoodSales.toLocaleString("en-IN")}
                  </td>
                ))}
              </tr>

              {/* Row 3: Food Cost (COGS) */}
              <tr className="hover:bg-white/5 transition">
                <td className="py-2.5 px-3 font-sans text-white/70">
                  Food COGS ({ownerConfig.cogsPercentage}%)
                </td>
                <td className="py-2.5 px-3 text-center bg-white/5 text-white/50">
                  ₹{Math.round(comparison.averageGrossSales * 0.94 * (ownerConfig.cogsPercentage / 100)).toLocaleString("en-IN")}
                </td>
                {comparison.items.map((it) => (
                  <td key={it.date} className="py-2.5 px-3 text-center text-white/70">
                    ₹{it.cogs.toLocaleString("en-IN")}
                  </td>
                ))}
              </tr>

              {/* Row 4: Gross Margin */}
              <tr className="hover:bg-white/5 transition">
                <td className="py-2.5 px-3 font-sans text-white/80">Gross Margin %</td>
                <td className="py-2.5 px-3 text-center bg-white/5 text-white/60">
                  {Number((100 - ownerConfig.cogsPercentage).toFixed(1))}%
                </td>
                {comparison.items.map((it) => (
                  <td key={it.date} className="py-2.5 px-3 text-center text-sky-300 font-bold">
                    {it.grossMarginPercent}%
                  </td>
                ))}
              </tr>

              {/* Row 5: Net Store Profit */}
              <tr className="hover:bg-white/5 transition bg-emerald-500/5">
                <td className="py-2.5 px-3 font-sans font-bold text-emerald-400">Net Store Profit</td>
                <td className="py-2.5 px-3 text-center bg-white/5 text-emerald-300 font-bold">
                  ₹{comparison.averageNetProfit.toLocaleString("en-IN")}
                </td>
                {comparison.items.map((it) => {
                  const isLeader = it.date === comparison.highestNetProfitDate.date;
                  return (
                    <td
                      key={it.date}
                      className={`py-2.5 px-3 text-center font-bold ${
                        isLeader ? "text-emerald-300 bg-emerald-500/20 rounded-lg text-sm" : "text-emerald-400"
                      }`}
                    >
                      ₹{it.netProfit.toLocaleString("en-IN")} {isLeader && "💎"}
                    </td>
                  );
                })}
              </tr>

              {/* Row 6: Net Profit Margin % */}
              <tr className="hover:bg-white/5 transition">
                <td className="py-2.5 px-3 font-sans text-emerald-300">Net Profit Margin %</td>
                <td className="py-2.5 px-3 text-center bg-white/5 text-emerald-300/80">
                  {comparison.averageMarginPercent}%
                </td>
                {comparison.items.map((it) => {
                  const isLeader = it.date === comparison.highestMarginDate.date;
                  return (
                    <td
                      key={it.date}
                      className={`py-2.5 px-3 text-center font-bold ${
                        isLeader ? "text-emerald-300 font-black" : "text-emerald-400"
                      }`}
                    >
                      {it.netProfitMarginPercent}%
                    </td>
                  );
                })}
              </tr>

              {/* Row 7: Total Orders Placed */}
              <tr className="hover:bg-white/5 transition">
                <td className="py-2.5 px-3 font-sans text-white/80">Total Orders Volume</td>
                <td className="py-2.5 px-3 text-center bg-white/5 text-white/60">
                  {comparison.averageTotalOrders}
                </td>
                {comparison.items.map((it) => {
                  const isLeader = it.date === comparison.highestOrdersDate.date;
                  return (
                    <td
                      key={it.date}
                      className={`py-2.5 px-3 text-center font-bold ${
                        isLeader ? "text-purple-300" : "text-white"
                      }`}
                    >
                      {it.totalOrders}
                    </td>
                  );
                })}
              </tr>

              {/* Row 8: Average Order Value (AOV) */}
              <tr className="hover:bg-white/5 transition">
                <td className="py-2.5 px-3 font-sans text-amber-300">Avg Ticket Size (AOV)</td>
                <td className="py-2.5 px-3 text-center bg-white/5 text-amber-300/70">
                  ₹{comparison.averageAov}
                </td>
                {comparison.items.map((it) => {
                  const isLeader = it.date === comparison.highestAovDate.date;
                  return (
                    <td
                      key={it.date}
                      className={`py-2.5 px-3 text-center font-bold ${
                        isLeader ? "text-amber-300" : "text-white"
                      }`}
                    >
                      ₹{it.avgOrderValue}
                    </td>
                  );
                })}
              </tr>

              {/* Row 9: Cancellation Rate */}
              <tr className="hover:bg-white/5 transition">
                <td className="py-2.5 px-3 font-sans text-white/70">Cancellation Rate %</td>
                <td className="py-2.5 px-3 text-center bg-white/5 text-white/60">
                  {(
                    comparison.items.reduce((s, it) => s + it.cancellationRate, 0) /
                    Math.max(comparison.items.length, 1)
                  ).toFixed(1)}%
                </td>
                {comparison.items.map((it) => (
                  <td
                    key={it.date}
                    className={`py-2.5 px-3 text-center ${
                      it.cancellationRate === 0 ? "text-emerald-400" : "text-rose-400"
                    }`}
                  >
                    {it.cancellationRate}%
                  </td>
                ))}
              </tr>

              {/* Row 10: Digital Payments (UPI Share) */}
              <tr className="hover:bg-white/5 transition">
                <td className="py-2.5 px-3 font-sans text-white/70">UPI Collections (₹)</td>
                <td className="py-2.5 px-3 text-center bg-white/5 text-white/50">
                  ₹{Math.round(
                    comparison.items.reduce((s, it) => s + it.upiSales, 0) /
                      Math.max(comparison.items.length, 1)
                  ).toLocaleString("en-IN")}
                </td>
                {comparison.items.map((it) => (
                  <td key={it.date} className="py-2.5 px-3 text-center text-emerald-400">
                    ₹{it.upiSales.toLocaleString("en-IN")}
                  </td>
                ))}
              </tr>

              {/* Row 11: Top Selling Item */}
              <tr className="hover:bg-white/5 transition">
                <td className="py-2.5 px-3 font-sans text-white/70">Day's Top Seller</td>
                <td className="py-2.5 px-3 text-center bg-white/5 text-white/40">—</td>
                {comparison.items.map((it) => (
                  <td key={it.date} className="py-2.5 px-3 text-center font-sans text-[11px] text-[#F5E086]">
                    {it.topItemName} ({it.topItemUnits})
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
      </>
    ) : (
      /* HISTORICAL TREND VIEW (TIME-SERIES GROWTH) */
      <div className="space-y-6">
        {/* Trend Controls Bar */}
        <div className="bg-[#24332D] p-4 sm:p-5 rounded-3xl border border-white/10 shadow-xl space-y-4">
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="p-1.5 rounded-xl bg-emerald-500/20 text-emerald-400">
                  <TrendingUp className="w-4 h-4" />
                </span>
                <h4 className="font-niea font-bold text-lg text-[#F5E086]">
                  Time-Series Velocity & Day-over-Day Trajectory
                </h4>
              </div>
              <p className="text-xs text-white/60 mt-0.5">
                Intraday cumulative revenue pace, sequence growth curves, and hourly surge velocity
              </p>
            </div>

            {/* Trend Sub-tabs */}
            <div className="flex rounded-xl bg-[#1A2520] p-1 border border-white/10 text-xs">
              <button
                type="button"
                onClick={() => setTrendTab("intraday_pace")}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  trendTab === "intraday_pace"
                    ? "bg-[#F5E086] text-[#24332D] shadow"
                    : "text-white/70 hover:text-white"
                }`}
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Intraday Cumulative Pace</span>
              </button>

              <button
                type="button"
                onClick={() => setTrendTab("date_growth")}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  trendTab === "date_growth"
                    ? "bg-[#F5E086] text-[#24332D] shadow"
                    : "text-white/70 hover:text-white"
                }`}
              >
                <TrendingUp className="w-3.5 h-3.5" />
                <span>Multi-Date Sequence</span>
              </button>

              <button
                type="button"
                onClick={() => setTrendTab("hourly_rush")}
                className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                  trendTab === "hourly_rush"
                    ? "bg-[#F5E086] text-[#24332D] shadow"
                    : "text-white/70 hover:text-white"
                }`}
              >
                <LineChartIcon className="w-3.5 h-3.5" />
                <span>Hourly Velocity</span>
              </button>
            </div>
          </div>

          {/* Trend Summary Intelligence Cards */}
          {dateTrendStats && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
              <div className="bg-[#1A2520] p-3 rounded-2xl border border-white/10 space-y-1">
                <span className="text-[10px] uppercase font-bold text-white/50 block">📈 Sequence Growth</span>
                <div className={`font-niea font-bold text-lg flex items-center gap-0.5 ${dateTrendStats.revenueGrowth >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {dateTrendStats.revenueGrowth >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {dateTrendStats.revenueGrowth >= 0 ? `+${dateTrendStats.revenueGrowth}%` : `${dateTrendStats.revenueGrowth}%`}
                </div>
                <span className="text-[10px] text-white/40 block truncate">
                  {dateTrendStats.first.shortLabel} → {dateTrendStats.last.shortLabel}
                </span>
              </div>

              <div className="bg-[#1A2520] p-3 rounded-2xl border border-white/10 space-y-1">
                <span className="text-[10px] uppercase font-bold text-white/50 block">⚡ Peak Hourly Run Rate</span>
                <div className="font-niea font-bold text-lg text-[#F5E086]">
                  {formatRupees(dateTrendStats.peakHourlyVelocity)}<span className="text-xs font-normal text-white/50">/hr</span>
                </div>
                <span className="text-[10px] text-sky-300 font-semibold block truncate">
                  {dateTrendStats.peakHourlyDate} @ {dateTrendStats.peakHourTime}
                </span>
              </div>

              <div className="bg-[#1A2520] p-3 rounded-2xl border border-white/10 space-y-1">
                <span className="text-[10px] uppercase font-bold text-white/50 block">📦 Combined Tickets</span>
                <div className="font-niea font-bold text-lg text-white">
                  {comparison.items.reduce((s, it) => s + it.totalOrders, 0)} <span className="text-xs font-normal text-white/60">orders</span>
                </div>
                <span className="text-[10px] text-white/40 block">
                  Across {selectedDates.length} compared dates
                </span>
              </div>

              <div className="bg-[#1A2520] p-3 rounded-2xl border border-white/10 space-y-1">
                <span className="text-[10px] uppercase font-bold text-white/50 block">💳 Net Profit Delta</span>
                <div className={`font-niea font-bold text-lg flex items-center gap-0.5 ${dateTrendStats.profitGrowth >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                  {dateTrendStats.profitGrowth >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                  {dateTrendStats.profitGrowth >= 0 ? `+${dateTrendStats.profitGrowth}%` : `${dateTrendStats.profitGrowth}%`}
                </div>
                <span className="text-[10px] text-white/40 block">
                  Net bottom-line trajectory
                </span>
              </div>
            </div>
          )}

          {/* Recharts Canvas */}
          <div className="w-full h-84 bg-[#1A2520] p-3 sm:p-4 rounded-2xl border border-white/5">
            <ResponsiveContainer width="100%" height="100%">
              {trendTab === "intraday_pace" ? (
                /* Intraday Cumulative Pace (AreaChart) */
                <AreaChart data={cumulativePaceData} margin={{ top: 15, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="hourLabel" stroke="rgba(255,255,255,0.5)" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="rgba(255,255,255,0.5)"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1A2520",
                      borderRadius: "16px",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                    formatter={(val: any, name: any) => [`₹${Number(val).toLocaleString("en-IN")} cumulative`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", color: "white" }} />
                  {comparison.items.map((item) => (
                    <Area
                      key={item.date}
                      type="monotone"
                      dataKey={item.shortLabel}
                      stroke={item.color}
                      fill={item.color}
                      fillOpacity={0.15}
                      strokeWidth={2.5}
                    />
                  ))}
                </AreaChart>
              ) : trendTab === "date_growth" ? (
                /* Multi-Date Chronological Sequence (LineChart) */
                <LineChart data={dateSequenceData} margin={{ top: 15, right: 15, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" stroke="rgba(255,255,255,0.5)" fontSize={11} tickLine={false} />
                  <YAxis
                    yAxisId="left"
                    stroke="rgba(255,255,255,0.5)"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`}
                  />
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    stroke="#38BDF8"
                    fontSize={10}
                    tickLine={false}
                    label={{ value: "Orders", angle: 90, position: "insideRight", fill: "#38BDF8", fontSize: 10 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1A2520",
                      borderRadius: "16px",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                    formatter={(val: any, name: any) => {
                      if (name === "Total Orders") return [`${val} orders`, name];
                      return [`₹${Number(val).toLocaleString("en-IN")}`, name];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", color: "white" }} />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="grossRevenue"
                    name="Gross Revenue"
                    stroke="#F5E086"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#F5E086" }}
                    activeDot={{ r: 7 }}
                  />
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="netProfit"
                    name="Net Profit"
                    stroke="#34D399"
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: "#34D399" }}
                  />
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="totalOrders"
                    name="Total Orders"
                    stroke="#38BDF8"
                    strokeWidth={2}
                    strokeDasharray="4 4"
                    dot={{ r: 3, fill: "#38BDF8" }}
                  />
                </LineChart>
              ) : (
                /* Hourly Velocity (Monotone Lines) */
                <LineChart data={hourlyChartData} margin={{ top: 15, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="hourLabel" stroke="rgba(255,255,255,0.5)" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="rgba(255,255,255,0.5)"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(v) => `₹${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1A2520",
                      borderRadius: "16px",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                    formatter={(val: any, name: any) => [`₹${Number(val).toLocaleString("en-IN")}`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", color: "white" }} />
                  {comparison.items.map((item) => (
                    <Line
                      key={item.date}
                      type="monotone"
                      dataKey={item.shortLabel}
                      stroke={item.color}
                      strokeWidth={2.5}
                      dot={{ r: 3, fill: item.color }}
                      activeDot={{ r: 6 }}
                    />
                  ))}
                </LineChart>
              )}
            </ResponsiveContainer>
          </div>
        </div>

        {/* Milestone Pace Table */}
        <div className="bg-[#24332D] p-5 rounded-3xl border border-white/10 space-y-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-white/10 pb-3">
            <div>
              <h5 className="font-niea font-bold text-sm text-[#F5E086] flex items-center gap-2">
                <Clock className="w-4 h-4 text-[#F5E086]" />
                Daypart Milestone Pace Progression
              </h5>
              <p className="text-[11px] text-white/60">
                Revenue generated during each operational window across compared dates
              </p>
            </div>
          </div>

          <div className="overflow-x-auto no-scrollbar">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-white/10 text-white/50 text-[11px] uppercase tracking-wider font-semibold">
                  <th className="py-2.5 px-3">Operational Milestone</th>
                  {comparison.items.map((it) => (
                    <th key={it.date} className="py-2.5 px-3 text-center">
                      <span className="inline-flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full" style={{ backgroundColor: it.color }} />
                        <span className="text-white">{it.shortLabel}</span>
                      </span>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {milestonePaceData.map((m) => (
                  <tr key={m.milestone} className="hover:bg-white/5 transition">
                    <td className="py-2.5 px-3 font-semibold text-white/80">{m.milestone}</td>
                    {comparison.items.map((it) => (
                      <td key={it.date} className="py-2.5 px-3 text-center font-mono font-bold text-emerald-400">
                        ₹{(m[it.shortLabel] || 0).toLocaleString("en-IN")}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    )}
    </div>
  );
};
