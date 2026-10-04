import React, { useState } from "react";
import { X, Plus, Minus, Clock, Check, Sparkles } from "lucide-react";
import { MenuItem, CustomizationOption } from "../types/niea";

interface ItemCustomizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  item: MenuItem | null;
  onConfirm: (
    item: MenuItem,
    selectedBread: string | undefined,
    selectedCustomizations: CustomizationOption[],
    specialInstructions: string,
    quantity: number
  ) => void;
}

export const ItemCustomizerModal: React.FC<ItemCustomizerModalProps> = ({
  isOpen,
  onClose,
  item,
  onConfirm,
}) => {
  const [quantity, setQuantity] = useState(1);
  const [selectedBread, setSelectedBread] = useState<string | undefined>(
    item?.breadChoices && item.breadChoices.length > 0 ? item.breadChoices[0] : undefined
  );
  const [selectedAddons, setSelectedAddons] = useState<CustomizationOption[]>([]);
  const [instructions, setInstructions] = useState("");

  // Dismiss on Escape key
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !item) return null;

  const toggleAddon = (addon: CustomizationOption) => {
    if (selectedAddons.some((a) => a.name === addon.name)) {
      setSelectedAddons(selectedAddons.filter((a) => a.name !== addon.name));
    } else {
      setSelectedAddons([...selectedAddons, addon]);
    }
  };

  const addonsTotal = selectedAddons.reduce((sum, a) => sum + a.price, 0);
  const unitPrice = item.price + addonsTotal;
  const totalPrice = unitPrice * quantity;

  const handleConfirm = () => {
    onConfirm(item, selectedBread, selectedAddons, instructions, quantity);
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in"
    >
      <div className="w-full max-w-lg bg-[#374C44] rounded-3xl border border-[#F5E086]/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header with image banner */}
        <div className="relative h-44 sm:h-52 bg-[#24332D] overflow-hidden shrink-0">
          <img
            src={item.imageUrl}
            alt={item.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#374C44] via-transparent to-black/40" />

          {/* Prominent Cross Button to Cancel without Adding */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Cancel customization and close"
            title="Cancel and do not add to cart"
            className="absolute top-3 right-3 z-30 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-black/80 hover:bg-black text-white hover:text-rose-300 border border-white/30 backdrop-blur-md shadow-xl transition cursor-pointer active:scale-95 group"
          >
            <X className="w-4 h-4 stroke-[3] text-rose-400 group-hover:scale-110 transition-transform" />
            <span className="text-[11px] font-extrabold tracking-wide uppercase">Cancel</span>
          </button>

          <div className="absolute bottom-3 left-4 right-4">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span
                  className={`w-2 h-2 rounded-full ${
                    item.isVeg ? "bg-emerald-400" : "bg-rose-400"
                  }`}
                />
                <span className="text-[11px] font-extrabold uppercase tracking-wider text-[#F5E086]">
                  {item.category} {item.isSeasonal && "• Seasonal Feature"}
                </span>
              </div>
              <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-black/60 backdrop-blur-xs border border-white/15">
                {item.stockLeft <= 0 ? (
                  <span className="text-rose-400 font-bold">Sold Out</span>
                ) : item.stockLeft <= 5 ? (
                  <span className="text-amber-300 font-bold">Only {item.stockLeft} in stock!</span>
                ) : (
                  <span className="text-emerald-300 font-semibold">{item.stockLeft} in stock</span>
                )}
              </span>
            </div>
            <h3 className="font-niea font-bold text-xl text-white mt-0.5">
              {item.name}
            </h3>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="p-5 overflow-y-auto space-y-5 text-sm flex-1">
          {/* Description & Restock note */}
          <div>
            <p className="text-xs text-[#FBF9F2]/80 leading-relaxed">
              {item.description}
            </p>
            <div className="mt-2 inline-flex items-center gap-1.5 text-xs text-[#F5E086] bg-[#2B3D36] px-3 py-1.5 rounded-xl border border-[#F5E086]/20">
              <Clock className="w-3.5 h-3.5" />
              <span>{item.restockSchedule}</span>
            </div>
          </div>

          {/* Bread Choices */}
          {item.breadChoices && item.breadChoices.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-niea font-bold text-xs uppercase tracking-wider text-[#F5E086]">
                {item.category === "burgers"
                  ? "Choice of Patty / Bread"
                  : item.category === "hot-picks"
                  ? "Choice of Filling / Preparation"
                  : "Choice of Bread / Selection"}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {item.breadChoices.map((bread) => {
                  const isChecked = selectedBread === bread;
                  return (
                    <button
                      key={bread}
                      type="button"
                      onClick={() => setSelectedBread(bread)}
                      className={`p-2.5 rounded-xl text-xs font-semibold text-left border transition flex items-center justify-between ${
                        isChecked
                          ? "bg-[#F5E086] text-[#24332D] border-[#F5E086]"
                          : "bg-[#2B3D36] text-[#FBF9F2] border-[#F5E086]/15 hover:border-[#F5E086]/40"
                      }`}
                    >
                      <span>{bread}</span>
                      {isChecked && <Check className="w-4 h-4 text-[#24332D]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Optional Add-ons */}
          {item.customizations && item.customizations.length > 0 && (
            <div className="space-y-2">
              <h4 className="font-niea font-bold text-xs uppercase tracking-wider text-[#F5E086]">
                Add-ons & Upgrades
              </h4>
              <div className="space-y-1.5">
                {item.customizations.map((addon) => {
                  const isChecked = selectedAddons.some((a) => a.name === addon.name);
                  return (
                    <div
                      key={addon.name}
                      onClick={() => toggleAddon(addon)}
                      className={`p-2.5 rounded-xl border transition flex items-center justify-between cursor-pointer text-xs ${
                        isChecked
                          ? "bg-[#2B3D36] border-[#F5E086] text-[#F5E086]"
                          : "bg-[#2B3D36]/60 border-white/5 text-[#FBF9F2]/80 hover:border-white/20"
                      }`}
                    >
                      <span className="font-medium">{addon.name}</span>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-[#F5E086]">
                          {addon.price > 0 ? `+₹${addon.price}` : "Free"}
                        </span>
                        <div
                          className={`w-4 h-4 rounded border flex items-center justify-center ${
                            isChecked
                              ? "bg-[#F5E086] border-[#F5E086] text-[#24332D]"
                              : "border-white/30"
                          }`}
                        >
                          {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Kitchen notes */}
          <div>
            <label className="font-niea font-bold text-xs uppercase tracking-wider text-[#F5E086] block mb-1">
              Special Kitchen Notes
            </label>
            <input
              type="text"
              placeholder="e.g., extra toasted, cut in half, light mayo..."
              value={instructions}
              onChange={(e) => setInstructions(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-[#2B3D36] border border-[#F5E086]/20 text-xs text-white placeholder-white/30 outline-none focus:border-[#F5E086]"
            />
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-[#F5E086]/15 bg-[#2B3D36] flex flex-wrap sm:flex-nowrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {/* Don't Add / Cancel cross button */}
            <button
              type="button"
              onClick={onClose}
              className="py-2.5 px-4 rounded-full border border-rose-500/40 hover:border-rose-400 bg-rose-950/40 hover:bg-rose-900/60 text-rose-200 hover:text-white font-bold text-xs flex items-center gap-1.5 transition cursor-pointer shadow-sm active:scale-95"
              title="Don't add this item to cart"
            >
              <X className="w-4 h-4 text-rose-400 stroke-[3]" />
              <span>Don't Add</span>
            </button>

            {/* Quantity Controls */}
            <div className="flex items-center rounded-full border border-[#F5E086]/30 bg-[#374C44] p-1">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                disabled={quantity <= 1 || item.stockLeft <= 0}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="w-8 text-center text-xs font-bold text-[#F5E086]">
                {item.stockLeft <= 0 ? 0 : quantity}
              </span>
              <button
                onClick={() => setQuantity(Math.min(item.stockLeft, quantity + 1))}
                disabled={quantity >= item.stockLeft || item.stockLeft <= 0}
                className="w-7 h-7 rounded-full flex items-center justify-center text-white hover:bg-white/10 disabled:opacity-30 disabled:cursor-not-allowed"
                title={quantity >= item.stockLeft ? `Only ${item.stockLeft} portions available in kitchen` : "Add another"}
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Add to order CTA */}
          <button
            onClick={handleConfirm}
            disabled={item.stockLeft <= 0}
            className={`flex-1 py-3 px-5 rounded-full font-bold text-xs sm:text-sm flex items-center justify-between shadow-lg transition ${
              item.stockLeft <= 0
                ? "bg-white/10 text-white/40 cursor-not-allowed shadow-none"
                : "bg-[#F5E086] hover:bg-[#F8E79B] text-[#24332D]"
            }`}
          >
            <span>{item.stockLeft <= 0 ? "Sold Out Today" : "Add to Order"}</span>
            {item.stockLeft > 0 && <span className="font-niea font-black text-base">₹{totalPrice}</span>}
          </button>
        </div>
      </div>
    </div>
  );
};
