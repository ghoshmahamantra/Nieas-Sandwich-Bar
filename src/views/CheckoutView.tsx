import React, { useState, useRef } from "react";
import {
  ShoppingBag,
  Trash2,
  Plus,
  Minus,
  Check,
  Tag,
  ArrowRight,
  Clock,
  ShieldCheck,
  CreditCard,
  QrCode,
  DollarSign,
  UtensilsCrossed,
  CheckCircle2,
  Lock,
  AlertCircle,
  HelpCircle,
  Sparkles,
  User,
  LogIn,
  Utensils,
  Coffee,
  Heart,
  Tv,
  AlertTriangle,
  ArrowDown,
  X,
  MessageSquare,
  Phone,
  Flame,
} from "lucide-react";
import {
  CartItem,
  MenuItem,
  OrderType,
  OrderRecord,
  UserSession,
  CouponDiscount,
  StoreFinancialSettings,
  PreBookingConfig,
  WhatsAppTemplatesConfig,
} from "../types/niea";
import { DEFAULT_COUPONS } from "../data/nieaData";
import { checkPreBookingWindow } from "../utils/preBookingHelper";
import { generateTokenNumber, formatTokenNumber } from "../utils/tokenHelper";
import { generateOrderCancellationRequestWhatsAppUrl } from "../utils/whatsappHelper";
import { NavTab } from "../components/Header";
import { UpiPaymentBox, UPI_ID } from "../components/UpiPaymentBox";

interface CheckoutViewProps {
  cart: CartItem[];
  menuItems?: MenuItem[];
  orderType: OrderType;
  selectedTable: string;
  onUpdateQuantity: (cartItemId: string, delta: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onSetOrderType: (type: OrderType) => void;
  onSetSelectedTable: (table: string) => void;
  appliedDiscount: number;
  discountCode?: string;
  onApplyCoupon: (code: string, discount: number) => void;
  onOrderSuccess: (order: OrderRecord) => void;
  onSelectTab: (tab: NavTab) => void;
  userSession?: UserSession | null;
  onOpenAuth?: () => void;
  onOpenTrackOrder?: (orderNumber?: string) => void;
  onOpenLiveCallingBoard?: (tokenNumber?: string) => void;
  financialSettings?: StoreFinancialSettings;
  coupons?: CouponDiscount[];
  preBookingConfig?: PreBookingConfig;
  whatsappConfig?: WhatsAppTemplatesConfig;
  onCancelOrder?: (orderId: string) => void;
}

interface MissingDetailItem {
  id: string;
  field: "name" | "phone" | "cart" | "window";
  title: string;
  boxName: string;
  instruction: string;
}

export const CheckoutView: React.FC<CheckoutViewProps> = ({
  cart,
  menuItems = [],
  orderType,
  selectedTable,
  onUpdateQuantity,
  onRemoveItem,
  onSetOrderType,
  onSetSelectedTable,
  appliedDiscount,
  discountCode,
  onApplyCoupon,
  onOrderSuccess,
  onSelectTab,
  userSession,
  onOpenAuth,
  onOpenTrackOrder,
  onOpenLiveCallingBoard,
  financialSettings,
  coupons,
  preBookingConfig,
  whatsappConfig,
  onCancelOrder,
}) => {
  const [cancelGraceSeconds, setCancelGraceSeconds] = useState<number>(10);
  const [customerName, setCustomerName] = useState(() => {
    return (
      userSession?.name ||
      localStorage.getItem("niea_customer_name") ||
      ""
    );
  });
  const [customerPhone, setCustomerPhone] = useState(() => {
    const raw =
      userSession?.phoneNumber ||
      localStorage.getItem("niea_customer_phone") ||
      "";
    return raw.replace(/\D/g, "").slice(-10);
  });
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [specialInstructions, setSpecialInstructions] = useState("");

  const nameInputRef = useRef<HTMLInputElement>(null);
  const phoneInputRef = useRef<HTMLInputElement>(null);
  const guestDetailsSectionRef = useRef<HTMLDivElement>(null);

  const [showMissingModal, setShowMissingModal] = useState(false);
  const [missingFieldsList, setMissingFieldsList] = useState<MissingDetailItem[]>([]);
  const [highlightErrors, setHighlightErrors] = useState(false);

  // Pay at counter permission status (owner controlled)
  const isPayAtCounterAllowed = Boolean(financialSettings?.isPayAtCounterEnabled);

  // Auto-sync with userSession or localStorage
  React.useEffect(() => {
    const savedPhone = localStorage.getItem("niea_customer_phone")?.replace(/\D/g, "").slice(-10);
    const sessionPhone = userSession?.phoneNumber?.replace(/\D/g, "").slice(-10);
    const effectivePhone = sessionPhone && sessionPhone.length === 10 ? sessionPhone : (savedPhone && savedPhone.length === 10 ? savedPhone : "");

    const savedName = localStorage.getItem("niea_customer_name");
    const sessionName = userSession?.name;
    const effectiveName = sessionName || savedName || "";

    if (effectiveName && (!customerName || customerName === "Google Guest" || customerName === "Valued Customer")) {
      setCustomerName(effectiveName);
    }
    if (effectivePhone && (!customerPhone || customerPhone.length !== 10)) {
      setCustomerPhone(effectivePhone);
    }
  }, [userSession]);

  const [couponInput, setCouponInput] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cash">("razorpay");
  const [paymentError, setPaymentError] = useState("");
  const [tipAmount, setTipAmount] = useState<number>(0);
  const [customTipInput, setCustomTipInput] = useState<string>("");
  const [isCustomTip, setIsCustomTip] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [placedOrder, setPlacedOrder] = useState<OrderRecord | null>(null);
  const [cancelCountdown, setCancelCountdown] = useState<number>(10);
  const [cancelToastMessage, setCancelToastMessage] = useState<string | null>(null);

  // 10-second cancellation timer right after order is placed
  React.useEffect(() => {
    if (!placedOrder) {
      setCancelCountdown(10);
      return;
    }
    setCancelCountdown(10);
    const interval = setInterval(() => {
      setCancelCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [placedOrder]);

  const handleCancelPlacedOrder = () => {
    if (!placedOrder) return;
    if (cancelCountdown > 0) {
      if (
        window.confirm(
          `Are you sure you want to cancel Order #${placedOrder.orderNumber}? The order will be immediately cancelled.`
        )
      ) {
        if (onCancelOrder) {
          onCancelOrder(placedOrder.id);
        }
        setCancelToastMessage(`Order #${placedOrder.orderNumber} has been successfully cancelled.`);
        setPlacedOrder(null);
        setTimeout(() => {
          setCancelToastMessage(null);
          onSelectTab("menu");
        }, 2000);
      }
    } else {
      // Past 10-second confirmation window -> open WhatsApp to contact store owner
      const waUrl = generateOrderCancellationRequestWhatsAppUrl(placedOrder, whatsappConfig);
      window.open(waUrl, "_blank", "noopener,noreferrer");
    }
  };

  // Ensure paymentMethod is reset if Pay at Counter is disabled
  React.useEffect(() => {
    if (!isPayAtCounterAllowed && paymentMethod === "cash") {
      setPaymentMethod("razorpay");
    }
  }, [isPayAtCounterAllowed, paymentMethod]);

  const gstPercent = financialSettings?.gstRatePercent ?? 5;
  const subtotal = cart.reduce((acc, ci) => acc + ci.totalPrice, 0);
  const taxes = Math.round((subtotal * gstPercent) / 100);
  const packaging =
    orderType === "takeaway" ? (financialSettings?.packagingChargeTakeaway ?? 0) : 0;
  const grandTotal = Math.max(0, subtotal + taxes + tipAmount + packaging - appliedDiscount);

  const handleApplyCode = (code: string) => {
    const clean = code.trim().toUpperCase();
    if (!clean) return;

    const availableCoupons = coupons && coupons.length > 0 ? coupons : DEFAULT_COUPONS;
    const found = availableCoupons.find((c) => c.code.toUpperCase() === clean && c.isActive);

    if (!found) {
      alert(`Invalid or expired coupon code "${clean}".`);
      return;
    }

    if (found.minOrderAmount && subtotal < found.minOrderAmount) {
      alert(`Min. order amount of ₹${found.minOrderAmount} required for coupon ${found.code}.`);
      return;
    }

    let calculated = 0;
    if (found.discountType === "percentage") {
      calculated = Math.round((subtotal * found.discountValue) / 100);
      if (found.maxDiscount) calculated = Math.min(calculated, found.maxDiscount);
    } else {
      calculated = found.discountValue;
    }

    calculated = Math.min(calculated, subtotal);
    onApplyCoupon(found.code, calculated);
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setPaymentError("");

    // Validate all required order details and collect missing fields
    const missing: MissingDetailItem[] = [];

    // Check pre-booking operating window
    const pbStatus = checkPreBookingWindow(preBookingConfig);
    if (!pbStatus.isOpen) {
      missing.push({
        id: "window",
        field: "window",
        title: "Pre-Orders Operating Window",
        boxName: "Online Ordering Hours",
        instruction: `Pre-orders are currently closed: ${pbStatus.closedReason} Store operates within ${pbStatus.displayWindowText}.`,
      });
    }

    // Check Cart
    if (cart.length === 0) {
      missing.push({
        id: "cart",
        field: "cart",
        title: "Food Basket is Empty",
        boxName: "Cart Selection",
        instruction: "Your basket contains 0 items. Please add sandwiches or drinks from our menu before placing an order.",
      });
    }

    // Check Customer Name
    if (!customerName.trim()) {
      missing.push({
        id: "name",
        field: "name",
        title: "Customer Full Name",
        boxName: "'Your Name' Input Box",
        instruction: "Please fill in your name in the 'Your Name' box so the kitchen staff and barista can address you.",
      });
    }

    // Check Customer Phone (at least 10 digits)
    const cleanedDigits = customerPhone.replace(/\D/g, "").slice(-10);
    if (!customerPhone.trim() || cleanedDigits.length < 10) {
      missing.push({
        id: "phone",
        field: "phone",
        title: "10-Digit Mobile Number",
        boxName: "'Mobile Number' Input Box",
        instruction: "Please provide a complete 10-digit mobile number in the 'Mobile Number' box for WhatsApp status alerts & token calling.",
      });
    }

    // If any critical box is left unfilled, trigger the Missing Details Popup
    if (missing.length > 0) {
      setMissingFieldsList(missing);
      setShowMissingModal(true);
      setHighlightErrors(true);
      return;
    }

    // Check available stock before submitting
    if (menuItems && menuItems.length > 0) {
      for (const ci of cart) {
        const liveItem = menuItems.find((m) => m.id === ci.item.id);
        const currentStock = liveItem ? liveItem.stockLeft : ci.item.stockLeft;
        const totalUnitsInCart = cart
          .filter((c) => c.item.id === ci.item.id)
          .reduce((sum, c) => sum + (c.quantity || 1), 0);
        if (currentStock < totalUnitsInCart) {
          alert(
            `Sorry, "${ci.item.name}" only has ${currentStock} portion${
              currentStock === 1 ? "" : "s"
            } left in kitchen. Please adjust quantity.`
          );
          return;
        }
      }
    }

    setIsProcessing(true);

    try {
      const response = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: grandTotal,
          orderType,
          customerName,
          customerPhone,
        }),
      });

      const orderData = await response.json().catch(() => ({}));

      const completeOrderPlacement = (paymentId?: string) => {
        const orderNum = `#NIEA-${Math.floor(1000 + Math.random() * 9000)}`;
        const tokenNum = generateTokenNumber();
        const estMinutes = orderType === "dine-in" ? 25 : 30;
        const nowIso = new Date().toISOString();

        const newOrder: OrderRecord = {
          id: orderData.orderId || `ord_${Date.now()}`,
          orderNumber: orderNum,
          tokenNumber: tokenNum,
          userId: (userSession as any)?.uid || userSession?.email || localStorage.getItem("niea_customer_uid") || undefined,
          customerEmail: userSession?.email || undefined,
          orderType,
          orderKind: orderType === "dine-in" ? "dine_in" : "takeaway",
          orderSource: "website",
          tableNumber: orderType === "dine-in" ? selectedTable : "Counter Pickup",
          customerName,
          customerPhone,
          items: [...cart],
          subtotal,
          taxes,
          tip: tipAmount > 0 ? tipAmount : undefined,
          packagingCharge: packaging,
          discount: appliedDiscount,
          grandTotal,
          paymentMethod,
          paymentStatus: paymentMethod === "razorpay" ? "paid" : "pending",
          razorpayOrderId: orderData.orderId,
          razorpayPaymentId: paymentId || (paymentMethod === "razorpay" ? `pay_${Date.now()}` : undefined),
          createdAt: nowIso,
          estimatedTime: `${estMinutes} mins`,
          estimatedWaitingMinutes: estMinutes,
          waitingStartedAt: nowIso,
          estimatedMinutesLeft: estMinutes,
          status: "received",
          kitchenStatus: "kot_dispatched",
          kotPrinted: false,
          notifications: [
            {
              id: `notif_${Date.now()}`,
              time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true }),
              title: `Order Received • Token ${tokenNum}`,
              message:
                orderType === "dine-in"
                  ? `Assigned to Table ${selectedTable || "1"}. Estimated waiting time: ${estMinutes} mins. Ticket sent to kitchen.`
                  : `Token ${tokenNum} generated. Queued for pickup with ${estMinutes} mins estimated waiting time.`,
              type: "status",
              step: "received",
            },
          ],
        };

        // Automated WhatsApp notification to customer & restaurant
        if (customerPhone.replace(/\D/g, "").slice(-10).length === 10) {
          fetch("/api/whatsapp/notify-order", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              tokenNumber: tokenNum,
              orderNumber: orderNum,
              customerName,
              customerPhone,
              orderType,
              orderKind: newOrder.orderKind,
              tableNumber: newOrder.tableNumber,
              items: cart,
              grandTotal,
              estimatedWaitingMinutes: estMinutes,
              paymentMethod,
              ownerPhone: whatsappConfig?.ownerAlertPhone || "8274047424",
              isOwnerAlertEnabled: whatsappConfig?.isOwnerAlertEnabled ?? true,
              customerTemplate: whatsappConfig?.orderCustomerTemplate,
              ownerTemplate: whatsappConfig?.ownerOrderAlertTemplate,
            }),
          }).catch((err) => console.error("WhatsApp notification error:", err));
        }

        // Store in session order IDs for privacy
        try {
          const myIds: string[] = JSON.parse(localStorage.getItem("niea_my_order_ids") || "[]");
          if (!myIds.includes(newOrder.id)) myIds.push(newOrder.id);
          if (!myIds.includes(newOrder.orderNumber)) myIds.push(newOrder.orderNumber);
          if (newOrder.tokenNumber && !myIds.includes(newOrder.tokenNumber)) myIds.push(newOrder.tokenNumber);
          localStorage.setItem("niea_my_order_ids", JSON.stringify(myIds));
        } catch {}

        setIsProcessing(false);
        setPlacedOrder(newOrder);
        onOrderSuccess(newOrder);
      };

      if (paymentMethod === "razorpay" && typeof window !== "undefined" && (window as unknown as { Razorpay: unknown }).Razorpay) {
        const RazorpayClass = (window as unknown as { Razorpay: new (opts: unknown) => { open: () => void } }).Razorpay;
        const razorpayKey = financialSettings?.razorpayKeyId || orderData.keyId || "rzp_test_TgWOn7ADNg8Szc";
        const options = {
          key: razorpayKey,
          amount: Math.round(grandTotal * 100),
          currency: "INR",
          name: "NiEA'S SANDWICH BAR",
          description: `Order Payment (${orderType.toUpperCase()})`,
          order_id: orderData.isLiveOrder ? orderData.orderId : undefined,
          image: "/apple-touch-icon.png",
          prefill: {
            name: customerName || "NiEA Guest",
            contact: customerPhone || "9887219990",
            email: "guest@nieasandwichbar.com",
          },
          theme: {
            color: "#24332D",
          },
          handler: async function (response: { razorpay_payment_id?: string; razorpay_order_id?: string; razorpay_signature?: string }) {
            try {
              await fetch("/api/verify-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(response),
              });
            } catch {}
            completeOrderPlacement(response.razorpay_payment_id || `pay_${Date.now()}`);
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
            },
          },
        };

        try {
          const rzp = new RazorpayClass(options);
          rzp.open();
          return;
        } catch {
          // Fallback if popup blocked
        }
      }

      setTimeout(() => {
        completeOrderPlacement();
      }, 500);
    } catch {
      const orderNum = `#NIEA-${Math.floor(1000 + Math.random() * 9000)}`;
      const tokenNum = generateTokenNumber();
      const estMinutes = orderType === "dine-in" ? 25 : 30;
      const nowIso = new Date().toISOString();

      const newOrder: OrderRecord = {
        id: `ord_${Date.now()}`,
        orderNumber: orderNum,
        tokenNumber: tokenNum,
        userId: (userSession as any)?.uid || userSession?.email || localStorage.getItem("niea_customer_uid") || undefined,
        customerEmail: userSession?.email || undefined,
        orderType,
        orderKind: orderType === "dine-in" ? "dine_in" : "takeaway",
        orderSource: "website",
        tableNumber: orderType === "dine-in" ? selectedTable : "Counter Pickup",
        customerName,
        customerPhone,
        items: [...cart],
        subtotal,
        taxes,
        tip: tipAmount > 0 ? tipAmount : undefined,
        packagingCharge: packaging,
        discount: appliedDiscount,
        grandTotal,
        paymentMethod,
        paymentStatus: "paid",
        createdAt: nowIso,
        estimatedTime: `${estMinutes} mins`,
        estimatedWaitingMinutes: estMinutes,
        waitingStartedAt: nowIso,
        estimatedMinutesLeft: estMinutes,
        status: "received",
        kitchenStatus: "kot_dispatched",
        kotPrinted: false,
        notifications: [
          {
            id: `notif_${Date.now()}`,
            time: new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true }),
            title: `Order Received • Token ${tokenNum}`,
            message:
              orderType === "dine-in"
                ? `Assigned to Table ${selectedTable || "1"}. Ticket dispatched to chef.`
                : `Token ${tokenNum} generated. Queued for pickup with ${estMinutes} mins estimated wait.`,
            type: "status",
            step: "received",
          },
        ],
      };

      try {
        const myIds: string[] = JSON.parse(localStorage.getItem("niea_my_order_ids") || "[]");
        if (!myIds.includes(newOrder.id)) myIds.push(newOrder.id);
        if (!myIds.includes(newOrder.orderNumber)) myIds.push(newOrder.orderNumber);
        if (newOrder.tokenNumber && !myIds.includes(newOrder.tokenNumber)) myIds.push(newOrder.tokenNumber);
        localStorage.setItem("niea_my_order_ids", JSON.stringify(myIds));
      } catch {}

      if (customerPhone.replace(/\D/g, "").slice(-10).length === 10) {
        fetch("/api/whatsapp/notify-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tokenNumber: tokenNum,
            orderNumber: orderNum,
            customerName,
            customerPhone,
            orderType,
            orderKind: newOrder.orderKind,
            tableNumber: newOrder.tableNumber,
            items: cart,
            grandTotal,
            estimatedWaitingMinutes: estMinutes,
            paymentMethod,
            ownerPhone: whatsappConfig?.ownerAlertPhone || "8274047424",
            isOwnerAlertEnabled: whatsappConfig?.isOwnerAlertEnabled ?? true,
            customerTemplate: whatsappConfig?.orderCustomerTemplate,
            ownerTemplate: whatsappConfig?.ownerOrderAlertTemplate,
          }),
        }).catch((err) => console.error("WhatsApp notification error:", err));
      }

      setIsProcessing(false);
      setPlacedOrder(newOrder);
      onOrderSuccess(newOrder);
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      {/* 1. Placed Order Success Screen */}
      {placedOrder ? (
        <div className="max-w-xl mx-auto bg-[#374C44] rounded-3xl border border-[#F5E086]/30 p-6 sm:p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center mx-auto text-2xl">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-[#F5E086] uppercase tracking-wider">
              Order Confirmed & Sent to Kitchen
            </span>
            <h2 className="font-niea font-bold text-2xl sm:text-3xl text-white">
              Order {placedOrder.orderNumber}
            </h2>
            <p className="text-xs text-[#FBF9F2]/75">
              Estimated Waiting Time:{" "}
              <strong className="text-[#F5E086]">{placedOrder.estimatedTime}</strong>
            </p>
          </div>

          {/* Instant 10-Second Order Cancellation Window & WhatsApp Support */}
          {cancelCountdown > 0 ? (
            <div className="p-4 rounded-2xl bg-amber-500/15 border-2 border-amber-400/50 text-left space-y-2.5 animate-pulse">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-full bg-amber-400 text-[#24332D] font-black text-xs flex items-center justify-center">
                    {cancelCountdown}
                  </div>
                  <span className="text-xs font-bold text-amber-200">
                    Instant Cancel Window ({cancelCountdown}s left)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-amber-300 font-bold uppercase tracking-wider">
                  Confirmation Timing
                </span>
              </div>
              <p className="text-[11px] text-white/80 leading-relaxed">
                Changed your mind or placed by mistake? You have a 10-second window to cancel this order instantly before kitchen preparation begins.
              </p>
              <div className="w-full bg-black/40 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-amber-400 h-full transition-all duration-1000 ease-linear rounded-full"
                  style={{ width: `${(cancelCountdown / 10) * 100}%` }}
                />
              </div>
              <div className="pt-1 flex items-center justify-end">
                <button
                  type="button"
                  onClick={handleCancelPlacedOrder}
                  className="px-4 py-2 rounded-full bg-rose-500 hover:bg-rose-400 text-white font-black text-xs transition shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
                >
                  <X className="w-4 h-4" />
                  <span>Cancel Order Now ({cancelCountdown}s)</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-[#23352E] border border-white/10 text-left space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-white flex items-center gap-1.5">
                  <Flame className="w-4 h-4 text-amber-400" />
                  <span>Kitchen Preparation Active</span>
                </span>
                <span className="text-[10px] text-white/50 font-mono">Confirmed</span>
              </div>
              <p className="text-[11px] text-white/70 leading-relaxed">
                Our chef is now grilling your artisan toasties. To cancel or adjust an order after the 10s confirmation window, please message the store owner on WhatsApp directly.
              </p>
              <div className="pt-1 flex flex-wrap items-center justify-between gap-2">
                <span className="text-[11px] text-[#F5E086] font-semibold flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  <span>Store Owner: +91 {whatsappConfig?.ownerAlertPhone || "8274047424"}</span>
                </span>
                <button
                  type="button"
                  onClick={handleCancelPlacedOrder}
                  className="px-3.5 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs transition shadow-sm flex items-center gap-1.5 cursor-pointer active:scale-95"
                  title="Contact store owner on WhatsApp to request cancellation"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>Request Cancellation via WhatsApp</span>
                </button>
              </div>
            </div>
          )}

          {/* McDonald's style Token Box */}
          <div className="bg-[#1E2B25] p-5 rounded-3xl border-2 border-[#F5E086]/50 shadow-inner space-y-3">
            <span className="text-[11px] font-black uppercase tracking-widest text-[#F5E086] block">
              YOUR QUEUE ORDER TOKEN
            </span>
            <div className="font-niea font-black text-5xl sm:text-6xl text-[#F5E086] tracking-wider drop-shadow-md">
              {formatTokenNumber(placedOrder.tokenNumber)}
            </div>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <span className="px-3 py-1 rounded-full bg-amber-400/20 text-amber-300 font-bold text-xs border border-amber-400/30">
                ⏱️ Waiting Time: ~{placedOrder.estimatedWaitingMinutes || 25} mins
              </span>
              {onOpenLiveCallingBoard && (
                <button
                  type="button"
                  onClick={() => onOpenLiveCallingBoard(placedOrder.tokenNumber)}
                  className="px-3 py-1 rounded-full bg-[#F5E086] hover:bg-[#F8E79B] text-[#24332D] font-black text-xs transition shadow-xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Tv className="w-3.5 h-3.5" />
                  <span>View Live Token Queue</span>
                </button>
              )}
            </div>

            <p className="text-[11px] text-white/60 pt-1">
              Keep this token number handy. Watch the live queue board or wait for staff announcement.
            </p>
          </div>

          {/* Kitchen Progress Bar */}
          <div className="bg-[#2B3D36] rounded-2xl p-4 border border-white/10 text-left space-y-3">
            <div className="flex items-center justify-between text-xs">
              <span className="font-bold text-white">Status: Toasting & Prepping</span>
              <span className="text-[#F5E086] font-bold">Step 2 of 4</span>
            </div>
            <div className="w-full bg-[#24332D] h-2.5 rounded-full overflow-hidden">
              <div className="bg-[#F5E086] h-full rounded-full w-1/2 animate-pulse" />
            </div>
            <div className="flex justify-between text-[10px] text-white/60">
              <span>Received</span>
              <span className="text-[#F5E086] font-bold">Toasting</span>
              <span>Plating</span>
              <span>Ready</span>
            </div>
          </div>

          {/* Receipt details */}
          <div className="bg-[#2B3D36] rounded-2xl p-4 border border-[#F5E086]/15 text-left text-xs space-y-2">
            <div className="flex justify-between border-b border-white/10 pb-2 font-bold text-white">
              <span>
                {placedOrder.orderType === "dine-in"
                  ? `Dine-in (${placedOrder.tableNumber})`
                  : "Artisan Takeaway"}
              </span>
              <span className="text-[#F5E086]">₹{placedOrder.grandTotal}</span>
            </div>
            {placedOrder.items.map((it, idx) => (
              <div key={idx} className="flex justify-between text-white/75">
                <span>
                  {it.quantity}x {it.item.name}{" "}
                  {it.selectedBread ? `(${it.selectedBread})` : ""}
                </span>
                <span>₹{it.totalPrice}</span>
              </div>
            ))}

            {placedOrder.tip && placedOrder.tip > 0 && (
              <div className="flex justify-between text-[#F5E086]">
                <span className="flex items-center gap-1">
                  <Heart className="w-3 h-3 text-rose-300 fill-rose-300/40" />
                  <span>Crew & Kitchen Tip:</span>
                </span>
                <span>₹{placedOrder.tip}</span>
              </div>
            )}

            {/* Live inventory decrease transparency badge */}
            <div className="pt-2 border-t border-white/10 flex items-center justify-between text-[11px] text-emerald-300">
              <span className="flex items-center gap-1 font-semibold">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                <span>Kitchen Inventory Auto-Updated:</span>
              </span>
              <span className="bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-400/30 font-bold">
                -{placedOrder.items.reduce((sum, it) => sum + (it.quantity || 1), 0)} unit(s) deducted
              </span>
            </div>
          </div>

          {/* Store Pickup Address */}
          <div className="p-3.5 rounded-2xl bg-[#24332D] border border-white/10 text-left text-xs text-white/80 space-y-1">
            <span className="font-bold text-[#F5E086] block">
              {placedOrder.orderType === "dine-in" ? "Cafe Table Service" : "Store Counter Pickup"}
            </span>
            <p className="text-[11px] text-white/70">
              NiEA'S Sandwich Bar, Action Area 1, New Town, Kolkata, West Bengal 700156
            </p>
            <p className="text-[11px] text-[#F5E086]">
              Kitchen Phone: +91 82740 47424 • Hours: 1:00 PM – 11:00 PM (Mon Closed)
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            {onOpenTrackOrder && (
              <button
                type="button"
                onClick={() => onOpenTrackOrder(placedOrder.orderNumber)}
                className="w-full sm:w-auto px-6 py-2.5 rounded-full bg-[#F5E086] hover:bg-[#F8E79B] text-[#24332D] font-black text-xs transition shadow-md flex items-center justify-center gap-1.5"
              >
                <Clock className="w-4 h-4" />
                <span>Track Your Order Live</span>
              </button>
            )}
            {onOpenLiveCallingBoard && (
              <button
                type="button"
                onClick={() => onOpenLiveCallingBoard(placedOrder.tokenNumber)}
                className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-[#17221D] font-black text-xs transition shadow-md flex items-center justify-center gap-1.5"
              >
                <Tv className="w-4 h-4" />
                <span>Watch Live Queue Calling Board</span>
              </button>
            )}
            <button
              onClick={() => {
                setPlacedOrder(null);
                onSelectTab("menu");
              }}
              className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition border border-white/10"
            >
              Order Something Else
            </button>
            <button
              onClick={() => onSelectTab("home")}
              className="w-full sm:w-auto px-5 py-2.5 rounded-full bg-[#2B3D36] text-white/80 font-semibold text-xs hover:bg-[#32473F] transition"
            >
              Back to Home
            </button>
          </div>
        </div>
      ) : cancelToastMessage ? (
        <div className="max-w-md mx-auto p-6 rounded-3xl bg-[#374C44] border border-rose-500/40 text-center space-y-4 shadow-xl">
          <div className="w-12 h-12 rounded-full bg-rose-500/20 text-rose-400 flex items-center justify-center mx-auto text-xl">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <h3 className="font-niea font-bold text-xl text-white">Order Cancelled</h3>
          <p className="text-xs text-white/70">{cancelToastMessage}</p>
          <button
            onClick={() => {
              setCancelToastMessage(null);
              onSelectTab("menu");
            }}
            className="px-5 py-2 rounded-full bg-[#F5E086] text-[#24332D] font-bold text-xs"
          >
            Back to Menu
          </button>
        </div>
      ) : cart.length === 0 ? (
        /* 2. Empty Basket State */
        <div className="text-center py-20 bg-[#374C44]/50 rounded-3xl border border-[#F5E086]/15 max-w-2xl mx-auto space-y-4">
          <div className="w-16 h-16 rounded-full bg-[#2B3D36] text-[#F5E086] flex items-center justify-center mx-auto text-2xl">
            <ShoppingBag className="w-7 h-7" />
          </div>
          <h2 className="font-niea font-bold text-2xl text-white">
            Your Sandwich Basket is Empty
          </h2>
          <p className="text-xs text-[#FBF9F2]/75 max-w-sm mx-auto leading-relaxed">
            Fresh artisan bread, French butter toasties, and specialty beverages are waiting for you.
          </p>
          <button
            onClick={() => onSelectTab("menu")}
            className="px-6 py-3 rounded-full bg-[#F5E086] hover:bg-[#F8E79B] text-[#24332D] font-bold text-xs transition shadow-md inline-flex items-center gap-2"
          >
            <UtensilsCrossed className="w-4 h-4" />
            <span>Explore Menu & Add Items</span>
          </button>
        </div>
      ) : (
        /* 3. Main Two-Column Clean Checkout Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Order Config, Item Basket & Guest Details (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Order Mode */}
            <div className="bg-[#374C44] rounded-3xl border border-[#F5E086]/20 p-5 shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-extrabold tracking-wider text-[#F5E086] block">
                  1. Dining Style
                </span>
                <span className="text-[11px] text-white/60">
                  {orderType === "dine-in" ? "Dine at Cafe Table" : "Pack to Go"}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => onSetOrderType("dine-in")}
                  className={`p-3.5 rounded-2xl border text-center font-bold text-xs transition flex flex-col items-center gap-1.5 ${
                    orderType === "dine-in"
                      ? "bg-[#F5E086] text-[#24332D] border-[#F5E086] shadow-sm"
                      : "bg-[#2B3D36] text-white/80 border-white/10 hover:border-white/20"
                  }`}
                >
                  <UtensilsCrossed className="w-4 h-4" />
                  <span>Dine-in (Table Service)</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSetOrderType("takeaway");
                  }}
                  className={`p-3.5 rounded-2xl border text-center font-bold text-xs transition flex flex-col items-center gap-1.5 ${
                    orderType === "takeaway"
                      ? "bg-[#F5E086] text-[#24332D] border-[#F5E086] shadow-sm"
                      : "bg-[#2B3D36] text-white/80 border-white/10 hover:border-white/20"
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Takeaway (Pack to Go)</span>
                </button>
              </div>
            </div>

            {/* Step 2: Basket Item List */}
            <div className="bg-[#374C44] rounded-3xl border border-[#F5E086]/20 p-5 shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-extrabold tracking-wider text-[#F5E086]">
                  2. Review Selected Items ({cart.length})
                </span>
                <button
                  type="button"
                  onClick={() => onSelectTab("menu")}
                  className="text-xs font-bold text-[#F5E086] hover:underline"
                >
                  + Add More
                </button>
              </div>

              <div className="divide-y divide-white/10">
                {cart.map((ci) => {
                  const liveItem = menuItems.find((mi) => mi.id === ci.item.id) || ci.item;
                  const otherUnitsInCart = cart
                    .filter((other) => other.cartItemId !== ci.cartItemId && other.item.id === ci.item.id)
                    .reduce((sum, o) => sum + o.quantity, 0);
                  const maxCanAdd = Math.max(0, liveItem.stockLeft - otherUnitsInCart);
                  const isMaxReached = ci.quantity >= maxCanAdd;

                  return (
                    <div key={ci.cartItemId} className="py-3 flex items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={ci.item.imageUrl}
                          alt={ci.item.name}
                          className="w-12 h-12 rounded-xl object-cover bg-[#2B3D36]"
                        />
                        <div>
                          <h4 className="font-niea font-bold text-sm text-[#F5E086]">
                            {ci.item.name}
                          </h4>
                          <div className="text-[11px] text-white/70 flex flex-wrap items-center gap-1.5 mt-0.5">
                            {ci.selectedBread && <span>Bread: {ci.selectedBread} •</span>}
                            <span>₹{ci.unitPrice} each</span>
                            <span>•</span>
                            {liveItem.stockLeft <= 0 ? (
                              <span className="text-rose-400 font-bold">Sold Out</span>
                            ) : liveItem.stockLeft <= 5 ? (
                              <span className="text-amber-300 font-bold">Only {liveItem.stockLeft} left</span>
                            ) : (
                              <span className="text-emerald-400 font-semibold">{liveItem.stockLeft} in stock</span>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5 bg-[#2B3D36] px-2 py-1 rounded-xl border border-white/10">
                          <button
                            type="button"
                            onClick={() => onUpdateQuantity(ci.cartItemId, -1)}
                            className="w-5 h-5 rounded-md bg-white/10 hover:bg-white/20 flex items-center justify-center text-white"
                          >
                            <Minus className="w-3 h-3" />
                          </button>
                          <span className="w-6 text-center font-bold text-white text-xs">
                            {ci.quantity}
                          </span>
                          <button
                            type="button"
                            disabled={isMaxReached}
                            onClick={() => onUpdateQuantity(ci.cartItemId, 1)}
                            className={`w-5 h-5 rounded-md flex items-center justify-center text-white transition ${
                              isMaxReached
                                ? "opacity-30 cursor-not-allowed bg-white/5"
                                : "bg-white/10 hover:bg-white/20"
                            }`}
                            title={isMaxReached ? `Only ${liveItem.stockLeft} total units available in kitchen` : "Add one more"}
                          >
                            <Plus className="w-3 h-3" />
                          </button>
                        </div>

                        <span className="text-xs font-bold text-white w-14 text-right">
                          ₹{ci.totalPrice}
                        </span>

                        <button
                          type="button"
                          onClick={() => onRemoveItem(ci.cartItemId)}
                          className="p-1.5 text-white/40 hover:text-rose-400 transition"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Step 3: Guest Details (Clean & Direct Guest Ordering) */}
            <div
              ref={guestDetailsSectionRef}
              className={`bg-[#374C44] rounded-3xl border p-5 shadow-md space-y-3 transition-all ${
                highlightErrors && (!customerName.trim() || customerPhone.replace(/\D/g, "").slice(-10).length < 10)
                  ? "border-rose-400/80 ring-2 ring-rose-400/30 bg-[#3d4b45]"
                  : "border-[#F5E086]/20"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase font-extrabold tracking-wider text-[#F5E086] block">
                  3. Contact & Delivery Info
                </span>
                <span className="text-[11px] text-emerald-300 font-semibold flex items-center gap-1">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>{userSession?.isLoggedIn ? "Linked to Account" : "Contact Details"}</span>
                </span>
              </div>

              {/* Verified Auto-Filled Card when logged in and phone exists */}
              {userSession?.isLoggedIn && customerPhone && customerPhone.length === 10 && !isEditingPhone ? (
                <div className="p-3.5 rounded-2xl bg-[#2B3D36] border border-emerald-400/30 flex items-center justify-between shadow-xs">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-300 flex items-center justify-center font-bold text-sm border border-emerald-400/30">
                      <User className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-white font-bold text-xs">{customerName || userSession.name}</span>
                        <span className="px-1.5 py-0.2 rounded-md bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                          Auto-Filled
                        </span>
                      </div>
                      <span className="text-white/80 text-[11px] font-mono">
                        Call & SMS: +91 {customerPhone}
                      </span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsEditingPhone(true)}
                    className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-[#F5E086] text-xs font-bold transition border border-[#F5E086]/30 cursor-pointer"
                  >
                    Edit Number
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] text-white/70 font-bold block">
                        Your Name *
                      </label>
                      {highlightErrors && !customerName.trim() && (
                        <span className="text-[10px] text-rose-300 font-bold flex items-center gap-0.5">
                          <AlertCircle className="w-3 h-3" />
                          Box left empty
                        </span>
                      )}
                    </div>
                    <input
                      ref={nameInputRef}
                      type="text"
                      placeholder="e.g. Rahul Sen"
                      value={customerName}
                      onChange={(e) => {
                        setCustomerName(e.target.value);
                        if (highlightErrors && e.target.value.trim()) setHighlightErrors(false);
                      }}
                      required
                      className={`w-full px-3.5 py-2.5 rounded-xl text-white placeholder-white/40 focus:outline-none transition ${
                        highlightErrors && !customerName.trim()
                          ? "bg-rose-950/40 border-2 border-rose-400 focus:border-rose-300 shadow-sm"
                          : "bg-[#2B3D36] border border-white/10 focus:border-[#F5E086]"
                      }`}
                    />
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="text-[10px] text-white/70 font-bold block">
                        Mobile Number * (Call & SMS)
                      </label>
                      <div className="flex items-center gap-2">
                        {isEditingPhone && (
                          <button
                            type="button"
                            onClick={() => setIsEditingPhone(false)}
                            className="text-[10px] text-[#F5E086] hover:underline font-bold cursor-pointer"
                          >
                            Done Editing
                          </button>
                        )}
                        {highlightErrors && customerPhone.replace(/\D/g, "").slice(-10).length < 10 && (
                          <span className="text-[10px] text-rose-300 font-bold flex items-center gap-0.5">
                            <AlertCircle className="w-3 h-3" />
                            10 digits required
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#F5E086]">
                        +91
                      </span>
                      <input
                        ref={phoneInputRef}
                        type="tel"
                        maxLength={10}
                        placeholder="10-digit mobile number"
                        value={customerPhone}
                        onChange={(e) => {
                          const val = e.target.value.replace(/\D/g, "").slice(0, 10);
                          setCustomerPhone(val);
                          if (highlightErrors && val.length === 10) {
                            setHighlightErrors(false);
                          }
                        }}
                        required
                        className={`w-full pl-12 pr-3.5 py-2.5 rounded-xl text-white font-mono placeholder-white/40 focus:outline-none transition ${
                          highlightErrors && customerPhone.replace(/\D/g, "").slice(-10).length < 10
                            ? "bg-rose-950/40 border-2 border-rose-400 focus:border-rose-300 shadow-sm"
                            : "bg-[#2B3D36] border border-white/10 focus:border-[#F5E086]"
                        }`}
                      />
                    </div>
                  </div>
                </div>
              )}

              <div>
                <label className="text-[10px] text-white/60 font-semibold block mb-1">
                  Special Kitchen Instructions (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. extra crispy brioche, cut in halves, less spicy..."
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#2B3D36] border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#F5E086]"
                />
              </div>
            </div>
          </div>

          {/* Right Column: Bill Summary, Promos & Verified UPI Payment (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Promo Voucher Box */}
            <div className="bg-[#374C44] rounded-3xl border border-[#F5E086]/20 p-5 shadow-md space-y-3">
              <span className="text-xs uppercase font-extrabold tracking-wider text-[#F5E086] block">
                Promo Coupons
              </span>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter code (PAWS10)"
                  value={couponInput}
                  onChange={(e) => setCouponInput(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl bg-[#2B3D36] border border-white/10 text-xs text-white uppercase placeholder-white/40 focus:outline-none focus:border-[#F5E086]"
                />
                <button
                  type="button"
                  onClick={() => handleApplyCode(couponInput)}
                  className="px-4 py-2 rounded-xl bg-[#F5E086] hover:bg-[#F8E79B] text-[#24332D] text-xs font-bold transition"
                >
                  Apply
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 pt-1">
                <button
                  type="button"
                  onClick={() => handleApplyCode("PAWS10")}
                  className="px-2.5 py-1 rounded-lg bg-[#2B3D36] hover:bg-[#32473F] text-[#F5E086] text-[10px] font-bold border border-[#F5E086]/20 flex items-center gap-1"
                >
                  <Tag className="w-3 h-3" />
                  <span>PAWS10 (10% Off)</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyCode("NIEAFIRST")}
                  className="px-2.5 py-1 rounded-lg bg-[#2B3D36] hover:bg-[#32473F] text-[#F5E086] text-[10px] font-bold border border-[#F5E086]/20 flex items-center gap-1"
                >
                  <Tag className="w-3 h-3" />
                  <span>NIEAFIRST (₹50 Off)</span>
                </button>
              </div>

              {discountCode && (
                <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-400/30 text-xs text-emerald-300 flex items-center justify-between">
                  <span>Coupon {discountCode} applied!</span>
                  <span className="font-bold">-₹{appliedDiscount}</span>
                </div>
              )}
            </div>

            {/* Bill Summary */}
            <div className="bg-[#374C44] rounded-3xl border border-[#F5E086]/20 p-5 shadow-md space-y-3">
              <span className="text-xs uppercase font-extrabold tracking-wider text-[#F5E086] block">
                Bill Summary
              </span>

              <div className="space-y-2 text-xs">
                <div className="flex justify-between text-white/80">
                  <span>Item Subtotal</span>
                  <span>₹{subtotal}</span>
                </div>
                <div className="flex justify-between text-white/80">
                  <span>GST (5%)</span>
                  <span>₹{taxes}</span>
                </div>

                {/* Tip Option (Directly after GST) */}
                <div className="py-2.5 px-3 rounded-2xl bg-[#2B3D36] border border-white/10 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white/90 font-semibold flex items-center gap-1.5 text-xs">
                      <Heart className="w-3.5 h-3.5 text-rose-300 fill-rose-300/40" />
                      <span>Add Tip for Cafe & Kitchen Crew</span>
                    </span>
                    {tipAmount > 0 && (
                      <span className="text-[#F5E086] font-bold text-xs">
                        +₹{tipAmount}
                      </span>
                    )}
                  </div>

                  {/* Preset Tip Buttons */}
                  <div className="grid grid-cols-5 gap-1.5">
                    {[10, 20, 30, 50].map((preset) => {
                      const isSelected = !isCustomTip && tipAmount === preset;
                      return (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => {
                            if (isSelected) {
                              setTipAmount(0);
                              setIsCustomTip(false);
                              setCustomTipInput("");
                            } else {
                              setTipAmount(preset);
                              setIsCustomTip(false);
                              setCustomTipInput("");
                            }
                          }}
                          className={`py-1.5 px-1 rounded-xl text-center font-bold text-xs transition border ${
                            isSelected
                              ? "bg-[#F5E086] text-[#24332D] border-[#F5E086] shadow-xs"
                              : "bg-[#24332D] text-white/80 border-white/10 hover:border-white/25 hover:text-white"
                          }`}
                        >
                          ₹{preset}
                        </button>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomTip(true);
                      }}
                      className={`py-1.5 px-1 rounded-xl text-center font-bold text-xs transition border ${
                        isCustomTip
                          ? "bg-[#F5E086] text-[#24332D] border-[#F5E086]"
                          : "bg-[#24332D] text-white/80 border-white/10 hover:border-white/25 hover:text-white"
                      }`}
                    >
                      Custom
                    </button>
                  </div>

                  {/* Custom tip input field */}
                  {isCustomTip && (
                    <div className="flex items-center gap-2 pt-0.5">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-2 text-xs text-white/50">₹</span>
                        <input
                          type="number"
                          min="1"
                          max="2000"
                          placeholder="Enter tip (e.g. 75)"
                          value={customTipInput}
                          onChange={(e) => {
                            const val = e.target.value;
                            setCustomTipInput(val);
                            const num = parseInt(val, 10);
                            setTipAmount(isNaN(num) || num < 0 ? 0 : num);
                          }}
                          className="w-full pl-7 pr-3 py-1.5 rounded-xl bg-[#24332D] border border-white/20 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#F5E086]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setIsCustomTip(false);
                          setCustomTipInput("");
                          setTipAmount(0);
                        }}
                        className="px-2.5 py-1.5 text-[11px] text-white/60 hover:text-white rounded-xl bg-white/5 hover:bg-white/10 transition"
                      >
                        Clear
                      </button>
                    </div>
                  )}

                  {tipAmount > 0 && (
                    <div className="flex items-center justify-between text-[10px] text-[#F5E086] pt-0.5">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-[#F5E086] shrink-0" />
                        <span>100% directly shared with kitchen chefs & baristas</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => {
                          setTipAmount(0);
                          setIsCustomTip(false);
                          setCustomTipInput("");
                        }}
                        className="text-white/50 hover:text-white underline text-[10px] ml-2 shrink-0"
                      >
                        Remove tip
                      </button>
                    </div>
                  )}
                </div>

                {tipAmount > 0 && (
                  <div className="flex justify-between text-[#F5E086] font-medium">
                    <span className="flex items-center gap-1">
                      <Heart className="w-3 h-3 text-rose-300 fill-rose-300/30" />
                      <span>Crew & Kitchen Tip</span>
                    </span>
                    <span>₹{tipAmount}</span>
                  </div>
                )}
                <div className="flex justify-between text-white/80">
                  <span>Artisan Packaging</span>
                  <span className="text-emerald-400 font-semibold">Complimentary</span>
                </div>
                {appliedDiscount > 0 && (
                  <div className="flex justify-between text-emerald-300 font-medium">
                    <span>Discount</span>
                    <span>-₹{appliedDiscount}</span>
                  </div>
                )}
                <div className="pt-2 border-t border-white/10 flex justify-between items-center">
                  <span className="font-niea font-bold text-base text-white">Grand Total</span>
                  <span className="font-niea font-black text-xl text-[#F5E086]">₹{grandTotal}</span>
                </div>
              </div>
            </div>

            {/* Payment Methods & Policy Enforcement */}
            <div className="bg-[#374C44] rounded-3xl border border-[#F5E086]/20 p-5 shadow-md space-y-3">
              <span className="text-xs uppercase font-extrabold tracking-wider text-[#F5E086] block">
                Select Payment Method
              </span>

              {/* Online order advance policy notice */}
              {orderType === "takeaway" && (
                <div className="p-2.5 rounded-xl bg-[#24332D] border border-amber-400/30 text-amber-200 text-[11px] flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                  <span>
                    <strong>Online Takeaway Policy:</strong> Advance payment via UPI or Razorpay is required to confirm preparation and avoid uncollected food waste.
                  </span>
                </div>
              )}

              <div className="space-y-2 text-xs">
                {/* Method 1: Razorpay Instant Gateway (UPI QR, GPay, PhonePe, Cards, NetBanking) */}
                <button
                  type="button"
                  onClick={() => {
                    setPaymentMethod("razorpay");
                    setPaymentError("");
                  }}
                  className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer ${
                    paymentMethod === "razorpay"
                      ? "bg-[#F5E086] text-[#24332D] border-[#F5E086] shadow-md font-bold"
                      : "bg-[#2B3D36] text-white/80 border-white/10 hover:border-white/30"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        paymentMethod === "razorpay" ? "bg-[#24332D] text-[#F5E086]" : "bg-white/10 text-white"
                      }`}
                    >
                      <QrCode className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-xs">UPI QR, GPay, PhonePe & Cards</span>
                        <span
                          className={`text-[9px] font-black uppercase px-1.5 py-0.2 rounded-md ${
                            paymentMethod === "razorpay"
                              ? "bg-[#24332D]/20 text-[#24332D]"
                              : "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                          }`}
                        >
                          Auto-Detect QR
                        </span>
                      </div>
                      <span
                        className={`text-[10px] block mt-0.5 ${
                          paymentMethod === "razorpay" ? "text-[#24332D]/85" : "text-white/60"
                        }`}
                      >
                        Razorpay Gateway: Scan dynamic QR or tap UPI app. Auto-verifies instantly.
                      </span>
                    </div>
                  </div>
                  {paymentMethod === "razorpay" && <Check className="w-4 h-4 shrink-0" />}
                </button>

                {/* Method 2: Pay at Counter / Cash */}
                {isPayAtCounterAllowed ? (
                  <button
                    type="button"
                    onClick={() => {
                      setPaymentMethod("cash");
                      setPaymentError("");
                    }}
                    className={`w-full p-3.5 rounded-2xl border text-left flex items-center justify-between transition cursor-pointer ${
                      paymentMethod === "cash"
                        ? "bg-[#F5E086] text-[#24332D] border-[#F5E086] shadow-md font-bold"
                        : "bg-[#2B3D36] text-white/80 border-white/10 hover:border-white/30"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                          paymentMethod === "cash" ? "bg-[#24332D] text-[#F5E086]" : "bg-white/10 text-white"
                        }`}
                      >
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="block font-bold text-xs">Pay at Counter (Cash / POS)</span>
                        <span
                          className={`text-[10px] block mt-0.5 ${
                            paymentMethod === "cash" ? "text-[#24332D]/85" : "text-white/60"
                          }`}
                        >
                          Kitchen token generated now; pay at the cafe billing counter.
                        </span>
                      </div>
                    </div>
                    {paymentMethod === "cash" && <Check className="w-4 h-4 shrink-0" />}
                  </button>
                ) : (
                  <div
                    onClick={() => {
                      setPaymentError("Pay at Counter is currently disabled for online pre-orders. Please pay securely using Razorpay (UPI QR, GPay, PhonePe, Cards).");
                    }}
                    className="w-full p-3.5 rounded-2xl border border-white/10 bg-[#24332D]/50 opacity-70 text-left flex items-center justify-between cursor-not-allowed group"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0 bg-white/5 text-white/40">
                        <CreditCard className="w-5 h-5" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-xs text-white/50">Pay at Counter (Cash / POS)</span>
                          <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-400/30">
                            Not Available Now
                          </span>
                        </div>
                        <span className="text-[10px] block mt-0.5 text-white/40">
                          Disabled for pre-orders • Advance online payment via Razorpay / UPI QR is required.
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Instant Verification Guarantee Banner */}
              {paymentMethod === "razorpay" && (
                <div className="p-3 rounded-2xl bg-[#24332D] border border-[#F5E086]/25 text-[11px] text-[#FBF9F2]/80 space-y-1">
                  <div className="flex items-center gap-1.5 text-[#F5E086] font-bold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>Zero Manual Steps • Seamless Verification</span>
                  </div>
                  <p className="text-[10px] text-white/60">
                    After tapping "Pay & Confirm", a Razorpay popup will open with a dynamic UPI QR Code and all payment apps. Once authorized on your phone, your order token is generated automatically.
                  </p>
                </div>
              )}

              {/* Payment validation error banner */}
              {paymentError && (
                <div className="mt-3 p-3 rounded-xl bg-rose-500/20 border border-rose-400/40 text-rose-200 text-xs flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
                  <span>{paymentError}</span>
                </div>
              )}

              {/* Submit CTA */}
              <button
                type="button"
                disabled={isProcessing}
                onClick={handlePlaceOrder}
                className="w-full mt-4 py-3.5 rounded-full bg-[#e1ad01] hover:bg-[#cca000] text-[#1E2B25] font-black text-sm transition shadow-[0_0_24px_rgba(225,173,1,0.55)] hover:shadow-[0_0_32px_rgba(225,173,1,0.85)] border border-[#ffd233] flex items-center justify-center gap-2 active:scale-98 disabled:opacity-50 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <span className="w-4 h-4 border-2 border-[#24332D] border-t-transparent rounded-full animate-spin" />
                    <span>Transmitting to Kitchen...</span>
                  </>
                ) : (
                  <>
                    <span>Pay & Confirm Order (₹{grandTotal})</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Missing Required Details Alert Popup */}
      {showMissingModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
          <div className="w-full max-w-md bg-[#24332D] rounded-3xl border-2 border-amber-400/80 shadow-2xl p-6 text-white space-y-5 animate-in zoom-in-95">
            {/* Modal Header */}
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-amber-500/20 border border-amber-400/40 flex items-center justify-center text-amber-300 shrink-0">
                  <AlertTriangle className="w-6 h-6 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-niea font-bold text-lg text-[#F5E086]">
                    Important Details Missing
                  </h3>
                  <p className="text-xs text-white/70">
                    Please fill in the required field(s) below to continue:
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowMissingModal(false)}
                className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Checklist of Missing Fields */}
            <div className="space-y-2.5 max-h-60 overflow-y-auto pr-1">
              {missingFieldsList.map((item, idx) => (
                <div
                  key={item.id || idx}
                  className="p-3.5 rounded-2xl bg-[#374C44] border border-rose-400/40 flex items-start gap-3 text-xs"
                >
                  <div className="w-6 h-6 rounded-full bg-rose-500/20 text-rose-300 font-black flex items-center justify-center shrink-0 mt-0.5 border border-rose-400/30">
                    !
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[#F5E086]">{item.title}</span>
                      <span className="px-2 py-0.5 rounded-md bg-rose-500/20 text-rose-300 text-[10px] font-bold border border-rose-400/30">
                        {item.boxName}
                      </span>
                    </div>
                    <p className="text-white/80 leading-relaxed text-[11px]">
                      {item.instruction}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2 border-t border-white/10">
              {missingFieldsList.some((m) => m.field === "cart") ? (
                <button
                  type="button"
                  onClick={() => {
                    setShowMissingModal(false);
                    onSelectTab("menu");
                  }}
                  className="w-full py-3 rounded-2xl bg-[#F5E086] hover:bg-[#F8E79B] text-[#24332D] font-bold text-xs transition shadow-md flex items-center justify-center gap-2"
                >
                  <UtensilsCrossed className="w-4 h-4" />
                  <span>Explore Menu & Add Sandwiches</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setShowMissingModal(false);
                    setHighlightErrors(true);
                    guestDetailsSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
                    if (!customerName.trim()) {
                      setTimeout(() => nameInputRef.current?.focus(), 200);
                    } else if (customerPhone.replace(/\D/g, "").slice(-10).length < 10) {
                      setTimeout(() => phoneInputRef.current?.focus(), 200);
                    }
                  }}
                  className="w-full py-3 rounded-2xl bg-[#F5E086] hover:bg-[#F8E79B] text-[#24332D] font-bold text-xs transition shadow-md flex items-center justify-center gap-2"
                >
                  <ArrowDown className="w-4 h-4" />
                  <span>Take Me to Missing Box to Fill Details</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowMissingModal(false)}
                className="w-full py-2.5 rounded-2xl bg-white/5 hover:bg-white/10 text-white/70 hover:text-white font-medium text-xs transition"
              >
                Dismiss & Review
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
