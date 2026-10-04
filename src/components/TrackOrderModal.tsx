import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  Clock,
  CheckCircle2,
  Flame,
  Utensils,
  ShoppingBag,
  MapPin,
  Phone,
  Download,
  RotateCcw,
  Search,
  Copy,
  Check,
  Sparkles,
  AlertCircle,
  ChefHat,
  MessageSquareShare,
  RefreshCw,
  Info,
  Timer,
  Bell,
  FileText,
  Ticket,
  Tv,
  MessageSquare,
} from "lucide-react";
import { OrderRecord, CartItem, OrderNotification, UserSession, WhatsAppTemplatesConfig } from "../types/niea";
import { generateInvoicePdf } from "../utils/generateInvoicePdf";
import { ORDER_STEPS, getOrderStepProgress } from "../utils/orderStepProgress";
import { formatTokenNumber } from "../utils/tokenHelper";
import { generateOrderCancellationRequestWhatsAppUrl } from "../utils/whatsappHelper";

interface TrackOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: OrderRecord[];
  initialOrderNumber?: string | null;
  onReorder?: (items: CartItem[]) => void;
  onOpenFeedback?: (order: OrderRecord) => void;
  onNavigateToMenu?: () => void;
  userSession?: UserSession | null;
  myOrderIds?: string[];
  onOpenAuth?: () => void;
  onOpenLiveCallingBoard?: (tokenNumber?: string) => void;
  onCancelOrder?: (orderId: string) => void;
  whatsappConfig?: WhatsAppTemplatesConfig;
}

type OrderStatus = "received" | "toasting" | "ready" | "served" | "cancelled";

const STEPS: {
  status: OrderStatus;
  title: string;
  dineInDesc: string;
  takeawayDesc: string;
  detail: string;
}[] = [
  {
    status: "received",
    title: "Order Received",
    dineInDesc: "Order received by kitchen staff • Table assigned",
    takeawayDesc: "Order confirmed • Added to takeaway queue",
    detail: "Ingredients prepped & ticket confirmed",
  },
  {
    status: "toasting",
    title: "Artisan Toasting",
    dineInDesc: "Grilling on cast-iron & drinks freshly whisked",
    takeawayDesc: "Fresh sourdough toasted with cultured butter",
    detail: "Melting cheese & building crispy crust",
  },
  {
    status: "ready",
    title: "Hot & Ready",
    dineInDesc: "Ready to be served to your table",
    takeawayDesc: "Packed in thermal eco-bag for pickup at counter",
    detail: "Freshly garnished & inspected by chef",
  },
  {
    status: "served",
    title: "Served & Enjoyed",
    dineInDesc: "Delivered to your table • Bon appétit!",
    takeawayDesc: "Handed over to guest • Enjoy!",
    detail: "Thank you for dining with NiEA'S!",
  },
];

const STATUS_PROGRESS: Record<OrderStatus, number> = {
  received: 25,
  toasting: 60,
  ready: 90,
  served: 100,
  cancelled: 0,
};

// Calculate initial countdown remaining seconds based on order status, staff estimate, and timestamp
const getInitialCountdownSeconds = (order: OrderRecord | null | undefined): number => {
  if (!order) return 0;
  if (order.status === "ready" || order.status === "served") return 0;

  if (typeof order.estimatedMinutesLeft === "number") {
    return Math.max(0, order.estimatedMinutesLeft * 60);
  }

  const orderTime = new Date(order.createdAt).getTime();
  const now = Date.now();
  const elapsed =
    !isNaN(orderTime) && orderTime > 0
      ? Math.max(0, Math.floor((now - orderTime) / 1000))
      : 0;

  if (order.status === "received") {
    const totalAllocated = 10 * 60; // 10 minutes total
    if (elapsed > 0 && elapsed < totalAllocated) {
      return totalAllocated - elapsed;
    }
    return 9 * 60 + 30; // 9m 30s
  }

  if (order.status === "toasting") {
    const totalAllocated = 5 * 60; // 5 minutes toasting
    if (elapsed > 0 && elapsed < 10 * 60) {
      const rem = 10 * 60 - elapsed;
      return rem > 30 ? Math.min(rem, 5 * 60) : 4 * 60 + 15;
    }
    return 4 * 60 + 20; // 4m 20s
  }

  return 0;
};

export const TrackOrderModal: React.FC<TrackOrderModalProps> = ({
  isOpen,
  onClose,
  orders,
  initialOrderNumber,
  onReorder,
  onOpenFeedback,
  onNavigateToMenu,
  userSession,
  myOrderIds = [],
  onOpenAuth,
  onOpenLiveCallingBoard,
  onCancelOrder,
  whatsappConfig,
}) => {
  const [selectedOrderNumber, setSelectedOrderNumber] = useState<string>("");
  const [copiedId, setCopiedId] = useState(false);
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [showCancelContactPrompt, setShowCancelContactPrompt] = useState(false);

  // Secure 2-factor lookup state for manual tracking
  const [lookupOrderNumber, setLookupOrderNumber] = useState("");
  const [lookupPhone, setLookupPhone] = useState(userSession?.phoneNumber || "");
  const [lookupError, setLookupError] = useState("");
  const [unlockedOrderIds, setUnlockedOrderIds] = useState<string[]>([]);

  // Remaining seconds for visual countdown timer
  const [remainingSeconds, setRemainingSeconds] = useState<number>(0);

  // 10-second confirmation cancellation timer calculation
  const [orderAgeSeconds, setOrderAgeSeconds] = useState<number>(0);

  // Filter strictly to orders placed by THIS user/session
  const myOrders = useMemo(() => {
    const userPhoneClean = userSession?.phoneNumber?.replace(/\D/g, "").slice(-10);
    const sessionIds = [...myOrderIds, ...unlockedOrderIds];

    return orders.filter((o) => {
      // 1. Placed in this device/browser session or unlocked via verified lookup
      if (
        sessionIds.includes(o.id) ||
        sessionIds.includes(o.orderNumber) ||
        (o.tokenNumber && sessionIds.includes(o.tokenNumber))
      ) {
        return true;
      }
      // 2. User phone matches exactly (last 10 digits)
      if (userPhoneClean && o.customerPhone) {
        const oPhoneClean = o.customerPhone.replace(/\D/g, "").slice(-10);
        if (oPhoneClean && oPhoneClean === userPhoneClean) {
          return true;
        }
      }
      return false;
    });
  }, [orders, userSession, myOrderIds, unlockedOrderIds]);

  // Initialize selected order when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (initialOrderNumber) {
      setSelectedOrderNumber(initialOrderNumber);
    } else if (myOrders.length > 0) {
      // Prioritize user's active order, else their first order
      const active = myOrders.find((o) => o.status !== "served");
      setSelectedOrderNumber(active ? active.orderNumber : myOrders[0].orderNumber);
    } else {
      setSelectedOrderNumber("");
    }
  }, [isOpen, initialOrderNumber, myOrders]);

  // Find the selected order strictly within user's accessible orders
  const currentOrder = useMemo(() => {
    if (!selectedOrderNumber && myOrders.length > 0) {
      return myOrders[0];
    }
    return myOrders.find(
      (o) =>
        o.orderNumber.toLowerCase() === selectedOrderNumber.toLowerCase() ||
        (o.tokenNumber && o.tokenNumber.toLowerCase() === selectedOrderNumber.toLowerCase()) ||
        o.id === selectedOrderNumber
    );
  }, [myOrders, selectedOrderNumber]);

  // Calculate waiting queue position and orders ahead for current order
  const ordersAheadCount = useMemo(() => {
    if (!currentOrder || currentOrder.status === "ready" || currentOrder.status === "served") {
      return 0;
    }
    const preparingQueue = orders.filter(
      (o) => o.status === "received" || o.status === "toasting"
    );
    const idx = preparingQueue.findIndex(
      (o) => o.id === currentOrder.id || o.orderNumber === currentOrder.orderNumber
    );
    return idx >= 0 ? idx : 0;
  }, [orders, currentOrder]);

  // Check order age for 10-second confirmation cancellation window
  useEffect(() => {
    if (!currentOrder) return;
    const calculateAge = () => {
      const orderCreatedTime = new Date(currentOrder.createdAt).getTime();
      const now = Date.now();
      if (!isNaN(orderCreatedTime) && orderCreatedTime > 0) {
        setOrderAgeSeconds(Math.max(0, Math.floor((now - orderCreatedTime) / 1000)));
      } else {
        setOrderAgeSeconds(999);
      }
    };
    calculateAge();
    const interval = setInterval(calculateAge, 1000);
    return () => clearInterval(interval);
  }, [currentOrder]);

  const isWithin10SecGrace = orderAgeSeconds < 10;
  const graceSecondsLeft = Math.max(0, 10 - orderAgeSeconds);

  const handleCancelClick = () => {
    if (!currentOrder) return;
    if (isWithin10SecGrace) {
      if (
        window.confirm(
          `Cancel Order #${currentOrder.orderNumber}? You are within the 10-second confirmation window, so your order will be cancelled immediately.`
        )
      ) {
        onCancelOrder?.(currentOrder.id);
        setToastMessage(`Order #${currentOrder.orderNumber} has been successfully cancelled.`);
      }
    } else {
      // Past 10-second window -> redirect to WhatsApp with owner pre-filled message
      const waUrl = generateOrderCancellationRequestWhatsAppUrl(currentOrder, whatsappConfig);
      window.open(waUrl, "_blank", "noopener,noreferrer");
      setShowCancelContactPrompt(true);
      setToastMessage(
        `Redirecting to WhatsApp to contact store owner (+91 ${whatsappConfig?.ownerAlertPhone || "8274047424"}) for order cancellation.`
      );
    }
  };

  // Handle verified manual lookup
  const handleVerifyLookup = (e: React.FormEvent) => {
    e.preventDefault();
    setLookupError("");

    const targetNum = lookupOrderNumber.trim().toLowerCase();
    const targetPhoneClean = lookupPhone.trim().replace(/\D/g, "").slice(-10);

    if (!targetNum) {
      setLookupError("Please enter your Order # (e.g. NIEA-1024 or T102)");
      return;
    }
    if (!targetPhoneClean || targetPhoneClean.length < 10) {
      setLookupError("Please enter your 10-digit mobile number used during ordering");
      return;
    }

    const matched = orders.find((o) => {
      const ordNum = o.orderNumber.toLowerCase();
      const tokNum = o.tokenNumber ? o.tokenNumber.toLowerCase() : "";
      const matchesNumber = ordNum.includes(targetNum) || tokNum.includes(targetNum) || o.id === targetNum;

      const oPhoneClean = (o.customerPhone || "").replace(/\D/g, "").slice(-10);
      const matchesPhone = oPhoneClean === targetPhoneClean;

      return matchesNumber && matchesPhone;
    });

    if (matched) {
      setUnlockedOrderIds((prev) => [...prev, matched.id]);
      setSelectedOrderNumber(matched.orderNumber);
      setToastMessage(`Order ${matched.orderNumber} successfully verified!`);
      setTimeout(() => setToastMessage(null), 3000);
    } else {
      setLookupError(
        "No order found matching both this Order Number and Phone Number. Please check your receipt details."
      );
    }
  };

  // Sync remaining seconds when selected order, status, or staff estimate changes
  useEffect(() => {
    setRemainingSeconds(getInitialCountdownSeconds(currentOrder));
  }, [
    currentOrder?.id,
    currentOrder?.status,
    currentOrder?.estimatedMinutesLeft,
    currentOrder?.lastTimeLeftUpdated,
  ]);

  // Live 1-second countdown ticker for active orders
  useEffect(() => {
    if (!isOpen || !currentOrder) return;
    if (currentOrder.status !== "received" && currentOrder.status !== "toasting") return;

    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) return 0;
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isOpen, currentOrder?.id, currentOrder?.status]);

  // Computed countdown metrics for visual timer
  const totalWindowSeconds = currentOrder?.status === "received" ? 600 : 300;
  const elapsedSeconds = Math.max(0, totalWindowSeconds - remainingSeconds);
  const countdownProgressPercent = Math.min(
    100,
    Math.max(0, Math.round((elapsedSeconds / totalWindowSeconds) * 100))
  );

  const countdownMinutes = Math.floor(remainingSeconds / 60);
  const countdownSecs = remainingSeconds % 60;
  const formattedCountdown = `${countdownMinutes.toString().padStart(2, "0")}:${countdownSecs
    .toString()
    .padStart(2, "0")}`;

  const estimatedDeliveryClockTime = useMemo(() => {
    if (remainingSeconds <= 0) return "Moments away";
    const d = new Date(Date.now() + remainingSeconds * 1000);
    return d.toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
  }, [remainingSeconds]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleCopyOrderNumber = (num: string) => {
    navigator.clipboard?.writeText(num);
    setCopiedId(true);
    showToast(`Order #${num} copied to clipboard.`);
    setTimeout(() => setCopiedId(false), 2000);
  };

  const handleDownloadInvoice = () => {
    if (!currentOrder) return;
    try {
      setDownloadingInvoice(true);
      generateInvoicePdf(currentOrder);
      showToast(`Invoice for ${currentOrder.orderNumber} downloaded.`);
    } catch (e) {
      console.error(e);
      showToast("Unable to generate PDF invoice.");
    } finally {
      setTimeout(() => setDownloadingInvoice(false), 600);
    }
  };

  if (!isOpen) return null;

  const stepProgress = currentOrder ? getOrderStepProgress(currentOrder) : null;
  const currentStepIndex = stepProgress ? stepProgress.currentStepIndex : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-2xl bg-[#374C44] rounded-3xl border-2 border-[#F5E086]/35 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#F5E086]/20 bg-[#2B3D36] flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-[#F5E086]/15 border border-[#F5E086]/30 flex items-center justify-center text-[#F5E086] shrink-0">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-niea font-bold text-lg text-[#F5E086]">
                  Live Order Tracker
                </h3>
                {myOrders.filter((o) => o.status !== "served").length > 0 && (
                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 text-[10px] font-bold">
                    {myOrders.filter((o) => o.status !== "served").length} In Progress
                  </span>
                )}
              </div>
              <p className="text-xs text-[#FBF9F2]/70">
                Real-time kitchen updates • Handcrafted sourdough & artisanal brews
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#FBF9F2]/70 hover:text-white hover:bg-white/10 transition"
            aria-label="Close live tracker"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* User's Order Selector (Shown only when user has multiple accessible orders) */}
        {myOrders.length > 1 && (
          <div className="bg-[#24332D] px-4 py-2.5 border-b border-white/10 flex items-center gap-2 overflow-x-auto scrollbar-none">
            <span className="text-[10px] uppercase font-bold text-white/50 shrink-0">
              Your Orders:
            </span>
            {myOrders.map((ord) => {
              const isSelected = currentOrder?.id === ord.id;
              const isDone = ord.status === "served";
              return (
                <button
                  key={ord.id}
                  onClick={() => setSelectedOrderNumber(ord.orderNumber)}
                  className={`px-2.5 py-1 rounded-full text-xs font-mono font-bold transition shrink-0 flex items-center gap-1.5 ${
                    isSelected
                      ? "bg-[#F5E086] text-[#24332D] shadow-xs"
                      : "bg-[#374C44] text-white/80 hover:bg-[#3E564D] border border-white/10"
                  }`}
                >
                  <span
                    className={`w-1.5 h-1.5 rounded-full ${
                      isDone ? "bg-white/40" : "bg-emerald-400 animate-pulse"
                    }`}
                  />
                  <span>{ord.tokenNumber || ord.orderNumber}</span>
                </button>
              );
            })}
            <button
              onClick={() => setSelectedOrderNumber("")}
              className="px-2.5 py-1 rounded-full text-xs font-bold bg-[#1B2823] text-white/70 hover:text-white hover:bg-white/10 border border-white/10 transition shrink-0 flex items-center gap-1"
              title="Look up another order"
            >
              <Search className="w-3 h-3 text-[#F5E086]" />
              <span>+ Look Up</span>
            </button>
          </div>
        )}

        {/* Toast Alert */}
        {toastMessage && (
          <div className="bg-emerald-600 text-white text-xs font-semibold py-1.5 px-4 text-center animate-in fade-in duration-150">
            {toastMessage}
          </div>
        )}

        {/* Main Content Area */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 space-y-4">
          {!currentOrder ? (
            /* Secure Lookup & Empty State */
            <div className="py-6 space-y-6 max-w-md mx-auto">
              <div className="text-center space-y-2">
                <div className="w-14 h-14 mx-auto rounded-3xl bg-[#F5E086]/10 border border-[#F5E086]/30 flex items-center justify-center text-[#F5E086]">
                  <Utensils className="w-7 h-7" />
                </div>
                <h4 className="font-bold text-lg text-white">Track Your Order</h4>
                <p className="text-xs text-white/60">
                  {userSession?.isLoggedIn
                    ? `No active orders found for account (${userSession.phoneNumber || userSession.email}). You can look up counter or past receipts below.`
                    : "Sign in to see your active orders, or verify with your Order # and Phone Number."}
                </p>
              </div>

              {!userSession?.isLoggedIn && onOpenAuth && (
                <div className="p-3.5 rounded-2xl bg-[#2B3D36] border border-[#F5E086]/20 flex items-center justify-between text-xs">
                  <span className="text-white/80">Already have an account?</span>
                  <button
                    onClick={() => {
                      onClose();
                      onOpenAuth();
                    }}
                    className="px-3.5 py-1.5 rounded-full bg-[#F5E086] text-[#24332D] font-bold text-xs hover:bg-[#F8E79B] transition"
                  >
                    Sign In
                  </button>
                </div>
              )}

              {/* Secure 2-Field Lookup Form */}
              <form onSubmit={handleVerifyLookup} className="bg-[#2B3D36] p-4 sm:p-5 rounded-2xl border border-white/10 space-y-3">
                <span className="text-xs uppercase font-extrabold tracking-wider text-[#F5E086] block">
                  Look Up Receipt / Counter Order
                </span>

                {lookupError && (
                  <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-400/30 text-rose-300 text-xs flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
                    <span>{lookupError}</span>
                  </div>
                )}

                <div>
                  <label className="text-[10px] text-white/60 font-semibold block mb-1">
                    Order Number or Token # *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. NIEA-1024 or T102"
                    value={lookupOrderNumber}
                    onChange={(e) => setLookupOrderNumber(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#1C2723] border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#F5E086]"
                  />
                </div>

                <div>
                  <label className="text-[10px] text-white/60 font-semibold block mb-1">
                    10-Digit Mobile Number used during ordering *
                  </label>
                  <input
                    type="tel"
                    placeholder="10-digit mobile number"
                    value={lookupPhone}
                    onChange={(e) => setLookupPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#1C2723] border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#F5E086]"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-2.5 rounded-full bg-[#F5E086] hover:bg-[#F8E79B] text-[#24332D] font-bold text-xs transition shadow-md flex items-center justify-center gap-2"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Verify & Track Order</span>
                </button>
              </form>

              {onOpenLiveCallingBoard && (
                <div className="p-3.5 rounded-2xl bg-[#1E2B25] border border-white/10 flex items-center justify-between text-xs">
                  <div>
                    <span className="text-white font-bold block">Waiting at the Cafe?</span>
                    <span className="text-[11px] text-white/60">Watch live tokens moving on TV calling screen</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenLiveCallingBoard();
                    }}
                    className="px-3.5 py-1.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-[#17221D] font-bold text-xs flex items-center gap-1.5 transition shadow-sm"
                  >
                    <Tv className="w-3.5 h-3.5" />
                    <span>Live Queue Board</span>
                  </button>
                </div>
              )}

              {onNavigateToMenu && (
                <div className="text-center pt-2">
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToMenu();
                    }}
                    className="text-xs text-[#F5E086] hover:underline font-bold"
                  >
                    Browse Artisanal Menu & Order →
                  </button>
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Prominent McDonald's / Cafe Calling Token Box */}
              <div className="p-4 sm:p-5 rounded-3xl bg-gradient-to-br from-[#202E28] to-[#17221D] border-2 border-[#F5E086]/50 shadow-xl space-y-4">
                <div className="flex items-center justify-between gap-2 border-b border-white/10 pb-3">
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-[#F5E086]/15 text-[#F5E086] border border-[#F5E086]/30">
                      <Ticket className="w-4 h-4" />
                    </span>
                    <div>
                      <span className="text-[10px] uppercase font-black tracking-widest text-[#F5E086] block">
                        YOUR CALLING TOKEN NUMBER
                      </span>
                      <span className="text-[11px] text-white/60">
                        Order #{currentOrder.orderNumber}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopyOrderNumber(currentOrder.orderNumber)}
                      className="px-2.5 py-1 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 hover:text-white transition flex items-center gap-1 text-[11px]"
                      title="Copy Order ID"
                    >
                      {copiedId ? (
                        <Check className="w-3 h-3 text-emerald-400" />
                      ) : (
                        <Copy className="w-3 h-3" />
                      )}
                      <span>{copiedId ? "Copied" : "Copy #"}</span>
                    </button>

                    {onOpenLiveCallingBoard && (
                      <button
                        type="button"
                        onClick={() => {
                          onClose();
                          onOpenLiveCallingBoard(currentOrder.tokenNumber);
                        }}
                        className="px-3 py-1 rounded-full bg-emerald-500 hover:bg-emerald-400 text-[#17221D] font-bold text-xs transition shadow-sm flex items-center gap-1"
                        title="Watch token calling screen"
                      >
                        <Tv className="w-3 h-3" />
                        <span>TV Board</span>
                      </button>
                    )}

                    {(currentOrder.status === "received" || currentOrder.status === "toasting") && onCancelOrder && (
                      <button
                        type="button"
                        onClick={handleCancelClick}
                        className={`px-3 py-1 rounded-full font-bold text-xs transition shadow-sm flex items-center gap-1 active:scale-95 cursor-pointer ${
                          isWithin10SecGrace
                            ? "bg-rose-500 hover:bg-rose-400 text-white animate-pulse"
                            : "bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30"
                        }`}
                        title={
                          isWithin10SecGrace
                            ? `Cancel order instantly (${graceSecondsLeft}s left)`
                            : "Contact store owner on WhatsApp to cancel"
                        }
                      >
                        {isWithin10SecGrace ? (
                          <>
                            <X className="w-3.5 h-3.5" />
                            <span>Cancel ({graceSecondsLeft}s)</span>
                          </>
                        ) : (
                          <>
                            <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Cancel (WhatsApp)</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Cancelled Order Banner */}
                {currentOrder.status === "cancelled" && (
                  <div className="p-4 rounded-2xl bg-rose-500/20 border-2 border-rose-500/40 text-left space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-rose-300 flex items-center gap-1.5">
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                        <span>Order Cancelled</span>
                      </span>
                      <span className="px-2 py-0.5 rounded-md bg-rose-950/60 text-rose-300 font-mono text-[10px] font-bold">
                        Cancelled
                      </span>
                    </div>
                    <p className="text-[11px] text-white/80 leading-relaxed">
                      This order has been cancelled. If you have any inquiries regarding your payment refund or order confirmation, please message our store owner directly.
                    </p>
                    <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                      <span className="text-[11px] text-[#F5E086] font-semibold flex items-center gap-1">
                        <Phone className="w-3.5 h-3.5" />
                        <span>+91 {whatsappConfig?.ownerAlertPhone || "8274047424"}</span>
                      </span>
                      <a
                        href={generateOrderCancellationRequestWhatsAppUrl(currentOrder, whatsappConfig)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1 shadow-sm"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Message Owner on WhatsApp</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* WhatsApp Cancellation Prompt after 10s */}
                {showCancelContactPrompt && currentOrder.status !== "cancelled" && (
                  <div className="p-4 rounded-2xl bg-[#23352E] border border-white/10 text-left space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Flame className="w-4 h-4 text-amber-400" />
                        <span>Artisan Toasting & Kitchen Prep Active</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setShowCancelContactPrompt(false)}
                        className="text-white/40 hover:text-white"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <p className="text-[11px] text-white/75 leading-relaxed">
                      The 10-second confirmation window has elapsed and the kitchen has begun preparation. We've opened WhatsApp with our store owner's number (+91 {whatsappConfig?.ownerAlertPhone || "8274047424"}) so they can assist you with your cancellation request.
                    </p>
                    <div className="pt-1 flex items-center justify-end">
                      <a
                        href={generateOrderCancellationRequestWhatsAppUrl(currentOrder, whatsappConfig)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-3 py-1 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1"
                      >
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span>Open WhatsApp Chat</span>
                      </a>
                    </div>
                  </div>
                )}

                {/* Big Token Number Display */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-baseline gap-3">
                    <div className="font-niea font-black text-5xl sm:text-6xl text-[#F5E086] tracking-wider drop-shadow-md">
                      {formatTokenNumber(currentOrder.tokenNumber)}
                    </div>
                    <div className="space-y-0.5">
                      <span className="text-xs font-bold text-white block">
                        {currentOrder.orderType === "dine-in"
                          ? `Dine-in (Table ${currentOrder.tableNumber || "1"})`
                          : "Counter Takeaway Pickup"}
                      </span>
                      <span className="text-[11px] text-white/60 block">
                        {currentOrder.status === "ready"
                          ? "Ready at counter! Please collect."
                          : "Please watch the counter calling display"}
                      </span>
                    </div>
                  </div>

                  {/* Estimated preparation clock */}
                  <div className="sm:text-right bg-black/20 p-2.5 rounded-2xl border border-white/5 shrink-0">
                    <span className="text-[10px] uppercase font-bold text-white/50 block">
                      Estimated Preparation
                    </span>
                    <div className="flex items-center sm:justify-end gap-1.5 mt-0.5">
                      <Clock className="w-4 h-4 text-emerald-400" />
                      <span className="text-base font-black text-emerald-300 font-mono">
                        {currentOrder.status === "served"
                          ? "Completed"
                          : currentOrder.status === "ready"
                          ? "Ready Now!"
                          : `${formattedCountdown} left`}
                      </span>
                    </div>
                    {currentOrder.status !== "served" && currentOrder.status !== "ready" && (
                      <span className="text-[10px] text-white/50 block font-mono">
                        Target: ~{estimatedDeliveryClockTime}
                      </span>
                    )}
                  </div>
                </div>

                {/* Live Waiting Queue Standing Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-1 text-xs">
                  <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-center">
                    <span className="text-white/50 text-[10px] uppercase font-bold block">
                      Queue Standing
                    </span>
                    <span className="font-bold text-[#F5E086] text-sm mt-0.5 block">
                      {currentOrder.status === "ready"
                        ? "🎉 Ready Now!"
                        : currentOrder.status === "served"
                        ? "Delivered"
                        : ordersAheadCount === 0
                        ? "⚡ Next up in line!"
                        : `#${ordersAheadCount + 1} (${ordersAheadCount} ahead)`}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-center">
                    <span className="text-white/50 text-[10px] uppercase font-bold block">
                      Current Stage
                    </span>
                    <span className="font-bold text-[#F5E086] text-sm mt-0.5 block truncate">
                      {stepProgress?.currentStep.shortLabel || currentOrder.status}
                    </span>
                    <span className="text-[9px] text-white/60 block font-mono">
                      {stepProgress?.percent}% • {stepProgress?.isManual ? "Staff Verified" : "Auto"}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-center">
                    <span className="text-white/50 text-[10px] uppercase font-bold block">
                      Payment
                    </span>
                    <span className="font-bold text-emerald-300 text-sm mt-0.5 block">
                      {currentOrder.paymentStatus === "paid" ? "Paid Online" : "At Counter"}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-2xl bg-white/5 border border-white/10 text-center">
                    <span className="text-white/50 text-[10px] uppercase font-bold block">
                      Items
                    </span>
                    <span className="font-bold text-white text-sm mt-0.5 block font-mono">
                      {currentOrder.items.reduce((s, it) => s + it.quantity, 0)} item(s)
                    </span>
                  </div>
                </div>

                {/* Progress Bar & Milestone Announcement */}
                <div className="space-y-1.5 pt-1">
                  <div className="flex justify-between text-[11px] font-bold">
                    <span className="text-white/80 capitalize flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
                      Milestone:{" "}
                      <strong className="text-[#F5E086]">
                        {stepProgress?.currentStep.label || currentOrder.status}
                      </strong>
                    </span>
                    <span className="text-[#F5E086] font-mono">
                      {stepProgress?.percent || 0}%
                    </span>
                  </div>

                  <div className="w-full h-2.5 rounded-full bg-[#1F2C27] overflow-hidden p-0.5 border border-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-amber-400 via-[#F5E086] to-emerald-400 transition-all duration-700 ease-out"
                      style={{ width: `${stepProgress?.percent || 0}%` }}
                    />
                  </div>

                  {/* Announcement details / note */}
                  <div className="flex flex-wrap items-center justify-between text-[10px] text-white/60">
                    <span>
                      {stepProgress?.isManual
                        ? `👨‍🍳 Staff announced: "${stepProgress.announcedNote || stepProgress.currentStep.description}"`
                        : `⚡ Automatic progression based on prep timer (${stepProgress?.currentStep.description})`}
                    </span>
                    {stepProgress?.announcedAt && (
                      <span className="font-mono text-white/40">
                        {new Date(stepProgress.announcedAt).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    )}
                  </div>
                </div>

                {/* Service Mode Meta Pills */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                  <span className="px-2.5 py-1 rounded-full bg-white/10 text-white text-xs font-semibold flex items-center gap-1.5 border border-white/10">
                    {currentOrder.orderType === "dine-in" ? (
                      <Utensils className="w-3.5 h-3.5 text-[#F5E086]" />
                    ) : (
                      <ShoppingBag className="w-3.5 h-3.5 text-[#F5E086]" />
                    )}
                    <span>
                      {currentOrder.orderType === "dine-in"
                        ? `Dine-in (${currentOrder.tableNumber || "Table 1"})`
                        : "Takeaway Pickup"}
                    </span>
                  </span>

                  <span className="px-2.5 py-1 rounded-full bg-emerald-900/40 text-emerald-300 text-xs font-semibold border border-emerald-500/30 flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                    <span>
                      {currentOrder.paymentStatus === "paid"
                        ? "Paid Online"
                        : "Pay at Counter"}
                    </span>
                  </span>

                  <span className="px-2.5 py-1 rounded-full bg-white/5 text-white/70 text-xs font-mono">
                    Placed: {currentOrder.createdAt?.includes("T")
                      ? new Date(currentOrder.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : currentOrder.createdAt}
                  </span>
                </div>
              </div>

              {/* Visual Countdown & Estimated Delivery Timer Section (Active for 'received' or 'toasting') */}
              {(currentOrder.status === "received" || currentOrder.status === "toasting") && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#24332D] via-[#2B3D36] to-[#1E2B25] border-2 border-[#F5E086]/35 shadow-xl space-y-4 relative overflow-hidden animate-in fade-in">
                  {/* Ambient backdrop glow */}
                  <div className="absolute -right-8 -top-8 w-36 h-36 bg-[#F5E086]/10 rounded-full blur-2xl pointer-events-none" />
                  <div className="absolute -left-8 -bottom-8 w-36 h-36 bg-emerald-500/10 rounded-full blur-2xl pointer-events-none" />

                  {/* Timer Header & Estimated Target Delivery */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 border-b border-white/10 pb-3 relative z-10">
                    <div className="flex items-center gap-2.5">
                      <div className="w-9 h-9 rounded-xl bg-[#F5E086]/15 border border-[#F5E086]/30 flex items-center justify-center text-[#F5E086] shrink-0">
                        <Timer className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs sm:text-sm font-bold uppercase tracking-wider text-[#F5E086]">
                            Live Estimated Delivery Countdown
                          </h4>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold">
                            Live Prep
                          </span>
                        </div>
                        <p className="text-[11px] text-white/70">
                          {currentOrder.orderType === "dine-in"
                            ? `Delivery directly to Table ${currentOrder.tableNumber || "1"}`
                            : "Handover at Front Counter Takeaway Station"}
                        </p>
                      </div>
                    </div>

                    {/* Target Clock Time Pill */}
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 rounded-full bg-[#1B2823] border border-[#F5E086]/30 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs">
                        <Clock className="w-3.5 h-3.5 text-emerald-400" />
                        <span className="text-white/60">Estimated At:</span>
                        <strong className="text-[#F5E086] font-mono text-xs">
                          {estimatedDeliveryClockTime}
                        </strong>
                      </span>
                    </div>
                  </div>

                  {/* Main Timer Display & Live Kitchen Context */}
                  <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 items-center relative z-10">
                    {/* Left: Circular Radial Progress Countdown Clock */}
                    <div className="sm:col-span-5 flex flex-col items-center justify-center p-4 sm:p-5 rounded-2xl bg-[#1B2823]/90 border border-white/10 shadow-inner">
                      <div className="relative w-36 h-36 sm:w-40 sm:h-40 flex items-center justify-center">
                        <svg className="w-full h-full -rotate-90 transform drop-shadow-md" viewBox="0 0 100 100">
                          {/* Background Track */}
                          <circle
                            cx="50"
                            cy="50"
                            r="42"
                            className="text-white/10"
                            strokeWidth="6"
                            stroke="currentColor"
                            fill="transparent"
                          />
                          {/* Animated Countdown Progress Ring */}
                          <circle
                            cx="50"
                            cy="50"
                            r="42"
                            className="text-[#F5E086] transition-all duration-1000 ease-linear"
                            strokeWidth="6"
                            strokeDasharray={263.89}
                            strokeDashoffset={263.89 - (countdownProgressPercent / 100) * 263.89}
                            strokeLinecap="round"
                            stroke="currentColor"
                            fill="transparent"
                          />
                        </svg>

                        {/* Digital Timer Center Display - Generous breathing room, guaranteed no cutout */}
                        <div className="absolute inset-2.5 rounded-full bg-black/40 border border-white/5 flex flex-col items-center justify-center text-center px-2 py-1 shadow-inner pointer-events-none">
                          <span className="font-mono font-black text-2xl sm:text-3xl text-white tracking-normal leading-tight drop-shadow-md select-none">
                            {remainingSeconds > 0 ? formattedCountdown : "00:00"}
                          </span>
                          <span className="text-[10px] uppercase tracking-wider font-bold text-[#F5E086] mt-0.5 select-none">
                            {remainingSeconds > 0 ? "Mins Left" : "Finishing"}
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 text-center space-y-0.5">
                        <div className="text-xs font-bold text-white/90">
                          {countdownProgressPercent}% Prep Completed
                        </div>
                        <div className="flex items-center justify-center gap-1.5 text-[10px] text-white/50">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                          <span>Cast-iron grill active at 210°C</span>
                        </div>
                      </div>
                    </div>

                    {/* Right: Live Kitchen Transparency Steps & Details */}
                    <div className="sm:col-span-7 space-y-3">
                      <div>
                        <div className="flex items-center gap-2">
                          {currentOrder.status === "toasting" ? (
                            <Flame className="w-4 h-4 text-amber-300" />
                          ) : (
                            <Utensils className="w-4 h-4 text-[#F5E086]" />
                          )}
                          <h5 className="font-bold text-sm text-[#F5E086]">
                            {currentOrder.status === "toasting"
                              ? "Artisan Toasting & Cheese Melting"
                              : "Order Placed & Fresh Ingredients Assembly"}
                          </h5>
                        </div>
                        <p className="text-xs text-[#FBF9F2]/80 mt-1 leading-relaxed">
                          {currentOrder.status === "toasting"
                            ? "Your sourdough sandwiches are currently on the cast-iron grill at 210°C, toasted with cultured butter for a golden crunchy crust."
                            : "Our barista-chefs have queued your ticket, sliced artisan sourdough, and are assembling fillings before grilling."}
                        </p>
                      </div>

                      {/* Micro-Milestones Checklist for transparency */}
                      <div className="bg-[#1B2823]/60 rounded-xl p-3 border border-white/5 space-y-1.5">
                        <div className="text-[10px] uppercase font-bold text-white/50 tracking-wider">
                          Kitchen Transparency Milestones
                        </div>
                        <div className="space-y-1.5 text-xs">
                          <div className="flex items-center gap-2 text-emerald-300">
                            <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            <span>Ticket printed & barista notified</span>
                          </div>
                          <div
                            className={`flex items-center gap-2 ${
                              currentOrder.status === "toasting"
                                ? "text-emerald-300"
                                : "text-[#F5E086] font-semibold"
                            }`}
                          >
                            {currentOrder.status === "toasting" ? (
                              <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                            ) : (
                              <span className="w-3.5 h-3.5 rounded-full border border-[#F5E086] flex items-center justify-center shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-[#F5E086] animate-pulse" />
                              </span>
                            )}
                            <span>Artisanal bread sliced & fillings assembled</span>
                          </div>
                          <div
                            className={`flex items-center gap-2 ${
                              currentOrder.status === "toasting"
                                ? "text-[#F5E086] font-semibold"
                                : "text-white/40"
                            }`}
                          >
                            {currentOrder.status === "toasting" ? (
                              <span className="w-3.5 h-3.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/40 flex items-center justify-center shrink-0">
                                <span className="w-1.5 h-1.5 rounded-full bg-amber-300 animate-pulse" />
                              </span>
                            ) : (
                              <span className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0" />
                            )}
                            <span>Cast-iron grill melt & golden crust press</span>
                          </div>
                          <div className="flex items-center gap-2 text-white/40">
                            <span className="w-3.5 h-3.5 rounded-full border border-white/20 shrink-0" />
                            <span>
                              {currentOrder.orderType === "dine-in"
                                ? `Plating & delivery to Table ${currentOrder.tableNumber || "1"}`
                                : "Eco-thermal packaging & counter pickup"}
                            </span>
                          </div>
                        </div>
                      </div>

                      {/* Kitchen Broadcast Notice */}
                      <div className="flex items-center justify-between pt-1 text-[11px] text-white/50">
                        <span className="flex items-center gap-1">
                          <Sparkles className="w-3 h-3 text-[#F5E086]" />
                          <span>Freshly made-to-order</span>
                        </span>
                        <div className="flex items-center gap-1.5 text-white/70 text-[11px]">
                          <span className="w-2 h-2 rounded-full bg-[#F5E086] animate-pulse" />
                          <span>Time synced live with Head Chef</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Ready State Callout Banner */}
              {currentOrder.status === "ready" && (
                <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-emerald-950 via-[#233f34] to-[#1E2B25] border-2 border-emerald-400/50 shadow-xl flex flex-col sm:flex-row items-center justify-between gap-4 animate-in fade-in">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-6 h-6 text-emerald-300" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-base text-emerald-300">
                          Your Order is Hot & Ready!
                        </h4>
                        <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-[#24332D] text-[10px] font-black uppercase">
                          NOW
                        </span>
                      </div>
                      <p className="text-xs text-[#FBF9F2]/80 mt-0.5">
                        {currentOrder.orderType === "dine-in"
                          ? `Our team is bringing your food to ${currentOrder.tableNumber || "Table 1"} right now. Enjoy your meal!`
                          : "Your order is ready at the front pickup counter. Show your Order ID to collect."}
                      </p>
                    </div>
                  </div>
                  <div className="px-4 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 font-mono text-xs font-bold text-center shrink-0">
                    Order #{currentOrder.orderNumber}
                  </div>
                </div>
              )}

              {/* 6-Step Live Visual Stepper */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#2B3D36] border border-white/10 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold uppercase tracking-wider text-[#F5E086] flex items-center gap-1.5">
                      <ChefHat className="w-4 h-4" />
                      <span>Artisanal Preparation Journey</span>
                    </h4>
                    <p className="text-[11px] text-white/60">
                      Step {currentStepIndex + 1} of {ORDER_STEPS.length}: {stepProgress?.currentStep.label}
                    </p>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded-full text-[10px] font-bold self-start sm:self-auto border flex items-center gap-1 ${
                      stepProgress?.isManual
                        ? "bg-amber-400/20 text-amber-300 border-amber-400/40"
                        : "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
                    }`}
                  >
                    <span>{stepProgress?.sourceText || "⚡ Live Kitchen Timer"}</span>
                  </span>
                </div>

                <div className="relative pl-6 sm:pl-8 space-y-4 before:absolute before:left-3 sm:before:left-4 before:top-3 before:bottom-3 before:w-0.5 before:bg-white/15">
                  {ORDER_STEPS.map((step, idx) => {
                    const isPassed = currentStepIndex > idx;
                    const isCurrent = currentStepIndex === idx;
                    const isUpcoming = currentStepIndex < idx;

                    return (
                      <div key={step.id} className="relative flex items-start gap-3">
                        {/* Step Marker Dot */}
                        <div
                          className={`absolute -left-6 sm:-left-8 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isPassed
                              ? "bg-emerald-500 text-white shadow-xs"
                              : isCurrent
                              ? "bg-[#F5E086] text-[#24332D] ring-4 ring-[#F5E086]/25 animate-pulse"
                              : "bg-[#1E2B25] text-white/30 border border-white/20"
                          }`}
                        >
                          {isPassed ? (
                            <Check className="w-3.5 h-3.5" />
                          ) : (
                            <span>{idx + 1}</span>
                          )}
                        </div>

                        {/* Step Content */}
                        <div
                          className={`flex-1 p-3 rounded-xl border transition-all ${
                            isCurrent
                              ? "bg-[#374C44] border-[#F5E086]/50 shadow-md ring-1 ring-[#F5E086]/20"
                              : isPassed
                              ? "bg-white/5 border-white/5 opacity-85"
                              : "bg-white/5 border-transparent opacity-40"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              {step.id === "order_taken" ? (
                                <FileText className="w-4 h-4 text-[#F5E086]" />
                              ) : step.id === "prep_assembly" ? (
                                <ChefHat className="w-4 h-4 text-amber-300" />
                              ) : step.id === "cooking_toasting" ? (
                                <Flame className="w-4 h-4 text-amber-400" />
                              ) : step.id === "garnish_packing" ? (
                                <ShoppingBag className="w-4 h-4 text-amber-200" />
                              ) : step.id === "ready_calling" ? (
                                <Bell className="w-4 h-4 text-emerald-400 animate-bounce" />
                              ) : (
                                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                              )}
                              <h5
                                className={`text-sm font-bold ${
                                  isCurrent
                                    ? "text-[#F5E086]"
                                    : isPassed
                                    ? "text-white"
                                    : "text-white/50"
                                }`}
                              >
                                {step.label}
                              </h5>
                            </div>

                            <div className="flex items-center gap-1.5">
                              <span className="text-[10px] font-mono text-white/40">
                                {step.percent}%
                              </span>
                              {isCurrent && (
                                <span
                                  className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                                    stepProgress?.isManual
                                      ? "bg-amber-400 text-[#17221D]"
                                      : "bg-[#F5E086] text-[#24332D]"
                                  }`}
                                >
                                  {stepProgress?.isManual ? "Staff Verified" : "Live Now"}
                                </span>
                              )}
                            </div>
                          </div>

                          <p className="text-xs text-[#FBF9F2]/80 mt-1">
                            {currentOrder.orderType === "dine-in"
                              ? step.dineInDesc
                              : step.takeawayDesc}
                          </p>

                          {/* Extra info / note */}
                          <div className="mt-2 pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-white/60">
                            <span>{step.description}</span>
                            {isPassed && (
                              <span className="text-emerald-400 font-medium flex items-center gap-1">
                                <Check className="w-3 h-3" /> Completed
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="p-2.5 rounded-xl bg-black/20 border border-white/5 text-[11px] text-white/50 flex items-center gap-2">
                  <Info className="w-3.5 h-3.5 text-[#F5E086] shrink-0" />
                  <span>
                    Staff can announce step completions directly from the queue console. If staff is busy, our smart kitchen timer divides the time automatically.
                  </span>
                </div>
              </div>

              {/* LIVE KITCHEN NOTIFICATIONS STREAM (CUSTOMER VIEW) */}
              <div className="p-4 sm:p-5 rounded-2xl bg-[#24332D] border border-[#F5E086]/25 shadow-md space-y-3.5">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <Bell className="w-4 h-4 text-[#F5E086]" />
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                      <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>Live Kitchen Notifications</span>
                        <span className="px-1.5 py-0.2 rounded-full bg-[#F5E086]/20 text-[#F5E086] text-[10px] font-mono font-bold">
                          {currentOrder.notifications?.length || 1} Updates
                        </span>
                      </h4>
                      <p className="text-[11px] text-white/60">
                        Real-time preparation alerts and messages broadcast by kitchen staff
                      </p>
                    </div>
                  </div>

                  <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-[10px] font-bold uppercase tracking-wider shrink-0 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Live Stream</span>
                  </span>
                </div>

                {/* Notification Items */}
                <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
                  {currentOrder.notifications && currentOrder.notifications.length > 0 ? (
                    currentOrder.notifications.map((notif, idx) => (
                      <div
                        key={notif.id}
                        className={`p-3 rounded-xl border transition-all ${
                          idx === 0
                            ? "bg-gradient-to-r from-[#2F423B] to-[#25352F] border-[#F5E086]/40 shadow-sm"
                            : "bg-[#1C2723]/60 border-white/5 opacity-85"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2 mb-1">
                          <div className="flex items-center gap-1.5">
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                                notif.type === "status"
                                  ? "bg-amber-400/20 text-amber-300 border border-amber-400/30"
                                  : notif.type === "time"
                                  ? "bg-sky-400/20 text-sky-300 border border-sky-400/30"
                                  : "bg-[#F5E086]/20 text-[#F5E086] border border-[#F5E086]/30"
                              }`}
                            >
                              {notif.type === "status"
                                ? "Step Update"
                                : notif.type === "time"
                                ? "Prep Time"
                                : "Chef Note"}
                            </span>
                            <span className="text-xs font-bold text-white">
                              {notif.title}
                            </span>
                          </div>

                          <span className="text-[10px] text-white/50 font-mono shrink-0">
                            {notif.time}
                          </span>
                        </div>

                        <p className="text-xs text-white/80 leading-relaxed pl-0.5">
                          {notif.message}
                        </p>
                      </div>
                    ))
                  ) : (
                    <div className="p-3 rounded-xl bg-[#1C2723]/60 border border-white/10 text-xs text-white/80 space-y-1">
                      <div className="flex items-center justify-between text-[11px] text-[#F5E086] font-bold">
                        <span>Order Received & Logged</span>
                        <span className="text-white/40 font-mono">Just now</span>
                      </div>
                      <p className="text-white/70">
                        Kitchen ticket generated. Staff will broadcast live notifications and timer adjustments here as preparation progresses.
                      </p>
                    </div>
                  )}
                </div>

                {/* Transparency notice for user */}
                <div className="pt-1.5 flex items-center justify-between text-[10px] text-white/50">
                  <span className="flex items-center gap-1">
                    <Info className="w-3 h-3 text-[#F5E086]/70 shrink-0" />
                    <span>Prep stages and time left are adjusted exclusively by kitchen staff.</span>
                  </span>
                  <span className="font-mono text-emerald-400/80">NiEA'S LiveSync Active</span>
                </div>
              </div>

              {/* Order Basket Items Accordion */}
              <div className="p-4 rounded-2xl bg-[#2B3D36] border border-white/10 space-y-3">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-xs font-bold uppercase tracking-wider text-[#F5E086]">
                    Order Summary ({currentOrder.items.length} Items)
                  </span>
                  <span className="text-xs font-bold text-white/70">
                    Total: ₹{currentOrder.grandTotal}
                  </span>
                </div>

                <div className="space-y-2.5">
                  {currentOrder.items.map((ci) => (
                    <div
                      key={ci.cartItemId}
                      className="flex items-start justify-between gap-3 text-xs pb-2 border-b border-white/5 last:border-0 last:pb-0"
                    >
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2 font-bold text-white">
                          <span className="w-5 h-5 rounded-md bg-white/10 flex items-center justify-center text-[10px] text-[#F5E086]">
                            {ci.quantity}×
                          </span>
                          <span>{ci.item.name}</span>
                        </div>
                        {ci.selectedBread && ci.selectedBread !== "Default" && (
                          <p className="text-[11px] text-white/60">
                            Bread: {ci.selectedBread}
                          </p>
                        )}
                        {ci.selectedCustomizations &&
                          ci.selectedCustomizations.length > 0 && (
                            <p className="text-[11px] text-[#F5E086]/70">
                              + {ci.selectedCustomizations.map((c) => c.name).join(", ")}
                            </p>
                          )}
                      </div>

                      <span className="font-niea font-bold text-sm text-[#F5E086] shrink-0">
                        ₹{ci.totalPrice}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="pt-2 border-t border-white/10 space-y-1 text-xs text-white/70">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>₹{currentOrder.subtotal}</span>
                  </div>
                  {currentOrder.discount > 0 && (
                    <div className="flex justify-between text-emerald-400">
                      <span>Promo Discount</span>
                      <span>-₹{currentOrder.discount}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span>GST (5%)</span>
                    <span>₹{currentOrder.taxes}</span>
                  </div>
                  {currentOrder.packagingCharge > 0 && (
                    <div className="flex justify-between">
                      <span>Eco Packaging</span>
                      <span>₹{currentOrder.packagingCharge}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-sm text-white pt-1 border-t border-white/10">
                    <span>Grand Total</span>
                    <span className="font-niea text-[#F5E086]">
                      ₹{currentOrder.grandTotal}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons: Invoice, Reorder, Help */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={handleDownloadInvoice}
                  disabled={downloadingInvoice}
                  className="py-2.5 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition flex items-center justify-center gap-1.5 border border-white/15"
                >
                  {downloadingInvoice ? (
                    <span className="w-3.5 h-3.5 border-2 border-[#F5E086] border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Download className="w-3.5 h-3.5 text-[#F5E086]" />
                  )}
                  <span>Download Invoice</span>
                </button>

                {onReorder && (
                  <button
                    type="button"
                    onClick={() => {
                      onReorder(currentOrder.items);
                      showToast("Items added to your basket.");
                      onClose();
                    }}
                    className="py-2.5 px-3 rounded-xl bg-[#F5E086] hover:bg-[#F8E79B] text-[#24332D] text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Re-order Items</span>
                  </button>
                )}

                {currentOrder.status === "served" && onOpenFeedback ? (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenFeedback(currentOrder);
                    }}
                    className="py-2.5 px-3 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#24332D] text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm"
                  >
                    <MessageSquareShare className="w-3.5 h-3.5" />
                    <span>Share Review</span>
                  </button>
                ) : (
                  <a
                    href="tel:+919876543210"
                    className="py-2.5 px-3 rounded-xl bg-[#24332D] hover:bg-[#1E2B25] text-white/90 text-xs font-bold transition flex items-center justify-center gap-1.5 border border-white/10"
                  >
                    <Phone className="w-3.5 h-3.5 text-[#F5E086]" />
                    <span>Call Cafe (+91 98765)</span>
                  </a>
                )}
              </div>

              {/* Cafe Location Help Note */}
              <div className="p-3 rounded-xl bg-[#24332D]/70 border border-white/5 flex items-center gap-2.5 text-[11px] text-white/70">
                <MapPin className="w-4 h-4 text-[#F5E086] shrink-0" />
                <span>
                  NiEA'S SANDWICH BAR • New Town Action Area 1, Kolkata • Dine-in & Counter Pickup Available
                </span>
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="p-3.5 sm:p-4 bg-[#2B3D36] border-t border-white/10 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-white/60">
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span className="hidden sm:inline">Auto-updating with kitchen bar</span>
            <span className="sm:hidden">Live sync active</span>
          </div>

          <button
            onClick={onClose}
            className="px-5 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition"
          >
            Close Tracker
          </button>
        </div>
      </div>
    </div>
  );
};
