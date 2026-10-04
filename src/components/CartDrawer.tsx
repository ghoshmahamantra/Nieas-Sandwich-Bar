import React, { useState } from "react";
import {
  X,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  Sparkles,
  ArrowRight,
  Utensils,
  Tag,
  Check,
} from "lucide-react";
import { CartItem, OrderType, CouponDiscount, StoreFinancialSettings, PreBookingConfig } from "../types/niea";
import { DEFAULT_COUPONS } from "../data/nieaData";
import { checkPreBookingWindow } from "../utils/preBookingHelper";

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  orderType: OrderType;
  selectedTable?: string;
  onUpdateQuantity: (cartItemId: string, delta: number) => void;
  onRemoveItem: (cartItemId: string) => void;
  onProceedToCheckout: () => void;
  appliedDiscount: number;
  discountCode?: string;
  onApplyCoupon: (code: string, discount: number) => void;
  onOpenLoyalty: () => void;
  coupons?: CouponDiscount[];
  financialSettings?: StoreFinancialSettings;
  preBookingConfig?: PreBookingConfig;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({
  isOpen,
  onClose,
  items,
  orderType,
  selectedTable,
  onUpdateQuantity,
  onRemoveItem,
  onProceedToCheckout,
  appliedDiscount,
  discountCode,
  onApplyCoupon,
  onOpenLoyalty,
  coupons,
  financialSettings,
  preBookingConfig,
}) => {
  const [couponInput, setCouponInput] = useState("");
  const [couponError, setCouponError] = useState("");

  const preBookingStatus = checkPreBookingWindow(preBookingConfig);

  if (!isOpen) return null;

  const gstPercent = financialSettings?.gstRatePercent ?? 5;
  const subtotal = items.reduce((acc, i) => acc + i.totalPrice, 0);
  const taxes = Math.round((subtotal * gstPercent) / 100);
  const packagingFee =
    orderType === "takeaway" ? (financialSettings?.packagingChargeTakeaway ?? 0) : 0;
  const grandTotal = Math.max(0, subtotal + taxes + packagingFee - appliedDiscount);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError("");
    const code = couponInput.trim().toUpperCase();
    if (!code) return;

    const availableCoupons = coupons && coupons.length > 0 ? coupons : DEFAULT_COUPONS;
    const found = availableCoupons.find((c) => c.code.toUpperCase() === code && c.isActive);

    if (!found) {
      setCouponError(`Coupon "${code}" not found or expired.`);
      return;
    }

    if (found.minOrderAmount && subtotal < found.minOrderAmount) {
      setCouponError(`Min. order ₹${found.minOrderAmount} required for coupon ${found.code}`);
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
    setCouponInput("");
  };

  return (
    <div data-lenis-prevent className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div className="w-full max-w-md h-full bg-[#374C44] border-l border-[#F5E086]/20 shadow-2xl flex flex-col">
        {/* Top Bar */}
        <div className="p-5 border-b border-[#F5E086]/15 bg-[#2B3D36] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#F5E086] text-[#24332D] flex items-center justify-center font-black">
              <ShoppingBag className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-niea font-bold text-lg text-[#F5E086]">
                Your Artisan Basket
              </h3>
              <p className="text-xs text-[#FBF9F2]/70 flex items-center gap-1.5">
                {orderType === "dine-in" ? (
                  <>
                    <Utensils className="w-3 h-3 text-[#F5E086]" />
                    <span>Dine-in {selectedTable ? `(${selectedTable})` : ""}</span>
                  </>
                ) : (
                  <>
                    <ShoppingBag className="w-3 h-3 text-[#F5E086]" />
                    <span>Takeaway • Ready in 12–15m</span>
                  </>
                )}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#FBF9F2]/70 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Cart Item List */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {items.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <div className="w-16 h-16 rounded-full bg-white/5 mx-auto flex items-center justify-center text-[#F5E086]/60">
                <ShoppingBag className="w-8 h-8" />
              </div>
              <h4 className="font-niea font-bold text-lg text-[#F5E086]">
                Your basket is empty
              </h4>
              <p className="text-xs text-[#FBF9F2]/60 max-w-xs mx-auto">
                Explore our toasted brioche melts, signature sandos, and specialty drinks.
              </p>
            </div>
          ) : (
            items.map((cartItem) => (
              <div
                key={cartItem.cartItemId}
                className="p-3.5 rounded-2xl bg-[#2B3D36] border border-[#F5E086]/15 flex flex-col gap-2"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h4 className="font-bold text-sm text-[#FBF9F2] truncate">
                      {cartItem.item.name}
                    </h4>
                    {cartItem.selectedBread && (
                      <p className="text-[11px] text-[#F5E086]/80 font-medium">
                        Bread: {cartItem.selectedBread}
                      </p>
                    )}
                    {cartItem.selectedCustomizations.length > 0 && (
                      <p className="text-[10px] text-[#FBF9F2]/60">
                        Add-ons:{" "}
                        {cartItem.selectedCustomizations.map((c) => c.name).join(", ")}
                      </p>
                    )}
                    {cartItem.specialInstructions && (
                      <p className="text-[10px] text-amber-200/80 italic">
                        Note: "{cartItem.specialInstructions}"
                      </p>
                    )}
                  </div>

                  <span className="font-niea font-black text-sm text-[#F5E086] shrink-0">
                    ₹{cartItem.totalPrice}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 border-t border-white/5">
                  <span className="text-[11px] text-[#FBF9F2]/60">
                    ₹{cartItem.unitPrice} each
                  </span>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center rounded-lg bg-[#374C44] border border-[#F5E086]/20 p-0.5">
                      <button
                        onClick={() => onUpdateQuantity(cartItem.cartItemId, -1)}
                        className="w-5 h-5 rounded flex items-center justify-center text-white hover:bg-white/10"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-6 text-center text-xs font-bold text-[#F5E086]">
                        {cartItem.quantity}
                      </span>
                      <button
                        onClick={() => onUpdateQuantity(cartItem.cartItemId, 1)}
                        className="w-5 h-5 rounded flex items-center justify-center text-white hover:bg-white/10"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    <button
                      onClick={() => onRemoveItem(cartItem.cartItemId)}
                      className="p-1 text-rose-400/80 hover:text-rose-300 transition"
                      title="Remove item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}

          {/* Coupon Code Section */}
          {items.length > 0 && (
            <div className="pt-2">
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <div className="relative flex-1">
                  <Tag className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                  <input
                    type="text"
                    placeholder="Coupon code (e.g. PAWS10)"
                    value={couponInput}
                    onChange={(e) => setCouponInput(e.target.value)}
                    className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#24332D] border border-white/20 text-xs text-white placeholder-white/40 uppercase font-mono outline-none focus:border-[#F5E086]"
                  />
                </div>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-[#F5E086] hover:bg-[#F8E79B] text-[#24332D] text-xs font-bold transition"
                >
                  Apply
                </button>
              </form>

              {couponError && (
                <p className="text-[10px] text-rose-300 mt-1">{couponError}</p>
              )}

              {appliedDiscount > 0 && (
                <div className="mt-1.5 flex items-center justify-between text-[11px] text-emerald-400 bg-emerald-950/40 p-1.5 rounded-lg border border-emerald-500/20">
                  <span className="flex items-center gap-1 font-bold">
                    <Check className="w-3 h-3" /> Applied {discountCode} (-₹{appliedDiscount})
                  </span>
                  <button
                    onClick={() => onApplyCoupon("", 0)}
                    className="text-xs text-rose-300 underline"
                  >
                    Remove
                  </button>
                </div>
              )}

              <button
                type="button"
                onClick={onOpenLoyalty}
                className="mt-2 text-[11px] text-[#F5E086] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>View My Paws & Perks Club Vouchers →</span>
              </button>
            </div>
          )}
        </div>

        {/* Footer Totals & Checkout Button */}
        {items.length > 0 && (
          <div className="p-4 border-t border-[#F5E086]/20 bg-[#2B3D36] space-y-3">
            <div className="text-xs space-y-1.5">
              <div className="flex justify-between text-[#FBF9F2]/70">
                <span>Subtotal:</span>
                <span>₹{subtotal}</span>
              </div>

              {appliedDiscount > 0 && (
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Loyalty Discount:</span>
                  <span>-₹{appliedDiscount}</span>
                </div>
              )}

              <div className="flex justify-between text-[#FBF9F2]/70">
                <span>GST ({gstPercent}%):</span>
                <span>₹{taxes}</span>
              </div>

              {packagingFee > 0 && (
                <div className="flex justify-between text-[#FBF9F2]/70">
                  <span>Takeaway Packaging Charge:</span>
                  <span>₹{packagingFee}</span>
                </div>
              )}

              <div className="pt-2 border-t border-white/10 flex justify-between text-base font-bold">
                <span className="text-white">Grand Total:</span>
                <span className="font-niea font-black text-[#F5E086] text-lg">
                  ₹{grandTotal}
                </span>
              </div>
            </div>

            {!preBookingStatus.isOpen && (
              <div className="p-2.5 rounded-xl bg-amber-950/70 border border-amber-400/40 text-amber-200 text-xs space-y-1">
                <p className="font-bold text-amber-300">⚠️ Pre-Orders Closed Right Now</p>
                <p className="text-[11px] text-amber-100/80">
                  {preBookingConfig?.message || preBookingStatus.closedReason}
                </p>
                <p className="text-[10px] text-[#F5E086] font-bold">
                  Operating Window: {preBookingStatus.displayWindowText} • Reopens {preBookingStatus.nextOpenText}
                </p>
              </div>
            )}

            <button
              disabled={!preBookingStatus.isOpen}
              onClick={() => {
                if (!preBookingStatus.isOpen) return;
                onClose();
                onProceedToCheckout();
              }}
              className={`w-full py-3.5 px-4 rounded-full font-bold text-sm flex items-center justify-center gap-2 shadow-xl transition ${
                preBookingStatus.isOpen
                  ? "bg-[#F5E086] hover:bg-[#F8E79B] text-[#24332D] active:scale-98 cursor-pointer"
                  : "bg-white/10 text-white/40 cursor-not-allowed border border-white/10"
              }`}
            >
              <span>{preBookingStatus.isOpen ? "Proceed to Checkout" : `Pre-Orders Closed (${preBookingStatus.displayWindowText})`}</span>
              {preBookingStatus.isOpen && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
