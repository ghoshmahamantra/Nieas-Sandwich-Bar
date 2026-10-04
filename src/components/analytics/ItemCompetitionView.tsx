import React, { useState, useMemo } from "react";
import {
  Swords,
  Award,
  Crown,
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Percent,
  Plus,
  Trash2,
  Sparkles,
  PieChart as PieIcon,
  BarChart3,
  LineChart as LineChartIcon,
  Clock,
  Search,
  Check,
  ChevronDown,
  Layers,
  UtensilsCrossed,
  ArrowUpRight,
  ArrowDownRight,
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
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { OrderRecord, MenuItem } from "../../types/niea";
import { INITIAL_MENU_ITEMS } from "../../data/nieaData";
import { OwnerFinanceConfig } from "../../types/ownerFinanceConfig";
import { computeItemCompetition, COMPARISON_PALETTE } from "../../utils/comparisonEngine";
import { CompetingItemMetric } from "../../types/comparisonTypes";

interface ItemCompetitionViewProps {
  allOrders: OrderRecord[];
  ownerConfig: OwnerFinanceConfig;
  allMenuItems?: MenuItem[];
  onOpenCostConfig?: () => void;
}

export const ItemCompetitionView: React.FC<ItemCompetitionViewProps> = ({
  allOrders,
  ownerConfig,
  allMenuItems = INITIAL_MENU_ITEMS,
  onOpenCostConfig,
}) => {
  // Initial default contenders (top 3 popular signature items)
  const [selectedItemIds, setSelectedItemIds] = useState<string[]>([
    "autumn-truffle-mushroom",
    "nieas-club-supreme",
    "crispy-katsu-sando",
  ]);

  // Manager Perspective Toggle: Current Snapshot vs Historical Trend
  const [viewMode, setViewMode] = useState<"snapshot" | "trend">("snapshot");
  const [trendMetric, setTrendMetric] = useState<"units" | "revenue" | "cumulative" | "growth">("units");
  const [trendWindowDays, setTrendWindowDays] = useState<7 | 14 | 30>(14);

  const [activeTab, setActiveTab] = useState<"units_revenue" | "trends" | "pie_share" | "channels" | "time_slots">("trends");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Presets
  const applyPreset = (preset: "bestsellers_top3" | "duel_top2" | "toasts_duel" | "top5_royal") => {
    if (preset === "bestsellers_top3") {
      setSelectedItemIds([
        "autumn-truffle-mushroom",
        "nieas-club-supreme",
        "crispy-katsu-sando",
      ]);
    } else if (preset === "duel_top2") {
      setSelectedItemIds([
        "autumn-truffle-mushroom",
        "nieas-club-supreme",
      ]);
    } else if (preset === "toasts_duel") {
      setSelectedItemIds([
        "burrata-fig-focaccia",
        "spiced-peach-brie-tartine",
      ]);
    } else if (preset === "top5_royal") {
      setSelectedItemIds([
        "autumn-truffle-mushroom",
        "nieas-club-supreme",
        "crispy-katsu-sando",
        "smoked-pastrami-gruyere",
        "burrata-fig-focaccia",
      ]);
    }
    setIsDropdownOpen(false);
  };

  const handleToggleItem = (itemId: string) => {
    if (selectedItemIds.includes(itemId)) {
      if (selectedItemIds.length <= 2) return; // Maintain min 2
      setSelectedItemIds(selectedItemIds.filter((id) => id !== itemId));
    } else {
      if (selectedItemIds.length >= 5) return; // Max 5
      setSelectedItemIds([...selectedItemIds, itemId]);
    }
  };

  const handleRemoveItem = (itemId: string) => {
    if (selectedItemIds.length <= 2) return;
    setSelectedItemIds(selectedItemIds.filter((id) => id !== itemId));
  };

  // Compute Competition Results
  const competition = useMemo(() => {
    return computeItemCompetition(selectedItemIds, allOrders, allMenuItems, ownerConfig);
  }, [selectedItemIds, allOrders, allMenuItems, ownerConfig]);

  // Filtered menu items for the picker dropdown
  const filteredMenuItems = useMemo(() => {
    return allMenuItems.filter((m) =>
      m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.category.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [allMenuItems, searchQuery]);

  // Donut Pie data
  const pieData = useMemo(() => {
    return competition.items.map((it) => ({
      name: it.name,
      value: it.grossRevenue,
      color: it.color,
      units: it.unitsSold,
    }));
  }, [competition]);

  // Time slot data for Recharts
  const timeSlotData = useMemo(() => {
    return [
      {
        slot: "Morning (8-11 AM)",
        ...Object.fromEntries(competition.items.map((it) => [it.name, it.morningUnits])),
      },
      {
        slot: "Lunch (12-3 PM)",
        ...Object.fromEntries(competition.items.map((it) => [it.name, it.lunchUnits])),
      },
      {
        slot: "Evening (4-7 PM)",
        ...Object.fromEntries(competition.items.map((it) => [it.name, it.eveningUnits])),
      },
      {
        slot: "Dinner (8-10 PM)",
        ...Object.fromEntries(competition.items.map((it) => [it.name, it.dinnerUnits])),
      },
    ];
  }, [competition]);

  // Comprehensive Time-Series Growth & Historical Trajectory dataset
  const timeSeriesData = useMemo(() => {
    const days: string[] = [];
    for (let i = trendWindowDays - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }

    const cumulatives: Record<string, { units: number; revenue: number }> = {};
    const firstDayUnits: Record<string, number> = {};
    competition.items.forEach((item) => {
      cumulatives[item.id] = { units: 0, revenue: 0 };
    });

    return days.map((dayStr, dayIndex) => {
      const dObj = new Date(dayStr);
      const label = dObj.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
      const row: Record<string, any> = { day: label, fullDate: dayStr };

      // Initialize contender quantities & revenues
      competition.items.forEach((item) => {
        row[item.name] = 0;
        row[`${item.name}_rev`] = 0;
      });

      // Sum quantities & revenues for day
      allOrders.forEach((o) => {
        if (o.kitchenStatus !== "cancelled" && o.createdAt && o.createdAt.startsWith(dayStr)) {
          o.items.forEach((ci) => {
            const match = competition.items.find((item) => item.id === ci.item.id);
            if (match) {
              const qty = ci.quantity || 1;
              const rev = (match.price || 0) * qty;
              row[match.name] = (row[match.name] || 0) + qty;
              row[`${match.name}_rev`] = (row[`${match.name}_rev`] || 0) + rev;
            }
          });
        }
      });

      // Calculate cumulative pace & indexed growth rate
      competition.items.forEach((item) => {
        const dailyUnits = row[item.name] || 0;
        const dailyRev = row[`${item.name}_rev`] || 0;
        cumulatives[item.id].units += dailyUnits;
        cumulatives[item.id].revenue += dailyRev;

        row[`${item.name}_cumUnits`] = cumulatives[item.id].units;
        row[`${item.name}_cumRev`] = cumulatives[item.id].revenue;

        if (dayIndex === 0) {
          firstDayUnits[item.id] = Math.max(1, dailyUnits);
        }
        const base = firstDayUnits[item.id] || 1;
        row[`${item.name}_growth`] = Math.round(((dailyUnits - base) / base) * 100);
      });

      return row;
    });
  }, [allOrders, competition.items, trendWindowDays]);

  // Contender time-series intelligence stats
  const trendStats = useMemo(() => {
    return competition.items.map((item) => {
      let totalUnits = 0;
      let totalRev = 0;
      let peakDay = "";
      let peakUnits = 0;
      let half1Units = 0;
      let half2Units = 0;
      const midpoint = Math.floor(timeSeriesData.length / 2);

      timeSeriesData.forEach((row, idx) => {
        const u = Number(row[item.name]) || 0;
        const r = Number(row[`${item.name}_rev`]) || 0;
        totalUnits += u;
        totalRev += r;
        if (u > peakUnits) {
          peakUnits = u;
          peakDay = row.day;
        }
        if (idx < midpoint) {
          half1Units += u;
        } else {
          half2Units += u;
        }
      });

      const avgDailyUnits = timeSeriesData.length > 0 ? (totalUnits / timeSeriesData.length).toFixed(1) : "0";
      const growthRate = half1Units > 0
        ? Math.round(((half2Units - half1Units) / half1Units) * 100)
        : half2Units > 0 ? 100 : 0;

      return {
        item,
        totalUnits,
        totalRev,
        avgDailyUnits,
        peakDay: peakDay || "N/A",
        peakUnits,
        growthRate,
        trendDirection: growthRate > 10 ? "accelerating" : growthRate < -10 ? "cooling" : "steady",
      };
    });
  }, [competition.items, timeSeriesData]);

  // Growth champion among the contenders
  const trendGrowthLeader = useMemo(() => {
    if (trendStats.length === 0) return null;
    return [...trendStats].sort((a, b) => b.growthRate - a.growthRate)[0];
  }, [trendStats]);

  // Backward compatibility alias for any existing reference
  const dailyTrendsData = timeSeriesData;

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* 1. Control Header & Contender Selector */}
      <div className="bg-[#1E2B25] p-5 sm:p-6 rounded-3xl border border-white/10 shadow-xl space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="p-2 rounded-2xl bg-amber-400/15 text-amber-300 border border-amber-400/30">
                <Swords className="w-5 h-5" />
              </span>
              <h3 className="font-niea font-bold text-xl text-[#F5E086]">
                Menu Item Battle & Sales Competition
              </h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#F5E086]/20 text-[#F5E086] border border-[#F5E086]/30">
                Battle 2 to 5 Menu Items
              </span>
            </div>
            <p className="text-xs text-white/60 mt-1">
              Head-to-head showdown: See which item was sold the most, generated higher revenue, contributed larger profit margins, and dominated peak dining hours.
            </p>
          </div>

          {/* Quick Presets */}
          <div className="flex flex-wrap items-center gap-1.5 text-xs">
            <span className="text-white/40 text-[11px] font-semibold mr-1">Quick Battles:</span>
            <button
              type="button"
              onClick={() => applyPreset("bestsellers_top3")}
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/80 hover:text-white font-medium transition border border-white/5"
            >
              Top 3 Bestsellers
            </button>
            <button
              type="button"
              onClick={() => applyPreset("duel_top2")}
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/80 hover:text-white font-medium transition border border-white/5"
            >
              1-on-1 Duel
            </button>
            <button
              type="button"
              onClick={() => applyPreset("toasts_duel")}
              className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/15 text-white/80 hover:text-white font-medium transition border border-white/5"
            >
              Artisan Toasts Clash
            </button>
            <button
              type="button"
              onClick={() => applyPreset("top5_royal")}
              className="px-2.5 py-1.5 rounded-xl bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 font-bold transition border border-amber-400/30"
            >
              Top 5 Royale
            </button>
          </div>
        </div>

        {/* Selected Contenders Strip & Add Dropdown */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-[#141C18] p-3 rounded-2xl border border-white/5 relative">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-white/50 text-xs font-semibold">Contenders ({selectedItemIds.length}/5):</span>
            {competition.items.map((it) => (
              <div
                key={it.id}
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#1E2B25] border border-white/15 text-xs text-white shadow-sm"
              >
                <span
                  className="w-2.5 h-2.5 rounded-full"
                  style={{ backgroundColor: it.color }}
                />
                <span className="font-bold truncate max-w-[130px]">{it.name}</span>
                <span className="text-[#F5E086] text-[10px] font-mono">₹{it.price}</span>
                {selectedItemIds.length > 2 && (
                  <button
                    type="button"
                    onClick={() => handleRemoveItem(it.id)}
                    className="text-white/40 hover:text-rose-400 transition ml-1"
                    title="Remove from battle"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Add Contender Dropdown Toggle */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              disabled={selectedItemIds.length >= 5}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 text-xs shadow ${
                selectedItemIds.length >= 5
                  ? "bg-white/10 text-white/30 cursor-not-allowed"
                  : "bg-[#F5E086] text-[#24332D] hover:bg-[#F8E79B]"
              }`}
            >
              <Plus className="w-3.5 h-3.5 stroke-[3]" />
              <span>{selectedItemIds.length >= 5 ? "Max 5 Items" : "Add Contender"}</span>
              <ChevronDown className="w-3.5 h-3.5 ml-0.5" />
            </button>

            {/* Dropdown Menu */}
            {isDropdownOpen && (
              <div className="absolute right-0 top-full mt-2 w-72 bg-[#1A2520] border border-white/15 rounded-2xl p-3 shadow-2xl z-50 space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-white/40 absolute left-2.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Search menu..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full bg-[#141C18] border border-white/10 rounded-xl pl-8 pr-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-[#F5E086]"
                  />
                </div>

                <div className="max-h-56 overflow-y-auto space-y-1 pr-1">
                  {filteredMenuItems.map((item) => {
                    const isSelected = selectedItemIds.includes(item.id);
                    return (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => handleToggleItem(item.id)}
                        className={`w-full text-left p-2 rounded-xl text-xs flex items-center justify-between transition ${
                          isSelected
                            ? "bg-[#F5E086]/15 text-[#F5E086] border border-[#F5E086]/30 font-bold"
                            : "hover:bg-white/5 text-white/80"
                        }`}
                      >
                        <div className="truncate mr-2">
                          <p className="truncate font-semibold">{item.name}</p>
                          <p className="text-[10px] text-white/40">{item.category} • ₹{item.price}</p>
                        </div>
                        {isSelected && <Check className="w-3.5 h-3.5 text-[#F5E086]" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
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
                {viewMode === "snapshot" ? "Current Snapshot (Matrix & Share)" : "Historical Trend (Time-Series Growth)"}
              </span>
            </div>
            <p className="text-xs text-white/60">
              {viewMode === "snapshot"
                ? "Comparing head-to-head metrics, market share percentages, and day-part distributions"
                : "Tracking multi-day time-series growth, sales velocity curves, and volume momentum"}
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
          {/* 2. Champions Podium / Leaderboard Badges */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5 text-xs">
        {/* Most Units Sold (The Winner!) */}
        <div className="bg-[#24332D] p-4 rounded-2xl border border-amber-400/40 shadow-lg relative overflow-hidden space-y-1.5">
          <div className="flex items-center justify-between text-white/60">
            <span className="font-bold uppercase tracking-wider text-[10px] text-amber-300">
              👑 Sold The Most
            </span>
            <Crown className="w-4 h-4 text-amber-400" />
          </div>
          <div className="font-niea font-black text-2xl text-amber-300">
            {competition.volumeLeader.unitsSold} <span className="text-sm font-sans font-medium text-white/70">units</span>
          </div>
          <div className="text-[11px] font-bold text-white flex items-center gap-1.5 truncate">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: competition.volumeLeader.color }}
            />
            <span className="truncate">{competition.volumeLeader.name}</span>
          </div>
          <span className="text-[10px] text-amber-200/70 block">
            Most ordered menu item
          </span>
        </div>

        {/* Highest Gross Revenue */}
        <div className="bg-[#24332D] p-4 rounded-2xl border border-white/10 shadow-lg relative overflow-hidden space-y-1.5">
          <div className="flex items-center justify-between text-white/60">
            <span className="font-bold uppercase tracking-wider text-[10px]">💎 Highest Revenue</span>
            <DollarSign className="w-4 h-4 text-[#F5E086]" />
          </div>
          <div className="font-niea font-black text-xl text-[#F5E086]">
            ₹{competition.revenueLeader.grossRevenue.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] font-bold text-white flex items-center gap-1.5 truncate">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: competition.revenueLeader.color }}
            />
            <span className="truncate">{competition.revenueLeader.name}</span>
          </div>
          <span className="text-[10px] text-white/40 block">
            Top gross billing generator
          </span>
        </div>

        {/* Highest Contribution Profit */}
        <div className="bg-[#24332D] p-4 rounded-2xl border border-white/10 shadow-lg relative overflow-hidden space-y-1.5">
          <div className="flex items-center justify-between text-white/60">
            <span className="font-bold uppercase tracking-wider text-[10px]">📈 Profit Champion</span>
            <Award className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="font-niea font-black text-xl text-emerald-400">
            ₹{competition.profitLeader.grossProfit.toLocaleString("en-IN")}
          </div>
          <div className="text-[11px] font-bold text-white flex items-center gap-1.5 truncate">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: competition.profitLeader.color }}
            />
            <span className="truncate">{competition.profitLeader.name}</span>
          </div>
          <span className="text-[10px] text-emerald-300/80 block">
            Max INR gross profit contributed
          </span>
        </div>

        {/* Customer Attach Rate Leader */}
        <div className="bg-[#24332D] p-4 rounded-2xl border border-white/10 shadow-lg relative overflow-hidden space-y-1.5">
          <div className="flex items-center justify-between text-white/60">
            <span className="font-bold uppercase tracking-wider text-[10px]">🌟 Customer Magnet</span>
            <Sparkles className="w-4 h-4 text-purple-400" />
          </div>
          <div className="font-niea font-black text-xl text-purple-300">
            {competition.attachRateLeader.attachRatePercent}%
          </div>
          <div className="text-[11px] font-bold text-white flex items-center gap-1.5 truncate">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: competition.attachRateLeader.color }}
            />
            <span className="truncate">{competition.attachRateLeader.name}</span>
          </div>
          <span className="text-[10px] text-white/40 block">
            Appears in {competition.attachRateLeader.ordersContainingItem} customer checks
          </span>
        </div>

        {/* Peak Rush Hour Champion */}
        <div className="bg-[#24332D] p-4 rounded-2xl border border-white/10 shadow-lg relative overflow-hidden space-y-1.5">
          <div className="flex items-center justify-between text-white/60">
            <span className="font-bold uppercase tracking-wider text-[10px]">⏰ Peak Velocity</span>
            <Clock className="w-4 h-4 text-sky-400" />
          </div>
          <div className="font-niea font-black text-base text-sky-300 truncate">
            {competition.volumeLeader.peakTimeSlot}
          </div>
          <div className="text-[11px] font-bold text-white flex items-center gap-1.5 truncate">
            <span
              className="w-2 h-2 rounded-full shrink-0"
              style={{ backgroundColor: competition.volumeLeader.color }}
            />
            <span className="truncate">{competition.volumeLeader.name}</span>
          </div>
          <span className="text-[10px] text-white/40 block">
            Highest concentration window
          </span>
        </div>
      </div>

      {/* 3. Visual Charts Section */}
      <div className="bg-[#24332D] p-5 sm:p-6 rounded-3xl border border-white/10 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div>
            <h4 className="font-niea font-bold text-lg text-[#F5E086] flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-[#F5E086]" />
              Head-to-Head Visual Comparison
            </h4>
            <p className="text-xs text-white/60">
              Comparing sales volume, revenue generation, and ordering channel distribution
            </p>
          </div>

          {/* Mode Switcher */}
          <div className="flex flex-wrap rounded-xl bg-[#1A2520] p-1 border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => setActiveTab("trends")}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === "trends"
                  ? "bg-[#F5E086] text-[#24332D] shadow"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <LineChartIcon className="w-3.5 h-3.5" />
              <span>Velocity Trends (Lines)</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("units_revenue")}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === "units_revenue"
                  ? "bg-[#F5E086] text-[#24332D] shadow"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Units & Revenue</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("pie_share")}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === "pie_share"
                  ? "bg-[#F5E086] text-[#24332D] shadow"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <PieIcon className="w-3.5 h-3.5" />
              <span>Revenue Share %</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("channels")}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === "channels"
                  ? "bg-[#F5E086] text-[#24332D] shadow"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Dine-In vs Parcel</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveTab("time_slots")}
              className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                activeTab === "time_slots"
                  ? "bg-[#F5E086] text-[#24332D] shadow"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Day Slots Rush</span>
            </button>
          </div>
        </div>

        {/* Viewport */}
        <div className="w-full h-80 bg-[#1A2520] p-3 sm:p-4 rounded-2xl border border-white/5">
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === "trends" ? (
              /* Velocity Trends (Multi-Line Chart) */
              <LineChart data={dailyTrendsData} margin={{ top: 15, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="rgba(255,255,255,0.5)"
                  fontSize={10}
                  tickLine={false}
                  allowDecimals={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#1A2520",
                    borderRadius: "16px",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                  formatter={(val: any, name: any) => [`${val} portions sold`, name]}
                />
                <Legend wrapperStyle={{ fontSize: "11px", color: "white" }} />
                {competition.items.map((item) => (
                  <Line
                    key={item.id}
                    type="monotone"
                    dataKey={item.name}
                    stroke={item.color}
                    strokeWidth={2.5}
                    dot={{ r: 3, fill: item.color }}
                    activeDot={{ r: 5 }}
                  />
                ))}
              </LineChart>
            ) : activeTab === "units_revenue" ? (
              /* 1. Units Sold & Revenue */
              <BarChart data={competition.items} margin={{ top: 15, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={10} tickLine={false} />
                <YAxis
                  yAxisId="left"
                  stroke="rgba(255,255,255,0.5)"
                  fontSize={10}
                  tickLine={false}
                  label={{ value: "Units Sold", angle: -90, position: "insideLeft", fill: "rgba(255,255,255,0.4)", fontSize: 10 }}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
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
                />
                <Legend wrapperStyle={{ fontSize: "11px", color: "white" }} />
                <Bar yAxisId="left" dataKey="unitsSold" name="Units Sold (# portions)" fill="#F5E086" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="grossRevenue" name="Gross Revenue (₹)" fill="#34D399" radius={[4, 4, 0, 0]} />
                <Bar yAxisId="right" dataKey="grossProfit" name="Gross Profit (₹)" fill="#38BDF8" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : activeTab === "pie_share" ? (
              /* 2. Donut Pie Share */
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={105}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }: any) => `${(name || "").slice(0, 14)} (${((percent || 0) * 100).toFixed(0)}%)`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [`₹${Number(val).toLocaleString("en-IN")}`, "Gross Revenue"]}
                  contentStyle={{
                    backgroundColor: "#1A2520",
                    borderRadius: "16px",
                    border: "1px solid rgba(255,255,255,0.15)",
                    color: "#fff",
                    fontSize: "12px",
                  }}
                />
              </PieChart>
            ) : activeTab === "channels" ? (
              /* 3. Channels Stacked Bar */
              <BarChart data={competition.items} margin={{ top: 15, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="name" stroke="rgba(255,255,255,0.5)" fontSize={10} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={10} tickLine={false} />
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
                <Bar dataKey="dineInUnits" name="Dine-in Portions" stackId="a" fill="#38BDF8" />
                <Bar dataKey="takeawayUnits" name="Takeaway Portions" stackId="a" fill="#FB923C" />
                <Bar dataKey="onlineAggregatorUnits" name="Online / Delivery Portions" stackId="a" fill="#34D399" radius={[4, 4, 0, 0]} />
              </BarChart>
            ) : (
              /* 4. Time Slots Grouped Bar */
              <BarChart data={timeSlotData} margin={{ top: 15, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                <XAxis dataKey="slot" stroke="rgba(255,255,255,0.5)" fontSize={10} tickLine={false} />
                <YAxis stroke="rgba(255,255,255,0.5)" fontSize={10} tickLine={false} />
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
                {competition.items.map((it) => (
                  <Bar key={it.id} dataKey={it.name} fill={it.color} radius={[4, 4, 0, 0]} />
                ))}
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. Side-by-Side Contender Battle Cards */}
      <div className={`grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${competition.items.length} gap-4`}>
        {competition.items.map((item, idx) => {
          const isVolumeWinner = item.id === competition.volumeLeader.id;
          const isRevenueWinner = item.id === competition.revenueLeader.id;
          const isProfitWinner = item.id === competition.profitLeader.id;

          return (
            <div
              key={item.id}
              className={`bg-[#24332D] p-5 rounded-3xl border transition shadow-xl space-y-4 relative ${
                isVolumeWinner ? "border-amber-400/60 shadow-amber-400/5" : "border-white/10"
              }`}
            >
              {/* Card Header & Photo */}
              <div className="flex items-start justify-between gap-3 border-b border-white/10 pb-3">
                <div className="flex items-center gap-3">
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-12 h-12 rounded-2xl object-cover border border-white/10 shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shrink-0">
                      <UtensilsCrossed className="w-6 h-6 text-white/40" />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                      <h5 className="font-niea font-bold text-sm text-white line-clamp-1">
                        {item.name}
                      </h5>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-white/50">
                      <span>₹{item.price}</span>
                      <span>•</span>
                      <span className="capitalize">{item.category}</span>
                    </div>
                  </div>
                </div>

                {/* Rank Badge */}
                <div className="shrink-0 flex flex-col items-end">
                  <span
                    className={`w-7 h-7 rounded-xl flex items-center justify-center font-black text-xs border ${
                      idx === 0
                        ? "bg-amber-400/20 text-amber-300 border-amber-400/40"
                        : idx === 1
                        ? "bg-slate-300/20 text-slate-200 border-slate-300/40"
                        : "bg-white/5 text-white/60 border-white/10"
                    }`}
                  >
                    #{idx + 1}
                  </span>
                </div>
              </div>

              {/* Core Contest KPI Box */}
              <div className="bg-[#1A2520] p-3.5 rounded-2xl border border-white/5 space-y-2.5">
                <div className="flex justify-between items-baseline">
                  <span className="text-white/60 text-xs">Total Units Sold:</span>
                  <div className="text-right">
                    <span className="font-niea font-black text-2xl text-amber-300 font-mono">
                      {item.unitsSold}
                    </span>
                    <span className="text-[10px] text-white/50 ml-1">portions</span>
                  </div>
                </div>

                {isVolumeWinner && (
                  <div className="px-2 py-1 rounded-xl bg-amber-400/10 text-amber-300 text-[10px] font-bold border border-amber-400/20 flex items-center gap-1">
                    <Crown className="w-3.5 h-3.5" />
                    <span>👑 Battle Champion: Sold the most!</span>
                  </div>
                )}

                <div className="flex justify-between items-center text-xs text-white/70 pt-1 border-t border-white/5">
                  <span>Gross Revenue:</span>
                  <strong className="text-white font-mono">₹{item.grossRevenue.toLocaleString("en-IN")}</strong>
                </div>

                <div className="flex justify-between items-center text-xs text-white/70">
                  <span>Gross Profit (INR):</span>
                  <strong className="text-emerald-400 font-mono">₹{item.grossProfit.toLocaleString("en-IN")}</strong>
                </div>

                <div className="flex justify-between items-center text-xs text-white/70">
                  <span>Profit Margin %:</span>
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 font-bold text-[10px]">
                    {item.profitMarginPercent}%
                  </span>
                </div>
              </div>

              {/* Order Attach Rate & Peak Time */}
              <div className="space-y-1.5 text-[11px] text-white/60 bg-white/5 p-3 rounded-2xl">
                <div className="flex justify-between">
                  <span>Order Attach Rate:</span>
                  <strong className="text-purple-300">{item.attachRatePercent}% of checks</strong>
                </div>
                <div className="flex justify-between">
                  <span>Avg per Check:</span>
                  <strong className="text-white">{item.avgUnitsPerOrder} units</strong>
                </div>
                <div className="flex justify-between">
                  <span>Peak Rush Slot:</span>
                  <strong className="text-[#F5E086] truncate max-w-[130px]">{item.peakTimeSlot}</strong>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Head-to-Head Comparison Matrix Table */}
      <div className="bg-[#1E2B25] p-5 sm:p-6 rounded-3xl border border-white/10 shadow-xl space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div>
            <h4 className="font-niea font-bold text-lg text-[#F5E086]">
              Detailed Item Battle Matrix
            </h4>
            <p className="text-xs text-white/60">
              Side-by-side metric comparison across billing, margins, volume, and customer channels
            </p>
          </div>
          {onOpenCostConfig && (
            <button
              type="button"
              onClick={onOpenCostConfig}
              className="text-xs text-[#F5E086] hover:underline font-semibold"
            >
              Configure COGS %
            </button>
          )}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="border-b border-white/10 text-white/50 text-[10px] uppercase font-bold tracking-wider">
                <th className="py-2.5 px-3">Performance Metric</th>
                {competition.items.map((it) => (
                  <th key={it.id} className="py-2.5 px-3 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-white">
                      <span className="w-2 h-2 rounded-full" style={{ backgroundColor: it.color }} />
                      <span className="truncate max-w-[120px]">{it.name}</span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 font-mono">
              {/* Row 1: Units Sold */}
              <tr className="hover:bg-white/5 transition bg-amber-400/5">
                <td className="py-2.5 px-3 font-sans font-bold text-amber-300">
                  Total Units Sold (# Portions)
                </td>
                {competition.items.map((it) => {
                  const isLeader = it.id === competition.volumeLeader.id;
                  return (
                    <td
                      key={it.id}
                      className={`py-2.5 px-3 text-center font-bold text-sm ${
                        isLeader ? "text-amber-300 bg-amber-400/20 rounded-lg" : "text-white"
                      }`}
                    >
                      {it.unitsSold} {isLeader && "👑 (Winner)"}
                    </td>
                  );
                })}
              </tr>

              {/* Row 2: Gross Revenue */}
              <tr className="hover:bg-white/5 transition">
                <td className="py-2.5 px-3 font-sans font-semibold text-white">
                  Total Gross Revenue (₹)
                </td>
                {competition.items.map((it) => {
                  const isLeader = it.id === competition.revenueLeader.id;
                  return (
                    <td
                      key={it.id}
                      className={`py-2.5 px-3 text-center font-bold ${
                        isLeader ? "text-[#F5E086] bg-[#F5E086]/10 rounded-lg" : "text-white"
                      }`}
                    >
                      ₹{it.grossRevenue.toLocaleString("en-IN")} {isLeader && "💎"}
                    </td>
                  );
                })}
              </tr>

              {/* Row 3: Unit Menu Price */}
              <tr className="hover:bg-white/5 transition">
                <td className="py-2.5 px-3 font-sans text-white/70">Menu Selling Price (₹)</td>
                {competition.items.map((it) => (
                  <td key={it.id} className="py-2.5 px-3 text-center text-white/80">
                    ₹{it.price}
                  </td>
                ))}
              </tr>

              {/* Row 4: Estimated COGS */}
              <tr className="hover:bg-white/5 transition">
                <td className="py-2.5 px-3 font-sans text-white/70">Estimated COGS (₹)</td>
                {competition.items.map((it) => (
                  <td key={it.id} className="py-2.5 px-3 text-center text-white/60">
                    ₹{it.cogsEstimated.toLocaleString("en-IN")}
                  </td>
                ))}
              </tr>

              {/* Row 5: Gross Margin ₹ */}
              <tr className="hover:bg-white/5 transition">
                <td className="py-2.5 px-3 font-sans font-bold text-emerald-400">
                  Gross Contribution Profit (₹)
                </td>
                {competition.items.map((it) => {
                  const isLeader = it.id === competition.profitLeader.id;
                  return (
                    <td
                      key={it.id}
                      className={`py-2.5 px-3 text-center font-bold ${
                        isLeader ? "text-emerald-300 bg-emerald-500/15 rounded-lg" : "text-emerald-400"
                      }`}
                    >
                      ₹{it.grossProfit.toLocaleString("en-IN")} {isLeader && "🏆"}
                    </td>
                  );
                })}
              </tr>

              {/* Row 6: Profit Margin % */}
              <tr className="hover:bg-white/5 transition">
                <td className="py-2.5 px-3 font-sans text-emerald-300">Profit Margin %</td>
                {competition.items.map((it) => (
                  <td key={it.id} className="py-2.5 px-3 text-center text-emerald-300 font-bold">
                    {it.profitMarginPercent}%
                  </td>
                ))}
              </tr>

              {/* Row 7: Order Attach Rate */}
              <tr className="hover:bg-white/5 transition">
                <td className="py-2.5 px-3 font-sans text-purple-300">Order Attach Rate %</td>
                {competition.items.map((it) => {
                  const isLeader = it.id === competition.attachRateLeader.id;
                  return (
                    <td
                      key={it.id}
                      className={`py-2.5 px-3 text-center font-bold ${
                        isLeader ? "text-purple-300 bg-purple-500/15 rounded-lg" : "text-purple-200"
                      }`}
                    >
                      {it.attachRatePercent}%
                    </td>
                  );
                })}
              </tr>

              {/* Row 8: Dine-In Portions */}
              <tr className="hover:bg-white/5 transition">
                <td className="py-2.5 px-3 font-sans text-white/70">Dine-in Portions</td>
                {competition.items.map((it) => (
                  <td key={it.id} className="py-2.5 px-3 text-center text-sky-300">
                    {it.dineInUnits}
                  </td>
                ))}
              </tr>

              {/* Row 9: Takeaway Portions */}
              <tr className="hover:bg-white/5 transition">
                <td className="py-2.5 px-3 font-sans text-white/70">Takeaway Portions</td>
                {competition.items.map((it) => (
                  <td key={it.id} className="py-2.5 px-3 text-center text-orange-300">
                    {it.takeawayUnits}
                  </td>
                ))}
              </tr>

              {/* Row 10: Online / Aggregator Portions */}
              <tr className="hover:bg-white/5 transition">
                <td className="py-2.5 px-3 font-sans text-white/70">Delivery / Aggregator Portions</td>
                {competition.items.map((it) => (
                  <td key={it.id} className="py-2.5 px-3 text-center text-emerald-300">
                    {it.onlineAggregatorUnits}
                  </td>
                ))}
              </tr>

              {/* Row 11: Peak Rush Slot */}
              <tr className="hover:bg-white/5 transition">
                <td className="py-2.5 px-3 font-sans text-white/70">Peak Selling Window</td>
                {competition.items.map((it) => (
                  <td key={it.id} className="py-2.5 px-3 text-center font-sans text-[11px] text-[#F5E086]">
                    {it.peakTimeSlot}
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
                  Time-Series Velocity & Growth Trajectory
                </h4>
              </div>
              <p className="text-xs text-white/60 mt-0.5">
                Multi-day trend curves showing daily portions, billing velocity, and cumulative momentum
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              {/* Trend Window Days Selector */}
              <div className="flex items-center gap-1 bg-[#1A2520] p-1 rounded-xl border border-white/10 text-xs">
                <span className="text-[10px] text-white/40 uppercase font-bold px-2">Window:</span>
                {[
                  { days: 7, label: "7 Days" },
                  { days: 14, label: "14 Days" },
                  { days: 30, label: "30 Days" },
                ].map((w) => (
                  <button
                    key={w.days}
                    type="button"
                    onClick={() => setTrendWindowDays(w.days as any)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition text-xs ${
                      trendWindowDays === w.days
                        ? "bg-[#F5E086] text-[#24332D] shadow"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    {w.label}
                  </button>
                ))}
              </div>

              {/* Metric Selector */}
              <div className="flex items-center gap-1 bg-[#1A2520] p-1 rounded-xl border border-white/10 text-xs">
                {[
                  { id: "units", label: "Portions Sold", icon: ShoppingBag },
                  { id: "revenue", label: "Daily Billings (₹)", icon: DollarSign },
                  { id: "cumulative", label: "Cumulative Pace", icon: Layers },
                  { id: "growth", label: "Indexed Growth %", icon: Percent },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setTrendMetric(m.id as any)}
                    className={`px-2.5 py-1 rounded-lg font-bold transition text-xs flex items-center gap-1.5 ${
                      trendMetric === m.id
                        ? "bg-[#F5E086] text-[#24332D] shadow"
                        : "text-white/60 hover:text-white"
                    }`}
                  >
                    <m.icon className="w-3 h-3" />
                    <span>{m.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Trend Intelligence Banner */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            <div className="bg-[#1A2520] p-3 rounded-2xl border border-white/10 space-y-1">
              <span className="text-[10px] uppercase font-bold text-white/50 block">🚀 Fastest Growing</span>
              <div className="font-niea font-bold text-sm text-emerald-400 truncate flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: trendGrowthLeader?.item.color }} />
                <span className="truncate">{trendGrowthLeader?.item.name || "N/A"}</span>
              </div>
              <span className="text-[10px] text-emerald-300 font-semibold block">
                {trendGrowthLeader && trendGrowthLeader.growthRate >= 0 ? `+${trendGrowthLeader.growthRate}%` : `${trendGrowthLeader?.growthRate}%`} momentum
              </span>
            </div>

            <div className="bg-[#1A2520] p-3 rounded-2xl border border-white/10 space-y-1">
              <span className="text-[10px] uppercase font-bold text-white/50 block">⚡ Window Volume</span>
              <div className="font-niea font-bold text-lg text-[#F5E086]">
                {trendStats.reduce((sum, s) => sum + s.totalUnits, 0)} <span className="text-xs font-normal text-white/60">portions</span>
              </div>
              <span className="text-[10px] text-white/40 block">
                Across {trendWindowDays} days observed
              </span>
            </div>

            <div className="bg-[#1A2520] p-3 rounded-2xl border border-white/10 space-y-1">
              <span className="text-[10px] uppercase font-bold text-white/50 block">💰 Window Billings</span>
              <div className="font-niea font-bold text-lg text-[#F5E086]">
                ₹{trendStats.reduce((sum, s) => sum + s.totalRev, 0).toLocaleString("en-IN")}
              </div>
              <span className="text-[10px] text-white/40 block">
                Combined gross revenue
              </span>
            </div>

            <div className="bg-[#1A2520] p-3 rounded-2xl border border-white/10 space-y-1">
              <span className="text-[10px] uppercase font-bold text-white/50 block">🏆 Peak Single-Day Spike</span>
              <div className="font-niea font-bold text-sm text-sky-300 truncate">
                {Math.max(...trendStats.map((s) => s.peakUnits))} units
              </div>
              <span className="text-[10px] text-white/40 block truncate">
                Top recorded daily spike
              </span>
            </div>
          </div>

          {/* Recharts Trend Line/Area Chart */}
          <div className="w-full h-84 bg-[#1A2520] p-3 sm:p-4 rounded-2xl border border-white/5">
            <ResponsiveContainer width="100%" height="100%">
              {trendMetric === "cumulative" ? (
                <AreaChart data={timeSeriesData} margin={{ top: 15, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" fontSize={11} tickLine={false} />
                  <YAxis stroke="rgba(255,255,255,0.5)" fontSize={10} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1A2520",
                      borderRadius: "16px",
                      border: "1px solid rgba(255,255,255,0.15)",
                      color: "#fff",
                      fontSize: "12px",
                    }}
                    formatter={(val: any, name: any) => [`${val} portions cumulative`, name]}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", color: "white" }} />
                  {competition.items.map((item) => (
                    <Area
                      key={item.id}
                      type="monotone"
                      dataKey={`${item.name}_cumUnits`}
                      name={item.name}
                      stroke={item.color}
                      fill={item.color}
                      fillOpacity={0.15}
                      strokeWidth={2.5}
                    />
                  ))}
                </AreaChart>
              ) : (
                <LineChart data={timeSeriesData} margin={{ top: 15, right: 10, left: -10, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="day" stroke="rgba(255,255,255,0.5)" fontSize={11} tickLine={false} />
                  <YAxis
                    stroke="rgba(255,255,255,0.5)"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(v) =>
                      trendMetric === "revenue"
                        ? `₹${v >= 1000 ? (v / 1000).toFixed(0) + "k" : v}`
                        : trendMetric === "growth"
                        ? `${v}%`
                        : v
                    }
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
                      if (trendMetric === "revenue") return [`₹${Number(val).toLocaleString("en-IN")}`, name];
                      if (trendMetric === "growth") return [`${val >= 0 ? "+" : ""}${val}% vs day 1`, name];
                      return [`${val} portions`, name];
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", color: "white" }} />
                  {competition.items.map((item) => (
                    <Line
                      key={item.id}
                      type="monotone"
                      dataKey={
                        trendMetric === "revenue"
                          ? `${item.name}_rev`
                          : trendMetric === "growth"
                          ? `${item.name}_growth`
                          : item.name
                      }
                      name={item.name}
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

        {/* Contender Trajectory Momentum Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {trendStats.map((stat) => (
            <div
              key={stat.item.id}
              className="bg-[#24332D] p-4 rounded-2xl border border-white/10 space-y-3 shadow-lg"
            >
              <div className="flex items-center justify-between border-b border-white/10 pb-2.5">
                <div className="flex items-center gap-2.5">
                  <span className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: stat.item.color }} />
                  <span className="font-bold text-xs text-white truncate max-w-[160px]">{stat.item.name}</span>
                </div>
                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    stat.trendDirection === "accelerating"
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                      : stat.trendDirection === "cooling"
                      ? "bg-rose-500/20 text-rose-300 border border-rose-400/30"
                      : "bg-white/10 text-white/80"
                  }`}
                >
                  {stat.trendDirection === "accelerating" ? "Accelerating 🚀" : stat.trendDirection === "cooling" ? "Cooling 📉" : "Steady ⚖️"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-[#1A2520] p-2 rounded-xl">
                  <span className="text-[10px] text-white/50 block">Period Volume</span>
                  <span className="font-niea font-bold text-sm text-[#F5E086]">{stat.totalUnits} portions</span>
                </div>
                <div className="bg-[#1A2520] p-2 rounded-xl">
                  <span className="text-[10px] text-white/50 block">Period Revenue</span>
                  <span className="font-niea font-bold text-sm text-emerald-400">₹{stat.totalRev.toLocaleString("en-IN")}</span>
                </div>
                <div className="bg-[#1A2520] p-2 rounded-xl">
                  <span className="text-[10px] text-white/50 block">Daily Average</span>
                  <span className="font-niea font-bold text-sm text-white">{stat.avgDailyUnits}/day</span>
                </div>
                <div className="bg-[#1A2520] p-2 rounded-xl">
                  <span className="text-[10px] text-white/50 block">Period Growth Rate</span>
                  <span className={`font-niea font-bold text-sm flex items-center gap-0.5 ${stat.growthRate >= 0 ? "text-emerald-400" : "text-rose-400"}`}>
                    {stat.growthRate >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                    {stat.growthRate >= 0 ? `+${stat.growthRate}%` : `${stat.growthRate}%`}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
    </div>
  );
};
