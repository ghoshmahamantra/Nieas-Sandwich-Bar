import React, { useState, useEffect } from "react";
import {
  Sparkles,
  UtensilsCrossed,
  CalendarCheck,
  Clock,
  MapPin,
  Flame,
  ArrowRight,
  Tv,
  CheckCircle2,
  AlertCircle,
  ShoppingBag,
  ChevronUp,
  Minus,
  Plus,
} from "lucide-react";
import { motion, useScroll, useTransform, AnimatePresence } from "motion/react";
import { MenuItem, SeatingStatus, CafeHighlight, OrderRecord, CartItem, WebsiteContentConfig, PreBookingConfig } from "../types/niea";
import { NavTab } from "../components/Header";
import { checkPreBookingWindow } from "../utils/preBookingHelper";
import { formatTokenNumber } from "../utils/tokenHelper";
import { useSmoothScroll } from "../components/SmoothScrollProvider";
import { getFontById } from "../utils/fontRegistry";

interface HomeViewProps {
  onSelectTab: (tab: NavTab) => void;
  featuredItems: MenuItem[];
  onAddToCart: (item: MenuItem) => void;
  onDecrementFromCart?: (item: MenuItem) => void;
  cartItemCounts?: Record<string, number>;
  seating: SeatingStatus;
  onPetCat: () => void;
  cafeHighlight?: CafeHighlight;
  activeHoldsCount?: number;
  onOpenTrackOrder?: (orderNumber?: string) => void;
  activeOrder?: OrderRecord | null;
  websiteConfig?: WebsiteContentConfig;
  preBookingConfig?: PreBookingConfig;
  onOpenLiveCallingBoard?: (tokenNumber?: string) => void;
  liveOrders?: OrderRecord[];
}

export const HomeView: React.FC<HomeViewProps> = ({
  onSelectTab,
  featuredItems,
  onAddToCart,
  onDecrementFromCart,
  cartItemCounts = {},
  seating,
  onPetCat,
  cafeHighlight,
  activeHoldsCount = 0,
  onOpenTrackOrder,
  activeOrder,
  websiteConfig,
  preBookingConfig,
  onOpenLiveCallingBoard,
  liveOrders = [],
}) => {
  const pbStatus = checkPreBookingWindow(preBookingConfig);
  const totalBatch = seating.totalSandwiches || 50;
  const availableCount = Math.max(0, seating.availableSandwiches ?? 38);
  const percentLeft = Math.min(100, Math.max(0, Math.round((availableCount / totalBatch) * 100)));
  const isReservationEnabled = websiteConfig?.isReservationEnabled ?? false;

  const { scrollTo } = useSmoothScroll();

  // Separate live orders for home queue TV preview
  const readyOrders = liveOrders.filter((o) => o.status === "ready").slice(0, 4);
  const preparingOrders = liveOrders.filter((o) => o.status === "toasting" || o.status === "received").slice(0, 4);

  // Background image & tint from owner websiteConfig or default storefront photo
  const bgImageSrc = websiteConfig?.heroBackgroundImage || "/PHOTO-2026-10-02-15-59-48.jpg";
  const overlayOpacity = Math.max(0, Math.min(1, websiteConfig?.heroBackgroundOverlayOpacity ?? 0.45));

  // "Order Now" size and styling options from owner portal
  const orderNowSize = websiteConfig?.orderNowButtonSize || "md";
  const customOrderFontSize = websiteConfig?.orderNowButtonFontSize;

  const orderNowSizeClasses = {
    sm: "px-5 py-2 text-xs",
    md: "px-7 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base",
    lg: "px-9 sm:px-10 py-3 sm:py-3.5 text-base sm:text-lg",
    xl: "px-11 sm:px-12 py-3.5 sm:py-4 text-lg sm:text-xl",
  }[orderNowSize] || "px-7 sm:px-8 py-2.5 sm:py-3 text-sm sm:text-base";

  // Smooth scroll parallax transforms
  const { scrollY } = useScroll();
  const bgY = useTransform(scrollY, [0, 700], [0, 100]);
  const bgScale = useTransform(scrollY, [0, 700], [1.02, 1.08]);
  const heroContentY = useTransform(scrollY, [0, 500], [0, 25]);
  // Maintain hero visibility on scroll without fading to blur
  const heroContentOpacity = useTransform(scrollY, [0, 600], [1, 0.75]);

  // Floating scroll to top & persistent floating "Order Now" button
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [isScrolledPastHero, setIsScrolledPastHero] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPos = window.scrollY;
      setShowScrollTop(scrollPos > 400);
      setIsScrolledPastHero(scrollPos > 360);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    scrollTo(0);
  };

  // Matched highlight item for Today's Cafe Feature
  const highlightItemId = cafeHighlight?.menuItemId || "autumn-truffle-mushroom";
  const matchedHighlightItem =
    featuredItems.find((i) => i.id === highlightItemId) || featuredItems[0];
  const highlightImageUrl =
    cafeHighlight?.imageUrl ||
    matchedHighlightItem?.imageUrl ||
    "/PHOTO-2026-10-02-15-59-48.jpg";

  // Visibility toggles from websiteConfig (Default to true if undefined)
  const showHeroTitle = websiteConfig?.showHeroTitle !== false;
  const showHeroPill = websiteConfig?.showHeroPill !== false;
  const showHeroTagline = websiteConfig?.showHeroTagline !== false;
  const showHeroSandwichCount = websiteConfig?.showHeroSandwichCount !== false;
  const showHeroOperatingInfo = websiteConfig?.showHeroOperatingInfo !== false;

  return (
    <div className="relative isolate space-y-10 sm:space-y-14 pb-16">
      {/* Mid-page subtle ambient repeating motif */}
      <div 
        className="pointer-events-none absolute inset-0 -z-10 overflow-hidden flex flex-col items-center select-none"
        aria-hidden="true"
      >
        <div className="w-full flex justify-center mt-[700px] sm:mt-[800px]">
          <img
            src={bgImageSrc}
            alt=""
            loading="lazy"
            decoding="async"
            className="w-[85vw] max-w-4xl rounded-3xl object-cover opacity-[0.06] sm:opacity-[0.08]"
          />
        </div>
      </div>

      {/* Active Order In-Progress Callout Banner (If user has active order) */}
      {activeOrder && onOpenTrackOrder && (
        <div className="max-w-5xl mx-auto px-4 sm:px-6 pt-2">
          <div className="p-3.5 sm:p-4 rounded-2xl bg-[#2B3D36] border border-emerald-400/40 shadow-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-in fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-400 shrink-0">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white text-xs sm:text-sm">
                    Live Order #{activeOrder.orderNumber}
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 border border-emerald-400/40 text-[10px] font-bold uppercase flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>
                      {activeOrder.status === "received" && "Received"}
                      {activeOrder.status === "toasting" && "Toasting"}
                      {activeOrder.status === "ready" && "Ready"}
                    </span>
                  </span>
                </div>
                <p className="text-[11px] text-[#FBF9F2]/70 mt-0.5">
                  Token <strong className="text-[#e1ad01]">{formatTokenNumber(activeOrder.tokenNumber)}</strong> • Est. {activeOrder.estimatedTime || "8–12 mins"} •{" "}
                  {activeOrder.items.reduce((acc: number, i: CartItem) => acc + (i.quantity || 1), 0)} items
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => onOpenTrackOrder(activeOrder.orderNumber)}
              className="w-full sm:w-auto px-4 py-2 rounded-full bg-[#e1ad01] hover:bg-[#cca000] text-[#1E2B25] text-xs font-bold transition flex items-center justify-center gap-1.5 shadow-sm shrink-0 cursor-pointer"
            >
              <span>Track Live Order</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      )}

      {/* 1. HERO SECTION (Full responsive background photo, clean aesthetics) */}
      <section className="relative w-full overflow-hidden text-center min-h-[500px] sm:min-h-[580px] md:min-h-[640px] flex flex-col items-center justify-center px-4 sm:px-6 pt-10 sm:pt-14 pb-14 sm:pb-18">
        {/* Full Hero Background Image with Smooth Parallax & Scale Scrolling */}
        <motion.div 
          style={{ y: bgY, scale: bgScale }}
          className="absolute inset-0 pointer-events-none select-none z-0 overflow-hidden"
        >
          <img
            src={bgImageSrc}
            alt="NiEA'S Cafe Storefront"
            decoding="async"
            className="w-full h-full object-cover object-center filter brightness-95 transition-all duration-700"
          />
          {/* Natural dim overlay with dynamic percentage from owner portal slider */}
          <div 
            className="absolute inset-0 bg-black transition-opacity duration-300"
            style={{ opacity: overlayOpacity }}
          />
          {/* Smooth bottom fade into theme background */}
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[#49655B] to-transparent pointer-events-none" />
        </motion.div>

        {/* Foreground Content with Smooth Entrance & High Clarity */}
        <motion.div 
          style={{ y: heroContentY, opacity: heroContentOpacity }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 max-w-2xl mx-auto flex flex-col items-center space-y-3.5 sm:space-y-4 pt-2 pb-2 w-full"
        >
          {/* Top Pill Badge (Removable via Owner Portal) */}
          {showHeroPill && (websiteConfig?.heroPillText || !websiteConfig) && (
            <div className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1 rounded-full bg-black/50 backdrop-blur-md border border-[#e1ad01]/40 text-[#e1ad01] text-[10px] sm:text-xs font-bold tracking-wider uppercase shadow-md max-w-[94vw] text-center">
              <Sparkles className="w-3 h-3 text-[#e1ad01] shrink-0" />
              <span className="truncate">{websiteConfig?.heroPillText || "ARTISANAL SOURDOUGH & SPECIALTY SANDWICHES • KOLKATA"}</span>
            </div>
          )}

          {/* Main Title (Removable via Owner Portal "showHeroTitle" toggle) */}
          {showHeroTitle && (
            <h1
              style={{
                fontFamily: getFontById(websiteConfig?.heroTitleFontFamily || "playfair").fontFamilyCss,
                fontSize: websiteConfig?.heroTitleFontSize
                  ? `${Math.max(28, Math.min(84, websiteConfig.heroTitleFontSize))}px`
                  : undefined,
              }}
              className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-normal text-[#F5E086] tracking-tight leading-[1.1] drop-shadow-[0_2px_16px_rgba(0,0,0,0.95)] text-center transition-all duration-200 px-2 break-words"
            >
              {websiteConfig?.heroTitle ? (
                websiteConfig.heroTitle
              ) : (
                <>
                  NiEA'S Sandwich
                  <br />
                  Bar
                </>
              )}
            </h1>
          )}

          {/* Subtitle Paragraph (Removable via Owner Portal) */}
          {showHeroTagline && (websiteConfig?.tagline || !websiteConfig) && (
            <p className="text-xs sm:text-sm md:text-base text-[#FBF9F2] font-normal leading-relaxed max-w-md sm:max-w-lg mx-auto drop-shadow-[0_1px_6px_rgba(0,0,0,0.95)] text-center px-2">
              {websiteConfig?.tagline ||
                "Cultured sourdough melts, toasted brioche & specialty beverages. Handcrafted fresh daily in New Town Action Area 1, Kolkata."}
            </p>
          )}

          {/* Action Buttons Stack - Dynamic based on reservation status */}
          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3 pt-2 w-full">
            {isReservationEnabled ? (
              <>
                {/* Primary Eye-Catchy Order Now Button (Mustard Yellow #e1ad01, No Emoji, Adjustable Size) */}
                <motion.button
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onSelectTab("menu")}
                  style={{
                    fontSize: customOrderFontSize ? `${customOrderFontSize}px` : undefined,
                  }}
                  className={`btn-liquid liquid-gold rounded-full font-black tracking-wide flex items-center justify-center cursor-pointer ${orderNowSizeClasses}`}
                >
                  <span>Order Now</span>
                </motion.button>

                {/* Secondary Compact Book Table Button */}
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => onSelectTab("reservation")}
                  className="btn-liquid liquid-glass px-4 sm:px-5 py-2.5 rounded-full font-semibold text-xs sm:text-sm flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <CalendarCheck className="w-3.5 h-3.5 text-[#F5E086]" />
                  <span>Book Table</span>
                </motion.button>
              </>
            ) : (
              /* When reservation is disabled: Order Now button in Mustard Yellow #e1ad01, No emoji, Adjustable Size */
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.96 }}
                onClick={() => onSelectTab("menu")}
                style={{
                  fontSize: customOrderFontSize ? `${customOrderFontSize}px` : undefined,
                }}
                className={`btn-liquid liquid-gold rounded-full font-black tracking-wide flex items-center justify-center cursor-pointer ${orderNowSizeClasses}`}
              >
                <span>Order Now</span>
              </motion.button>
            )}
          </div>

          {/* Status & Timing Indicators (Removable via Owner Portal) */}
          <div className="flex flex-col items-center gap-1.5 pt-1 text-xs w-full px-2">
            {/* Sandwiches Count Pill */}
            {showHeroSandwichCount && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/45 backdrop-blur-md border border-white/10 text-[11px] sm:text-xs text-white/95 shadow-sm max-w-[95vw] text-center">
                <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0 animate-pulse" />
                <span>
                  <strong className="text-[#e1ad01] font-bold">{availableCount} of {totalBatch}</strong> sandwiches left today
                </span>
              </div>
            )}

            {/* Operating Hours & Location */}
            {showHeroOperatingInfo && (
              <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-[11px] text-[#FBF9F2]/90 drop-shadow-sm pt-0.5 text-center">
                <span className="flex items-center gap-1">
                  <Clock className="w-3 h-3 text-[#e1ad01] shrink-0" />
                  <span>{websiteConfig?.weekdayHours || "1:00 PM – 11:00 PM"} (Mon Closed)</span>
                </span>
                <span className="hidden sm:inline text-white/40">•</span>
                <span className="flex items-center gap-1">
                  <MapPin className="w-3 h-3 text-[#e1ad01] shrink-0" />
                  <span>{websiteConfig?.address || "Action Area 1, New Town, Kolkata"}</span>
                </span>
              </div>
            )}
          </div>
        </motion.div>
      </section>

      {/* 2. TODAY'S CAFE HIGHLIGHTS (With Food Item Image & Responsive Mobile Layout) */}
      <motion.section 
        initial={{ opacity: 0, y: 35 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-5xl mx-auto px-4 sm:px-6"
      >
        <div className="relative rounded-3xl bg-gradient-to-r from-[#374C44] via-[#2F423B] to-[#374C44] border-2 border-[#e1ad01]/40 p-4 sm:p-7 md:p-8 shadow-xl overflow-hidden">
          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5 sm:gap-6 relative z-10">
            {/* Featured Item Image */}
            <div className="relative w-full md:w-56 lg:w-64 h-48 sm:h-52 md:h-44 rounded-2xl overflow-hidden shrink-0 bg-[#25372E] border border-[#e1ad01]/30 shadow-md group">
              <img
                src={highlightImageUrl}
                alt={cafeHighlight?.title || matchedHighlightItem?.name || "Featured Sandwich"}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <span className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold shadow-md ${
                matchedHighlightItem?.isVeg !== false ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
              }`}>
                {matchedHighlightItem?.isVeg !== false ? "Veg" : "Non-Veg"}
              </span>
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
              <span className="absolute bottom-2 left-2 text-[10px] font-bold text-[#e1ad01] bg-black/60 backdrop-blur-xs px-2 py-0.5 rounded-md border border-[#e1ad01]/30">
                Fresh Daily
              </span>
            </div>

            {/* Description & Details */}
            <div className="flex-1 space-y-2 text-left">
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#D96B43] text-white text-xs font-bold uppercase tracking-wider flex items-center gap-1 shadow-sm">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>{cafeHighlight?.badge || "Today's Chef Feature"}</span>
                </span>
                <span className="px-2.5 py-0.5 rounded-full bg-[#24332D] text-[#e1ad01] text-[10px] font-bold border border-[#e1ad01]/30">
                  Featured Taste
                </span>
              </div>

              <h3 className="font-niea text-xl sm:text-2xl md:text-3xl font-bold text-[#F5E086] leading-snug">
                {cafeHighlight?.title || matchedHighlightItem?.name || "Autumn Truffle & Wild Mushroom Melt"}
              </h3>

              <p className="text-xs sm:text-sm text-[#FBF9F2]/85 max-w-xl leading-relaxed">
                {cafeHighlight?.description ||
                  matchedHighlightItem?.description ||
                  "Slow-sautéed portobello and shiitake mushrooms, white truffle cream, aged Gruyère & sharp Emmental on thick-cut house sourdough."}
              </p>
            </div>

            {/* Pricing & Order CTA */}
            <div className="flex items-center justify-between md:flex-col md:items-end gap-3 shrink-0 pt-2 md:pt-0 border-t md:border-t-0 border-white/10">
              <div className="text-left md:text-right">
                <span className="text-[10px] text-white/60 block uppercase font-bold tracking-wider">Portion Price</span>
                <span className="text-2xl sm:text-3xl font-black text-white font-niea">
                  ₹{cafeHighlight?.price || matchedHighlightItem?.price || 380}
                </span>
              </div>
              <button
                onClick={() => {
                  if (matchedHighlightItem) onAddToCart(matchedHighlightItem);
                  else onSelectTab("menu");
                }}
                className="px-6 py-2.5 sm:py-3 rounded-full bg-[#e1ad01] hover:bg-[#cca000] text-[#1E2B25] font-black text-xs sm:text-sm transition shadow-[0_0_20px_rgba(225,173,1,0.5)] flex items-center gap-2 cursor-pointer active:scale-95 border border-[#ffd233]"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Order Highlight</span>
              </button>
            </div>
          </div>
        </div>
      </motion.section>

      {/* 3. LIVE QUEUE & COUNTER TOKENS TV DISPLAY (Customer-facing with scroll reveal) */}
      <motion.section 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        id="live-queue-tv-section"
        className="max-w-5xl mx-auto px-4 sm:px-6 scroll-mt-24"
      >
        <div className="rounded-3xl bg-[#24332D] border border-white/10 p-5 sm:p-6 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-400 border border-emerald-400/30 flex items-center justify-center font-black">
                <Tv className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <h4 className="font-niea font-bold text-base text-white flex items-center gap-2">
                  <span>Live Kitchen Queue & Counter TV</span>
                  <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                </h4>
                <p className="text-xs text-white/60">
                  Real-time token status for dine-in & takeaway orders at NiEA's Sandwich Bar
                </p>
              </div>
            </div>

            {onOpenLiveCallingBoard && (
              <button
                type="button"
                onClick={() => onOpenLiveCallingBoard()}
                className="px-4 py-2 rounded-xl bg-[#F5E086] hover:bg-[#fae89f] text-[#24332D] text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto shadow-sm cursor-pointer"
              >
                <Tv className="w-3.5 h-3.5" />
                <span>Open Fullscreen TV Board</span>
              </button>
            )}
          </div>

          {/* Tokens Split Display: READY vs PREPARING */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Ready to Collect */}
            <div className="p-4 rounded-2xl bg-[#1E2B25] border border-emerald-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-emerald-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                  <span>Now Ready / Calling At Counter</span>
                </span>
                <span className="px-2 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 font-bold text-[10px]">
                  {readyOrders.length} Ready
                </span>
              </div>

              {readyOrders.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {readyOrders.map((ord) => (
                    <span
                      key={ord.id}
                      className="px-3 py-1.5 rounded-xl bg-emerald-500/25 border-2 border-emerald-400 text-emerald-200 font-niea font-bold text-sm tracking-wider shadow-sm animate-pulse"
                    >
                      {formatTokenNumber(ord.tokenNumber)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-white/40 italic py-2">All ready orders have been collected. Next tokens calling shortly!</p>
              )}
            </div>

            {/* In Preparation */}
            <div className="p-4 rounded-2xl bg-[#1E2B25] border border-amber-500/30 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-bold text-amber-300 uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-400" />
                  <span>Toasting & Preparing in Kitchen</span>
                </span>
                <span className="px-2 py-0.2 rounded-full bg-amber-500/20 text-amber-300 font-bold text-[10px]">
                  {preparingOrders.length} In Queue
                </span>
              </div>

              {preparingOrders.length > 0 ? (
                <div className="flex flex-wrap gap-2 pt-1">
                  {preparingOrders.map((ord) => (
                    <span
                      key={ord.id}
                      className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-200 font-niea font-bold text-sm tracking-wider shadow-sm"
                    >
                      {formatTokenNumber(ord.tokenNumber)}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-white/40 italic py-2">Kitchen is ready to toast your order immediately!</p>
              )}
            </div>
          </div>
        </div>
      </motion.section>

      {/* 4. FEATURED BESTSELLER MELTS (Food view with staggered scroll reveal) */}
      <motion.section 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-5xl mx-auto px-4 sm:px-6"
      >
        <div className="flex items-end justify-between mb-6">
          <div>
            <span className="text-xs uppercase font-extrabold tracking-widest text-[#F5E086]">
              Toasted On French Butter
            </span>
            <h2 className="font-niea font-bold text-2xl sm:text-3xl text-white mt-1">
              Fresh From The Toasting Press
            </h2>
          </div>
          <button
            onClick={() => onSelectTab("menu")}
            className="text-xs font-bold text-[#F5E086] hover:underline flex items-center gap-1 cursor-pointer"
          >
            <span>View All Menu Items</span>
            <span>→</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredItems.slice(0, 3).map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.55, delay: idx * 0.12, ease: [0.16, 1, 0.3, 1] }}
              whileHover={{ y: -4 }}
              className="rounded-3xl bg-[#374C44]/90 border border-[#F5E086]/20 p-5 flex flex-col justify-between hover:border-[#F5E086]/50 transition-all duration-300 shadow-md group"
            >
              <div>
                <div className="relative aspect-[16/10] rounded-2xl overflow-hidden mb-4 bg-[#283832]">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    loading="lazy"
                    decoding="async"
                    referrerPolicy="no-referrer"
                    className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                  />
                  <span className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    item.isVeg ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                  }`}>
                    {item.isVeg ? "Veg" : "Non-Veg"}
                  </span>
                </div>

                <div className="flex items-start justify-between gap-2">
                  <h4 className="font-niea font-bold text-base text-[#F5E086]">
                    {item.name}
                  </h4>
                  <span className="text-sm font-bold text-white shrink-0">
                    ₹{item.price}
                  </span>
                </div>
                <p className="text-xs text-[#FBF9F2]/75 mt-1.5 line-clamp-2 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
                <span className="text-[11px] font-medium">
                  {item.stockLeft <= 0 ? (
                    <span className="text-rose-400 font-bold">Sold Out</span>
                  ) : item.stockLeft <= 5 ? (
                    <span className="text-amber-300 font-bold">Only {item.stockLeft} left!</span>
                  ) : (
                    <span className="text-[#F5E086]/80">{item.stockLeft} portions left today</span>
                  )}
                </span>
                {cartItemCounts[item.id] > 0 ? (
                  <div className="flex items-center rounded-full bg-[#FBF9F2] text-[#24332D] shadow-sm border border-[#F5E086] overflow-hidden p-0.5">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onDecrementFromCart?.(item);
                      }}
                      className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-black/10 active:scale-90 transition text-sm font-black cursor-pointer text-[#24332D]"
                      title="Reduce quantity by 1"
                      aria-label="Decrease quantity"
                    >
                      <Minus className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                    <span className="px-2 font-niea font-bold text-xs min-w-[20px] text-center select-none text-[#24332D]">
                      {cartItemCounts[item.id]}
                    </span>
                    <button
                      type="button"
                      disabled={item.stockLeft <= 0 || cartItemCounts[item.id] >= item.stockLeft}
                      onClick={(e) => {
                        e.stopPropagation();
                        onAddToCart(item);
                      }}
                      className="w-7 h-7 rounded-full bg-[#F5E086] hover:bg-[#F8E79B] flex items-center justify-center active:scale-90 transition text-sm font-black cursor-pointer text-[#24332D] disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Add 1 more"
                      aria-label="Increase quantity"
                    >
                      <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
                    </button>
                  </div>
                ) : (
                  <button
                    disabled={item.stockLeft <= 0}
                    onClick={() => onAddToCart(item)}
                    className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer ${
                      item.stockLeft <= 0
                        ? "bg-white/10 text-white/40 cursor-not-allowed"
                        : "bg-[#F5E086] hover:bg-[#F8E79B] text-[#24332D] active:scale-95"
                    }`}
                  >
                    <span>{item.stockLeft <= 0 ? "Sold Out" : "Add to Order"}</span>
                    {item.stockLeft > 0 && <Plus className="w-3 h-3 stroke-[2.5]" />}
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </motion.section>

      {/* 5. Direct Action Banner for Reservation / Dine-In (Smooth scroll entrance) */}
      <motion.section 
        initial={{ opacity: 0, y: 40 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-60px" }}
        transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        className="max-w-5xl mx-auto px-4 sm:px-6"
      >
        <div className="rounded-3xl bg-[#2B3D36] border border-[#F5E086]/25 p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
          <div className="space-y-1.5 text-center md:text-left">
            <h4 className="font-niea font-bold text-xl sm:text-2xl text-[#F5E086]">
              Planning to drop by New Town?
            </h4>
            <p className="text-xs sm:text-sm text-[#FBF9F2]/80">
              Visit our cozy 2-table artisan sandwich bar in Action Area 1. Dine-in seats or order fresh takeaway.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 shrink-0">
            {isReservationEnabled ? (
              <>
                <button
                  onClick={() => onSelectTab("reservation")}
                  className="px-6 py-3 rounded-full bg-[#F5E086] hover:bg-[#F8E79B] text-[#24332D] font-bold text-xs sm:text-sm transition shadow-md cursor-pointer active:scale-95"
                >
                  Book Table Now
                </button>
                <button
                  onClick={() => onSelectTab("menu")}
                  className="px-5 py-3 rounded-full bg-[#374C44] border border-[#F5E086]/30 text-white font-bold text-xs sm:text-sm hover:bg-[#3E564D] transition cursor-pointer"
                >
                  Order Takeaway
                </button>
              </>
            ) : (
              <button
                onClick={() => onSelectTab("menu")}
                className="px-8 py-3.5 rounded-full bg-[#F5E086] hover:bg-[#F8E79B] text-[#24332D] font-bold text-xs sm:text-sm transition shadow-md cursor-pointer active:scale-95 flex items-center gap-2"
              >
                <UtensilsCrossed className="w-4 h-4 text-[#24332D]" />
                <span>Explore Menu & Order Takeaway</span>
                <ArrowRight className="w-4 h-4 text-[#24332D]" />
              </button>
            )}
          </div>
        </div>
      </motion.section>

      {/* Persistent Floating Order Now Button (Keeps Order Now accessible & visible throughout scroll) */}
      <AnimatePresence>
        {isScrolledPastHero && (
          <motion.div
            initial={{ opacity: 0, y: 25, scale: 0.92 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 25, scale: 0.92 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 flex items-center shadow-[0_10px_35px_rgba(0,0,0,0.5)]"
          >
            <button
              type="button"
              onClick={() => onSelectTab("menu")}
              style={{
                fontSize: customOrderFontSize
                  ? `${Math.max(13, customOrderFontSize)}px`
                  : undefined,
              }}
              className="px-8 sm:px-10 py-3 rounded-full bg-[#e1ad01] hover:bg-[#cca000] text-[#1E2B25] font-black text-sm sm:text-base transition-all duration-200 shadow-[0_0_28px_rgba(225,173,1,0.7)] hover:shadow-[0_0_40px_rgba(225,173,1,0.95)] border-2 border-[#ffd233] cursor-pointer tracking-wide active:scale-95 flex items-center justify-center whitespace-nowrap"
            >
              Order Now
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Smooth Scroll-to-Top Button */}
      <AnimatePresence>
        {showScrollTop && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8, y: 16 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 16 }}
            transition={{ duration: 0.25 }}
            onClick={scrollToTop}
            aria-label="Scroll to top"
            className="fixed bottom-6 right-6 z-30 w-11 h-11 rounded-full bg-[#e1ad01] text-[#1E2B25] shadow-xl hover:bg-[#cca000] hover:scale-108 active:scale-95 transition-transform flex items-center justify-center cursor-pointer border border-[#1E2B25]/20 ring-4 ring-[#e1ad01]/25"
          >
            <ChevronUp className="w-5 h-5 stroke-[2.5]" />
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
};
