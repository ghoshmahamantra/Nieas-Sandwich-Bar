import React, { useState, useMemo, useCallback, useEffect, useRef } from "react";
import {
  Clock,
  Bell,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  MessageSquare,
  Search,
  Plus,
  Minus,
  Sparkles,
  Flame,
  ArrowRight,
  Tv,
  ChefHat,
  ChevronDown,
  ChevronUp,
  Timer,
  Zap,
  X,
} from "lucide-react";
import { OrderRecord, OrderStepId } from "../../types/niea";
import { OrderStepProgressControl } from "../OrderStepProgressControl";
import { getOrderStepProgress } from "../../utils/orderStepProgress";
import { playTokenCallingChime } from "../../utils/audioChime";

interface QueueManagementTabProps {
  orders: OrderRecord[];
  onUpdateStatus: (
    orderId: string,
    status: "received" | "toasting" | "ready" | "served" | "cancelled"
  ) => void;
  onUpdateWaitTime: (orderId: string, minutes: number) => void;
  onOpenKot: (order: OrderRecord) => void;
  onOpenLiveCallingBoard: () => void;
  onUpdateOrderStep?: (
    orderId: string,
    stepId: OrderStepId | null,
    note?: string,
    announce?: boolean
  ) => void;
}

interface QueueWaitTimeAdjusterProps {
  order: OrderRecord;
  remaining: number;
  onUpdateWaitTime: (orderId: string, minutes: number) => void;
  onNotice: (msg: string) => void;
}

const QueueWaitTimeAdjuster: React.FC<QueueWaitTimeAdjusterProps> = React.memo(
  ({ order, remaining, onUpdateWaitTime, onNotice }) => {
    const [inputVal, setInputVal] = useState("");

    const handleApply = (mins: number) => {
      const val = Math.max(0, mins);
      onUpdateWaitTime(order.id, val);
      onNotice(`⏱️ Token #${order.tokenNumber || order.orderNumber} timer set to ${val} mins left! Synced with Queue TV.`);
    };

    const handleSetCustom = (e: React.FormEvent) => {
      e.preventDefault();
      const parsed = parseInt(inputVal, 10);
      if (!isNaN(parsed) && parsed >= 0) {
        handleApply(parsed);
        setInputVal("");
      }
    };

    return (
      <div className="space-y-2 pt-2 border-t border-white/10">
        <div className="flex items-center justify-between text-[11px] text-white/70">
          <span className="font-semibold flex items-center gap-1 text-[#F5E086]">
            <Timer className="w-3.5 h-3.5 text-[#F5E086]" />
            <span>Adjust Wait Time:</span>
          </span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => handleApply(Math.max(0, remaining - 5))}
              className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white font-mono text-[10px] font-bold transition"
              title="Minus 5 minutes"
            >
              -5m
            </button>
            <button
              type="button"
              onClick={() => handleApply(Math.max(0, remaining - 1))}
              className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white font-mono text-[10px] font-bold transition"
              title="Minus 1 minute"
            >
              -1m
            </button>
            <button
              type="button"
              onClick={() => handleApply(remaining + 1)}
              className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white font-mono text-[10px] font-bold transition"
              title="Plus 1 minute"
            >
              +1m
            </button>
            <button
              type="button"
              onClick={() => handleApply(remaining + 5)}
              className="px-1.5 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white font-mono text-[10px] font-bold transition"
              title="Plus 5 minutes"
            >
              +5m
            </button>
          </div>
        </div>

        {/* Quick Presets Pills */}
        <div className="flex items-center gap-1 flex-wrap">
          {[2, 5, 10, 15, 25, 35, 45].map((m) => (
            <button
              key={m}
              type="button"
              onClick={() => handleApply(m)}
              className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition ${
                remaining === m
                  ? "bg-[#F5E086] text-[#24332D] shadow"
                  : m === 45
                  ? "bg-amber-500/20 text-amber-300 hover:bg-amber-500/30 border border-amber-400/30"
                  : "bg-white/10 text-white/80 hover:bg-white/20"
              }`}
            >
              {m === 45 ? "45m Rush" : `${m}m`}
            </button>
          ))}
        </div>

        {/* Custom Input with Enter Key */}
        <form onSubmit={handleSetCustom} className="flex items-center gap-1.5">
          <input
            type="number"
            min={0}
            max={120}
            placeholder="Type mins (e.g. 18)..."
            value={inputVal}
            onChange={(e) => setInputVal(e.target.value)}
            className="w-full bg-[#17221D] border border-white/15 rounded-lg px-2.5 py-1 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#F5E086] font-mono text-center"
          />
          <button
            type="submit"
            disabled={!inputVal.trim() || isNaN(parseInt(inputVal, 10))}
            className="px-3 py-1 rounded-lg bg-[#F5E086] hover:bg-[#F8E79B] disabled:opacity-40 disabled:hover:bg-[#F5E086] text-[#24332D] text-xs font-black transition shrink-0"
          >
            Set
          </button>
        </form>
      </div>
    );
  }
);

interface QueueOrderCardProps {
  order: OrderRecord;
  elapsed: number;
  onUpdateStatus: (
    orderId: string,
    status: "received" | "toasting" | "ready" | "served" | "cancelled"
  ) => void;
  onUpdateWaitTime: (orderId: string, minutes: number) => void;
  onOpenKot: (order: OrderRecord) => void;
  onUpdateOrderStep?: (
    orderId: string,
    stepId: OrderStepId | null,
    note?: string,
    announce?: boolean
  ) => void;
  onNotice: (msg: string) => void;
  onSendReadyWhatsApp: (order: OrderRecord) => void;
  isWaSending: boolean;
}

const QueueOrderCard: React.FC<QueueOrderCardProps> = React.memo(({
  order,
  elapsed,
  onUpdateStatus,
  onUpdateWaitTime,
  onOpenKot,
  onUpdateOrderStep,
  onNotice,
  onSendReadyWhatsApp,
  isWaSending,
}) => {
  const [isStepsExpanded, setIsStepsExpanded] = useState(false);

  const remaining = typeof order.estimatedMinutesLeft === "number"
    ? Math.max(0, order.estimatedMinutesLeft)
    : Math.max(0, (order.estimatedWaitingMinutes || 25) - elapsed);
  const est = Math.max(elapsed + remaining, order.estimatedWaitingMinutes || 25);
  const percentage = Math.min(100, Math.round((elapsed / Math.max(1, est)) * 100));
  const isOverdue = elapsed > est && order.status !== "served";
  const stepInfo = getOrderStepProgress(order);

  const progressColor =
    order.status === "ready"
      ? "bg-emerald-400"
      : isOverdue
      ? "bg-rose-500 animate-pulse"
      : percentage >= 75
      ? "bg-amber-400"
      : "bg-emerald-400";

  return (
    <div
      className={`p-4 sm:p-5 rounded-2xl border transition-all ${
        order.status === "ready"
          ? "bg-[#1E3027] border-emerald-400/50 shadow-md"
          : isOverdue
          ? "bg-[#2D2121] border-rose-500/40"
          : "bg-[#24332D] border-white/10 hover:border-white/20"
      }`}
    >
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        {/* Left: Token & Customer Details */}
        <div className="flex items-start gap-4">
          {/* Big Token Number */}
          <div className="text-center shrink-0">
            <span className="text-[9px] uppercase font-black text-white/50 block">TOKEN</span>
            <div className="w-16 h-16 rounded-2xl bg-[#1E2B25] border border-white/10 flex items-center justify-center font-niea font-black text-2xl text-[#F5E086] shadow-inner">
              {order.tokenNumber || order.orderNumber.replace("NIEA-", "#")}
            </div>
          </div>

          {/* Guest info & items */}
          <div className="space-y-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h4 className="font-bold text-sm text-white">{order.customerName}</h4>
              <span className="text-xs text-white/60">({order.customerPhone})</span>

              {/* Order Kind Tag */}
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-white/10 text-white">
                {order.orderKind === "pre_order"
                  ? "PRE-ORDER"
                  : order.orderKind === "walk_in"
                  ? "WALK-IN"
                  : order.orderType === "dine-in"
                  ? "DINE-IN"
                  : "TAKEAWAY"}
              </span>

              {order.orderSource && (
                <span className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-[#F5E086]/10 text-[#F5E086] border border-[#F5E086]/20">
                  {order.orderSource.toUpperCase()}
                </span>
              )}

              <span className="text-xs font-semibold text-white/60">
                • {order.tableNumber || "Takeaway Counter"}
              </span>

              {/* Step Milestone Pill */}
              <span
                className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border ${
                  stepInfo.isManual
                    ? "bg-amber-400/20 text-amber-300 border-amber-400/40"
                    : "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
                }`}
              >
                <ChefHat className="w-3 h-3" />
                <span>{stepInfo.currentStep.shortLabel}</span>
                <span className="font-mono text-white/80">({stepInfo.percent}%)</span>
                <span className="text-[9px] opacity-70">
                  • {stepInfo.isManual ? "Announced" : "Auto"}
                </span>
              </span>
            </div>

            {/* Items preview */}
            <p className="text-xs text-white/80 line-clamp-1">
              {order.items.map((it) => `${it.quantity}x ${it.item.name}`).join(" • ")}
            </p>

            {order.orderNotes && (
              <p className="text-[11px] text-amber-300 font-medium">
                ⚠️ Note: {order.orderNotes}
              </p>
            )}
          </div>
        </div>

        {/* Middle: Waiting Duration & Progress Tracker */}
        <div className="flex-1 lg:max-w-xs space-y-2 bg-[#1E2B25] p-3 rounded-xl border border-white/5">
          <div className="flex items-center justify-between text-xs">
            <span className="text-white/60 flex items-center gap-1 font-medium">
              <Clock className="w-3.5 h-3.5 text-amber-300" />
              <span>Wait Time</span>
            </span>
            <div className="font-bold">
              <span className={isOverdue ? "text-rose-400 font-black" : "text-[#F5E086]"}>
                {elapsed}m elapsed
              </span>
              <span className="text-white/40"> / {est}m total</span>
            </div>
          </div>

          {/* Prominent Live Time Left Indicator */}
          <div className="flex items-center justify-between flex-wrap gap-1 px-2.5 py-1.5 rounded-xl bg-black/40 border border-amber-400/20 text-xs">
            <span className="text-white/70 flex items-center gap-1 text-[11px] font-medium shrink-0">
              <Clock className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
              <span>Remaining:</span>
            </span>
            <div className="flex items-center gap-1.5 font-niea font-bold text-sm text-[#F5E086]">
              <span>
                {order.status === "ready" || order.status === "served"
                  ? "Ready / 0m"
                  : `${remaining} mins left`}
              </span>
              {order.lastTimeLeftUpdated && (
                <span className="text-[9px] text-emerald-400 font-sans font-semibold px-1.5 py-0.2 rounded bg-emerald-400/10 border border-emerald-400/20">
                  ● updated
                </span>
              )}
            </div>
          </div>

          {/* Progress Bar */}
          <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden">
            <div
              className={`${progressColor} h-full rounded-full transition-all duration-500`}
              style={{ width: `${Math.min(100, percentage)}%` }}
            />
          </div>

          {/* Quick Adjust Wait Time with Presets, Custom Input & Instant Sync */}
          <QueueWaitTimeAdjuster
            order={order}
            remaining={remaining}
            onUpdateWaitTime={onUpdateWaitTime}
            onNotice={onNotice}
          />
        </div>

        {/* Right: Actions (Status, KOT, WhatsApp) */}
        <div className="flex flex-wrap lg:flex-nowrap items-center gap-2 shrink-0">
          {/* Steps Option Toggle */}
          <button
            type="button"
            onClick={() => setIsStepsExpanded((prev) => !prev)}
            className={`px-3 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
              isStepsExpanded
                ? "bg-[#F5E086] text-[#24332D] border-[#F5E086] shadow-sm"
                : "bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 border-amber-400/30"
            }`}
            title="Manage kitchen milestones (Order Taken, Cooking, Toasting, etc.)"
          >
            <ChefHat className="w-3.5 h-3.5 text-amber-300" />
            <span>Steps Option</span>
            {isStepsExpanded ? (
              <ChevronUp className="w-3 h-3" />
            ) : (
              <ChevronDown className="w-3 h-3" />
            )}
          </button>

          {/* View KOT */}
          <button
            type="button"
            onClick={() => onOpenKot(order)}
            className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 hover:text-white text-xs font-semibold transition flex items-center gap-1.5 border border-white/5"
            title="View & Print KOT Ticket"
          >
            <Receipt className="w-3.5 h-3.5 text-amber-300" />
            <span className="hidden sm:inline">KOT</span>
          </button>

          {/* Send WhatsApp Ready Alert */}
          <button
            type="button"
            disabled={isWaSending}
            onClick={() => onSendReadyWhatsApp(order)}
            className="px-3 py-2 rounded-xl bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 text-xs font-bold transition flex items-center gap-1.5 border border-emerald-500/30"
            title="Send WhatsApp Order Ready notification"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>{isWaSending ? "Sending..." : "WhatsApp Alert"}</span>
          </button>

          {/* Step Status Flow Buttons */}
          {order.status === "received" && (
            <button
              type="button"
              onClick={() => onUpdateStatus(order.id, "toasting")}
              className="px-3.5 py-2 rounded-xl bg-[#F5E086] hover:bg-[#F8E79B] text-[#24332D] text-xs font-black transition shadow flex items-center gap-1"
            >
              <Flame className="w-3.5 h-3.5" />
              <span>Toasting</span>
            </button>
          )}

          {order.status === "toasting" && (
            <button
              type="button"
              onClick={() => {
                onUpdateStatus(order.id, "ready");
                onSendReadyWhatsApp(order);
              }}
              className="px-3.5 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-[#1E2B25] text-xs font-black transition shadow flex items-center gap-1"
            >
              <Bell className="w-3.5 h-3.5" />
              <span>Call Token</span>
            </button>
          )}

          {order.status === "ready" && (
            <button
              type="button"
              onClick={() => onUpdateStatus(order.id, "served")}
              className="px-3.5 py-2 rounded-xl bg-white/20 hover:bg-white/30 text-white text-xs font-black transition flex items-center gap-1"
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Mark Served</span>
            </button>
          )}

          {order.status === "served" && (
            <span className="px-3 py-1.5 rounded-xl bg-white/5 text-white/50 text-xs font-bold">
              Served ✓
            </span>
          )}

          {/* Owner Cancel Order Button */}
          {order.status !== "served" && order.status !== "cancelled" && (
            <button
              type="button"
              onClick={() => {
                if (
                  window.confirm(
                    `Are you sure you want to cancel Order #${order.orderNumber} (Token #${order.tokenNumber || order.orderNumber})?`
                  )
                ) {
                  onUpdateStatus(order.id, "cancelled");
                  onNotice(`Order #${order.orderNumber} cancelled by owner.`);
                }
              }}
              className="px-2.5 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 text-xs font-bold transition flex items-center gap-1 border border-rose-500/30 active:scale-95 cursor-pointer"
              title="Cancel this order"
            >
              <X className="w-3.5 h-3.5 text-rose-400" />
              <span className="hidden sm:inline">Cancel</span>
            </button>
          )}

          {order.status === "cancelled" && (
            <span className="px-3 py-1.5 rounded-xl bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-bold flex items-center gap-1">
              <X className="w-3.5 h-3.5" />
              <span>Cancelled ✕</span>
            </span>
          )}
        </div>
      </div>

      {/* Steps Option Subsection (Staff Announcement & Auto-Divide Control) */}
      {isStepsExpanded && (
        <div className="mt-4 pt-3 border-t border-white/10 animate-in fade-in">
          <OrderStepProgressControl
            order={order}
            onUpdateStep={(ordId, stepId, note, announce) => {
              if (onUpdateOrderStep) {
                onUpdateOrderStep(ordId, stepId, note, announce);
              } else {
                if (stepId === "cooking_toasting") onUpdateStatus(ordId, "toasting");
                else if (stepId === "ready_calling") onUpdateStatus(ordId, "ready");
                else if (stepId === "served") onUpdateStatus(ordId, "served");
                else if (stepId === "order_taken" || stepId === "prep_assembly")
                  onUpdateStatus(ordId, "received");
              }
            }}
          />
        </div>
      )}
    </div>
  );
});

export const QueueManagementTab: React.FC<QueueManagementTabProps> = React.memo(({
  orders,
  onUpdateStatus,
  onUpdateWaitTime,
  onOpenKot,
  onOpenLiveCallingBoard,
  onUpdateOrderStep,
}) => {
  const [filter, setFilter] = useState<"active" | "all" | "overdue" | "pre_orders" | "walk_ins">("active");
  const [searchQuery, setSearchQuery] = useState("");
  const [waSendingId, setWaSendingId] = useState<string | null>(null);
  const [waNotice, setWaNotice] = useState<string | null>(null);
  const [timeNotice, setTimeNotice] = useState<string | null>(null);

  const getElapsedMinutes = useCallback((order: OrderRecord): number => {
    const start = order.waitingStartedAt ? new Date(order.waitingStartedAt).getTime() : new Date(order.createdAt).getTime();
    if (!start || isNaN(start)) return 0;
    return Math.max(0, Math.floor((Date.now() - start) / (1000 * 60)));
  }, []);

  // Analytics counts memoized to prevent lag
  const activeOrders = useMemo(() => orders.filter((o) => o.status !== "served"), [orders]);
  const inKitchenOrders = useMemo(() => orders.filter((o) => o.status === "toasting"), [orders]);
  const readyOrders = useMemo(() => orders.filter((o) => o.status === "ready"), [orders]);
  const overdueCount = useMemo(
    () => activeOrders.filter((o) => getElapsedMinutes(o) > (o.estimatedWaitingMinutes || 25)).length,
    [activeOrders, getElapsedMinutes]
  );

  const filteredOrders = useMemo(() => {
    const searchLower = searchQuery.toLowerCase().trim();
    return orders.filter((o) => {
      if (searchLower) {
        const matchesSearch =
          (o.tokenNumber || "").toLowerCase().includes(searchLower) ||
          (o.orderNumber || "").toLowerCase().includes(searchLower) ||
          (o.customerName || "").toLowerCase().includes(searchLower) ||
          (o.customerPhone || "").includes(searchLower);
        if (!matchesSearch) return false;
      }

      const elapsed = getElapsedMinutes(o);
      const est = o.estimatedWaitingMinutes || 25;
      const isOverdue = elapsed > est && o.status !== "served";

      if (filter === "active") return o.status !== "served";
      if (filter === "overdue") return isOverdue;
      if (filter === "pre_orders") return o.orderKind === "pre_order";
      if (filter === "walk_ins") return o.orderKind === "walk_in";
      return true; // all
    });
  }, [orders, searchQuery, filter, getElapsedMinutes]);

  // Progressive lazy-loading for queue orders to eliminate initial render lag
  const INITIAL_QUEUE_BATCH = 10;
  const [visibleCount, setVisibleCount] = useState(INITIAL_QUEUE_BATCH);
  const queueSentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setVisibleCount(INITIAL_QUEUE_BATCH);
  }, [filter, searchQuery]);

  useEffect(() => {
    if (visibleCount >= filteredOrders.length) return;
    const sentinel = queueSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleCount((prev) => Math.min(prev + 10, filteredOrders.length));
        }
      },
      { rootMargin: "300px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [visibleCount, filteredOrders.length]);

  const displayedOrders = useMemo(() => {
    return filteredOrders.slice(0, visibleCount);
  }, [filteredOrders, visibleCount]);

  const handleApplyRushToAll = (mins: number) => {
    const active = orders.filter((o) => o.status !== "served" && o.status !== "ready");
    if (active.length === 0) {
      setTimeNotice("No active kitchen queue orders to update.");
      setTimeout(() => setTimeNotice(null), 3000);
      return;
    }
    active.forEach((ord) => {
      onUpdateWaitTime(ord.id, mins);
    });
    setTimeNotice(`🚀 Rush Mode Applied! All ${active.length} active tickets updated to ${mins} mins. Queue TV synced!`);
    setTimeout(() => setTimeNotice(null), 4000);
  };

  const handleSendReadyWhatsApp = (order: OrderRecord) => {
    setWaSendingId(order.id);
    const cleanPhone = (order.customerPhone || "").replace(/\D/g, "").slice(-10);

    const readyMsg =
      `🔔 *NiEA'S SANDWICH BAR — Your Order is Hot & Ready!* 🥪\n\n` +
      `Hello ${order.customerName || "Valued Guest"}!\n\n` +
      `✨ *Token Number: ${order.tokenNumber || order.orderNumber} is READY!*\n\n` +
      (order.orderType === "dine-in"
        ? `🪑 Your table (${order.tableNumber || "Table 1"}) is served with your freshly toasted sourdough melts. Enjoy!`
        : `🛍️ Please collect your fresh hot takeaway parcel at the NiEA'S counter.\n\nShow token *${order.tokenNumber || order.orderNumber}* to the barista.`) +
      `\n\nThank you for dining with us! 🐾`;

    const waUrl = cleanPhone.length === 10
      ? `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(readyMsg)}`
      : `https://wa.me/?text=${encodeURIComponent(readyMsg)}`;

    // Open WhatsApp in direct user click gesture (popup-safe)
    const win = window.open(waUrl, "_blank", "noopener,noreferrer");

    // Also dispatch via backend API
    fetch("/api/whatsapp/notify-ready", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tokenNumber: order.tokenNumber || order.orderNumber,
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        orderType: order.orderType,
        tableNumber: order.tableNumber,
      }),
    })
      .then((res) => res.json())
      .then((data) => {
        if (data && data.customerSent) {
          setWaNotice(`✅ Automated WhatsApp alert dispatched to ${order.customerName} for Token ${order.tokenNumber}!`);
        } else {
          setWaNotice(`💬 WhatsApp message opened for Token ${order.tokenNumber}!`);
        }
      })
      .catch(() => {
        setWaNotice(`💬 WhatsApp message opened for Token ${order.tokenNumber}!`);
      })
      .finally(() => {
        setWaSendingId(null);
        setTimeout(() => setWaNotice(null), 6000);
      });
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner & TV Board Launcher */}
      <div className="bg-[#1E2B25] p-5 rounded-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F5E086] text-[#24332D] flex items-center justify-center font-black text-xl shadow-md">
            🎫
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-niea font-bold text-lg text-[#F5E086]">Live Queue & Token Engine</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-400/20 text-amber-300 border border-amber-400/30">
                McDonald's Style Tokens
              </span>
            </div>
            <p className="text-xs text-white/70">
              Track waiting periods, assign estimated rush minutes (e.g. 45m), call tokens, and dispatch KOT tickets.
            </p>
          </div>
        </div>

        {/* Actions: Test Chime & Open TV Calling Board */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              playTokenCallingChime();
              setTimeNotice("🔔 Token audio chime sounded through speakers!");
              setTimeout(() => setTimeNotice(null), 3000);
            }}
            className="px-3.5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer border border-white/10"
            title="Test calling chime through kitchen/counter speakers"
          >
            <Bell className="w-4 h-4 text-[#F5E086]" />
            <span>Test Chime</span>
          </button>

          <button
            type="button"
            onClick={onOpenLiveCallingBoard}
            className="px-4 py-2.5 rounded-xl bg-[#F5E086] hover:bg-[#F8E79B] text-[#24332D] font-black text-xs transition shadow flex items-center justify-center gap-2 cursor-pointer"
          >
            <Tv className="w-4 h-4" />
            <span>Launch Counter Calling Board</span>
          </button>
        </div>
      </div>

      {/* WhatsApp alert banner */}
      {waNotice && (
        <div className="p-3 bg-emerald-950/80 border border-emerald-400/40 rounded-xl text-emerald-200 text-xs font-semibold flex items-center justify-between">
          <span>{waNotice}</span>
          <button onClick={() => setWaNotice(null)} className="text-white/60 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Waiting time update confirmation banner */}
      {timeNotice && (
        <div className="p-3 bg-amber-950/90 border border-[#F5E086]/50 rounded-xl text-[#F5E086] text-xs font-bold flex items-center justify-between shadow-lg animate-in fade-in">
          <span className="flex items-center gap-2">
            <Timer className="w-4 h-4 text-[#F5E086] shrink-0" />
            <span>{timeNotice}</span>
          </span>
          <button onClick={() => setTimeNotice(null)} className="text-white/60 hover:text-white text-xs">
            ✕
          </button>
        </div>
      )}

      {/* Rush Hour Queue Wait Time Manager */}
      <div className="bg-[#1C2723] p-4 rounded-2xl border border-amber-400/30 flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center font-bold">
            <Zap className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
              <span>Rush Mode Queue Timer</span>
              <span className="text-[10px] px-2 py-0.2 rounded-full bg-amber-400/20 text-amber-300 font-normal">
                Batch Synchronize Queue
              </span>
            </h4>
            <p className="text-[11px] text-white/60">
              Kitchen slammed with tickets? Set standard rush wait time across all active waiting tickets in 1 click.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-[11px] text-white/50 font-medium">Batch apply:</span>
          {[15, 25, 35, 45].map((mins) => (
            <button
              key={mins}
              type="button"
              onClick={() => handleApplyRushToAll(mins)}
              className="px-2.5 py-1.5 rounded-xl bg-[#24332D] hover:bg-amber-400/20 text-amber-300 border border-amber-400/30 text-xs font-bold transition flex items-center gap-1"
              title={`Set all active tickets to ${mins} mins`}
            >
              <span>{mins}m Rush</span>
            </button>
          ))}
        </div>
      </div>

      {/* Queue Stat Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="bg-[#24332D] p-3.5 rounded-2xl border border-white/10">
          <span className="text-[11px] text-white/60 font-medium block">Waiting in Queue</span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="font-niea font-black text-2xl text-[#F5E086]">{activeOrders.length}</span>
            <span className="text-[10px] text-white/40">customers</span>
          </div>
        </div>

        <div className="bg-[#24332D] p-3.5 rounded-2xl border border-white/10">
          <span className="text-[11px] text-amber-300/80 font-medium block">Artisan Toasting</span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="font-niea font-black text-2xl text-amber-300">{inKitchenOrders.length}</span>
            <span className="text-[10px] text-white/40">on cast iron</span>
          </div>
        </div>

        <div className="bg-[#24332D] p-3.5 rounded-2xl border border-white/10">
          <span className="text-[11px] text-emerald-300/80 font-medium block">Ready for Pickup</span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="font-niea font-black text-2xl text-emerald-300">{readyOrders.length}</span>
            <span className="text-[10px] text-emerald-300/70">calling</span>
          </div>
        </div>

        <div className="bg-[#24332D] p-3.5 rounded-2xl border border-white/10">
          <span className="text-[11px] text-rose-300/80 font-medium block">Exceeded Wait Time</span>
          <div className="flex items-baseline gap-2 mt-0.5">
            <span className="font-niea font-black text-2xl text-rose-400">{overdueCount}</span>
            <span className="text-[10px] text-rose-300/60">&gt; estimated</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Search */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
          {[
            { id: "active", label: `Active Queue (${activeOrders.length})` },
            { id: "pre_orders", label: "Pre-Orders" },
            { id: "walk_ins", label: "Walk-Ins" },
            { id: "overdue", label: `Overdue (${overdueCount})` },
            { id: "all", label: "All History" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                filter === tab.id
                  ? "bg-[#F5E086] text-[#24332D] shadow"
                  : "bg-white/5 text-white/70 hover:bg-white/10"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Token (T102), guest..."
            className="w-full bg-[#1E2B25] border border-white/10 rounded-xl pl-8 pr-3 py-1.5 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#F5E086]"
          />
        </div>
      </div>

      {/* Orders Queue Cards */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="bg-[#1E2B25] p-8 rounded-2xl text-center text-white/50 space-y-2 border border-white/10">
            <Clock className="w-8 h-8 mx-auto opacity-40" />
            <p className="text-sm font-semibold">No orders matching this filter</p>
          </div>
        ) : (
          <>
            {displayedOrders.map((order) => (
              <QueueOrderCard
                key={order.id}
                order={order}
                elapsed={getElapsedMinutes(order)}
                onUpdateStatus={onUpdateStatus}
                onUpdateWaitTime={onUpdateWaitTime}
                onOpenKot={onOpenKot}
                onUpdateOrderStep={onUpdateOrderStep}
                onNotice={(msg) => {
                  setTimeNotice(msg);
                  setTimeout(() => setTimeNotice(null), 3500);
                }}
                onSendReadyWhatsApp={handleSendReadyWhatsApp}
                isWaSending={waSendingId === order.id}
              />
            ))}

            {/* Lazy-Loading Progressive Pagination & Infinite Scroll Sentinel */}
            {filteredOrders.length > visibleCount && (
              <div className="p-4 rounded-2xl bg-[#1E2B25] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-md">
                <span className="text-white/70">
                  Showing <strong className="text-[#F5E086]">{displayedOrders.length}</strong> of{" "}
                  <strong className="text-white">{filteredOrders.length}</strong> orders (lazy-rendered for instant opening)
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((prev) => Math.min(prev + 10, filteredOrders.length))}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition"
                  >
                    Load 10 More
                  </button>
                  <button
                    type="button"
                    onClick={() => setVisibleCount(filteredOrders.length)}
                    className="px-3 py-1.5 rounded-xl bg-[#F5E086] text-[#24332D] font-bold hover:bg-[#F8E79B] transition"
                  >
                    Show All ({filteredOrders.length})
                  </button>
                </div>
              </div>
            )}
            <div ref={queueSentinelRef} className="h-2 w-full pointer-events-none" />
          </>
        )}
      </div>
    </div>
  );
});
