import React, { useState, useEffect, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Header, NavTab } from "./components/Header";
import { Footer } from "./components/Footer";
import { HomeView } from "./views/HomeView";
import { MenuView } from "./views/MenuView";
import { ReservationView } from "./views/ReservationView";
import { CheckoutView } from "./views/CheckoutView";
import { ItemCustomizerModal } from "./components/ItemCustomizerModal";
import { LiveSeatingModal } from "./components/LiveSeatingModal";
import { OwnerPortalModal } from "./components/OwnerPortalModal";
import { LoyaltyModal } from "./components/LoyaltyModal";
import { AuthModal } from "./components/AuthModal";
import { OrderHistoryModal } from "./components/OrderHistoryModal";
import { TrackOrderModal } from "./components/TrackOrderModal";
import { KotTicketModal } from "./components/KotTicketModal";
import { LiveTokenCallingModal } from "./components/LiveTokenCallingModal";
import { CustomerQueueFloatingBar } from "./components/CustomerQueueFloatingBar";
import { MovableCat } from "./components/MovableCat";
import { SmoothScrollProvider } from "./components/SmoothScrollProvider";
import { ShoppingBag, ArrowRight, Bell } from "lucide-react";

import {
  MenuItem,
  OrderType,
  CartItem,
  CustomizationOption,
  OrderRecord,
  LoyaltyProfile,
} from "./types/niea";
import { INITIAL_LOYALTY } from "./data/nieaData";
import { processReservationAutomations } from "./utils/reservationAutomation";
import { generateStoreAnalyticsSummary } from "./utils/aiAnalyticsHelper";
import { checkPreBookingWindow } from "./utils/preBookingHelper";
import { FirebaseStoreProvider, useFirebaseStore } from "./context/FirebaseStoreContext";

function AppContent() {
  // Central Firebase Real-time Cloud Store
  const {
    userSession,
    websiteConfig,
    preBookingConfig,
    financialSettings,
    whatsappConfig,
    loyaltyConfig,
    seating,
    menuItems,
    liveOrders,
    reservations,
    posRecords,
    coupons,
    dailyIngredients,
    dailyWastage,
    masterIngredients,
    cafeHighlight,
    isFloatingCatEnabled,
    updateWebsiteConfig,
    updatePreBookingConfig,
    updateFinancialSettings,
    updateWhatsappConfig,
    updateLoyaltyConfig,
    updateSeating,
    updateMenuItems,
    updateCoupons,
    updateDailyIngredients,
    updateDailyWastage,
    updateMasterIngredients,
    updateCafeHighlight,
    updateFloatingCatEnabled,
    placeOrder,
    updateOrderStatus,
    updateOrderStep,
    updateOrderTimeLeft,
    markKotPrinted,
    sendOrderNotification,
    broadcastTakeawayAnnouncement,
    addReservation,
    updateReservationStatus,
    deleteReservation,
    addPosRecord,
    resetToDefaults,
    signOut,
  } = useFirebaseStore();

  // 1. Navigation Tab State
  const [activeTab, setActiveTab] = useState<NavTab>("home");

  // Local Loyalty Points state (combining cloud session + local pet interactions)
  const [loyalty, setLoyalty] = useState<LoyaltyProfile>(() => {
    try {
      const saved = localStorage.getItem("niea_loyalty");
      return saved ? JSON.parse(saved) : INITIAL_LOYALTY;
    } catch {
      return INITIAL_LOYALTY;
    }
  });

  useEffect(() => {
    localStorage.setItem("niea_loyalty", JSON.stringify(loyalty));
  }, [loyalty]);

  // Intelligent automation states
  const [simulatedMinutes, setSimulatedMinutes] = useState<number | undefined>(undefined);
  const [activeHoldsCount, setActiveHoldsCount] = useState<number>(0);

  // Ordering & Basket state
  const [orderType, setOrderType] = useState<OrderType>("dine-in");
  const [selectedTable, setSelectedTable] = useState<string>("Table 1");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [appliedDiscount, setAppliedDiscount] = useState(0);
  const [discountCode, setDiscountCode] = useState<string | undefined>(undefined);

  // Modals state
  const [isSeatingOpen, setIsSeatingOpen] = useState(false);
  const [isOwnerPortalOpen, setIsOwnerPortalOpen] = useState(false);
  const [isLoyaltyOpen, setIsLoyaltyOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isOrderHistoryOpen, setIsOrderHistoryOpen] = useState(false);
  const [isTrackOrderOpen, setIsTrackOrderOpen] = useState(false);
  const [trackingOrderNumber, setTrackingOrderNumber] = useState<string | null>(null);
  const [customizingItem, setCustomizingItem] = useState<MenuItem | null>(null);

  // POS & Queue States
  const [kotModalOrder, setKotModalOrder] = useState<OrderRecord | null>(null);
  const [isLiveCallingOpen, setIsLiveCallingOpen] = useState(false);
  const [liveCallingHighlightToken, setLiveCallingHighlightToken] = useState<string | undefined>(undefined);
  const [petCount, setPetCount] = useState(0);

  // Analytics Date Filter
  const [analyticsDate, setAnalyticsDate] = useState<string>(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  });

  const getDynamicTodayDateStr = useCallback((): string => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }, []);

  const filterValidRealOrders = useCallback((ordersList: OrderRecord[]): OrderRecord[] => {
    if (!Array.isArray(ordersList)) return [];
    return ordersList.filter((o) => {
      if (!o || typeof o !== "object") return false;
      if (!o.id || typeof o.id !== "string") return false;
      const lowerId = o.id.toLowerCase();
      return (
        !lowerId.startsWith("seed_") &&
        !lowerId.startsWith("ord_sample_") &&
        !lowerId.startsWith("sample_") &&
        !lowerId.startsWith("mock_") &&
        !lowerId.startsWith("demo_")
      );
    });
  }, []);

  const getStoreAnalyticsSummary = useCallback(
    (targetDate?: string, range?: { start: string; end: string }) => {
      const dynamicToday = getDynamicTodayDateStr();
      let effectiveDate = targetDate || analyticsDate || dynamicToday;
      if (effectiveDate === "today") effectiveDate = dynamicToday;

      const validOrders = filterValidRealOrders(liveOrders);
      const validPos = (posRecords || []).filter((p) => {
        if (!p || !p.id) return false;
        const lower = String(p.id).toLowerCase();
        return !lower.startsWith("pos_seed_") && !lower.startsWith("mock_") && !lower.startsWith("demo_");
      });

      return generateStoreAnalyticsSummary(validOrders, validPos, effectiveDate, range);
    },
    [liveOrders, posRecords, analyticsDate, getDynamicTodayDateStr, filterValidRealOrders]
  );

  // Intelligent Seating & Reservation Automation Engine
  useEffect(() => {
    const runAutomation = () => {
      const result = processReservationAutomations(
        reservations,
        { totalSeats: 8, walkInOccupiedSeats: 0 },
        simulatedMinutes
      );

      setActiveHoldsCount(result.totalHeldByReservations);
    };

    runAutomation();
    const interval = setInterval(runAutomation, 10000);
    return () => clearInterval(interval);
  }, [reservations, simulatedMinutes]);

  // Cart operations
  const handleAddToCart = (
    item: MenuItem,
    selectedBread?: string,
    customization?: CustomizationOption[],
    specialInstructions?: string,
    quantity: number = 1
  ) => {
    const customList = customization || [];
    const cartItemId = `${item.id}-${selectedBread || "default"}-${customList.map((c) => c.name).sort().join("-") || "none"}`;
    const extrasCost = customList.reduce((sum, c) => sum + (c.price || 0), 0);
    const unitPrice = item.price + extrasCost;

    setCart((prev) => {
      const existing = prev.find((ci) => ci.cartItemId === cartItemId);
      if (existing) {
        return prev.map((ci) =>
          ci.cartItemId === cartItemId
            ? {
                ...ci,
                quantity: ci.quantity + quantity,
                totalPrice: (ci.quantity + quantity) * ci.unitPrice,
              }
            : ci
        );
      }
      return [
        ...prev,
        {
          cartItemId,
          item,
          quantity,
          selectedBread,
          selectedCustomizations: customList,
          specialInstructions,
          unitPrice,
          totalPrice: unitPrice * quantity,
        },
      ];
    });
  };

  const handleUpdateQuantity = (cartItemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((ci) => {
          if (ci.cartItemId === cartItemId) {
            const newQty = ci.quantity + delta;
            return newQty > 0
              ? { ...ci, quantity: newQty, totalPrice: newQty * ci.unitPrice }
              : null;
          }
          return ci;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const handleRemoveCartItem = (cartItemId: string) => {
    setCart((prev) => prev.filter((ci) => ci.cartItemId !== cartItemId));
  };

  const handleDecrementFromCart = (item: MenuItem) => {
    setCart((prev) => {
      let targetIdx = -1;
      for (let i = prev.length - 1; i >= 0; i--) {
        if (prev[i].item.id === item.id) {
          targetIdx = i;
          break;
        }
      }
      if (targetIdx === -1) return prev;

      const target = prev[targetIdx];
      if (target.quantity > 1) {
        const updated = {
          ...target,
          quantity: target.quantity - 1,
          totalPrice: (target.quantity - 1) * target.unitPrice,
        };
        return prev.map((ci, idx) => (idx === targetIdx ? updated : ci));
      } else {
        return prev.filter((_, idx) => idx !== targetIdx);
      }
    });
  };

  const handleApplyCoupon = (code: string, discount: number) => {
    setDiscountCode(code);
    setAppliedDiscount(discount);
  };

  const handlePetCat = () => {
    setPetCount((prev) => prev + 1);
    setLoyalty((prev) => ({
      ...prev,
      petInteractions: prev.petInteractions + 1,
      pawsPoints: prev.pawsPoints + 5,
    }));
  };

  const handleOrderSuccess = async (order: OrderRecord) => {
    await placeOrder(order);

    setLoyalty((prev) => {
      const nextStamps = (prev.stampsCount + 1) % (loyaltyConfig?.stampsRequired || 6);
      return {
        ...prev,
        stampsCount: nextStamps,
        pawsPoints: prev.pawsPoints + Math.round(order.grandTotal * 0.1),
      };
    });

    setCart([]);
    setAppliedDiscount(0);
    setDiscountCode(undefined);
  };

  const handleReorder = (items: CartItem[]) => {
    setCart(items);
    setActiveTab("checkout");
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleOpenTrackOrder = (orderNumber?: string) => {
    if (orderNumber) {
      setTrackingOrderNumber(orderNumber);
    } else {
      const active = liveOrders.find((o) => o.status !== "served");
      setTrackingOrderNumber(active ? active.orderNumber : (liveOrders[0]?.orderNumber || null));
    }
    setIsTrackOrderOpen(true);
  };

  const handleOpenLiveCallingBoard = (tokenNumber?: string) => {
    setLiveCallingHighlightToken(tokenNumber);
    setIsLiveCallingOpen(true);
  };

  const handleOpenKot = (order: OrderRecord) => {
    setKotModalOrder(order);
  };

  const handlePrintKot = (orderId: string) => {
    markKotPrinted(orderId);
  };

  const handleAdvanceKitchenStatus = (orderId: string, nextStatus: "toasting" | "ready" | "served") => {
    updateOrderStatus(orderId, nextStatus);
  };

  // Menu item modification handlers
  const handleUpdateMenuItem = (updatedItem: MenuItem) => {
    updateMenuItems((prev) => prev.map((it) => (it.id === updatedItem.id ? updatedItem : it)));
  };

  const [takeawayAlert, setTakeawayAlert] = useState<{ id: string; message: string; tokenNumber?: string } | null>(null);

  useEffect(() => {
    const handleTakeawayNotif = (e: any) => {
      const detail = e.detail;
      if (detail) {
        setTakeawayAlert({
          id: detail.id || String(Date.now()),
          message: detail.message || "Takeaway order is packed and ready for pickup!",
          tokenNumber: detail.tokenNumber,
        });
        setTimeout(() => {
          setTakeawayAlert(null);
        }, 8500);
      }
    };
    window.addEventListener("niea_takeaway_announcement", handleTakeawayNotif);
    return () => window.removeEventListener("niea_takeaway_announcement", handleTakeawayNotif);
  }, []);

  const handleAddMenuItem = (newItem: MenuItem) => {
    updateMenuItems((prev) => [newItem, ...prev]);
  };

  const handleDeleteMenuItem = (itemId: string) => {
    updateMenuItems((prev) => prev.filter((it) => it.id !== itemId));
  };

  // Active customer order detection - strictly ONLY for the user who placed the order
  const customerActiveOrder = useMemo(() => {
    let myIds: string[] = [];
    try {
      myIds = JSON.parse(localStorage.getItem("niea_my_order_ids") || "[]");
    } catch {}

    const userPhoneClean = userSession?.phoneNumber?.replace(/\D/g, "").slice(-10);
    const savedPhoneClean = typeof window !== "undefined" ? localStorage.getItem("niea_customer_phone")?.replace(/\D/g, "").slice(-10) : "";
    const userUid = (userSession as any)?.uid;
    const userEmail = userSession?.email?.toLowerCase();

    // Find if any unserved order belongs strictly to THIS user/browser
    const match = liveOrders.find((o) => {
      if (!o || o.status === "served" || o.status === "cancelled") return false;

      // 1. Matches this browser's checkout order IDs
      if (myIds.length > 0) {
        if (
          myIds.includes(o.id) ||
          myIds.includes(o.orderNumber) ||
          (o.tokenNumber && myIds.includes(o.tokenNumber))
        ) {
          return true;
        }
      }

      // 2. Matches logged in user's UID
      if (userUid && (o as any).userId === userUid) {
        return true;
      }

      // 3. Matches logged in user's Email
      if (userEmail && o.customerEmail && o.customerEmail.toLowerCase() === userEmail) {
        return true;
      }

      // 4. Matches logged in or saved phone number
      if (userPhoneClean && o.customerPhone) {
        const oPhone = o.customerPhone.replace(/\D/g, "").slice(-10);
        if (oPhone && oPhone === userPhoneClean) return true;
      }
      if (savedPhoneClean && o.customerPhone) {
        const oPhone = o.customerPhone.replace(/\D/g, "").slice(-10);
        if (oPhone && oPhone === savedPhoneClean) return true;
      }

      return false;
    });

    return match || null;
  }, [liveOrders, userSession]);

  const customerQueueAheadCount = useMemo(() => {
    if (!customerActiveOrder) return 0;
    const pending = liveOrders.filter((o) => o.status !== "served" && o.status !== "cancelled");
    const myIndex = pending.findIndex((o) => o.id === customerActiveOrder.id);
    return myIndex > 0 ? myIndex : 0;
  }, [liveOrders, customerActiveOrder]);

  const cartTotalCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const cartSubtotal = useMemo(() => {
    return cart.reduce((sum, ci) => sum + ci.totalPrice, 0);
  }, [cart]);

  return (
    <SmoothScrollProvider>
      <div className="min-h-screen bg-[#49655B] text-[#FBF9F2] flex flex-col font-sans selection:bg-[#F5E086] selection:text-[#24332D]">
        {/* 1. Universal Top Navigation Header */}
        <Header
          activeTab={activeTab}
          onSelectTab={(tab) => {
            setActiveTab(tab);
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          totalCartCount={cartTotalCount}
          seating={seating}
          onOpenSeating={() => setIsSeatingOpen(true)}
          loyalty={loyalty}
          onOpenLoyalty={() => setIsLoyaltyOpen(true)}
          onOpenOwnerPortal={() => setIsOwnerPortalOpen(true)}
          userSession={userSession}
          onOpenAuth={() => setIsAuthOpen(true)}
          onOpenOrderHistory={() => setIsOrderHistoryOpen(true)}
          ordersCount={liveOrders.length}
          onOpenTrackOrder={() => handleOpenTrackOrder(customerActiveOrder?.orderNumber)}
          activeOrdersCount={customerActiveOrder ? 1 : 0}
          onOpenLiveCallingBoard={() => handleOpenLiveCallingBoard(customerActiveOrder?.tokenNumber)}
          activeUserToken={customerActiveOrder?.tokenNumber}
          activeUserStage={customerActiveOrder?.status === "ready" ? "Ready" : customerActiveOrder?.status === "toasting" ? "Toasting" : customerActiveOrder ? "In Queue" : undefined}
          queueOrdersAhead={customerQueueAheadCount}
          websiteConfig={websiteConfig}
          preBookingConfig={preBookingConfig}
          loyaltyConfig={loyaltyConfig}
        />

        {/* 2. Main Tab View Router with Smooth Transitions */}
        <main className="flex-1">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2 }}
            >
              {activeTab === "home" && (
                <HomeView
                  onSelectTab={setActiveTab}
                  featuredItems={menuItems.filter((i) => i.isBestseller || i.isSeasonal).slice(0, 4)}
                  onAddToCart={(it) => handleAddToCart(it)}
                  onDecrementFromCart={handleDecrementFromCart}
                  cartItemCounts={cart.reduce((acc, ci) => {
                    acc[ci.item.id] = (acc[ci.item.id] || 0) + ci.quantity;
                    return acc;
                  }, {} as Record<string, number>)}
                  seating={seating}
                  onPetCat={handlePetCat}
                  cafeHighlight={cafeHighlight}
                  activeHoldsCount={activeHoldsCount}
                  onOpenTrackOrder={handleOpenTrackOrder}
                  activeOrder={customerActiveOrder}
                  websiteConfig={websiteConfig}
                  preBookingConfig={preBookingConfig}
                  onOpenLiveCallingBoard={handleOpenLiveCallingBoard}
                  liveOrders={liveOrders}
                />
              )}

              {activeTab === "menu" && (
                <MenuView
                  items={menuItems}
                  cartItemCounts={cart.reduce((acc, ci) => {
                    acc[ci.item.id] = (acc[ci.item.id] || 0) + ci.quantity;
                    return acc;
                  }, {} as Record<string, number>)}
                  onAddToCart={(it) => handleAddToCart(it)}
                  onDecrementFromCart={handleDecrementFromCart}
                  onOpenItemDetails={(it) => setCustomizingItem(it)}
                  preBookingConfig={preBookingConfig}
                />
              )}

              {activeTab === "reservation" && (
                <ReservationView
                  seating={seating}
                  onNewReservation={addReservation}
                  onSelectTable={(table) => {
                    setSelectedTable(table);
                    setOrderType("dine-in");
                  }}
                  activeHoldsCount={activeHoldsCount}
                  userSession={userSession}
                  onOpenAuth={undefined}
                  preBookingConfig={preBookingConfig}
                  websiteConfig={websiteConfig}
                  onSelectTab={setActiveTab}
                />
              )}

              {activeTab === "checkout" && (
                <CheckoutView
                  cart={cart}
                  menuItems={menuItems}
                  orderType={orderType}
                  selectedTable={selectedTable}
                  onUpdateQuantity={handleUpdateQuantity}
                  onRemoveItem={handleRemoveCartItem}
                  onSetOrderType={setOrderType}
                  onSetSelectedTable={setSelectedTable}
                  appliedDiscount={appliedDiscount}
                  discountCode={discountCode}
                  onApplyCoupon={handleApplyCoupon}
                  onOrderSuccess={handleOrderSuccess}
                  onSelectTab={(tab) => {
                    setActiveTab(tab);
                    window.scrollTo({ top: 0, behavior: "smooth" });
                  }}
                  userSession={userSession}
                  onOpenAuth={undefined}
                  onOpenTrackOrder={handleOpenTrackOrder}
                  onOpenLiveCallingBoard={handleOpenLiveCallingBoard}
                  financialSettings={financialSettings}
                  coupons={coupons}
                  preBookingConfig={preBookingConfig}
                  whatsappConfig={whatsappConfig}
                  onCancelOrder={(orderId) => updateOrderStatus(orderId, "cancelled")}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </main>

        {/* 3. Sticky Quick Checkout Bar */}
        {cart.length > 0 && activeTab !== "checkout" && (() => {
          const pb = checkPreBookingWindow(preBookingConfig);
          return (
            <aside
              aria-label="Order summary bar"
              className="sticky bottom-0 z-30 p-3 sm:p-4 bg-[#2B3D36]/95 backdrop-blur-md border-t border-[#F5E086]/30 shadow-2xl"
            >
              <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] uppercase font-bold text-[#F5E086] block">
                      {orderType === "dine-in" ? `Dine-in (${selectedTable})` : "Takeaway Order"}
                    </span>
                    {!pb.isOpen && (
                      <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-400/30">
                        Pre-Order Window Closed ({pb.displayWindowText})
                      </span>
                    )}
                  </div>
                  <p className="text-sm font-bold text-white">
                    {cartTotalCount} item{cartTotalCount === 1 ? "" : "s"} in Cart •{" "}
                    <span className="text-[#F5E086] font-mono">₹{cartSubtotal}</span>
                  </p>
                </div>
                <div className="flex items-center gap-2 w-full sm:w-auto">
                  <button
                    onClick={() => {
                      setActiveTab("checkout");
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="btn-liquid liquid-gold flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-full font-black text-sm cursor-pointer shadow-lg"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    <span>View Cart & Checkout</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </aside>
          );
        })()}

        {/* 4. Global Footer */}
        <Footer
          onOpenOwnerPortal={() => setIsOwnerPortalOpen(true)}
          onOpenLoyalty={() => setIsLoyaltyOpen(true)}
          onOpenTrackOrder={() => handleOpenTrackOrder()}
          websiteConfig={websiteConfig}
          loyaltyConfig={loyaltyConfig}
        />

        {/* Modals */}
        <ItemCustomizerModal
          isOpen={!!customizingItem}
          onClose={() => setCustomizingItem(null)}
          item={customizingItem}
          onConfirm={(it, bread, cust, instructions, qty) => {
            handleAddToCart(it, bread, cust, instructions, qty);
            setCustomizingItem(null);
          }}
        />

        <LiveSeatingModal
          isOpen={isSeatingOpen}
          onClose={() => setIsSeatingOpen(false)}
          seating={seating}
          selectedTable={selectedTable}
          onSelectTable={(tbl) => setSelectedTable(tbl)}
        />

        <OwnerPortalModal
          isOpen={isOwnerPortalOpen}
          onClose={() => setIsOwnerPortalOpen(false)}
          menuItems={menuItems}
          onUpdateMenuItem={handleUpdateMenuItem}
          onAddMenuItem={handleAddMenuItem}
          onDeleteMenuItem={handleDeleteMenuItem}
          seating={seating}
          onUpdateSeating={updateSeating}
          onResetDefaults={resetToDefaults}
          reservations={reservations}
          onUpdateReservationStatus={updateReservationStatus}
          onDeleteReservation={deleteReservation}
          cafeHighlight={cafeHighlight}
          onUpdateCafeHighlight={updateCafeHighlight}
          liveOrders={liveOrders}
          onUpdateOrderStatus={updateOrderStatus}
          onUpdateOrderTimeLeft={updateOrderTimeLeft}
          onSendOrderNotification={sendOrderNotification}
          simulatedMinutes={simulatedMinutes}
          onSetSimulatedMinutes={setSimulatedMinutes}
          activeHoldsCount={activeHoldsCount}
          onAddOrder={placeOrder}
          onOpenKot={handleOpenKot}
          onOpenLiveCallingBoard={handleOpenLiveCallingBoard}
          posRecords={posRecords}
          onAddPosRecord={addPosRecord}
          preBookingConfig={preBookingConfig}
          onUpdatePreBookingConfig={updatePreBookingConfig}
          onUpdateOrderStep={updateOrderStep}
          analyticsDate={analyticsDate}
          onUpdateAnalyticsDate={setAnalyticsDate}
          getStoreAnalyticsSummary={getStoreAnalyticsSummary}
          isFloatingCatEnabled={isFloatingCatEnabled}
          setIsFloatingCatEnabled={updateFloatingCatEnabled}
          coupons={coupons}
          onUpdateCoupons={updateCoupons}
          financialSettings={financialSettings}
          onUpdateFinancialSettings={updateFinancialSettings}
          websiteConfig={websiteConfig}
          onUpdateWebsiteConfig={updateWebsiteConfig}
          whatsappConfig={whatsappConfig}
          onUpdateWhatsappConfig={updateWhatsappConfig}
          dailyIngredients={dailyIngredients}
          onUpdateDailyIngredients={updateDailyIngredients}
          dailyWastage={dailyWastage}
          onUpdateDailyWastage={updateDailyWastage}
          masterIngredients={masterIngredients}
          onUpdateMasterIngredients={updateMasterIngredients}
          loyaltyConfig={loyaltyConfig}
          onUpdateLoyaltyConfig={updateLoyaltyConfig}
          broadcastTakeawayAnnouncement={broadcastTakeawayAnnouncement}
        />

        <LoyaltyModal
          isOpen={isLoyaltyOpen}
          onClose={() => setIsLoyaltyOpen(false)}
          loyalty={loyalty}
          loyaltyConfig={loyaltyConfig}
          onApplyCoupon={handleApplyCoupon}
          onPetCat={handlePetCat}
        />

        <AuthModal
          isOpen={isAuthOpen}
          onClose={() => setIsAuthOpen(false)}
          userSession={userSession}
          onLoginSuccess={() => {}}
          onLogout={signOut}
          onOpenOrderHistory={() => {
            setIsAuthOpen(false);
            setIsOrderHistoryOpen(true);
          }}
        />

        <OrderHistoryModal
          isOpen={isOrderHistoryOpen}
          onClose={() => setIsOrderHistoryOpen(false)}
          orders={liveOrders}
          userSession={userSession}
          onOpenAuth={undefined}
          onReorder={handleReorder}
          onShareFeedback={() => {}}
          onNavigateToMenu={() => {
            setActiveTab("menu");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          onTrackOrder={handleOpenTrackOrder}
        />

        <TrackOrderModal
          isOpen={isTrackOrderOpen}
          onClose={() => setIsTrackOrderOpen(false)}
          orders={liveOrders}
          userSession={userSession}
          onOpenAuth={undefined}
          initialOrderNumber={trackingOrderNumber}
          onReorder={handleReorder}
          onOpenFeedback={(_order) => {
            setIsTrackOrderOpen(false);
            setIsOrderHistoryOpen(true);
          }}
          onNavigateToMenu={() => {
            setActiveTab("menu");
            window.scrollTo({ top: 0, behavior: "smooth" });
          }}
          onOpenLiveCallingBoard={(tok) =>
            handleOpenLiveCallingBoard(tok || customerActiveOrder?.tokenNumber)
          }
          whatsappConfig={whatsappConfig}
          onCancelOrder={(orderId) => updateOrderStatus(orderId, "cancelled")}
        />

        <CustomerQueueFloatingBar
          activeOrder={customerActiveOrder}
          queueOrdersAhead={customerQueueAheadCount}
          onOpenTrack={handleOpenTrackOrder}
          onOpenLiveCallingBoard={(tok) =>
            handleOpenLiveCallingBoard(tok || customerActiveOrder?.tokenNumber)
          }
        />

        <KotTicketModal
          isOpen={!!kotModalOrder}
          onClose={() => setKotModalOrder(null)}
          order={kotModalOrder}
          onPrintKot={handlePrintKot}
          onAdvanceStatus={handleAdvanceKitchenStatus}
        />

        <LiveTokenCallingModal
          isOpen={isLiveCallingOpen}
          onClose={() => setIsLiveCallingOpen(false)}
          orders={liveOrders}
          highlightedToken={liveCallingHighlightToken || customerActiveOrder?.tokenNumber}
          isOwner={isOwnerPortalOpen}
        />

        {isFloatingCatEnabled && (
          <MovableCat
            onOpenMenu={() => {
              setActiveTab("menu");
              window.scrollTo({ top: 0, behavior: "smooth" });
            }}
            onPetCat={handlePetCat}
          />
        )}

        {/* Real-time Takeaway Announcement Floating Notification for User's Mobile / Desktop Browser */}
        <AnimatePresence>
          {takeawayAlert && (
            <motion.div
              initial={{ opacity: 0, y: -40, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="fixed top-20 left-1/2 -translate-x-1/2 z-[70] w-[92%] max-w-md p-4 rounded-2xl bg-[#212E27]/98 border-2 border-amber-400 shadow-[0_12px_40px_rgba(251,191,36,0.4)] text-white backdrop-blur-xl"
            >
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-400 text-black flex items-center justify-center shrink-0 shadow-md font-black">
                  <Bell className="w-5 h-5 animate-bounce text-black" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                    <span className="text-[10px] font-black uppercase tracking-wider bg-amber-400 text-black px-2 py-0.5 rounded-full">
                      🔔 Order Ready for You!
                    </span>
                    {takeawayAlert.tokenNumber && (
                      <span className="text-xs font-mono font-black text-[#F5E086] bg-black/40 px-2 py-0.5 rounded-md border border-[#F5E086]/30">
                        Token #{takeawayAlert.tokenNumber}
                      </span>
                    )}
                  </div>
                  <p className="text-xs sm:text-sm font-bold text-amber-100 leading-snug">
                    {takeawayAlert.message}
                  </p>
                  <p className="text-[10px] text-[#F5E086]/80 mt-1 font-semibold">
                    Please collect your fresh order at the counter. Thank you!
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setTakeawayAlert(null)}
                  className="p-1 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition cursor-pointer"
                  title="Dismiss notification"
                >
                  ✕
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </SmoothScrollProvider>
  );
}

export function App() {
  return (
    <FirebaseStoreProvider>
      <AppContent />
    </FirebaseStoreProvider>
  );
}

export default App;
