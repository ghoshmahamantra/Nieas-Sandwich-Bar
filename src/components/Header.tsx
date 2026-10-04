import React, { useState, useEffect } from "react";
import {
  ShoppingBag,
  Sparkles,
  CalendarCheck,
  UtensilsCrossed,
  Home,
  Settings,
  Clock,
  MapPin,
  User,
  LogIn,
  Receipt,
  Award,
  Tv,
  Ticket,
  ChevronRight,
  X,
  Bell,
} from "lucide-react";
import { SeatingStatus, LoyaltyProfile, UserSession, WebsiteContentConfig, PreBookingConfig, LoyaltyProgramConfig } from "../types/niea";
import { checkPreBookingWindow } from "../utils/preBookingHelper";
import { formatTokenNumber } from "../utils/tokenHelper";
import { NieaLogo } from "./NieaLogo";

export type NavTab = "home" | "menu" | "reservation" | "checkout";

interface HeaderProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  totalCartCount: number;
  seating: SeatingStatus;
  onOpenSeating: () => void;
  loyalty: LoyaltyProfile;
  onOpenLoyalty: () => void;
  onOpenOwnerPortal: () => void;
  reservationsCount?: number;
  userSession?: UserSession | null;
  onOpenAuth?: () => void;
  onOpenOrderHistory?: () => void;
  ordersCount?: number;
  onOpenTrackOrder?: () => void;
  activeOrdersCount?: number;
  onOpenLiveCallingBoard?: (tokenNumber?: string) => void;
  activeUserToken?: string | null;
  activeUserStage?: string | null;
  queueOrdersAhead?: number;
  websiteConfig?: WebsiteContentConfig;
  preBookingConfig?: PreBookingConfig;
  loyaltyConfig?: LoyaltyProgramConfig;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  totalCartCount,
  seating,
  onOpenSeating,
  loyalty,
  onOpenLoyalty,
  onOpenOwnerPortal,
  reservationsCount = 0,
  userSession,
  onOpenAuth,
  onOpenOrderHistory,
  ordersCount = 0,
  onOpenTrackOrder,
  activeOrdersCount = 0,
  onOpenLiveCallingBoard,
  activeUserToken,
  activeUserStage,
  queueOrdersAhead = 0,
  websiteConfig,
  preBookingConfig,
  loyaltyConfig,
}) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isReservationEnabled = websiteConfig?.isReservationEnabled ?? false;

  // Track if browser terminal has unlocked the Owner Portal with password
  const [isOwnerUnlocked, setIsOwnerUnlocked] = useState<boolean>(() => {
    try {
      return (
        typeof window !== "undefined" &&
        (sessionStorage.getItem("niea_portal_unlocked") === "true" ||
          localStorage.getItem("niea_portal_unlocked") === "true")
      );
    } catch {
      return false;
    }
  });

  const [unseenOwnerOrders, setUnseenOwnerOrders] = useState<number>(0);

  // Listen for portal unlock/lock events
  useEffect(() => {
    const handleStatus = (e: any) => {
      const unlocked = Boolean(e.detail?.isUnlocked);
      setIsOwnerUnlocked(unlocked);
      if (!unlocked) {
        setUnseenOwnerOrders(0);
      }
    };
    window.addEventListener("niea_portal_unlocked_status", handleStatus);
    return () => window.removeEventListener("niea_portal_unlocked_status", handleStatus);
  }, []);

  // Listen for incoming new orders to notify owner portal button
  useEffect(() => {
    const handleNewOrder = () => {
      if (isOwnerUnlocked) {
        setUnseenOwnerOrders((prev) => prev + 1);
        if (typeof document !== "undefined") {
          document.title = "🔔 (New Order!) NiEA'S Sandwich Bar";
        }
      }
    };
    window.addEventListener("niea_owner_new_order", handleNewOrder);
    return () => window.removeEventListener("niea_owner_new_order", handleNewOrder);
  }, [isOwnerUnlocked]);

  const handleOpenOwnerPortalWithClear = () => {
    setUnseenOwnerOrders(0);
    if (typeof document !== "undefined") {
      document.title = "NiEA'S SANDWICH BAR | Artisanal Sourdough & Specialty Coffee";
    }
    onOpenOwnerPortal();
  };

  // Close dropdown on desktop resize (>= 1024px)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close mobile dropdown on ESC key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsMobileMenuOpen(false);
      }
    };
    if (isMobileMenuOpen) {
      window.addEventListener("keydown", handleKeyDown);
      const prevOverflow = document.body.style.overflow;
      document.body.style.overflow = "hidden";
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = prevOverflow;
      };
    }
  }, [isMobileMenuOpen]);

  const handleNavClick = (tab: NavTab) => {
    onSelectTab(tab);
    setIsMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <header className="sticky top-0 z-50 w-full bg-[#49655B]/98 backdrop-blur-md border-b border-[#F5E086]/20 shadow-md transition-all">
      {/* Top subtle announcement bar */}
      <div className="bg-[#374C44] text-[#F5E086] py-1 px-3 sm:px-4 text-[10px] sm:text-[11px] font-medium border-b border-[#F5E086]/10 flex items-center justify-between overflow-hidden">
        <div className="flex items-center gap-1.5 sm:gap-2 overflow-hidden whitespace-nowrap min-w-0 flex-1">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shrink-0" />
          <span className="truncate block">
            {websiteConfig?.announcement ||
              "Autumn Truffle Melt Feature Live • Fresh Artisanal Bread Baked Daily • Welcome to NiEA'S in New Town, Kolkata"}
          </span>
        </div>

        <div className="hidden lg:flex items-center gap-4 text-[#FBF9F2]/80 shrink-0 text-[11px]">
          {/* Pre-Booking Window Live Badge */}
          {(() => {
            const pb = checkPreBookingWindow(preBookingConfig);
            return (
              <span
                className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold border transition ${
                  pb.isOpen
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
                    : "bg-amber-500/20 text-amber-300 border-amber-400/30"
                }`}
                title={pb.isOpen ? `Pre-orders operating: ${pb.displayWindowText}` : pb.closedReason}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${pb.isOpen ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                <span>
                  {pb.isForceOpen
                    ? "⚡ Pre-Orders Open (Override Active)"
                    : pb.isOpen
                    ? `Pre-Orders Open (${pb.startFormatted} – ${pb.endFormatted})`
                    : `Pre-Orders Closed (${pb.startFormatted} – ${pb.endFormatted})`}
                </span>
              </span>
            );
          })()}

          <span className="flex items-center gap-1.5">
            <Clock className="w-3 h-3 text-[#F5E086]" />
            {websiteConfig?.weekdayHours || "Tue–Sun: 1:00 PM – 11:00 PM (Mon Closed)"}
          </span>
          <span className="flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-[#F5E086]" />
            {websiteConfig?.address || "New Town Action Area 1, Kolkata"}
          </span>

          {activeUserToken && (
            <button
              onClick={() => onOpenTrackOrder?.()}
              className="text-[#1E2B25] bg-[#F5E086] hover:bg-[#F8E79B] transition flex items-center gap-1.5 font-black px-2.5 py-0.5 rounded-full shadow-xs"
              title={`Your active calling token is ${activeUserToken}. Click to track order.`}
            >
              <Ticket className="w-3 h-3" />
              <span>Token #{activeUserToken}</span>
              <span className="bg-[#1E2B25] text-[#F5E086] text-[9px] px-1.5 py-0.2 rounded-full font-bold">
                {activeUserStage || "In Queue"}
              </span>
            </button>
          )}

          {onOpenTrackOrder && (
            <button
              onClick={onOpenTrackOrder}
              className="text-[#24332D] bg-[#F5E086] hover:bg-[#F8E79B] transition flex items-center gap-1.5 font-bold px-2.5 py-0.5 rounded-full shadow-xs"
              title="Track live order status"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-[#24332D] animate-pulse" />
              <span>Track Order</span>
              {activeOrdersCount > 0 && (
                <span className="w-4 h-4 rounded-full bg-[#24332D] text-[#F5E086] text-[9px] font-black flex items-center justify-center">
                  {activeOrdersCount}
                </span>
              )}
            </button>
          )}

          {onOpenOrderHistory && (
            <button
              onClick={onOpenOrderHistory}
              className="text-[#F5E086] hover:text-white transition flex items-center gap-1.5 font-semibold bg-[#24332D] px-2.5 py-0.5 rounded-full border border-[#F5E086]/25"
              title="Order History & Receipts"
            >
              <Clock className="w-3 h-3" />
              <span>Past Orders</span>
            </button>
          )}
        </div>
      </div>

      {/* Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-3 sm:px-6 py-2 sm:py-2.5 flex items-center justify-between gap-2 sm:gap-4">
        {/* Brand Left with Authentic Logo (Clean, no liquid glass distortion) */}
        <button
          onClick={() => handleNavClick("home")}
          className="brand-logo-btn logo-no-liquid flex items-center gap-2 text-left group transition-transform duration-150 active:scale-98 shrink-0 !bg-transparent !border-0 !shadow-none !backdrop-filter-none"
          title="NiEA'S SANDWICH BAR - Home"
        >
          <div className="relative py-0.5">
            <NieaLogo size="navbar" />
          </div>
        </button>

        {/* Center Primary Tab Navigation Bar (Kept exclusively on Laptop & PC >= 1024px) */}
        <nav
          aria-label="Primary Navigation"
          className="hidden lg:flex shrink-0 items-center p-1 rounded-full bg-[#374C44]/95 border border-[#F5E086]/30 shadow-inner backdrop-blur-xs"
        >
          <button
            type="button"
            onClick={() => onSelectTab("home")}
            className={`px-3.5 xl:px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "home"
                ? "bg-[#F5E086] text-[#24332D] shadow-sm font-black"
                : "text-[#FBF9F2]/80 hover:text-white hover:bg-white/5"
            }`}
          >
            <Home className="w-3.5 h-3.5" />
            <span>Home</span>
          </button>

          <button
            type="button"
            onClick={() => onSelectTab("menu")}
            className={`px-3.5 xl:px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "menu"
                ? "bg-[#F5E086] text-[#24332D] shadow-sm font-black"
                : "text-[#FBF9F2]/80 hover:text-white hover:bg-white/5"
            }`}
          >
            <UtensilsCrossed className="w-3.5 h-3.5" />
            <span>Menu</span>
          </button>

          {isReservationEnabled ? (
            <button
              type="button"
              onClick={() => onSelectTab("reservation")}
              className={`px-3.5 xl:px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
                activeTab === "reservation"
                  ? "bg-[#F5E086] text-[#24332D] shadow-sm font-black"
                  : "text-[#FBF9F2]/80 hover:text-white hover:bg-white/5"
              }`}
            >
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>Reservation</span>
              {reservationsCount > 0 && (
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              )}
            </button>
          ) : (
            <div
              title="Table reservations launching in future"
              className="px-3 py-1.5 rounded-full text-xs font-medium text-white/40 flex items-center gap-1.5 bg-white/5 cursor-not-allowed select-none border border-white/5"
            >
              <CalendarCheck className="w-3.5 h-3.5 opacity-40" />
              <span>Reservation</span>
              <span className="text-[10px] px-1.5 py-0.2 rounded-full bg-[#F5E086]/20 text-[#F5E086] font-semibold">Soon</span>
            </div>
          )}

          {/* Queue TV / Live Tokens Tab */}
          <button
            type="button"
            onClick={() => {
              if (onOpenLiveCallingBoard) {
                onOpenLiveCallingBoard();
              } else {
                onSelectTab("home");
                setTimeout(() => {
                  const el = document.getElementById("live-queue-tv-section");
                  if (el) el.scrollIntoView({ behavior: "smooth" });
                }, 100);
              }
            }}
            className="px-3.5 xl:px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer text-emerald-300 hover:text-white hover:bg-emerald-500/20 border border-emerald-400/30"
            title="McDonald's-Style Live Kitchen Queue TV & Calling Board"
          >
            <Tv className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>Queue TV</span>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
          </button>

          <button
            type="button"
            onClick={() => onSelectTab("checkout")}
            className={`px-3.5 xl:px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer ${
              activeTab === "checkout"
                ? "bg-[#F5E086] text-[#24332D] shadow-sm font-black"
                : "text-[#FBF9F2]/80 hover:text-white hover:bg-white/5"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Checkout</span>
            {totalCartCount > 0 && (
              <span className="px-1.5 py-0.2 rounded-full bg-[#24332D] text-[#F5E086] text-[10px] font-black">
                {totalCartCount}
              </span>
            )}
          </button>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
          {/* Sandwiches Daily Batch Counter (Desktop / Laptop >= 1280px) */}
          <button
            type="button"
            onClick={onOpenSeating}
            className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#374C44] border border-[#F5E086]/25 text-xs font-medium text-[#FBF9F2] hover:border-[#F5E086]/60 transition shadow-xs"
            title="Daily Artisanal Sandwiches (Batch of 50)"
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Sandwiches: <strong className="text-[#F5E086] font-bold">{seating.availableSandwiches ?? 38} / 50</strong></span>
          </button>

          {/* Customer Live Queue TV Button */}
          {onOpenLiveCallingBoard && (
            <button
              type="button"
              onClick={() => onOpenLiveCallingBoard()}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-400/40 text-[11px] sm:text-xs font-bold transition shadow-xs cursor-pointer shrink-0"
              title="Open McDonald's-Style Live Token Calling Board / Queue TV"
            >
              <Tv className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-emerald-400 animate-pulse" />
              <span>Queue TV</span>
            </button>
          )}

          {/* Active User Token Pill (Shown if customer has active order) */}
          {activeUserToken && (
            <button
              type="button"
              onClick={() => (onOpenLiveCallingBoard ? onOpenLiveCallingBoard(activeUserToken) : onOpenTrackOrder?.())}
              className="flex items-center gap-1 sm:gap-1.5 px-2 sm:px-3 py-1.5 rounded-full bg-[#1E2B25] border-2 border-[#F5E086] text-[#F5E086] hover:bg-[#2B3D36] transition shadow-md text-xs font-black animate-pulse shrink-0"
              title="Your calling token number"
            >
              <Ticket className="w-3.5 h-3.5 text-[#F5E086]" />
              <span className="font-niea tracking-wider">#{formatTokenNumber(activeUserToken)}</span>
              <span className="hidden xs:inline text-[10px] text-emerald-300 font-sans font-bold bg-emerald-950/60 px-1.5 py-0.2 rounded-full border border-emerald-400/30">
                {activeUserStage || `${queueOrdersAhead} ahead`}
              </span>
            </button>
          )}

          {/* Laptop/PC Only (>= 1024px): Live Order Tracker Button */}
          {onOpenTrackOrder && (
            <button
              type="button"
              onClick={onOpenTrackOrder}
              className={`hidden lg:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full border text-xs font-bold transition shadow-xs ${
                activeOrdersCount > 0
                  ? "bg-[#2B3D36] border-emerald-400/60 text-emerald-300 hover:bg-[#3E564D]"
                  : "bg-[#374C44] border-[#F5E086]/25 text-[#F5E086] hover:bg-[#3E564D]"
              }`}
              title="Track live order status & kitchen preparation"
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  activeOrdersCount > 0 ? "bg-emerald-400 animate-pulse" : "bg-[#F5E086]"
                }`}
              />
              <span>Track</span>
              {activeOrdersCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-emerald-400 text-[#24332D] text-[10px] font-black">
                  {activeOrdersCount}
                </span>
              )}
            </button>
          )}

          {/* Laptop/PC Only (>= 1024px): Loyalty Club Perks (Only if enabled by owner) */}
          {loyaltyConfig?.isEnabled !== false && (
            <button
              type="button"
              onClick={onOpenLoyalty}
              className="hidden lg:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-[#374C44] border border-[#F5E086]/25 text-xs font-bold text-[#F5E086] hover:bg-[#3E564D] transition shadow-xs"
              title="Paws & Perks Loyalty Rewards"
            >
              <Award className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Perks</span>
              <span className="px-1.5 py-0.2 rounded-full bg-[#F5E086] text-[#24332D] text-[10px] font-black">
                {loyalty.stampsCount}/6
              </span>
            </button>
          )}

          {/* Laptop/PC Only (>= 1024px): User Account / Google Login Button */}
          {onOpenAuth && (
            <button
              id="header-user-auth-btn"
              type="button"
              onClick={onOpenAuth}
              className={`hidden lg:flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold transition shadow-xs ${
                userSession?.isLoggedIn
                  ? "bg-emerald-800/80 border border-emerald-400/40 text-emerald-200 hover:bg-emerald-700/80"
                  : "bg-white hover:bg-gray-100 text-gray-800 border border-white/30"
              }`}
              title={userSession?.isLoggedIn ? `Logged in as ${userSession.name}` : "Sign in with Google"}
            >
              {userSession?.isLoggedIn ? (
                <>
                  {userSession.avatarUrl ? (
                    <img
                      src={userSession.avatarUrl}
                      alt={userSession.name}
                      className="w-4 h-4 rounded-full object-cover border border-emerald-300"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-emerald-400" />
                  )}
                  <span className="hidden sm:inline max-w-[85px] truncate">{userSession.name}</span>
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  <span>Sign In</span>
                </>
              )}
            </button>
          )}

          {/* Staff & Owner Portal Button (Displays directly in navbar when unlocked, or alerts with vibrating badge on new order) */}
          {isOwnerUnlocked && (
            <button
              type="button"
              onClick={handleOpenOwnerPortalWithClear}
              className={`relative flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full text-xs font-bold transition shadow-md active:scale-95 cursor-pointer shrink-0 ${
                unseenOwnerOrders > 0
                  ? "bg-gradient-to-r from-rose-500 to-amber-500 text-white border-2 border-amber-300 ring-2 ring-rose-400/50 animate-bounce"
                  : "bg-[#25362F] hover:bg-[#2F443B] text-[#F5E086] border border-[#F5E086]/40"
              }`}
              title={
                unseenOwnerOrders > 0
                  ? `🔔 ${unseenOwnerOrders} new incoming order(s)! Tap to open Owner Portal`
                  : "Owner Portal (Unlocked)"
              }
            >
              {unseenOwnerOrders > 0 ? (
                <>
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-white"></span>
                  </span>
                  <Bell className="w-3.5 h-3.5 text-white" />
                  <span className="font-niea font-black">
                    {unseenOwnerOrders} NEW
                  </span>
                </>
              ) : (
                <>
                  <Settings className="w-3.5 h-3.5 text-[#F5E086]" />
                  <span className="hidden xs:inline font-niea font-bold">Portal</span>
                </>
              )}
            </button>
          )}

          {/* Checkout / Basket Button (Visible on all screen sizes) */}
          <button
            type="button"
            onClick={() => handleNavClick("checkout")}
            className={`flex items-center gap-1 sm:gap-2 px-2.5 sm:px-3.5 py-1.5 rounded-full font-bold text-xs transition shadow-md shrink-0 cursor-pointer ${
              activeTab === "checkout"
                ? "bg-[#FBF9F2] text-[#24332D]"
                : "bg-[#e1ad01] text-[#1E2B25] hover:bg-[#cca000]"
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            <span className="hidden xs:inline">Basket</span>
            <span className="w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#1E2B25] text-[#e1ad01] text-[10px] sm:text-[11px] font-black flex items-center justify-center">
              {totalCartCount}
            </span>
          </button>

          {/* ============================================================== */}
          {/* MOBILE & TABLET (< 1024px): 3-LINE DROPDOWN MENU BUTTON        */}
          {/* ============================================================== */}
          <button
            type="button"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="lg:hidden flex flex-col justify-center items-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-[#374C44] border border-[#F5E086]/35 text-[#F5E086] hover:bg-[#3E564D] transition relative focus:outline-none shadow-xs cursor-pointer active:scale-95 shrink-0"
            aria-label={isMobileMenuOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={isMobileMenuOpen}
          >
            {/* 3 lines full sized */}
            <span
              className={`block h-0.5 w-5 bg-[#F5E086] rounded-full transition-all duration-300 ease-out ${
                isMobileMenuOpen ? "rotate-45 translate-y-1.5" : "-translate-y-1"
              }`}
            />
            <span
              className={`block h-0.5 w-5 bg-[#F5E086] rounded-full transition-all duration-200 ease-out ${
                isMobileMenuOpen ? "opacity-0 scale-x-50" : "opacity-100"
              }`}
            />
            <span
              className={`block h-0.5 w-5 bg-[#F5E086] rounded-full transition-all duration-300 ease-out ${
                isMobileMenuOpen ? "-rotate-45 -translate-y-1.5" : "translate-y-1"
              }`}
            />

            {/* Notification pip if active order or cart */}
            {!isMobileMenuOpen && (activeOrdersCount > 0 || totalCartCount > 0) && (
              <span className="absolute -top-1 -right-1 w-2.5 h-2.5 rounded-full bg-emerald-400 border border-[#24332D] animate-pulse" />
            )}
          </button>
        </div>
      </div>

      {/* ============================================================== */}
      {/* MOBILE & TABLET (< 1024px): 3-LINE DROPDOWN MENU PANEL        */}
      {/* ============================================================== */}
      {isMobileMenuOpen && (
        <div className="lg:hidden relative">
          {/* Backdrop overlay */}
          <div
            className="fixed inset-0 top-[88px] sm:top-[98px] bg-black/75 backdrop-blur-xs z-40 animate-in fade-in duration-200"
            onClick={() => setIsMobileMenuOpen(false)}
          />

          {/* Full-sized dropdown panel */}
          <div className="relative z-50 bg-[#1D2A24] border-t border-b border-[#F5E086]/25 shadow-2xl animate-in slide-in-from-top-3 duration-200 max-h-[85vh] overflow-y-auto overscroll-contain">
            <div className="max-w-3xl mx-auto pb-16">
              {/* 1. User Profile Strip */}
              <div className="p-3.5 sm:p-4 bg-[#25362E] border-b border-white/10 flex items-center justify-between gap-3">
                {userSession?.isLoggedIn ? (
                  <div className="flex items-center gap-2.5 min-w-0">
                    {userSession.avatarUrl ? (
                      <img
                        src={userSession.avatarUrl}
                        alt={userSession.name}
                        className="w-9 h-9 rounded-full object-cover border border-[#F5E086]/50 shrink-0"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-emerald-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                        {userSession.name?.[0]?.toUpperCase() || "U"}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white truncate">{userSession.name}</p>
                      <p className="text-[11px] text-emerald-300 truncate font-mono">
                        {userSession.phoneNumber || userSession.email || "Verified Member"}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-lg bg-[#F5E086]/20 flex items-center justify-center text-[#F5E086]">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-white">Welcome to NiEA'S</p>
                      <p className="text-[11px] text-[#F5E086]">Artisanal Sourdough & Specialty Melts</p>
                    </div>
                  </div>
                )}

                {onOpenAuth && (
                  <button
                    type="button"
                    onClick={() => {
                      onOpenAuth();
                      setIsMobileMenuOpen(false);
                    }}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 shrink-0 ${
                      userSession?.isLoggedIn
                        ? "bg-white/10 hover:bg-white/15 text-white border border-white/15"
                        : "bg-[#F5E086] hover:bg-[#F8E79B] text-[#24332D]"
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>{userSession?.isLoggedIn ? "Profile" : "Sign In"}</span>
                  </button>
                )}
              </div>

              {/* 2. Main Navigation Tabs */}
              <div className="p-3 sm:p-4">
                <div className="text-[11px] font-bold text-[#F5E086]/80 uppercase tracking-wider px-2 py-1 mb-1">
                  Explore NiEA'S
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Tab: Home */}
                  <button
                    type="button"
                    onClick={() => handleNavClick("home")}
                    className={`flex items-center justify-between p-3 rounded-xl transition text-left font-bold text-sm ${
                      activeTab === "home"
                        ? "bg-[#F5E086] text-[#24332D] shadow-sm font-black"
                        : "text-[#FBF9F2] hover:bg-white/5 bg-[#25352E]/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          activeTab === "home" ? "bg-[#24332D] text-[#F5E086]" : "bg-white/10 text-[#F5E086]"
                        }`}
                      >
                        <Home className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-sm">Home</span>
                        <span
                          className={`text-[11px] block font-normal ${
                            activeTab === "home" ? "text-[#24332D]/80" : "text-white/50"
                          }`}
                        >
                          Cafe story, craft & sourdough batch
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-50 shrink-0" />
                  </button>

                  {/* Tab: Menu */}
                  <button
                    type="button"
                    onClick={() => handleNavClick("menu")}
                    className={`flex items-center justify-between p-3 rounded-xl transition text-left font-bold text-sm ${
                      activeTab === "menu"
                        ? "bg-[#F5E086] text-[#24332D] shadow-sm font-black"
                        : "text-[#FBF9F2] hover:bg-white/5 bg-[#25352E]/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          activeTab === "menu" ? "bg-[#24332D] text-[#F5E086]" : "bg-white/10 text-[#F5E086]"
                        }`}
                      >
                        <UtensilsCrossed className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-sm">Food & Drink Menu</span>
                        <span
                          className={`text-[11px] block font-normal ${
                            activeTab === "menu" ? "text-[#24332D]/80" : "text-white/50"
                          }`}
                        >
                          Melts, brioche, kombucha & coffees
                        </span>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 opacity-50 shrink-0" />
                  </button>

                  {/* Tab: Reservation */}
                  {isReservationEnabled ? (
                    <button
                      type="button"
                      onClick={() => handleNavClick("reservation")}
                      className={`flex items-center justify-between p-3 rounded-xl transition text-left font-bold text-sm ${
                        activeTab === "reservation"
                          ? "bg-[#F5E086] text-[#24332D] shadow-sm font-black"
                          : "text-[#FBF9F2] hover:bg-white/5 bg-[#25352E]/50"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                            activeTab === "reservation" ? "bg-[#24332D] text-[#F5E086]" : "bg-white/10 text-[#F5E086]"
                          }`}
                        >
                          <CalendarCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block text-sm">Table Reservation</span>
                          <span
                            className={`text-[11px] block font-normal ${
                              activeTab === "reservation" ? "text-[#24332D]/80" : "text-white/50"
                            }`}
                          >
                            Instant booking, pre-orders & seating
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        {reservationsCount > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-[#24332D] text-[10px] font-black">
                            {reservationsCount} Booked
                          </span>
                        )}
                        <ChevronRight className="w-4 h-4 opacity-50" />
                      </div>
                    </button>
                  ) : (
                    <div className="flex items-center justify-between p-3 rounded-xl bg-[#25352E]/30 text-white/50 text-left text-sm border border-white/5">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-white/5 text-white/40">
                          <CalendarCheck className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block text-sm font-medium text-white/60">Table Reservation</span>
                          <span className="text-[11px] block font-normal text-white/40">
                            Coming soon in future update
                          </span>
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-[#F5E086]/15 text-[#F5E086] text-[10px] font-bold">
                        Launching Soon
                      </span>
                    </div>
                  )}

                  {/* Tab: Checkout / Basket */}
                  <button
                    type="button"
                    onClick={() => handleNavClick("checkout")}
                    className={`flex items-center justify-between p-3 rounded-xl transition text-left font-bold text-sm ${
                      activeTab === "checkout"
                        ? "bg-[#F5E086] text-[#24332D] shadow-sm font-black"
                        : "text-[#FBF9F2] hover:bg-white/5 bg-[#25352E]/50"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                          activeTab === "checkout" ? "bg-[#24332D] text-[#F5E086]" : "bg-white/10 text-[#F5E086]"
                        }`}
                      >
                        <ShoppingBag className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-sm">Checkout & Basket</span>
                        <span
                          className={`text-[11px] block font-normal ${
                            activeTab === "checkout" ? "text-[#24332D]/80" : "text-white/50"
                          }`}
                        >
                          Review cart items & UPI payment
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      {totalCartCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-[#F5E086] text-[#24332D] text-xs font-black">
                          {totalCartCount} {totalCartCount === 1 ? "item" : "items"}
                        </span>
                      )}
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </div>
                  </button>
                </div>
              </div>

              {/* 3. Live Kitchen & Queue Section */}
              <div className="p-3 sm:p-4 border-t border-white/10">
                <div className="text-[11px] font-bold text-[#F5E086]/80 uppercase tracking-wider px-2 py-1 mb-1">
                  Live Kitchen & Queue
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Track Order */}
                  {onOpenTrackOrder && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenTrackOrder();
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center justify-between p-3 rounded-xl text-left font-bold text-sm text-[#FBF9F2] hover:bg-white/5 bg-[#25352E]/50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                          <Clock className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block text-sm">Track Order</span>
                          <span className="text-[11px] block font-normal text-white/50">
                            6-step preparation & countdown
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 shrink-0">
                        {activeOrdersCount > 0 ? (
                          <span className="px-2 py-0.5 rounded-full bg-emerald-400 text-[#24332D] text-[10px] font-black flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-[#24332D] animate-ping" />
                            <span>{activeOrdersCount} Active</span>
                          </span>
                        ) : (
                          <span className="text-[10px] text-white/40">Lookup</span>
                        )}
                        <ChevronRight className="w-4 h-4 opacity-50" />
                      </div>
                    </button>
                  )}

                  {/* Live Queue TV / Calling Board */}
                  <button
                    type="button"
                    onClick={() => {
                      setIsMobileMenuOpen(false);
                      if (onOpenLiveCallingBoard) {
                        onOpenLiveCallingBoard();
                      } else {
                        onSelectTab("home");
                        setTimeout(() => {
                          const el = document.getElementById("live-queue-tv-section");
                          if (el) el.scrollIntoView({ behavior: "smooth" });
                        }, 100);
                      }
                    }}
                    className="flex items-center justify-between p-3 rounded-xl text-left font-bold text-sm text-[#FBF9F2] hover:bg-white/5 bg-[#25352E]/50 transition border border-emerald-400/30"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                        <Tv className="w-4 h-4 animate-pulse" />
                      </div>
                      <div>
                        <span className="block text-sm text-emerald-300">Live Queue TV</span>
                        <span className="text-[11px] block font-normal text-white/50">
                          McDonald's-style counter token board
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/40">
                        Live TV
                      </span>
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </div>
                  </button>
                </div>
              </div>

              {/* 4. Customer Perks & History Section */}
              <div className="p-3 sm:p-4 border-t border-white/10">
                <div className="text-[11px] font-bold text-[#F5E086]/80 uppercase tracking-wider px-2 py-1 mb-1">
                  Perks & History
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {/* Loyalty Perks */}
                  <button
                    type="button"
                    onClick={() => {
                      onOpenLoyalty();
                      setIsMobileMenuOpen(false);
                    }}
                    className="flex items-center justify-between p-3 rounded-xl text-left font-bold text-sm text-[#FBF9F2] hover:bg-white/5 bg-[#25352E]/50 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-amber-400/20 text-amber-300 flex items-center justify-center">
                        <Award className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="block text-sm">Paws & Perks Loyalty</span>
                        <span className="text-[11px] block font-normal text-white/50">
                          Earn stamps for complimentary sourdough
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="px-2 py-0.5 rounded-full bg-[#F5E086] text-[#24332D] text-[10px] font-black">
                        {loyalty.stampsCount}/6 Stamps
                      </span>
                      <ChevronRight className="w-4 h-4 opacity-50" />
                    </div>
                  </button>

                  {/* Order History */}
                  {onOpenOrderHistory && (
                    <button
                      type="button"
                      onClick={() => {
                        onOpenOrderHistory();
                        setIsMobileMenuOpen(false);
                      }}
                      className="flex items-center justify-between p-3 rounded-xl text-left font-bold text-sm text-[#FBF9F2] hover:bg-white/5 bg-[#25352E]/50 transition"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white/10 text-[#F5E086] flex items-center justify-center">
                          <Receipt className="w-4 h-4" />
                        </div>
                        <div>
                          <span className="block text-sm">Past Orders & Invoices</span>
                          <span className="text-[11px] block font-normal text-white/50">
                            View previous receipts & tax invoices
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-4 h-4 opacity-50 shrink-0" />
                    </button>
                  )}
                </div>
              </div>

              {/* 5. Footer with Batch Counter & Owner Portal */}
              <div className="p-3.5 sm:p-4 bg-[#18231E] border-t border-white/10 flex items-center justify-between gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    onOpenSeating();
                    setIsMobileMenuOpen(false);
                  }}
                  className="flex items-center gap-2 text-white/80 hover:text-[#F5E086] transition text-left"
                >
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
                  <span>
                    Batch: <strong className="text-[#F5E086]">{seating.availableSandwiches ?? 38}/50</strong> left
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    handleOpenOwnerPortalWithClear();
                    setIsMobileMenuOpen(false);
                  }}
                  className={`text-[11px] flex items-center gap-1.5 transition px-2.5 py-1 rounded-lg ${
                    unseenOwnerOrders > 0
                      ? "bg-rose-500 text-white font-bold animate-pulse"
                      : "text-white/60 hover:text-[#F5E086] bg-white/5"
                  }`}
                >
                  {unseenOwnerOrders > 0 ? (
                    <Bell className="w-3.5 h-3.5 text-white" />
                  ) : (
                    <Settings className="w-3.5 h-3.5" />
                  )}
                  <span>Owner Portal</span>
                  {unseenOwnerOrders > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full bg-white text-rose-600 font-mono font-black text-[9px]">
                      {unseenOwnerOrders} NEW
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
