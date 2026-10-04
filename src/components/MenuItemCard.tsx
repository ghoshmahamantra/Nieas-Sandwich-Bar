import React, { useState } from "react";
import { Sparkles, Clock, Flame, Plus, Check, AlertCircle } from "lucide-react";
import { MenuItem, CustomizationOption } from "../types/niea";

interface MenuItemCardProps {
  item: MenuItem;
  cartQuantity: number;
  onAddToCart: (
    item: MenuItem,
    selectedBread?: string,
    customizations?: CustomizationOption[]
  ) => void;
  onOpenDetails: (item: MenuItem) => void;
}

export const MenuItemCard: React.FC<MenuItemCardProps> = ({
  item,
  cartQuantity,
  onAddToCart,
  onOpenDetails,
}) => {
  const isOutOfStock = item.stockLeft <= 0;
  const isLowStock = item.stockLeft > 0 && item.stockLeft <= 6;

  return (
    <div className="sage-card sage-card-hover rounded-3xl p-4 flex flex-col justify-between border border-[#F5E086]/15 hover:border-[#F5E086]/35 transition-all group relative overflow-hidden">
      {/* Top Media & Tags */}
      <div>
        <div
          onClick={() => onOpenDetails(item)}
          className="relative aspect-[16/10] rounded-2xl overflow-hidden mb-3 bg-[#24332D] cursor-pointer"
        >
          <img
            src={item.imageUrl}
            alt={item.name}
            loading="lazy"
            className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/20" />

          {/* Badges on Image */}
          <div className="absolute top-2.5 left-2.5 flex flex-wrap gap-1.5 z-10">
            {item.isSeasonal && (
              <span className="px-2.5 py-1 rounded-full bg-[#D96B43] text-white text-[10px] font-black uppercase tracking-wider flex items-center gap-1 shadow-md">
                <Sparkles className="w-3 h-3" />
                Seasonal
              </span>
            )}
            {item.isBestseller && (
              <span className="px-2.5 py-1 rounded-full bg-[#F5E086] text-[#24332D] text-[10px] font-black uppercase tracking-wider shadow-md">
                Fan Favorite
              </span>
            )}
          </div>

          {/* Dietary Indicator */}
          <div className="absolute top-2.5 right-2.5 z-10">
            <span
              className={`inline-flex items-center justify-center w-5 h-5 rounded-md border ${
                item.isVeg
                  ? "border-emerald-400 bg-white/90 text-emerald-700"
                  : "border-rose-400 bg-white/90 text-rose-700"
              }`}
              title={item.isVeg ? "Vegetarian" : "Non-Vegetarian"}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  item.isVeg ? "bg-emerald-600" : "bg-rose-600"
                }`}
              />
            </span>
          </div>

          {/* Live Stock Pill Overlay */}
          <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between text-[11px] z-10">
            {isOutOfStock ? (
              <span className="px-2.5 py-1 rounded-full bg-rose-900/90 text-rose-200 border border-rose-500/30 font-bold backdrop-blur-xs">
                Sold Out in Current Batch
              </span>
            ) : isLowStock ? (
              <span className="px-2.5 py-1 rounded-full bg-amber-900/90 text-amber-200 border border-amber-400/40 font-bold flex items-center gap-1 backdrop-blur-xs animate-pulse">
                <Flame className="w-3 h-3 text-amber-400" />
                Only {item.stockLeft} left!
              </span>
            ) : (
              <span className="px-2.5 py-0.5 rounded-full bg-black/60 text-emerald-300 font-semibold backdrop-blur-xs text-[10px]">
                In Stock ({item.stockLeft} available)
              </span>
            )}
          </div>
        </div>

        {/* Item Title & Details */}
        <div onClick={() => onOpenDetails(item)} className="cursor-pointer">
          <div className="flex items-baseline justify-between gap-2">
            <h3 className="font-niea font-bold text-base text-[#FBF9F2] group-hover:text-[#F5E086] transition-colors leading-snug">
              {item.name}
            </h3>
          </div>

          {item.subtitle && (
            <p className="text-[11px] font-bold text-[#F5E086]/80 uppercase tracking-wider mt-0.5">
              {item.subtitle}
            </p>
          )}

          <p className="text-xs text-[#FBF9F2]/75 line-clamp-2 mt-1.5 leading-relaxed">
            {item.description}
          </p>
        </div>
      </div>

      {/* Restock Schedule & Price / Add Row */}
      <div className="mt-4 pt-3 border-t border-[#F5E086]/10 space-y-2.5">
        {/* Specific Fresh Stock Arrival Schedule */}
        <div className="flex items-center gap-1.5 text-[11px] text-[#F5E086] bg-[#24332D]/70 px-2.5 py-1.5 rounded-xl border border-[#F5E086]/15">
          <Clock className="w-3.5 h-3.5 text-[#F5E086] shrink-0" />
          <span className="truncate font-medium">{item.restockSchedule}</span>
        </div>

        {/* Price & Action Button */}
        <div className="flex items-center justify-between pt-1">
          <div>
            <span className="text-[10px] text-[#FBF9F2]/60 uppercase tracking-wider block">
              Price
            </span>
            <span className="font-niea font-black text-xl text-[#F5E086]">
              ₹{item.price}
            </span>
          </div>

          {isOutOfStock ? (
            <button
              disabled
              className="px-4 py-2 rounded-full bg-white/10 text-[#FBF9F2]/40 text-xs font-bold cursor-not-allowed"
            >
              Batch Sold Out
            </button>
          ) : (
            <button
              onClick={() => onAddToCart(item)}
              className="px-4 py-2 rounded-full bg-[#F5E086] hover:bg-[#F8E79B] text-[#24332D] font-bold text-xs flex items-center gap-1.5 transition-all shadow-md active:scale-95"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{cartQuantity > 0 ? `Add (${cartQuantity})` : "Add to Order"}</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
