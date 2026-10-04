import React, { useState, useMemo, useCallback } from "react";
import {
  GripVertical,
  Flame,
  CheckCircle2,
  Clock,
  Receipt,
  Tv,
  Printer,
  Search,
  Filter,
  ArrowRight,
  ArrowLeft,
  Check,
  Bell,
  Utensils,
  ShoppingBag,
  Phone,
  Timer,
  AlertTriangle,
  RotateCcw,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Inbox,
  ChefHat,
  Zap,
  Wifi,
  WifiOff,
  Download,
  Mic,
  Volume2,
} from "lucide-react";
import { OrderRecord, OrderStepId } from "../../types/niea";
import { playCafeAnnouncementChime } from "../../utils/orderStepProgress";
import { usePwaInstall } from "../../utils/usePwaInstall";
import { OfflineSyncToast } from "../OfflineSyncToast";

export type KanbanColumnId = "received" | "toasting" | "ready";

interface KitchenKanbanBoardProps {
  orders: OrderRecord[];
  onUpdateStatus: (
    orderId: string,
    status: "received" | "toasting" | "ready" | "served" | "cancelled",
    note?: string
  ) => void;
  onUpdateOrderStep?: (
    orderId: string,
    stepId: OrderStepId | null,
    note?: string,
    announce?: boolean
  ) => void;
  onUpdateWaitTime?: (orderId: string, minutes: number, note?: string) => void;
  onOpenKot?: (order: OrderRecord) => void;
  onOpenLiveCallingBoard?: (tokenNumber?: string) => void;
  onSendNotification?: (orderId: string, title: string, message: string) => void;
  onTriggerTakeawayMic?: (order?: OrderRecord) => void;
  onNotice?: (msg: string) => void;
}

interface KanbanCardProps {
  order: OrderRecord;
  columnId: KanbanColumnId;
  isDragging: boolean;
  onDragStart: (e: React.DragEvent<HTMLDivElement>, order: OrderRecord) => void;
  onDragEnd: (e: React.DragEvent<HTMLDivElement>) => void;
  onMoveToStatus: (
    order: OrderRecord,
    targetStatus: "received" | "toasting" | "ready" | "served" | "cancelled"
  ) => void;
  onUpdateWaitTime?: (orderId: string, minutes: number, note?: string) => void;
  onOpenKot?: (order: OrderRecord) => void;
  onOpenLiveCallingBoard?: (tokenNumber?: string) => void;
  onTriggerTakeawayMic?: (order?: OrderRecord) => void;
}

const KanbanCard: React.FC<KanbanCardProps> = React.memo(({
  order,
  columnId,
  isDragging,
  onDragStart,
  onDragEnd,
  onMoveToStatus,
  onUpdateWaitTime,
  onOpenKot,
  onOpenLiveCallingBoard,
  onTriggerTakeawayMic,
}) => {
  const [showTimerAdjuster, setShowTimerAdjuster] = useState(false);
  const [showItemsExpanded, setShowItemsExpanded] = useState(false);

  const isTakeaway = order.orderType === "takeaway" || order.orderKind === "takeaway";

  // Time calculations
  const start = order.waitingStartedAt
    ? new Date(order.waitingStartedAt).getTime()
    : new Date(order.createdAt).getTime();
  const elapsed = start && !isNaN(start)
    ? Math.max(0, Math.floor((Date.now() - start) / (1000 * 60)))
    : 0;

  const currentRemaining =
    order.status === "ready" || order.status === "served"
      ? 0
      : typeof order.estimatedMinutesLeft === "number"
      ? Math.max(0, order.estimatedMinutesLeft)
      : Math.max(0, (order.estimatedWaitingMinutes || 20) - elapsed);

  const totalEst = order.estimatedWaitingMinutes || 20;
  const isOverdue = elapsed > totalEst && order.status !== "ready" && order.status !== "served";

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, order)}
      onDragEnd={onDragEnd}
      className={`group relative rounded-2xl border transition-all duration-200 select-none shadow-md overflow-hidden ${
        isDragging
          ? "opacity-40 scale-95 border-dashed border-[#F5E086] bg-[#1E2B25]"
          : isTakeaway
          ? "bg-gradient-to-br from-[#2E2818] via-[#24332D] to-[#1C2723] border-2 border-amber-400 ring-2 ring-amber-400/35 shadow-[0_0_24px_rgba(251,191,36,0.38)]"
          : order.status === "ready"
          ? "bg-gradient-to-br from-[#1C3228] to-[#18231F] border-emerald-400/40 hover:border-emerald-300"
          : order.status === "toasting"
          ? "bg-gradient-to-br from-[#2F291D] to-[#1F2723] border-amber-400/40 hover:border-amber-300"
          : isOverdue
          ? "bg-gradient-to-br from-[#332222] to-[#1F2622] border-rose-500/40 hover:border-rose-400"
          : "bg-[#24332D] border-white/10 hover:border-[#F5E086]/40"
      }`}
    >
      {/* High-visibility Takeaway Needs Packing Banner */}
      {isTakeaway && (
        <div className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-black px-3 py-1 font-black text-[10px] uppercase tracking-wider flex items-center justify-between shadow-xs border-b border-amber-500/40">
          <div className="flex items-center gap-1.5 font-bold">
            <ShoppingBag className="w-3.5 h-3.5 text-black shrink-0" />
            <span>📦 NEEDS PACKING • TAKEAWAY PARCEL</span>
          </div>
          <span className="bg-black/90 text-amber-300 text-[9px] px-1.5 py-0.5 rounded font-mono font-bold">
            BAG & SEAL
          </span>
        </div>
      )}

      {/* Drag Grip Ribbon */}
      <div className="flex items-center justify-between px-3 pt-2.5 pb-1 border-b border-white/5">
        <div className="flex items-center gap-1.5 text-white/50 group-hover:text-[#F5E086] transition-colors cursor-grab active:cursor-grabbing">
          <GripVertical className="w-4 h-4 shrink-0" />
          <span className="text-[10px] font-mono font-bold tracking-wider uppercase text-white/60">
            {order.orderNumber}
          </span>
        </div>

        {/* Order Type Tag & Targeted Customer Calling Mic */}
        <div className="flex items-center gap-1.5">
          {onTriggerTakeawayMic && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onTriggerTakeawayMic(order);
              }}
              className="px-2 py-0.5 rounded-full bg-amber-400 hover:bg-amber-300 text-black font-black text-[10px] flex items-center gap-1 shadow-sm active:scale-95 transition cursor-pointer"
              title={`Announce & Call ${order.customerName || "Customer"} (Token #${order.tokenNumber || order.orderNumber}): Sends private voice alert & Twilio call to this customer`}
            >
              <Mic className="w-3 h-3 text-black animate-pulse" />
              <span>Call User</span>
            </button>
          )}

          <span
            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
              order.orderType === "dine-in"
                ? "bg-[#F5E086]/15 text-[#F5E086] border border-[#F5E086]/30"
                : "bg-amber-400/25 text-amber-200 border border-amber-400/50 font-black"
            }`}
          >
            {order.orderType === "dine-in"
              ? `Table ${order.tableNumber || "1"}`
              : "Takeaway"}
          </span>
        </div>
      </div>

      <div className="p-3.5 space-y-3">
        {/* Token Number & Customer Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <div className="font-niea font-black text-2xl sm:text-3xl text-[#F5E086] tracking-tight">
              {order.tokenNumber || order.orderNumber.replace("NIEA-", "#")}
            </div>
            <div className="min-w-0">
              <span className="font-bold text-xs text-white truncate block">
                {order.customerName || "Walk-In Guest"}
              </span>
              {order.customerPhone && (
                <a
                  href={`tel:${order.customerPhone}`}
                  onClick={(e) => e.stopPropagation()}
                  className="text-[10px] text-white/50 hover:text-[#F5E086] flex items-center gap-1 transition"
                  title="Call customer"
                >
                  <Phone className="w-2.5 h-2.5" />
                  <span>{order.customerPhone}</span>
                </a>
              )}
            </div>
          </div>

          {/* Time Badge */}
          <div className="text-right shrink-0 bg-black/40 border border-white/10 px-2 py-1 rounded-xl shadow-xs">
            <div
              className={`flex items-center justify-end gap-1 text-[11px] font-mono font-bold whitespace-nowrap ${
                isOverdue
                  ? "text-rose-400 animate-pulse"
                  : order.status === "ready"
                  ? "text-emerald-300"
                  : "text-[#F5E086]"
              }`}
            >
              <Clock className="w-3 h-3 shrink-0" />
              <span>
                {order.status === "ready"
                  ? "Ready!"
                  : `${currentRemaining}m left`}
              </span>
            </div>
            <span className="text-[9px] text-white/40 block font-mono whitespace-nowrap">
              {elapsed}m elapsed
            </span>
          </div>
        </div>

        {/* Notes / Allergen Alerts */}
        {order.orderNotes && (
          <div className="px-2.5 py-1.5 rounded-xl bg-amber-400/10 border border-amber-400/30 text-amber-300 text-[11px] flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
            <span className="font-medium line-clamp-2">
              Note: {order.orderNotes}
            </span>
          </div>
        )}

        {/* Ordered Sandwiches & Items Breakdown */}
        <div className="bg-[#17221D]/70 rounded-xl p-2.5 border border-white/5 space-y-1.5">
          <div className="flex items-center justify-between text-[10px] font-bold uppercase tracking-wider text-white/50">
            <span>Items ({order.items.reduce((acc, it) => acc + it.quantity, 0)})</span>
            {order.items.length > 2 && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowItemsExpanded((prev) => !prev);
                }}
                className="text-[#F5E086] hover:underline"
              >
                {showItemsExpanded ? "Show Less" : "Show All"}
              </button>
            )}
          </div>

          <div className="space-y-1">
            {(showItemsExpanded ? order.items : order.items.slice(0, 2)).map((ci) => (
              <div
                key={ci.cartItemId}
                className="flex items-start justify-between text-xs text-white/90 gap-1"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 font-semibold text-white truncate">
                    <span className="w-4 h-4 rounded bg-[#F5E086]/20 text-[#F5E086] text-[10px] flex items-center justify-center font-bold shrink-0">
                      {ci.quantity}×
                    </span>
                    <span className="truncate">{ci.item.name}</span>
                  </div>
                  {ci.selectedBread && ci.selectedBread !== "Default" && (
                    <span className="text-[10px] text-white/50 block pl-5 truncate">
                      Bread: {ci.selectedBread}
                    </span>
                  )}
                  {ci.selectedCustomizations && ci.selectedCustomizations.length > 0 && (
                    <span className="text-[10px] text-[#F5E086]/80 block pl-5 truncate">
                      +{ci.selectedCustomizations.map((c) => c.name).join(", ")}
                    </span>
                  )}
                </div>
              </div>
            ))}
            {!showItemsExpanded && order.items.length > 2 && (
              <div className="text-[10px] text-white/40 italic pl-5">
                +{order.items.length - 2} more item(s)...
              </div>
            )}
          </div>
        </div>

        {/* Quick Wait Time Adjuster (Toggleable inline) */}
        {showTimerAdjuster && onUpdateWaitTime && (
          <div className="p-2 rounded-xl bg-black/40 border border-amber-400/30 space-y-1.5 animate-in fade-in">
            <div className="flex items-center justify-between text-[10px] text-white/70">
              <span className="font-semibold text-[#F5E086] flex items-center gap-1">
                <Timer className="w-3 h-3" /> Quick Timer Left:
              </span>
              <button
                type="button"
                onClick={() => setShowTimerAdjuster(false)}
                className="text-white/40 hover:text-white"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center gap-1">
              {[-5, -1, 1, 5].map((delta) => (
                <button
                  key={delta}
                  type="button"
                  onClick={() =>
                    onUpdateWaitTime(
                      order.id,
                      Math.max(0, currentRemaining + delta),
                      `Chef quick adjusted timer by ${delta > 0 ? "+" : ""}${delta}m`
                    )
                  }
                  className="flex-1 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono text-[10px] font-bold transition text-center"
                >
                  {delta > 0 ? `+${delta}m` : `${delta}m`}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Card Action Controls & Drag Guide */}
        <div className="pt-2 border-t border-white/5 flex items-center justify-between gap-1.5">
          {/* Left tools: KOT, TV Call, Timer toggle */}
          <div className="flex items-center gap-1">
            {onOpenKot && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenKot(order);
                }}
                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/15 text-white/70 hover:text-white transition"
                title="Print Kitchen Ticket (KOT)"
              >
                <Printer className="w-3.5 h-3.5 text-[#F5E086]" />
              </button>
            )}

            {onOpenLiveCallingBoard && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onOpenLiveCallingBoard(order.tokenNumber);
                }}
                className="p-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 transition"
                title="Call Token on Live Display Screen"
              >
                <Tv className="w-3.5 h-3.5" />
              </button>
            )}

            {onUpdateWaitTime && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowTimerAdjuster((prev) => !prev);
                }}
                className={`p-1.5 rounded-lg transition ${
                  showTimerAdjuster
                    ? "bg-amber-400 text-[#17221D]"
                    : "bg-white/5 hover:bg-white/15 text-white/70 hover:text-white"
                }`}
                title="Adjust remaining wait time"
              >
                <Timer className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm("Cancel this order?")) {
                  onMoveToStatus(order, "cancelled");
                }
              }}
              className="p-1.5 rounded-lg bg-red-500/15 hover:bg-red-500/30 text-red-400 transition ml-1"
              title="Cancel Order"
            >
              <span className="text-[10px] font-bold">Cancel</span>
            </button>
          </div>

          {/* Right: Fast 1-Click Status Advance Buttons (Mobile / Touch Friendly) */}
          <div className="flex items-center gap-1">
            {columnId === "received" && (
              <button
                type="button"
                onClick={() => onMoveToStatus(order, "toasting")}
                className="px-2.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#17221D] font-bold text-xs transition flex items-center gap-1 shadow-sm"
                title="Move to Toasting grill"
              >
                <Flame className="w-3.5 h-3.5 shrink-0" />
                <span>Toasting →</span>
              </button>
            )}

            {columnId === "toasting" && (
              <>
                <button
                  type="button"
                  onClick={() => onMoveToStatus(order, "received")}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition"
                  title="Move back to Received"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onMoveToStatus(order, "ready")}
                  className="px-2.5 py-1.5 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-[#17221D] font-bold text-xs transition flex items-center gap-1 shadow-sm"
                  title="Mark Hot & Ready for Pickup"
                >
                  <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                  <span>Ready ✓</span>
                </button>
              </>
            )}

            {columnId === "ready" && (
              <>
                <button
                  type="button"
                  onClick={() => onMoveToStatus(order, "toasting")}
                  className="p-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition"
                  title="Move back to Toasting grill"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => onMoveToStatus(order, "served")}
                  className="px-2.5 py-1.5 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs transition flex items-center gap-1"
                  title="Mark order served / completed"
                >
                  <Check className="w-3.5 h-3.5 shrink-0" />
                  <span>Served</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
});

export const KitchenKanbanBoard: React.FC<KitchenKanbanBoardProps> = React.memo(({
  orders,
  onUpdateStatus,
  onUpdateOrderStep,
  onUpdateWaitTime,
  onOpenKot,
  onOpenLiveCallingBoard,
  onSendNotification,
  onTriggerTakeawayMic,
  onNotice,
}) => {
  // Drag state
  const [draggedOrder, setDraggedOrder] = useState<OrderRecord | null>(null);
  const [dragOverColumn, setDragOverColumn] = useState<KanbanColumnId | "served" | null>(null);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [orderTypeFilter, setOrderTypeFilter] = useState<"all" | "dine-in" | "takeaway">("all");
  const [activeMobileColumn, setActiveMobileColumn] = useState<KanbanColumnId>("received");
  const [noticeMessage, setNoticeMessage] = useState<string | null>(null);

  // Offline PWA and Wi-Fi disconnect resilience hook
  const { isOnline, justReconnected, isInstallable, installApp } = usePwaInstall();

  const showNotification = useCallback((msg: string) => {
    setNoticeMessage(msg);
    if (onNotice) onNotice(msg);
    setTimeout(() => setNoticeMessage(null), 3500);
  }, [onNotice]);

  // Filter active orders based on search & type
  const activeOrders = useMemo(() => {
    return orders.filter((o) => {
      // Must be active (not served)
      if (o.status === "served") return false;

      // Filter by type
      if (orderTypeFilter !== "all") {
        if (orderTypeFilter === "dine-in" && o.orderType !== "dine-in") return false;
        if (orderTypeFilter === "takeaway" && o.orderType !== "takeaway") return false;
      }

      // Search query filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchNum = o.orderNumber.toLowerCase().includes(q);
        const matchToken = o.tokenNumber ? o.tokenNumber.toLowerCase().includes(q) : false;
        const matchName = o.customerName ? o.customerName.toLowerCase().includes(q) : false;
        const matchPhone = o.customerPhone ? o.customerPhone.includes(q) : false;
        const matchItem = o.items.some((it) => it.item.name.toLowerCase().includes(q));
        const matchTable = o.tableNumber ? o.tableNumber.toLowerCase().includes(q) : false;
        if (!matchNum && !matchToken && !matchName && !matchPhone && !matchItem && !matchTable) {
          return false;
        }
      }

      return true;
    });
  }, [orders, searchQuery, orderTypeFilter]);

  // Split into Kanban Columns
  const receivedOrders = useMemo(() => {
    return activeOrders.filter((o) => o.status === "received");
  }, [activeOrders]);

  const toastingOrders = useMemo(() => {
    return activeOrders.filter((o) => o.status === "toasting");
  }, [activeOrders]);

  const readyOrders = useMemo(() => {
    return activeOrders.filter((o) => o.status === "ready");
  }, [activeOrders]);

  const servedTodayCount = useMemo(() => {
    return orders.filter((o) => o.status === "served").length;
  }, [orders]);

  // Master status advance handler with audio chime and synchronization
  const handleMoveToStatus = useCallback(
    (
      order: OrderRecord,
      targetStatus: "received" | "toasting" | "ready" | "served" | "cancelled"
    ) => {
      if (order.status === targetStatus) return;

      // Update status
      onUpdateStatus(
        order.id,
        targetStatus,
        `Kitchen KDS moved ticket to ${targetStatus}`
      );

      // Milestone step sync
      if (onUpdateOrderStep) {
        if (targetStatus === "toasting") {
          onUpdateOrderStep(order.id, "cooking_toasting", "Toasting on cast-iron grill", true);
        } else if (targetStatus === "ready") {
          onUpdateOrderStep(order.id, "ready_calling", "Plated fresh and called on screen", true);
        } else if (targetStatus === "received") {
          onUpdateOrderStep(order.id, "order_taken", "Returned to received queue", false);
        } else if (targetStatus === "served") {
          onUpdateOrderStep(order.id, "served", "Order served to guest", false);
        }
      }

      // Audio feedback disabled per user specification (silent command execution)

      // Visual feedback
      const label =
        targetStatus === "toasting"
          ? "Toasting on Grill 🔥"
          : targetStatus === "ready"
          ? "Hot & Ready for Pickup 🎉"
          : targetStatus === "served"
          ? "Served / Completed ✓"
          : "Received & Queued 📥";

      showNotification(`Order #${order.tokenNumber || order.orderNumber} moved to ${label}`);
    },
    [onUpdateStatus, onUpdateOrderStep, showNotification]
  );

  // Drag and drop event handlers
  const handleDragStart = useCallback(
    (e: React.DragEvent<HTMLDivElement>, order: OrderRecord) => {
      setDraggedOrder(order);
      e.dataTransfer.setData("text/plain", order.id);
      e.dataTransfer.setData(
        "application/json",
        JSON.stringify({ orderId: order.id, currentStatus: order.status })
      );
      e.dataTransfer.effectAllowed = "move";
    },
    []
  );

  const handleDragEnd = useCallback(() => {
    setDraggedOrder(null);
    setDragOverColumn(null);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  }, []);

  const handleDragEnter = useCallback(
    (columnId: KanbanColumnId | "served") => {
      setDragOverColumn(columnId);
    },
    []
  );

  const handleDragLeave = useCallback(() => {
    // optional reset handled cleanly by drop or dragEnd
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent<HTMLDivElement>, targetStatus: "received" | "toasting" | "ready" | "served") => {
      e.preventDefault();
      setDragOverColumn(null);

      const orderId = e.dataTransfer.getData("text/plain") || draggedOrder?.id;
      if (!orderId) return;

      const orderToMove = orders.find((o) => o.id === orderId);
      if (orderToMove) {
        handleMoveToStatus(orderToMove, targetStatus);
      }
      setDraggedOrder(null);
    },
    [draggedOrder, orders, handleMoveToStatus]
  );

  // Batch action: Apply rush minutes to all toasting
  const handleApplyRushToToasting = () => {
    if (!onUpdateWaitTime || toastingOrders.length === 0) return;
    toastingOrders.forEach((o) => {
      const cur = typeof o.estimatedMinutesLeft === "number" ? o.estimatedMinutesLeft : 5;
      onUpdateWaitTime(o.id, cur + 5, "Kitchen batch +5m rush applied");
    });
    showNotification(`⚡ Batch +5m added to all ${toastingOrders.length} Toasting tickets!`);
  };

  return (
    <div className="space-y-4">
      {/* Offline Mode Active Banner (Displays when cafe Wi-Fi briefly disconnects) */}
      {!isOnline && (
        <div className="p-3.5 rounded-2xl bg-amber-950/70 border border-amber-400/50 text-amber-200 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg animate-in fade-in">
          <div className="flex items-start sm:items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-400/20 text-amber-300 flex items-center justify-center shrink-0 border border-amber-400/30">
              <WifiOff className="w-4 h-4 animate-pulse" />
            </div>
            <div>
              <p className="font-bold text-amber-300 flex items-center gap-2">
                <span>Cafe Wi-Fi Disconnected — Kitchen Offline Mode Active</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] bg-amber-400/20 border border-amber-400/40 text-amber-200 font-mono font-bold">
                  BUFFER ACTIVE
                </span>
              </p>
              <p className="text-[11px] text-amber-100/80">
                The Kitchen Display Board remains 100% operational: ticket status dragging, preparation steps, grill timers, and KOT generation are buffered locally and will sync when connection returns.
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
            <span className="px-2.5 py-1 rounded-xl bg-black/40 border border-white/10 text-white/90 font-mono text-[11px]">
              {activeOrders.length} live tickets buffered
            </span>
          </div>
        </div>
      )}

      {/* Wi-Fi Reconnected Banner */}
      {justReconnected && (
        <div className="p-3 rounded-2xl bg-emerald-950/70 border border-emerald-400 text-emerald-300 text-xs font-bold flex items-center gap-2.5 shadow-lg animate-in fade-in">
          <div className="w-6 h-6 rounded-lg bg-emerald-400/20 flex items-center justify-center text-emerald-400 shrink-0">
            <Wifi className="w-4 h-4" />
          </div>
          <span>Cafe Wi-Fi Restored — All kitchen orders & KDS ticket movements synchronized live!</span>
        </div>
      )}

      {/* Toast Notice Banner */}
      {noticeMessage && (
        <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs font-bold flex items-center justify-between shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            <span>{noticeMessage}</span>
          </div>
          <button
            onClick={() => setNoticeMessage(null)}
            className="text-white/60 hover:text-white"
          >
            ✕
          </button>
        </div>
      )}

      {/* Control Bar: Filter, Search, & KDS Legend */}
      <div className="p-3.5 sm:p-4 rounded-2xl bg-[#23352E]/90 border border-white/10 shadow-md space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1 max-w-md">
            <input
              type="text"
              placeholder="Search token #, order ID, sandwich, phone..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-8 pr-7 py-2 rounded-xl bg-[#2B3D36] border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#F5E086] transition font-medium"
            />
            <Search className="w-3.5 h-3.5 text-[#F5E086] absolute left-2.5 top-2.5" />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery("")}
                className="absolute right-2 top-2 p-0.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white"
              >
                ✕
              </button>
            )}
          </div>

          {/* Order Type Filter Tabs */}
          <div className="flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
            <span className="text-[11px] font-bold text-white/50 uppercase tracking-wider hidden md:inline">
              Filter:
            </span>
            {[
              { id: "all", label: `All (${activeOrders.length})` },
              { id: "dine-in", label: "Dine-In" },
              { id: "takeaway", label: "Takeaway" },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setOrderTypeFilter(t.id as any)}
                className={`px-3 py-1.5 rounded-xl font-bold transition ${
                  orderTypeFilter === t.id
                    ? "bg-[#F5E086] text-[#24332D] shadow-sm"
                    : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Quick Info, Connection Status, Install PWA & TV Board */}
          <div className="flex items-center gap-2 text-xs text-white/60">
            {/* Wi-Fi & Offline PWA Resilient Status Indicator */}
            {isOnline ? (
              <span
                className="px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center gap-1.5"
                title="Cafe Wi-Fi connected and synchronized"
              >
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="hidden sm:inline">Wi-Fi Online</span>
                <span className="sm:hidden">Online</span>
              </span>
            ) : (
              <span
                className="px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[11px] font-bold flex items-center gap-1.5 animate-pulse"
                title="Wi-Fi briefly disconnected. KDS offline buffer active. Status changes are preserved locally."
              >
                <WifiOff className="w-3.5 h-3.5 text-amber-400" />
                <span>Offline Buffer</span>
              </span>
            )}

            {isInstallable && (
              <button
                type="button"
                onClick={installApp}
                className="px-2.5 py-1 rounded-xl bg-[#F5E086] hover:bg-[#fae89f] text-[#24332D] text-[11px] font-bold transition flex items-center gap-1 shadow-sm"
                title="Install Kitchen Display Board as full-screen tablet app"
              >
                <Download className="w-3 h-3" />
                <span className="hidden sm:inline">Install KDS</span>
                <span className="sm:hidden">Install</span>
              </button>
            )}

            <span className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-white/5 border border-white/10">
              <GripVertical className="w-3.5 h-3.5 text-[#F5E086]" />
              <span>Drag cards</span>
            </span>

            {/* Master Takeaway Voice & Push Announcement Mic Button */}
            <button
              type="button"
              onClick={() => {
                onTriggerTakeawayMic?.();
                setNoticeMessage("📢 Takeaway voice announcement & mobile notification triggered!");
                setTimeout(() => setNoticeMessage(null), 3500);
              }}
              className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs transition flex items-center gap-1.5 shadow-md active:scale-95 border border-amber-300 cursor-pointer"
              title="Click anytime to trigger Takeaway Voice Announcement & Push Notification to users' mobile browsers"
            >
              <Mic className="w-3.5 h-3.5 text-black animate-pulse" />
              <span>Takeaway Mic</span>
            </button>

            {onOpenLiveCallingBoard && (
              <button
                type="button"
                onClick={() => onOpenLiveCallingBoard()}
                className="px-3 py-1.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#17221D] font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
              >
                <Tv className="w-3.5 h-3.5" />
                <span>TV Board</span>
              </button>
            )}
          </div>
        </div>

        {/* Mobile Column Navigation Tabs (visible only on small screens) */}
        <div className="grid grid-cols-3 gap-1.5 md:hidden pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={() => setActiveMobileColumn("received")}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeMobileColumn === "received"
                ? "bg-[#F5E086] text-[#24332D]"
                : "bg-white/5 text-white/70"
            }`}
          >
            <span>Received</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/25">
              {receivedOrders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMobileColumn("toasting")}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeMobileColumn === "toasting"
                ? "bg-amber-400 text-[#17221D]"
                : "bg-white/5 text-white/70"
            }`}
          >
            <Flame className="w-3 h-3" />
            <span>Toasting</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/25">
              {toastingOrders.length}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveMobileColumn("ready")}
            className={`py-2 px-1 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 ${
              activeMobileColumn === "ready"
                ? "bg-emerald-400 text-[#17221D]"
                : "bg-white/5 text-white/70"
            }`}
          >
            <CheckCircle2 className="w-3 h-3" />
            <span>Ready</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-black/25">
              {readyOrders.length}
            </span>
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* 3-COLUMN RESPONSIVE KANBAN BOARD CONTAINER                     */}
      {/* ============================================================== */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-start">
        {/* ============================================================ */}
        {/* COLUMN 1: RECEIVED & QUEUED                                  */}
        {/* ============================================================ */}
        <div
          onDragOver={handleDragOver}
          onDragEnter={() => handleDragEnter("received")}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, "received")}
          className={`flex flex-col rounded-3xl border transition-all duration-200 ${
            activeMobileColumn !== "received" ? "hidden md:flex" : "flex"
          } ${
            dragOverColumn === "received"
              ? "bg-[#23352E] border-2 border-dashed border-[#F5E086] ring-4 ring-[#F5E086]/20 shadow-xl"
              : "bg-[#1B2722]/90 border-white/10"
          }`}
        >
          {/* Column Header */}
          <div className="p-4 border-b border-white/10 bg-[#24332D]/70 rounded-t-3xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-[#F5E086]/15 border border-[#F5E086]/30 text-[#F5E086] flex items-center justify-center font-bold">
                <Inbox className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-niea font-bold text-sm text-white flex items-center gap-1.5">
                  <span>Received</span>
                  <span className="px-2 py-0.2 rounded-full text-xs font-mono font-black bg-[#F5E086] text-[#24332D]">
                    {receivedOrders.length}
                  </span>
                </h3>
                <span className="text-[10px] text-white/50 block">
                  Awaiting slicing & assembly
                </span>
              </div>
            </div>

            <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider">
              Step 1
            </span>
          </div>

          {/* Drop indicator banner when dragging over */}
          {dragOverColumn === "received" && (
            <div className="p-3 m-3 rounded-2xl border-2 border-dashed border-[#F5E086] bg-[#F5E086]/10 text-[#F5E086] text-xs font-bold text-center animate-pulse">
              📥 Drop ticket here to move to Received
            </div>
          )}

          {/* Cards List */}
          <div className="p-3 sm:p-3.5 space-y-3 min-h-[380px] max-h-[calc(85vh-240px)] overflow-y-auto scrollbar-thin">
            {receivedOrders.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-white/40 border border-dashed border-white/10 rounded-2xl space-y-2">
                <ChefHat className="w-8 h-8 opacity-40 text-[#F5E086]" />
                <p className="text-xs font-semibold">No tickets waiting</p>
                <p className="text-[10px] text-white/40 max-w-[180px]">
                  New orders will automatically appear here
                </p>
              </div>
            ) : (
              receivedOrders.map((order) => (
                <KanbanCard
                  key={order.id}
                  order={order}
                  columnId="received"
                  isDragging={draggedOrder?.id === order.id}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onMoveToStatus={handleMoveToStatus}
                  onUpdateWaitTime={onUpdateWaitTime}
                  onOpenKot={onOpenKot}
                  onOpenLiveCallingBoard={onOpenLiveCallingBoard}
                  onTriggerTakeawayMic={onTriggerTakeawayMic}
                />
              ))
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* COLUMN 2: TOASTING ON GRILL                                  */}
        {/* ============================================================ */}
        <div
          onDragOver={handleDragOver}
          onDragEnter={() => handleDragEnter("toasting")}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, "toasting")}
          className={`flex flex-col rounded-3xl border transition-all duration-200 ${
            activeMobileColumn !== "toasting" ? "hidden md:flex" : "flex"
          } ${
            dragOverColumn === "toasting"
              ? "bg-[#2A261D] border-2 border-dashed border-amber-400 ring-4 ring-amber-400/20 shadow-xl"
              : "bg-[#1E2522]/90 border-amber-400/20"
          }`}
        >
          {/* Column Header */}
          <div className="p-4 border-b border-amber-400/20 bg-[#292D26]/70 rounded-t-3xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center font-bold">
                <Flame className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h3 className="font-niea font-bold text-sm text-amber-300 flex items-center gap-1.5">
                  <span>Toasting</span>
                  <span className="px-2 py-0.2 rounded-full text-xs font-mono font-black bg-amber-400 text-[#17221D]">
                    {toastingOrders.length}
                  </span>
                </h3>
                <span className="text-[10px] text-white/50 block">
                  On cast-iron grill at 210°C
                </span>
              </div>
            </div>

            {toastingOrders.length > 0 && onUpdateWaitTime && (
              <button
                type="button"
                onClick={handleApplyRushToToasting}
                className="px-2 py-1 rounded-lg bg-amber-400/15 hover:bg-amber-400/25 text-amber-300 border border-amber-400/30 text-[10px] font-bold transition flex items-center gap-1"
                title="Add +5m to all toasting orders"
              >
                <Zap className="w-3 h-3" />
                <span>+5m Rush</span>
              </button>
            )}
          </div>

          {/* Drop indicator banner */}
          {dragOverColumn === "toasting" && (
            <div className="p-3 m-3 rounded-2xl border-2 border-dashed border-amber-400 bg-amber-400/10 text-amber-300 text-xs font-bold text-center animate-pulse">
              🔥 Drop ticket here to mark Toasting on Grill
            </div>
          )}

          {/* Cards List */}
          <div className="p-3 sm:p-3.5 space-y-3 min-h-[380px] max-h-[calc(85vh-240px)] overflow-y-auto scrollbar-thin">
            {toastingOrders.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-white/40 border border-dashed border-white/10 rounded-2xl space-y-2">
                <Flame className="w-8 h-8 opacity-40 text-amber-400" />
                <p className="text-xs font-semibold">Grill is clear</p>
                <p className="text-[10px] text-white/40 max-w-[180px]">
                  Drag tickets here or click "Toasting →" to begin grilling
                </p>
              </div>
            ) : (
              toastingOrders.map((order) => (
                <KanbanCard
                  key={order.id}
                  order={order}
                  columnId="toasting"
                  isDragging={draggedOrder?.id === order.id}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onMoveToStatus={handleMoveToStatus}
                  onUpdateWaitTime={onUpdateWaitTime}
                  onOpenKot={onOpenKot}
                  onOpenLiveCallingBoard={onOpenLiveCallingBoard}
                  onTriggerTakeawayMic={onTriggerTakeawayMic}
                />
              ))
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* COLUMN 3: HOT & READY FOR PICKUP                             */}
        {/* ============================================================ */}
        <div
          onDragOver={handleDragOver}
          onDragEnter={() => handleDragEnter("ready")}
          onDragLeave={handleDragLeave}
          onDrop={(e) => handleDrop(e, "ready")}
          className={`flex flex-col rounded-3xl border transition-all duration-200 ${
            activeMobileColumn !== "ready" ? "hidden md:flex" : "flex"
          } ${
            dragOverColumn === "ready"
              ? "bg-[#182C22] border-2 border-dashed border-emerald-400 ring-4 ring-emerald-400/20 shadow-xl"
              : "bg-[#192721]/90 border-emerald-400/20"
          }`}
        >
          {/* Column Header */}
          <div className="p-4 border-b border-emerald-400/20 bg-[#1D3227]/70 rounded-t-3xl flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-emerald-400/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center font-bold">
                <CheckCircle2 className="w-4 h-4 animate-pulse" />
              </div>
              <div>
                <h3 className="font-niea font-bold text-sm text-emerald-300 flex items-center gap-1.5">
                  <span>Ready</span>
                  <span className="px-2 py-0.2 rounded-full text-xs font-mono font-black bg-emerald-400 text-[#17221D]">
                    {readyOrders.length}
                  </span>
                </h3>
                <span className="text-[10px] text-white/50 block">
                  Plated, boxed & calling
                </span>
              </div>
            </div>

            {readyOrders.length > 0 && onOpenLiveCallingBoard && (
              <button
                type="button"
                onClick={() => onOpenLiveCallingBoard(readyOrders[0]?.tokenNumber)}
                className="px-2 py-1 rounded-lg bg-emerald-400/20 hover:bg-emerald-400/30 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold transition flex items-center gap-1"
                title="Call all ready tokens on TV display"
              >
                <Bell className="w-3 h-3" />
                <span>Call TV</span>
              </button>
            )}
          </div>

          {/* Drop indicator banner */}
          {dragOverColumn === "ready" && (
            <div className="p-3 m-3 rounded-2xl border-2 border-dashed border-emerald-400 bg-emerald-400/10 text-emerald-300 text-xs font-bold text-center animate-pulse">
              🎉 Drop ticket here to mark Ready for Customer Pickup!
            </div>
          )}

          {/* Cards List */}
          <div className="p-3 sm:p-3.5 space-y-3 min-h-[380px] max-h-[calc(85vh-240px)] overflow-y-auto scrollbar-thin">
            {readyOrders.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center p-6 text-white/40 border border-dashed border-white/10 rounded-2xl space-y-2">
                <CheckCircle2 className="w-8 h-8 opacity-40 text-emerald-400" />
                <p className="text-xs font-semibold">No orders waiting for pickup</p>
                <p className="text-[10px] text-white/40 max-w-[180px]">
                  Drag tickets here when sandwiches are plated and hot
                </p>
              </div>
            ) : (
              readyOrders.map((order) => (
                <KanbanCard
                  key={order.id}
                  order={order}
                  columnId="ready"
                  isDragging={draggedOrder?.id === order.id}
                  onDragStart={handleDragStart}
                  onDragEnd={handleDragEnd}
                  onMoveToStatus={handleMoveToStatus}
                  onUpdateWaitTime={onUpdateWaitTime}
                  onOpenKot={onOpenKot}
                  onOpenLiveCallingBoard={onOpenLiveCallingBoard}
                  onTriggerTakeawayMic={onTriggerTakeawayMic}
                />
              ))
            )}
          </div>
        </div>
      </div>

      {/* ============================================================== */}
      {/* QUICK DROP ZONE FOR 'SERVED / COMPLETED' & STATS FOOTER        */}
      {/* ============================================================== */}
      <div
        onDragOver={handleDragOver}
        onDragEnter={() => handleDragEnter("served")}
        onDragLeave={handleDragLeave}
        onDrop={(e) => handleDrop(e, "served")}
        className={`p-3.5 sm:p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-center justify-between gap-3 text-xs ${
          dragOverColumn === "served"
            ? "bg-emerald-950/80 border-2 border-dashed border-emerald-400 ring-4 ring-emerald-400/30 scale-[1.01]"
            : "bg-[#1E2B25] border-white/10"
        }`}
      >
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-xl bg-white/10 text-white/80 flex items-center justify-center font-bold shrink-0">
            <Check className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <span className="font-bold text-white block">
              Quick Drop Zone: Mark Served & Completed
            </span>
            <span className="text-[11px] text-white/50">
              Drag any finished ticket here to archive and log completion
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-white/50 block">
              Served Today
            </span>
            <span className="font-niea font-bold text-sm text-[#F5E086]">
              {servedTodayCount} tickets completed
            </span>
          </div>
          <span className="px-3 py-1.5 rounded-xl bg-white/5 text-white/70 border border-white/10 text-[11px] font-semibold">
            {activeOrders.length} Active in Kitchen
          </span>
        </div>
      </div>

      {/* Floating Offline Sync Reassurance Toast for Kitchen Staff */}
      <OfflineSyncToast bufferedTicketsCount={activeOrders.length} />
    </div>
  );
});
