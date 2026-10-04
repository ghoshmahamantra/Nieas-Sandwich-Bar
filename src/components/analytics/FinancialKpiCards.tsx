import React from "react";
import {
  DollarSign,
  TrendingUp,
  Percent,
  Receipt,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  ArrowUpRight,
  Package,
  Layers,
  Flame,
} from "lucide-react";
import {
  FinancialMetrics,
  OrderVolumeMetrics,
} from "../../types/analyticsDashboard";

interface FinancialKpiCardsProps {
  financials: FinancialMetrics;
  orderVolume: OrderVolumeMetrics;
}

export const FinancialKpiCards: React.FC<FinancialKpiCardsProps> = ({
  financials,
  orderVolume,
}) => {
  const formatRupees = (amount: number) => {
    if (amount >= 100000) {
      return `₹${(amount / 100000).toFixed(2)}L`;
    }
    return `₹${amount.toLocaleString("en-IN")}`;
  };

  return (
    <div className="space-y-3">
      {/* 4 Primary Top Level KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Gross Revenue & Net Sales */}
        <div className="bg-[#24332D] p-5 rounded-2xl border border-white/10 space-y-2 shadow-lg hover:border-white/20 transition">
          <div className="flex items-center justify-between text-xs text-white/60">
            <span className="font-semibold uppercase tracking-wider">Gross Billed Sales</span>
            <span className="p-1.5 rounded-lg bg-[#F5E086]/10 text-[#F5E086]">
              <DollarSign className="w-4 h-4" />
            </span>
          </div>
          <div className="font-niea font-black text-3xl text-[#F5E086]">
            {formatRupees(financials.grossSales)}
          </div>
          <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-white/50 block text-[10px]">Net F&B Food:</span>
              <strong className="text-white">{formatRupees(financials.netFoodSales)}</strong>
            </div>
            <div>
              <span className="text-white/50 block text-[10px]">Discounts Given:</span>
              <strong className="text-amber-300">-{formatRupees(financials.discountsGiven)}</strong>
            </div>
          </div>
        </div>

        {/* 2. Net Profit & Margin */}
        <div className="bg-[#24332D] p-5 rounded-2xl border border-white/10 space-y-2 shadow-lg hover:border-white/20 transition">
          <div className="flex items-center justify-between text-xs text-white/60">
            <span className="font-semibold uppercase tracking-wider">Net Store Profit</span>
            <span className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
              <Percent className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-niea font-black text-3xl text-emerald-400">
              {formatRupees(financials.netProfit)}
            </span>
            <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
              {financials.profitMarginPercent}% margin
            </span>
          </div>
          <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-white/50 block text-[10px]">Food Cost (COGS):</span>
              <strong className="text-white/80">{formatRupees(financials.cogs)}</strong>
            </div>
            <div>
              <span className="text-white/50 block text-[10px]">Gross Profit:</span>
              <strong className="text-emerald-300">{formatRupees(financials.grossProfit)}</strong>
            </div>
          </div>
        </div>

        {/* 3. Taxes & Packaging Fees */}
        <div className="bg-[#24332D] p-5 rounded-2xl border border-white/10 space-y-2 shadow-lg hover:border-white/20 transition">
          <div className="flex items-center justify-between text-xs text-white/60">
            <span className="font-semibold uppercase tracking-wider">Taxes & Packaging Fees</span>
            <span className="p-1.5 rounded-lg bg-sky-500/10 text-sky-400">
              <Receipt className="w-4 h-4" />
            </span>
          </div>
          <div className="font-niea font-black text-3xl text-sky-300">
            {formatRupees(financials.taxesCollected + financials.packagingCharges)}
          </div>
          <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-white/50 block text-[10px]">GST Taxes:</span>
              <strong className="text-white">{formatRupees(financials.taxesCollected)}</strong>
            </div>
            <div>
              <span className="text-white/50 block text-[10px]">Takeaway Packaging:</span>
              <strong className="text-white">{formatRupees(financials.packagingCharges)}</strong>
            </div>
          </div>
        </div>

        {/* 4. Order Volume, Success & Cancellation */}
        <div className="bg-[#24332D] p-5 rounded-2xl border border-white/10 space-y-2 shadow-lg hover:border-white/20 transition">
          <div className="flex items-center justify-between text-xs text-white/60">
            <span className="font-semibold uppercase tracking-wider">Orders & Accuracy</span>
            <span className="p-1.5 rounded-lg bg-purple-500/10 text-purple-400">
              <ShoppingBag className="w-4 h-4" />
            </span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="font-niea font-black text-3xl text-white">
              {orderVolume.totalOrders}
            </span>
            <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {orderVolume.successfulOrders} served
            </span>
          </div>
          <div className="pt-2 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
            <div>
              <span className="text-white/50 block text-[10px]">Cancelled Rate:</span>
              <strong className={orderVolume.cancelledOrders > 0 ? "text-rose-400" : "text-white"}>
                {orderVolume.cancelledOrders} ({orderVolume.cancellationRate}%)
              </strong>
            </div>
            <div>
              <span className="text-white/50 block text-[10px]">Avg Order Ticket:</span>
              <strong className="text-[#F5E086]">₹{financials.avgOrderValue}</strong>
            </div>
          </div>
        </div>
      </div>

      {/* Secondary Cost Deductions Strip (Configured Platform Fees, Wastage Loss & Overheads) */}
      <div className="bg-[#1A2520] p-3 rounded-2xl border border-white/10 text-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-4 text-white/70">
          <span className="text-[#F5E086] font-bold uppercase text-[10px] tracking-wider flex items-center gap-1">
            <Layers className="w-3.5 h-3.5" /> Cost Allocation Breakdown:
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-white/50">Kitchen & Staff Overheads:</span>
            <strong className="text-purple-300 font-mono">₹{financials.operatingExpenses.toLocaleString("en-IN")}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-white/50">Aggregator Platform Fees (Zomato/Swiggy):</span>
            <strong className="text-amber-300 font-mono">₹{financials.aggregatorPlatformFees.toLocaleString("en-IN")}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-white/50">Wastage / Variance Loss:</span>
            <strong className="text-rose-400 font-mono">₹{financials.actualWastageLoss.toLocaleString("en-IN")}</strong>
          </div>
        </div>

        <div className="text-[11px] text-emerald-400 font-medium">
          Pure Margin Formula: <strong>Gross Sales - COGS - Overheads - Platform Fees - Wastage</strong>
        </div>
      </div>
    </div>
  );
};
