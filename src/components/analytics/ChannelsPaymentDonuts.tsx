import React, { useState, useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import {
  Layers,
  CreditCard,
  UtensilsCrossed,
  ShoppingBag,
  Users,
  Smartphone,
  Info,
} from "lucide-react";
import {
  ChannelBreakdownItem,
  PaymentModeItem,
} from "../../types/analyticsDashboard";

interface ChannelsPaymentDonutsProps {
  channels: ChannelBreakdownItem[];
  paymentModes: PaymentModeItem[];
}

// Custom Donut Tooltip
const CustomPieTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0];
    return (
      <div className="bg-[#1A2520] p-3 rounded-xl border border-white/20 shadow-xl text-xs space-y-1 font-mono">
        <div className="font-bold text-white text-xs">{data.name}</div>
        <div className="text-[#F5E086]">
          Revenue / Amount: ₹{data.value.toLocaleString("en-IN")}
        </div>
        <div className="text-white/60 text-[10px]">
          Share: {data.payload.percentage}% ({data.payload.ordersCount} orders)
        </div>
      </div>
    );
  }
  return null;
};

export const ChannelsPaymentDonuts: React.FC<ChannelsPaymentDonutsProps> = React.memo(({
  channels,
  paymentModes,
}) => {
  const [activeChannelIndex, setActiveChannelIndex] = useState<number | null>(null);
  const [activePaymentIndex, setActivePaymentIndex] = useState<number | null>(null);

  const channelChartData = useMemo(() => {
    return channels.map((c) => ({
      name: c.label,
      value: c.revenue,
      percentage: c.percentage,
      ordersCount: c.ordersCount,
      color: c.color,
    }));
  }, [channels]);

  const paymentChartData = useMemo(() => {
    return paymentModes.map((p) => ({
      name: p.label,
      value: p.amount,
      percentage: p.percentage,
      ordersCount: p.ordersCount,
      color: p.color,
    }));
  }, [paymentModes]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* 1. Fulfillment Channels & Aggregators Donut */}
      <div className="bg-[#24332D] p-5 rounded-2xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
              <Layers className="w-4 h-4" />
            </span>
            <div>
              <h4 className="font-niea font-bold text-sm text-[#F5E086]">
                Channel Mix & Aggregators
              </h4>
              <p className="text-[11px] text-white/60">
                Dine-in, takeaway, walk-in & online partners (Zomato, Swiggy)
              </p>
            </div>
          </div>
          <span className="text-[10px] text-white/40 uppercase font-mono">Recharts Donut</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
          <div className="w-full h-48 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={channelChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  onMouseEnter={(_, idx) => setActiveChannelIndex(idx)}
                  onMouseLeave={() => setActiveChannelIndex(null)}
                >
                  {channelChartData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.color}
                      opacity={activeChannelIndex === null || activeChannelIndex === index ? 1 : 0.4}
                      stroke="rgba(0,0,0,0.4)"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[10px] text-white/50 uppercase font-bold">Channels</span>
              <span className="font-niea font-bold text-sm text-white">{channels.length} Modes</span>
            </div>
          </div>

          {/* Channel Legend List */}
          <div className="space-y-2 text-xs">
            {channels.map((c, idx) => (
              <div
                key={c.id}
                onMouseEnter={() => setActiveChannelIndex(idx)}
                onMouseLeave={() => setActiveChannelIndex(null)}
                className={`p-1.5 rounded-xl flex items-center justify-between transition cursor-pointer ${
                  activeChannelIndex === idx ? "bg-white/10" : "hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: c.color }}
                  />
                  <span className="text-white truncate font-medium">{c.label}</span>
                </div>
                <div className="text-right pl-2 flex-shrink-0">
                  <strong className="text-white font-mono text-[11px] block">
                    ₹{c.revenue.toLocaleString("en-IN")}
                  </strong>
                  <span className="text-[10px] text-white/50">{c.percentage}% ({c.ordersCount})</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 2. Payment Modes Donut */}
      <div className="bg-[#24332D] p-5 rounded-2xl border border-white/10 space-y-4">
        <div className="flex items-center justify-between border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <CreditCard className="w-4 h-4" />
            </span>
            <div>
              <h4 className="font-niea font-bold text-sm text-[#F5E086]">
                Payment Collection Modes
              </h4>
              <p className="text-[11px] text-white/60">
                UPI QR scans, counter cash, POS swipe cards & wallets
              </p>
            </div>
          </div>
          <span className="text-[10px] text-white/40 uppercase font-mono">Recharts Donut</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 items-center gap-4">
          <div className="w-full h-48 relative">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentChartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={3}
                  dataKey="value"
                  onMouseEnter={(_, idx) => setActivePaymentIndex(idx)}
                  onMouseLeave={() => setActivePaymentIndex(null)}
                >
                  {paymentChartData.map((entry, index) => (
                    <Cell
                      key={`cell-pay-${index}`}
                      fill={entry.color}
                      opacity={activePaymentIndex === null || activePaymentIndex === index ? 1 : 0.4}
                      stroke="rgba(0,0,0,0.4)"
                    />
                  ))}
                </Pie>
                <Tooltip content={<CustomPieTooltip />} />
              </PieChart>
            </ResponsiveContainer>
            {/* Center Label */}
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center">
              <span className="text-[10px] text-white/50 uppercase font-bold">Payments</span>
              <span className="font-niea font-bold text-sm text-emerald-400">4 Gateways</span>
            </div>
          </div>

          {/* Payment Legend List */}
          <div className="space-y-2 text-xs">
            {paymentModes.map((p, idx) => (
              <div
                key={p.id}
                onMouseEnter={() => setActivePaymentIndex(idx)}
                onMouseLeave={() => setActivePaymentIndex(null)}
                className={`p-1.5 rounded-xl flex items-center justify-between transition cursor-pointer ${
                  activePaymentIndex === idx ? "bg-white/10" : "hover:bg-white/5"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <span
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{ backgroundColor: p.color }}
                  />
                  <span className="text-white truncate font-medium">{p.label}</span>
                </div>
                <div className="text-right pl-2 flex-shrink-0">
                  <strong className="text-white font-mono text-[11px] block">
                    ₹{p.amount.toLocaleString("en-IN")}
                  </strong>
                  <span className="text-[10px] text-white/50">{p.percentage}% ({p.ordersCount} txns)</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
});
