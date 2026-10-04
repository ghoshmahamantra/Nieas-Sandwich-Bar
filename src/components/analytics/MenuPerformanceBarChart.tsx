import React, { useState } from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Cell,
} from "recharts";
import {
  Award,
  AlertTriangle,
  Flame,
  ArrowDownRight,
  Sparkles,
  PieChart as PieIcon,
} from "lucide-react";
import { MenuItemMetric } from "../../types/analyticsDashboard";

interface MenuPerformanceBarChartProps {
  topSellingItems: MenuItemMetric[];
  slowMovingItems: MenuItemMetric[];
}

export const MenuPerformanceBarChart: React.FC<MenuPerformanceBarChartProps> = React.memo(({
  topSellingItems,
  slowMovingItems,
}) => {
  const [activeTab, setActiveTab] = useState<"top" | "slow">("top");

  const itemsToDisplay = activeTab === "top" ? topSellingItems : slowMovingItems;

  const chartData = React.useMemo(() => {
    return itemsToDisplay.map((item) => ({
      name: item.name.length > 20 ? item.name.slice(0, 18) + "…" : item.name,
      fullName: item.name,
      revenue: item.revenue,
      unitsSold: item.unitsSold,
      marginPercent: item.marginPercent,
      category: item.category,
      status: item.velocityStatus,
    }));
  }, [itemsToDisplay]);

  const CustomBarTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-[#1A2520] p-3 rounded-2xl border border-white/20 shadow-2xl text-xs space-y-1 font-mono">
          <div className="font-bold text-[#F5E086] text-xs">{data.fullName}</div>
          <div className="text-white text-[11px]">
            Gross Revenue: <strong>₹{data.revenue.toLocaleString("en-IN")}</strong>
          </div>
          <div className="text-white/70 text-[10px]">
            Units Sold: <strong>{data.unitsSold} plates/cups</strong>
          </div>
          <div className="text-emerald-400 text-[10px]">
            Food Profit Margin: <strong>{data.marginPercent}%</strong>
          </div>
          <div className="text-white/50 text-[10px] capitalize">
            Category: {data.category}
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-[#24332D] p-5 rounded-2xl border border-white/10 space-y-4">
      {/* Header & Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
            <Award className="w-4 h-4" />
          </span>
          <div>
            <h4 className="font-niea font-bold text-sm text-[#F5E086]">
              Menu Item Performance & Dish Velocity
            </h4>
            <p className="text-[11px] text-white/60">
              Identify revenue drivers and slow-moving dishes for menu engineering
            </p>
          </div>
        </div>

        {/* Tab Toggle */}
        <div className="flex rounded-xl bg-[#1A2520] p-1 border border-white/10 text-xs">
          <button
            type="button"
            onClick={() => setActiveTab("top")}
            className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeTab === "top"
                ? "bg-[#F5E086] text-[#24332D] shadow"
                : "text-white/60 hover:text-white"
            }`}
          >
            <Flame className="w-3.5 h-3.5 text-amber-500" />
            <span>Top Sellers (Stars)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("slow")}
            className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1.5 ${
              activeTab === "slow"
                ? "bg-rose-500/20 text-rose-300 border border-rose-400/30"
                : "text-white/60 hover:text-white"
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
            <span>Slow-Moving</span>
          </button>
        </div>
      </div>

      {/* Grid: Bar chart on left, detailed list on right */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-center">
        {/* Horizontal Bar Chart */}
        <div className="lg:col-span-7 h-60 w-full bg-[#1A2520] p-2.5 rounded-2xl border border-white/5">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="vertical"
              margin={{ top: 5, right: 20, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
              <XAxis
                type="number"
                stroke="rgba(255,255,255,0.4)"
                fontSize={10}
                tickFormatter={(v) => (v >= 1000 ? `₹${v / 1000}k` : `₹${v}`)}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="rgba(255,255,255,0.7)"
                fontSize={10}
                width={95}
                tickLine={false}
              />
              <Tooltip content={<CustomBarTooltip />} />
              <Bar dataKey="revenue" radius={[0, 4, 4, 0]}>
                {chartData.map((_, index) => (
                  <Cell
                    key={`bar-${index}`}
                    fill={activeTab === "top" ? "#F5E086" : "#FB7185"}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Item Breakdown List */}
        <div className="lg:col-span-5 space-y-2 text-xs">
          {itemsToDisplay.map((item, idx) => (
            <div
              key={item.id}
              className="p-2.5 rounded-xl bg-[#1A2520] border border-white/5 flex items-center justify-between hover:border-white/15 transition"
            >
              <div className="truncate pr-2">
                <div className="flex items-center gap-1.5">
                  <span className="text-[10px] font-mono text-white/40">#{idx + 1}</span>
                  <span className="font-bold text-white truncate text-xs">{item.name}</span>
                </div>
                <div className="flex items-center gap-2 mt-0.5 text-[10px] text-white/50">
                  <span className="capitalize">{item.category}</span>
                  <span>•</span>
                  <span className="text-emerald-400 font-semibold">{item.marginPercent}% margin</span>
                </div>
              </div>

              <div className="text-right flex-shrink-0">
                <span className="font-niea font-bold text-sm text-[#F5E086] block">
                  ₹{item.revenue.toLocaleString("en-IN")}
                </span>
                <span className="text-[10px] text-white/60 font-mono">
                  {item.unitsSold} sold
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
});
