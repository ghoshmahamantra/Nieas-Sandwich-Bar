import React, { useState } from "react";
import { X, Sparkles, Gift, Check, Award, Heart, Copy, CheckCircle2, AlertCircle } from "lucide-react";
import { LoyaltyProfile, LoyaltyProgramConfig } from "../types/niea";

interface LoyaltyModalProps {
  isOpen: boolean;
  onClose: () => void;
  loyalty: LoyaltyProfile;
  loyaltyConfig?: LoyaltyProgramConfig;
  onApplyCoupon?: (code: string, discount: number) => void;
  onPetCat?: () => void;
}

export const LoyaltyModal: React.FC<LoyaltyModalProps> = ({
  isOpen,
  onClose,
  loyalty,
  loyaltyConfig,
  onApplyCoupon,
  onPetCat,
}) => {
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  if (!isOpen) return null;

  const totalStampsRequired = loyaltyConfig?.stampsRequired || 6;
  const isEnabled = loyaltyConfig?.isEnabled !== false;

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-[#374C44] rounded-3xl border-2 border-[#F5E086]/40 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#F5E086]/20 bg-[#2B3D36] flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F5E086] text-[#24332D] flex items-center justify-center font-black">
              <Award className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-niea font-bold text-xl text-[#F5E086]">
                {loyaltyConfig?.programName || "NiEA's Paws & Perks Club"}
              </h3>
              <p className="text-xs text-[#FBF9F2]/70">
                Member Tier: <span className="text-amber-300 font-bold">{loyalty.tier}</span>
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

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm flex-1">
          {!isEnabled ? (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-400/30 text-amber-200 text-center space-y-2">
              <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
              <h4 className="font-bold text-sm text-white">Perks Program Temporarily Paused</h4>
              <p className="text-xs text-white/70">
                The rewards program is currently taking a short break. Your stamps are safely stored and will be active once re-enabled by the cafe!
              </p>
            </div>
          ) : (
            <>
              {/* Virtual Stamp Card */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-[#2B3D36] to-[#1E2C26] border border-[#F5E086]/30 shadow-inner">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#F5E086] flex items-center gap-1">
                    <Sparkles className="w-3.5 h-3.5" />
                    Artisan Stamp Card
                  </span>
                  <span className="text-xs text-[#FBF9F2]/80 font-bold">
                    {Math.min(loyalty.stampsCount, totalStampsRequired)} of {totalStampsRequired} Stamps
                  </span>
                </div>

                {/* Stamp Grid */}
                <div className="grid grid-cols-3 gap-2.5">
                  {Array.from({ length: totalStampsRequired }, (_, i) => i + 1).map((num) => {
                    const isStamped = num <= loyalty.stampsCount;
                    const isReward = num === totalStampsRequired;

                    return (
                      <div
                        key={num}
                        className={`aspect-square rounded-2xl border-2 flex flex-col items-center justify-center p-2 text-center transition-all ${
                          isStamped
                            ? "bg-[#F5E086] border-[#F5E086] text-[#24332D] shadow-md scale-[1.02]"
                            : "bg-white/5 border-dashed border-[#F5E086]/30 text-[#FBF9F2]/40"
                        }`}
                      >
                        {isStamped ? (
                          <>
                            <CheckCircle2 className="w-5 h-5 text-[#24332D]" />
                            <span className="text-[9px] font-black uppercase mt-0.5">
                              Stamp #{num}
                            </span>
                          </>
                        ) : isReward ? (
                          <>
                            <Gift className="w-5 h-5 text-[#F5E086]" />
                            <span className="text-[8px] font-extrabold text-[#F5E086] uppercase mt-0.5">
                              ₹{loyaltyConfig?.rewardDiscountAmount || 150} OFF!
                            </span>
                          </>
                        ) : (
                          <>
                            <span className="text-xs font-bold opacity-60">#{num}</span>
                            <span className="text-[8px] opacity-40 uppercase">Order</span>
                          </>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Benefit description */}
              <div className="p-3.5 rounded-xl bg-black/20 border border-white/5 text-xs text-white/80 space-y-1">
                <span className="text-[#F5E086] font-bold block">Perks Program Details:</span>
                <p className="text-[11px] leading-relaxed">
                  {loyaltyConfig?.rewardDescription || `Complete ${totalStampsRequired} sandwich stamps to unlock Flat ₹${loyaltyConfig?.rewardDiscountAmount || 150} OFF your next order!`}
                </p>
              </div>

              <p className="text-[11px] text-[#FBF9F2]/70 text-center mt-3">
                Collect {totalStampsRequired} stamps with your orders to unlock a{" "}
                <strong className="text-[#F5E086]">Special Reward Voucher</strong>!
              </p>
            </>
          )}

          {/* Purr & Pet Interaction Tracker */}
          <div className="p-3 rounded-2xl bg-[#2B3D36]/80 border border-[#F5E086]/20 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 text-rose-300 flex items-center justify-center">
                <Heart className="w-4 h-4 fill-rose-300" />
              </div>
              <div>
                <p className="text-xs font-bold text-[#FBF9F2]">
                  NiEA Paws Points: <span className="text-[#F5E086]">{loyalty.pawsPoints} pts</span>
                </p>
                <p className="text-[10px] text-[#FBF9F2]/60">
                  Accrued from visits, orders & cafe interactions.
                </p>
              </div>
            </div>

            {onPetCat && (
              <button
                type="button"
                onClick={onPetCat}
                className="px-3 py-1.5 rounded-xl bg-[#F5E086] text-[#24332D] text-xs font-black hover:bg-[#F8E79B] transition"
              >
                Purr Points +5
              </button>
            )}
          </div>

          {/* Unlocked Reward Vouchers */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F5E086]">
              Your Available Reward Vouchers
            </h4>

            {loyalty.unlockedVouchers.map((voucher) => (
              <div
                key={voucher.id}
                className="p-3 rounded-2xl bg-[#2B3D36] border border-[#F5E086]/25 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-xs text-[#FBF9F2]">
                      {voucher.title}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-[#F5E086]/20 text-[#F5E086] text-[10px] font-mono font-bold">
                      {voucher.code}
                    </span>
                  </div>
                  <p className="text-[11px] text-[#FBF9F2]/70 mt-0.5">
                    {voucher.description}
                  </p>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleCopy(voucher.code)}
                    className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-[#F5E086] text-xs"
                    title="Copy coupon code"
                  >
                    {copiedCode === voucher.code ? (
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                    ) : (
                      <Copy className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {onApplyCoupon && (
                    <button
                      type="button"
                      onClick={() => {
                        onApplyCoupon(voucher.code, voucher.discount);
                        onClose();
                      }}
                      className="px-3 py-1.5 rounded-xl bg-[#F5E086] hover:bg-[#F8E79B] text-[#24332D] text-xs font-bold transition"
                    >
                      Apply
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#F5E086]/20 bg-[#2B3D36] text-center">
          <button
            onClick={onClose}
            className="w-full py-2.5 rounded-full bg-[#F5E086] text-[#24332D] font-bold text-xs hover:bg-[#F8E79B] transition"
          >
            Close & Order Sandwiches
          </button>
        </div>
      </div>
    </div>
  );
};
