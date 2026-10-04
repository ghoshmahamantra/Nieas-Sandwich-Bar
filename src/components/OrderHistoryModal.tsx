import React, { useState, useEffect, useMemo } from "react";
import {
  X,
  ShoppingBag,
  Receipt,
  Clock,
  Calendar,
  CheckCircle2,
  RotateCcw,
  Search,
  Filter,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Utensils,
  CreditCard,
  QrCode,
  ArrowRight,
  Coffee,
  Check,
  PackageCheck,
  AlertCircle,
  Star,
  MessageSquareShare,
  Share2,
  Copy,
  ExternalLink,
  Heart,
  Send,
  Download,
  FileText,
  Instagram,
  MessageCircle,
  Twitter,
} from "lucide-react";
import { OrderRecord, CartItem, UserSession } from "../types/niea";
import { generateInvoicePdf } from "../utils/generateInvoicePdf";
import { getUserOrdersFromFirestore } from "../services/firebase";

interface OrderHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders?: OrderRecord[];
  userSession?: UserSession | null;
  myOrderIds?: string[];
  onOpenAuth?: () => void;
  onReorder?: (items: CartItem[]) => void;
  onShareFeedback?: (
    orderId: string,
    feedback: { rating: number; comment: string; platform: string }
  ) => void;
  onNavigateToMenu?: () => void;
  onTrackOrder?: (orderNumber: string) => void;
}

export const OrderHistoryModal: React.FC<OrderHistoryModalProps> = ({
  isOpen,
  onClose,
  orders: propOrders,
  userSession,
  myOrderIds = [],
  onOpenAuth,
  onReorder,
  onShareFeedback,
  onNavigateToMenu,
  onTrackOrder,
}) => {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | "dine-in" | "takeaway">("all");
  const [expandedOrderId, setExpandedOrderId] = useState<string | null>(null);
  const [reorderSuccessId, setReorderSuccessId] = useState<string | null>(null);
  const [downloadingInvoiceId, setDownloadingInvoiceId] = useState<string | null>(null);

  // Social Feedback states
  const [feedbackOrder, setFeedbackOrder] = useState<OrderRecord | null>(null);
  const [feedbackRating, setFeedbackRating] = useState<number>(5);
  const [feedbackComment, setFeedbackComment] = useState<string>("");
  const [copiedReview, setCopiedReview] = useState(false);
  const [toastNotification, setToastNotification] = useState<string | null>(null);

  const QUICK_TAGS = [
    "Crispiest sourdough crust!",
    "Gooey cheese pull",
    "Rich truffle aroma",
    "Perfect matcha pairing",
    "Lovely cat friendly cafe",
    "Outstanding comfort food",
  ];

  // Sync ONLY current user's orders whenever modal is opened
  useEffect(() => {
    if (!isOpen) return;

    try {
      let rawList: OrderRecord[] = [];
      if (propOrders && propOrders.length > 0) {
        rawList = propOrders;
      } else {
        const saved = localStorage.getItem("niea_orders");
        if (saved) {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed)) {
            rawList = parsed;
          }
        }
      }

      // Filter strictly by user session or browser order IDs
      const userPhoneClean = userSession?.phoneNumber?.replace(/\D/g, "").slice(-10);
      const savedPhoneClean = typeof window !== "undefined" ? localStorage.getItem("niea_customer_phone")?.replace(/\D/g, "").slice(-10) : "";
      const sessionIds = myOrderIds;

      const userOnly = rawList.filter((o) => {
        if (!o) return false;
        if (
          sessionIds.includes(o.id) ||
          sessionIds.includes(o.orderNumber) ||
          (o.tokenNumber && sessionIds.includes(o.tokenNumber))
        ) {
          return true;
        }
        if ((userSession as any)?.uid && (o as any).userId === (userSession as any).uid) {
          return true;
        }
        if (userSession?.email && o.customerEmail && o.customerEmail.toLowerCase() === userSession.email.toLowerCase()) {
          return true;
        }
        if (userPhoneClean && o.customerPhone) {
          const oPhone = o.customerPhone.replace(/\D/g, "").slice(-10);
          if (oPhone && oPhone === userPhoneClean) {
            return true;
          }
        }
        if (savedPhoneClean && o.customerPhone) {
          const oPhone = o.customerPhone.replace(/\D/g, "").slice(-10);
          if (oPhone && oPhone === savedPhoneClean) {
            return true;
          }
        }
        return false;
      });

      setOrders(userOnly);

      // Also pull directly from Cloud Firestore user subcollection if user is identified
      const lookupKey = (userSession as any)?.uid || userPhoneClean || savedPhoneClean;
      if (lookupKey) {
        getUserOrdersFromFirestore(lookupKey).then((cloudOrders) => {
          if (Array.isArray(cloudOrders) && cloudOrders.length > 0) {
            setOrders((prev) => {
              const map = new Map<string, OrderRecord>();
              for (const o of cloudOrders) {
                const key = o.id || o.orderNumber;
                if (key) map.set(key, o);
              }
              for (const o of prev) {
                const key = o.id || o.orderNumber;
                if (key) map.set(key, o);
              }
              return Array.from(map.values()).sort((a, b) => {
                const tA = new Date(a.createdAt || 0).getTime();
                const tB = new Date(b.createdAt || 0).getTime();
                return tB - tA;
              });
            });
          }
        }).catch(() => {});
      }
    } catch (e) {
      console.error("Failed to parse orders", e);
      setOrders([]);
    }
  }, [isOpen, propOrders, userSession, myOrderIds]);

  // Derived Summary Statistics
  const summary = useMemo(() => {
    const totalOrders = orders.length;
    const totalSpent = orders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
    const totalItems = orders.reduce(
      (sum, o) => sum + o.items.reduce((iSum, item) => iSum + (item.quantity || 1), 0),
      0
    );
    const completedOrders = orders.filter((o) => o.status === "served").length;
    const activeOrders = orders.filter((o) => o.status !== "served").length;

    return {
      totalOrders,
      totalSpent,
      totalItems,
      completedOrders,
      activeOrders,
    };
  }, [orders]);

  // Filtered orders list
  const filteredOrders = useMemo(() => {
    return orders.filter((order) => {
      // Filter by type
      if (filterType !== "all" && order.orderType !== filterType) {
        return false;
      }
      // Filter by query (search orderNumber or item names)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesNumber = order.orderNumber.toLowerCase().includes(q);
        const matchesCustomer =
          order.customerName?.toLowerCase().includes(q) ||
          order.customerPhone?.includes(q);
        const matchesItems = order.items.some((ci) =>
          ci.item.name.toLowerCase().includes(q)
        );
        return matchesNumber || matchesCustomer || matchesItems;
      }
      return true;
    });
  }, [orders, filterType, searchQuery]);

  const toggleExpand = (id: string) => {
    setExpandedOrderId((prev) => (prev === id ? null : id));
  };

  const handleReorderClick = (order: OrderRecord) => {
    if (onReorder && order.items.length > 0) {
      onReorder(order.items);
      setReorderSuccessId(order.id);
      setTimeout(() => {
        setReorderSuccessId(null);
        onClose();
      }, 900);
    }
  };

  const handleDownloadInvoice = (order: OrderRecord) => {
    try {
      setDownloadingInvoiceId(order.id);
      generateInvoicePdf(order);
      showToast(`Invoice for ${order.orderNumber} downloaded successfully.`);
    } catch (err) {
      console.error("Failed to generate PDF invoice:", err);
      showToast("Unable to generate PDF invoice. Please try again.");
    } finally {
      setTimeout(() => {
        setDownloadingInvoiceId(null);
      }, 700);
    }
  };

  const showToast = (msg: string) => {
    setToastNotification(msg);
    setTimeout(() => setToastNotification(null), 3500);
  };

  const handleOpenFeedback = (order: OrderRecord) => {
    setFeedbackOrder(order);
    const existingRating = order.feedbackRating || 5;
    setFeedbackRating(existingRating);

    if (order.feedbackComment) {
      setFeedbackComment(order.feedbackComment);
    } else {
      const itemNames = order.items
        .slice(0, 2)
        .map((i) => i.item.name)
        .join(" & ");
      setFeedbackComment(
        `Just had an incredible sourdough melt (${itemNames}) at NiEA'S Sandwich Bar in New Town Kolkata! Crispy buttery sourdough crust, rich fillings, and great ambience. Highly recommended! #NieasSandwichBar #KolkataCafes #SourdoughMelts #ArtisanSando`
      );
    }
  };

  const handleToggleTag = (tag: string) => {
    if (feedbackComment.includes(tag)) {
      setFeedbackComment((prev) =>
        prev.replace(tag, "").replace(/\s+/g, " ").trim()
      );
    } else {
      setFeedbackComment((prev) => `${prev} ${tag}`);
    }
  };

  const saveFeedbackToRecord = (
    orderId: string,
    rating: number,
    comment: string,
    platform: string
  ) => {
    const updated = orders.map((o) => {
      if (o.id === orderId) {
        return {
          ...o,
          feedbackShared: true,
          feedbackRating: rating,
          feedbackComment: comment,
          feedbackPlatform: platform,
          feedbackSharedAt: new Date().toISOString(),
        };
      }
      return o;
    });

    setOrders(updated);
    try {
      localStorage.setItem("niea_orders", JSON.stringify(updated));
    } catch (e) {
      console.error(e);
    }

    if (onShareFeedback) {
      onShareFeedback(orderId, { rating, comment, platform });
    }
  };

  const handleShareToPlatform = (
    platform: "instagram" | "whatsapp" | "twitter" | "google" | "native"
  ) => {
    if (!feedbackOrder) return;

    saveFeedbackToRecord(feedbackOrder.id, feedbackRating, feedbackComment, platform);

    if (platform === "instagram") {
      navigator.clipboard?.writeText(feedbackComment);
      setCopiedReview(true);
      setTimeout(() => setCopiedReview(false), 2000);
      showToast("Review copied! Opening Instagram to tag @nieassandwichbar (+25 Paws Points)");
      setTimeout(() => {
        window.open("https://www.instagram.com/", "_blank", "noopener,noreferrer");
      }, 400);
    } else if (platform === "whatsapp") {
      const encoded = encodeURIComponent(
        `${feedbackComment}\n\nNiEA'S Sandwich Bar, Action Area 1, New Town Kolkata`
      );
      window.open(`https://api.whatsapp.com/send?text=${encoded}`, "_blank", "noopener,noreferrer");
      showToast("Opened WhatsApp to share review! (+25 Paws Points)");
    } else if (platform === "twitter") {
      const encoded = encodeURIComponent(feedbackComment);
      window.open(`https://twitter.com/intent/tweet?text=${encoded}`, "_blank", "noopener,noreferrer");
      showToast("Opened X to share review! (+25 Paws Points)");
    } else if (platform === "google") {
      window.open(
        "https://www.google.com/search?q=NiEA'S+Sandwich+Bar+New+Town+Kolkata+reviews",
        "_blank",
        "noopener,noreferrer"
      );
      showToast("Opened Google Review page! (+25 Paws Points)");
    } else if (platform === "native") {
      if (navigator.share) {
        navigator
          .share({
            title: "NiEA'S Sandwich Bar Review",
            text: feedbackComment,
            url: window.location.href,
          })
          .then(() => {
            showToast("Review shared successfully! (+25 Paws Points)");
          })
          .catch(() => {});
      } else {
        navigator.clipboard?.writeText(feedbackComment);
        setCopiedReview(true);
        setTimeout(() => setCopiedReview(false), 2000);
        showToast("Review copied to clipboard! (+25 Paws Points)");
      }
    }
  };

  const handleCopyReviewOnly = () => {
    navigator.clipboard?.writeText(feedbackComment);
    setCopiedReview(true);
    setTimeout(() => setCopiedReview(false), 2000);
    showToast("Review text copied to clipboard!");
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return isoString || "Recently";
    }
  };

  const getStatusBadge = (status: OrderRecord["status"]) => {
    switch (status) {
      case "received":
        return {
          label: "Order Received",
          classes: "bg-amber-500/20 text-amber-300 border-amber-500/30",
        };
      case "toasting":
        return {
          label: "In the Oven / Grilling",
          classes: "bg-orange-500/20 text-orange-300 border-orange-500/30",
        };
      case "ready":
        return {
          label: "Ready for Pickup",
          classes: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
        };
      case "served":
        return {
          label: "Completed",
          classes: "bg-sky-500/20 text-sky-300 border-sky-500/30",
        };
      default:
        return {
          label: status || "Confirmed",
          classes: "bg-white/10 text-white/80 border-white/20",
        };
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="order-history-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="order-history-modal-card"
        className="relative w-full max-w-2xl max-h-[90vh] flex flex-col bg-[#24332D] text-[#FBF9F2] rounded-3xl border border-white/15 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-white/10 bg-[#1D2B25]/90 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F5E086] text-[#24332D] flex items-center justify-center shadow-md">
              <Receipt className="w-5 h-5 font-black" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-niea font-bold text-base sm:text-lg text-[#F5E086]">
                  Past Orders & Receipts
                </h3>
                <span className="text-[10px] bg-white/10 text-white/80 px-2 py-0.5 rounded-full font-mono">
                  {summary.totalOrders} {summary.totalOrders === 1 ? "order" : "orders"}
                </span>
              </div>
              <p className="text-[11px] text-[#FBF9F2]/70">
                {userSession?.isLoggedIn
                  ? `Order history linked to ${userSession.name}`
                  : "Saved locally from your current and previous sessions"}
              </p>
            </div>
          </div>

          <button
            id="order-history-close-btn"
            onClick={onClose}
            className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition"
            aria-label="Close orders modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Summary Metric Ribbon */}
        {orders.length > 0 && (
          <div className="p-3 sm:px-5 bg-[#2B3D36]/80 border-b border-white/10 shrink-0">
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="p-2 rounded-xl bg-black/20 border border-white/5">
                <span className="text-[10px] text-white/60 uppercase font-bold block">
                  Total Orders
                </span>
                <span className="text-sm sm:text-base font-black text-[#F5E086]">
                  {summary.totalOrders}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-black/20 border border-white/5">
                <span className="text-[10px] text-white/60 uppercase font-bold block">
                  Total Spent
                </span>
                <span className="text-sm sm:text-base font-black text-emerald-400">
                  ₹{summary.totalSpent}
                </span>
              </div>
              <div className="p-2 rounded-xl bg-black/20 border border-white/5">
                <span className="text-[10px] text-white/60 uppercase font-bold block">
                  Items Tasted
                </span>
                <span className="text-sm sm:text-base font-black text-white">
                  {summary.totalItems}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Filter and Search Bar (Only if multiple orders) */}
        {orders.length > 0 && (
          <div className="p-3 sm:px-5 border-b border-white/10 bg-[#1D2B25]/40 flex flex-col sm:flex-row gap-2 shrink-0">
            {/* Search input */}
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-white/50" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by order # or sandwich name..."
                className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-black/30 border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#F5E086]"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2.5 top-2 text-xs text-white/50 hover:text-white"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Type Filter Buttons */}
            <div className="flex gap-1 bg-black/30 p-1 rounded-xl border border-white/10 self-start sm:self-auto">
              <button
                type="button"
                onClick={() => setFilterType("all")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  filterType === "all"
                    ? "bg-[#F5E086] text-[#24332D]"
                    : "text-white/70 hover:text-white"
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => setFilterType("dine-in")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  filterType === "dine-in"
                    ? "bg-[#F5E086] text-[#24332D]"
                    : "text-white/70 hover:text-white"
                }`}
              >
                Dine-in
              </button>
              <button
                type="button"
                onClick={() => setFilterType("takeaway")}
                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition ${
                  filterType === "takeaway"
                    ? "bg-[#F5E086] text-[#24332D]"
                    : "text-white/70 hover:text-white"
                }`}
              >
                Takeaway
              </button>
            </div>
          </div>
        )}

        {/* Scrollable Orders List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3">
          {filteredOrders.length === 0 ? (
            /* Empty State */
            <div className="py-12 px-4 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-3xl bg-white/5 border border-white/10 flex items-center justify-center text-white/40">
                <Coffee className="w-8 h-8 text-[#F5E086]/70" />
              </div>

              <div className="space-y-1 max-w-sm mx-auto">
                <h4 className="font-bold text-base text-white">
                  {orders.length === 0
                    ? "No Past Orders Found"
                    : "No matching orders found"}
                </h4>
                <p className="text-xs text-white/60">
                  {orders.length === 0
                    ? "Your handcrafted sourdough melts, toasties, and cafe receipts will show up here once you place an order."
                    : `No orders matching "${searchQuery}". Try a different keyword or reset filters.`}
                </p>
              </div>

              {orders.length === 0 ? (
                <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-2">
                  {!userSession?.isLoggedIn && onOpenAuth && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onOpenAuth();
                      }}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#F5E086] hover:bg-[#F8E79B] text-[#24332D] font-bold text-xs shadow-md transition"
                    >
                      <span>Sign In with Phone / Google</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      if (onNavigateToMenu) onNavigateToMenu();
                    }}
                    className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>Browse Menu & Order</span>
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery("");
                    setFilterType("all");
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-bold hover:bg-white/20 transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset Search Filter</span>
                </button>
              )}
            </div>
          ) : (
            filteredOrders.map((order) => {
              const statusInfo = getStatusBadge(order.status);
              const isExpanded = expandedOrderId === order.id;
              const isReorderSuccess = reorderSuccessId === order.id;

              return (
                <div
                  key={order.id}
                  id={`order-card-${order.id}`}
                  className="rounded-2xl bg-[#2B3D36] border border-white/10 hover:border-white/20 transition overflow-hidden shadow-md"
                >
                  {/* Card Header */}
                  <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono font-bold text-sm text-[#F5E086]">
                          {order.orderNumber}
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusInfo.classes}`}
                        >
                          {statusInfo.label}
                        </span>
                        <span className="text-[10px] uppercase font-bold px-2 py-0.5 rounded-full bg-white/10 text-white/80">
                          {order.orderType === "dine-in"
                            ? `Dine-in (${order.tableNumber || "Table"})`
                            : "Takeaway"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-white/60">
                        <Calendar className="w-3 h-3" />
                        <span>{formatDate(order.createdAt)}</span>
                        <span>•</span>
                        <span>
                          {order.items.reduce((s, i) => s + (i.quantity || 1), 0)} items
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 pt-2 sm:pt-0 border-t sm:border-t-0 border-white/10">
                      <div className="text-right">
                        <span className="text-[10px] text-white/50 block">Grand Total</span>
                        <span className="text-base font-black text-emerald-400">
                          ₹{order.grandTotal}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        {/* Live Track Order Button */}
                        {onTrackOrder && (
                          <button
                            type="button"
                            onClick={() => {
                              onClose();
                              onTrackOrder(order.orderNumber);
                            }}
                            className={`p-2 sm:px-2.5 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                              order.status !== "served"
                                ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 hover:bg-emerald-500/30"
                                : "bg-white/10 hover:bg-white/20 text-white border border-white/15"
                            }`}
                            title="Track live order status & preparation journey"
                          >
                            <span
                              className={`w-2 h-2 rounded-full ${
                                order.status !== "served"
                                  ? "bg-emerald-400 animate-pulse"
                                  : "bg-white/40"
                              }`}
                            />
                            <span className="hidden sm:inline">Track</span>
                            <span className="sm:hidden">Track</span>
                          </button>
                        )}

                        {/* Share Feedback Button */}
                        <button
                          type="button"
                          onClick={() => handleOpenFeedback(order)}
                          className={`p-2 sm:px-2.5 sm:py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition ${
                            order.feedbackShared
                              ? "bg-amber-400/20 text-[#F5E086] border border-[#F5E086]/40 hover:bg-[#F5E086] hover:text-[#24332D]"
                              : "bg-[#F5E086]/15 text-[#F5E086] hover:bg-[#F5E086] hover:text-[#24332D] border border-[#F5E086]/30"
                          }`}
                          title="Post review & feedback to cafe social media"
                        >
                          <MessageSquareShare className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">
                            {order.feedbackShared ? "Shared Review" : "Share Feedback"}
                          </span>
                          <span className="sm:hidden">Review</span>
                        </button>

                        {/* Download Invoice Button */}
                        <button
                          type="button"
                          onClick={() => handleDownloadInvoice(order)}
                          disabled={downloadingInvoiceId === order.id}
                          className="p-2 sm:px-2.5 sm:py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white hover:text-[#F5E086] border border-white/15 text-xs font-bold flex items-center gap-1.5 transition"
                          title="Download PDF invoice summary"
                        >
                          {downloadingInvoiceId === order.id ? (
                            <span className="w-3.5 h-3.5 border-2 border-[#F5E086] border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5 text-[#F5E086]" />
                          )}
                          <span className="hidden md:inline">Download Invoice</span>
                          <span className="md:hidden">Invoice</span>
                        </button>

                        {onReorder && (
                          <button
                            type="button"
                            onClick={() => handleReorderClick(order)}
                            disabled={isReorderSuccess}
                            title="Add items to cart"
                            className={`p-2 rounded-xl text-xs font-bold flex items-center gap-1 transition ${
                              isReorderSuccess
                                ? "bg-emerald-600 text-white"
                                : "bg-[#F5E086] text-[#24332D] hover:bg-[#F8E79B]"
                            }`}
                          >
                            {isReorderSuccess ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Added!</span>
                              </>
                            ) : (
                              <>
                                <RotateCcw className="w-3.5 h-3.5" />
                                <span className="hidden sm:inline">Re-order</span>
                              </>
                            )}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => toggleExpand(order.id)}
                          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition text-xs flex items-center gap-1"
                          aria-label="Toggle receipt details"
                        >
                          <Receipt className="w-3.5 h-3.5" />
                          <span className="text-[11px] hidden sm:inline">
                            {isExpanded ? "Hide" : "Bill"}
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-3 h-3" />
                          ) : (
                            <ChevronDown className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Expanded Itemized Receipt Details */}
                  {isExpanded && (
                    <div className="p-4 bg-black/25 border-t border-white/10 space-y-3 animate-in fade-in duration-150">
                      <div className="space-y-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#F5E086] block">
                          Ordered Items
                        </span>
                        <div className="space-y-1.5">
                          {order.items.map((cartItem, idx) => (
                            <div
                              key={`${order.id}-item-${idx}`}
                              className="flex items-start justify-between text-xs py-1 border-b border-white/5 last:border-0"
                            >
                              <div className="space-y-0.5">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-bold text-white">
                                    {cartItem.quantity}x
                                  </span>
                                  <span className="font-medium text-white/90">
                                    {cartItem.item.name}
                                  </span>
                                  {cartItem.item.isVeg !== undefined && (
                                    <span
                                      className={`w-2 h-2 rounded-full ${
                                        cartItem.item.isVeg
                                          ? "bg-emerald-400"
                                          : "bg-rose-400"
                                      }`}
                                    />
                                  )}
                                </div>
                                {cartItem.selectedBread && (
                                  <p className="text-[10px] text-white/60 pl-5">
                                    Bread: {cartItem.selectedBread}
                                  </p>
                                )}
                                {cartItem.selectedCustomizations &&
                                  cartItem.selectedCustomizations.length > 0 && (
                                    <p className="text-[10px] text-white/60 pl-5">
                                      +{" "}
                                      {cartItem.selectedCustomizations
                                        .map((c) => c.name)
                                        .join(", ")}
                                    </p>
                                  )}
                              </div>
                              <span className="font-mono text-white/80 font-bold shrink-0">
                                ₹{cartItem.totalPrice || cartItem.unitPrice * cartItem.quantity}
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Bill Breakdown Summary */}
                      <div className="pt-2 border-t border-white/10 space-y-1 text-[11px] text-white/70">
                        <div className="flex justify-between">
                          <span>Subtotal</span>
                          <span className="font-mono">₹{order.subtotal}</span>
                        </div>
                        {order.taxes > 0 && (
                          <div className="flex justify-between">
                            <span>GST (5%)</span>
                            <span className="font-mono">₹{order.taxes}</span>
                          </div>
                        )}
                        {order.tip && order.tip > 0 && (
                          <div className="flex justify-between text-[#F5E086]">
                            <span>Crew & Kitchen Tip</span>
                            <span className="font-mono">+₹{order.tip}</span>
                          </div>
                        )}
                        {order.packagingCharge > 0 && (
                          <div className="flex justify-between">
                            <span>Packaging Charge</span>
                            <span className="font-mono">₹{order.packagingCharge}</span>
                          </div>
                        )}
                        {order.discount > 0 && (
                          <div className="flex justify-between text-[#F5E086]">
                            <span>Discount Applied</span>
                            <span className="font-mono">-₹{order.discount}</span>
                          </div>
                        )}
                        <div className="flex justify-between text-xs font-bold text-white pt-1 border-t border-white/10">
                          <span>Grand Total</span>
                          <span className="font-mono text-emerald-400 font-black">
                            ₹{order.grandTotal}
                          </span>
                        </div>
                      </div>

                      {/* Payment info bar */}
                      <div className="p-2 rounded-xl bg-white/5 flex items-center justify-between text-[11px] text-white/70">
                        <div className="flex items-center gap-1.5">
                          {order.paymentMethod === "upi" ? (
                            <QrCode className="w-3.5 h-3.5 text-[#F5E086]" />
                          ) : (
                            <CreditCard className="w-3.5 h-3.5 text-emerald-400" />
                          )}
                          <span className="capitalize">
                            Method: <strong>{order.paymentMethod.toUpperCase()}</strong>
                          </span>
                        </div>
                        <span className="font-bold text-emerald-400 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" />
                          {order.paymentStatus === "paid" ? "Paid Online" : "Payment at Counter"}
                        </span>
                      </div>

                      {/* Download Invoice Action Bar */}
                      <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-xl bg-[#F5E086]/15 border border-[#F5E086]/30 flex items-center justify-center text-[#F5E086] shrink-0">
                            <FileText className="w-4 h-4" />
                          </div>
                          <div>
                            <span className="text-xs font-bold text-white block">Official Tax Invoice / Receipt</span>
                            <span className="text-[10px] text-white/50 block">Itemized breakdown • Small-batch bakery receipt</span>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleDownloadInvoice(order)}
                          disabled={downloadingInvoiceId === order.id}
                          className="px-3.5 py-1.5 rounded-xl bg-white/10 hover:bg-[#F5E086] text-white hover:text-[#24332D] text-xs font-bold flex items-center justify-center gap-1.5 transition self-start sm:self-auto shrink-0 border border-white/15"
                        >
                          {downloadingInvoiceId === order.id ? (
                            <span className="w-3.5 h-3.5 border-2 border-[#F5E086] border-t-transparent rounded-full animate-spin" />
                          ) : (
                            <Download className="w-3.5 h-3.5" />
                          )}
                          <span>Download PDF</span>
                        </button>
                      </div>

                      {/* Social Review & Feedback Strip */}
                      <div className="p-3 rounded-2xl bg-[#374C44]/70 border border-[#F5E086]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                        <div className="space-y-0.5">
                          <span className="text-xs font-bold text-[#F5E086] flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5 text-[#F5E086]" />
                            {order.feedbackShared
                              ? `Feedback Shared (${order.feedbackRating || 5}/5 on ${order.feedbackPlatform || "Social"})`
                              : "Love your sourdough melt? Post a review & earn +25 Paws Points"}
                          </span>
                          <p className="text-[11px] text-white/70">
                            {order.feedbackShared
                              ? `"${order.feedbackComment?.slice(0, 60)}..."`
                              : "Post your review directly to NiEA'S Instagram, WhatsApp, X or Google Maps."}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={() => handleOpenFeedback(order)}
                          className="px-3.5 py-1.5 rounded-xl bg-[#F5E086] text-[#24332D] font-black text-xs hover:bg-[#F8E79B] transition flex items-center justify-center gap-1.5 self-start sm:self-auto shrink-0 shadow-sm"
                        >
                          <Share2 className="w-3.5 h-3.5" />
                          <span>{order.feedbackShared ? "Update Review" : "Share Feedback"}</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-[#1D2B25]/90 border-t border-white/10 flex items-center justify-between text-xs shrink-0">
          <div className="flex items-center gap-2 text-white/60 text-[11px]">
            <Sparkles className="w-3.5 h-3.5 text-[#F5E086]" />
            <span>Orders are backed up in your browser storage</span>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition"
          >
            Close
          </button>
        </div>
      </div>

      {/* Social Feedback Sharing Dialog Overlay */}
      {feedbackOrder && (
        <div
          className="fixed inset-0 z-60 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) setFeedbackOrder(null);
          }}
        >
          <div className="bg-[#24332D] border border-[#F5E086]/30 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            {/* Header */}
            <div className="p-4 sm:p-5 border-b border-[#F5E086]/20 bg-[#1D2B25] flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#F5E086] text-[#24332D] flex items-center justify-center font-bold shadow-sm">
                  <MessageSquareShare className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-niea font-bold text-lg text-[#F5E086] flex items-center gap-2">
                    Share Cafe Review
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-white/10 text-white/90">
                      {feedbackOrder.orderNumber}
                    </span>
                  </h4>
                  <p className="text-xs text-[#FBF9F2]/70">
                    Post to social media & earn +25 NiEA Paws Points
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setFeedbackOrder(null)}
                className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content Body */}
            <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-xs">
              {/* Star Rating Selection */}
              <div className="p-3.5 rounded-2xl bg-[#2B3D36] border border-white/10 text-center space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#F5E086]">
                  Rate your sandwich experience
                </span>
                <div className="flex items-center justify-center gap-2">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setFeedbackRating(star)}
                      className="p-1 transition transform hover:scale-125 focus:outline-hidden"
                      title={`${star} Star`}
                    >
                      <Star
                        className={`w-7 h-7 transition-colors ${
                          star <= feedbackRating
                            ? "text-[#F5E086] fill-[#F5E086]"
                            : "text-white/20"
                        }`}
                      />
                    </button>
                  ))}
                </div>
                <p className="text-xs font-semibold text-white/90">
                  {feedbackRating === 5 && "5/5: Melted Perfection! Pure sourdough bliss"}
                  {feedbackRating === 4 && "4/5: Delicious & satisfying toasted sandwich!"}
                  {feedbackRating === 3 && "3/5: Good sandwich, enjoyed the cafe ambience."}
                  {feedbackRating === 2 && "2/5: Decent, could use more filling or toast."}
                  {feedbackRating === 1 && "1/5: Needs improvement."}
                </p>
              </div>

              {/* Quick praise tags */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-white/70 block">
                  Tap to add quick highlights:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {QUICK_TAGS.map((tag) => {
                    const isSelected = feedbackComment.includes(tag);
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => handleToggleTag(tag)}
                        className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition border ${
                          isSelected
                            ? "bg-[#F5E086] text-[#24332D] border-[#F5E086] font-bold"
                            : "bg-white/5 text-white/80 border-white/10 hover:border-[#F5E086]/50"
                        }`}
                      >
                        {tag}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Review Textarea */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-white/70">
                    Your Review & Caption:
                  </span>
                  <button
                    type="button"
                    onClick={handleCopyReviewOnly}
                    className="text-[11px] text-[#F5E086] hover:underline flex items-center gap-1 font-semibold"
                  >
                    {copiedReview ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    <span>{copiedReview ? "Copied!" : "Copy Text"}</span>
                  </button>
                </div>
                <textarea
                  rows={4}
                  value={feedbackComment}
                  onChange={(e) => setFeedbackComment(e.target.value)}
                  className="w-full p-3 rounded-2xl bg-[#1D2B25] border border-white/15 text-white focus:border-[#F5E086] focus:outline-hidden text-xs leading-relaxed resize-none"
                  placeholder="Share your thoughts about your sandwich melt, bread, cat vibes..."
                />
              </div>

              {/* Direct Social Media Sharing Buttons */}
              <div className="space-y-2 pt-1">
                <span className="text-[11px] font-bold uppercase tracking-wider text-white/60 block">
                  Post directly to cafe social media:
                </span>

                <div className="grid grid-cols-2 gap-2.5">
                  {/* Instagram */}
                  <button
                    type="button"
                    onClick={() => handleShareToPlatform("instagram")}
                    className="p-3 rounded-2xl bg-gradient-to-r from-rose-500/20 via-pink-500/20 to-amber-500/20 hover:from-rose-500/30 hover:to-amber-500/30 border border-pink-500/30 text-white font-bold flex items-center justify-center gap-2 transition shadow-xs group"
                  >
                    <Instagram className="w-5 h-5 text-pink-300 group-hover:scale-110 transition-transform" />
                    <div className="text-left">
                      <span className="block text-xs font-bold text-white">Instagram</span>
                      <span className="block text-[10px] text-pink-300 font-normal">@nieassandwichbar</span>
                    </div>
                  </button>

                  {/* WhatsApp */}
                  <button
                    type="button"
                    onClick={() => handleShareToPlatform("whatsapp")}
                    className="p-3 rounded-2xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 text-white font-bold flex items-center justify-center gap-2 transition shadow-xs group"
                  >
                    <MessageCircle className="w-5 h-5 text-emerald-300 group-hover:scale-110 transition-transform" />
                    <div className="text-left">
                      <span className="block text-xs font-bold text-white">WhatsApp</span>
                      <span className="block text-[10px] text-emerald-300 font-normal">Share to Status/Chat</span>
                    </div>
                  </button>

                  {/* X / Twitter */}
                  <button
                    type="button"
                    onClick={() => handleShareToPlatform("twitter")}
                    className="p-3 rounded-2xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/30 text-white font-bold flex items-center justify-center gap-2 transition shadow-xs group"
                  >
                    <Twitter className="w-5 h-5 text-sky-300 group-hover:scale-110 transition-transform" />
                    <div className="text-left">
                      <span className="block text-xs font-bold text-white">X / Twitter</span>
                      <span className="block text-[10px] text-sky-300 font-normal">Post Tweet</span>
                    </div>
                  </button>

                  {/* Google Reviews */}
                  <button
                    type="button"
                    onClick={() => handleShareToPlatform("google")}
                    className="p-3 rounded-2xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 text-white font-bold flex items-center justify-center gap-2 transition shadow-xs group"
                  >
                    <Star className="w-5 h-5 text-blue-300 fill-blue-300 group-hover:scale-110 transition-transform" />
                    <div className="text-left">
                      <span className="block text-xs font-bold text-white">Google Maps</span>
                      <span className="block text-[10px] text-blue-300 font-normal">Cafe Review</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-[#F5E086]/20 bg-[#1D2B25] flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setFeedbackOrder(null)}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition"
              >
                Cancel
              </button>

              <div className="flex items-center gap-2">
                {typeof navigator !== "undefined" && "share" in navigator && (
                  <button
                    type="button"
                    onClick={() => handleShareToPlatform("native")}
                    className="px-3 py-2 rounded-xl bg-[#374C44] hover:bg-[#3E564D] text-[#F5E086] border border-[#F5E086]/30 text-xs font-bold flex items-center gap-1.5 transition"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share Sheet</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    saveFeedbackToRecord(
                      feedbackOrder.id,
                      feedbackRating,
                      feedbackComment,
                      "social"
                    );
                    showToast("Review saved! +25 Paws Points added to your profile.");
                    setFeedbackOrder(null);
                  }}
                  className="px-5 py-2 rounded-xl bg-[#F5E086] hover:bg-[#F8E79B] text-[#24332D] font-black text-xs transition shadow-md flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4 text-[#24332D]" />
                  <span>Save Review</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Notification */}
      {toastNotification && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-70 bg-[#24332D] border border-[#F5E086] text-[#FBF9F2] px-4 py-2.5 rounded-full shadow-2xl flex items-center gap-2.5 text-xs font-bold">
          <Sparkles className="w-4 h-4 text-[#F5E086] shrink-0" />
          <span>{toastNotification}</span>
        </div>
      )}
    </div>
  );
};
