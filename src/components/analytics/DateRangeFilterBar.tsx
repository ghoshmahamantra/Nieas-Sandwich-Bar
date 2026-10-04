import React from "react";
import {
  Calendar,
  Clock,
  Building2,
  FileSpreadsheet,
  FileText,
  Sparkles,
  SlidersHorizontal,
  ChevronRight,
} from "lucide-react";
import {
  AnalyticsTimeRangeType,
  DateFilterState,
} from "../../types/analyticsDashboard";
import { SINGLE_OUTLET_INFO } from "../../utils/analyticsEngine";

interface DateRangeFilterBarProps {
  filter: DateFilterState;
  onFilterChange: (newFilter: DateFilterState) => void;
  onExportExcel: () => void;
  onExportPdf: () => void;
  onExportCsv?: () => void;
  onOpenCuteCalendar: () => void;
  onOpenCostConfig: () => void;
  periodLabel: string;
}

export const DateRangeFilterBar: React.FC<DateRangeFilterBarProps> = ({
  filter,
  onFilterChange,
  onExportExcel,
  onExportPdf,
  onExportCsv,
  onOpenCuteCalendar,
  onOpenCostConfig,
  periodLabel,
}) => {
  // Exactly the 5 period options requested:
  // Today, Weekly, Monthly (30D), This Month, Custom
  const periodPresets: { id: AnalyticsTimeRangeType; label: string }[] = [
    { id: "today", label: "Today" },
    { id: "weekly", label: "Weekly (7D)" },
    { id: "monthly", label: "Monthly (30D)" },
    { id: "this_month", label: "This Month" },
    { id: "custom", label: "Custom" },
  ];

  const handlePeriodSelect = (id: AnalyticsTimeRangeType) => {
    if (id === "custom") {
      onFilterChange({
        ...filter,
        type: "custom",
      });
      onOpenCuteCalendar();
    } else {
      onFilterChange({
        ...filter,
        type: id,
      });
    }
  };

  return (
    <div className="bg-[#1E2B25] p-5 rounded-3xl border border-white/10 shadow-xl space-y-4">
      {/* Top row: Single Outlet Header & Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-niea font-bold text-xl text-[#F5E086]">
              Executive Business & POS Analytics
            </h3>
            {/* Single Outlet Badge */}
            <span className="px-3 py-1 rounded-xl text-xs font-bold bg-[#17221D] text-white border border-white/10 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5 text-[#F5E086]" />
              <span>{SINGLE_OUTLET_INFO.name}</span>
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#F5E086]" /> Live Synced
            </span>
          </div>
          <p className="text-xs text-white/60 mt-1">
            Real-time analytics for revenue, margins, COGS, channels, aggregators & recipe wastage
          </p>
        </div>

        {/* Action Controls: Cost Config + CSV/PDF */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Owner Cost Configuration Button */}
          <button
            type="button"
            onClick={onOpenCostConfig}
            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#F5E086] text-xs font-bold transition flex items-center gap-1.5 border border-white/10 shadow-sm"
            title="Configure Wastage %, Goods Price Money, Packaging & Platform Fees"
          >
            <SlidersHorizontal className="w-3.5 h-3.5" />
            <span>Cost & Fee Settings</span>
          </button>

          {/* Export to Excel (With Logo & Structured Financials) */}
          <button
            type="button"
            onClick={onExportExcel}
            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
            title="Export official Excel report with NiEA logo, P&L, channels, and full ledger"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>Export Excel</span>
          </button>

          {/* Export to PDF (With Visual Graphs & Logo) */}
          <button
            type="button"
            onClick={onExportPdf}
            className="px-3.5 py-1.5 rounded-xl bg-[#F5E086] text-[#24332D] hover:bg-[#F8E79B] text-xs font-black transition flex items-center gap-1.5 shadow"
            title="Export official Executive PDF report with graphs and logo"
          >
            <FileText className="w-4 h-4 text-[#24332D]" />
            <span>Export PDF</span>
          </button>

          {/* Optional Export to CSV */}
          {onExportCsv && (
            <button
              type="button"
              onClick={onExportCsv}
              className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-xs font-semibold transition flex items-center gap-1.5 border border-white/10 shadow-sm"
              title="Download raw CSV dataset"
            >
              <span>CSV</span>
            </button>
          )}
        </div>
      </div>

      {/* Bottom row: The 5 Requested Period Options + Cute Calendar Trigger */}
      <div className="pt-3 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        {/* Period Selector Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-white/50 text-[11px] font-semibold mr-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-[#F5E086]" /> Period:
          </span>

          {periodPresets.map((preset) => {
            const isActive = filter.type === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handlePeriodSelect(preset.id)}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition whitespace-nowrap text-xs flex items-center gap-1.5 ${
                  isActive
                    ? "bg-[#F5E086] text-[#24332D] shadow"
                    : "bg-[#17221D] text-white/70 hover:text-white border border-white/5"
                }`}
              >
                {preset.id === "custom" && <Calendar className="w-3.5 h-3.5" />}
                <span>{preset.label}</span>
              </button>
            );
          })}
        </div>

        {/* Active Filter Scope Info / Cute Calendar quick opener button */}
        <div className="flex items-center gap-2">
          {filter.type === "custom" ? (
            <button
              type="button"
              onClick={onOpenCuteCalendar}
              className="text-xs bg-[#17221D] hover:bg-[#24332D] border border-[#F5E086]/40 px-3 py-1.5 rounded-xl text-[#F5E086] font-semibold flex items-center gap-1.5 transition shadow"
            >
              <Calendar className="w-3.5 h-3.5" />
              <span>{periodLabel}</span>
              <ChevronRight className="w-3 h-3 text-white/50" />
            </button>
          ) : (
            <div className="text-[11px] text-white/70 bg-[#17221D] px-3 py-1 rounded-xl border border-white/5">
              Active Scope: <strong className="text-[#F5E086]">{periodLabel}</strong>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
