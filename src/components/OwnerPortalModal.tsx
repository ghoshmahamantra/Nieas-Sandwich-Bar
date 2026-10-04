import React, { useState, useMemo, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  X,
  Plus,
  Trash2,
  Edit2,
  Check,
  Sparkles,
  Users,
  Clock,
  PackageCheck,
  CalendarCheck,
  Phone,
  MessageSquare,
  RotateCcw,
  CheckCircle2,
  TrendingUp,
  Lock,
  KeyRound,
  AlertCircle,
  ChefHat,
  Flame,
  Bell,
  Send,
  Timer,
  Search,
  UserPlus,
  BarChart3,
  Sliders,
  Tv,
  Printer,
  Filter,
  ArrowUpDown,
  Utensils,
  ShoppingBag,
  LayoutGrid,
  Wifi,
  WifiOff,
  Download,
  Calendar,
  CalendarRange,
  Percent,
  Store,
  Globe,
  Tag,
  FileSpreadsheet,
  Award,
  Gift,
  DollarSign,
  Mic,
  Volume2,
  VolumeX,
} from "lucide-react";
import { usePwaInstall } from "../utils/usePwaInstall";
import {
  MenuItem,
  MenuCategory,
  SeatingStatus,
  ReservationRecord,
  CafeHighlight,
  OrderRecord,
  OrderNotification,
  PosSalesRecord,
  PreBookingConfig,
  OrderStepId,
  CouponDiscount,
  StoreFinancialSettings,
  WebsiteContentConfig,
  WhatsAppTemplatesConfig,
  DailyIngredientEntry,
  DailyWastageEntry,
  LoyaltyProgramConfig,
  MasterIngredientTemplate,
  CustomizationOption,
} from "../types/niea";
import {
  DEFAULT_COUPONS,
  DEFAULT_FINANCIAL_SETTINGS,
  DEFAULT_WEBSITE_CONFIG,
  DEFAULT_WHATSAPP_CONFIG,
  DEFAULT_LOYALTY_CONFIG,
  INITIAL_DAILY_INGREDIENTS,
  DEFAULT_MASTER_INGREDIENTS,
} from "../data/nieaData";
import { generateAutomatedHighlight } from "../utils/highlightAutomation";
import { checkPreBookingWindow } from "../utils/preBookingHelper";
import { ImagePickerField } from "./ImagePickerField";
import { WalkInOrderTab } from "./portal/WalkInOrderTab";
import { QueueManagementTab } from "./portal/QueueManagementTab";
import { PreBookingConfigTab } from "./portal/PreBookingConfigTab";
import { DiscountsGstTab } from "./portal/DiscountsGstTab";
import { WebsiteContentTab } from "./portal/WebsiteContentTab";
import { WhatsAppAlertsTab } from "./portal/WhatsAppAlertsTab";
import { DailyIngredientsTab } from "./portal/DailyIngredientsTab";
import { OrderStepProgressControl } from "./OrderStepProgressControl";
import { KitchenKanbanBoard } from "./portal/KitchenKanbanBoard";
import { PetPoojaAnalyticsTab } from "./portal/PetPoojaAnalyticsTab";
import { OfflineSyncToast } from "./OfflineSyncToast";
import { OwnerAiChatbot } from "./portal/OwnerAiChatbot";
import {
  filterOrdersByDate,
  filterPosRecordsByDate,
  generateStoreAnalyticsSummary,
  StoreAnalyticsSummaryResult,
} from "../utils/aiAnalyticsHelper";

export type OrderStatusFilter =
  | "all"
  | "active"
  | "received"
  | "toasting"
  | "ready"
  | "served";
export type OrderTypeFilter =
  | "all"
  | "dine-in"
  | "takeaway"
  | "walk_in"
  | "pre_order";
export type OrderSortBy = "newest" | "oldest" | "urgency";

export type PortalTab =
  | "walkin"
  | "queue"
  | "orders"
  | "kanban"
  | "inventory"
  | "ingredients"
  | "reservations"
  | "seating"
  | "analytics"
  | "discounts"
  | "perks"
  | "website"
  | "whatsapp"
  | "prebooking"
  | "highlights"
  | "new-item"
  | "ai-assistant";

interface OwnerPortalModalProps {
  isOpen: boolean;
  onClose: () => void;
  menuItems: MenuItem[];
  onUpdateMenuItem: (updated: MenuItem) => void;
  onAddMenuItem: (newItem: MenuItem) => void;
  onDeleteMenuItem: (id: string) => void;
  seating: SeatingStatus;
  onUpdateSeating: (updated: SeatingStatus) => void;
  onResetDefaults: () => void;
  reservations: ReservationRecord[];
  onUpdateReservationStatus: (
    id: string,
    status: "confirmed" | "seated" | "cancelled" | "no-show"
  ) => void;
  onDeleteReservation: (id: string) => void;
  initialTab?: PortalTab;
  cafeHighlight?: CafeHighlight;
  onUpdateCafeHighlight?: (highlight: CafeHighlight) => void;
  liveOrders?: OrderRecord[];
  onAddOrder?: (order: OrderRecord) => void;
  onOpenKot?: (order: OrderRecord) => void;
  onOpenLiveCallingBoard?: (tokenNumber?: string) => void;
  onUpdateOrderStatus?: (
    orderId: string,
    status: "received" | "toasting" | "ready" | "served" | "cancelled",
    customNote?: string
  ) => void;
  onUpdateOrderTimeLeft?: (orderId: string, minutesLeft: number, note?: string) => void;
  onSendOrderNotification?: (orderId: string, title: string, message: string) => void;
  simulatedMinutes?: number;
  onSetSimulatedMinutes?: (mins: number | undefined) => void;
  activeHoldsCount?: number;
  posRecords?: PosSalesRecord[];
  onAddPosRecord?: (record: PosSalesRecord) => void;
  preBookingConfig?: PreBookingConfig;
  onUpdatePreBookingConfig?: (config: PreBookingConfig) => void;
  onUpdateOrderStep?: (
    orderId: string,
    stepId: OrderStepId | null,
    note?: string,
    announce?: boolean
  ) => void;
  analyticsDate?: string;
  onUpdateAnalyticsDate?: (date: string) => void;
  getStoreAnalyticsSummary?: (
    targetDate?: string,
    range?: { start: string; end: string }
  ) => StoreAnalyticsSummaryResult;
  isFloatingCatEnabled?: boolean;
  setIsFloatingCatEnabled?: (enabled: boolean) => void;
  coupons?: CouponDiscount[];
  onUpdateCoupons?: (coupons: CouponDiscount[]) => void;
  financialSettings?: StoreFinancialSettings;
  onUpdateFinancialSettings?: (settings: StoreFinancialSettings) => void;
  websiteConfig?: WebsiteContentConfig;
  onUpdateWebsiteConfig?: (config: WebsiteContentConfig) => void;
  whatsappConfig?: WhatsAppTemplatesConfig;
  onUpdateWhatsappConfig?: (config: WhatsAppTemplatesConfig) => void;
  dailyIngredients?: DailyIngredientEntry[];
  onUpdateDailyIngredients?: (ingredients: DailyIngredientEntry[]) => void;
  dailyWastage?: DailyWastageEntry[];
  onUpdateDailyWastage?: (wastage: DailyWastageEntry[]) => void;
  masterIngredients?: MasterIngredientTemplate[];
  onUpdateMasterIngredients?: (master: MasterIngredientTemplate[]) => void;
  loyaltyConfig?: LoyaltyProgramConfig;
  onUpdateLoyaltyConfig?: (config: LoyaltyProgramConfig) => void;
  broadcastTakeawayAnnouncement?: (params?: {
    orderId?: string;
    orderNumber?: string;
    tokenNumber?: string;
    customerName?: string;
    customerPhone?: string;
    targetUserId?: string;
    targetPhone?: string;
    message?: string;
  }) => Promise<void>;
}

interface KitchenOrderTimeAdjusterProps {
  order: OrderRecord;
  currentMinutes: number;
  onUpdateOrderTimeLeft?: (orderId: string, minutesLeft: number, note?: string) => void;
  onNotice: (msg: string) => void;
}

const KitchenOrderTimeAdjuster: React.FC<KitchenOrderTimeAdjusterProps> = React.memo(
  ({ order, currentMinutes, onUpdateOrderTimeLeft, onNotice }) => {
    const [val, setVal] = useState("");

    const handleApply = (minutes: number, note?: string) => {
      const next = Math.max(0, minutes);
      onUpdateOrderTimeLeft?.(order.id, next, note);
      onNotice(`⏱️ Timer updated to ${next} mins for #${order.orderNumber}`);
    };

    const handleCustomSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      const parsed = parseInt(val, 10);
      if (!isNaN(parsed) && parsed >= 0) {
        handleApply(parsed);
        setVal("");
      }
    };

    return (
      <div className="p-3 rounded-xl bg-[#24332D] border border-[#F5E086]/30 space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1.5">
          <span className="text-xs font-bold text-[#F5E086] flex items-center gap-1.5">
            <Timer className="w-3.5 h-3.5" />
            <span>Update Time Left (Staff Exclusive)</span>
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-white/70">Current Live Timer:</span>
            <span className="px-2 py-0.5 rounded-md bg-[#1B2823] text-[#F5E086] font-mono font-bold text-xs border border-white/10">
              {currentMinutes > 0 ? `${currentMinutes} mins left` : "Ready / 0 mins"}
            </span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Quick Increment/Decrement Buttons */}
          <div className="flex items-center gap-1 bg-[#1C2723] p-1 rounded-xl border border-white/10">
            <button
              type="button"
              onClick={() => handleApply(currentMinutes - 5)}
              className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono text-[11px] font-bold transition"
              title="Subtract 5 minutes"
            >
              -5m
            </button>
            <button
              type="button"
              onClick={() => handleApply(currentMinutes - 1)}
              className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono text-[11px] font-bold transition"
              title="Subtract 1 minute"
            >
              -1m
            </button>
            <button
              type="button"
              onClick={() => handleApply(currentMinutes + 1)}
              className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono text-[11px] font-bold transition"
              title="Add 1 minute"
            >
              +1m
            </button>
            <button
              type="button"
              onClick={() => handleApply(currentMinutes + 5)}
              className="px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white font-mono text-[11px] font-bold transition"
              title="Add 5 minutes"
            >
              +5m
            </button>
          </div>

          {/* Standard Presets */}
          <button
            type="button"
            onClick={() => handleApply(2, "Chef marked final 2-minute plating alert.")}
            className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white/90 transition"
          >
            2m (Rush)
          </button>
          <button
            type="button"
            onClick={() => handleApply(6, "Chef updated grill timer to 6 minutes.")}
            className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white/90 transition"
          >
            6m (Standard)
          </button>
          <button
            type="button"
            onClick={() => handleApply(12, "Fresh sourdough artisan bake cycle queued (12m).")}
            className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white/90 transition"
          >
            12m (Fresh Sourdough)
          </button>
          <button
            type="button"
            onClick={() => handleApply(25, "Standard queue rush timer (25m).")}
            className="px-2.5 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-xs font-semibold text-white/90 transition"
          >
            25m
          </button>
          <button
            type="button"
            onClick={() => handleApply(45, "Peak dinner rush timer (45m).")}
            className="px-2.5 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-xs font-bold text-amber-300 border border-amber-400/30 transition"
          >
            45m Rush
          </button>

          {/* Custom Minutes Input with Enter Key */}
          <form onSubmit={handleCustomSubmit} className="flex items-center gap-1 ml-auto">
            <input
              type="number"
              min={0}
              max={120}
              placeholder="Mins"
              value={val}
              onChange={(e) => setVal(e.target.value)}
              className="w-16 px-2 py-1 rounded-lg bg-[#1C2723] border border-white/15 text-xs text-white text-center font-mono focus:outline-none focus:border-[#F5E086]"
            />
            <button
              type="submit"
              disabled={!val.trim() || isNaN(parseInt(val, 10))}
              className="px-2.5 py-1 rounded-lg bg-[#F5E086] text-[#24332D] text-xs font-bold hover:bg-[#F8E79B] disabled:opacity-40 disabled:hover:bg-[#F5E086] transition"
            >
              Set
            </button>
          </form>
        </div>
      </div>
    );
  }
);

const AnalyticsTabLoadingSkeleton: React.FC = () => (
  <div className="space-y-4 animate-pulse">
    <div className="h-16 rounded-2xl bg-[#1E2B25] border border-white/10 p-4 flex items-center justify-between">
      <div className="space-y-1.5">
        <div className="h-4 bg-white/10 rounded w-44" />
        <div className="h-3 bg-white/5 rounded w-28" />
      </div>
      <div className="h-8 bg-white/10 rounded-xl w-32" />
    </div>
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="h-20 rounded-2xl bg-[#1E2B25] border border-white/10 p-4" />
      ))}
    </div>
    <div className="h-72 rounded-2xl bg-[#1E2B25] border border-white/10 p-5" />
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <div className="h-60 rounded-2xl bg-[#1E2B25] border border-white/10" />
      <div className="h-60 rounded-2xl bg-[#1E2B25] border border-white/10" />
    </div>
  </div>
);

interface KitchenOrderCardProps {
  order: OrderRecord;
  onOpenKot?: (order: OrderRecord) => void;
  onOpenLiveCallingBoard?: (tokenNumber?: string) => void;
  onUpdateOrderStep?: (
    orderId: string,
    stepId: OrderStepId | null,
    note?: string,
    announce?: boolean
  ) => void;
  onUpdateOrderStatus?: (
    orderId: string,
    status: "received" | "toasting" | "ready" | "served" | "cancelled",
    note?: string
  ) => void;
  onUpdateOrderTimeLeft?: (orderId: string, minutesLeft: number, note?: string) => void;
  onSendOrderNotification?: (orderId: string, title: string, message: string) => void;
  onSetOrderPhoneQuery: (phone: string) => void;
  onSetNoticeSentMessage: (msg: string) => void;
  broadcastTakeawayAnnouncement?: (params?: {
    orderId?: string;
    orderNumber?: string;
    tokenNumber?: string;
    customerName?: string;
    customerPhone?: string;
    targetUserId?: string;
    targetPhone?: string;
    message?: string;
  }) => Promise<void>;
}

const KitchenOrderCard: React.FC<KitchenOrderCardProps> = React.memo(({
  order,
  onOpenKot,
  onOpenLiveCallingBoard,
  onUpdateOrderStep,
  onUpdateOrderStatus,
  onUpdateOrderTimeLeft,
  onSendOrderNotification,
  onSetOrderPhoneQuery,
  onSetNoticeSentMessage,
  broadcastTakeawayAnnouncement,
}) => {
  const [customNote, setCustomNote] = useState("");

  const elapsed = order.waitingStartedAt || order.createdAt
    ? Math.max(0, Math.floor((Date.now() - new Date(order.waitingStartedAt || order.createdAt).getTime()) / (1000 * 60)))
    : 0;

  const currentMinutes =
    order.status === "ready" || order.status === "served"
      ? 0
      : typeof order.estimatedMinutesLeft === "number"
      ? Math.max(0, order.estimatedMinutesLeft)
      : Math.max(0, (order.estimatedWaitingMinutes || 20) - elapsed);

  const isTakeaway = order.orderType === "takeaway" || order.orderKind === "takeaway";

  return (
    <div
      className={`rounded-2xl border p-4 sm:p-5 transition-all shadow-md space-y-4 overflow-hidden ${
        isTakeaway
          ? "bg-gradient-to-br from-[#2E2818] via-[#24332D] to-[#1C2723] border-2 border-amber-400 ring-2 ring-amber-400/35 shadow-[0_0_24px_rgba(251,191,36,0.35)]"
          : order.status === "ready"
          ? "bg-gradient-to-br from-[#233f34] to-[#1E2B25] border-emerald-400/50"
          : order.status === "toasting"
          ? "bg-gradient-to-br from-[#383324] to-[#252E2A] border-amber-400/40"
          : order.status === "served"
          ? "bg-[#202C27] border-white/10 opacity-75"
          : "bg-[#2B3D36] border-white/15"
      }`}
    >
      {/* Highlighted Takeaway Needs Packing Banner */}
      {isTakeaway && (
        <div className="bg-gradient-to-r from-amber-400 via-amber-300 to-amber-400 text-black px-3.5 py-1.5 font-black text-[11px] uppercase tracking-wider flex items-center justify-between rounded-xl shadow-xs -mt-1 -mx-1 mb-2 border border-amber-500/40">
          <div className="flex items-center gap-1.5 font-bold">
            <ShoppingBag className="w-4 h-4 text-black shrink-0" />
            <span>📦 NEEDS PACKING • TAKEAWAY PARCEL</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="bg-black/90 text-amber-300 text-[9px] px-2 py-0.5 rounded font-mono font-bold">
              KRAFT BOX & SEAL
            </span>
            {broadcastTakeawayAnnouncement && (
              <button
                type="button"
                onClick={() => {
                  broadcastTakeawayAnnouncement({
                    tokenNumber: order.tokenNumber,
                    orderNumber: order.orderNumber,
                    message: `Takeaway order #${order.tokenNumber || order.orderNumber} is packed and ready for pickup!`,
                  });
                  onSetNoticeSentMessage(`📢 Takeaway announcement triggered for Token #${order.tokenNumber || order.orderNumber}!`);
                }}
                className="px-2.5 py-0.5 rounded-lg bg-black text-[#F5E086] hover:bg-black/80 font-black text-[10px] flex items-center gap-1 transition active:scale-95 cursor-pointer shadow-xs"
                title="Trigger voice announcement & push notification for this takeaway order"
              >
                <Mic className="w-3 h-3 text-[#F5E086] animate-pulse" />
                <span>Mic Call</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Order Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pb-3 border-b border-white/10">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-mono font-black text-sm text-[#F5E086]">
              {order.orderNumber}
            </span>

            {order.tokenNumber && (
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-amber-400 text-[#1C2723] shadow-xs">
                Token {order.tokenNumber}
              </span>
            )}

            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                order.orderType === "dine-in"
                  ? "bg-[#F5E086] text-[#24332D]"
                  : "bg-sky-400/20 text-sky-300 border border-sky-400/30"
              }`}
            >
              {order.orderType === "dine-in"
                ? `Dine-in • ${order.tableNumber || "Table 1"}`
                : "Takeaway • Counter Pickup"}
            </span>

            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                order.status === "ready"
                  ? "bg-emerald-400 text-[#24332D]"
                  : order.status === "toasting"
                  ? "bg-amber-400 text-[#24332D]"
                  : order.status === "served"
                  ? "bg-white/20 text-white"
                  : "bg-blue-400/20 text-blue-300 border border-blue-400/30"
              }`}
            >
              {order.status === "ready"
                ? "Hot & Ready"
                : order.status === "toasting"
                ? "Toasting on Grill"
                : order.status === "served"
                ? "Served / Completed"
                : "Received & Queued"}
            </span>

            {order.status !== "served" && (
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-mono font-bold flex items-center gap-1 border shrink-0 ${
                  order.status === "ready"
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
                    : currentMinutes <= 3
                    ? "bg-rose-500/20 text-rose-300 border-rose-500/40 animate-pulse"
                    : "bg-black/40 text-[#F5E086] border-[#F5E086]/30"
                }`}
              >
                <Clock className="w-3 h-3 shrink-0 text-amber-300" />
                <span>{order.status === "ready" ? "Ready" : `${currentMinutes}m left`}</span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs text-white/70">
            <span>Customer: <strong className="text-white">{order.customerName || "Guest"}</strong></span>
            {order.customerPhone && (
              <div className="flex items-center gap-1.5">
                <a
                  href={`tel:${order.customerPhone}`}
                  className="text-[#F5E086] hover:underline flex items-center gap-1"
                  title="Call customer"
                >
                  <Phone className="w-3 h-3" />
                  <span>{order.customerPhone}</span>
                </a>
                <button
                  type="button"
                  onClick={() => onSetOrderPhoneQuery(order.customerPhone)}
                  className="text-[10px] px-1.5 py-0.5 rounded bg-white/10 hover:bg-[#F5E086] hover:text-[#24332D] text-white/70 transition font-medium"
                  title="Filter order list by this customer phone"
                >
                  Filter
                </button>
              </div>
            )}
            <span>• Placed: {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 sm:self-center">
          <div className="flex items-center gap-1.5 flex-wrap">
            {broadcastTakeawayAnnouncement && (
              <button
                type="button"
                onClick={() => {
                  broadcastTakeawayAnnouncement({
                    orderId: order.id,
                    orderNumber: order.orderNumber,
                    tokenNumber: order.tokenNumber,
                    customerName: order.customerName,
                    customerPhone: order.customerPhone,
                    targetUserId: (order as any).userId,
                    targetPhone: order.customerPhone,
                    message: `Token #${order.tokenNumber || order.orderNumber}: Your fresh ${order.orderType === "dine-in" ? `Dine-in table (${order.tableNumber || "Order"})` : "order"} is ready for pickup!`,
                  });
                  onSetNoticeSentMessage(
                    `🎙️ Calling customer ${order.customerName ? `(${order.customerName})` : ""} for Token #${order.tokenNumber || order.orderNumber}! Private voice alert & Twilio call dispatched.`
                  );
                }}
                className="px-2.5 py-1 rounded-xl bg-amber-400 hover:bg-amber-300 text-black text-[11px] font-black shadow-xs border border-amber-500/40 transition flex items-center gap-1 active:scale-95 cursor-pointer"
                title={`Announce & Call ${order.customerName || "Customer"} (Token #${order.tokenNumber || order.orderNumber}): Sends private voice alert, browser notification & Twilio call to this customer only`}
              >
                <Mic className="w-3.5 h-3.5 text-black animate-pulse" />
                <span>Call User</span>
              </button>
            )}

            {onOpenKot && (
              <button
                type="button"
                onClick={() => onOpenKot(order)}
                className="px-2.5 py-1 rounded-xl bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold border border-white/15 transition flex items-center gap-1"
                title="View & Print Kitchen Order Ticket (KOT)"
              >
                <Printer className="w-3 h-3 text-[#F5E086]" />
                <span>KOT</span>
              </button>
            )}
            {onOpenLiveCallingBoard && (
              <button
                type="button"
                onClick={() => onOpenLiveCallingBoard(order.tokenNumber)}
                className="px-2.5 py-1 rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-[11px] font-bold border border-emerald-400/30 transition flex items-center gap-1"
                title="Call token on Live Display Screen"
              >
                <Tv className="w-3 h-3" />
                <span>Call TV</span>
              </button>
            )}

            {onUpdateOrderStatus && order.status !== "cancelled" && order.status !== "served" && (
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      `Are you sure you want to cancel Order #${order.orderNumber} (Token #${order.tokenNumber || order.orderNumber})? This will mark the order as cancelled.`
                    )
                  ) {
                    onUpdateOrderStatus(order.id, "cancelled", "Cancelled by store owner via portal");
                    onSetNoticeSentMessage(`Order #${order.orderNumber} has been cancelled.`);
                  }
                }}
                className="px-2.5 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 text-[11px] font-bold border border-rose-500/30 transition flex items-center gap-1 active:scale-95 cursor-pointer"
                title="Cancel this order"
              >
                <X className="w-3 h-3 text-rose-400 stroke-[3]" />
                <span>Cancel Order</span>
              </button>
            )}
          </div>

          <div className="text-right">
            <span className="text-[10px] uppercase font-bold text-white/50 block">Order Total</span>
            <span className="font-niea font-bold text-base text-white">
              ₹{order.grandTotal}
            </span>
          </div>
        </div>
      </div>

      {/* Order Items Breakdown */}
      <div className="bg-[#1C2723]/60 rounded-xl p-3 border border-white/5 space-y-2">
        <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider block">
          Ordered Items ({order.items.length})
        </span>
        <div className="space-y-1.5">
          {order.items.map((ci) => (
            <div
              key={ci.cartItemId}
              className="flex items-start justify-between text-xs text-white/90"
            >
              <div className="space-y-0.5">
                <div className="font-semibold text-white flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded bg-white/10 text-[#F5E086] text-[10px] flex items-center justify-center font-bold">
                    {ci.quantity}×
                  </span>
                  <span>{ci.item.name}</span>
                </div>
                {ci.selectedBread && ci.selectedBread !== "Default" && (
                  <span className="text-[11px] text-white/50 block pl-5">
                    Bread: {ci.selectedBread}
                  </span>
                )}
                {ci.selectedCustomizations && ci.selectedCustomizations.length > 0 && (
                  <span className="text-[11px] text-[#F5E086]/70 block pl-5">
                    Add-ons: {ci.selectedCustomizations.map((c) => c.name).join(", ")}
                  </span>
                )}
              </div>
              <span className="font-mono text-white/60">₹{ci.totalPrice}</span>
            </div>
          ))}
        </div>
      </div>

      {/* OWNER CONTROL 1: UPDATE PREP STEPS & ANNOUNCEMENT OPTION */}
      <OrderStepProgressControl
        order={order}
        onUpdateStep={(ordId, stepId, note, announce) => {
          if (onUpdateOrderStep) {
            onUpdateOrderStep(ordId, stepId, note, announce);
          } else {
            if (stepId === "cooking_toasting") onUpdateOrderStatus?.(ordId, "toasting", note);
            else if (stepId === "ready_calling") onUpdateOrderStatus?.(ordId, "ready", note);
            else if (stepId === "served") onUpdateOrderStatus?.(ordId, "served", note);
            else if (stepId === "order_taken" || stepId === "prep_assembly")
              onUpdateOrderStatus?.(ordId, "received", note);
          }
          onSetNoticeSentMessage(`Order #${order.orderNumber} milestone updated!`);
        }}
      />

      {/* OWNER CONTROL 2: UPDATE ESTIMATED TIME LEFT */}
      <KitchenOrderTimeAdjuster
        order={order}
        currentMinutes={currentMinutes}
        onUpdateOrderTimeLeft={onUpdateOrderTimeLeft}
        onNotice={(msg) => onSetNoticeSentMessage(msg)}
      />

      {/* OWNER CONTROL 3: SEND CUSTOM NOTIFICATION TO CUSTOMER */}
      <div className="p-3 rounded-xl bg-[#24332D] border border-[#F5E086]/30 space-y-2.5">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[#F5E086] flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5" />
            <span>Dispatch Kitchen Notification to User Tracker</span>
          </span>
          <span className="text-[10px] text-white/50">
            Appears instantly on customer's live tracking view
          </span>
        </div>

        {/* Quick Message Chips */}
        <div className="flex flex-wrap items-center gap-1.5">
          {[
            "Cast-iron grill sizzling at 210°C with cultured butter.",
            "Artisanal sourdough sliced & fillings assembled fresh.",
            "Plated and on the way to your table.",
            "Sealed in thermal packaging, ready for counter pickup.",
          ].map((presetMsg, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => {
                onSendOrderNotification?.(order.id, "Kitchen Update", presetMsg);
                onSetNoticeSentMessage(`Notification dispatched to #${order.orderNumber}: "${presetMsg}"`);
              }}
              className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/15 text-[11px] text-white/80 border border-white/10 transition text-left"
            >
              {presetMsg}
            </button>
          ))}
        </div>

        {/* Custom Notification Input */}
        <div className="flex items-center gap-2 pt-1">
          <input
            type="text"
            placeholder="Write a custom kitchen message for the customer..."
            value={customNote}
            onChange={(e) => setCustomNote(e.target.value)}
            className="flex-1 px-3 py-1.5 rounded-xl bg-[#1C2723] border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#F5E086]"
          />
          <button
            type="button"
            onClick={() => {
              const msg = customNote.trim();
              if (msg) {
                onSendOrderNotification?.(order.id, "Chef's Update", msg);
                onSetNoticeSentMessage(`Notification sent to #${order.orderNumber}!`);
                setCustomNote("");
              }
            }}
            className="px-3.5 py-1.5 rounded-xl bg-[#F5E086] text-[#24332D] text-xs font-bold hover:bg-[#F8E79B] transition flex items-center gap-1.5 shrink-0 shadow-sm"
          >
            <Send className="w-3 h-3" />
            <span>Send Alert</span>
          </button>
        </div>

        {/* Log of Sent Notifications for this order */}
        {order.notifications && order.notifications.length > 0 && (
          <div className="pt-2 border-t border-white/10 space-y-1.5">
            <span className="text-[10px] uppercase font-bold text-white/40 tracking-wider block">
              Sent Notifications Log ({order.notifications.length})
            </span>
            <div className="space-y-1 max-h-24 overflow-y-auto pr-1">
              {order.notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="p-1.5 rounded-lg bg-[#18231F] text-[11px] flex items-center justify-between text-white/70"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="text-[#F5E086] font-semibold">{notif.title}</span>
                    <span>—</span>
                    <span className="text-white/90">{notif.message}</span>
                  </div>
                  <span className="text-[10px] text-white/40 font-mono shrink-0 ml-2">
                    {notif.time}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
});

export const OwnerPortalModal: React.FC<OwnerPortalModalProps> = ({
  isOpen,
  onClose,
  menuItems,
  onUpdateMenuItem,
  onAddMenuItem,
  onDeleteMenuItem,
  seating,
  onUpdateSeating,
  onResetDefaults,
  reservations,
  onUpdateReservationStatus,
  onDeleteReservation,
  initialTab = "queue",
  cafeHighlight,
  onUpdateCafeHighlight,
  liveOrders = [],
  onAddOrder,
  onOpenKot,
  onOpenLiveCallingBoard,
  onUpdateOrderStatus,
  onUpdateOrderTimeLeft,
  onSendOrderNotification,
  onUpdateOrderStep,
  activeHoldsCount = 0,
  posRecords = [],
  onAddPosRecord,
  preBookingConfig = {
    isEnabled: true,
    startHour: 11,
    endHour: 10,
    timeSlotIntervalMinutes: 30,
    advanceDepositAmount: 150,
  },
  onUpdatePreBookingConfig,
  analyticsDate: propsAnalyticsDate,
  onUpdateAnalyticsDate,
  getStoreAnalyticsSummary,
  isFloatingCatEnabled = true,
  setIsFloatingCatEnabled,
  coupons = DEFAULT_COUPONS,
  onUpdateCoupons,
  financialSettings = DEFAULT_FINANCIAL_SETTINGS,
  onUpdateFinancialSettings,
  websiteConfig = DEFAULT_WEBSITE_CONFIG,
  onUpdateWebsiteConfig,
  whatsappConfig = DEFAULT_WHATSAPP_CONFIG,
  onUpdateWhatsappConfig,
  dailyIngredients = INITIAL_DAILY_INGREDIENTS,
  onUpdateDailyIngredients,
  dailyWastage = [],
  onUpdateDailyWastage,
  masterIngredients = DEFAULT_MASTER_INGREDIENTS,
  onUpdateMasterIngredients,
  loyaltyConfig = DEFAULT_LOYALTY_CONFIG,
  onUpdateLoyaltyConfig,
  broadcastTakeawayAnnouncement,
}) => {
  const [activeTab, setActiveTab] = useState<PortalTab>(initialTab);
  const { isOnline, justReconnected, isInstallable, installApp } = usePwaInstall();

  // Dedicated date state for analytics filtering & AI calculations
  const [internalAnalyticsDate, setInternalAnalyticsDate] = useState<string>(() => {
    return propsAnalyticsDate || new Date().toISOString().slice(0, 10);
  });
  const analyticsDate = propsAnalyticsDate || internalAnalyticsDate;
  const handleSetAnalyticsDate = (newDate: string) => {
    setInternalAnalyticsDate(newDate);
    onUpdateAnalyticsDate?.(newDate);
  };

  const [analyticsDateRange, setAnalyticsDateRange] = useState<{ start: string; end: string }>({
    start: new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10),
    end: new Date().toISOString().slice(0, 10),
  });
  const [analyticsFilterMode, setAnalyticsFilterMode] = useState<"single" | "range">("single");

  // Valid, non-seeded orders filter
  const validRealOrders = useMemo(() => {
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

  // Filter liveOrders based on an explicitly selected date or date range rather than defaulting to today
  const filteredLiveOrdersForDate = useMemo(() => {
    return filterOrdersByDate(
      validRealOrders,
      analyticsFilterMode === "single" ? analyticsDate : undefined,
      analyticsFilterMode === "range" ? analyticsDateRange : undefined
    );
  }, [validRealOrders, analyticsDate, analyticsFilterMode, analyticsDateRange]);

  // Filter posRecords based on selected date
  const filteredPosRecordsForDate = useMemo(() => {
    return filterPosRecordsByDate(
      posRecords,
      analyticsFilterMode === "single" ? analyticsDate : undefined,
      analyticsFilterMode === "range" ? analyticsDateRange : undefined
    );
  }, [posRecords, analyticsDate, analyticsFilterMode, analyticsDateRange]);

  // Ensure total revenue calculation sums only genuine non-seeded orders
  const filteredAnalyticsSummary = useMemo(() => {
    if (getStoreAnalyticsSummary) {
      return getStoreAnalyticsSummary(
        analyticsFilterMode === "single" ? analyticsDate : undefined,
        analyticsFilterMode === "range" ? analyticsDateRange : undefined
      );
    }
    return generateStoreAnalyticsSummary(
      validRealOrders,
      posRecords,
      analyticsFilterMode === "single" ? analyticsDate : undefined,
      analyticsFilterMode === "range" ? analyticsDateRange : undefined
    );
  }, [getStoreAnalyticsSummary, validRealOrders, posRecords, analyticsDate, analyticsFilterMode, analyticsDateRange]);

  // Search & Filter controls for Kitchen & Orders
  const [orderStatusFilter, setOrderStatusFilter] = useState<OrderStatusFilter>("active");
  const [orderTypeFilter, setOrderTypeFilter] = useState<OrderTypeFilter>("all");
  const [orderSearchQuery, setOrderSearchQuery] = useState("");
  const [orderPhoneQuery, setOrderPhoneQuery] = useState("");
  const [orderSortBy, setOrderSortBy] = useState<OrderSortBy>("newest");
  const [ordersViewMode, setOrdersViewMode] = useState<"kanban" | "list">("kanban");

  // Dynamic live counts for status and order types
  const orderCounts = useMemo(() => {
    return {
      active: liveOrders.filter((o) => o.status !== "served").length,
      received: liveOrders.filter((o) => o.status === "received").length,
      toasting: liveOrders.filter((o) => o.status === "toasting").length,
      ready: liveOrders.filter((o) => o.status === "ready").length,
      served: liveOrders.filter((o) => o.status === "served").length,
      all: liveOrders.length,
      // Types
      allTypes: liveOrders.length,
      dineIn: liveOrders.filter((o) => o.orderType === "dine-in" || o.orderKind === "dine_in").length,
      takeaway: liveOrders.filter((o) => o.orderType === "takeaway" || o.orderKind === "takeaway").length,
      walkIn: liveOrders.filter((o) => o.orderKind === "walk_in" || o.orderSource === "walk_in").length,
      preOrder: liveOrders.filter((o) => o.orderKind === "pre_order" || Boolean(o.advancePaid) || Boolean(o.preOrderSlot)).length,
    };
  }, [liveOrders]);

  // Universal Portal Function & Button Search
  const [portalSearchQuery, setPortalSearchQuery] = useState("");
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const portalSearchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleGlobalClick = (e: MouseEvent) => {
      if (portalSearchRef.current && !portalSearchRef.current.contains(e.target as Node)) {
        setIsSearchFocused(false);
      }
    };
    document.addEventListener("mousedown", handleGlobalClick);
    return () => document.removeEventListener("mousedown", handleGlobalClick);
  }, []);

  interface PortalSearchEntry {
    id: string;
    title: string;
    tab: PortalTab;
    category: string;
    description: string;
    keywords: string[];
    badge?: string;
    badgeColor?: "emerald" | "amber" | "rose" | "blue" | "gold";
    actionLabel?: string;
    quickAction?: () => void;
  }

  const portalSearchDirectory = useMemo<PortalSearchEntry[]>(() => {
    const isPayAtCounter = financialSettings?.isPayAtCounterEnabled ?? false;
    const isResEnabled = websiteConfig?.isReservationEnabled ?? false;
    const isForceOpen = preBookingConfig?.isForceOpen ?? false;

    return [
      {
        id: "toggle-pay-at-counter",
        title: "Pay at Counter for Online Pre-Orders",
        tab: "discounts",
        category: "Payments & Financials",
        description: "Enable or disable cash on pickup for pre-orders. When disabled, customers must pay via Razorpay / UPI.",
        keywords: ["pay at counter", "cash", "counter", "payment", "cod", "enable pay at counter", "disable pay at counter", "razorpay"],
        badge: isPayAtCounter ? "Currently: ENABLED" : "Currently: DISABLED (Advance Required)",
        badgeColor: isPayAtCounter ? "emerald" : "amber",
        actionLabel: isPayAtCounter ? "Turn OFF Pay at Counter" : "Turn ON Pay at Counter",
        quickAction: () => {
          const next = !isPayAtCounter;
          const updated = { ...financialSettings, isPayAtCounterEnabled: next };
          onUpdateFinancialSettings?.(updated);
          setNoticeSentMessage(`✅ Pay at Counter for pre-orders is now ${next ? "ENABLED" : "DISABLED (Online payment required)"}`);
          setTimeout(() => setNoticeSentMessage(null), 3000);
        },
      },
      {
        id: "toggle-reservations",
        title: "Table Reservations Feature Status",
        tab: "reservations",
        category: "Table Booking",
        description: "Toggle customer table booking. When disabled, landing page shows an enlarged 'Order Now' button and Coming Soon badge.",
        keywords: ["reservation", "table", "disable reservation", "enable reservation", "book table", "dining", "seats"],
        badge: isResEnabled ? "Currently: ACTIVE" : "Currently: COMING SOON (Disabled)",
        badgeColor: isResEnabled ? "emerald" : "amber",
        actionLabel: isResEnabled ? "Disable Reservations" : "Enable Reservations",
        quickAction: () => {
          const next = !isResEnabled;
          const updated = { ...websiteConfig, isReservationEnabled: next };
          onUpdateWebsiteConfig?.(updated);
          setNoticeSentMessage(`✅ Table reservations are now ${next ? "ENABLED" : "DISABLED (Coming in future)"}`);
          setTimeout(() => setNoticeSentMessage(null), 3000);
        },
      },
      {
        id: "razorpay-keys",
        title: "Razorpay Payment Gateway API Keys",
        tab: "discounts",
        category: "Payments",
        description: "Configure Key ID and Key Secret for automated UPI dynamic QR, cards, and GPay/PhonePe payments.",
        keywords: ["razorpay", "gateway", "key id", "secret", "qr", "upi", "card", "payment"],
        badge: financialSettings?.razorpayKeyId ? "Key Configured" : "Test Keys Ready",
        badgeColor: financialSettings?.razorpayKeyId ? "emerald" : "blue",
      },
      {
        id: "walkin-order",
        title: "Walk-In Counter Order Booking",
        tab: "walkin",
        category: "Orders",
        description: "Take rapid counter takeaway and dine-in walk-in orders during peak kitchen rush hours.",
        keywords: ["walk in", "counter order", "pos", "take order", "cash register", "fast billing"],
        badge: "Fast Booking",
        badgeColor: "emerald",
      },
      {
        id: "live-queue",
        title: "Live Queue, Tokens & Caller Board",
        tab: "queue",
        category: "Kitchen & Tokens",
        description: "Track live tokens, mark ready, play audio chimes, and open TV Display caller screen.",
        keywords: ["queue", "tokens", "token caller", "tv display", "sound", "calling board", "ready orders"],
        badge: `${liveOrders.filter((o) => o.status !== "served").length} Active Orders`,
        badgeColor: "gold",
      },
      {
        id: "kitchen-toasting",
        title: "Kitchen Display System (KDS & Kanban)",
        tab: "orders",
        category: "Kitchen",
        description: "Live toasting timers, step progress (Plating, Toasting, Slicing), and KOT slip generator.",
        keywords: ["kitchen", "toasting", "kds", "kanban", "timer", "kot", "tickets", "chef"],
      },
      {
        id: "menu-inventory",
        title: "Menu Items Stock & 86 Item Toggle",
        tab: "inventory",
        category: "Menu Management",
        description: "Mark sandwiches as sold out (86'd), edit prices, adjust stock levels, and set allergens.",
        keywords: ["menu", "inventory", "stock", "sold out", "86", "price", "sandwich", "toastie", "drinks"],
        badge: `${menuItems.length} Total Items`,
        badgeColor: "gold",
      },
      {
        id: "add-new-item",
        title: "Add New Sourdough Item / Drink",
        tab: "new-item",
        category: "Menu Creation",
        description: "Create a new artisanal sandwich or beverage with photo, price, description, and dietary tags.",
        keywords: ["add item", "new sandwich", "new dish", "create item", "upload photo", "menu create"],
      },
      {
        id: "daily-ingredients",
        title: "Daily Ingredients & Vegetable Slicing Ledger",
        tab: "ingredients",
        category: "Kitchen Operations",
        description: "Track daily sourdough loaf count, French butter, gourmet cheeses, fresh produce, and trim waste.",
        keywords: ["ingredients", "raw materials", "loaves", "bread", "cheese", "vegetables", "procurement", "scrap"],
      },
      {
        id: "excel-pnl",
        title: "Excel Profit & Loss Statement Generator",
        tab: "ingredients",
        category: "Accounting & Reports",
        description: "Generate and download professional daily restaurant P&L spreadsheets in Excel / CSV format.",
        keywords: ["excel", "p&l", "profit and loss", "cogs", "export excel", "spreadsheet", "margins", "revenue"],
        badge: "Excel Export",
        badgeColor: "emerald",
      },
      {
        id: "prebooking-hours",
        title: "Pre-Booking Schedule & 24/7 Force Open",
        tab: "prebooking",
        category: "Pre-Orders",
        description: "Set daily pre-order operating hours (e.g. 11 AM – 3 PM) or turn ON 24/7 Force Pre-Booking override.",
        keywords: ["pre-booking", "operating hours", "force open", "24/7", "schedule", "slots", "order window"],
        badge: isForceOpen ? "Force Open (24/7)" : "Operating on Schedule",
        badgeColor: isForceOpen ? "emerald" : "blue",
        actionLabel: isForceOpen ? "Turn OFF Force Open" : "Turn ON Force Open (24/7)",
        quickAction: () => {
          if (!preBookingConfig) return;
          const next = !isForceOpen;
          const updated = { ...preBookingConfig, isForceOpen: next };
          onUpdatePreBookingConfig?.(updated);
          setNoticeSentMessage(`⚡ Force Pre-Booking is now ${next ? "ON (Open 24/7)" : "OFF (Scheduled Window)"}`);
          setTimeout(() => setNoticeSentMessage(null), 3000);
        },
      },
      {
        id: "coupons-discounts",
        title: "Promo Discount Coupons (PAWS10, etc.)",
        tab: "discounts",
        category: "Marketing",
        description: "Add, edit, or toggle promotional coupon codes, percentage discounts, and minimum order limits.",
        keywords: ["coupon", "discount", "promo", "voucher", "paws10", "nieafirst", "deals"],
        badge: `${coupons.filter((c) => c.isActive).length} Active Coupons`,
        badgeColor: "gold",
      },
      {
        id: "gst-packaging",
        title: "GST Rate %, Takeaway Packaging & COGS Margins",
        tab: "discounts",
        category: "Financials",
        description: "Configure GST rate (default 5%), takeaway kraft box packaging fees, and restaurant overheads.",
        keywords: ["gst", "tax", "packaging fee", "takeaway charge", "cogs", "margins", "overheads"],
      },
      {
        id: "whatsapp-alerts",
        title: "WhatsApp Automation & Alert Templates",
        tab: "whatsapp",
        category: "Customer Communication",
        description: "Automated WhatsApp notifications for received orders, kitchen readiness, and owner phone alerts.",
        keywords: ["whatsapp", "sms", "notifications", "alerts", "templates", "phone", "messaging"],
      },
      {
        id: "website-branding",
        title: "Website Copy, Hero Image & Announcement",
        tab: "website",
        category: "Storefront",
        description: "Customize hero background banner photo, store tagline, live announcement, address, and hours.",
        keywords: ["website", "hero image", "banner", "tagline", "announcement", "copy", "address", "instagram"],
      },
      {
        id: "floating-cat",
        title: "Floating Cat Companion Easter Egg",
        tab: "website",
        category: "Storefront",
        description: "Toggle the adorable interactive floating kitty mascot on the customer website.",
        keywords: ["floating cat", "cat", "mascot", "kitten", "easter egg", "animation"],
        badge: isFloatingCatEnabled ? "Cat: ON" : "Cat: OFF",
        badgeColor: isFloatingCatEnabled ? "emerald" : "amber",
        actionLabel: isFloatingCatEnabled ? "Disable Floating Cat" : "Enable Floating Cat",
        quickAction: () => {
          const next = !isFloatingCatEnabled;
          setIsFloatingCatEnabled?.(next);
          setNoticeSentMessage(`🐱 Floating Cat easter egg is now ${next ? "ENABLED" : "DISABLED"}`);
          setTimeout(() => setNoticeSentMessage(null), 3000);
        },
      },
      {
        id: "seating-capacity",
        title: "Seating Layout & Daily Sourdough Loaf Cap",
        tab: "seating",
        category: "Capacity",
        description: "Manage 50 daily sourdough sandwiches batch limit, remaining loaves count, and live table occupancy.",
        keywords: ["seating", "tables", "capacity", "loaf count", "sourdough batch", "loaf limit", "50 loaves"],
        badge: `${seating.availableSandwiches ?? 38}/${seating.totalSandwiches ?? 50} Loaves Left`,
        badgeColor: "gold",
      },
      {
        id: "sales-analytics",
        title: "Sales Analytics, Peak Hours & Order Ledger",
        tab: "analytics",
        category: "Analytics",
        description: "Comprehensive charts for sales velocity, hourly rush, menu item competition, and full audit logs.",
        keywords: ["analytics", "sales", "revenue", "peak hours", "ledger", "audit", "charts", "graphs"],
      },
      {
        id: "export-csv",
        title: "Export Orders & Sales Ledger (CSV)",
        tab: "analytics",
        category: "Reports & Export",
        description: "Download entire historical orders database and POS sales records as CSV for tax & accounting.",
        keywords: ["export csv", "download csv", "sales ledger", "orders report", "accounting export"],
        badge: "CSV Export",
        badgeColor: "emerald",
      },
      {
        id: "ai-copilot",
        title: "Owner AI Store & Kitchen Copilot",
        tab: "ai-assistant",
        category: "AI Tools",
        description: "Chat with AI to analyze store revenue, predict sourdough demand, and generate daily prep checklists.",
        keywords: ["ai", "assistant", "copilot", "chat", "insights", "demand prediction"],
        badge: "AI Powered",
        badgeColor: "gold",
      },
      {
        id: "loyalty-perks",
        title: "Loyalty Stamp Card & Free Toastie Perks",
        tab: "perks",
        category: "Customer Loyalty",
        description: "Manage the digital stamp card (Earn 5 stamps for a free sourdough toastie).",
        keywords: ["loyalty", "stamps", "perks", "rewards", "free toastie", "gamification"],
      },
    ];
  }, [financialSettings, websiteConfig, preBookingConfig, isFloatingCatEnabled, liveOrders, menuItems, seating, coupons, onUpdateFinancialSettings, onUpdateWebsiteConfig, onUpdatePreBookingConfig, setIsFloatingCatEnabled]);

  const filteredSearchItems = useMemo(() => {
    const q = portalSearchQuery.trim().toLowerCase();
    if (!q) return portalSearchDirectory.slice(0, 8); // Top featured suggestions when query empty
    return portalSearchDirectory.filter((item) => {
      if (item.title.toLowerCase().includes(q)) return true;
      if (item.description.toLowerCase().includes(q)) return true;
      if (item.category.toLowerCase().includes(q)) return true;
      if (item.keywords.some((k) => k.toLowerCase().includes(q))) return true;
      return false;
    });
  }, [portalSearchQuery, portalSearchDirectory]);

  // Filtered and sorted order list for staff
  const filteredOrders = useMemo(() => {
    return liveOrders
      .filter((order) => {
        // 1. Status Filter
        if (orderStatusFilter === "active" && order.status === "served") return false;
        if (orderStatusFilter === "received" && order.status !== "received") return false;
        if (orderStatusFilter === "toasting" && order.status !== "toasting") return false;
        if (orderStatusFilter === "ready" && order.status !== "ready") return false;
        if (orderStatusFilter === "served" && order.status !== "served") return false;

        // 2. Order Type Filter
        if (orderTypeFilter === "dine-in" && order.orderType !== "dine-in" && order.orderKind !== "dine_in") {
          return false;
        }
        if (orderTypeFilter === "takeaway" && order.orderType !== "takeaway" && order.orderKind !== "takeaway") {
          return false;
        }
        if (orderTypeFilter === "walk_in" && order.orderKind !== "walk_in" && order.orderSource !== "walk_in") {
          return false;
        }
        if (orderTypeFilter === "pre_order" && order.orderKind !== "pre_order" && !order.advancePaid && !order.preOrderSlot) {
          return false;
        }

        // 3. Phone Number Filter (specific match)
        if (orderPhoneQuery.trim()) {
          const rawQuery = orderPhoneQuery.trim().toLowerCase();
          const cleanPhoneFilter = rawQuery.replace(/\D/g, "");
          const orderPhoneClean = (order.customerPhone || "").replace(/\D/g, "");
          const orderPhoneRaw = (order.customerPhone || "").toLowerCase();

          const matchesClean = cleanPhoneFilter && orderPhoneClean.includes(cleanPhoneFilter);
          const matchesRaw = orderPhoneRaw.includes(rawQuery);
          if (!matchesClean && !matchesRaw) {
            return false;
          }
        }

        // 4. General Search Query (order #, token #, customer name, phone, item names, table #)
        if (orderSearchQuery.trim()) {
          const q = orderSearchQuery.toLowerCase().trim();
          const cleanDigits = q.replace(/\D/g, "");
          const matchNum = order.orderNumber.toLowerCase().includes(q);
          const matchToken = order.tokenNumber ? order.tokenNumber.toLowerCase().includes(q) : false;
          const matchName = order.customerName ? order.customerName.toLowerCase().includes(q) : false;
          const matchPhone = order.customerPhone ? (
            order.customerPhone.toLowerCase().includes(q) ||
            (cleanDigits.length >= 3 && order.customerPhone.replace(/\D/g, "").includes(cleanDigits))
          ) : false;
          const matchItem = order.items.some((it) => it.item.name.toLowerCase().includes(q));
          const matchTable = order.tableNumber ? order.tableNumber.toLowerCase().includes(q) : false;
          if (!matchNum && !matchToken && !matchName && !matchPhone && !matchItem && !matchTable) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (orderSortBy === "oldest") {
          return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        }
        if (orderSortBy === "urgency") {
          const timeLeftA = typeof a.estimatedMinutesLeft === "number" ? a.estimatedMinutesLeft : (a.status === "toasting" ? 4 : (a.status === "ready" ? 0 : 10));
          const timeLeftB = typeof b.estimatedMinutesLeft === "number" ? b.estimatedMinutesLeft : (b.status === "toasting" ? 4 : (b.status === "ready" ? 0 : 10));
          return timeLeftA - timeLeftB;
        }
        // Default "newest"
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      });
  }, [liveOrders, orderStatusFilter, orderTypeFilter, orderPhoneQuery, orderSearchQuery, orderSortBy]);

  // Progressive lazy-loading for heavy order list to eliminate initial render lag
  const INITIAL_ORDER_BATCH = 10;
  const [visibleOrderCount, setVisibleOrderCount] = useState(INITIAL_ORDER_BATCH);
  const orderListSentinelRef = useRef<HTMLDivElement>(null);

  // Reset batch size on filter or search changes so user sees the top results immediately
  useEffect(() => {
    setVisibleOrderCount(INITIAL_ORDER_BATCH);
  }, [orderStatusFilter, orderTypeFilter, orderSearchQuery, orderPhoneQuery, orderSortBy]);

  // Infinite scroll / lazy loading intersection observer
  useEffect(() => {
    if (visibleOrderCount >= filteredOrders.length) return;
    const sentinel = orderListSentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setVisibleOrderCount((prev) => Math.min(prev + 10, filteredOrders.length));
        }
      },
      { rootMargin: "300px" }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [visibleOrderCount, filteredOrders.length]);

  const displayedOrders = useMemo(() => {
    return filteredOrders.slice(0, visibleOrderCount);
  }, [filteredOrders, visibleOrderCount]);

  const hasActiveOrderFilters =
    orderStatusFilter !== "active" ||
    orderTypeFilter !== "all" ||
    orderSearchQuery.trim() !== "" ||
    orderPhoneQuery.trim() !== "" ||
    orderSortBy !== "newest";

  const handleResetOrderFilters = () => {
    setOrderStatusFilter("active");
    setOrderTypeFilter("all");
    setOrderSearchQuery("");
    setOrderPhoneQuery("");
    setOrderSortBy("newest");
  };

  const [statusFilter, setStatusFilter] = useState<
    "all" | "confirmed" | "seated" | "cancelled"
  >("all");

  const [noticeSentMessage, setNoticeSentMessage] = useState<string | null>(null);
  const [isAiDrawerOpen, setIsAiDrawerOpen] = useState(false);

  // Prevent background scroll when portal modal is open and restore safely on close
  useEffect(() => {
    if (isOpen) {
      const origOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = origOverflow === "hidden" ? "" : origOverflow;
      };
    }
  }, [isOpen]);

  // Portal Passcode Security State
  const [passcodeAttempt, setPasscodeAttempt] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(() => {
    try {
      return sessionStorage.getItem("niea_portal_unlocked") === "true";
    } catch {
      return false;
    }
  });
  const [passcodeError, setPasscodeError] = useState("");

  const activePasscode = (websiteConfig?.ownerPasscode || "1234").trim();

  const handleUnlockPortal = (e: React.FormEvent) => {
    e.preventDefault();
    if (
      passcodeAttempt.trim() === activePasscode ||
      (passcodeAttempt.trim() === "1234" && !websiteConfig?.ownerPasscode)
    ) {
      setIsUnlocked(true);
      setPasscodeError("");
      try {
        sessionStorage.setItem("niea_portal_unlocked", "true");
        localStorage.setItem("niea_portal_unlocked", "true");
        window.dispatchEvent(new CustomEvent("niea_portal_unlocked_status", { detail: { isUnlocked: true } }));
      } catch {
        // ignore
      }
    } else {
      setPasscodeError("Incorrect passcode. Please check and try again.");
    }
  };

  const handleLockPortal = () => {
    setIsUnlocked(false);
    setPasscodeAttempt("");
    try {
      sessionStorage.removeItem("niea_portal_unlocked");
      localStorage.removeItem("niea_portal_unlocked");
      window.dispatchEvent(new CustomEvent("niea_portal_unlocked_status", { detail: { isUnlocked: false } }));
    } catch {
      // ignore
    }
  };

  // Owner incoming order voice alert preference
  const [isVoiceAlertEnabled, setIsVoiceAlertEnabled] = useState(() => {
    try {
      return localStorage.getItem("niea_owner_voice_alerts_enabled") !== "false";
    } catch {
      return true;
    }
  });

  const handleToggleVoiceAlerts = () => {
    setIsVoiceAlertEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("niea_owner_voice_alerts_enabled", next ? "true" : "false");
      setNoticeSentMessage(`🔊 Owner incoming order voice alerts ${next ? "ENABLED" : "MUTED"}`);
      setTimeout(() => setNoticeSentMessage(null), 3000);
      return next;
    });
  };

  // Highlight Editing Form State
  const [highlightMode, setHighlightMode] = useState<"auto" | "manual">(
    cafeHighlight?.mode || "auto"
  );
  const [hlTitle, setHlTitle] = useState(cafeHighlight?.title || "");
  const [hlBadge, setHlBadge] = useState(cafeHighlight?.badge || "Chef's Feature");
  const [hlDesc, setHlDesc] = useState(cafeHighlight?.description || "");
  const [hlPrice, setHlPrice] = useState(cafeHighlight?.price?.toString() || "380");
  const [hlImage, setHlImage] = useState(cafeHighlight?.imageUrl || "");
  const [hlItemId, setHlItemId] = useState(
    cafeHighlight?.menuItemId || (menuItems[0] ? menuItems[0].id : "")
  );
  const [savedBanner, setSavedBanner] = useState(false);

  // New Item Form State
  const [newName, setNewName] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newPrice, setNewPrice] = useState("350");
  const [newCategory, setNewCategory] = useState<MenuCategory>("seasonal");
  const [newIsVeg, setNewIsVeg] = useState(true);
  const [newStock, setNewStock] = useState("10");
  const [newImageUrl, setNewImageUrl] = useState(
    "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=700&auto=format&fit=crop&q=80"
  );

  // Add-ons / Extras State for New Item
  const [newItemAddons, setNewItemAddons] = useState<CustomizationOption[]>([
    { name: "Cheddar / Mozzarella (Veg)", price: 99 },
    { name: "Bacon (Non-Veg)", price: 150 },
    { name: "Ham (Non-Veg) (Choice of Pork Ham or Chicken Ham)", price: 120 },
    { name: "Olives / Pickles / Gherkins (Veg)", price: 60 },
  ]);
  const [addonInputName, setAddonInputName] = useState("");
  const [addonInputPrice, setAddonInputPrice] = useState("50");

  const handleAddNewItemAddon = () => {
    const clean = addonInputName.trim();
    if (!clean) return;
    const priceNum = Math.max(0, Number(addonInputPrice) || 0);
    if (newItemAddons.some((a) => a.name.toLowerCase() === clean.toLowerCase())) {
      setNoticeSentMessage(`Add-on "${clean}" is already added!`);
      return;
    }
    setNewItemAddons((prev) => [...prev, { name: clean, price: priceNum }]);
    setAddonInputName("");
    setAddonInputPrice("50");
  };

  const handleRemoveNewItemAddon = (index: number) => {
    setNewItemAddons((prev) => prev.filter((_, i) => i !== index));
  };

  const handleAddPresetAddon = (name: string, price: number) => {
    if (newItemAddons.some((a) => a.name.toLowerCase() === name.toLowerCase())) {
      return;
    }
    setNewItemAddons((prev) => [...prev, { name, price }]);
  };

  const handleAddAllPresetAddons = () => {
    const presets = [
      { name: "Cheddar / Mozzarella (Veg)", price: 99 },
      { name: "Bacon (Non-Veg)", price: 150 },
      { name: "Ham (Non-Veg) (Choice of Pork Ham or Chicken Ham)", price: 120 },
      { name: "Olives / Pickles / Gherkins (Veg)", price: 60 },
    ];
    setNewItemAddons((prev) => {
      const combined = [...prev];
      presets.forEach((p) => {
        if (!combined.some((c) => c.name.toLowerCase() === p.name.toLowerCase())) {
          combined.push(p);
        }
      });
      return combined;
    });
  };

  // Edit Existing Item State
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);

  const handleCreateItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;

    const newItem: MenuItem = {
      id: `custom-${Date.now()}`,
      name: newName.trim(),
      description: newDesc.trim() || "Handcrafted fresh at NiEA'S Sandwich Bar.",
      price: Number(newPrice) || 300,
      category: newCategory,
      isVeg: newIsVeg,
      tags: ["House Special"],
      imageUrl:
        newImageUrl.trim() ||
        "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=700&auto=format&fit=crop&q=80",
      stockLeft: Number(newStock) || 10,
      initialStock: Number(newStock) || 10,
      restockSchedule: "Fresh batch daily",
      breadChoices: ["Artisan Sourdough", "French Brioche", "Rosemary Focaccia"],
      customizations: newItemAddons.length > 0 ? newItemAddons : undefined,
    };

    onAddMenuItem(newItem);
    setActiveTab("inventory");
    setNewName("");
    setNewDesc("");
    setNewImageUrl(
      "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=700&auto=format&fit=crop&q=80"
    );
    // Reset to house standard extras for next item
    setNewItemAddons([
      { name: "Cheddar / Mozzarella (Veg)", price: 99 },
      { name: "Bacon (Non-Veg)", price: 150 },
      { name: "Ham (Non-Veg) (Choice of Pork Ham or Chicken Ham)", price: 120 },
      { name: "Olives / Pickles / Gherkins (Veg)", price: 60 },
    ]);
    setNoticeSentMessage(`✅ Published "${newItem.name}" to menu with ${newItemAddons.length} customisation extras!`);
  };

  const handleSaveEditedItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem) return;
    onUpdateMenuItem(editingItem);
    setEditingItem(null);
  };

  const handleSaveHighlight = (e: React.FormEvent) => {
    e.preventDefault();
    if (!onUpdateCafeHighlight) return;

    const updated: CafeHighlight = {
      id: cafeHighlight?.id || `hl-${Date.now()}`,
      menuItemId: hlItemId,
      title: hlTitle.trim() || "Specialty Sourdough Melt",
      badge: hlBadge.trim() || "Chef's Feature",
      description: hlDesc.trim(),
      price: Number(hlPrice) || 350,
      imageUrl: hlImage.trim(),
      mode: highlightMode,
      autoSource: "today_top_orders",
      lastUpdated: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    onUpdateCafeHighlight(updated);
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2500);
  };

  const handleSyncTopSellerNow = () => {
    if (!onUpdateCafeHighlight) return;
    const computed = generateAutomatedHighlight(menuItems, liveOrders, "today_top_orders");
    onUpdateCafeHighlight(computed);
    setHlTitle(computed.title);
    setHlBadge(computed.badge);
    setHlDesc(computed.description);
    setHlPrice(computed.price.toString());
    setHlImage(computed.imageUrl);
    setHlItemId(computed.menuItemId);
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2500);
  };

  const sendWhatsAppNotice = (res: ReservationRecord) => {
    const text = encodeURIComponent(
      `Hello ${res.customerName}! Your table reservation at NiEA'S Sandwich Bar (${res.date} • ${res.timeSlot}) for ${res.guestCount} guests is confirmed.\n\nBooking Ref: ${res.bookingRef}\nDeposit: ₹${res.advanceDeposit || 150} (credited to your bill).\n\nSee you soon!`
    );
    const cleanPhone = res.customerPhone.replace(/\D/g, "");
    window.open(`https://wa.me/${cleanPhone}?text=${text}`, "_blank");
  };

  const filteredReservations = reservations.filter((r) => {
    if (statusFilter === "all") return true;
    return r.status === statusFilter;
  });

  const totalGuests = reservations
    .filter((r) => r.status !== "cancelled" && r.status !== "no-show")
    .reduce((sum, r) => sum + r.guestCount, 0);

  const confirmedCount = reservations.filter((r) => r.status === "confirmed").length;
  const seatedCount = reservations.filter((r) => r.status === "seated").length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in overflow-hidden">
      <div className="w-full max-w-4xl bg-[#374C44] rounded-3xl border border-[#F5E086]/30 shadow-2xl overflow-hidden flex flex-col h-[92vh] max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-[#2B3D36] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center text-[#F5E086]">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-niea font-bold text-lg text-[#F5E086]">
                  Cafe Management
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-[#F5E086] text-[#24332D] text-[10px] font-bold">
                  Staff
                </span>
              </div>
              <p className="text-xs text-[#FBF9F2]/70">
                Easy controls for table reservations, menu stock, and home highlight.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Takeaway Mic Master Trigger */}
            {isUnlocked && broadcastTakeawayAnnouncement && (
              <button
                type="button"
                onClick={() => {
                  broadcastTakeawayAnnouncement({
                    message: "Takeaway order is packed and ready for pickup at the counter!",
                  });
                  setNoticeSentMessage("📢 Takeaway voice & mobile notification dispatched!");
                  setTimeout(() => setNoticeSentMessage(null), 3500);
                }}
                className="px-2.5 sm:px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-black font-black text-xs transition flex items-center gap-1.5 shadow-md active:scale-95 cursor-pointer"
                title="Broadcast voice announcement & push notification for takeaway to all customer devices"
              >
                <Mic className="w-3.5 h-3.5 text-black animate-pulse" />
                <span className="hidden sm:inline">Takeaway Mic</span>
              </button>
            )}

            {/* Voice Notification Alert Sound Toggle */}
            {isUnlocked && (
              <button
                type="button"
                onClick={handleToggleVoiceAlerts}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border ${
                  isVoiceAlertEnabled
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40 hover:bg-emerald-500/30"
                    : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10"
                }`}
                title={isVoiceAlertEnabled ? "Voice Alerts are ON: Speak announcements when orders arrive" : "Voice Alerts are MUTED"}
              >
                {isVoiceAlertEnabled ? (
                  <>
                    <Volume2 className="w-3.5 h-3.5 text-emerald-300" />
                    <span className="hidden sm:inline">Voice: ON</span>
                  </>
                ) : (
                  <>
                    <VolumeX className="w-3.5 h-3.5 text-white/50" />
                    <span className="hidden sm:inline">Voice: OFF</span>
                  </>
                )}
              </button>
            )}

            {/* Liquid Glass UI Mode Toggle */}
            {isUnlocked && onUpdateWebsiteConfig && (
              <button
                type="button"
                onClick={() => {
                  const current = websiteConfig?.isLiquidGlassEnabled !== false;
                  const next = !current;
                  const updated = {
                    ...websiteConfig,
                    isLiquidGlassEnabled: next,
                  };
                  onUpdateWebsiteConfig(updated);
                  if (typeof window !== "undefined") {
                    document.documentElement.setAttribute("data-liquid-glass", next ? "true" : "false");
                    localStorage.setItem("niea_liquid_glass_enabled", next ? "true" : "false");
                  }
                  setNoticeSentMessage(
                    next
                      ? "✨ Apple Liquid Glass UI enabled (Refraction & jiggly physics active)"
                      : "🌿 Classic Solid UI enabled (Liquid glass disabled)"
                  );
                  setTimeout(() => setNoticeSentMessage(null), 3500);
                }}
                className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 border cursor-pointer ${
                  websiteConfig?.isLiquidGlassEnabled !== false
                    ? "bg-amber-400/20 text-[#F5E086] border-[#F5E086]/50 hover:bg-amber-400/30 shadow-xs"
                    : "bg-white/5 text-white/50 border-white/10 hover:bg-white/10"
                }`}
                title={
                  websiteConfig?.isLiquidGlassEnabled !== false
                    ? "Liquid Glass UI: ON (Apple-style fluid refraction & spring physics)"
                    : "Liquid Glass UI: OFF (Clean standard solid UI)"
                }
              >
                <Sparkles className="w-3.5 h-3.5 text-[#F5E086]" />
                <span className="hidden sm:inline">
                  {websiteConfig?.isLiquidGlassEnabled !== false ? "Liquid Glass: ON" : "Liquid Glass: OFF"}
                </span>
              </button>
            )}

            {/* Lock Portal Button */}
            {isUnlocked && (
              <button
                type="button"
                onClick={handleLockPortal}
                className="px-2.5 py-1.5 rounded-xl bg-white/5 hover:bg-rose-500/20 hover:text-rose-300 border border-white/10 text-white/70 text-xs font-semibold transition flex items-center gap-1"
                title="Lock Owner Portal"
              >
                <Lock className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Lock</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition"
              title="Close Portal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Passcode Security Gate if Locked */}
        {!isUnlocked ? (
          <div className="p-8 sm:p-12 flex flex-col items-center justify-center text-center space-y-6 my-auto">
            <div className="w-16 h-16 rounded-full bg-[#24332D] border border-[#F5E086]/30 flex items-center justify-center text-[#F5E086]">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-1.5 max-w-sm">
              <h4 className="font-niea font-bold text-xl text-white">
                Staff & Owner Access
              </h4>
              <p className="text-xs text-[#FBF9F2]/70 leading-relaxed">
                Enter your staff portal code to manage live table reservations, menu inventory, and highlighted specials.
              </p>
            </div>

            <form onSubmit={handleUnlockPortal} className="w-full max-w-xs space-y-4">
              <div className="space-y-1.5 text-left">
                <label className="text-[11px] font-bold text-[#F5E086] uppercase tracking-wider block">
                  Enter Security Passcode
                </label>
                <div className="relative">
                  <input
                    type="password"
                    maxLength={10}
                    autoFocus
                    value={passcodeAttempt}
                    onChange={(e) => {
                      setPasscodeAttempt(e.target.value);
                      setPasscodeError("");
                    }}
                    placeholder="••••"
                    className="w-full px-4 py-2.5 rounded-2xl bg-[#24332D] border border-white/15 text-white text-center text-xl tracking-widest font-mono focus:outline-none focus:border-[#F5E086]"
                  />
                  <KeyRound className="w-4 h-4 text-white/40 absolute right-3 top-3.5" />
                </div>
                {passcodeError && (
                  <p className="text-xs text-rose-400 font-semibold flex items-center gap-1 mt-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    <span>{passcodeError}</span>
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 py-2.5 rounded-full bg-[#2B3D36] text-white font-semibold text-xs hover:bg-[#32473F] transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-full bg-[#F5E086] hover:bg-[#F8E79B] text-[#24332D] font-bold text-xs transition shadow-md flex items-center justify-center gap-1.5"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Unlock Portal</span>
                </button>
              </div>
            </form>
          </div>
        ) : (
          <>
            {/* LAYER 0: Universal Owner Function & Button Search Bar */}
            <div
              ref={portalSearchRef}
              className="px-3 sm:px-5 py-2.5 bg-[#23352E] border-b border-white/10 relative z-40 w-full"
            >
              <div className="relative w-full">
                <div className="relative flex items-center">
                  <Search className="w-4 h-4 text-[#F5E086] absolute left-3.5 pointer-events-none" />
                  <input
                    type="text"
                    value={portalSearchQuery}
                    onFocus={() => setIsSearchFocused(true)}
                    onChange={(e) => {
                      setPortalSearchQuery(e.target.value);
                      setIsSearchFocused(true);
                    }}
                    placeholder="🔍 Search any setting, button, function, or report (e.g. 'Pay at Counter', 'Disable Reservations', 'GST', 'CSV', 'Loaf Count')..."
                    className="w-full pl-10 pr-24 py-2 rounded-xl bg-[#1A2520] border border-[#F5E086]/30 text-white placeholder-white/40 text-xs focus:outline-none focus:border-[#F5E086] focus:ring-1 focus:ring-[#F5E086]/50 transition shadow-inner"
                  />
                  {portalSearchQuery ? (
                    <button
                      type="button"
                      onClick={() => {
                        setPortalSearchQuery("");
                        setIsSearchFocused(false);
                      }}
                      className="absolute right-3 p-1 rounded-md text-white/50 hover:text-white hover:bg-white/10 transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <span className="absolute right-3 px-1.5 py-0.5 rounded text-[10px] font-mono text-white/40 bg-white/5 border border-white/10 pointer-events-none hidden sm:inline-block">
                      Quick Finder
                    </span>
                  )}
                </div>

                {/* Suggestions Dropdown */}
                {isSearchFocused && (
                  <div className="absolute left-0 right-0 top-full mt-2 bg-[#1A2520] border-2 border-[#F5E086]/60 rounded-2xl shadow-2xl p-2 max-h-80 overflow-y-auto z-50 animate-in fade-in zoom-in-95 space-y-1">
                    <div className="px-2 py-1 flex items-center justify-between text-[11px] text-[#F5E086] font-bold border-b border-white/10 pb-1.5">
                      <span className="flex items-center gap-1.5">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>
                          {portalSearchQuery
                            ? `Matching Functions (${filteredSearchItems.length})`
                            : "Recommended Functions & Controls"}
                        </span>
                      </span>
                      <span className="text-[10px] text-white/50 font-normal">
                        Click any item to jump instantly
                      </span>
                    </div>

                    {filteredSearchItems.length === 0 ? (
                      <div className="p-4 text-center text-xs text-white/60 space-y-1">
                        <p>No functions found matching "{portalSearchQuery}".</p>
                        <p className="text-[10px] text-white/40">
                          Try searching for: <strong className="text-[#F5E086]">Pay at Counter</strong>, <strong className="text-[#F5E086]">Reservation</strong>, <strong className="text-[#F5E086]">Razorpay</strong>, <strong className="text-[#F5E086]">GST</strong>, or <strong className="text-[#F5E086]">Loaf Count</strong>.
                        </p>
                      </div>
                    ) : (
                      filteredSearchItems.map((item) => (
                        <div
                          key={item.id}
                          className="p-2.5 rounded-xl hover:bg-[#2B3D36] transition flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border border-transparent hover:border-white/10 group cursor-pointer"
                          onClick={() => {
                            setActiveTab(item.tab);
                            setIsSearchFocused(false);
                            setPortalSearchQuery("");
                            setNoticeSentMessage(`📍 Switched to ${item.title}`);
                            setTimeout(() => setNoticeSentMessage(null), 2500);
                          }}
                        >
                          <div className="space-y-0.5 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-1.5">
                              <span className="font-bold text-xs text-[#F5E086] group-hover:text-white transition">
                                {item.title}
                              </span>
                              <span className="px-1.5 py-0.2 rounded text-[9px] font-bold uppercase bg-white/10 text-white/70">
                                {item.category}
                              </span>
                              {item.badge && (
                                <span
                                  className={`px-1.5 py-0.2 rounded text-[9px] font-black uppercase ${
                                    item.badgeColor === "emerald"
                                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                                      : item.badgeColor === "amber"
                                      ? "bg-amber-500/20 text-amber-300 border border-amber-400/30"
                                      : item.badgeColor === "gold"
                                      ? "bg-[#F5E086]/20 text-[#F5E086] border border-[#F5E086]/30"
                                      : "bg-blue-500/20 text-blue-300 border border-blue-400/30"
                                  }`}
                                >
                                  {item.badge}
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-white/60 line-clamp-1">
                              {item.description}
                            </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                            {item.quickAction && item.actionLabel && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  item.quickAction?.();
                                }}
                                className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-[#F5E086] text-[#24332D] hover:bg-[#F8E79B] transition shadow-xs"
                              >
                                {item.actionLabel}
                              </button>
                            )}
                            <button
                              type="button"
                              className="px-2.5 py-1 rounded-lg text-[10px] font-bold bg-white/10 hover:bg-white/20 text-white transition flex items-center gap-1"
                            >
                              <span>Open</span>
                              <span>→</span>
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* LAYER 1: 100% Dedicated Full-Width Tabs Navbar */}
            <div className="px-3 sm:px-5 pt-2.5 pb-2 border-b border-white/10 bg-[#2B3D36] w-full">
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar scroll-smooth w-full py-0.5">
                {/* 1. Walk-In Order Booking - Top Priority for Rush Hours */}
                <button
                  onClick={() => setActiveTab("walkin")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-sm ${
                    activeTab === "walkin"
                      ? "bg-[#F5E086] text-[#24332D]"
                      : "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-400/40"
                  }`}
                  title="Take Walk-In counter orders during rush"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Walk-In Booking</span>
                </button>

                {/* 2. Live Queue & Tokens */}
                <button
                  onClick={() => setActiveTab("queue")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-sm ${
                    activeTab === "queue"
                      ? "bg-[#F5E086] text-[#24332D]"
                      : "bg-white/5 text-white/80 hover:bg-white/10"
                  }`}
                >
                  <Clock className="w-3.5 h-3.5 text-amber-300" />
                  <span>Queue & Tokens</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#24332D] text-[#F5E086] font-black">
                    {liveOrders.filter((o) => o.status !== "served").length}
                  </span>
                </button>

                {/* 3. Kitchen & Toasting (KDS with built-in Kanban & List Switcher) */}
                <button
                  onClick={() => setActiveTab("orders")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-sm ${
                    activeTab === "orders"
                      ? "bg-[#F5E086] text-[#24332D]"
                      : "bg-white/5 text-white/80 hover:bg-white/10"
                  }`}
                >
                  <ChefHat className="w-3.5 h-3.5" />
                  <span>Kitchen & Toasting</span>
                </button>

                {/* 4. Menu & Stock (Quick 86 / Restock) */}
                <button
                  onClick={() => setActiveTab("inventory")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                    activeTab === "inventory"
                      ? "bg-[#F5E086] text-[#24332D]"
                      : "bg-white/5 text-white/80 hover:bg-white/10"
                  }`}
                >
                  <PackageCheck className="w-3.5 h-3.5" />
                  <span>Menu & Stock ({menuItems.length})</span>
                </button>

                {/* 5. Reservations */}
                <button
                  onClick={() => setActiveTab("reservations")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                    activeTab === "reservations"
                      ? "bg-[#F5E086] text-[#24332D]"
                      : "bg-white/5 text-white/80 hover:bg-white/10"
                  }`}
                >
                  <CalendarCheck className="w-3.5 h-3.5" />
                  <span>Reservations</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#24332D] text-[#F5E086] font-black">
                    {reservations.length}
                  </span>
                </button>

                {/* 6. Seating */}
                <button
                  onClick={() => setActiveTab("seating")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                    activeTab === "seating"
                      ? "bg-[#F5E086] text-[#24332D]"
                      : "bg-white/5 text-white/80 hover:bg-white/10"
                  }`}
                >
                  <Users className="w-3.5 h-3.5" />
                  <span>Seating ({seating.availableSeats}/{seating.totalSeats})</span>
                </button>

                {/* Daily Ingredients & Procurement (Raw Materials, Breads, Veggies & Excel P&L) */}
                <button
                  onClick={() => setActiveTab("ingredients")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-sm ${
                    activeTab === "ingredients"
                      ? "bg-[#F5E086] text-[#24332D]"
                      : "bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30 border border-emerald-400/40"
                  }`}
                  title="Daily breads, veggies procurement & professional Excel P&L generator"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5" />
                  <span>Daily Ingredients & Excel P&L</span>
                </button>

                {/* 7. NiEA's Analytics & Peak Rush */}
                <button
                  onClick={() => setActiveTab("analytics")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-sm ${
                    activeTab === "analytics"
                      ? "bg-[#F5E086] text-[#24332D]"
                      : "bg-white/5 text-white/80 hover:bg-white/10"
                  }`}
                >
                  <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>NiEA's Analytics</span>
                </button>

                {/* 8. Discounts, Coupons & GST Controls */}
                <button
                  onClick={() => setActiveTab("discounts")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-sm ${
                    activeTab === "discounts"
                      ? "bg-[#F5E086] text-[#24332D]"
                      : "bg-white/5 text-white/80 hover:bg-white/10"
                  }`}
                >
                  <Percent className="w-3.5 h-3.5 text-amber-300" />
                  <span>Discounts & GST %</span>
                  <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-[#24332D] text-[#F5E086] font-black">
                    {coupons.length}
                  </span>
                </button>

                {/* Perks & Loyalty Program Configuration */}
                <button
                  onClick={() => setActiveTab("perks")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-sm ${
                    activeTab === "perks"
                      ? "bg-[#F5E086] text-[#24332D]"
                      : "bg-white/5 text-white/80 hover:bg-white/10"
                  }`}
                  title="Paws & Perks Club rewards toggle and configuration"
                >
                  <Award className="w-3.5 h-3.5 text-amber-300" />
                  <span>Perks & Loyalty</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${loyaltyConfig?.isEnabled !== false ? "bg-emerald-400" : "bg-amber-400"}`} />
                </button>

                {/* 9. Website Background, Copy & Footer Details */}
                <button
                  onClick={() => setActiveTab("website")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-sm ${
                    activeTab === "website"
                      ? "bg-[#F5E086] text-[#24332D]"
                      : "bg-white/5 text-white/80 hover:bg-white/10"
                  }`}
                >
                  <Store className="w-3.5 h-3.5 text-sky-300" />
                  <span>Website Background & Copy</span>
                </button>

                {/* 10. Automated WhatsApp Alerts */}
                <button
                  onClick={() => setActiveTab("whatsapp")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-sm ${
                    activeTab === "whatsapp"
                      ? "bg-[#F5E086] text-[#24332D]"
                      : "bg-white/5 text-white/80 hover:bg-white/10"
                  }`}
                >
                  <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                  <span>WhatsApp Alerts</span>
                </button>

                {/* 11. Pre-Booking Window */}
                <button
                  onClick={() => setActiveTab("prebooking")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 shadow-sm ${
                    activeTab === "prebooking"
                      ? "bg-[#F5E086] text-[#24332D]"
                      : "bg-white/5 text-white/80 hover:bg-white/10"
                  }`}
                >
                  <Sliders className="w-3.5 h-3.5 text-sky-400" />
                  <span>Pre-Booking Window</span>
                </button>

                {/* 12. Cafe Highlight */}
                <button
                  onClick={() => setActiveTab("highlights")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                    activeTab === "highlights"
                      ? "bg-[#F5E086] text-[#24332D]"
                      : "bg-white/5 text-white/80 hover:bg-white/10"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Cafe Highlight</span>
                </button>

                {/* 13. Add Item */}
                <button
                  onClick={() => setActiveTab("new-item")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                    activeTab === "new-item"
                      ? "bg-[#F5E086] text-[#24332D]"
                      : "bg-white/5 text-white/80 hover:bg-white/10"
                  }`}
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Item</span>
                </button>
              </div>
            </div>

            {/* LAYER 2: Below Layer Dedicated Utility & Controls Toolbar */}
            <div className="px-3 sm:px-5 py-2 border-b border-white/10 bg-[#202E28] flex flex-wrap items-center justify-between gap-2.5 text-xs shadow-inner">
              {/* Left Group: Wi-Fi status, Mascot Toggle, Pre-booking live status */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Connection status indicator */}
                {isOnline ? (
                  <span
                    className="px-2.5 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 text-[11px] font-bold flex items-center gap-1.5"
                    title="Cafe Wi-Fi connected"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Online</span>
                  </span>
                ) : (
                  <span
                    className="px-2.5 py-1 rounded-xl bg-amber-500/20 border border-amber-400/50 text-amber-300 text-[11px] font-bold flex items-center gap-1.5 animate-pulse"
                    title="Cafe Wi-Fi disconnected. KDS buffer active."
                  >
                    <WifiOff className="w-3 h-3 text-amber-400" />
                    <span>Offline Buffer Active</span>
                  </span>
                )}

                {/* Mascot Floating Cat Enable/Disable Button */}
                {setIsFloatingCatEnabled && (
                  <button
                    type="button"
                    onClick={() => {
                      const next = !isFloatingCatEnabled;
                      setIsFloatingCatEnabled(next);
                      setNoticeSentMessage(`Floating cat mascot ${next ? "enabled" : "disabled"}`);
                      setTimeout(() => setNoticeSentMessage(null), 2500);
                    }}
                    className={`px-2.5 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 border shadow-xs ${
                      isFloatingCatEnabled
                        ? "bg-amber-400/20 text-amber-300 border-amber-400/40 hover:bg-amber-400/30"
                        : "bg-white/5 text-white/50 border-white/10 hover:text-white"
                    }`}
                    title="Enable or disable floating tuxedo mascot on website. Clicking cat opens menu."
                  >
                    <span>🐱 Mascot:</span>
                    <span className={isFloatingCatEnabled ? "text-[#F5E086] font-black" : "text-white/40"}>
                      {isFloatingCatEnabled ? "ON (Menu Opener)" : "OFF"}
                    </span>
                  </button>
                )}

                {/* Pre-Booking Window Live Indicator Pill */}
                {(() => {
                  const pbStatus = checkPreBookingWindow(preBookingConfig);
                  return (
                    <span
                      className={`px-2.5 py-1 rounded-xl text-[10px] font-bold border flex items-center gap-1.5 ${
                        pbStatus.isOpen
                          ? "bg-emerald-500/15 text-emerald-300 border-emerald-400/30"
                          : "bg-amber-500/15 text-amber-300 border-amber-400/30"
                      }`}
                      title={pbStatus.isOpen ? `Pre-orders strictly 11 AM - 3 PM` : pbStatus.closedReason}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${pbStatus.isOpen ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                      <span>{pbStatus.isOpen ? "Pre-Booking: Open (11 AM – 3 PM)" : "Pre-Booking: Closed"}</span>
                    </span>
                  );
                })()}
              </div>

              {/* Right Group: NiEA Assistant, AI Chat drawer, Counter TV, Install, Lock */}
              <div className="flex items-center gap-2 shrink-0 ml-auto">
                {/* Dedicated NiEA Assistant Button & Floating Toggle */}
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setActiveTab("ai-assistant")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 shadow-sm cursor-pointer ${
                      activeTab === "ai-assistant"
                        ? "bg-gradient-to-r from-amber-400 to-[#F5E086] text-[#24332D] shadow-md ring-2 ring-amber-400/50"
                        : "bg-amber-400/20 text-amber-300 hover:bg-amber-400/30 border border-amber-400/40"
                    }`}
                    title="Open NiEA Assistant"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                    <span>NiEA Assistant</span>
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsAiDrawerOpen(!isAiDrawerOpen)}
                    className={`p-1.5 rounded-xl text-xs transition flex items-center justify-center shrink-0 border ${
                      isAiDrawerOpen
                        ? "bg-amber-400 text-[#24332D] border-amber-400"
                        : "bg-white/5 hover:bg-white/10 text-white/70 border-white/10 hover:text-white"
                    }`}
                    title={isAiDrawerOpen ? "Close Floating AI Chat" : "Open Floating AI Chat"}
                  >
                    <MessageSquare className="w-3.5 h-3.5" />
                  </button>
                </div>

                {isInstallable && (
                  <button
                    type="button"
                    onClick={installApp}
                    className="px-2 py-1 rounded-xl bg-[#F5E086] hover:bg-[#fae89f] text-[#24332D] text-[10px] font-bold transition flex items-center gap-1 shadow-sm"
                    title="Install Staff Portal & KDS as App"
                  >
                    <Download className="w-3 h-3" />
                    <span className="hidden md:inline">Install App</span>
                  </button>
                )}

                {onOpenLiveCallingBoard && (
                  <button
                    type="button"
                    onClick={() => onOpenLiveCallingBoard()}
                    className="px-2.5 py-1 rounded-xl text-[11px] font-bold transition flex items-center gap-1.5 shrink-0 bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 hover:bg-emerald-500/30 shadow-xs"
                    title="Open Live Token Calling Screen for Counter / TV Display"
                  >
                    <Tv className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Counter TV</span>
                  </button>
                )}

                {/* Lock button on right side of toolbar */}
                <button
                  onClick={handleLockPortal}
                  className="px-2.5 py-1 rounded-xl text-[11px] font-semibold text-white/70 hover:text-rose-300 hover:bg-rose-500/10 transition flex items-center gap-1 shrink-0 border border-white/10"
                  title="Lock Portal"
                >
                  <Lock className="w-3 h-3" />
                  <span>Lock</span>
                </button>
              </div>
            </div>

        {/* Content Area */}
        <div className={`p-2.5 sm:p-4 flex-1 min-h-0 flex flex-col ${activeTab === "ai-assistant" ? "overflow-hidden" : "overflow-y-auto overscroll-contain touch-pan-y scroll-smooth space-y-4 pb-12"}`}>
          {/* Global Offline Active Alert Banner */}
          {!isOnline && (
            <div className="p-3 rounded-2xl bg-amber-950/70 border border-amber-400/50 text-amber-200 text-xs flex items-center justify-between shadow-lg animate-in fade-in">
              <div className="flex items-center gap-2.5">
                <WifiOff className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                <div>
                  <span className="font-bold text-amber-300">Staff Portal Offline Buffer Active — </span>
                  <span className="text-amber-100/90">Wi-Fi is disconnected. Ticket queue, KDS status, KOT generation, and inventory checks are safely stored in browser cache.</span>
                </div>
              </div>
            </div>
          )}

          {justReconnected && (
            <div className="p-3 rounded-2xl bg-emerald-950/70 border border-emerald-400 text-emerald-300 text-xs font-bold flex items-center gap-2 shadow-lg animate-in fade-in">
              <Wifi className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Cafe Wi-Fi Restored — Staff Portal & Kitchen Display Board synchronized!</span>
            </div>
          )}
          {/* Notification banner */}
          {noticeSentMessage && (
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{noticeSentMessage}</span>
            </div>
          )}

          {savedBanner && (
            <div className="p-2.5 rounded-xl bg-emerald-500/20 border border-emerald-400 text-emerald-300 text-xs flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Cafe Highlight updated successfully!</span>
            </div>
          )}

          {/* TAB 1: QUEUE MANAGEMENT & TOKENS */}
          {activeTab === "queue" && (
            <QueueManagementTab
              orders={liveOrders}
              onUpdateStatus={(orderId, status) => {
                if (onUpdateOrderStatus) onUpdateOrderStatus(orderId, status);
              }}
              onUpdateWaitTime={(orderId, minutes) => {
                if (onUpdateOrderTimeLeft) onUpdateOrderTimeLeft(orderId, minutes);
              }}
              onOpenKot={(order) => {
                if (onOpenKot) onOpenKot(order);
              }}
              onOpenLiveCallingBoard={() => {
                if (onOpenLiveCallingBoard) onOpenLiveCallingBoard();
              }}
              onUpdateOrderStep={onUpdateOrderStep}
            />
          )}

          {/* TAB: AI STORE ASSISTANT (OWNER EXCLUSIVE) */}
          {activeTab === "ai-assistant" && (
            <div className="flex-1 min-h-0 h-full flex flex-col animate-in fade-in duration-200">
              <OwnerAiChatbot
                menuItems={menuItems}
                onUpdateMenuItem={onUpdateMenuItem}
                seating={seating}
                onUpdateSeating={onUpdateSeating}
                liveOrders={liveOrders}
                onAddOrder={onAddOrder}
                onOpenKot={onOpenKot}
                onUpdateOrderStatus={onUpdateOrderStatus}
                onUpdateOrderTimeLeft={onUpdateOrderTimeLeft}
                onSendOrderNotification={onSendOrderNotification}
                cafeHighlight={cafeHighlight}
                onUpdateCafeHighlight={onUpdateCafeHighlight}
                reservations={reservations}
                posRecords={posRecords}
                preBookingConfig={preBookingConfig}
                onUpdatePreBookingConfig={onUpdatePreBookingConfig}
                onSwitchTab={(tab) => setActiveTab(tab as PortalTab)}
                analyticsDate={analyticsDate}
                getStoreAnalyticsSummary={getStoreAnalyticsSummary}
                mode="embedded"
              />
            </div>
          )}

          {/* TAB 2: STAFF WALK-IN ORDER BOOKING */}
          {activeTab === "walkin" && (
            <WalkInOrderTab
              menuItems={menuItems}
              onAddOrder={(order) => {
                if (onAddOrder) onAddOrder(order);
              }}
              onOpenKot={(order) => {
                if (onOpenKot) onOpenKot(order);
              }}
            />
          )}

          {/* TAB 3: PET POOJA SALES ANALYTICS & DYNAMIC DATE FILTER CONTROLLER */}
          {activeTab === "analytics" && (
            <div className="space-y-4">
              {/* PET POOJA SALES ANALYTICS */}
              <PetPoojaAnalyticsTab
                orders={liveOrders}
                reservations={reservations}
                posRecords={posRecords}
                onAddPosRecord={(rec) => {
                  if (onAddPosRecord) onAddPosRecord(rec);
                }}
                dailyIngredients={dailyIngredients}
                dailyWastage={dailyWastage}
                masterIngredients={masterIngredients}
                financialSettings={financialSettings}
                onUpdateFinancialSettings={onUpdateFinancialSettings}
                onUpdateMasterIngredients={onUpdateMasterIngredients}
                onUpdateDailyIngredients={onUpdateDailyIngredients}
              />

              {/* Dynamic Date Filter & AI Calculation Controller Component */}
              <div className="p-4 rounded-2xl bg-[#23352E] border border-[#F5E086]/30 shadow-lg space-y-3.5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-[#F5E086]/20 border border-[#F5E086]/40 flex items-center justify-center text-[#F5E086]">
                      <Calendar className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="font-niea font-bold text-sm text-[#F5E086] flex items-center gap-2">
                        <span>Analytics Date Filter</span>
                        <span className="px-2 py-0.5 rounded-full bg-[#1B2823] text-emerald-400 text-[10px] font-mono border border-emerald-400/30">
                          Active for NiEA Assistant & Graphs
                        </span>
                      </h4>
                      <p className="text-[11px] text-white/60">
                        Filter live orders and sales by specific date or date range to generate verified metrics and charts on the spot.
                      </p>
                    </div>
                  </div>

                  {/* Filter Mode Selector (Single Day vs Date Range) */}
                  <div className="flex items-center gap-1 bg-[#1B2823] p-1 rounded-xl border border-white/10 text-xs self-start sm:self-auto">
                    <button
                      type="button"
                      onClick={() => setAnalyticsFilterMode("single")}
                      className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                        analyticsFilterMode === "single"
                          ? "bg-[#F5E086] text-[#24332D]"
                          : "text-white/70 hover:text-white"
                      }`}
                    >
                      <span>Specific Date</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnalyticsFilterMode("range")}
                      className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                        analyticsFilterMode === "range"
                          ? "bg-[#F5E086] text-[#24332D]"
                          : "text-white/70 hover:text-white"
                      }`}
                    >
                      <CalendarRange className="w-3.5 h-3.5" />
                      <span>Date Range</span>
                    </button>
                  </div>
                </div>

                {/* Date Picker Controls Row */}
                <div className="flex flex-wrap items-center gap-2.5 pt-1 border-t border-white/10">
                  {analyticsFilterMode === "single" ? (
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-white/70 font-semibold flex items-center gap-1">
                        <span>Date:</span>
                      </label>
                      <input
                        type="date"
                        value={analyticsDate}
                        onChange={(e) => {
                          if (e.target.value) handleSetAnalyticsDate(e.target.value);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-[#1B2823] border border-[#F5E086]/50 text-[#F5E086] text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-[#F5E086] cursor-pointer"
                        title="Pick any specific calendar date for on-spot analytics"
                      />
                    </div>
                  ) : (
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-white/60">From:</span>
                        <input
                          type="date"
                          value={analyticsDateRange.start}
                          onChange={(e) =>
                            setAnalyticsDateRange((prev) => ({ ...prev, start: e.target.value }))
                          }
                          className="px-2.5 py-1.5 rounded-xl bg-[#1B2823] border border-white/15 text-white text-xs font-mono font-medium focus:outline-none focus:border-[#F5E086]"
                        />
                      </div>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs text-white/60">To:</span>
                        <input
                          type="date"
                          value={analyticsDateRange.end}
                          onChange={(e) =>
                            setAnalyticsDateRange((prev) => ({ ...prev, end: e.target.value }))
                          }
                          className="px-2.5 py-1.5 rounded-xl bg-[#1B2823] border border-white/15 text-white text-xs font-mono font-medium focus:outline-none focus:border-[#F5E086]"
                        />
                      </div>
                    </div>
                  )}

                  {/* Quick Preset Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 ml-auto">
                    <span className="text-[11px] text-white/40 font-mono hidden md:inline">Presets:</span>
                    <button
                      type="button"
                      onClick={() => {
                        setAnalyticsFilterMode("single");
                        handleSetAnalyticsDate(new Date().toISOString().slice(0, 10));
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        analyticsFilterMode === "single" && analyticsDate === new Date().toISOString().slice(0, 10)
                          ? "bg-[#F5E086] text-[#24332D]"
                          : "bg-white/5 hover:bg-white/10 text-white/80"
                      }`}
                    >
                      Today
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAnalyticsFilterMode("single");
                        handleSetAnalyticsDate(new Date(Date.now() - 86400000).toISOString().slice(0, 10));
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        analyticsFilterMode === "single" && analyticsDate === new Date(Date.now() - 86400000).toISOString().slice(0, 10)
                          ? "bg-[#F5E086] text-[#24332D]"
                          : "bg-white/5 hover:bg-white/10 text-white/80"
                      }`}
                    >
                      Yesterday
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAnalyticsFilterMode("single");
                        handleSetAnalyticsDate(new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10));
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        analyticsFilterMode === "single" && analyticsDate === new Date(Date.now() - 2 * 86400000).toISOString().slice(0, 10)
                          ? "bg-[#F5E086] text-[#24332D]"
                          : "bg-white/5 hover:bg-white/10 text-white/80"
                      }`}
                    >
                      2 Days Ago
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setAnalyticsFilterMode("range");
                        setAnalyticsDateRange({
                          start: new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10),
                          end: new Date().toISOString().slice(0, 10),
                        });
                      }}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                        analyticsFilterMode === "range"
                          ? "bg-[#F5E086] text-[#24332D]"
                          : "bg-white/5 hover:bg-white/10 text-white/80"
                      }`}
                    >
                      Past 7 Days
                    </button>
                  </div>
                </div>

                {/* Live Ground Truth KPI Summary for the Selected Date (Only filtered orders summed) */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2 border-t border-white/10">
                  <div className="p-2.5 rounded-xl bg-[#1C2722] border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-white/50 block">Filtered Orders</span>
                    <span className="font-niea font-bold text-lg text-[#F5E086]">
                      {filteredAnalyticsSummary.totalOrders} <span className="text-xs font-normal text-white/60">orders</span>
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#1C2722] border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-emerald-400 block">Gross Revenue</span>
                    <span className="font-niea font-bold text-lg text-emerald-300">
                      ₹{filteredAnalyticsSummary.totalRevenue.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#1C2722] border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-white/50 block">Items Prepared</span>
                    <span className="font-niea font-bold text-lg text-white">
                      {filteredAnalyticsSummary.itemsPrepared} <span className="text-xs font-normal text-white/60">units</span>
                    </span>
                  </div>
                  <div className="p-2.5 rounded-xl bg-[#1C2722] border border-white/10">
                    <span className="text-[10px] uppercase font-bold text-amber-300 block">Top Seller</span>
                    <span className="font-niea font-bold text-xs text-[#F5E086] truncate block" title={filteredAnalyticsSummary.topSeller}>
                      {filteredAnalyticsSummary.topSeller} ({filteredAnalyticsSummary.topSellerUnits})
                    </span>
                  </div>
                </div>

                {/* Dynamic Verbal Summary Banner with AI Prompt trigger */}
                <div className="p-3 rounded-xl bg-[#1B2823] border border-[#F5E086]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 text-xs">
                  <div className="flex items-start sm:items-center gap-2 text-white/90">
                    <Sparkles className="w-4 h-4 text-[#F5E086] shrink-0 mt-0.5 sm:mt-0" />
                    <span className="text-[11px] leading-relaxed">
                      <strong className="text-[#F5E086]">Verified Store Analytics:</strong> {filteredAnalyticsSummary.summaryText}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setActiveTab("ai-assistant");
                    }}
                    className="px-3 py-1.5 rounded-xl bg-[#F5E086] hover:bg-[#F8E79B] text-[#24332D] font-bold text-xs transition flex items-center gap-1.5 shrink-0 shadow-sm self-start sm:self-auto"
                    title="Ask NiEA Assistant to analyze and plot charts for this selected date"
                  >
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Ask AI for this Date</span>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* TAB: DAILY INGREDIENTS & PROCUREMENT (RAW MATERIALS & REAL EXCEL P&L) */}
          {activeTab === "ingredients" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <DailyIngredientsTab
                ingredients={dailyIngredients}
                onUpdateIngredients={(updated) => {
                  onUpdateDailyIngredients?.(updated);
                }}
                wastage={dailyWastage}
                onUpdateWastage={(updated) => {
                  onUpdateDailyWastage?.(updated);
                }}
                masterIngredients={masterIngredients}
                onUpdateMasterIngredients={(updated) => {
                  onUpdateMasterIngredients?.(updated);
                }}
                financialSettings={financialSettings}
                onUpdateFinancialSettings={(updated) => {
                  onUpdateFinancialSettings?.(updated);
                }}
                orders={validRealOrders}
                currentDate={analyticsDate}
                onNotice={(msg) => {
                  setNoticeSentMessage(msg);
                  setTimeout(() => setNoticeSentMessage(null), 3000);
                }}
              />
            </div>
          )}

          {/* TAB: DISCOUNTS, COUPONS & STORE GST CONTROLS */}
          {activeTab === "discounts" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <DiscountsGstTab
                coupons={coupons}
                onUpdateCoupons={(updated) => {
                  onUpdateCoupons?.(updated);
                }}
                financialSettings={financialSettings}
                onUpdateFinancialSettings={(updated) => {
                  onUpdateFinancialSettings?.(updated);
                }}
                onNotice={(msg) => {
                  setNoticeSentMessage(msg);
                  setTimeout(() => setNoticeSentMessage(null), 3000);
                }}
              />
            </div>
          )}

          {/* TAB: PERKS & LOYALTY PROGRAM CONTROLS */}
          {activeTab === "perks" && (
            <div className="space-y-6 animate-in fade-in duration-200">
              <div className="bg-[#1E2B25] p-5 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-[#F5E086] text-[#24332D] flex items-center justify-center font-bold shadow-md shrink-0">
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-niea font-bold text-lg text-[#F5E086]">Customer Perks & Loyalty Club</h3>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${
                        loyaltyConfig?.isEnabled !== false
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
                          : "bg-amber-500/20 text-amber-300 border-amber-400/40"
                      }`}>
                        {loyaltyConfig?.isEnabled !== false ? "Active for Customers" : "Paused / Disabled"}
                      </span>
                    </div>
                    <p className="text-xs text-white/70 mt-0.5">
                      Toggle the customer stamps reward program on/off and edit stamp thresholds & discount values.
                    </p>
                  </div>
                </div>
              </div>

              {/* Master Perks Program Toggle */}
              <div className="p-4 bg-[#24332D] rounded-2xl border border-white/10 flex items-center justify-between">
                <div>
                  <p className="text-sm font-bold text-white">Enable Perks & Rewards Program</p>
                  <p className="text-xs text-white/60 mt-0.5">
                    When disabled, the Perks badge in the header/footer is hidden and rewards are paused.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextEnabled = !(loyaltyConfig?.isEnabled !== false);
                    const updated: LoyaltyProgramConfig = {
                      ...(loyaltyConfig || DEFAULT_LOYALTY_CONFIG),
                      isEnabled: nextEnabled,
                    };
                    onUpdateLoyaltyConfig?.(updated);
                    setNoticeSentMessage(nextEnabled ? "✅ Perks program enabled for customers!" : "⏸️ Perks program paused");
                    setTimeout(() => setNoticeSentMessage(null), 3000);
                  }}
                  className="p-1 text-white hover:text-[#F5E086] transition cursor-pointer"
                >
                  {loyaltyConfig?.isEnabled !== false ? (
                    <span className="px-3.5 py-1.5 rounded-xl bg-emerald-500 text-[#1E2B25] font-black text-xs flex items-center gap-1.5 shadow-sm">
                      <Check className="w-4 h-4" /> Enabled (ON)
                    </span>
                  ) : (
                    <span className="px-3.5 py-1.5 rounded-xl bg-white/10 text-white/60 font-bold text-xs flex items-center gap-1.5 border border-white/20">
                      <X className="w-4 h-4" /> Disabled (OFF)
                    </span>
                  )}
                </button>
              </div>

              {/* Edit Perks Parameters Form */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const target = e.currentTarget;
                  const progName = (target.elements.namedItem("progName") as HTMLInputElement).value.trim();
                  const stampsReq = parseInt((target.elements.namedItem("stampsReq") as HTMLInputElement).value) || 6;
                  const discountAmt = parseInt((target.elements.namedItem("discountAmt") as HTMLInputElement).value) || 150;
                  const desc = (target.elements.namedItem("desc") as HTMLTextAreaElement).value.trim();

                  const updated: LoyaltyProgramConfig = {
                    isEnabled: loyaltyConfig?.isEnabled !== false,
                    programName: progName || "NiEA Paws & Perks Club",
                    stampsRequired: stampsReq,
                    rewardDiscountAmount: discountAmt,
                    rewardDescription: desc || `Complete ${stampsReq} stamps to unlock Flat ₹${discountAmt} OFF your next artisan melt!`,
                  };

                  onUpdateLoyaltyConfig?.(updated);
                  setNoticeSentMessage("✅ Perks & Loyalty configuration saved successfully!");
                  setTimeout(() => setNoticeSentMessage(null), 3000);
                }}
                className="bg-[#24332D] p-5 rounded-2xl border border-white/10 space-y-4"
              >
                <h4 className="font-niea font-bold text-sm text-[#F5E086] border-b border-white/10 pb-2">
                  Program Rules & Reward Values
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <label className="text-white/80 font-bold block mb-1">Perks Program Title *</label>
                    <input
                      name="progName"
                      type="text"
                      defaultValue={loyaltyConfig?.programName || "NiEA Paws & Perks Club"}
                      className="w-full px-3 py-2 rounded-xl bg-[#1E2B25] border border-white/10 text-white focus:outline-none focus:border-[#F5E086]"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-white/80 font-bold block mb-1">Stamps Required for Reward *</label>
                    <input
                      name="stampsReq"
                      type="number"
                      min="1"
                      max="20"
                      defaultValue={loyaltyConfig?.stampsRequired || 6}
                      className="w-full px-3 py-2 rounded-xl bg-[#1E2B25] border border-white/10 text-white focus:outline-none focus:border-[#F5E086]"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-white/80 font-bold block mb-1">Reward Voucher Discount (₹ Flat) *</label>
                    <input
                      name="discountAmt"
                      type="number"
                      min="10"
                      max="2000"
                      defaultValue={loyaltyConfig?.rewardDiscountAmount || 150}
                      className="w-full px-3 py-2 rounded-xl bg-[#1E2B25] border border-white/10 text-white focus:outline-none focus:border-[#F5E086]"
                      required
                    />
                  </div>

                  <div>
                    <label className="text-white/80 font-bold block mb-1">Customer Benefit Description</label>
                    <textarea
                      name="desc"
                      rows={2}
                      defaultValue={loyaltyConfig?.rewardDescription || "Complete 6 stamps to unlock Flat ₹150 OFF your next artisan melt!"}
                      className="w-full px-3 py-2 rounded-xl bg-[#1E2B25] border border-white/10 text-white focus:outline-none focus:border-[#F5E086]"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button
                    type="submit"
                    className="px-5 py-2.5 rounded-xl bg-[#F5E086] hover:bg-[#F8E79B] text-[#24332D] font-bold text-xs transition shadow-md flex items-center gap-1.5 cursor-pointer"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Perks Settings</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* TAB: WEBSITE TEXTS, HOURS & FOOTER COPY */}
          {activeTab === "website" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <WebsiteContentTab
                config={websiteConfig}
                onUpdateConfig={(updated) => {
                  onUpdateWebsiteConfig?.(updated);
                }}
                isFloatingCatEnabled={isFloatingCatEnabled}
                onToggleFloatingCat={setIsFloatingCatEnabled}
                onNotice={(msg) => {
                  setNoticeSentMessage(msg);
                  setTimeout(() => setNoticeSentMessage(null), 3000);
                }}
              />
            </div>
          )}

          {/* TAB: AUTOMATED WHATSAPP ALERTS & PRESET TEMPLATES */}
          {activeTab === "whatsapp" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <WhatsAppAlertsTab
                config={whatsappConfig}
                onUpdateConfig={(updated) => {
                  onUpdateWhatsappConfig?.(updated);
                }}
                onNotice={(msg) => {
                  setNoticeSentMessage(msg);
                  setTimeout(() => setNoticeSentMessage(null), 3000);
                }}
              />
            </div>
          )}

          {/* TAB 4: PRE-BOOKING CONFIGURATION */}
          {activeTab === "prebooking" && (
            <PreBookingConfigTab
              config={preBookingConfig}
              onUpdateConfig={(cfg) => {
                if (onUpdatePreBookingConfig) onUpdatePreBookingConfig(cfg);
              }}
            />
          )}

          {/* TAB: KITCHEN KANBAN DISPLAY BOARD (KDS) */}
          {activeTab === "kanban" && (
            <div className="space-y-4 animate-in fade-in duration-200">
              <KitchenKanbanBoard
                orders={liveOrders}
                onUpdateStatus={(orderId, status, note) => {
                  if (onUpdateOrderStatus) onUpdateOrderStatus(orderId, status, note);
                }}
                onUpdateOrderStep={onUpdateOrderStep}
                onUpdateWaitTime={(orderId, minutes, note) => {
                  if (onUpdateOrderTimeLeft) onUpdateOrderTimeLeft(orderId, minutes, note);
                }}
                onOpenKot={(order) => {
                  if (onOpenKot) onOpenKot(order);
                }}
                onOpenLiveCallingBoard={() => {
                  if (onOpenLiveCallingBoard) onOpenLiveCallingBoard();
                }}
                onTriggerTakeawayMic={(order) => {
                  if (order) {
                    broadcastTakeawayAnnouncement?.({
                      orderId: order.id,
                      orderNumber: order.orderNumber,
                      tokenNumber: order.tokenNumber,
                      customerName: order.customerName,
                      customerPhone: order.customerPhone,
                      targetUserId: (order as any).userId,
                      targetPhone: order.customerPhone,
                      message: `Token #${order.tokenNumber || order.orderNumber}: Your fresh ${order.orderType === "dine-in" ? `Dine-in table (${order.tableNumber || "Order"})` : "order"} is ready for pickup!`,
                    });
                    setNoticeSentMessage(
                      `🎙️ Calling customer ${order.customerName ? `(${order.customerName})` : ""} for Token #${order.tokenNumber || order.orderNumber}! Private voice alert & Twilio call dispatched.`
                    );
                  } else {
                    broadcastTakeawayAnnouncement?.({
                      message: "Takeaway order is packed and ready for pickup!",
                    });
                    setNoticeSentMessage(`📢 Takeaway announcement broadcasted!`);
                  }
                  setTimeout(() => setNoticeSentMessage(null), 3500);
                }}
                onNotice={(msg) => setNoticeSentMessage(msg)}
              />
            </div>
          )}

          {/* TAB 5: LIVE ORDERS & KITCHEN (OWNER & STAFF PORTAL) */}
          {activeTab === "orders" && (
            <div className="space-y-4">
              {/* Kitchen Display View Switcher (Kanban vs Detailed List) */}
              <div className="flex flex-wrap items-center justify-between gap-3 p-3 sm:p-3.5 rounded-2xl bg-[#23352E] border border-white/10 shadow-sm">
                <div className="flex items-center gap-2">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span className="text-xs font-bold text-white">Kitchen Display Mode:</span>
                  <span className="text-[11px] text-white/50 hidden sm:inline">• Switch between interactive drag-and-drop Kanban and full ticket list</span>
                </div>
                <div className="flex items-center gap-1.5 bg-black/40 p-1 rounded-xl border border-white/10 text-xs">
                  <button
                    type="button"
                    onClick={() => setOrdersViewMode("kanban")}
                    className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                      ordersViewMode === "kanban"
                        ? "bg-[#F5E086] text-[#24332D] shadow-sm"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    <LayoutGrid className="w-3.5 h-3.5" />
                    <span>Kanban KDS Board</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setOrdersViewMode("list")}
                    className={`px-3 py-1.5 rounded-lg font-bold transition flex items-center gap-1.5 ${
                      ordersViewMode === "list"
                        ? "bg-[#F5E086] text-[#24332D] shadow-sm"
                        : "text-white/70 hover:text-white"
                    }`}
                  >
                    <ArrowUpDown className="w-3.5 h-3.5" />
                    <span>Full Ticket List</span>
                  </button>
                </div>
              </div>

              {ordersViewMode === "kanban" ? (
                <KitchenKanbanBoard
                  orders={liveOrders}
                  onUpdateStatus={(orderId, status, note) => {
                    if (onUpdateOrderStatus) onUpdateOrderStatus(orderId, status, note);
                  }}
                  onUpdateOrderStep={onUpdateOrderStep}
                  onUpdateWaitTime={(orderId, minutes, note) => {
                    if (onUpdateOrderTimeLeft) onUpdateOrderTimeLeft(orderId, minutes, note);
                  }}
                  onOpenKot={(order) => {
                    if (onOpenKot) onOpenKot(order);
                  }}
                  onOpenLiveCallingBoard={() => {
                    if (onOpenLiveCallingBoard) onOpenLiveCallingBoard();
                  }}
                  onTriggerTakeawayMic={(order) => {
                    if (order) {
                      broadcastTakeawayAnnouncement?.({
                        orderId: order.id,
                        orderNumber: order.orderNumber,
                        tokenNumber: order.tokenNumber,
                        customerName: order.customerName,
                        customerPhone: order.customerPhone,
                        targetUserId: (order as any).userId,
                        targetPhone: order.customerPhone,
                        message: `Token #${order.tokenNumber || order.orderNumber}: Your fresh ${order.orderType === "dine-in" ? `Dine-in table (${order.tableNumber || "Order"})` : "order"} is ready for pickup!`,
                      });
                      setNoticeSentMessage(
                        `🎙️ Calling customer ${order.customerName ? `(${order.customerName})` : ""} for Token #${order.tokenNumber || order.orderNumber}! Private voice alert & Twilio call dispatched.`
                      );
                    } else {
                      broadcastTakeawayAnnouncement?.({
                        message: "Takeaway order is packed and ready for pickup!",
                      });
                      setNoticeSentMessage(`📢 Takeaway announcement broadcasted!`);
                    }
                    setTimeout(() => setNoticeSentMessage(null), 3500);
                  }}
                  onNotice={(msg) => setNoticeSentMessage(msg)}
                />
              ) : (
                <>
                  {/* Quick Metrics Bar */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-2xl bg-[#2B3D36] border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-white/50 block">Active in Kitchen</span>
                  <span className="font-niea font-bold text-xl text-[#F5E086]">
                    {liveOrders.filter((o) => o.status === "received" || o.status === "toasting").length}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-[#2B3D36] border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-emerald-400 block">Hot & Ready</span>
                  <span className="font-niea font-bold text-xl text-emerald-300">
                    {liveOrders.filter((o) => o.status === "ready").length}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-[#2B3D36] border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-white/50 block">Completed Today</span>
                  <span className="font-niea font-bold text-xl text-white/80">
                    {liveOrders.filter((o) => o.status === "served").length}
                  </span>
                </div>
                <div className="p-3 rounded-2xl bg-[#2B3D36] border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-white/50 block">Total Orders</span>
                  <span className="font-niea font-bold text-xl text-[#F5E086]">
                    {liveOrders.length}
                  </span>
                </div>
              </div>

              {/* Staff Authority Banner */}
              <div className="p-3 rounded-xl bg-[#23352E] border border-[#F5E086]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                <div className="flex items-center gap-2 text-white/80">
                  <ChefHat className="w-4 h-4 text-[#F5E086] shrink-0" />
                  <span>
                    <strong className="text-[#F5E086]">Staff Only Control Center:</strong> You have exclusive authority to advance preparation steps, adjust countdown time left, and dispatch live kitchen notifications to customer tracking screens.
                  </span>
                </div>
                <span className="px-2 py-0.5 rounded-full bg-[#F5E086]/20 text-[#F5E086] font-mono text-[10px] uppercase font-bold tracking-wider self-start sm:self-auto shrink-0">
                  Owner Portal
                </span>
              </div>

              {/* Staff Search & Filter Control Center */}
              <div className="p-3.5 sm:p-4 rounded-2xl bg-[#23352E]/90 border border-white/10 space-y-3 shadow-md">
                {/* Row 1: Search Inputs & Controls */}
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5">
                  {/* General Search Input */}
                  <div className="relative sm:col-span-5">
                    <input
                      type="text"
                      placeholder="Search order #, token, item, name..."
                      value={orderSearchQuery}
                      onChange={(e) => setOrderSearchQuery(e.target.value)}
                      className="w-full pl-8 pr-7 py-2 rounded-xl bg-[#2B3D36] border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#F5E086] transition"
                    />
                    <Search className="w-3.5 h-3.5 text-[#F5E086] absolute left-2.5 top-2.5" />
                    {orderSearchQuery && (
                      <button
                        type="button"
                        onClick={() => setOrderSearchQuery("")}
                        className="absolute right-2 top-2 p-0.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white"
                        title="Clear search"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Dedicated Phone Number Filter */}
                  <div className="relative sm:col-span-4">
                    <input
                      type="text"
                      placeholder="Filter by phone (e.g. 98765)..."
                      value={orderPhoneQuery}
                      onChange={(e) => setOrderPhoneQuery(e.target.value)}
                      className="w-full pl-8 pr-7 py-2 rounded-xl bg-[#2B3D36] border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#F5E086] transition font-mono"
                    />
                    <Phone className="w-3.5 h-3.5 text-emerald-400 absolute left-2.5 top-2.5" />
                    {orderPhoneQuery && (
                      <button
                        type="button"
                        onClick={() => setOrderPhoneQuery("")}
                        className="absolute right-2 top-2 p-0.5 rounded-full hover:bg-white/10 text-white/50 hover:text-white"
                        title="Clear phone filter"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Sort Selector & Calling Board */}
                  <div className="flex items-center gap-2 sm:col-span-3 justify-end">
                    <div className="relative flex-1 sm:flex-initial">
                      <div className="relative">
                        <select
                          value={orderSortBy}
                          onChange={(e) => setOrderSortBy(e.target.value as OrderSortBy)}
                          className="w-full py-2 pl-7 pr-3 rounded-xl bg-[#2B3D36] border border-white/15 text-xs text-white font-medium focus:outline-none focus:border-[#F5E086] cursor-pointer appearance-none"
                          title="Sort orders"
                        >
                          <option value="newest" className="bg-[#24332D] text-white">Newest First</option>
                          <option value="oldest" className="bg-[#24332D] text-white">Oldest First</option>
                          <option value="urgency" className="bg-[#24332D] text-white">Kitchen Urgency</option>
                        </select>
                        <ArrowUpDown className="w-3 h-3 text-white/50 absolute left-2.5 top-3 pointer-events-none" />
                      </div>
                    </div>

                    {onOpenLiveCallingBoard && (
                      <button
                        type="button"
                        onClick={() => onOpenLiveCallingBoard()}
                        className="px-2.5 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-[#17221D] font-bold text-xs transition shrink-0 flex items-center gap-1 shadow-sm"
                        title="Open full-screen TV calling board for counter display"
                      >
                        <Tv className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Calling Board</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Row 2: Status & Order Type Filter Bars */}
                <div className="pt-2 border-t border-white/10 space-y-2">
                  {/* Status Filter Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 shrink-0 sm:w-24 flex items-center gap-1">
                      <Filter className="w-3 h-3 text-[#F5E086]" /> Status:
                    </span>
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                      {[
                        { key: "active", label: "Active Queue", count: orderCounts.active },
                        { key: "received", label: "Received", count: orderCounts.received },
                        { key: "toasting", label: "Toasting", count: orderCounts.toasting },
                        { key: "ready", label: "Ready", count: orderCounts.ready },
                        { key: "served", label: "Served", count: orderCounts.served },
                        { key: "all", label: "All Orders", count: orderCounts.all },
                      ].map((item) => (
                        <button
                          key={item.key}
                          type="button"
                          onClick={() => setOrderStatusFilter(item.key as OrderStatusFilter)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                            orderStatusFilter === item.key
                              ? "bg-[#F5E086] text-[#24332D] shadow-sm"
                              : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          <span>{item.label}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                              orderStatusFilter === item.key
                                ? "bg-[#24332D]/20 text-[#24332D] font-bold"
                                : "bg-black/25 text-white/60"
                            }`}
                          >
                            {item.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Order Type Filter Row */}
                  <div className="flex flex-col sm:flex-row sm:items-center gap-1.5 sm:gap-2">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-white/50 shrink-0 sm:w-24 flex items-center gap-1">
                      <Utensils className="w-3 h-3 text-sky-400" /> Order Type:
                    </span>
                    <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-0.5">
                      {[
                        { key: "all", label: "All Types", count: orderCounts.allTypes },
                        { key: "dine-in", label: "Dine-In", count: orderCounts.dineIn },
                        { key: "takeaway", label: "Takeaway", count: orderCounts.takeaway },
                        { key: "walk_in", label: "Walk-In", count: orderCounts.walkIn },
                        { key: "pre_order", label: "Pre-Order", count: orderCounts.preOrder },
                      ].map((typeItem) => (
                        <button
                          key={typeItem.key}
                          type="button"
                          onClick={() => setOrderTypeFilter(typeItem.key as OrderTypeFilter)}
                          className={`px-2.5 py-1 rounded-lg text-xs font-bold transition shrink-0 flex items-center gap-1.5 ${
                            orderTypeFilter === typeItem.key
                              ? "bg-sky-400 text-[#162722] shadow-sm"
                              : "bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
                          }`}
                        >
                          <span>{typeItem.label}</span>
                          <span
                            className={`px-1.5 py-0.2 rounded-full text-[10px] font-mono ${
                              orderTypeFilter === typeItem.key
                                ? "bg-[#162722]/20 text-[#162722] font-bold"
                                : "bg-black/25 text-white/60"
                            }`}
                          >
                            {typeItem.count}
                          </span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Row 3: Active Filters & Results Summary */}
                <div className="pt-2 border-t border-white/10 flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-white/60 font-medium">
                      Showing <strong className="text-white">{filteredOrders.length}</strong> of{" "}
                      <strong className="text-[#F5E086]">{liveOrders.length}</strong> orders
                    </span>

                    {/* Active filter badges with instant removal */}
                    {orderStatusFilter !== "active" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#F5E086]/20 text-[#F5E086] text-[11px] font-semibold border border-[#F5E086]/30">
                        Status: {orderStatusFilter}
                        <button
                          type="button"
                          onClick={() => setOrderStatusFilter("active")}
                          className="hover:text-white ml-0.5"
                          title="Reset status to active"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}

                    {orderTypeFilter !== "all" && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-sky-400/20 text-sky-300 text-[11px] font-semibold border border-sky-400/30">
                        Type: {orderTypeFilter.replace("_", "-")}
                        <button
                          type="button"
                          onClick={() => setOrderTypeFilter("all")}
                          className="hover:text-white ml-0.5"
                          title="Reset type to all"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}

                    {orderPhoneQuery.trim() && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[11px] font-semibold border border-emerald-400/30">
                        Phone: {orderPhoneQuery}
                        <button
                          type="button"
                          onClick={() => setOrderPhoneQuery("")}
                          className="hover:text-white ml-0.5"
                          title="Clear phone filter"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}

                    {orderSearchQuery.trim() && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/10 text-white text-[11px] font-semibold border border-white/20">
                        Search: "{orderSearchQuery}"
                        <button
                          type="button"
                          onClick={() => setOrderSearchQuery("")}
                          className="hover:text-[#F5E086] ml-0.5"
                          title="Clear text search"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    )}
                  </div>

                  {hasActiveOrderFilters && (
                    <button
                      type="button"
                      onClick={handleResetOrderFilters}
                      className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white text-[11px] font-bold transition flex items-center gap-1"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Reset Filters</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Orders List with Memoized Cards and Progressive Lazy Loading */}
              <div className="space-y-4">
                {displayedOrders.map((order) => (
                  <KitchenOrderCard
                    key={order.id}
                    order={order}
                    onOpenKot={onOpenKot}
                    onOpenLiveCallingBoard={onOpenLiveCallingBoard}
                    onUpdateOrderStep={onUpdateOrderStep}
                    onUpdateOrderStatus={onUpdateOrderStatus}
                    onUpdateOrderTimeLeft={onUpdateOrderTimeLeft}
                    onSendOrderNotification={onSendOrderNotification}
                    onSetOrderPhoneQuery={setOrderPhoneQuery}
                    onSetNoticeSentMessage={(msg) => {
                      setNoticeSentMessage(msg);
                      setTimeout(() => setNoticeSentMessage(null), 3000);
                    }}
                    broadcastTakeawayAnnouncement={broadcastTakeawayAnnouncement}
                  />
                ))}

                {/* Lazy-Loading Progressive Pagination & Infinite Scroll Sentinel */}
                {filteredOrders.length > visibleOrderCount && (
                  <div className="p-4 rounded-2xl bg-[#23352E] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs shadow-md">
                    <span className="text-white/70">
                      Showing <strong className="text-[#F5E086]">{displayedOrders.length}</strong> of{" "}
                      <strong className="text-white">{filteredOrders.length}</strong> orders (lazy-rendered for instant opening)
                    </span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setVisibleOrderCount((prev) => Math.min(prev + 10, filteredOrders.length))}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold transition"
                      >
                        Load 10 More
                      </button>
                      <button
                        type="button"
                        onClick={() => setVisibleOrderCount(filteredOrders.length)}
                        className="px-3 py-1.5 rounded-xl bg-[#F5E086] text-[#24332D] font-bold hover:bg-[#F8E79B] transition"
                      >
                        Show All ({filteredOrders.length})
                      </button>
                    </div>
                  </div>
                )}
                <div ref={orderListSentinelRef} className="h-2 w-full pointer-events-none" />

                {liveOrders.length > 0 && filteredOrders.length === 0 && (
                  <div className="p-8 text-center bg-[#2B3D36] rounded-2xl border border-white/10 space-y-3">
                    <div className="w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-[#F5E086]">
                      <Search className="w-6 h-6 opacity-75" />
                    </div>
                    <div className="space-y-1">
                      <h5 className="text-sm font-bold text-white">No Orders Match Your Search or Filters</h5>
                      <p className="text-xs text-white/60 max-w-md mx-auto">
                        No orders matched your selected status, order type, or phone number query.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={handleResetOrderFilters}
                      className="px-4 py-2 rounded-xl bg-[#F5E086] text-[#24332D] text-xs font-bold hover:bg-[#ebd575] transition inline-flex items-center gap-1.5 shadow-sm"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset All Filters</span>
                    </button>
                  </div>
                )}

                {liveOrders.length === 0 && (
                  <div className="p-8 text-center bg-[#2B3D36] rounded-2xl border border-white/10 space-y-2">
                    <ChefHat className="w-8 h-8 text-[#F5E086] mx-auto opacity-60" />
                    <h5 className="text-sm font-bold text-white">No Orders Placed Yet</h5>
                    <p className="text-xs text-white/60">
                      When customers place orders from the menu or checkout, tickets will appear here for staff step & time management.
                    </p>
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      )}

          {/* TAB 1: RESERVATIONS */}
          {activeTab === "reservations" && (
            <div className="space-y-4">
              {/* Feature Toggle Banner: Disable / Enable Table Reservations */}
              <div className="p-4 rounded-2xl bg-[#1E2B25] border border-[#F5E086]/30 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-md">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <CalendarCheck className="w-4 h-4 text-[#F5E086]" />
                    <span className="text-xs font-bold text-white">Table Reservations System</span>
                    <span
                      className={`text-[10px] font-black uppercase px-2 py-0.5 rounded-full border ${
                        websiteConfig?.isReservationEnabled !== false
                          ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40"
                          : "bg-amber-500/20 text-amber-300 border-amber-400/40"
                      }`}
                    >
                      {websiteConfig?.isReservationEnabled !== false
                        ? "Active & Enabled"
                        : "Disabled (Coming in Future)"}
                    </span>
                  </div>
                  <p className="text-[11px] text-white/70 max-w-xl">
                    {websiteConfig?.isReservationEnabled !== false
                      ? "Customers can currently book tables online with ₹150 deposit. The landing page shows both 'Order Now' and 'Book Table' buttons."
                      : "Reservations are disabled as this feature is coming in the future. The landing page 'Book Table' button is hidden, and the 'Order Now' button is enlarged and centered."}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    const nextVal = !(websiteConfig?.isReservationEnabled ?? false);
                    onUpdateWebsiteConfig?.({
                      ...websiteConfig,
                      isReservationEnabled: nextVal,
                    });
                  }}
                  className={`px-4 py-2.5 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 shrink-0 cursor-pointer ${
                    websiteConfig?.isReservationEnabled !== false
                      ? "bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-400/40 active:scale-95"
                      : "bg-[#F5E086] hover:bg-[#F8E79B] text-[#24332D] shadow-md font-black active:scale-95"
                  }`}
                >
                  {websiteConfig?.isReservationEnabled !== false ? (
                    <span>Disable Reservations</span>
                  ) : (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>Enable Reservations</span>
                    </>
                  )}
                </button>
              </div>

              {/* Quick Metrics */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                <div className="p-3 rounded-2xl bg-[#2B3D36] border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-white/50 block">Bookings</span>
                  <span className="font-niea font-bold text-lg text-[#F5E086]">{reservations.length}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#2B3D36] border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-white/50 block">Guests</span>
                  <span className="font-niea font-bold text-lg text-white">{totalGuests}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#2B3D36] border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-white/50 block">Confirmed</span>
                  <span className="font-niea font-bold text-lg text-emerald-400">{confirmedCount}</span>
                </div>
                <div className="p-3 rounded-2xl bg-[#2B3D36] border border-white/10">
                  <span className="text-[10px] uppercase font-bold text-white/50 block">Seated</span>
                  <span className="font-niea font-bold text-lg text-amber-300">{seatedCount}</span>
                </div>
              </div>

              {/* Filters */}
              <div className="flex items-center gap-1.5 text-xs overflow-x-auto pb-1">
                <button
                  onClick={() => setStatusFilter("all")}
                  className={`px-3 py-1 rounded-full font-bold transition ${
                    statusFilter === "all" ? "bg-[#F5E086] text-[#24332D]" : "bg-white/10 text-white/70"
                  }`}
                >
                  All ({reservations.length})
                </button>
                <button
                  onClick={() => setStatusFilter("confirmed")}
                  className={`px-3 py-1 rounded-full font-bold transition ${
                    statusFilter === "confirmed" ? "bg-emerald-500 text-white" : "bg-white/10 text-white/70"
                  }`}
                >
                  Confirmed ({confirmedCount})
                </button>
                <button
                  onClick={() => setStatusFilter("seated")}
                  className={`px-3 py-1 rounded-full font-bold transition ${
                    statusFilter === "seated" ? "bg-amber-400 text-[#24332D]" : "bg-white/10 text-white/70"
                  }`}
                >
                  Seated ({seatedCount})
                </button>
                <button
                  onClick={() => setStatusFilter("cancelled")}
                  className={`px-3 py-1 rounded-full font-bold transition ${
                    statusFilter === "cancelled" ? "bg-rose-500 text-white" : "bg-white/10 text-white/70"
                  }`}
                >
                  Cancelled
                </button>
              </div>

              {/* Reservations List */}
              {filteredReservations.length === 0 ? (
                <div className="text-center py-10 bg-[#2B3D36]/40 rounded-2xl border border-white/10 text-xs text-white/60">
                  No reservations found in this category.
                </div>
              ) : (
                <div className="space-y-2.5">
                  {filteredReservations.map((res) => (
                    <div
                      key={res.id}
                      className="p-3.5 rounded-2xl bg-[#2B3D36] border border-white/10 space-y-2.5 text-xs"
                    >
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2">
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-white text-sm">{res.customerName}</h4>
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                              res.status === "seated"
                                ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                                : res.status === "confirmed"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                                : "bg-white/10 text-white/60"
                            }`}
                          >
                            {res.status}
                          </span>
                          {res.autoHoldActive && res.status !== "seated" && (
                            <span className="px-2 py-0.5 rounded-full bg-[#F5E086] text-[#24332D] text-[10px] font-bold">
                              Table Held (-{res.guestCount} seats)
                            </span>
                          )}
                          {res.autoReleased && (
                            <span className="px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 text-[10px] font-bold">
                              Auto-Released (No-Show)
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-white/50 text-[11px]">
                          <span>Ref: {res.bookingRef}</span>
                          <span>•</span>
                          <span className="text-emerald-400 font-medium">₹{res.advanceDeposit || 150} Paid</span>
                        </div>
                      </div>

                      <div className="flex flex-wrap items-center justify-between gap-2 text-white/80">
                        <div className="flex flex-wrap items-center gap-3">
                          <span className="flex items-center gap-1 text-[#F5E086] font-semibold">
                            <Clock className="w-3.5 h-3.5" />
                            {res.timeSlot}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Users className="w-3.5 h-3.5" />
                            {res.guestCount} Guests
                          </span>
                          <span>•</span>
                          <span className="text-white/60 capitalize font-medium">
                            {res.seatingArea === "table2"
                              ? "Table 2 (Window)"
                              : "Table 1 (Sourdough)"}
                          </span>
                          {res.specialNotes && (
                            <span className="text-white/60 italic max-w-xs truncate">
                              &quot;{res.specialNotes}&quot;
                            </span>
                          )}
                        </div>

                        {/* Direct action buttons */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          {res.status === "confirmed" && (
                            <button
                              type="button"
                              onClick={() => {
                                onUpdateReservationStatus(res.id, "seated");
                                setNoticeSentMessage(`Marked ${res.customerName} as Seated.`);
                                setTimeout(() => setNoticeSentMessage(null), 3000);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-amber-400 hover:bg-amber-300 text-[#24332D] text-[11px] font-bold transition flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              <span>Mark Seated</span>
                            </button>
                          )}

                          {res.status === "seated" && (
                            <button
                              type="button"
                              onClick={() => {
                                onUpdateReservationStatus(res.id, "cancelled");
                                setNoticeSentMessage(`Table freed for ${res.customerName}.`);
                                setTimeout(() => setNoticeSentMessage(null), 3000);
                              }}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-[11px] font-bold transition flex items-center gap-1"
                            >
                              <Check className="w-3 h-3" />
                              <span>Free Table</span>
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => sendWhatsAppNotice(res)}
                            className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-medium transition flex items-center gap-1"
                            title="Send WhatsApp notice"
                          >
                            <MessageSquare className="w-3 h-3 text-emerald-400" />
                            <span>WhatsApp</span>
                          </button>

                          <a
                            href={`tel:${res.customerPhone}`}
                            className="p-1 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
                            title="Call customer"
                          >
                            <Phone className="w-3 h-3" />
                          </a>

                          {res.status !== "cancelled" && (
                            <button
                              type="button"
                              onClick={() => onUpdateReservationStatus(res.id, "cancelled")}
                              className="px-2 py-1 rounded-lg bg-white/5 hover:bg-rose-500/20 text-rose-300 text-[11px] transition"
                            >
                              Cancel
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={() => onDeleteReservation(res.id)}
                            className="p-1 text-white/40 hover:text-rose-400 transition"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: CAFE HIGHLIGHT */}
          {activeTab === "highlights" && (
            <div className="space-y-4">
              {/* Simple Mode Toggle */}
              <div className="p-3.5 rounded-2xl bg-[#2B3D36] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-niea font-bold text-sm text-[#F5E086]">
                    Home Page Spotlight
                  </h4>
                  <div className="flex items-center gap-1 bg-[#24332D] p-1 rounded-xl border border-white/10 text-xs">
                    <button
                      type="button"
                      onClick={() => setHighlightMode("auto")}
                      className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                        highlightMode === "auto"
                          ? "bg-[#F5E086] text-[#24332D]"
                          : "text-white/70"
                      }`}
                    >
                      <TrendingUp className="w-3 h-3" />
                      <span>Auto Bestseller</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setHighlightMode("manual")}
                      className={`px-3 py-1 rounded-lg font-bold transition flex items-center gap-1 ${
                        highlightMode === "manual"
                          ? "bg-[#F5E086] text-[#24332D]"
                          : "text-white/70"
                      }`}
                    >
                      <Edit2 className="w-3 h-3" />
                      <span>Custom Pick</span>
                    </button>
                  </div>
                </div>

                {highlightMode === "auto" ? (
                  <div className="p-3 rounded-xl bg-[#24332D] flex items-center justify-between gap-3 text-xs">
                    <div>
                      <span className="text-white/60 block text-[11px]">Active Top Seller:</span>
                      <strong className="text-[#F5E086] text-sm">
                        {cafeHighlight?.title || "Autumn Truffle Melt"}
                      </strong>
                      <span className="text-white/70 block text-[11px]">
                        Automatically spotlighted from daily customer orders.
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={handleSyncTopSellerNow}
                      className="px-3.5 py-2 rounded-xl bg-[#F5E086] hover:bg-[#F8E79B] text-[#24332D] font-bold text-xs transition flex items-center gap-1.5 shrink-0"
                    >
                      <RotateCcw className="w-3 h-3" />
                      <span>Sync Top Seller</span>
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSaveHighlight} className="space-y-3 pt-1 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="text-white/70 block mb-1 font-semibold">Select Menu Item</label>
                        <select
                          value={hlItemId}
                          onChange={(e) => {
                            const id = e.target.value;
                            setHlItemId(id);
                            const item = menuItems.find((m) => m.id === id);
                            if (item) {
                              setHlTitle(item.name);
                              setHlDesc(item.description);
                              setHlPrice(item.price.toString());
                              setHlImage(item.imageUrl);
                            }
                          }}
                          className="w-full px-3 py-2 rounded-xl bg-[#24332D] border border-white/10 text-white focus:outline-none focus:border-[#F5E086]"
                        >
                          {menuItems.map((item) => (
                            <option key={item.id} value={item.id}>
                              {item.name} (₹{item.price})
                            </option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label className="text-white/70 block mb-1 font-semibold">Tag / Badge</label>
                        <input
                          type="text"
                          value={hlBadge}
                          onChange={(e) => setHlBadge(e.target.value)}
                          placeholder="e.g. Chef's Pick"
                          className="w-full px-3 py-2 rounded-xl bg-[#24332D] border border-white/10 text-white focus:outline-none focus:border-[#F5E086]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-white/70 block mb-1 font-semibold">Headline</label>
                        <input
                          type="text"
                          value={hlTitle}
                          onChange={(e) => setHlTitle(e.target.value)}
                          required
                          className="w-full px-3 py-2 rounded-xl bg-[#24332D] border border-white/10 text-white focus:outline-none focus:border-[#F5E086]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <label className="text-white/70 block mb-1 font-semibold">Description</label>
                        <input
                          type="text"
                          value={hlDesc}
                          onChange={(e) => setHlDesc(e.target.value)}
                          className="w-full px-3 py-2 rounded-xl bg-[#24332D] border border-white/10 text-white focus:outline-none focus:border-[#F5E086]"
                        />
                      </div>

                      <div className="sm:col-span-2">
                        <ImagePickerField
                          label="Featured Banner Visual / Photo"
                          value={hlImage}
                          onChange={setHlImage}
                          helpText="Upload a featured promo visual or select from our artisanal cafe presets."
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      className="w-full py-2.5 rounded-xl bg-[#F5E086] hover:bg-[#F8E79B] text-[#24332D] font-bold text-xs transition flex items-center justify-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>Save & Publish Highlight</span>
                    </button>
                  </form>
                )}
              </div>

              {/* Live Preview */}
              <div className="p-3.5 rounded-2xl bg-[#2B3D36] border border-white/10 space-y-2">
                <span className="text-[10px] uppercase font-bold text-white/50 block">
                  Home Preview:
                </span>
                <div className="p-4 rounded-xl bg-[#24332D] border border-[#F5E086]/20 flex items-center justify-between gap-3">
                  <div className="space-y-1">
                    <span className="px-2 py-0.5 rounded-full bg-[#D96B43] text-white text-[10px] font-bold uppercase">
                      {cafeHighlight?.badge || "Spotlight"}
                    </span>
                    <h5 className="font-niea font-bold text-base text-[#F5E086]">
                      {cafeHighlight?.title || "Autumn Truffle Melt"}
                    </h5>
                    <p className="text-xs text-white/70 line-clamp-1 max-w-md">
                      {cafeHighlight?.description || "Handcrafted fresh sourdough melt..."}
                    </p>
                  </div>
                  <span className="text-lg font-black text-white shrink-0">
                    ₹{cafeHighlight?.price || 380}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: MENU & STOCK */}
          {activeTab === "inventory" && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/70">
                  Quick stock count & availability controls:
                </span>
                <button
                  type="button"
                  onClick={onResetDefaults}
                  className="text-[#F5E086] hover:underline flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset Default Stock</span>
                </button>
              </div>

              {/* Inline Editor for Existing Menu Item */}
              {editingItem && (
                <div className="p-4 rounded-2xl bg-[#1D2B25] border border-[#F5E086]/40 space-y-3 shadow-lg">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <h5 className="font-niea font-bold text-xs text-[#F5E086] flex items-center gap-1.5">
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Item: {editingItem.name}</span>
                    </h5>
                    <button
                      type="button"
                      onClick={() => setEditingItem(null)}
                      className="p-1 text-white/60 hover:text-white"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <form onSubmit={handleSaveEditedItem} className="space-y-3">
                    <div className="grid grid-cols-2 gap-2.5">
                      <div className="col-span-2">
                        <label className="text-white/70 block mb-1 font-semibold text-[11px]">
                          Item Name *
                        </label>
                        <input
                          type="text"
                          required
                          value={editingItem.name}
                          onChange={(e) =>
                            setEditingItem({ ...editingItem, name: e.target.value })
                          }
                          className="w-full px-3 py-1.5 rounded-xl bg-[#24332D] border border-white/10 text-white text-xs focus:outline-none focus:border-[#F5E086]"
                        />
                      </div>

                      <div>
                        <label className="text-white/70 block mb-1 font-semibold text-[11px]">
                          Price (₹) *
                        </label>
                        <input
                          type="number"
                          required
                          value={editingItem.price}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              price: Number(e.target.value) || 0,
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-xl bg-[#24332D] border border-white/10 text-white text-xs focus:outline-none focus:border-[#F5E086]"
                        />
                      </div>

                      <div>
                        <label className="text-white/70 block mb-1 font-semibold text-[11px]">
                          Current Stock
                        </label>
                        <input
                          type="number"
                          value={editingItem.stockLeft}
                          onChange={(e) =>
                            setEditingItem({
                              ...editingItem,
                              stockLeft: Number(e.target.value) || 0,
                            })
                          }
                          className="w-full px-3 py-1.5 rounded-xl bg-[#24332D] border border-white/10 text-white text-xs focus:outline-none focus:border-[#F5E086]"
                        />
                      </div>

                      <div className="col-span-2">
                        <label className="text-white/70 block mb-1 font-semibold text-[11px]">
                          Description
                        </label>
                        <input
                          type="text"
                          value={editingItem.description}
                          onChange={(e) =>
                            setEditingItem({ ...editingItem, description: e.target.value })
                          }
                          className="w-full px-3 py-1.5 rounded-xl bg-[#24332D] border border-white/10 text-white text-xs focus:outline-none focus:border-[#F5E086]"
                        />
                      </div>

                      <div className="col-span-2">
                        <ImagePickerField
                          label="Add / Replace Item Image"
                          value={editingItem.imageUrl}
                          onChange={(url) =>
                            setEditingItem({ ...editingItem, imageUrl: url })
                          }
                          helpText="Upload a photo from your device, enter a web image link, or choose an artisanal preset."
                        />
                      </div>

                      {/* Edit Item Customisations */}
                      <div className="col-span-2 p-3 rounded-xl bg-[#17231E] border border-white/10 space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-[#F5E086] font-bold text-[11px] block">
                            Customisation Add-ons & Extras ({editingItem.customizations?.length || 0})
                          </label>
                          <div className="flex items-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => {
                                const presets = [
                                  { name: "Cheddar / Mozzarella (Veg)", price: 99 },
                                  { name: "Bacon (Non-Veg)", price: 150 },
                                  { name: "Ham (Non-Veg) (Choice of Pork Ham or Chicken Ham)", price: 120 },
                                  { name: "Olives / Pickles / Gherkins (Veg)", price: 60 },
                                ];
                                const current = editingItem.customizations || [];
                                const merged = [...current];
                                presets.forEach((p) => {
                                  if (!merged.some((m) => m.name.toLowerCase() === p.name.toLowerCase())) {
                                    merged.push(p);
                                  }
                                });
                                setEditingItem({ ...editingItem, customizations: merged });
                              }}
                              className="text-[10px] text-[#F5E086] hover:underline cursor-pointer"
                            >
                              + Add 4 House Extras
                            </button>
                            {(editingItem.customizations?.length || 0) > 0 && (
                              <button
                                type="button"
                                onClick={() => setEditingItem({ ...editingItem, customizations: [] })}
                                className="text-[10px] text-rose-300 hover:underline ml-2 cursor-pointer"
                              >
                                Clear
                              </button>
                            )}
                          </div>
                        </div>

                        {/* List of currently attached customizations */}
                        {editingItem.customizations && editingItem.customizations.length > 0 ? (
                          <div className="flex flex-wrap gap-1.5">
                            {editingItem.customizations.map((addon, aIdx) => (
                              <div
                                key={aIdx}
                                className="flex items-center gap-1 px-2 py-0.5 rounded-lg bg-[#24332D] border border-white/15 text-[11px] text-white"
                              >
                                <span>{addon.name}</span>
                                <span className="text-[#F5E086] font-mono font-bold">
                                  {addon.price > 0 ? `+₹${addon.price}` : "Free"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    const updated = (editingItem.customizations || []).filter((_, i) => i !== aIdx);
                                    setEditingItem({ ...editingItem, customizations: updated });
                                  }}
                                  className="text-white/40 hover:text-rose-400 ml-0.5 cursor-pointer"
                                >
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-[10px] text-white/40 italic block">
                            No customisation add-ons attached. Click '+ Add 4 House Extras' above to add house add-ons.
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2 pt-1">
                      <button
                        type="submit"
                        className="flex-1 py-2 rounded-xl bg-[#F5E086] text-[#24332D] font-bold text-xs hover:bg-[#F8E79B] transition"
                      >
                        Save Changes
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingItem(null)}
                        className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                </div>
              )}

              <div className="space-y-2">
                {menuItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 rounded-2xl bg-[#2B3D36] border border-white/10 flex items-center justify-between gap-3 text-xs"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-10 h-10 rounded-xl object-cover shrink-0 border border-white/10"
                      />
                      <div>
                        <span className="font-bold text-white block">{item.name}</span>
                        <span className="text-[11px] text-[#F5E086]">₹{item.price}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 bg-[#24332D] px-2 py-1 rounded-xl border border-white/10">
                        <span className="text-white/50 text-[10px]">Stock:</span>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateMenuItem({
                              ...item,
                              stockLeft: Math.max(0, item.stockLeft - 1),
                            })
                          }
                          className="w-5 h-5 rounded bg-white/10 text-white hover:bg-white/20 font-bold"
                        >
                          -
                        </button>
                        <span
                          className={`w-5 text-center font-bold ${
                            item.stockLeft === 0 ? "text-rose-400" : "text-emerald-400"
                          }`}
                        >
                          {item.stockLeft}
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            onUpdateMenuItem({
                              ...item,
                              stockLeft: item.stockLeft + 1,
                            })
                          }
                          className="w-5 h-5 rounded bg-white/10 text-white hover:bg-white/20 font-bold"
                        >
                          +
                        </button>
                      </div>

                      <button
                        type="button"
                        onClick={() => setEditingItem(item)}
                        className="p-1.5 text-white/50 hover:text-[#F5E086] hover:bg-white/10 rounded-lg transition"
                        title="Edit Item Details & Photo"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => onDeleteMenuItem(item.id)}
                        className="p-1.5 text-white/40 hover:text-rose-400 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SEATING */}
          {activeTab === "seating" && (
            <div className="space-y-3 max-w-lg text-xs">
              <div className="p-4 rounded-2xl bg-[#2B3D36] border border-white/10 space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="font-niea font-bold text-sm text-[#F5E086]">
                    Floor Seating Capacity
                  </h4>
                  <span className="font-black text-white text-base">
                    {seating.availableSeats} Available / {seating.totalSeats} Total
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-[#24332D] space-y-2">
                  <div className="flex justify-between text-white/70">
                    <span>Total Physical Capacity:</span>
                    <strong className="text-white">{seating.totalSeats} Seats</strong>
                  </div>
                  <div className="flex justify-between text-white/70">
                    <span>Active Reservation Holds:</span>
                    <strong className="text-[#F5E086]">-{activeHoldsCount} Seats</strong>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-1.5">
                    <span className="text-white font-semibold">Available for Walk-ins:</span>
                    <strong className="text-emerald-400 text-sm">
                      {seating.availableSeats} Seats
                    </strong>
                  </div>
                </div>

                <div>
                  <label className="text-white/60 block mb-1 text-[11px]">
                    Adjust Available Seats:
                  </label>
                  <input
                    type="range"
                    min="0"
                    max={seating.totalSeats}
                    value={seating.availableSeats}
                    onChange={(e) =>
                      onUpdateSeating({
                        ...seating,
                        availableSeats: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full accent-[#F5E086] cursor-pointer"
                  />
                </div>

                <div className="p-4 rounded-xl bg-black/30 border border-[#F5E086]/30 space-y-3 mt-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white/90 font-bold flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span>Live Artisanal Sandwiches Left (FOMO Counter):</span>
                    </span>
                    <strong className="text-[#F5E086] text-base font-niea">
                      {seating.availableSandwiches ?? 38} / {seating.totalSandwiches || 50}
                    </strong>
                  </div>

                  <p className="text-[11px] text-white/60">
                    Set any custom number of sandwiches left today. The live countdown on the customer homepage, header, and order limits syncs instantly.
                  </p>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="text-[10px] text-[#F5E086] font-bold block mb-1">
                        Sandwiches Left Right Now *
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={seating.availableSandwiches ?? 38}
                        onChange={(e) => {
                          const val = Math.max(0, parseInt(e.target.value) || 0);
                          const total = Math.max(val, seating.totalSandwiches || 50);
                          onUpdateSeating({
                            ...seating,
                            totalSandwiches: total,
                            availableSandwiches: val,
                          });
                          setNoticeSentMessage(`✅ Sandwiches left updated to ${val}`);
                          setTimeout(() => setNoticeSentMessage(null), 3000);
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-[#1E2B25] border border-white/20 text-white font-bold text-sm focus:outline-none focus:border-[#F5E086]"
                        placeholder="e.g. 38, 75, 120"
                      />
                    </div>

                    <div>
                      <label className="text-[10px] text-white/70 font-semibold block mb-1">
                        Total Daily Oven Batch
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={seating.totalSandwiches || 50}
                        onChange={(e) => {
                          const val = Math.max(1, parseInt(e.target.value) || 50);
                          onUpdateSeating({
                            ...seating,
                            totalSandwiches: val,
                            availableSandwiches: Math.min(val, seating.availableSandwiches ?? 38),
                          });
                          setNoticeSentMessage(`✅ Total batch capacity set to ${val}`);
                          setTimeout(() => setNoticeSentMessage(null), 3000);
                        }}
                        className="w-full px-3 py-2 rounded-xl bg-[#1E2B25] border border-white/20 text-white font-bold text-sm focus:outline-none focus:border-[#F5E086]"
                        placeholder="e.g. 50, 100, 200"
                      />
                    </div>
                  </div>

                  {/* Quick Increment / Decrement Stepper Buttons */}
                  <div className="flex flex-wrap items-center gap-1.5 pt-1">
                    <span className="text-[10px] text-white/50 mr-1">Quick Adjust:</span>
                    {[-10, -5, +5, +10, +25].map((delta) => (
                      <button
                        key={delta}
                        type="button"
                        onClick={() => {
                          const cur = seating.availableSandwiches ?? 38;
                          const nextVal = Math.max(0, cur + delta);
                          const total = Math.max(nextVal, seating.totalSandwiches || 50);
                          onUpdateSeating({
                            ...seating,
                            totalSandwiches: total,
                            availableSandwiches: nextVal,
                          });
                          setNoticeSentMessage(`Sandwiches count: ${nextVal}`);
                          setTimeout(() => setNoticeSentMessage(null), 3000);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white text-[11px] font-bold transition active:scale-95"
                      >
                        {delta > 0 ? `+${delta}` : delta}
                      </button>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateSeating({
                          ...seating,
                          totalSandwiches: 50,
                          availableSandwiches: 50,
                        });
                        setNoticeSentMessage("Reset batch to fresh 50");
                        setTimeout(() => setNoticeSentMessage(null), 3000);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold hover:bg-emerald-500/30 transition"
                    >
                      Reset 50
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onUpdateSeating({
                          ...seating,
                          totalSandwiches: 100,
                          availableSandwiches: 100,
                        });
                        setNoticeSentMessage("Set batch to 100");
                        setTimeout(() => setNoticeSentMessage(null), 3000);
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold hover:bg-emerald-500/30 transition"
                    >
                      Set 100
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: ADD ITEM */}
          {activeTab === "new-item" && (
            <form onSubmit={handleCreateItem} className="space-y-3.5 max-w-lg text-xs pb-4">
              <div className="flex items-center justify-between">
                <h4 className="font-niea font-bold text-sm text-[#F5E086]">
                  Add New Menu Item
                </h4>
                <span className="text-[11px] text-white/50">
                  Adds directly to live menu & stock
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="text-white/70 block mb-1 font-semibold">Item Name *</label>
                  <input
                    type="text"
                    required
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="e.g. Truffle Mushroom Sourdough Melt"
                    className="w-full px-3 py-2 rounded-xl bg-[#2B3D36] border border-white/10 text-white focus:outline-none focus:border-[#F5E086]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-white/70 block mb-1 font-semibold">Price (₹) *</label>
                    <input
                      type="number"
                      required
                      value={newPrice}
                      onChange={(e) => setNewPrice(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#2B3D36] border border-white/10 text-white focus:outline-none focus:border-[#F5E086]"
                    />
                  </div>

                  <div>
                    <label className="text-white/70 block mb-1 font-semibold">Daily Stock</label>
                    <input
                      type="number"
                      value={newStock}
                      onChange={(e) => setNewStock(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#2B3D36] border border-white/10 text-white focus:outline-none focus:border-[#F5E086]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="text-white/70 block mb-1 font-semibold">Category</label>
                    <select
                      value={newCategory}
                      onChange={(e) => setNewCategory(e.target.value as MenuCategory)}
                      className="w-full px-3 py-2 rounded-xl bg-[#2B3D36] border border-white/10 text-white focus:outline-none focus:border-[#F5E086]"
                    >
                      <option value="burgers">OG NiEa's Burgers</option>
                      <option value="hot-picks">NiEa's Hot Picks</option>
                      <option value="green-room">The Green Room</option>
                      <option value="sides">Sides</option>
                      <option value="drinkables">Drinkables</option>
                      <option value="seasonal">Specialty & Seasonal</option>
                      <option value="sandwiches">Gourmet Sandwiches</option>
                      <option value="toasties">Melt Toasties</option>
                      <option value="bakery">Bakes & Sweet</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-white/70 block mb-1 font-semibold">Dietary Type</label>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setNewIsVeg(true)}
                        className={`flex-1 py-2 px-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                          newIsVeg
                            ? "bg-emerald-950/60 border-emerald-400 text-emerald-300"
                            : "bg-[#2B3D36] border-white/10 text-white/50"
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-emerald-400" />
                        <span>Veg</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setNewIsVeg(false)}
                        className={`flex-1 py-2 px-2 rounded-xl border text-xs font-semibold flex items-center justify-center gap-1.5 transition ${
                          !newIsVeg
                            ? "bg-rose-950/60 border-rose-400 text-rose-300"
                            : "bg-[#2B3D36] border-white/10 text-white/50"
                        }`}
                      >
                        <span className="w-2 h-2 rounded-full bg-rose-400" />
                        <span>Non-Veg</span>
                      </button>
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-white/70 block mb-1 font-semibold">Description</label>
                  <input
                    type="text"
                    value={newDesc}
                    onChange={(e) => setNewDesc(e.target.value)}
                    placeholder="Signature breads, melted cheeses, fresh house fillings..."
                    className="w-full px-3 py-2 rounded-xl bg-[#2B3D36] border border-white/10 text-white focus:outline-none focus:border-[#F5E086]"
                  />
                </div>

                {/* Add Image Option */}
                <div>
                  <ImagePickerField
                    label="Add Item Image / Photo"
                    value={newImageUrl}
                    onChange={setNewImageUrl}
                    helpText="Upload a photo from your device/photos, paste a web image link, or pick from our artisanal bakery presets."
                  />
                </div>

                {/* Customisation Add-ons / Extras for Menu Item */}
                <div className="p-3.5 rounded-2xl bg-[#23352E] border border-[#F5E086]/25 space-y-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <label className="font-niea font-bold text-xs text-[#F5E086] block">
                        Customisation Add-ons & Extras ({newItemAddons.length})
                      </label>
                      <span className="text-[10px] text-white/60">
                        These extras appear in the customer customisation popup before adding to cart.
                      </span>
                    </div>
                    {newItemAddons.length > 0 && (
                      <button
                        type="button"
                        onClick={() => setNewItemAddons([])}
                        className="text-[10px] text-rose-300 hover:text-rose-200 underline cursor-pointer"
                      >
                        Clear All
                      </button>
                    )}
                  </div>

                  {/* Preset Quick Add Buttons */}
                  <div>
                    <span className="text-[10px] text-white/50 block mb-1.5 font-semibold uppercase tracking-wider">
                      Quick Add House Extras:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleAddPresetAddon("Cheddar / Mozzarella (Veg)", 99)}
                        className="px-2.5 py-1 rounded-lg bg-[#2B3D36] hover:bg-[#344840] border border-white/15 text-white/90 text-[11px] font-medium transition cursor-pointer"
                      >
                        + Cheese (₹99)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddPresetAddon("Bacon (Non-Veg)", 150)}
                        className="px-2.5 py-1 rounded-lg bg-[#2B3D36] hover:bg-[#344840] border border-white/15 text-white/90 text-[11px] font-medium transition cursor-pointer"
                      >
                        + Bacon (₹150)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddPresetAddon("Ham (Non-Veg) (Choice of Pork Ham or Chicken Ham)", 120)}
                        className="px-2.5 py-1 rounded-lg bg-[#2B3D36] hover:bg-[#344840] border border-white/15 text-white/90 text-[11px] font-medium transition cursor-pointer"
                      >
                        + Ham (₹120)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddPresetAddon("Olives / Pickles / Gherkins (Veg)", 60)}
                        className="px-2.5 py-1 rounded-lg bg-[#2B3D36] hover:bg-[#344840] border border-white/15 text-white/90 text-[11px] font-medium transition cursor-pointer"
                      >
                        + Pickles/Olives (₹60)
                      </button>
                      <button
                        type="button"
                        onClick={handleAddAllPresetAddons}
                        className="px-2.5 py-1 rounded-lg bg-[#F5E086]/20 hover:bg-[#F5E086]/30 border border-[#F5E086]/40 text-[#F5E086] text-[11px] font-bold transition cursor-pointer"
                      >
                        + Add All 4 Extras
                      </button>
                    </div>
                  </div>

                  {/* Custom Extra Creator Row */}
                  <div className="flex items-center gap-2 pt-1 border-t border-white/10">
                    <input
                      type="text"
                      placeholder="Add-on Name (e.g. Double Patty, Truffle Mayo)"
                      value={addonInputName}
                      onChange={(e) => setAddonInputName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddNewItemAddon();
                        }
                      }}
                      className="flex-1 px-3 py-1.5 rounded-xl bg-[#2B3D36] border border-white/10 text-white text-xs focus:outline-none focus:border-[#F5E086]"
                    />
                    <div className="w-24 flex items-center bg-[#2B3D36] rounded-xl border border-white/10 px-2 py-1.5">
                      <span className="text-white/40 text-xs mr-1">₹</span>
                      <input
                        type="number"
                        min="0"
                        placeholder="Price"
                        value={addonInputPrice}
                        onChange={(e) => setAddonInputPrice(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddNewItemAddon();
                          }
                        }}
                        className="w-full bg-transparent text-white font-mono text-xs focus:outline-none"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={handleAddNewItemAddon}
                      className="px-3 py-1.5 rounded-xl bg-[#F5E086] text-[#24332D] font-bold text-xs hover:bg-[#F8E79B] transition shrink-0 cursor-pointer shadow-sm"
                    >
                      + Add
                    </button>
                  </div>

                  {/* Active Extras Tags List */}
                  {newItemAddons.length > 0 ? (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {newItemAddons.map((addon, idx) => (
                        <div
                          key={idx}
                          className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-[#2B3D36] border border-[#F5E086]/30 text-white text-xs"
                        >
                          <span className="font-medium">{addon.name}</span>
                          <span className="text-[#F5E086] font-bold font-mono">
                            {addon.price > 0 ? `+₹${addon.price}` : "Free"}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleRemoveNewItemAddon(idx)}
                            className="p-0.5 text-white/50 hover:text-rose-400 transition cursor-pointer ml-1"
                            title={`Remove "${addon.name}"`}
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-white/40 italic">
                      No customisation add-ons configured. Click presets above or create custom ones.
                    </p>
                  )}
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl bg-[#F5E086] text-[#24332D] font-bold text-xs hover:bg-[#F8E79B] transition flex items-center justify-center gap-1.5 shadow-md cursor-pointer active:scale-98"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Publish Item to Menu</span>
              </button>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-white/10 bg-[#2B3D36] flex items-center justify-between">
          <div className="flex items-center gap-2">
            {!isAiDrawerOpen && activeTab !== "ai-assistant" && (
              <button
                type="button"
                onClick={() => setIsAiDrawerOpen(true)}
                className="px-3 py-1.5 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 text-amber-300 border border-amber-400/40 text-xs font-bold transition flex items-center gap-1.5 shadow-sm"
                title="Open Floating NiEA Assistant"
              >
                <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                <span>Floating NiEA Assistant</span>
              </button>
            )}
          </div>
          <button
            onClick={onClose}
            className="px-5 py-1.5 rounded-full bg-[#F5E086] text-[#24332D] font-bold text-xs hover:bg-[#F8E79B] transition"
          >
            Done
          </button>
        </div>

        {/* Global Staff Portal Offline Notification Toast (Rendered when outside kanban to prevent double-toast) */}
        {activeTab !== "kanban" && (
          <OfflineSyncToast bufferedTicketsCount={liveOrders.length} />
        )}

        {/* Floating NiEA Assistant Drawer / Widget (Allows chatting from any tab) */}
        {isAiDrawerOpen && (
          <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[420px] max-w-[calc(100vw-2rem)] h-[580px] max-h-[85vh] shadow-2xl rounded-2xl overflow-hidden border border-amber-400/50 bg-[#1A2621] flex flex-col animate-in slide-in-from-bottom-5 duration-200">
            <OwnerAiChatbot
              menuItems={menuItems}
              onUpdateMenuItem={onUpdateMenuItem}
              seating={seating}
              onUpdateSeating={onUpdateSeating}
              liveOrders={liveOrders}
              onAddOrder={onAddOrder}
              onOpenKot={onOpenKot}
              onUpdateOrderStatus={onUpdateOrderStatus}
              onUpdateOrderTimeLeft={onUpdateOrderTimeLeft}
              onSendOrderNotification={onSendOrderNotification}
              cafeHighlight={cafeHighlight}
              onUpdateCafeHighlight={onUpdateCafeHighlight}
              reservations={reservations}
              posRecords={posRecords}
              preBookingConfig={preBookingConfig}
              onUpdatePreBookingConfig={onUpdatePreBookingConfig}
              onSwitchTab={(tab) => {
                setActiveTab(tab as PortalTab);
              }}
              analyticsDate={analyticsDate}
              getStoreAnalyticsSummary={getStoreAnalyticsSummary}
              mode="drawer"
              onClose={() => setIsAiDrawerOpen(false)}
            />
          </div>
        )}
      </>
    )}
  </div>
</div>
  );
};
