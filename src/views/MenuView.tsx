import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Search,
  LayoutGrid,
  List,
  Grid2X2,
  Sparkles,
  Plus,
  Minus,
  Clock,
  SlidersHorizontal,
  Flame,
  Check,
  Coffee,
  Utensils,
} from "lucide-react";
import { MenuItem, MenuCategory, CustomizationOption, PreBookingConfig } from "../types/niea";
import { checkPreBookingWindow } from "../utils/preBookingHelper";

type ViewMode = "tile" | "list" | "compact";

interface MenuViewProps {
  items: MenuItem[];
  cartItemCounts: Record<string, number>;
  onAddToCart: (item: MenuItem) => void;
  onDecrementFromCart?: (item: MenuItem) => void;
  onOpenItemDetails: (item: MenuItem) => void;
  preBookingConfig?: PreBookingConfig;
}

export const MenuView: React.FC<MenuViewProps> = ({
  items,
  cartItemCounts,
  onAddToCart,
  onDecrementFromCart,
  onOpenItemDetails,
  preBookingConfig,
}) => {
  const [activeCategory, setActiveCategory] = useState<string>("all");
  const [dietFilter, setDietFilter] = useState<"all" | "veg" | "non-veg">("all");
  const [viewMode, setViewMode] = useState<ViewMode>("tile");
  const [searchQuery, setSearchQuery] = useState("");

  const preBookingStatus = checkPreBookingWindow(preBookingConfig);

  const categories = [
    { id: "all", label: "All Items" },
    { id: "burgers", label: "OG NiEa's Burgers" },
    { id: "hot-picks", label: "NiEa's Hot Picks" },
    { id: "green-room", label: "The Green Room" },
    { id: "sides", label: "Sides" },
    { id: "drinkables", label: "Drinkables" },
  ];

  // Filter items
  const filteredItems = items.filter((item) => {
    // Category filter
    if (activeCategory !== "all") {
      if (item.category !== activeCategory) return false;
    }
    // Dietary filter
    if (dietFilter === "veg" && !item.isVeg) return false;
    if (dietFilter === "non-veg" && item.isVeg) return false;
    // Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchName = item.name.toLowerCase().includes(q);
      const matchDesc = item.description.toLowerCase().includes(q);
      const matchTag = item.tags.some((t) => t.toLowerCase().includes(q));
      return matchName || matchDesc || matchTag;
    }
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-3 sm:pt-4 pb-32 sm:pb-40 space-y-4 sm:space-y-5">
      {/* 1. When prebooking is open: sleek small oneliner with time so menu starts directly */}
      {preBookingStatus.isOpen ? (
        <div className="flex flex-wrap items-center justify-between gap-2 text-xs px-3.5 sm:px-4 py-1.5 rounded-full bg-[#24372F]/70 border border-emerald-400/30 text-emerald-200 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shrink-0" />
            <span className="font-semibold text-white/90 text-xs">
              Pre-Booking Open ({preBookingStatus.displayWindowText})
            </span>
          </div>
          <div className="text-[11px] font-mono text-[#F5E086] flex items-center gap-1.5 ml-auto sm:ml-0">
            <Clock className="w-3 h-3 text-[#F5E086]" />
            <span>Kolkata: {preBookingStatus.currentTimeFormatted}</span>
          </div>
        </div>
      ) : (
        /* When CLOSED: keep the full closed warning */
        <motion.div 
          initial={{ opacity: 0, y: 28 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative rounded-3xl bg-gradient-to-br from-[#241A15] via-[#2F211A] to-[#1E2B25] border-2 border-amber-400/80 p-8 sm:p-12 text-center shadow-2xl overflow-hidden space-y-5 animate-in fade-in zoom-in-95 duration-300"
        >
          {/* Background warm amber glow */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[520px] h-[220px] bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/20 border border-amber-400/60 text-amber-300 text-xs sm:text-sm font-black tracking-widest uppercase shadow-md animate-pulse">
              <Clock className="w-4 h-4 text-amber-400" />
              <span>PRE-ORDERS ARE CLOSED NOW</span>
            </div>

            <h2 className="font-niea font-black text-3xl sm:text-5xl text-white tracking-wide leading-tight">
              WILL OPEN FROM{" "}
              <span className="text-[#F5E086] underline decoration-amber-400 decoration-wavy underline-offset-8">
                {preBookingStatus.nextOpenText}
              </span>
            </h2>

            <p className="text-sm sm:text-base text-amber-100/90 max-w-2xl mx-auto leading-relaxed pt-1">
              {preBookingConfig?.message || preBookingStatus.closedReason}
            </p>

            <div className="pt-3 flex flex-wrap items-center justify-center gap-3 text-xs">
              <div className="px-4 py-2 rounded-xl bg-black/50 border border-amber-400/30 text-amber-200">
                🕒 Scheduled Operating Hours: <strong className="text-[#F5E086] font-bold">{preBookingStatus.displayWindowText}</strong>
              </div>
              <div className="px-4 py-2 rounded-xl bg-black/50 border border-emerald-400/30 text-emerald-200">
                📍 Kolkata Current Time: <strong className="text-white font-mono">{preBookingStatus.currentTimeFormatted}</strong>
              </div>
            </div>

            <p className="text-[11px] text-white/50 pt-2 italic">
              Menu items below are currently locked for online orders. Browsing is available.
            </p>
          </div>
        </motion.div>
      )}

      {/* 2. MENU CONTENT (BLURRED AND DISABLED WHEN PRE-ORDERS ARE CLOSED) */}
      <div className={`transition-all duration-300 space-y-6 ${
        !preBookingStatus.isOpen ? "filter blur-[5px] opacity-40 select-none pointer-events-none" : ""
      }`}>

      {/* Top Header & Search Bar with entrance animation */}
      <motion.div 
        initial={{ opacity: 0, y: 25 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-40px" }}
        transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6"
      >
        <div>
          <span className="text-xs uppercase font-extrabold tracking-widest text-[#F5E086]">
            Artisan Kitchen & Bar
          </span>
          <h1 className="font-niea font-bold text-3xl sm:text-4xl text-white mt-0.5">
            Our Menu
          </h1>
          <p className="text-xs text-[#FBF9F2]/75 mt-1">
            Every sandwich is toasted on cast iron with pure French butter. Live stock updated per bake.
          </p>
        </div>

        {/* Controls: Search, Diet Filter & View Options */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Input */}
          <div className="relative min-w-[200px] sm:min-w-[240px]">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-white/50" />
            <input
              type="text"
              placeholder="Search sandwiches, drinks, bread..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9.5 pr-4 py-2 rounded-full bg-[#374C44] border border-[#F5E086]/20 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#F5E086] transition"
            />
          </div>

          {/* View Options: Tile, List, Compact */}
          <div className="flex items-center p-1 rounded-full bg-[#374C44] border border-[#F5E086]/20 shadow-xs">
            <button
              onClick={() => setViewMode("tile")}
              className={`p-1.5 rounded-full transition ${
                viewMode === "tile"
                  ? "bg-[#F5E086] text-[#24332D]"
                  : "text-white/70 hover:text-white"
              }`}
              title="Tile Grid View"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`p-1.5 rounded-full transition ${
                viewMode === "list"
                  ? "bg-[#F5E086] text-[#24332D]"
                  : "text-white/70 hover:text-white"
              }`}
              title="Compact Restaurant List View"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => setViewMode("compact")}
              className={`p-1.5 rounded-full transition ${
                viewMode === "compact"
                  ? "bg-[#F5E086] text-[#24332D]"
                  : "text-white/70 hover:text-white"
              }`}
              title="Icon Tile View"
            >
              <Grid2X2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </motion.div>

      {/* Categories & Dietary Switcher Row with entrance animation */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true, margin: "-30px" }}
        transition={{ duration: 0.55, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
        className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4"
      >
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 w-full lg:w-auto no-scrollbar">
          {categories.map((cat) => {
            const count =
              cat.id === "all"
                ? items.length
                : items.filter((i) => i.category === cat.id).length;

            const isActive = activeCategory === cat.id;

            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all flex items-center gap-1.5 ${
                  isActive
                    ? "bg-[#F5E086] text-[#24332D] shadow-md scale-102"
                    : "bg-[#374C44] text-[#FBF9F2]/80 border border-[#F5E086]/20 hover:border-[#F5E086]/50"
                }`}
              >
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-black ${
                    isActive ? "bg-[#24332D] text-[#F5E086]" : "bg-white/10 text-white/60"
                  }`}
                >
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* Dietary Filters */}
        <div className="flex items-center p-1 rounded-full bg-[#374C44] border border-[#F5E086]/20 text-xs shrink-0 self-start lg:self-auto">
          <button
            onClick={() => setDietFilter("all")}
            className={`px-3 py-1.5 rounded-full font-bold transition ${
              dietFilter === "all"
                ? "bg-[#F5E086] text-[#24332D]"
                : "text-white/75 hover:text-white"
            }`}
          >
            All Diets
          </button>
          <button
            onClick={() => setDietFilter("veg")}
            className={`px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 transition ${
              dietFilter === "veg"
                ? "bg-emerald-500 text-white"
                : "text-emerald-300 hover:text-emerald-100"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-emerald-400" />
            <span>Veg Only</span>
          </button>
          <button
            onClick={() => setDietFilter("non-veg")}
            className={`px-3 py-1.5 rounded-full font-bold flex items-center gap-1.5 transition ${
              dietFilter === "non-veg"
                ? "bg-rose-600 text-white"
                : "text-rose-300 hover:text-rose-100"
            }`}
          >
            <span className="w-2 h-2 rounded-full bg-rose-400" />
            <span>Non-Veg</span>
          </button>
        </div>
      </motion.div>

      {/* No Results state */}
      {filteredItems.length === 0 && (
        <div className="text-center py-16 bg-[#374C44]/40 rounded-3xl border border-[#F5E086]/10 flex flex-col items-center justify-center">
          <Utensils className="w-10 h-10 text-[#F5E086]/50 mb-1" />
          <h3 className="font-niea font-bold text-xl text-[#F5E086] mt-3">
            No sandwiches or drinks match your filter
          </h3>
          <p className="text-xs text-[#FBF9F2]/70 mt-1 max-w-sm mx-auto">
            Try resetting your dietary toggle or clearing the search query.
          </p>
          <button
            onClick={() => {
              setActiveCategory("all");
              setDietFilter("all");
              setSearchQuery("");
            }}
            className="mt-4 px-4 py-2 rounded-full bg-[#F5E086] text-[#24332D] font-bold text-xs"
          >
            Reset Filters
          </button>
        </div>
      )}

      {/* 1. VIEW MODE: TILE GRID */}
      {viewMode === "tile" && filteredItems.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item, idx) => {
            const inCart = cartItemCounts[item.id] || 0;
            const isSoldOut = item.stockLeft <= 0;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.5, delay: (idx % 6) * 0.06, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -4 }}
                className="rounded-3xl bg-[#374C44]/80 border border-[#F5E086]/20 p-5 flex flex-col justify-between hover:border-[#F5E086]/50 transition-colors shadow-md group"
              >
                <div>
                  <div className="relative aspect-[16/10] rounded-2xl overflow-hidden mb-4 bg-[#263730]">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-103 transition-transform duration-300"
                    />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      {item.isSeasonal && (
                        <span className="px-2 py-0.5 rounded-full bg-[#D96B43] text-white text-[10px] font-bold uppercase tracking-wider">
                          Seasonal
                        </span>
                      )}
                      {item.isBestseller && (
                        <span className="px-2 py-0.5 rounded-full bg-[#F5E086] text-[#24332D] text-[10px] font-extrabold uppercase tracking-wider">
                          Bestseller
                        </span>
                      )}
                    </div>
                    <span
                      className={`absolute top-2.5 right-2.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        item.isVeg ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                      }`}
                    >
                      {item.isVeg ? "Veg" : "Non-Veg"}
                    </span>
                  </div>

                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-niea font-bold text-lg text-[#F5E086] leading-snug">
                      {item.name}
                    </h3>
                    <span className="text-base font-bold text-white shrink-0">
                      ₹{item.price}
                    </span>
                  </div>

                  <p className="text-xs text-[#FBF9F2]/75 mt-2 line-clamp-2 leading-relaxed">
                    {item.description}
                  </p>

                  {item.breadChoices && item.breadChoices.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-1">
                      {item.breadChoices.slice(0, 3).map((bread) => (
                        <span
                          key={bread}
                          className="px-2 py-0.5 rounded-md bg-[#2B3D36] text-[#F5E086] text-[10px] border border-[#F5E086]/15 font-medium"
                        >
                          {bread}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="mt-5 pt-3 border-t border-white/10 flex items-center justify-between">
                  <div className="text-[11px]">
                    {isSoldOut ? (
                      <span className="text-rose-400 font-bold">Sold Out</span>
                    ) : item.stockLeft <= 5 ? (
                      <span className="text-amber-300 font-bold">Only {item.stockLeft} left!</span>
                    ) : (
                      <span className="text-[#FBF9F2]/60">{item.stockLeft} in stock</span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {((item.breadChoices && item.breadChoices.length > 0) ||
                      (item.customizations && item.customizations.length > 0)) && (
                      <button
                        onClick={() => onOpenItemDetails(item)}
                        className="px-2.5 py-1.5 rounded-full bg-[#2B3D36] hover:bg-[#32473F] text-[#F5E086] text-xs font-semibold border border-[#F5E086]/20 transition cursor-pointer"
                      >
                        Customize
                      </button>
                    )}

                    {inCart > 0 ? (
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
                          {inCart}
                        </span>
                        <button
                          type="button"
                          disabled={isSoldOut || inCart >= item.stockLeft}
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
                        disabled={isSoldOut}
                        onClick={() => onAddToCart(item)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1 shadow-xs cursor-pointer ${
                          isSoldOut
                            ? "bg-white/10 text-white/40 cursor-not-allowed"
                            : "bg-[#F5E086] hover:bg-[#F8E79B] text-[#24332D]"
                        }`}
                      >
                        <span>Add</span>
                        <Plus className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* 2. VIEW MODE: COMPACT RESTAURANT LIST */}
      {viewMode === "list" && filteredItems.length > 0 && (
        <div className="bg-[#374C44]/60 rounded-3xl border border-[#F5E086]/20 divide-y divide-white/10 overflow-hidden shadow-lg">
          {filteredItems.map((item, idx) => {
            const inCart = cartItemCounts[item.id] || 0;
            const isSoldOut = item.stockLeft <= 0;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.45, delay: (idx % 8) * 0.04, ease: [0.16, 1, 0.3, 1] }}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-[#374C44] transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-[#24332D] shrink-0 border border-[#F5E086]/20">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full shrink-0 ${
                          item.isVeg ? "bg-emerald-400" : "bg-rose-500"
                        }`}
                        title={item.isVeg ? "Vegetarian" : "Non-Vegetarian"}
                      />
                      <h4 className="font-niea font-bold text-base text-[#F5E086]">
                        {item.name}
                      </h4>
                      {item.isSeasonal && (
                        <span className="px-2 py-0.2 rounded-full bg-[#D96B43] text-white text-[9px] font-bold">
                          Seasonal
                        </span>
                      )}
                    </div>

                    <p className="text-xs text-[#FBF9F2]/70 mt-1 max-w-xl leading-relaxed">
                      {item.description}
                    </p>

                    <div className="flex items-center gap-3 mt-1.5 text-[11px] text-[#F5E086]/80">
                      <span>{item.restockSchedule}</span>
                      <span>•</span>
                      <span>{item.stockLeft} portions left</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pt-2 sm:pt-0 border-t sm:border-0 border-white/5">
                  <span className="text-base font-black text-white">₹{item.price}</span>

                  <div className="flex items-center gap-2">
                    {((item.breadChoices && item.breadChoices.length > 0) ||
                      (item.customizations && item.customizations.length > 0)) && (
                      <button
                        onClick={() => onOpenItemDetails(item)}
                        className="px-2.5 py-1.5 rounded-full bg-[#2B3D36] text-[#F5E086] text-xs font-semibold border border-[#F5E086]/20 hover:bg-[#32473F] transition cursor-pointer"
                      >
                        Customize
                      </button>
                    )}

                    {inCart > 0 ? (
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
                          {inCart}
                        </span>
                        <button
                          type="button"
                          disabled={isSoldOut || inCart >= item.stockLeft}
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
                        disabled={isSoldOut}
                        onClick={() => onAddToCart(item)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
                          isSoldOut
                            ? "bg-white/10 text-white/40 cursor-not-allowed"
                            : "bg-[#F5E086] hover:bg-[#F8E79B] text-[#24332D]"
                        }`}
                      >
                        <span>Add</span>
                        <Plus className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* 3. VIEW MODE: ICON / COMPACT TILE */}
      {viewMode === "compact" && filteredItems.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {filteredItems.map((item, idx) => {
            const inCart = cartItemCounts[item.id] || 0;
            const isSoldOut = item.stockLeft <= 0;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, scale: 0.94, y: 18 }}
                whileInView={{ opacity: 1, scale: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.42, delay: (idx % 8) * 0.035, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -3 }}
                className="rounded-2xl bg-[#374C44] border border-[#F5E086]/20 p-3.5 flex flex-col justify-between hover:border-[#F5E086]/40 transition shadow-xs group"
              >
                <div>
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-2.5 bg-[#25362E]">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      loading="lazy"
                      decoding="async"
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover group-hover:scale-104 transition-transform duration-200"
                    />
                    <span
                      className={`absolute top-2 right-2 px-1.5 py-0.2 rounded-full text-[9px] font-bold ${
                        item.isVeg ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
                      }`}
                    >
                      {item.isVeg ? "Veg" : "Non-Veg"}
                    </span>
                  </div>

                  <h5 className="font-niea font-bold text-sm text-[#F5E086] truncate">
                    {item.name}
                  </h5>
                  <span className="text-xs font-bold text-white block mt-0.5">
                    ₹{item.price}
                  </span>
                </div>

                <div className="mt-3 pt-2 border-t border-white/10 flex items-center justify-between">
                  <span className="text-[10px] text-white/60">{item.stockLeft} left</span>
                  {inCart > 0 ? (
                    <div className="flex items-center rounded-full bg-[#FBF9F2] text-[#24332D] shadow-xs border border-[#F5E086] overflow-hidden p-0.5">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDecrementFromCart?.(item);
                        }}
                        className="w-5 h-5 rounded-full flex items-center justify-center hover:bg-black/10 active:scale-90 transition text-xs font-black cursor-pointer text-[#24332D]"
                        title="Reduce quantity by 1"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="w-3 h-3 stroke-[2.5]" />
                      </button>
                      <span className="px-1.5 font-niea font-bold text-[11px] min-w-[16px] text-center select-none text-[#24332D]">
                        {inCart}
                      </span>
                      <button
                        type="button"
                        disabled={isSoldOut || inCart >= item.stockLeft}
                        onClick={(e) => {
                          e.stopPropagation();
                          onAddToCart(item);
                        }}
                        className="w-5 h-5 rounded-full bg-[#F5E086] hover:bg-[#F8E79B] flex items-center justify-center active:scale-90 transition text-xs font-black cursor-pointer text-[#24332D] disabled:opacity-40 disabled:cursor-not-allowed"
                        title="Add 1 more"
                        aria-label="Increase quantity"
                      >
                        <Plus className="w-3 h-3 stroke-[2.5]" />
                      </button>
                    </div>
                  ) : (
                    <button
                      disabled={isSoldOut}
                      onClick={() => onAddToCart(item)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-bold transition flex items-center gap-1 cursor-pointer ${
                        isSoldOut
                          ? "bg-white/10 text-white/40 cursor-not-allowed"
                          : "bg-[#F5E086] text-[#24332D] hover:bg-[#F8E79B]"
                      }`}
                    >
                      <span>+ Add</span>
                    </button>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      )}
      </div>
    </div>
  );
};
