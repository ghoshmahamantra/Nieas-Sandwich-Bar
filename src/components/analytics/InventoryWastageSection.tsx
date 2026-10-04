import React from "react";
import {
  Boxes,
  AlertTriangle,
  CheckCircle2,
  TrendingDown,
  Info,
  Scale,
  Sparkles,
} from "lucide-react";
import { InventoryVarianceRecord } from "../../types/analyticsDashboard";

interface InventoryWastageSectionProps {
  variances: InventoryVarianceRecord[];
}

export const InventoryWastageSection: React.FC<InventoryWastageSectionProps> = ({
  variances,
}) => {
  const totalWastageLoss = variances.reduce((s, v) => s + v.wastageCost, 0);
  const criticalItems = variances.filter((v) => v.status === "critical");

  return (
    <div className="bg-[#24332D] p-5 rounded-2xl border border-white/10 space-y-4">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 rounded-lg bg-orange-500/10 text-orange-400">
            <Boxes className="w-4 h-4" />
          </span>
          <div>
            <h4 className="font-niea font-bold text-sm text-[#F5E086]">
              Inventory Consumption & Recipe Variance
            </h4>
            <p className="text-[11px] text-white/60">
              Theoretical Bill of Materials (BOM) vs Actual Store Usage & Wastage Loss
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="px-3 py-1 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-400/30 text-xs font-bold flex items-center gap-1.5">
            <TrendingDown className="w-3.5 h-3.5" />
            <span>Loss: ₹{totalWastageLoss.toLocaleString("en-IN")}</span>
          </div>
          {criticalItems.length > 0 && (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-bold border border-amber-400/30 flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" />
              {criticalItems.length} High Variance
            </span>
          )}
        </div>
      </div>

      {/* Table of Ingredients Variance */}
      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-left text-xs text-white">
          <thead className="bg-[#1A2520] text-white/60 text-[10px] uppercase tracking-wider font-semibold border-b border-white/10">
            <tr>
              <th className="py-2.5 px-3">Ingredient / Raw Material</th>
              <th className="py-2.5 px-3">Category</th>
              <th className="py-2.5 px-3 text-right">Recipe BOM</th>
              <th className="py-2.5 px-3 text-right">Actual Drawn</th>
              <th className="py-2.5 px-3 text-right">Variance</th>
              <th className="py-2.5 px-3 text-right">Wastage Cost</th>
              <th className="py-2.5 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 bg-[#1E2B25]/60">
            {variances.map((inv) => (
              <tr key={inv.id} className="hover:bg-white/5 transition">
                <td className="py-2.5 px-3 font-semibold text-white">
                  <div className="flex items-center gap-2">
                    <Scale className="w-3.5 h-3.5 text-[#F5E086]/70 flex-shrink-0" />
                    <span>{inv.ingredientName}</span>
                  </div>
                </td>
                <td className="py-2.5 px-3 text-white/50 text-[11px]">{inv.category}</td>
                <td className="py-2.5 px-3 text-right font-mono text-white/80">
                  {inv.theoreticalUsage} {inv.unit}
                </td>
                <td className="py-2.5 px-3 text-right font-mono text-white">
                  {inv.actualUsage} {inv.unit}
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-amber-300">
                  +{inv.variancePercent}% ({inv.varianceQuantity} {inv.unit})
                </td>
                <td className="py-2.5 px-3 text-right font-mono font-bold text-rose-300">
                  ₹{inv.wastageCost.toLocaleString("en-IN")}
                </td>
                <td className="py-2.5 px-3 text-center">
                  {inv.status === "normal" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      <CheckCircle2 className="w-3 h-3" /> Normal
                    </span>
                  )}
                  {inv.status === "warning" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                      <Info className="w-3 h-3" /> Moderate
                    </span>
                  )}
                  {inv.status === "critical" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-400/30 animate-pulse">
                      <AlertTriangle className="w-3 h-3" /> Audit Req.
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-[10px] text-white/40 italic">
        * Theoretical Bill of Materials (BOM) is calculated automatically from POS recipe mappings. Variance beyond 4.5% triggers automatic kitchen prep audit.
      </p>
    </div>
  );
};
