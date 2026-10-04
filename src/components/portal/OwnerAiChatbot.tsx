import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from "recharts";
import {
  Sparkles,
  Mic,
  MicOff,
  Send,
  Volume2,
  VolumeX,
  RotateCcw,
  CheckCircle2,
  Clock,
  Package,
  Printer,
  ChevronRight,
  TrendingUp,
  Flame,
  LayoutGrid,
  Users,
  AlertTriangle,
  Receipt,
  Undo2,
  X,
  ExternalLink,
  MessageSquare,
  HelpCircle,
  ShoppingBag,
  Search,
  Calendar,
  Layers,
  Phone,
  ArrowRight,
  ArrowDown,
  Check,
} from "lucide-react";
import {
  MenuItem,
  OrderRecord,
  CartItem,
  SeatingStatus,
  CafeHighlight,
  ReservationRecord,
  PosSalesRecord,
  PreBookingConfig,
  PaymentMode,
} from "../../types/niea";
import {
  detectPeriodFromQuery,
  computeDateSpecificAnalytics,
  filterOrdersByDate,
  generateStoreAnalyticsSummary,
} from "../../utils/aiAnalyticsHelper";
import { generateTokenNumber } from "../../utils/tokenHelper";

export interface ChartViewItem {
  id: string;
  label: string;
  title: string;
  metricLabel: string;
  data: Array<{
    label: string;
    value: number;
    orders?: number;
    revenue?: number;
    color?: string;
    subLabel?: string;
    fullName?: string;
  }>;
}

export interface ChatMessageChartData {
  type: string;
  title: string;
  metricLabel?: string;
  data: Array<{
    label: string;
    value: number;
    orders?: number;
    revenue?: number;
    color?: string;
    subLabel?: string;
    fullName?: string;
  }>;
  availableViews?: ChartViewItem[];
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  isVoice?: boolean;
  actionsExecuted?: {
    type: string;
    label: string;
    details?: any;
    undoData?: any;
  }[];
  stats?: Record<string, string | number> | null;
  chartData?: ChatMessageChartData | null;
  foundOrders?: OrderRecord[] | null;
  foundReservations?: ReservationRecord[] | null;
  bulkStockSummary?: {
    label: string;
    count: number;
    targetStock: number;
    items: Array<{ id: string; name: string; oldStock: number; newStock: number }>;
  } | null;
  suggestedFollowUps?: string[];
}

interface OwnerAiChatbotProps {
  menuItems: MenuItem[];
  onUpdateMenuItem: (updated: MenuItem) => void;
  seating: SeatingStatus;
  onUpdateSeating: (updated: SeatingStatus) => void;
  liveOrders: OrderRecord[];
  onAddOrder?: (order: OrderRecord) => void;
  onOpenKot?: (order: OrderRecord) => void;
  onUpdateOrderStatus?: (
    orderId: string,
    status: "received" | "toasting" | "ready" | "served",
    customNote?: string
  ) => void;
  onUpdateOrderTimeLeft?: (orderId: string, minutesLeft: number, note?: string) => void;
  onSendOrderNotification?: (orderId: string, title: string, message: string) => void;
  cafeHighlight?: CafeHighlight;
  onUpdateCafeHighlight?: (highlight: CafeHighlight) => void;
  reservations?: ReservationRecord[];
  posRecords?: PosSalesRecord[];
  preBookingConfig?: PreBookingConfig;
  onUpdatePreBookingConfig?: (config: PreBookingConfig) => void;
  onSwitchTab?: (tabName: string) => void;
  analyticsDate?: string;
  getStoreAnalyticsSummary?: (
    targetDate?: string,
    range?: { start: string; end: string }
  ) => any;
  mode?: "embedded" | "drawer";
  onClose?: () => void;
}

interface AiChatAnalyticsGraphProps {
  chartData: NonNullable<ChatMessage["chartData"]>;
}

const AiChatAnalyticsGraph: React.FC<AiChatAnalyticsGraphProps> = ({ chartData }) => {
  const availableViews =
    chartData.availableViews && chartData.availableViews.length > 0
      ? chartData.availableViews
      : [
          {
            id: chartData.type || "hourly",
            label: "Chart",
            title: chartData.title,
            metricLabel: chartData.metricLabel || "Units",
            data: chartData.data,
          },
        ];

  // Initialize selected view to match the chart type that was asked
  const [selectedViewId, setSelectedViewId] = useState<string>(() => {
    const found = availableViews.find((v) => v.id === chartData.type);
    return found ? found.id : availableViews[0]?.id || "hourly";
  });

  const currentView = availableViews.find((v) => v.id === selectedViewId) || availableViews[0];
  const currentData = currentView?.data || chartData.data || [];

  const isCurrency = currentView?.id === "revenue" || currentView?.metricLabel?.includes("₹");
  const totalValue = currentData.reduce((acc, cur) => acc + (Number(cur.value) || 0), 0);
  const isLongLabels = currentData.some((d) => d.label && d.label.length > 9);

  const getBarColor = (idx: number, viewId: string) => {
    if (viewId === "status") {
      const colors = ["#3B82F6", "#F59E0B", "#10B981", "#8B5CF6"];
      return colors[idx % colors.length];
    }
    if (viewId === "dining") {
      return idx === 0 ? "#10B981" : "#F59E0B";
    }
    if (viewId === "revenue") {
      const colors = ["#F5E086", "#F59E0B", "#10B981", "#38BDF8", "#A78BFA", "#FB7185"];
      return colors[idx % colors.length];
    }
    if (viewId === "items") {
      const colors = ["#F5E086", "#34D399", "#38BDF8", "#F472B6", "#FBBF24", "#A78BFA"];
      return colors[idx % colors.length];
    }
    // Hourly velocity
    const entry = currentData[idx];
    const val = entry?.value || 0;
    return val >= 25 ? "#EF4444" : val >= 18 ? "#F59E0B" : "#10B981";
  };

  return (
    <div className="mt-3 p-3.5 sm:p-4 rounded-2xl bg-[#17221E] border border-amber-400/25 space-y-3 shadow-xl w-full">
      {/* Header with Title and Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-black text-[#F5E086]">
            <TrendingUp className="w-4 h-4 text-emerald-400" />
            <span>{currentView.title || chartData.title}</span>
          </div>
          <span className="text-[10px] text-white/50">
            Real-time Verified Store Metrics • {currentView.metricLabel}
          </span>
        </div>

        {/* View Switcher Tabs (whichever data is asked) */}
        {availableViews.length > 1 && (
          <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-0.5 max-w-full">
            {availableViews.map((vw) => {
              const isActive = vw.id === currentView.id;
              return (
                <button
                  key={vw.id}
                  type="button"
                  onClick={() => setSelectedViewId(vw.id)}
                  className={`px-2.5 py-1 rounded-xl text-[10px] font-bold transition whitespace-nowrap flex items-center gap-1 cursor-pointer shrink-0 ${
                    isActive
                      ? "bg-gradient-to-r from-amber-400 to-[#F5E086] text-[#24332D] shadow-sm font-black ring-1 ring-amber-400/50"
                      : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white border border-white/5"
                  }`}
                >
                  {vw.id === "items" && "🥪"}
                  {vw.id === "hourly" && "⏱"}
                  {vw.id === "status" && "🍳"}
                  {vw.id === "revenue" && "💰"}
                  {vw.id === "dining" && "🍽"}
                  <span>{vw.label}</span>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Chart Canvas with Guaranteed Non-Zero Height */}
      <div className="w-full h-[220px] min-h-[200px] relative">
        {currentData.length === 0 ? (
          <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 border border-dashed border-white/10 rounded-xl bg-black/20 text-xs text-white/50 space-y-1">
            <span className="text-sm font-bold text-amber-300">No Orders in this Category Yet</span>
            <span>Customer orders placed in the store will render here automatically.</span>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={210} minHeight={200}>
            <BarChart
              data={currentData}
              margin={{
                top: 10,
                right: 12,
                left: -16,
                bottom: isLongLabels ? 32 : 6,
              }}
            >
              <XAxis
                dataKey="label"
                stroke="rgba(255,255,255,0.6)"
                fontSize={10}
                tickLine={false}
                interval={0}
                angle={isLongLabels ? -20 : 0}
                textAnchor={isLongLabels ? "end" : "middle"}
                height={isLongLabels ? 42 : 22}
              />
              <YAxis
                stroke="rgba(255,255,255,0.6)"
                fontSize={10}
                tickLine={false}
                axisLine={false}
                domain={[0, (dataMax: number) => Math.max(dataMax + 1, 4)]}
                allowDecimals={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const item = payload[0].payload;
                    return (
                      <div className="bg-[#1C2822] border border-amber-400/30 p-2.5 rounded-xl text-xs text-white shadow-2xl space-y-1 z-30">
                        <div className="font-bold text-[#F5E086]">
                          {item.fullName || item.label}
                        </div>
                        <div className="text-emerald-300 font-mono font-bold text-sm">
                          {isCurrency
                            ? `₹${Number(item.value).toLocaleString("en-IN")}`
                            : `${item.value} ${currentView.metricLabel}`}
                        </div>
                        {item.subLabel && (
                          <div className="text-white/60 text-[10px]">
                            {item.subLabel}
                          </div>
                        )}
                        {item.revenue !== undefined && !isCurrency && (
                          <div className="text-[#F5E086]/90 font-mono text-[10px]">
                            Gross Sales: ₹${Number(item.revenue).toLocaleString("en-IN")}
                          </div>
                        )}
                        {item.orders !== undefined && (
                          <div className="text-white/60 font-mono text-[10px]">
                            {item.orders} Order tickets
                          </div>
                        )}
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Bar dataKey="value" radius={[5, 5, 0, 0]}>
                {currentData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={entry.color || getBarColor(index, currentView.id)}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Footer Info / Legend */}
      <div className="flex flex-wrap items-center justify-between text-[10px] text-white/60 border-t border-white/5 pt-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-amber-300/90">
            Total {currentView.metricLabel}:
          </span>
          <span className="font-mono font-bold text-white">
            {isCurrency ? `₹${totalValue.toLocaleString("en-IN")}` : totalValue}
          </span>
        </div>

        {currentView.id === "hourly" ? (
          <div className="flex items-center gap-3">
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-red-500" />
              <span>Surge (25+)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-amber-500" />
              <span>Peak (18-24)</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>Steady (&lt;18)</span>
            </span>
          </div>
        ) : (
          <span className="text-emerald-400 font-medium">
            Tap tabs above to toggle between Hourly, Items, Status & Revenue graphs
          </span>
        )}
      </div>
    </div>
  );
};

interface ChatMessageItemProps {
  msg: ChatMessage;
  onFollowUpClick: (text: string) => void;
  onOpenKot?: (order: OrderRecord) => void;
  onUpdateOrderStatus?: (
    orderId: string,
    status: "received" | "toasting" | "ready" | "served",
    customNote?: string
  ) => void;
  handleUndo: (undoData: any) => void;
}

const ChatMessageItem: React.FC<ChatMessageItemProps> = React.memo(
  ({ msg, onFollowUpClick, onOpenKot, onUpdateOrderStatus, handleUndo }) => {
    return (
      <div
        className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
      >
        {/* Header info */}
        <div className="flex items-center gap-1.5 mb-1 px-1 text-[10px] text-white/40 font-mono">
          <span>{msg.role === "user" ? "Owner Command" : "NiEA NiEA Assistant"}</span>
          <span>•</span>
          <span>{msg.timestamp}</span>
          {msg.isVoice && (
            <span className="px-1.5 py-0.2 rounded-md bg-amber-400/20 text-amber-300 font-bold flex items-center gap-1">
              <Mic className="w-2.5 h-2.5" />
              <span>Voice</span>
            </span>
          )}
        </div>

        {/* Bubble */}
        <div
          className={`max-w-[94%] sm:max-w-[85%] rounded-2xl p-3.5 shadow-md ${
            msg.role === "user"
              ? "bg-gradient-to-r from-[#F5E086] to-amber-300 text-[#24332D] font-medium rounded-tr-sm"
              : "bg-[#23352E] text-white/95 border border-white/10 rounded-tl-sm space-y-2.5"
          }`}
        >
          <p className="text-sm leading-relaxed whitespace-pre-line">{msg.content}</p>

          {/* Render key stats card if provided */}
          {msg.stats && (
            <div className="mt-2.5 grid grid-cols-2 sm:grid-cols-3 gap-2 p-2.5 rounded-xl bg-black/30 border border-white/10">
              {Object.entries(msg.stats).map(([k, v]) => (
                <div key={k} className="p-2 rounded-lg bg-white/5">
                  <div className="text-[10px] uppercase tracking-wider text-white/50 font-bold">
                    {k.replace(/([A-Z])/g, " $1")}
                  </div>
                  <div className="text-sm font-black text-[#F5E086] font-mono mt-0.5">{v}</div>
                </div>
              ))}
            </div>
          )}

          {/* Render Interactive Analytics Visualization if present */}
          {msg.chartData && (
            <AiChatAnalyticsGraph chartData={msg.chartData} />
          )}

          {/* Render Found Orders List if present */}
          {msg.foundOrders && msg.foundOrders.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="text-xs font-bold text-[#F5E086] flex items-center gap-1.5">
                <Search className="w-3.5 h-3.5" />
                <span>Matched Orders ({msg.foundOrders.length}):</span>
              </div>

              {msg.foundOrders.map((ord) => (
                <div
                  key={ord.id}
                  className="p-3 rounded-xl bg-black/40 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-bold text-sm text-[#F5E086]">
                        #{ord.tokenNumber || ord.orderNumber}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          ord.status === "ready"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : ord.status === "toasting"
                            ? "bg-amber-500/20 text-amber-300"
                            : "bg-sky-500/20 text-sky-300"
                        }`}
                      >
                        {ord.status}
                      </span>
                      <span className="text-xs font-bold text-white">{ord.customerName}</span>
                    </div>
                    <div className="text-[11px] text-white/60 mt-0.5">
                      {(ord.items || []).map((it: any) => `${it.quantity}x ${it.item?.name || it.name || it.itemName || "Artisan Melt"}`).join(", ")} · ₹{ord.grandTotal}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                    {onOpenKot && (
                      <button
                        type="button"
                        onClick={() => onOpenKot(ord)}
                        className="px-2 py-1 rounded-lg bg-[#F5E086] text-[#24332D] text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                      >
                        <Printer className="w-3 h-3" />
                        <span>KOT</span>
                      </button>
                    )}
                    {onUpdateOrderStatus && ord.status !== "ready" && (
                      <button
                        type="button"
                        onClick={() => onUpdateOrderStatus(ord.id, "ready", "Marked ready via NiEA Assistant")}
                        className="px-2 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[11px] font-bold transition cursor-pointer"
                      >
                        Mark Ready
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Render Found Reservations if present */}
          {msg.foundReservations && msg.foundReservations.length > 0 && (
            <div className="mt-3 space-y-2">
              <div className="text-xs font-bold text-[#F5E086] flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5" />
                <span>Table Bookings & Reservations:</span>
              </div>

              {msg.foundReservations.map((res) => (
                <div
                  key={res.id}
                  className="p-3 rounded-xl bg-black/40 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white text-sm">{res.customerName}</span>
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-400/20 text-amber-300">
                        {res.guestCount} Guests
                      </span>
                      <span className="text-white/50 text-[11px]">({res.timeSlot})</span>
                    </div>
                    <div className="text-[11px] text-white/60 mt-0.5 flex items-center gap-2">
                      <span>Area: {res.seatingArea || "Indoor Table"}</span>
                      <span>•</span>
                      <span>Status: {res.status}</span>
                      {res.customerPhone && (
                        <>
                          <span>•</span>
                          <span>📞 {res.customerPhone}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Render Bulk Stock Restock Summary Card */}
          {msg.bulkStockSummary && (
            <div className="mt-3 p-3.5 rounded-2xl bg-amber-950/40 border border-amber-400/40 space-y-2.5 shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Package className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-amber-200">
                    Bulk Stock Update: {msg.bulkStockSummary.label} ({msg.bulkStockSummary.count} items)
                  </span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-mono font-black bg-amber-400 text-[#24332D]">
                  {msg.bulkStockSummary.targetStock} Units Each
                </span>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto pr-1">
                {msg.bulkStockSummary.items.map((it) => (
                  <span
                    key={it.id}
                    className="px-2 py-0.5 rounded-lg bg-black/40 border border-white/10 text-[11px] text-white/80 flex items-center gap-1.5"
                  >
                    <span>{it.name}:</span>
                    <span className="text-white/40 line-through">{it.oldStock}</span>
                    <ArrowRight className="w-2.5 h-2.5 text-amber-300" />
                    <span className="font-bold text-amber-300">{it.newStock}</span>
                  </span>
                ))}
              </div>

              <div className="flex items-center justify-between pt-1 border-t border-white/10 text-[11px]">
                <span className="text-white/50">Synced to online menu & POS instantly</span>
                <button
                  type="button"
                  onClick={() => handleUndo({ type: "REVERT_BULK_STOCK", items: msg.bulkStockSummary?.items })}
                  className="px-2.5 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-400/30 font-bold transition flex items-center gap-1 cursor-pointer"
                >
                  <Undo2 className="w-3 h-3" />
                  <span>Undo All</span>
                </button>
              </div>
            </div>
          )}

          {/* Render executed action chips/receipts */}
          {msg.actionsExecuted && msg.actionsExecuted.length > 0 && (
            <div className="mt-2.5 space-y-2">
              <div className="text-[11px] font-bold text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                <span>Executed Live:</span>
              </div>

              {msg.actionsExecuted.slice(0, 5).map((act, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                >
                  <div className="flex items-center gap-2">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold text-emerald-200">{act.label}</span>
                  </div>

                  <div className="flex items-center gap-1.5 ml-auto sm:ml-0">
                    {act.details?.order && onOpenKot && (
                      <button
                        type="button"
                        onClick={() => onOpenKot(act.details.order)}
                        className="px-2 py-1 rounded-lg bg-[#F5E086] hover:bg-amber-300 text-[#24332D] text-[11px] font-bold transition flex items-center gap-1 shadow-sm cursor-pointer"
                      >
                        <Printer className="w-3 h-3" />
                        <span>KOT Slip</span>
                      </button>
                    )}

                    {act.undoData && (
                      <button
                        type="button"
                        onClick={() => handleUndo(act.undoData)}
                        className="px-2 py-1 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-300 border border-red-400/30 text-[11px] font-bold transition flex items-center gap-1 cursor-pointer"
                        title="Undo this action"
                      >
                        <Undo2 className="w-3 h-3" />
                        <span>Undo</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}

              {msg.actionsExecuted.length > 5 && (
                <div className="text-[11px] text-emerald-300/80 pl-1 font-mono">
                  + {msg.actionsExecuted.length - 5} more items updated in bulk.
                </div>
              )}
            </div>
          )}
        </div>

        {/* Suggested follow-up prompt chips */}
        {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5 pl-1">
            {msg.suggestedFollowUps.map((promptText, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => onFollowUpClick(promptText)}
                className="px-2.5 py-1 rounded-xl bg-white/5 hover:bg-amber-400/20 text-white/70 hover:text-amber-200 border border-white/5 hover:border-amber-400/30 text-[11px] transition text-left cursor-pointer"
              >
                💬 {promptText}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);

ChatMessageItem.displayName = "ChatMessageItem";

export const OwnerAiChatbot: React.FC<OwnerAiChatbotProps> = ({
  menuItems,
  onUpdateMenuItem,
  seating,
  onUpdateSeating,
  liveOrders,
  onAddOrder,
  onOpenKot,
  onUpdateOrderStatus,
  onUpdateOrderTimeLeft,
  onSendOrderNotification,
  cafeHighlight,
  onUpdateCafeHighlight,
  reservations = [],
  posRecords = [],
  preBookingConfig,
  onUpdatePreBookingConfig,
  onSwitchTab,
  analyticsDate,
  getStoreAnalyticsSummary,
  mode = "embedded",
  onClose,
}) => {
  // Filter out any mock/seeded/simulated or malformed records
  const validLiveOrders = useMemo(() => {
    return (liveOrders || []).filter(
      (o) =>
        o &&
        typeof o.id === "string" &&
        !o.id.startsWith("seed_") &&
        !o.id.startsWith("ord_sample_") &&
        !o.id.startsWith("sample_") &&
        !o.id.startsWith("mock_") &&
        !o.id.startsWith("demo_") &&
        !o.id.startsWith("test_")
    );
  }, [liveOrders]);

  const [messages, setMessages] = useState<ChatMessage[]>(() => [
    {
      id: "msg_welcome",
      role: "assistant",
      content:
        "👋 Welcome, Chef/Owner! I am your versatile NiEA AI Executive Copilot.\n\nAsk or command me to:\n• Set stocks to ANY number (all items together or specific ones)\n• Take walk-in orders with voice or text\n• Update website banners & highlights\n• Search orders by customer name or token\n• Check reservations\n• Analyze sales with charts & peak rush graphs.",
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      suggestedFollowUps: [
        "Set stock of all items to 25",
        "Take walk-in: 2 Truffle Melt & 1 Cold Brew (Table 3)",
        "Show peak ordering times chart",
        "What is our most ordered item & peak hour?",
      ],
    },
  ]);

  const [inputQuery, setInputQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // Automatic audio feedback removed per user specification
  const [isListening, setIsListening] = useState(false);
  const [liveTranscript, setLiveTranscript] = useState("");
  const [speechSupported, setSpeechSupported] = useState(false);
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const chatScrollContainerRef = useRef<HTMLDivElement>(null);
  const [showJumpToBottom, setShowJumpToBottom] = useState(false);

  // Dedicated Auto-scroll to bottom of chat container
  const scrollToBottom = useCallback((behavior: ScrollBehavior = "smooth") => {
    if (chatScrollContainerRef.current) {
      const container = chatScrollContainerRef.current;
      container.scrollTo({
        top: container.scrollHeight,
        behavior,
      });
    }
  }, []);

  const handleChatScroll = useCallback(() => {
    if (!chatScrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = chatScrollContainerRef.current;
    const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
    const shouldShow = distanceFromBottom > 200;
    setShowJumpToBottom((prev) => (prev !== shouldShow ? shouldShow : prev));
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputQuery(e.target.value);
  }, []);

  useEffect(() => {
    // Only auto-scroll down if user is already near the bottom, so reading history isn't interrupted
    if (chatScrollContainerRef.current) {
      const { scrollTop, scrollHeight, clientHeight } = chatScrollContainerRef.current;
      const distanceFromBottom = scrollHeight - scrollTop - clientHeight;
      if (distanceFromBottom < 180) {
        const t = setTimeout(() => {
          scrollToBottom("smooth");
        }, 50);
        return () => clearTimeout(t);
      }
    } else {
      const t = setTimeout(() => {
        scrollToBottom("smooth");
      }, 50);
      return () => clearTimeout(t);
    }
  }, [messages.length]);

  // Ensure speech synthesis is completely silenced on mount
  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }
  }, []);

  // Setup Web Speech API for voice recognition
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      setSpeechSupported(true);
      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = true;
        recognition.lang = "en-IN";

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          let currentTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; i++) {
            currentTranscript += event.results[i][0].transcript;
          }
          setLiveTranscript(currentTranscript);

          if (event.results[event.results.length - 1].isFinal) {
            setInputQuery(currentTranscript);
            setTimeout(() => {
              handleSubmitPrompt(currentTranscript, true);
            }, 300);
          }
        };

        recognition.onerror = (err: any) => {
          console.warn("[Voice Recognition Error]", err);
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
          setLiveTranscript("");
        };

        recognitionRef.current = recognition;
      } catch (err) {
        console.warn("Speech recognition initialization failed:", err);
      }
    }
  }, []);

  // Ensure speech synthesis and recognition are cleaned up on unmount
  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        try {
          window.speechSynthesis.cancel();
        } catch {}
      }
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
    };
  }, []);

  const toggleListening = useCallback(() => {
    if (!speechSupported || !recognitionRef.current) {
      setActionNotice("Voice input is not supported in this browser. Please type your message.");
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
    } else {
      try {
        setLiveTranscript("");
        recognitionRef.current.start();
        setIsListening(true);
      } catch (e) {
        console.warn("Could not start speech recognition:", e);
        setIsListening(false);
      }
    }
  }, [speechSupported, isListening]);

  // Helper to execute actions returned by AI
  const executeAiAction = (action: { type: string; payload: any }): { label: string; details?: any; undoData?: any } => {
    const { type, payload } = action;

    switch (type) {
      case "CREATE_WALKIN_ORDER": {
        const customerName = payload.customerName || "Walk-In Guest";
        const orderType = (payload.orderType || "dine-in") as "dine-in" | "takeaway";
        const tableNumber = payload.tableNumber || (orderType === "dine-in" ? "Table 1" : "Counter Queue");
        const items = payload.items || [];
        const paymentMethod = (payload.paymentMethod || "cash") as PaymentMode;

        const cartItems: CartItem[] = items.map((it: any) => {
          const matched = menuItems.find(
            (m) =>
              m.id === it.itemId ||
              m.name.toLowerCase() === (it.itemName || "").toLowerCase() ||
              m.name.toLowerCase().includes((it.itemName || "").toLowerCase())
          );

          const menuItem: MenuItem = matched || {
            id: it.itemId || `custom_${Date.now()}`,
            name: it.itemName || "Artisan Melt",
            price: it.unitPrice || 280,
            category: "toasties",
            isVeg: true,
            stockLeft: 10,
            initialStock: 15,
            imageUrl: "/niea_logo.svg",
            description: "Freshly made artisanal sourdough toasting order",
            tags: ["Artisan"],
            restockSchedule: "Daily",
            breadChoices: ["Artisan Sourdough", "Japanese Milk Bread"],
          };

          const quantity = Math.max(1, Number(it.quantity) || 1);
          const unitPrice = it.unitPrice || menuItem.price || 280;

          return {
            cartItemId: `walkin_ai_${menuItem.id}_${Date.now()}`,
            item: menuItem,
            quantity,
            selectedBread: menuItem.breadChoices?.[0] || "Artisan Sourdough",
            selectedCustomizations: [],
            specialInstructions: it.notes || "Order placed via NiEA Assistant",
            unitPrice,
            totalPrice: unitPrice * quantity,
          };
        });

        const subtotal = cartItems.reduce((acc, c) => acc + c.totalPrice, 0);
        const taxes = Math.round(subtotal * 0.05);
        const grandTotal = subtotal + taxes;
        const nowIso = new Date().toISOString();
        const tokenNumber = generateTokenNumber();
        const orderNumber = `NIEA-WALK-${Math.floor(1000 + Math.random() * 9000)}`;

        const newOrder: OrderRecord = {
          id: `ord_ai_${Date.now()}`,
          orderNumber,
          tokenNumber,
          orderType,
          orderKind: "walk_in",
          orderSource: "walk_in",
          tableNumber,
          customerName,
          customerPhone: payload.customerPhone || "Walk-In Guest",
          items: cartItems,
          subtotal,
          taxes,
          packagingCharge: 0,
          discount: 0,
          grandTotal,
          paymentMethod,
          paymentStatus: "paid",
          createdAt: nowIso,
          estimatedTime: `${seating.estimatedWaitMinutes || 25} mins`,
          estimatedWaitingMinutes: seating.estimatedWaitMinutes || 25,
          waitingStartedAt: nowIso,
          estimatedMinutesLeft: seating.estimatedWaitMinutes || 25,
          status: "received",
          kitchenStatus: "kot_dispatched",
          kotPrinted: true,
          orderNotes: payload.orderNotes || "Created via NiEA NiEA Assistant",
        };

        if (onAddOrder) {
          onAddOrder(newOrder);
        }

        setActionNotice(`✅ Created Walk-In Order #${tokenNumber} for ${customerName}`);
        return {
          label: `Order ${tokenNumber} (${customerName}) Created`,
          details: { order: newOrder },
          undoData: { type: "DELETE_ORDER", orderId: newOrder.id },
        };
      }

      case "UPDATE_MENU_STOCK": {
        const target = menuItems.find(
          (m) =>
            m.id === payload.itemId ||
            m.name.toLowerCase() === (payload.itemName || "").toLowerCase() ||
            m.name.toLowerCase().includes((payload.itemName || "").toLowerCase())
        );

        if (target) {
          const oldStock = target.stockLeft;
          const updated: MenuItem = {
            ...target,
            stockLeft: typeof payload.stockLeft === "number" ? payload.stockLeft : 0,
            ...(typeof payload.price === "number" ? { price: payload.price } : {}),
          };
          onUpdateMenuItem(updated);
          setActionNotice(`📦 Stock updated: ${target.name} -> ${updated.stockLeft} units`);
          return {
            label: `Stock: ${target.name} -> ${updated.stockLeft}`,
            details: { item: updated, oldStock },
            undoData: { type: "REVERT_STOCK", itemId: target.id, oldStock },
          };
        }
        return { label: `Stock updated for ${payload.itemName || "item"}` };
      }

      case "UPDATE_QUEUE_WAIT_TIME": {
        const newMins = Math.max(0, Number(payload.estimatedWaitMinutes) || 0);
        const oldMins = seating.estimatedWaitMinutes;
        const updatedSeating: SeatingStatus = {
          ...seating,
          estimatedWaitMinutes: newMins,
          lastUpdated: new Date().toISOString(),
        };
        onUpdateSeating(updatedSeating);

        fetch("/api/seating", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ estimatedWaitMinutes: newMins }),
        }).catch(() => {});

        setActionNotice(`⏱️ Kitchen wait time set to ${newMins} mins`);
        return {
          label: `Queue Wait Time: ${newMins} mins`,
          details: { newMins, oldMins },
          undoData: { type: "REVERT_WAIT_TIME", oldMins },
        };
      }

      case "UPDATE_ORDER_STATUS": {
        const targetOrder = liveOrders.find(
          (o) =>
            o.tokenNumber?.toLowerCase() === (payload.orderNumberOrToken || "").toLowerCase() ||
            o.orderNumber?.toLowerCase() === (payload.orderNumberOrToken || "").toLowerCase() ||
            o.id === payload.orderNumberOrToken
        );

        if (targetOrder && onUpdateOrderStatus) {
          const oldStatus = targetOrder.status;
          onUpdateOrderStatus(targetOrder.id, payload.status as any, `Updated via NiEA Assistant`);
          setActionNotice(`🔔 Order #${targetOrder.tokenNumber || targetOrder.orderNumber} -> ${payload.status}`);
          return {
            label: `Order #${targetOrder.tokenNumber || targetOrder.orderNumber} -> ${payload.status}`,
            details: { order: targetOrder, newStatus: payload.status, oldStatus },
            undoData: { type: "REVERT_ORDER_STATUS", orderId: targetOrder.id, oldStatus },
          };
        }
        return { label: `Order status updated` };
      }

      case "UPDATE_ORDER_TIMER": {
        const targetOrder = liveOrders.find(
          (o) =>
            o.tokenNumber?.toLowerCase() === (payload.orderNumberOrToken || "").toLowerCase() ||
            o.orderNumber?.toLowerCase() === (payload.orderNumberOrToken || "").toLowerCase() ||
            o.id === payload.orderNumberOrToken
        );

        if (targetOrder && onUpdateOrderTimeLeft) {
          const minutesLeft = Math.max(0, Number(payload.minutesLeft) || 0);
          onUpdateOrderTimeLeft(targetOrder.id, minutesLeft, `Timer set via NiEA Assistant`);
          setActionNotice(`⏱️ Timer for #${targetOrder.tokenNumber} updated to ${minutesLeft} mins`);
          return {
            label: `Timer #${targetOrder.tokenNumber}: ${minutesLeft} mins`,
            details: { order: targetOrder, minutesLeft },
          };
        }
        return { label: `Order timer skipped` };
      }

      case "UPDATE_WEBSITE_HIGHLIGHT": {
        if (onUpdateCafeHighlight && cafeHighlight) {
          const oldHighlight = { ...cafeHighlight };
          const updatedHighlight: CafeHighlight = {
            ...cafeHighlight,
            title: payload.title || cafeHighlight.title,
            badge: payload.badge || "Chef's Special",
            description: payload.description || cafeHighlight.description,
            mode: payload.mode || "manual",
            lastUpdated: new Date().toISOString(),
          };
          onUpdateCafeHighlight(updatedHighlight);
          setActionNotice(`🌟 Website highlight banner updated: "${updatedHighlight.title}"`);
          return {
            label: `Banner: "${updatedHighlight.title}"`,
            details: { highlight: updatedHighlight },
            undoData: { type: "REVERT_HIGHLIGHT", oldHighlight },
          };
        }
        return { label: `Website highlight updated` };
      }

      case "NAVIGATE_TAB": {
        // Redirection disabled: keep all answers in the AI chat section
        return {
          label: `Information provided in chat`,
        };
      }

      default:
        return { label: `Executed ${type}` };
    }
  };

  // Handle undo actions
  const handleUndo = useCallback(
    (undoData: any) => {
      if (!undoData) return;
      if (undoData.type === "REVERT_STOCK") {
        const item = menuItems.find((m) => m.id === undoData.itemId);
        if (item) {
          onUpdateMenuItem({ ...item, stockLeft: undoData.oldStock });
          setActionNotice(`↩️ Restored stock for ${item.name} to ${undoData.oldStock}`);
        }
      } else if (undoData.type === "REVERT_BULK_STOCK" && Array.isArray(undoData.items)) {
        undoData.items.forEach((it: any) => {
          const item = menuItems.find((m) => m.id === it.id);
          if (item) {
            onUpdateMenuItem({ ...item, stockLeft: it.oldStock });
          }
        });
        setActionNotice(`↩️ Restored all ${undoData.items.length} items to previous stock levels`);
      } else if (undoData.type === "REVERT_WAIT_TIME") {
        onUpdateSeating({ ...seating, estimatedWaitMinutes: undoData.oldMins });
        setActionNotice(`↩️ Reverted kitchen wait time to ${undoData.oldMins} mins`);
      } else if (undoData.type === "REVERT_HIGHLIGHT" && onUpdateCafeHighlight) {
        onUpdateCafeHighlight(undoData.oldHighlight);
        setActionNotice(`↩️ Reverted website highlight banner`);
      } else if (undoData.type === "REVERT_ORDER_STATUS" && onUpdateOrderStatus) {
        onUpdateOrderStatus(undoData.orderId, undoData.oldStatus, "Reverted via NiEA Assistant");
        setActionNotice(`↩️ Reverted order status to ${undoData.oldStatus}`);
      }
    },
    [menuItems, onUpdateMenuItem, seating, onUpdateSeating, onUpdateCafeHighlight, onUpdateOrderStatus]
  );

  // Helper to compute genuine ground-truth analytics from current validLiveOrders filtered by selected date (Zero simulated random numbers)
  const computeRealClientStats = (explicitDate?: string) => {
    const effectiveDate = explicitDate || analyticsDate || new Date().toISOString().slice(0, 10);
    const dateOrders = filterOrdersByDate(validLiveOrders, effectiveDate);
    const totalOrders = dateOrders.length;
    const totalRevenue = dateOrders.reduce((sum, o) => {
      const val = Number(o.grandTotal);
      return sum + (!isNaN(val) && val >= 0 && val < 50000 ? val : 0);
    }, 0);
    const activeOrders = dateOrders.filter((o) => o.status !== "served");
    const receivedOrders = dateOrders.filter((o) => o.status === "received");
    const toastingOrders = dateOrders.filter((o) => o.status === "toasting");
    const readyOrders = dateOrders.filter((o) => o.status === "ready");
    const servedOrders = dateOrders.filter((o) => o.status === "served");

    const itemCounts: Record<string, { name: string; quantity: number; revenue: number; ordersCount: number }> = {};
    let totalItems = 0;

    dateOrders.forEach((o) => {
      (o.items || []).forEach((it: any) => {
        const name = it.item?.name || it.name || "Artisan Melt";
        const qty = Number(it.quantity) || 1;
        const price = Number(it.unitPrice) || (it.item?.price) || (Number(it.totalPrice) && qty ? Number(it.totalPrice) / qty : 280);
        if (!itemCounts[name]) {
          itemCounts[name] = { name, quantity: 0, revenue: 0, ordersCount: 0 };
        }
        itemCounts[name].quantity += qty;
        itemCounts[name].revenue += price * qty;
        itemCounts[name].ordersCount += 1;
        totalItems += qty;
      });
    });

    const sortedItems = Object.values(itemCounts).sort((a, b) => b.quantity - a.quantity);
    const topItem = sortedItems[0] || null;

    const hourlyMap: Record<number, { orders: number; sandwiches: number; revenue: number }> = {};
    dateOrders.forEach((o) => {
      if (o.createdAt) {
        const d = new Date(o.createdAt);
        if (!isNaN(d.getTime())) {
          const hr = d.getHours();
          if (!hourlyMap[hr]) hourlyMap[hr] = { orders: 0, sandwiches: 0, revenue: 0 };
          hourlyMap[hr].orders += 1;
          const sCount = (o.items || []).reduce((s: number, it: any) => s + (Number(it.quantity) || 1), 0);
          hourlyMap[hr].sandwiches += sCount;
          hourlyMap[hr].revenue += Number(o.grandTotal) || 0;
        }
      }
    });

    const activeHours = Object.keys(hourlyMap).map(Number);
    const baseHours = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
    const allHours = Array.from(new Set([...baseHours, ...activeHours])).sort((a, b) => a - b);

    const hourlyChartData = allHours.map((hr) => {
      const label = hr === 0 ? "12 AM" : hr === 12 ? "12 PM" : hr > 12 ? `${hr - 12} PM` : `${hr} AM`;
      return {
        label,
        value: hourlyMap[hr]?.sandwiches || 0,
        orders: hourlyMap[hr]?.orders || 0,
        revenue: hourlyMap[hr]?.revenue || 0,
      };
    });

    const nonZeroHours = hourlyChartData.filter((h) => h.value > 0);
    let peakHourLabel = "No peak recorded yet today";
    if (nonZeroHours.length > 0) {
      const peak = nonZeroHours.reduce((max, cur) => (cur.value > max.value ? cur : max), nonZeroHours[0]);
      peakHourLabel = `${peak.label} (${peak.value} items, ${peak.orders} tickets)`;
    }

    const dineInCount = dateOrders.filter((o) => o.orderType === "dine-in" || o.orderKind === "dine_in").length;
    const takeawayCount = dateOrders.filter((o) => o.orderType === "takeaway" || o.orderKind === "takeaway").length;

    const itemChartData = sortedItems.map((it) => ({
      label: it.name.length > 18 ? it.name.slice(0, 16) + "…" : it.name,
      fullName: it.name,
      value: it.quantity,
      revenue: it.revenue,
      orders: it.ordersCount,
    }));

    const statusChartData = [
      { label: "Received", value: receivedOrders.length, color: "#3B82F6", subLabel: "Active In Queue" },
      { label: "Toasting", value: toastingOrders.length, color: "#F59E0B", subLabel: "In Kitchen" },
      { label: "Ready", value: readyOrders.length, color: "#10B981", subLabel: "Ready for Pickup" },
      { label: "Served", value: servedOrders.length, color: "#8B5CF6", subLabel: "Completed" },
    ];

    const revenueChartData = sortedItems.map((it) => ({
      label: it.name.length > 18 ? it.name.slice(0, 16) + "…" : it.name,
      fullName: it.name,
      value: it.revenue,
      quantity: it.quantity,
    }));

    const diningChartData = [
      { label: "Dine-In", value: dineInCount, color: "#10B981", subLabel: "Table Service" },
      { label: "Takeaway", value: takeawayCount, color: "#F59E0B", subLabel: "Counter / Parcel" },
    ];

    return {
      totalOrders,
      totalRevenue,
      activeOrdersCount: activeOrders.length,
      receivedCount: receivedOrders.length,
      toastingCount: toastingOrders.length,
      readyCount: readyOrders.length,
      servedCount: servedOrders.length,
      totalItems,
      sortedItems,
      topItem,
      hourlyChartData,
      chartDataArray: hourlyChartData,
      itemChartData,
      statusChartData,
      revenueChartData,
      diningChartData,
      peakHourLabel,
      dineInCount,
      takeawayCount,
    };
  };

  // Helper to build full multi-view chart payload matching what was asked in the query
  const buildClientChartPayloadForQuery = (queryText: string, realStats: ReturnType<typeof computeRealClientStats>): ChatMessageChartData => {
    const lower = (queryText || "").toLowerCase();

    let primaryType = "hourly";
    let title = "Hourly Peak Ordering Velocity";
    let metricLabel = "Sandwiches / hr";
    let data: Array<{
      label: string;
      value: number;
      orders?: number;
      revenue?: number;
      color?: string;
      subLabel?: string;
      fullName?: string;
    }> = realStats.hourlyChartData;

    const isItemsQuery =
      lower.includes("item") ||
      lower.includes("bestseller") ||
      lower.includes("most ordered") ||
      lower.includes("popular") ||
      lower.includes("sandwich") ||
      lower.includes("melt") ||
      lower.includes("food") ||
      lower.includes("product") ||
      lower.includes("dishes");

    const isStatusQuery =
      lower.includes("status") ||
      lower.includes("kitchen") ||
      lower.includes("toasting") ||
      lower.includes("ready") ||
      lower.includes("served") ||
      lower.includes("queue") ||
      lower.includes("ticket") ||
      lower.includes("progress");

    const isRevenueQuery =
      lower.includes("revenue") ||
      lower.includes("sales") ||
      lower.includes("money") ||
      lower.includes("rupee") ||
      lower.includes("income") ||
      lower.includes("earning") ||
      lower.includes("gross") ||
      lower.includes("cash") ||
      lower.includes("collection");

    const isDiningQuery =
      lower.includes("dine") ||
      lower.includes("takeaway") ||
      lower.includes("parcel") ||
      lower.includes("table vs") ||
      lower.includes("dine-in");

    if (isItemsQuery) {
      primaryType = "items";
      title = "Top Selling Menu Items (Live Orders)";
      metricLabel = "Units Sold";
      data = realStats.itemChartData;
    } else if (isStatusQuery) {
      primaryType = "status";
      title = "Kitchen Order Status Distribution";
      metricLabel = "Orders";
      data = realStats.statusChartData;
    } else if (isRevenueQuery) {
      primaryType = "revenue";
      title = "Revenue by Menu Item (Live Sales)";
      metricLabel = "Gross ₹";
      data = realStats.revenueChartData;
    } else if (isDiningQuery) {
      primaryType = "dining";
      title = "Dine-In vs Takeaway Orders";
      metricLabel = "Orders";
      data = realStats.diningChartData;
    } else {
      if (realStats.itemChartData.length > 0 && !lower.includes("peak") && !lower.includes("hour") && !lower.includes("velocity") && !lower.includes("time")) {
        primaryType = "items";
        title = "Menu Items Ordered Today";
        metricLabel = "Units Sold";
        data = realStats.itemChartData;
      } else {
        primaryType = "hourly";
        title = "Hourly Toasting Velocity";
        metricLabel = "Items / hr";
        data = realStats.hourlyChartData;
      }
    }

    const availableViews: ChartViewItem[] = [
      {
        id: "items",
        label: "Top Items",
        title: "Top Selling Menu Items",
        metricLabel: "Units Sold",
        data: realStats.itemChartData,
      },
      {
        id: "hourly",
        label: "Hourly Velocity",
        title: "Hourly Peak Ordering Velocity",
        metricLabel: "Items / hr",
        data: realStats.hourlyChartData,
      },
      {
        id: "status",
        label: "Order Status",
        title: "Kitchen Order Status",
        metricLabel: "Tickets",
        data: realStats.statusChartData,
      },
      {
        id: "revenue",
        label: "Revenue (₹)",
        title: "Revenue by Menu Item",
        metricLabel: "Gross ₹",
        data: realStats.revenueChartData,
      },
      {
        id: "dining",
        label: "Dining Type",
        title: "Dine-In vs Takeaway",
        metricLabel: "Orders",
        data: realStats.diningChartData,
      },
    ];

    return {
      type: primaryType,
      title,
      metricLabel,
      data,
      availableViews,
    };
  };

  // Client-side local intent fallback engine (For offline or rapid response)
  const parseLocalFallback = (text: string) => {
    const lower = text.toLowerCase().trim();
    const actions: any[] = [];
    let reply = "";
    let stats: any = null;
    let chartData: any = null;
    let foundOrders: OrderRecord[] | null = null;
    let foundReservations: ReservationRecord[] | null = null;
    let bulkStockSummary: any = null;

    const todayOrders = filterOrdersByDate(validLiveOrders, "today");
    const todayRevenue = todayOrders.reduce((sum, o) => sum + (Number(o.grandTotal) || 0), 0);

    // Dedicated accurate handler for Today's Orders / All Orders Today
    const isTodayOrdersQuery =
      lower === "today's all orders" ||
      lower === "today all orders" ||
      lower === "all orders today" ||
      lower === "today's orders" ||
      lower === "todays orders" ||
      lower === "today orders" ||
      lower === "orders today" ||
      lower.includes("today's all order") ||
      lower.includes("today all order") ||
      lower.includes("all orders today") ||
      lower.includes("orders placed today") ||
      lower.includes("order placed today") ||
      (lower.includes("today") && lower.includes("order") && (lower.includes("all") || lower.includes("list") || lower.includes("how many") || lower.includes("show")));

    if (isTodayOrdersQuery) {
      if (todayOrders.length === 0) {
        return {
          reply: `No orders have been placed today yet (0 orders today, ₹0 gross revenue). The kitchen queue is currently clear.\n(Total historical orders in store archive: ${validLiveOrders.length}).`,
          actions: [],
          stats: {
            totalOrders: 0,
            grossRevenue: "₹0",
            activeTickets: 0,
            availableSeats: `${seating.availableSeats}/${seating.totalSeats}`,
            reservations: reservations.length,
            menuItems: menuItems.length,
          },
          chartData: null,
          foundOrders: [],
          foundReservations: null,
          bulkStockSummary: null,
          suggestedFollowUps: [
            "Take walk-in order 1 Truffle Melt Table 1",
            "Show live kitchen status",
            "Check today's reservations",
            "Set stock of all items to 25",
          ],
        };
      } else {
        const activeToday = todayOrders.filter((o) => o.status !== "served");
        return {
          reply: `Found ${todayOrders.length} order(s) placed today with ₹${todayRevenue.toLocaleString("en-IN")} total revenue (${activeToday.length} active in kitchen).`,
          actions: [],
          stats: {
            totalOrders: todayOrders.length,
            grossRevenue: `₹${todayRevenue.toLocaleString("en-IN")}`,
            activeTickets: activeToday.length,
            availableSeats: `${seating.availableSeats}/${seating.totalSeats}`,
            reservations: reservations.length,
            menuItems: menuItems.length,
          },
          chartData: null,
          foundOrders: todayOrders,
          foundReservations: null,
          bulkStockSummary: null,
          suggestedFollowUps: [
            "Today's verified analytics",
            "Show peak ordering times chart",
            "Show live kitchen status",
          ],
        };
      }
    }

    // 0. Live Kitchen & Kanban status queries
    if (
      lower.includes("kitchen") ||
      lower.includes("kanban") ||
      lower.includes("kds") ||
      lower.includes("toasting") ||
      lower.includes("active ticket") ||
      lower.includes("active order") ||
      lower.includes("live order") ||
      (lower.includes("order") && (lower.includes("status") || lower.includes("queue") || lower.includes("list")))
    ) {
      const activeOrders = liveOrders.filter((o) => o.status !== "served");
      const receivedCount = activeOrders.filter((o) => o.status === "received").length;
      const toastingCount = activeOrders.filter((o) => o.status === "toasting").length;
      const readyCount = activeOrders.filter((o) => o.status === "ready").length;
      return {
        reply: `🍳 Live Kitchen KDS Status: ${activeOrders.length} active ticket(s) in workflow (Received: ${receivedCount} | Toasting: ${toastingCount} | Ready: ${readyCount}). Total orders logged today: ${todayOrders.length}.`,
        actions: [],
        stats: null,
        chartData: null,
        foundOrders: activeOrders.length > 0 ? activeOrders : todayOrders.slice(0, 5),
        foundReservations: null,
        bulkStockSummary: null,
        suggestedFollowUps: [
          "Today's verified analytics",
          "Take a walk-in order",
          "Show peak ordering times chart",
          "Check today's reservations",
        ],
      };
    }

    const realStats = computeRealClientStats();
    const sortedOrdersDesc = [...liveOrders].sort((a, b) => {
      const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return timeB - timeA;
    });

    // 1. Check for "Last Order Done Today" or "Latest Order" or "Recent Order"
    const isLastOrderQuery =
      lower.includes("last order") ||
      lower.includes("latest order") ||
      lower.includes("recent order") ||
      lower.includes("most recent") ||
      lower.includes("previous order") ||
      (lower.includes("last") && lower.includes("order")) ||
      (lower.includes("details") && (lower.includes("last") || lower.includes("order") || lower.includes("recent")));

    if (isLastOrderQuery) {
      if (sortedOrdersDesc.length === 0) {
        reply = "No orders have been recorded in the store today yet. The kitchen queue is currently clear.";
        foundOrders = [];
      } else {
        const lastOrder = sortedOrdersDesc[0];
        const itemsList = (lastOrder.items || [])
          .map((it: any) => `${it.quantity}x ${it.item?.name || it.name || "Artisan Melt"}`)
          .join(", ");
        const orderTime = lastOrder.createdAt
          ? new Date(lastOrder.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
          : "Today";

        reply = `Last Order Done Today (Ticket #${lastOrder.tokenNumber || lastOrder.orderNumber}):
• Customer: ${lastOrder.customerName || "Walk-In Guest"}${lastOrder.customerPhone ? ` (${lastOrder.customerPhone})` : ""}
• Time Placed: ${orderTime}
• Order Type: ${(lastOrder.orderType || "dine-in").toUpperCase()}${lastOrder.tableNumber ? ` (${lastOrder.tableNumber})` : ""}
• Kitchen Status: "${(lastOrder.status || "received").toUpperCase()}"
• Items: ${itemsList}
• Bill Amount: ₹${lastOrder.grandTotal} (${(lastOrder.paymentMethod || "PAID").toUpperCase()})`;

        foundOrders = [lastOrder];
      }
      return {
        reply,
        actions,
        stats,
        chartData,
        foundOrders,
        foundReservations,
        bulkStockSummary,
        suggestedFollowUps: [
          `Mark order #${sortedOrdersDesc[0]?.tokenNumber || sortedOrdersDesc[0]?.orderNumber || "1"} ready`,
          "All orders analytics today",
          "Show all orders today",
          "Set stock of all items to 25",
        ],
      };
    }

    // 2. Check for "First Order Today"
    if (lower.includes("first order")) {
      if (sortedOrdersDesc.length === 0) {
        reply = "No orders recorded yet today.";
      } else {
        const firstOrder = sortedOrdersDesc[sortedOrdersDesc.length - 1];
        const itemsList = (firstOrder.items || [])
          .map((it: any) => `${it.quantity}x ${it.item?.name || it.name || "Artisan Melt"}`)
          .join(", ");
        reply = `First Order Today (Ticket #${firstOrder.tokenNumber || firstOrder.orderNumber}): Placed by ${firstOrder.customerName} for ₹${firstOrder.grandTotal}. Items: ${itemsList}. Status: "${firstOrder.status?.toUpperCase()}".`;
        foundOrders = [firstOrder];
      }
      return {
        reply,
        actions,
        stats,
        chartData,
        foundOrders,
        foundReservations,
        bulkStockSummary,
        suggestedFollowUps: ["Show last order done today", "All orders analytics today"],
      };
    }

    // 3. Check bulk or particular stock to ANY number
    if (lower.includes("stock") || lower.includes("sold out") || lower.includes("restock") || lower.includes("inventory")) {
      const isAll =
        lower.includes("all") ||
        lower.includes("every") ||
        lower.includes("everything") ||
        lower.includes("all items") ||
        lower.includes("all stocks");

      const numMatch = lower.match(/(?:to|=|is|\s)\s*(\d+)/);
      const targetStock = numMatch ? parseInt(numMatch[1], 10) : lower.includes("sold out") ? 0 : 25;

      if (isAll || lower.includes("toasties") || lower.includes("beverages") || lower.includes("bakery") || lower.includes("sandwiches")) {
        let targets = menuItems;
        let lbl = "all menu items";
        if (lower.includes("toasties")) {
          targets = menuItems.filter((m) => m.category === "toasties");
          lbl = "all toasties";
        } else if (lower.includes("beverages")) {
          targets = menuItems.filter((m) => m.category === "beverages");
          lbl = "all beverages";
        } else if (lower.includes("bakery")) {
          targets = menuItems.filter((m) => m.category === "bakery");
          lbl = "all bakery items";
        } else if (lower.includes("sandwiches")) {
          targets = menuItems.filter((m) => m.category === "sandwiches");
          lbl = "all sandwiches";
        }

        targets.forEach((m) => {
          actions.push({
            type: "UPDATE_MENU_STOCK",
            payload: { itemId: m.id, itemName: m.name, stockLeft: targetStock },
          });
        });

        bulkStockSummary = {
          label: lbl,
          count: targets.length,
          targetStock,
          items: targets.map((m) => ({
            id: m.id,
            name: m.name,
            oldStock: m.stockLeft,
            newStock: targetStock,
          })),
        };

        reply = `Updated stock for ${lbl} (${targets.length} items) to ${targetStock} units each. Available immediately in the store.`;
      } else {
        const item = menuItems.find(
          (m) =>
            lower.includes(m.name.toLowerCase()) ||
            (m.name.split(" ")[0].length > 3 && lower.includes(m.name.split(" ")[0].toLowerCase())) ||
            m.name.toLowerCase().split(" ").some((w) => w.length > 3 && lower.includes(w))
        );
        if (item) {
          actions.push({
            type: "UPDATE_MENU_STOCK",
            payload: { itemId: item.id, itemName: item.name, stockLeft: targetStock },
          });
          reply = `Updated stock for "${item.name}" from ${item.stockLeft} to ${targetStock} units.`;
        } else {
          reply = `Please name an item (e.g. "Set stock of Truffle Melt to 15") or say "Set stock of all items to 25".`;
        }
      }
    } else if (lower.includes("find order") || lower.includes("search order") || lower.includes("where is order") || lower.includes("order for") || lower.includes("token")) {
      const term = lower.replace(/.*(?:find order|search order|where is order|order for|token)\s*/i, "").replace(/[#]/g, "").trim();
      const matched = liveOrders.filter((o) =>
        (o.customerName && o.customerName.toLowerCase().includes(term)) ||
        (o.tokenNumber && o.tokenNumber.toLowerCase().includes(term)) ||
        (o.orderNumber && o.orderNumber.toLowerCase().includes(term)) ||
        (o.customerPhone && o.customerPhone.includes(term))
      );
      if (matched.length > 0) {
        foundOrders = matched;
        reply = `Found ${matched.length} order(s) for "${term}". Order #${matched[0].tokenNumber || matched[0].orderNumber} (${matched[0].customerName}) is currently "${matched[0].status?.toUpperCase()}".`;
      } else {
        reply = `No active order found matching "${term}". Try checking token number or customer name.`;
      }
    } else if (lower.includes("reservation") || lower.includes("booking") || lower.includes("guest list")) {
      foundReservations = reservations;
      reply = `Here are the active table reservations (${reservations.length} total today). Dining area is primed for seating.`;
    } else if (
      lower === "placing orders" ||
      lower === "place order" ||
      lower === "place orders" ||
      lower.includes("how to place order") ||
      lower.includes("how to take order") ||
      lower.includes("can you place order") ||
      lower.includes("order placing")
    ) {
      reply = `You can place and dispatch orders right here in the AI chat with zero redirection:
• Say or type: "Walk-in order for [Customer]: [Items] Table [Number]"
  (e.g., "Walk-in order for Rahul: 2 Truffle Melts Table 2")
• For takeaway: "Walk-in order for Sneha: 1 Classic Melt takeaway"

I will immediately register the order, notify the kitchen, and give you the live KOT slip directly in this chat!`;
      return {
        reply,
        actions: [],
        stats: null,
        chartData: null,
        foundOrders: null,
        foundReservations: null,
        bulkStockSummary: null,
        suggestedFollowUps: [
          "Take walk-in order 1 Truffle Melt Table 1",
          "Take walk-in order 2 Classic Toasties takeaway",
          "Today's verified analytics",
        ],
      };
    } else if (
      lower === "data" ||
      lower === "store data" ||
      lower === "show data" ||
      lower === "all data" ||
      lower.includes("analytics data") ||
      lower.includes("operational data") ||
      lower.includes("system data")
    ) {
      const activeOrders = validLiveOrders.filter((o) => o.status !== "served");
      const lowStockItems = menuItems.filter((m) => m.stockLeft < 10);
      reply = `📊 Real Store Operational Data Summary:
• Total Orders Today: ${todayOrders.length} order(s) logged (${activeOrders.length} active in kitchen).
• Gross Revenue Today: ₹${todayRevenue}.
• Top Selling Item: ${realStats.topItem?.name || "None yet"}.
• Seating Capacity: ${seating.availableSeats}/${seating.totalSeats} seats open (Estimated kitchen wait: ${seating.estimatedWaitMinutes || 15}m).
• Reservations Booked: ${reservations.length} for today.
• Menu Inventory: ${menuItems.length} active items (${lowStockItems.length} low stock).`;
      return {
        reply,
        actions: [],
        stats: {
          totalOrders: todayOrders.length,
          grossRevenue: `₹${todayRevenue}`,
          activeTickets: activeOrders.length,
          availableSeats: `${seating.availableSeats}/${seating.totalSeats}`,
          reservations: reservations.length,
          menuItems: menuItems.length,
        },
        chartData: null,
        foundOrders: todayOrders.slice(0, 5),
        foundReservations: reservations.slice(0, 5),
        bulkStockSummary: null,
        suggestedFollowUps: [
          "Today's verified analytics",
          "Show peak ordering times chart",
          "Show active kitchen tickets",
          "Set stock of all items to 25",
        ],
      };
    } else if (
      !lower.includes("show") &&
      !lower.includes("details") &&
      !lower.includes("analytics") &&
      !lower.includes("last") &&
      (lower.includes("walk-in order") ||
        lower.includes("walkin order") ||
        lower.includes("take order") ||
        lower.includes("create order") ||
        lower.includes("new order") ||
        lower.includes("add order") ||
        lower.includes("place order") ||
        lower.includes("placing order") ||
        (lower.includes("walkin") && !lower.includes("status")) ||
        (lower.includes("walk-in") && !lower.includes("status")))
    ) {
      let cust = "Walk-In Guest";
      const forM = lower.match(/for\s+([A-Za-z]+)/i);
      if (forM) cust = forM[1].charAt(0).toUpperCase() + forM[1].slice(1);

      let table = "Table 1";
      const tm = lower.match(/table\s*([0-9A-Za-z]+)/i);
      if (tm) table = `Table ${tm[1]}`;

      const matched: any[] = [];
      menuItems.forEach((m) => {
        if (lower.includes(m.name.toLowerCase()) || (m.name.split(" ")[0].length > 3 && lower.includes(m.name.split(" ")[0].toLowerCase()))) {
          let qty = 1;
          if (lower.includes("2 ") || lower.includes("two ") || lower.includes("2x")) qty = 2;
          if (lower.includes("3 ") || lower.includes("three ") || lower.includes("3x")) qty = 3;
          if (lower.includes("4 ") || lower.includes("four ") || lower.includes("4x")) qty = 4;
          matched.push({ itemId: m.id, itemName: m.name, quantity: qty, unitPrice: m.price });
        }
      });
      if (matched.length === 0 && menuItems.length > 0) {
        matched.push({ itemId: menuItems[0].id, itemName: menuItems[0].name, quantity: 1, unitPrice: menuItems[0].price });
      }

      actions.push({
        type: "CREATE_WALKIN_ORDER",
        payload: { customerName: cust, orderType: lower.includes("takeaway") || lower.includes("parcel") ? "takeaway" : "dine-in", tableNumber: table, items: matched, paymentMethod: "cash" },
      });
      reply = `Walk-in order created for ${cust} with ${matched.map((i) => `${i.quantity}x ${i.itemName}`).join(", ")}. Ticket dispatched to kitchen with zero redirection.`;
    } else if (
      lower.includes("chart") ||
      lower.includes("graph") ||
      lower.includes("rush") ||
      lower.includes("sales") ||
      lower.includes("revenue") ||
      lower.includes("peak") ||
      lower.includes("most ordered") ||
      lower.includes("maximum") ||
      lower.includes("all order") ||
      lower.includes("orders today") ||
      lower.includes("today orders") ||
      lower.includes("today") ||
      lower.includes("yesterday") ||
      lower.includes("week") ||
      lower.includes("month") ||
      lower.includes("september") ||
      lower.includes("sept") ||
      lower.includes("2026") ||
      lower.includes("analytics") ||
      lower.includes("data")
    ) {
      const dynamicAnalytics = computeDateSpecificAnalytics(
        text,
        liveOrders,
        undefined,
        seating,
        analyticsDate
      );
      reply = dynamicAnalytics.reply;
      stats = dynamicAnalytics.stats;
      chartData = dynamicAnalytics.chartData;
      foundOrders = dynamicAnalytics.foundOrders;
    } else if (lower.includes("highlight") || lower.includes("banner")) {
      const title = text.replace(/^(please|update|set|change)\s+/i, "").replace(/highlight\s*(to|as|:)?\s*/i, "").trim() || "Artisanal Toastie Special";
      actions.push({
        type: "UPDATE_WEBSITE_HIGHLIGHT",
        payload: { title, badge: "Chef's Special", mode: "manual" },
      });
      reply = `Website highlight banner updated to: "${title}".`;
    } else {
      reply = `I can help you with:
• "Show me the details of the last order done today"
• "All orders analytics today"
• "Set stock of all items to 25" (or specific ones to any number)
• "Take walk-in order for Rahul: 2 Tuxedo Club, Table 2"
• "Check reservations" or "Find order for Aarav"`;
    }

    return {
      reply,
      actions,
      stats,
      chartData,
      foundOrders,
      foundReservations,
      bulkStockSummary,
      suggestedFollowUps: [
        "Show me the details of the last order done today",
        "All orders analytics today",
        "Set stock of all items to 25",
        "Take a walk-in order",
      ],
    };
  };

  // Submit Handler
  const handleSubmitPrompt = async (queryText?: string, fromVoice = false) => {
    const textToSend = (typeof queryText === 'string' ? queryText : inputQuery).trim();
    if (!textToSend || isLoading) return;

    if ("speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {}
    }

    setInputQuery("");
    setIsLoading(true);

    const userMessage: ChatMessage = {
      id: `msg_user_${Date.now()}`,
      role: "user",
      content: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      isVoice: fromVoice,
    };

    setMessages((prev) => [...prev, userMessage]);

    try {
      const now = new Date();
      const dynamicToday = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
      const verifiedTodaySummary = getStoreAnalyticsSummary
        ? getStoreAnalyticsSummary(dynamicToday)
        : generateStoreAnalyticsSummary(validLiveOrders, posRecords, dynamicToday);

      const storeSnapshot = {
        analyticsDate: analyticsDate || dynamicToday,
        dynamicToday,
        verifiedTodaySummary,
        todayOrdersCount: filterOrdersByDate(validLiveOrders, "today").length,
        menuItems: menuItems.map((m) => ({
          id: m.id,
          name: m.name,
          price: m.price,
          category: m.category,
          stockLeft: m.stockLeft,
          isVeg: m.isVeg,
        })),
        seating,
        orders: validLiveOrders.map((o) => ({
          id: o.id,
          orderNumber: o.orderNumber,
          tokenNumber: o.tokenNumber,
          status: o.status,
          grandTotal: o.grandTotal,
          customerName: o.customerName,
          customerPhone: o.customerPhone,
          createdAt: o.createdAt || "",
          orderType: o.orderType || "dine-in",
          tableNumber: o.tableNumber || "",
          estimatedMinutesLeft: o.estimatedMinutesLeft ?? 15,
          estimatedWaitingMinutes: o.estimatedWaitingMinutes ?? 20,
          paymentMethod: o.paymentMethod || "upi",
          items: (o.items || []).map((it: any) => ({
            itemId: it.item?.id || it.itemId,
            name: it.item?.name || it.name || it.itemName || "Artisan Melt",
            quantity: it.quantity,
            unitPrice: it.unitPrice || it.item?.price || 280,
            totalPrice: it.totalPrice || (it.unitPrice || it.item?.price || 280) * it.quantity,
          })),
        })),
        highlight: cafeHighlight,
        reservations: reservations.map((r) => ({
          id: r.id,
          customerName: r.customerName,
          customerPhone: r.customerPhone,
          guestCount: r.guestCount,
          timeSlot: r.timeSlot,
          status: r.status,
          seatingArea: r.seatingArea,
        })),
        posRecords,
        preBookingConfig,
      };

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6500);

      let aiResult: any = null;
      try {
        const response = await fetch("/api/ai/owner-assistant", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          signal: controller.signal,
          body: JSON.stringify({
            message: textToSend,
            chatHistory: messages.slice(-5).map((m) => ({ role: m.role, content: m.content })),
            storeSnapshot,
          }),
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          aiResult = await response.json();
        } else {
          aiResult = parseLocalFallback(textToSend);
        }
      } catch (fetchErr) {
        clearTimeout(timeoutId);
        console.warn("AI Assistant request failed or timed out, executing locally:", fetchErr);
        aiResult = parseLocalFallback(textToSend);
      }

      // If user asked about chart, graph, analytics, orders, sales, status, peak etc., ensure accurate non-empty chartData
      const lowerQuery = textToSend.toLowerCase();
      const isGraphOrAnalyticsQuery =
        lowerQuery.includes("chart") ||
        lowerQuery.includes("graph") ||
        lowerQuery.includes("analytics") ||
        lowerQuery.includes("orders") ||
        lowerQuery.includes("sales") ||
        lowerQuery.includes("revenue") ||
        lowerQuery.includes("bestseller") ||
        lowerQuery.includes("peak") ||
        lowerQuery.includes("status") ||
        lowerQuery.includes("popular") ||
        lowerQuery.includes("data");

      if (isGraphOrAnalyticsQuery) {
        const dynamicAnalytics = computeDateSpecificAnalytics(
          textToSend,
          liveOrders,
          undefined,
          seating
        );
        if (!aiResult.chartData || !Array.isArray(aiResult.chartData.data) || aiResult.chartData.data.length === 0) {
          aiResult.chartData = dynamicAnalytics.chartData;
        } else if (!aiResult.chartData.availableViews || aiResult.chartData.availableViews.length === 0) {
          aiResult.chartData.availableViews = dynamicAnalytics.chartData.availableViews;
        }
      }

      // Execute returned actions on the live store
      const executedList: any[] = [];
      if (Array.isArray(aiResult.actions)) {
        for (const act of aiResult.actions) {
          const res = executeAiAction(act);
          executedList.push({
            type: act.type,
            label: res.label,
            details: res.details,
            undoData: res.undoData,
          });
        }
      }

      const botReply = aiResult.reply || "Done! Action executed.";

      // If an order was placed, ensure it's rendered in foundOrders so the ticket appears in chat with zero redirection
      const createdOrderAct = executedList.find((a) => a.type === "CREATE_WALKIN_ORDER" && a.details?.order);
      const matchedOrders = createdOrderAct?.details?.order
        ? [createdOrderAct.details.order]
        : aiResult.foundOrders || null;

      const botMessage: ChatMessage = {
        id: `msg_bot_${Date.now()}`,
        role: "assistant",
        content: botReply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actionsExecuted: executedList,
        stats: aiResult.stats || null,
        chartData: aiResult.chartData || null,
        foundOrders: matchedOrders,
        foundReservations: aiResult.foundReservations || null,
        bulkStockSummary: aiResult.bulkStockSummary || null,
        suggestedFollowUps: aiResult.suggestedFollowUps || [],
      };

      setMessages((prev) => [...prev, botMessage]);
      // Automatic audio feedback removed per user requirement
    } catch (error) {
      console.warn("Using local fallback due to error:", error);
      const local = parseLocalFallback(textToSend);

      const executedList: any[] = [];
      if (Array.isArray(local.actions)) {
        for (const act of local.actions) {
          const res = executeAiAction(act);
          executedList.push({
            type: act.type,
            label: res.label,
            details: res.details,
            undoData: res.undoData,
          });
        }
      }

      // If an order was placed, ensure it's rendered in foundOrders so the ticket appears in chat
      const createdOrderAct = executedList.find((a) => a.type === "CREATE_WALKIN_ORDER" && a.details?.order);
      const matchedOrders = createdOrderAct?.details?.order
        ? [createdOrderAct.details.order]
        : local.foundOrders || null;

      const botMessage: ChatMessage = {
        id: `msg_bot_${Date.now()}`,
        role: "assistant",
        content: local.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        actionsExecuted: executedList,
        stats: local.stats || null,
        chartData: local.chartData || null,
        foundOrders: matchedOrders,
        foundReservations: local.foundReservations || null,
        bulkStockSummary: local.bulkStockSummary || null,
        suggestedFollowUps: local.suggestedFollowUps || [],
      };

      setMessages((prev) => [...prev, botMessage]);
      // Automatic audio feedback removed per user requirement
    } finally {
      setIsLoading(false);
    }
  };

  const clearChatHistory = useCallback(() => {
    setMessages([
      {
        id: `msg_reset_${Date.now()}`,
        role: "assistant",
        content: "Chat cleared. What store operations can I perform for you?",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggestedFollowUps: [
          "Set stock of all items to 25",
          "Take walk-in order",
          "Show peak ordering times chart",
          "Check today's reservations",
        ],
      },
    ]);
    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
  }, []);

  const handleFollowUpClick = (promptText: string) => {
    handleSubmitPrompt(promptText);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputQuery.trim()) {
      handleSubmitPrompt(inputQuery);
    }
  };

  const renderedMessages = useMemo(() => {
    return messages.map((msg) => (
      <ChatMessageItem
        key={msg.id}
        msg={msg}
        onFollowUpClick={handleFollowUpClick}
        onOpenKot={onOpenKot}
        onUpdateOrderStatus={onUpdateOrderStatus}
        handleUndo={handleUndo}
      />
    ));
  }, [messages, handleFollowUpClick, onOpenKot, onUpdateOrderStatus, handleUndo]);

  return (
    <div
      className="flex flex-col min-h-0 h-full flex-1 bg-[#1A2621] text-white rounded-2xl border border-amber-400/30 overflow-hidden shadow-2xl relative"
    >
      {/* Top Banner & Header Controls */}
      <div className="px-4 py-3 bg-[#24352E] border-b border-white/10 flex flex-wrap items-center justify-between gap-3 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-400 to-[#F5E086] text-[#24332D] flex items-center justify-center font-black shadow-md">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-black text-white tracking-wide">
                NiEA AI Store Copilot
              </h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                Owner Mode
              </span>
            </div>
            <p className="text-[11px] text-emerald-400 font-medium flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span>Store Copilot Active</span>
            </p>
          </div>
        </div>

        {/* Action Notice toast */}
        {actionNotice && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="px-3 py-1 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold flex items-center gap-1.5"
          >
            <span>{actionNotice}</span>
            <button
              onClick={() => setActionNotice(null)}
              className="text-emerald-300/70 hover:text-emerald-300 ml-1"
            >
              <X className="w-3 h-3" />
            </button>
          </motion.div>
        )}

        {/* Right side controls: Reset + Close */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Reset chat */}
          <button
            type="button"
            onClick={clearChatHistory}
            className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition"
            title="Clear Chat History"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {mode === "drawer" && onClose && (
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition ml-1"
              title="Close Copilot"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Dedicated Messages Scroll Area */}
      <div
        ref={chatScrollContainerRef}
        onScroll={handleChatScroll}
        tabIndex={0}
        className="w-full flex-1 min-h-0 overflow-y-auto overflow-x-hidden p-3 sm:p-4 space-y-4 select-text overscroll-contain focus:outline-none [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-track]:bg-black/20 [&::-webkit-scrollbar-thumb]:bg-amber-400/30 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-amber-400/50"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "rgba(245, 224, 134, 0.4) rgba(0, 0, 0, 0.2)",
          transform: "translateZ(0)",
          WebkitOverflowScrolling: "touch",
          willChange: "scroll-position, transform",
          backfaceVisibility: "hidden",
        }}
      >
        {renderedMessages}

        {/* Loading Indicator */}
        {isLoading && (
          <div className="flex items-center justify-between gap-3 p-3.5 rounded-2xl bg-[#23352E] text-white/70 border border-white/10 max-w-[320px]">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-amber-400 animate-spin" />
              <span className="text-xs font-bold text-amber-200">Processing command...</span>
            </div>
            <button
              type="button"
              onClick={() => setIsLoading(false)}
              className="text-[10px] text-amber-300 hover:text-white underline font-semibold px-1 py-0.5 rounded cursor-pointer"
              title="Stop waiting and unfreeze input"
            >
              Cancel
            </button>
          </div>
        )}

        {/* Live speech transcription floating note */}
        {isListening && liveTranscript && (
          <div className="p-3 rounded-xl bg-amber-400/10 border border-amber-400/40 text-amber-200 text-xs flex items-center gap-2 animate-pulse">
            <Mic className="w-4 h-4 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold">Hearing: </span>
              <span>"{liveTranscript}"</span>
            </div>
          </div>
        )}

        <div className="h-4 shrink-0" />
        <div ref={messagesEndRef} />
      </div>

      {/* Floating Jump to Latest Button when reading history */}
      <AnimatePresence>
        {showJumpToBottom && (
          <motion.button
            initial={{ opacity: 0, scale: 0.6, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.6, y: 10 }}
            type="button"
            onClick={() => scrollToBottom("smooth")}
            className="absolute bottom-20 right-3 z-30 w-8 h-8 rounded-full bg-[#F5E086] text-[#24332D] shadow-md hover:shadow-lg border border-amber-400/60 flex items-center justify-center hover:bg-[#F8E79B] active:scale-90 transition cursor-pointer"
            title="Jump to latest message"
            aria-label="Scroll to latest message"
          >
            <ArrowDown className="w-4 h-4 text-[#24332D] stroke-[2.5]" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Voice Status Indicator when listening */}
      {isListening && (
        <div className="px-4 py-2 bg-amber-500/20 border-t border-amber-400/30 flex items-center justify-between text-xs text-amber-200">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
            <span className="font-bold">Microphone is Listening... Speak now</span>
          </div>
          <button
            type="button"
            onClick={toggleListening}
            className="px-2 py-0.5 rounded-lg bg-red-500/30 hover:bg-red-500/50 text-white text-[11px] font-bold"
          >
            Cancel Voice
          </button>
        </div>
      )}

      {/* Input Control Bar */}
      <div className="p-3 sm:p-4 bg-[#23352E] border-t border-white/10 shrink-0">
        <form
          onSubmit={handleFormSubmit}
          className="flex items-center gap-2"
        >
          {/* Microphone button */}
          <button
            type="button"
            onClick={toggleListening}
            className={`p-3 rounded-xl font-bold transition flex items-center justify-center shrink-0 relative ${
              isListening
                ? "bg-red-500 text-white shadow-lg shadow-red-500/50 scale-105"
                : speechSupported
                ? "bg-amber-400 hover:bg-amber-300 text-[#24332D] shadow-md shadow-amber-400/20 cursor-pointer"
                : "bg-white/10 text-white/40 cursor-not-allowed"
            }`}
            title={
              isListening
                ? "Listening... Tap to stop"
                : speechSupported
                ? "Tap to speak command (Voice Input)"
                : "Speech recognition not supported in browser"
            }
          >
            {isListening ? (
              <MicOff className="w-5 h-5 animate-pulse" />
            ) : (
              <Mic className="w-5 h-5" />
            )}
            {isListening && (
              <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-red-400 animate-ping" />
            )}
          </button>

          {/* Text input */}
          <div className="flex-1 relative">
            <input
              ref={inputRef}
              type="text"
              value={inputQuery}
              onChange={handleInputChange}
              placeholder={
                isListening
                  ? "Listening to voice input..."
                  : "Say or type: 'Kitchen status', 'Set all stock to 25', 'Walk-in 2 melts T3', 'Sales analytics'..."
              }
              className="w-full px-4 py-3 rounded-xl bg-black/40 text-white placeholder-white/40 border border-white/10 focus:border-[#F5E086] focus:outline-none text-sm transition"
              disabled={isLoading}
            />
          </div>

          {/* Send button */}
          <button
            type="submit"
            disabled={!inputQuery.trim() || isLoading}
            className="px-4 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-[#F5E086] hover:from-amber-300 hover:to-[#faea9e] text-[#24332D] font-black text-sm transition flex items-center gap-1.5 shadow-md disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Send className="w-4 h-4" />
            <span className="hidden sm:inline">Execute</span>
          </button>
        </form>
      </div>
    </div>
  );
};
