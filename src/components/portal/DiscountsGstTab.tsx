import React, { useState } from "react";
import {
  Tag,
  Percent,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Sliders,
  DollarSign,
  ShieldCheck,
  ToggleLeft,
  ToggleRight,
  Info,
  Gift,
  Check,
  AlertCircle,
  X,
} from "lucide-react";
import { CouponDiscount, StoreFinancialSettings } from "../../types/niea";
import { syncFinancialSettingsToOwnerConfig } from "../../types/ownerFinanceConfig";

interface DiscountsGstTabProps {
  coupons: CouponDiscount[];
  onUpdateCoupons: (updated: CouponDiscount[]) => void;
  financialSettings: StoreFinancialSettings;
  onUpdateFinancialSettings: (updated: StoreFinancialSettings) => void;
  onNotice?: (msg: string) => void;
}

export const DiscountsGstTab: React.FC<DiscountsGstTabProps> = ({
  coupons,
  onUpdateCoupons,
  financialSettings,
  onUpdateFinancialSettings,
  onNotice,
}) => {
  // Financial Rates Form State
  const [gstRate, setGstRate] = useState<number>(financialSettings.gstRatePercent ?? 5);
  const [packagingFee, setPackagingFee] = useState<number>(financialSettings.packagingChargeTakeaway ?? 20);
  const [depositAmt, setDepositAmt] = useState<number>(financialSettings.advanceDepositAmount ?? 150);
  const [cogsRate, setCogsRate] = useState<number>(financialSettings.cogsPercentage ?? 31.5);
  const [overheadRate, setOverheadRate] = useState<number>(financialSettings.overheadAllocationPercent ?? 22);
  const [targetWastage, setTargetWastage] = useState<number>(financialSettings.targetWastagePercent ?? 4.0);
  const [zomatoComm, setZomatoComm] = useState<number>(financialSettings.zomatoCommissionPercent ?? 18.0);
  const [swiggyComm, setSwiggyComm] = useState<number>(financialSettings.swiggyCommissionPercent ?? 18.0);
  const [rzpKeyId, setRzpKeyId] = useState<string>(financialSettings.razorpayKeyId || "");
  const [rzpKeySecret, setRzpKeySecret] = useState<string>(financialSettings.razorpayKeySecret || "");
  const [isPayAtCounter, setIsPayAtCounter] = useState<boolean>(financialSettings.isPayAtCounterEnabled ?? false);
  const [finSaved, setFinSaved] = useState(false);

  // Edit Existing Coupon State
  const [editingCoupon, setEditingCoupon] = useState<CouponDiscount | null>(null);

  const handleStartEditCoupon = (coupon: CouponDiscount) => {
    setEditingCoupon({ ...coupon });
    setIsAddingCoupon(false);
  };

  const handleSaveEditedCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingCoupon) return;
    const cleanCode = editingCoupon.code.trim().toUpperCase();
    if (!cleanCode) return;

    // Check for duplicate code with other coupons
    if (coupons.some((c) => c.id !== editingCoupon.id && c.code.toUpperCase() === cleanCode)) {
      alert(`Coupon code "${cleanCode}" is already used by another coupon!`);
      return;
    }

    const updated = coupons.map((c) =>
      c.id === editingCoupon.id
        ? {
            ...editingCoupon,
            code: cleanCode,
            title: editingCoupon.title.trim() || cleanCode,
            discountValue: Math.max(1, editingCoupon.discountValue),
            minOrderAmount: Math.max(0, editingCoupon.minOrderAmount || 0),
            maxDiscount:
              editingCoupon.discountType === "percentage"
                ? Math.max(10, editingCoupon.maxDiscount || 100)
                : undefined,
          }
        : c
    );

    onUpdateCoupons(updated);
    setEditingCoupon(null);
    onNotice?.(`✅ Promo Coupon "${cleanCode}" updated successfully!`);
  };

  // New Coupon Form State
  const [isAddingCoupon, setIsAddingCoupon] = useState(false);
  const [newCode, setNewCode] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newType, setNewType] = useState<"flat" | "percentage">("percentage");
  const [newValue, setNewValue] = useState<number>(10);
  const [newMinOrder, setNewMinOrder] = useState<number>(200);
  const [newMaxDiscount, setNewMaxDiscount] = useState<number>(100);

  const handleSaveFinancials = (e: React.FormEvent) => {
    e.preventDefault();
    const updated: StoreFinancialSettings = {
      gstRatePercent: Math.max(0, gstRate),
      packagingChargeTakeaway: Math.max(0, packagingFee),
      advanceDepositAmount: Math.max(0, depositAmt),
      cogsPercentage: Math.max(0, cogsRate),
      overheadAllocationPercent: Math.max(0, overheadRate),
      targetWastagePercent: Math.max(0, targetWastage),
      zomatoCommissionPercent: Math.max(0, zomatoComm),
      swiggyCommissionPercent: Math.max(0, swiggyComm),
      razorpayKeyId: rzpKeyId.trim(),
      razorpayKeySecret: rzpKeySecret.trim(),
      isPayAtCounterEnabled: isPayAtCounter,
    };
    onUpdateFinancialSettings(updated);
    syncFinancialSettingsToOwnerConfig(updated);
    setFinSaved(true);
    setTimeout(() => setFinSaved(false), 2500);
    onNotice?.("✅ Store Financial, Cost Settings & Payment Settings successfully updated!");
  };

  const handleToggleCoupon = (id: string) => {
    const updated = coupons.map((c) =>
      c.id === id ? { ...c, isActive: !c.isActive } : c
    );
    onUpdateCoupons(updated);
    onNotice?.("Coupon status toggled.");
  };

  const handleDeleteCoupon = (id: string) => {
    if (confirm("Delete this promo coupon permanently?")) {
      const updated = coupons.filter((c) => c.id !== id);
      onUpdateCoupons(updated);
      onNotice?.("Coupon removed.");
    }
  };

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanCode = newCode.trim().toUpperCase();
    if (!cleanCode) return;

    if (coupons.some((c) => c.code.toUpperCase() === cleanCode)) {
      alert(`Coupon code "${cleanCode}" already exists! Please use a unique code.`);
      return;
    }

    const newCoupon: CouponDiscount = {
      id: `c_${Date.now()}`,
      code: cleanCode,
      title: newTitle.trim() || cleanCode,
      description: newDesc.trim() || undefined,
      discountType: newType,
      discountValue: Math.max(1, newValue),
      minOrderAmount: Math.max(0, newMinOrder),
      maxDiscount: newType === "percentage" ? Math.max(10, newMaxDiscount) : undefined,
      isActive: true,
    };

    onUpdateCoupons([...coupons, newCoupon]);
    setIsAddingCoupon(false);
    setNewCode("");
    setNewTitle("");
    setNewDesc("");
    onNotice?.(`🎉 Coupon "${cleanCode}" created & active!`);
  };

  return (
    <div className="space-y-6">
      {/* SECTION 1: STORE GST & OPERATIONAL CHARGES */}
      <div className="p-5 rounded-3xl bg-[#1E2B25] border border-[#F5E086]/25 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#F5E086] text-[#24332D] flex items-center justify-center font-black">
              <Percent className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-niea font-bold text-lg text-[#F5E086]">
                GST Tax Rate & Operational Cost Controls
              </h3>
              <p className="text-xs text-white/60">
                Customise GST %, takeaway packaging charges, table booking deposits, and COGS margins
              </p>
            </div>
          </div>

          {finSaved && (
            <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30 flex items-center gap-1.5 animate-in fade-in">
              <Check className="w-3.5 h-3.5" />
              <span>Saved Live</span>
            </span>
          )}
        </div>

        <form onSubmit={handleSaveFinancials} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            {/* GST % */}
            <div className="p-3.5 rounded-2xl bg-[#24332D] border border-white/10 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-white/80 font-bold block">GST Tax Rate (%)</label>
                <div className="flex items-center gap-1">
                  {[0, 5, 12, 18].map((pct) => (
                    <button
                      key={pct}
                      type="button"
                      onClick={() => setGstRate(pct)}
                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold transition ${
                        gstRate === pct
                          ? "bg-[#F5E086] text-[#24332D]"
                          : "bg-white/10 text-white/60 hover:text-white"
                      }`}
                      title={`Set GST to ${pct}%`}
                    >
                      {pct}%
                    </button>
                  ))}
                </div>
              </div>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min="0"
                  max="28"
                  step="0.5"
                  value={gstRate}
                  onChange={(e) => setGstRate(Number(e.target.value))}
                  className="w-full bg-[#1A2520] border border-white/15 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#F5E086]"
                  required
                />
                <span className="absolute right-3 text-xs font-bold text-white/50">%</span>
              </div>
              <p className="text-[10px] text-white/50">Standard Indian restaurant GST is 5%.</p>
            </div>

            {/* Packaging Charge */}
            <div className="p-3.5 rounded-2xl bg-[#24332D] border border-white/10 space-y-1.5">
              <label className="text-white/80 font-bold block">Takeaway Packaging Fee (₹)</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs font-bold text-white/50">₹</span>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={packagingFee}
                  onChange={(e) => setPackagingFee(Number(e.target.value))}
                  className="w-full bg-[#1A2520] border border-white/15 rounded-xl pl-7 pr-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#F5E086]"
                />
              </div>
              <p className="text-[10px] text-white/50">Set ₹0 for complimentary eco-friendly packaging.</p>
            </div>

            {/* Table Deposit */}
            <div className="p-3.5 rounded-2xl bg-[#24332D] border border-white/10 space-y-1.5">
              <label className="text-white/80 font-bold block">Table Booking Deposit (₹)</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs font-bold text-white/50">₹</span>
                <input
                  type="number"
                  min="0"
                  max="1000"
                  step="50"
                  value={depositAmt}
                  onChange={(e) => setDepositAmt(Number(e.target.value))}
                  className="w-full bg-[#1A2520] border border-white/15 rounded-xl pl-7 pr-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#F5E086]"
                />
              </div>
              <p className="text-[10px] text-white/50">100% credited against customer's cafe bill.</p>
            </div>

            {/* COGS % */}
            <div className="p-3.5 rounded-2xl bg-[#24332D] border border-white/10 space-y-1.5">
              <label className="text-white/80 font-bold block">Food Cost / COGS Estimate (%)</label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min="5"
                  max="80"
                  value={cogsRate}
                  onChange={(e) => setCogsRate(Number(e.target.value))}
                  className="w-full bg-[#1A2520] border border-white/15 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#F5E086]"
                />
                <span className="absolute right-3 text-xs font-bold text-white/50">%</span>
              </div>
              <p className="text-[10px] text-white/50">Used for analytics P&L calculations (default 32%).</p>
            </div>

            {/* Overhead % */}
            <div className="p-3.5 rounded-2xl bg-[#24332D] border border-white/10 space-y-1.5">
              <label className="text-white/80 font-bold block">Operating Overheads Allocation (%)</label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min="0"
                  max="60"
                  value={overheadRate}
                  onChange={(e) => setOverheadRate(Number(e.target.value))}
                  className="w-full bg-[#1A2520] border border-white/15 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#F5E086]"
                />
                <span className="absolute right-3 text-xs font-bold text-white/50">%</span>
              </div>
              <p className="text-[10px] text-white/50">Staff, power & rent allocation for analytics (default 22%).</p>
            </div>

            {/* Target Wastage % */}
            <div className="p-3.5 rounded-2xl bg-[#24332D] border border-white/10 space-y-1.5">
              <label className="text-white/80 font-bold block">Target Wastage Allowance (%)</label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min="0"
                  max="20"
                  step="0.5"
                  value={targetWastage}
                  onChange={(e) => setTargetWastage(Number(e.target.value))}
                  className="w-full bg-[#1A2520] border border-white/15 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#F5E086]"
                />
                <span className="absolute right-3 text-xs font-bold text-white/50">%</span>
              </div>
              <p className="text-[10px] text-white/50">Allowable scrap threshold before warnings trigger (default 4%).</p>
            </div>

            {/* Zomato Commission % */}
            <div className="p-3.5 rounded-2xl bg-[#24332D] border border-white/10 space-y-1.5">
              <label className="text-white/80 font-bold block">Zomato Commission Fee (%)</label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min="0"
                  max="40"
                  step="0.5"
                  value={zomatoComm}
                  onChange={(e) => setZomatoComm(Number(e.target.value))}
                  className="w-full bg-[#1A2520] border border-white/15 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#F5E086]"
                />
                <span className="absolute right-3 text-xs font-bold text-white/50">%</span>
              </div>
              <p className="text-[10px] text-white/50">Aggregator delivery commission deduction (default 18%).</p>
            </div>

            {/* Swiggy Commission % */}
            <div className="p-3.5 rounded-2xl bg-[#24332D] border border-white/10 space-y-1.5">
              <label className="text-white/80 font-bold block">Swiggy Commission Fee (%)</label>
              <div className="relative flex items-center">
                <input
                  type="number"
                  min="0"
                  max="40"
                  step="0.5"
                  value={swiggyComm}
                  onChange={(e) => setSwiggyComm(Number(e.target.value))}
                  className="w-full bg-[#1A2520] border border-white/15 rounded-xl px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#F5E086]"
                />
                <span className="absolute right-3 text-xs font-bold text-white/50">%</span>
              </div>
              <p className="text-[10px] text-white/50">Aggregator delivery commission deduction (default 18%).</p>
            </div>
          </div>

          {/* Razorpay Gateway API Keys Configuration */}
          <div className="p-4 rounded-2xl bg-[#24332D] border border-[#F5E086]/30 space-y-3">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2">
              <div className="flex items-center gap-2">
                <span className="font-niea font-bold text-sm text-[#F5E086]">
                  ⚡ Razorpay Payment Gateway (Instant UPI QR, GPay & Cards)
                </span>
                <span className="px-2 py-0.5 rounded-full text-[9px] font-black uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                  {rzpKeyId.startsWith("rzp_live") ? "Live Mode Active" : "Test Mode Ready"}
                </span>
              </div>
              <a
                href="https://dashboard.razorpay.com/app/keys"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-[#F5E086] hover:underline flex items-center gap-1 font-semibold"
              >
                <span>Get Keys from Razorpay Dashboard ↗</span>
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div>
                <label className="text-white/80 font-bold block mb-1">
                  Razorpay Key ID (`rzp_live_...` or `rzp_test_...`)
                </label>
                <input
                  type="text"
                  placeholder="e.g. rzp_live_abcdef123456"
                  value={rzpKeyId}
                  onChange={(e) => setRzpKeyId(e.target.value)}
                  className="w-full bg-[#1A2520] border border-white/15 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#F5E086]"
                />
                <p className="text-[10px] text-white/50 mt-1">
                  Public Key ID used to open the automated payment modal on customer checkout.
                </p>
              </div>

              <div>
                <label className="text-white/80 font-bold block mb-1">
                  Razorpay Key Secret (Server Verification)
                </label>
                <input
                  type="password"
                  placeholder="••••••••••••••••••••"
                  value={rzpKeySecret}
                  onChange={(e) => setRzpKeySecret(e.target.value)}
                  className="w-full bg-[#1A2520] border border-white/15 rounded-xl px-3 py-2 text-white font-mono text-xs focus:outline-none focus:border-[#F5E086]"
                />
                <p className="text-[10px] text-white/50 mt-1">
                  Private Key Secret used for server HMAC SHA-256 signature verification.
                </p>
              </div>
            </div>
          </div>

          {/* Pay at Counter Toggle for Online Pre-Orders */}
          <div className="p-4 rounded-2xl bg-[#24332D] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-niea font-bold text-sm text-white">
                  Pay at Counter for Online Pre-Orders & Takeaway
                </span>
                <span
                  className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                    isPayAtCounter
                      ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                      : "bg-amber-500/20 text-amber-300 border border-amber-400/30"
                  }`}
                >
                  {isPayAtCounter ? "Enabled" : "Disabled (Online Payment Required)"}
                </span>
              </div>
              <p className="text-[11px] text-white/60 mt-1">
                When disabled (recommended): Customers must pay online via Razorpay (Auto-Detect UPI QR / Cards) to prevent uncollected food waste. Turn ON if you want to allow cash settlement at the cafe counter.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                const next = !isPayAtCounter;
                setIsPayAtCounter(next);
                onNotice?.(`Pay at counter for pre-orders ${next ? "enabled" : "disabled"}.`);
              }}
              className="px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border self-start sm:self-auto shrink-0 shadow-sm cursor-pointer"
              style={{
                backgroundColor: isPayAtCounter ? "#F5E086" : "rgba(255,255,255,0.08)",
                color: isPayAtCounter ? "#24332D" : "#ffffff",
                borderColor: isPayAtCounter ? "#F5E086" : "rgba(255,255,255,0.15)",
              }}
            >
              {isPayAtCounter ? (
                <>
                  <ToggleRight className="w-5 h-5 text-[#24332D]" />
                  <span>Counter Pay: ON</span>
                </>
              ) : (
                <>
                  <ToggleLeft className="w-5 h-5 text-white/50" />
                  <span>Counter Pay: OFF</span>
                </>
              )}
            </button>
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-[#F5E086] text-[#24332D] font-bold text-xs hover:bg-[#F8E79B] transition shadow-md flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save Financial & Tax Settings</span>
            </button>
          </div>
        </form>
      </div>

      {/* SECTION 2: PROMOTIONAL COUPONS & VOUCHERS MANAGER */}
      <div className="p-5 rounded-3xl bg-[#1E2B25] border border-[#F5E086]/25 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-400/20 text-amber-300 border border-amber-400/30 flex items-center justify-center font-black">
              <Tag className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-niea font-bold text-lg text-[#F5E086]">
                Promotional Coupons & Customer Discounts ({coupons.length})
              </h3>
              <p className="text-xs text-white/60">
                Manage promotional coupon codes redeemable at customer checkout
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => {
              setIsAddingCoupon(!isAddingCoupon);
              setEditingCoupon(null);
            }}
            className="px-4 py-2 rounded-xl bg-[#F5E086] hover:bg-[#F8E79B] text-[#24332D] text-xs font-bold transition flex items-center gap-1.5 shadow-sm shrink-0 self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>{isAddingCoupon ? "Cancel" : "Create New Coupon"}</span>
          </button>
        </div>

        {/* Edit Existing Coupon Form */}
        {editingCoupon && (
          <form
            onSubmit={handleSaveEditedCoupon}
            className="p-4 rounded-2xl bg-[#2B3D36] border-2 border-[#F5E086] space-y-3.5 animate-in slide-in-from-top-2 text-xs shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-white/10 pb-2">
              <h4 className="font-niea font-bold text-sm text-[#F5E086] flex items-center gap-1.5">
                <Edit2 className="w-4 h-4" />
                <span>Edit Discount Coupon: <span className="font-mono text-white">{editingCoupon.code}</span></span>
              </h4>
              <button
                type="button"
                onClick={() => setEditingCoupon(null)}
                className="text-white/60 hover:text-white p-1"
                title="Cancel Edit"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-white/80 font-bold block mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  value={editingCoupon.code}
                  onChange={(e) =>
                    setEditingCoupon({ ...editingCoupon, code: e.target.value.toUpperCase() })
                  }
                  className="w-full bg-[#1A2520] border border-white/15 rounded-xl px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-[#F5E086]"
                />
              </div>

              <div>
                <label className="text-white/80 font-bold block mb-1">Coupon Title</label>
                <input
                  type="text"
                  value={editingCoupon.title}
                  onChange={(e) =>
                    setEditingCoupon({ ...editingCoupon, title: e.target.value })
                  }
                  className="w-full bg-[#1A2520] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#F5E086]"
                />
              </div>

              <div>
                <label className="text-white/80 font-bold block mb-1">Discount Type</label>
                <select
                  value={editingCoupon.discountType}
                  onChange={(e) =>
                    setEditingCoupon({
                      ...editingCoupon,
                      discountType: e.target.value as "flat" | "percentage",
                    })
                  }
                  className="w-full bg-[#1A2520] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#F5E086]"
                >
                  <option value="percentage">Percentage (%) Off</option>
                  <option value="flat">Flat Cash (₹) Off</option>
                </select>
              </div>

              <div>
                <label className="text-white/80 font-bold block mb-1">
                  Discount Value {editingCoupon.discountType === "percentage" ? "(%)" : "(₹)"} *
                </label>
                <input
                  type="number"
                  min="1"
                  max={editingCoupon.discountType === "percentage" ? 100 : 1000}
                  required
                  value={editingCoupon.discountValue}
                  onChange={(e) =>
                    setEditingCoupon({
                      ...editingCoupon,
                      discountValue: Number(e.target.value),
                    })
                  }
                  className="w-full bg-[#1A2520] border border-white/15 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#F5E086]"
                />
              </div>

              <div>
                <label className="text-white/80 font-bold block mb-1">Minimum Order Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={editingCoupon.minOrderAmount || 0}
                  onChange={(e) =>
                    setEditingCoupon({
                      ...editingCoupon,
                      minOrderAmount: Number(e.target.value),
                    })
                  }
                  className="w-full bg-[#1A2520] border border-white/15 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#F5E086]"
                />
              </div>

              {editingCoupon.discountType === "percentage" && (
                <div>
                  <label className="text-white/80 font-bold block mb-1">Max Discount Cap (₹)</label>
                  <input
                    type="number"
                    min="10"
                    value={editingCoupon.maxDiscount || 100}
                    onChange={(e) =>
                      setEditingCoupon({
                        ...editingCoupon,
                        maxDiscount: Number(e.target.value),
                      })
                    }
                    className="w-full bg-[#1A2520] border border-white/15 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#F5E086]"
                  />
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="text-white/80 font-bold block mb-1">Description / Rules</label>
                <input
                  type="text"
                  value={editingCoupon.description || ""}
                  onChange={(e) =>
                    setEditingCoupon({ ...editingCoupon, description: e.target.value })
                  }
                  className="w-full bg-[#1A2520] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#F5E086]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setEditingCoupon(null)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-[#F5E086] text-[#24332D] font-bold hover:bg-[#F8E79B] transition flex items-center gap-1.5 shadow-md"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Save Coupon Changes</span>
              </button>
            </div>
          </form>
        )}

        {/* Add Coupon Form */}
        {isAddingCoupon && (
          <form
            onSubmit={handleCreateCoupon}
            className="p-4 rounded-2xl bg-[#24332D] border border-[#F5E086]/40 space-y-3.5 animate-in slide-in-from-top-2 text-xs"
          >
            <h4 className="font-niea font-bold text-sm text-[#F5E086] flex items-center gap-1.5">
              <Gift className="w-4 h-4" />
              <span>Add New Discount Coupon</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <div>
                <label className="text-white/80 font-bold block mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. SOURDOUGH20"
                  value={newCode}
                  onChange={(e) => setNewCode(e.target.value.toUpperCase())}
                  className="w-full bg-[#1A2520] border border-white/15 rounded-xl px-3 py-2 text-white font-mono uppercase focus:outline-none focus:border-[#F5E086]"
                />
              </div>

              <div>
                <label className="text-white/80 font-bold block mb-1">Coupon Title</label>
                <input
                  type="text"
                  placeholder="e.g. 20% Off Weekend Special"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full bg-[#1A2520] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#F5E086]"
                />
              </div>

              <div>
                <label className="text-white/80 font-bold block mb-1">Discount Type</label>
                <select
                  value={newType}
                  onChange={(e) => setNewType(e.target.value as "flat" | "percentage")}
                  className="w-full bg-[#1A2520] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#F5E086]"
                >
                  <option value="percentage">Percentage (%) Off</option>
                  <option value="flat">Flat Cash (₹) Off</option>
                </select>
              </div>

              <div>
                <label className="text-white/80 font-bold block mb-1">
                  Discount Value {newType === "percentage" ? "(%)" : "(₹)"} *
                </label>
                <input
                  type="number"
                  min="1"
                  max={newType === "percentage" ? 100 : 500}
                  required
                  value={newValue}
                  onChange={(e) => setNewValue(Number(e.target.value))}
                  className="w-full bg-[#1A2520] border border-white/15 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#F5E086]"
                />
              </div>

              <div>
                <label className="text-white/80 font-bold block mb-1">Minimum Order Amount (₹)</label>
                <input
                  type="number"
                  min="0"
                  value={newMinOrder}
                  onChange={(e) => setNewMinOrder(Number(e.target.value))}
                  placeholder="e.g. 250"
                  className="w-full bg-[#1A2520] border border-white/15 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#F5E086]"
                />
              </div>

              {newType === "percentage" && (
                <div>
                  <label className="text-white/80 font-bold block mb-1">Max Discount Cap (₹)</label>
                  <input
                    type="number"
                    min="10"
                    value={newMaxDiscount}
                    onChange={(e) => setNewMaxDiscount(Number(e.target.value))}
                    placeholder="e.g. 100"
                    className="w-full bg-[#1A2520] border border-white/15 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#F5E086]"
                  />
                </div>
              )}

              <div className="sm:col-span-2">
                <label className="text-white/80 font-bold block mb-1">Description / Rules</label>
                <input
                  type="text"
                  placeholder="e.g. Valid on all artisanal sourdough melts above ₹250"
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  className="w-full bg-[#1A2520] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#F5E086]"
                />
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-1">
              <button
                type="button"
                onClick={() => setIsAddingCoupon(false)}
                className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white transition font-semibold"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-[#F5E086] text-[#24332D] font-bold hover:bg-[#F8E79B] transition flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Save Coupon</span>
              </button>
            </div>
          </form>
        )}

        {/* Coupons List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
          {coupons.map((coupon) => (
            <div
              key={coupon.id}
              className={`p-4 rounded-2xl border transition-all ${
                coupon.isActive
                  ? "bg-[#24332D] border-[#F5E086]/30 shadow-md"
                  : "bg-black/20 border-white/5 opacity-60"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-black text-sm text-[#F5E086] bg-[#1A2520] px-2 py-0.5 rounded-lg border border-[#F5E086]/30 tracking-wider">
                      {coupon.code}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.2 rounded-full uppercase ${
                        coupon.isActive
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/30"
                          : "bg-white/10 text-white/50"
                      }`}
                    >
                      {coupon.isActive ? "Active" : "Disabled"}
                    </span>
                  </div>
                  <h4 className="font-bold text-white text-xs mt-1.5">{coupon.title}</h4>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleStartEditCoupon(coupon)}
                    className="p-1 rounded-lg text-[#F5E086] hover:bg-[#F5E086]/20 transition"
                    title="Edit Coupon Details"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => handleToggleCoupon(coupon.id)}
                    className="p-1 rounded-lg text-white/70 hover:text-white hover:bg-white/10"
                    title={coupon.isActive ? "Deactivate" : "Activate"}
                  >
                    {coupon.isActive ? (
                      <ToggleRight className="w-5 h-5 text-emerald-400" />
                    ) : (
                      <ToggleLeft className="w-5 h-5 text-white/40" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteCoupon(coupon.id)}
                    className="p-1 rounded-lg text-rose-400 hover:bg-rose-500/20"
                    title="Delete Coupon"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              <div className="mt-2.5 pt-2.5 border-t border-white/10 text-xs space-y-1 text-white/70">
                <p className="flex justify-between">
                  <span>Benefit:</span>
                  <strong className="text-white">
                    {coupon.discountType === "percentage"
                      ? `${coupon.discountValue}% Off`
                      : `Flat ₹${coupon.discountValue} Off`}
                  </strong>
                </p>
                {coupon.minOrderAmount ? (
                  <p className="flex justify-between text-[11px]">
                    <span>Min Order:</span>
                    <span>₹{coupon.minOrderAmount}</span>
                  </p>
                ) : null}
                {coupon.maxDiscount ? (
                  <p className="flex justify-between text-[11px]">
                    <span>Max Cap:</span>
                    <span>₹{coupon.maxDiscount}</span>
                  </p>
                ) : null}
                {coupon.description && (
                  <p className="text-[10px] text-white/50 italic line-clamp-1 mt-1">
                    "{coupon.description}"
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
