import React, { useState, useMemo } from "react";
import {
  TrendingUp,
  DollarSign,
  Calendar,
  CreditCard,
  ShoppingBag,
  CheckCircle2,
  XCircle,
  Plus,
  RefreshCw,
  Clock,
  Layers,
  Sparkles,
  Download,
  Printer,
  Search,
  Filter,
  Users,
  UtensilsCrossed,
  ArrowUpRight,
  PieChart as PieIcon,
  ChevronDown,
  FileSpreadsheet,
  AlertTriangle,
  Receipt,
  Check,
  FileText,
  Boxes,
  Code2,
  SlidersHorizontal,
  Swords,
  CalendarRange,
  LayoutDashboard,
} from "lucide-react";
import {
  OrderRecord,
  PosSalesRecord,
  ReservationRecord,
  DailyIngredientEntry,
  DailyWastageEntry,
  MasterIngredientTemplate,
  StoreFinancialSettings,
} from "../../types/niea";
import { DateFilterState } from "../../types/analyticsDashboard";
import {
  OwnerFinanceConfig,
  getStoredOwnerFinanceConfig,
  syncFinancialSettingsToOwnerConfig,
} from "../../types/ownerFinanceConfig";
import {
  computeEnterpriseAnalytics,
  exportAnalyticsToCsv,
  exportAnalyticsToPdf,
  SINGLE_OUTLET_INFO,
} from "../../utils/analyticsEngine";
import {
  exportAnalyticsToExcel,
  exportAnalyticsToPdfWithGraphs,
} from "../../utils/analyticsExportService";
import { DateRangeFilterBar } from "../analytics/DateRangeFilterBar";
import { FinancialKpiCards } from "../analytics/FinancialKpiCards";
import { SalesVelocityRechart } from "../analytics/SalesVelocityRechart";
import { PeakOrderingTimesChart } from "../analytics/PeakOrderingTimesChart";
import { ChannelsPaymentDonuts } from "../analytics/ChannelsPaymentDonuts";
import { MenuPerformanceBarChart } from "../analytics/MenuPerformanceBarChart";
import { InventoryWastageSection } from "../analytics/InventoryWastageSection";
import { OrderLedgerAuditTable } from "../analytics/OrderLedgerAuditTable";
import { CuteCalendarModal } from "../analytics/CuteCalendarModal";
import { OwnerCostConfigModal } from "../analytics/OwnerCostConfigModal";
import { DateComparisonView } from "../analytics/DateComparisonView";
import { ItemCompetitionView } from "../analytics/ItemCompetitionView";

const ChartLoadingSkeleton: React.FC<{ title?: string; height?: string }> = ({
  title = "Loading Chart...",
  height = "h-72",
}) => (
  <div
    className={`w-full ${height} rounded-2xl bg-[#1E2B25] border border-white/10 p-5 flex flex-col justify-between animate-pulse shadow-md`}
  >
    <div className="flex items-center justify-between">
      <div className="space-y-1.5">
        <div className="h-4 bg-white/10 rounded w-44" />
        <div className="h-3 bg-white/5 rounded w-28" />
      </div>
      <div className="h-7 bg-white/10 rounded-lg w-24" />
    </div>
    <div className="flex items-end gap-2.5 h-36 pt-4">
      <div className="flex-1 bg-white/5 rounded-t h-[35%]" />
      <div className="flex-1 bg-white/5 rounded-t h-[65%]" />
      <div className="flex-1 bg-white/5 rounded-t h-[45%]" />
      <div className="flex-1 bg-white/5 rounded-t h-[85%]" />
      <div className="flex-1 bg-white/5 rounded-t h-[55%]" />
      <div className="flex-1 bg-white/5 rounded-t h-[75%]" />
      <div className="flex-1 bg-white/5 rounded-t h-[95%]" />
      <div className="flex-1 bg-white/5 rounded-t h-[60%]" />
    </div>
    <div className="flex items-center justify-between text-[11px] text-white/40 pt-2 border-t border-white/5">
      <span>{title}</span>
      <span className="font-mono text-[10px]">Optimizing visualization...</span>
    </div>
  </div>
);

interface PetPoojaAnalyticsTabProps {
  orders: OrderRecord[];
  reservations: ReservationRecord[];
  posRecords: PosSalesRecord[];
  onAddPosRecord: (record: PosSalesRecord) => void;
  dailyIngredients?: DailyIngredientEntry[];
  dailyWastage?: DailyWastageEntry[];
  masterIngredients?: MasterIngredientTemplate[];
  financialSettings?: StoreFinancialSettings;
  onUpdateFinancialSettings?: (settings: StoreFinancialSettings) => void;
  onUpdateMasterIngredients?: (master: MasterIngredientTemplate[]) => void;
  onUpdateDailyIngredients?: (ingredients: DailyIngredientEntry[]) => void;
}

export const PetPoojaAnalyticsTab: React.FC<PetPoojaAnalyticsTabProps> = React.memo(({
  orders,
  reservations,
  posRecords,
  onAddPosRecord,
  dailyIngredients = [],
  dailyWastage = [],
  masterIngredients = [],
  financialSettings,
  onUpdateFinancialSettings,
  onUpdateMasterIngredients,
  onUpdateDailyIngredients,
}) => {
  const todayStr = useMemo(() => new Date().toISOString().slice(0, 10), []);

  // Mode: Executive Overview vs Multi-Date Comparison vs Menu Item Battle
  const [analyticsMode, setAnalyticsMode] = useState<"executive" | "date_comparison" | "item_competition">("executive");

  // Global Time Filter State (today, weekly, monthly, this_month, custom)
  const [filter, setFilter] = useState<DateFilterState>({
    type: "monthly",
    singleDate: todayStr,
    startDate: new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10),
    endDate: todayStr,
    customMode: "range",
    selectedDates: [todayStr],
  });

  // Owner Financial & Operational Configuration State
  const [ownerConfig, setOwnerConfig] = useState<OwnerFinanceConfig>(() => {
    const base = getStoredOwnerFinanceConfig();
    return financialSettings ? syncFinancialSettingsToOwnerConfig(financialSettings, base) : base;
  });

  // Sync if financialSettings updates from portal
  React.useEffect(() => {
    if (financialSettings) {
      setOwnerConfig((prev) => syncFinancialSettingsToOwnerConfig(financialSettings, prev));
    }
  }, [financialSettings]);

  // Modals state
  const [isCuteCalendarOpen, setIsCuteCalendarOpen] = useState(false);
  const [isOwnerCostConfigOpen, setIsOwnerCostConfigOpen] = useState(false);
  const [isAddingPosModalOpen, setIsAddingPosModalOpen] = useState(false);

  // POS manual register entry state
  const [posDate, setPosDate] = useState(todayStr);
  const [posCash, setPosCash] = useState<number>(0);
  const [posUpi, setPosUpi] = useState<number>(0);
  const [posCard, setPosCard] = useState<number>(0);
  const [posOrdersCount, setPosOrdersCount] = useState<number>(0);
  const [posCancelledCount, setPosCancelledCount] = useState<number>(0);
  const [posNote, setPosNote] = useState("Counter Physical POS Register");

  // Pure real cafe operations analytics - fully synchronized with daily ingredients, wastage & master defaults
  const snapshot = useMemo(() => {
    return computeEnterpriseAnalytics(
      orders,
      posRecords,
      reservations,
      filter,
      ownerConfig,
      dailyIngredients,
      dailyWastage,
      masterIngredients
    );
  }, [orders, posRecords, reservations, filter, ownerConfig, dailyIngredients, dailyWastage, masterIngredients]);

  // POS Save handler
  const handleSavePosEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const newRecord: PosSalesRecord = {
      id: `pos_${Date.now()}`,
      date: posDate,
      cashSales: Number(posCash) || 0,
      upiSales: Number(posUpi) || 0,
      cardSales: Number(posCard) || 0,
      totalOrders: Number(posOrdersCount) || 0,
      cancelledOrders: Number(posCancelledCount) || 0,
      notes: posNote,
      createdAt: new Date().toISOString(),
    };
    onAddPosRecord(newRecord);
    setIsAddingPosModalOpen(false);
    setPosCash(0);
    setPosUpi(0);
    setPosCard(0);
    setPosOrdersCount(0);
    setPosCancelledCount(0);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* ANALYTICS SUITE NAVIGATOR (Executive Overview vs Date Multi-Comparison vs Menu Item Battle) */}
      <div className="bg-[#1E2B25] p-1.5 rounded-2xl border border-white/10 shadow-lg flex flex-col sm:flex-row gap-2">
        <button
          type="button"
          onClick={() => setAnalyticsMode("executive")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition text-xs font-bold ${
            analyticsMode === "executive"
              ? "bg-[#F5E086] text-[#24332D] shadow-md"
              : "bg-white/5 hover:bg-white/10 text-white/80 hover:text-white"
          }`}
        >
          <LayoutDashboard className="w-4 h-4 shrink-0" />
          <span>Executive Dashboard</span>
        </button>

        <button
          type="button"
          onClick={() => setAnalyticsMode("date_comparison")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition text-xs font-bold relative ${
            analyticsMode === "date_comparison"
              ? "bg-[#F5E086] text-[#24332D] shadow-md"
              : "bg-white/5 hover:bg-white/10 text-white/80 hover:text-white"
          }`}
        >
          <CalendarRange className="w-4 h-4 shrink-0" />
          <span>Date Multi-Comparison</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
              analyticsMode === "date_comparison"
                ? "bg-[#24332D] text-[#F5E086]"
                : "bg-emerald-500/20 text-emerald-300"
            }`}
          >
            2–5 Dates
          </span>
        </button>

        <button
          type="button"
          onClick={() => setAnalyticsMode("item_competition")}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl transition text-xs font-bold relative ${
            analyticsMode === "item_competition"
              ? "bg-[#F5E086] text-[#24332D] shadow-md"
              : "bg-white/5 hover:bg-white/10 text-white/80 hover:text-white"
          }`}
        >
          <Swords className="w-4 h-4 shrink-0 text-amber-300" />
          <span>Menu Item Battle</span>
          <span
            className={`px-1.5 py-0.5 rounded-full text-[9px] font-black uppercase ${
              analyticsMode === "item_competition"
                ? "bg-[#24332D] text-[#F5E086]"
                : "bg-amber-400/20 text-amber-300"
            }`}
          >
            2–5 Items
          </span>
        </button>
      </div>

      {/* VIEW 1: DATE MULTI-COMPARISON (Persistent DOM for zero latency) */}
      <div className={analyticsMode === "date_comparison" ? "block" : "hidden"}>
        <DateComparisonView
          allOrders={orders}
          allPos={posRecords}
          ownerConfig={ownerConfig}
          onOpenCostConfig={() => setIsOwnerCostConfigOpen(true)}
        />
      </div>

      {/* VIEW 2: MENU ITEM BATTLE (Persistent DOM for zero latency) */}
      <div className={analyticsMode === "item_competition" ? "block" : "hidden"}>
        <ItemCompetitionView
          allOrders={orders}
          ownerConfig={ownerConfig}
          onOpenCostConfig={() => setIsOwnerCostConfigOpen(true)}
        />
      </div>

      {/* VIEW 3: EXECUTIVE OVERVIEW (Persistent DOM for zero latency) */}
      <div className={analyticsMode === "executive" ? "space-y-6" : "hidden"}>
        {/* 1. GLOBAL TIME & DATE FILTER BAR */}
        <DateRangeFilterBar
          filter={filter}
          onFilterChange={setFilter}
          onExportExcel={() => exportAnalyticsToExcel(snapshot, orders, dailyIngredients, dailyWastage, masterIngredients)}
          onExportPdf={() => exportAnalyticsToPdfWithGraphs(snapshot, orders)}
          onExportCsv={() => exportAnalyticsToCsv(snapshot)}
          onOpenCuteCalendar={() => setIsCuteCalendarOpen(true)}
          onOpenCostConfig={() => setIsOwnerCostConfigOpen(true)}
          periodLabel={snapshot.periodLabel}
        />

        {/* POS Sync Action Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 bg-[#1A2520] p-3 rounded-2xl border border-white/10 text-xs">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-ping" />
            <span className="text-white/80 font-medium">
              Outlet: <strong className="text-[#F5E086]">{SINGLE_OUTLET_INFO.name}</strong>
            </span>
            <span className="text-white/40 hidden sm:inline">•</span>
            <span className="text-white/60 hidden sm:inline">
              Scope: <strong className="text-white">{snapshot.periodLabel}</strong>
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              type="button"
              onClick={() => setIsAddingPosModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 font-bold transition flex items-center gap-1.5 border border-emerald-400/30 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Sync Offline Counter POS</span>
            </button>
          </div>
        </div>

        {/* Real Cafe Operational Status Banner (Zero Simulation Notice) */}
        {snapshot.orderVolume.totalOrders === 0 && (
          <div className="bg-[#18231E] border border-amber-400/30 rounded-2xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5 text-amber-200">
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              <span className="text-[12px] leading-relaxed">
                <strong>Real Store Operations Active:</strong> 0 orders logged for {snapshot.periodLabel}. All analytics, graphs, and revenues reflect 100% genuine cafe activity (zero simulated or dummy numbers).
              </span>
            </div>
            <button
              type="button"
              onClick={() => setIsAddingPosModalOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-200 font-bold transition flex items-center gap-1.5 border border-amber-400/30 shrink-0 self-start sm:self-auto text-xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Log Counter Sale</span>
            </button>
          </div>
        )}

        {/* 2. DEEP FINANCIAL & ORDER KPI CARDS */}
        <FinancialKpiCards
          financials={snapshot.financials}
          orderVolume={snapshot.orderVolume}
        />

        {/* 3. RECHARTS SALES VELOCITY & TRAJECTORY (MULTIPLE GRAPH PERSPECTIVES) */}
        <SalesVelocityRechart
          timeSeries={snapshot.timeSeries}
          histogramData={snapshot.histogramData}
          paretoData={snapshot.paretoData}
          radarData={snapshot.radarData}
          isSingleDay={snapshot.isSingleDay}
          periodLabel={snapshot.periodLabel}
        />

        {/* 3B. PEAK ORDERING TIMES & ARTISAN SANDWICH PRODUCTION STAFFING SCALER */}
        <PeakOrderingTimesChart
          orders={orders}
        />

        {/* 4. CHANNELS (AGGREGATORS) & PAYMENT MODES (DONUTS) */}
        <ChannelsPaymentDonuts
          channels={snapshot.channels}
          paymentModes={snapshot.paymentModes}
        />

        {/* 5. MENU PERFORMANCE & ITEM VELOCITY (BARS & STARS) */}
        <MenuPerformanceBarChart
          topSellingItems={snapshot.topSellingItems}
          slowMovingItems={snapshot.slowMovingItems}
        />

        {/* 6. INVENTORY CONSUMPTION & RECIPE VARIANCE / WASTAGE */}
        <InventoryWastageSection
          variances={snapshot.inventoryVariances}
        />

        {/* 7. GRANULAR TRANSACTION LEDGER & ORDER AUDIT */}
        <OrderLedgerAuditTable
          orders={orders}
        />
      </div>

      {/* MODAL 1: Cute Calendar Modal */}
      <CuteCalendarModal
        isOpen={isCuteCalendarOpen}
        onClose={() => setIsCuteCalendarOpen(false)}
        currentFilter={filter}
        onApply={(newFilter) => setFilter(newFilter)}
      />

      {/* MODAL 2: Owner Cost & Fee Configuration */}
      <OwnerCostConfigModal
        isOpen={isOwnerCostConfigOpen}
        onClose={() => setIsOwnerCostConfigOpen(false)}
        config={ownerConfig}
        masterIngredients={masterIngredients}
        onUpdateMasterIngredients={onUpdateMasterIngredients}
        dailyIngredients={dailyIngredients}
        onUpdateDailyIngredients={onUpdateDailyIngredients}
        onSave={(newConfig) => {
          setOwnerConfig(newConfig);
          if (onUpdateFinancialSettings) {
            onUpdateFinancialSettings({
              advanceDepositAmount: financialSettings?.advanceDepositAmount ?? 150,
              gstRatePercent: newConfig.gstTaxRatePercent,
              packagingChargeTakeaway: newConfig.packagingFeePerTakeaway,
              cogsPercentage: newConfig.cogsPercentage,
              overheadAllocationPercent: newConfig.overheadAllocationPercent,
              targetWastagePercent: newConfig.targetWastagePercent,
              zomatoCommissionPercent: newConfig.zomatoCommissionPercent,
              swiggyCommissionPercent: newConfig.swiggyCommissionPercent,
            });
          }
        }}
      />

      {/* MODAL 3: Offline Counter POS Synchronizer */}
      {isAddingPosModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
          <div className="bg-[#1E2B25] border border-white/20 rounded-3xl w-full max-w-lg p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <h4 className="font-niea font-bold text-lg text-[#F5E086]">
                  Record Offline POS Counter Batch
                </h4>
                <p className="text-xs text-white/60">
                  Synchronize physical EDC terminal sales & counter cash register
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsAddingPosModalOpen(false)}
                className="text-white/60 hover:text-white text-lg font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSavePosEntry} className="space-y-4 text-xs">
              <div>
                <label className="text-white/70 block mb-1 font-semibold">Date of Session</label>
                <input
                  type="date"
                  value={posDate}
                  onChange={(e) => setPosDate(e.target.value)}
                  className="w-full bg-[#1A2520] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#F5E086]"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-white/70 block mb-1 font-semibold">Cash Sales (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={posCash || ""}
                    onChange={(e) => setPosCash(Number(e.target.value))}
                    placeholder="e.g. 18500"
                    className="w-full bg-[#1A2520] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#F5E086]"
                  />
                </div>
                <div>
                  <label className="text-white/70 block mb-1 font-semibold">UPI / QR Sales (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={posUpi || ""}
                    onChange={(e) => setPosUpi(Number(e.target.value))}
                    placeholder="e.g. 42000"
                    className="w-full bg-[#1A2520] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#F5E086]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-white/70 block mb-1 font-semibold">Card Sales (₹)</label>
                  <input
                    type="number"
                    min="0"
                    value={posCard || ""}
                    onChange={(e) => setPosCard(Number(e.target.value))}
                    placeholder="e.g. 12000"
                    className="w-full bg-[#1A2520] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#F5E086]"
                  />
                </div>
                <div>
                  <label className="text-white/70 block mb-1 font-semibold">Total Orders</label>
                  <input
                    type="number"
                    min="0"
                    value={posOrdersCount || ""}
                    onChange={(e) => setPosOrdersCount(Number(e.target.value))}
                    placeholder="e.g. 85"
                    className="w-full bg-[#1A2520] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#F5E086]"
                  />
                </div>
                <div>
                  <label className="text-white/70 block mb-1 font-semibold">Cancelled</label>
                  <input
                    type="number"
                    min="0"
                    value={posCancelledCount || ""}
                    onChange={(e) => setPosCancelledCount(Number(e.target.value))}
                    placeholder="e.g. 2"
                    className="w-full bg-[#1A2520] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#F5E086]"
                  />
                </div>
              </div>

              <div>
                <label className="text-white/70 block mb-1 font-semibold">Register Note / Batch Reference</label>
                <input
                  type="text"
                  value={posNote}
                  onChange={(e) => setPosNote(e.target.value)}
                  className="w-full bg-[#1A2520] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#F5E086]"
                />
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingPosModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#F5E086] text-[#24332D] font-bold hover:bg-[#F8E79B] transition"
                >
                  Save & Sync to Analytics
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Offline Counter POS Synchronizer */}
    </div>
  );
});
