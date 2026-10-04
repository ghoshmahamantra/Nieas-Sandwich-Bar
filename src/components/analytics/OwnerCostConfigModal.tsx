import React, { useState, useEffect, useMemo } from "react";
import {
  Settings,
  DollarSign,
  Percent,
  Sparkles,
  Check,
  X,
  RotateCcw,
  Plus,
  Trash2,
  Edit2,
  Search,
  Package,
  Layers,
  ArrowRight,
  RefreshCw,
} from "lucide-react";
import {
  OwnerFinanceConfig,
  DEFAULT_OWNER_FINANCE_CONFIG,
  saveStoredOwnerFinanceConfig,
} from "../../types/ownerFinanceConfig";
import { MasterIngredientTemplate, DailyIngredientEntry } from "../../types/niea";
import { DEFAULT_MASTER_INGREDIENTS } from "../../data/nieaData";

interface OwnerCostConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: OwnerFinanceConfig;
  onSave: (newConfig: OwnerFinanceConfig) => void;
  masterIngredients?: MasterIngredientTemplate[];
  onUpdateMasterIngredients?: (master: MasterIngredientTemplate[]) => void;
  dailyIngredients?: DailyIngredientEntry[];
  onUpdateDailyIngredients?: (ingredients: DailyIngredientEntry[]) => void;
  onNotice?: (msg: string) => void;
}

export const OwnerCostConfigModal: React.FC<OwnerCostConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSave,
  masterIngredients = [],
  onUpdateMasterIngredients,
  dailyIngredients = [],
  onUpdateDailyIngredients,
  onNotice,
}) => {
  // Operational percentages & fees
  const [localConfig, setLocalConfig] = useState<OwnerFinanceConfig>({
    ...config,
    ingredientUnitPrices: { ...config.ingredientUnitPrices },
  });

  // Goods / Raw materials list synced with masterIngredients
  const [goodsList, setGoodsList] = useState<MasterIngredientTemplate[]>(() => {
    if (masterIngredients && masterIngredients.length > 0) {
      return masterIngredients;
    }
    return DEFAULT_MASTER_INGREDIENTS;
  });

  // Search filter
  const [goodsSearch, setGoodsSearch] = useState("");

  // Adding new good state
  const [isAddingGood, setIsAddingGood] = useState(false);
  const [goodName, setGoodName] = useState("");
  const [goodCategory, setGoodCategory] = useState<MasterIngredientTemplate["category"]>("bread");
  const [goodPrice, setGoodPrice] = useState("100");
  const [goodQuantity, setGoodQuantity] = useState("10");
  const [goodUnit, setGoodUnit] = useState("kg");
  const [goodNotes, setGoodNotes] = useState("");

  // Renaming item state
  const [editingGoodId, setEditingGoodId] = useState<string | null>(null);
  const [editingGoodName, setEditingGoodName] = useState("");

  // Map of renamed items during this session (oldName -> newName)
  const [renameHistory, setRenameHistory] = useState<Record<string, string>>({});

  // Sync goodsList when masterIngredients prop changes or modal opens
  useEffect(() => {
    if (isOpen) {
      if (masterIngredients && masterIngredients.length > 0) {
        setGoodsList(masterIngredients);
      } else {
        setGoodsList(DEFAULT_MASTER_INGREDIENTS);
      }
      setLocalConfig({
        ...config,
        ingredientUnitPrices: { ...config.ingredientUnitPrices },
      });
      setRenameHistory({});
    }
  }, [isOpen, masterIngredients, config]);

  if (!isOpen) return null;

  const handleChange = (field: keyof OwnerFinanceConfig, val: number) => {
    setLocalConfig((prev) => ({
      ...prev,
      [field]: val,
    }));
  };

  const handleResetDefaults = () => {
    setLocalConfig({
      ...DEFAULT_OWNER_FINANCE_CONFIG,
      ingredientUnitPrices: { ...DEFAULT_OWNER_FINANCE_CONFIG.ingredientUnitPrices },
    });
    setGoodsList(DEFAULT_MASTER_INGREDIENTS);
  };

  // Add a new good
  const handleAddNewGood = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = goodName.trim();
    if (!clean) return;

    if (goodsList.some((g) => g.name.toLowerCase() === clean.toLowerCase())) {
      alert(`Good/Ingredient "${clean}" already exists in Cost Settings!`);
      return;
    }

    const newGood: MasterIngredientTemplate = {
      id: `master_${Date.now()}`,
      name: clean,
      category: goodCategory,
      defaultQuantity: Number(goodQuantity) || 10,
      defaultUnit: goodUnit.trim() || "units",
      defaultUnitPrice: Number(goodPrice) || 50,
      supplierNotes: goodNotes.trim() || undefined,
      updatedAt: new Date().toISOString(),
    };

    setGoodsList((prev) => [newGood, ...prev]);
    setGoodName("");
    setGoodPrice("100");
    setGoodQuantity("10");
    setGoodNotes("");
    setIsAddingGood(false);
  };

  // Start renaming a good
  const handleStartRename = (good: MasterIngredientTemplate) => {
    setEditingGoodId(good.id);
    setEditingGoodName(good.name);
  };

  // Save renamed good
  const handleSaveRename = (goodId: string) => {
    const clean = editingGoodName.trim();
    if (!clean) return;

    const originalGood = goodsList.find((g) => g.id === goodId);
    if (originalGood && originalGood.name !== clean) {
      setRenameHistory((prev) => ({
        ...prev,
        [originalGood.name]: clean,
      }));
    }

    setGoodsList((prev) =>
      prev.map((g) =>
        g.id === goodId
          ? { ...g, name: clean, updatedAt: new Date().toISOString() }
          : g
      )
    );

    setEditingGoodId(null);
    setEditingGoodName("");
  };

  // Update good unit price
  const handlePriceChange = (goodId: string, newPrice: number) => {
    setGoodsList((prev) =>
      prev.map((g) =>
        g.id === goodId
          ? { ...g, defaultUnitPrice: Math.max(0, newPrice), updatedAt: new Date().toISOString() }
          : g
      )
    );
  };

  // Delete a good
  const handleDeleteGood = (goodId: string, name: string) => {
    if (confirm(`Remove "${name}" from Goods & Cost Settings?`)) {
      setGoodsList((prev) => prev.filter((g) => g.id !== goodId));
    }
  };

  // Filtered goods for display
  const filteredGoods = goodsList.filter((g) =>
    goodsSearch.trim() === ""
      ? true
      : g.name.toLowerCase().includes(goodsSearch.toLowerCase()) ||
        g.category.toLowerCase().includes(goodsSearch.toLowerCase())
  );

  // Submit and Sync all changes
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // 1. Sync goods price money into localConfig.ingredientUnitPrices for backward compatibility
    const updatedPrices = { ...localConfig.ingredientUnitPrices };
    goodsList.forEach((g) => {
      const lower = g.name.toLowerCase();
      if (lower.includes("sourdough")) updatedPrices.sourdoughLoaf = g.defaultUnitPrice;
      if (lower.includes("brioche") || lower.includes("shokupan")) updatedPrices.shokupanLoaf = g.defaultUnitPrice;
      if (lower.includes("cheddar") || lower.includes("cheese")) updatedPrices.cheddarBlendKg = g.defaultUnitPrice;
      if (lower.includes("coffee") || lower.includes("arabica")) updatedPrices.specialtyArabicaKg = g.defaultUnitPrice;
      if (lower.includes("avocado")) updatedPrices.hassAvocadosKg = g.defaultUnitPrice;
      if (lower.includes("chicken")) updatedPrices.smokedChickenKg = g.defaultUnitPrice;
      if (lower.includes("box") || lower.includes("packaging")) updatedPrices.biodegradableBoxPiece = g.defaultUnitPrice;
    });

    const finalConfig: OwnerFinanceConfig = {
      ...localConfig,
      ingredientUnitPrices: updatedPrices,
    };

    saveStoredOwnerFinanceConfig(finalConfig);

    // 2. Synchronize Master Ingredients (Cost Settings tab & defaults)
    if (onUpdateMasterIngredients) {
      onUpdateMasterIngredients(goodsList);
    }

    // 3. Synchronize daily ingredients logs if any items were renamed
    if (onUpdateDailyIngredients && Object.keys(renameHistory).length > 0 && dailyIngredients.length > 0) {
      const updatedDaily = dailyIngredients.map((item) => {
        if (renameHistory[item.name]) {
          return {
            ...item,
            name: renameHistory[item.name],
          };
        }
        return item;
      });
      onUpdateDailyIngredients(updatedDaily);
    }

    onSave(finalConfig);
    onNotice?.(
      `✅ Cost, fee settings & goods master (${goodsList.length} items) synchronized with ingredients tab and Excel reports!`
    );
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in"
    >
      <div className="bg-[#1E2B25] border border-white/20 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#17221D] p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-[#F5E086]/15 text-[#F5E086] border border-[#F5E086]/30">
              <Settings className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-niea font-bold text-base sm:text-lg text-[#F5E086] flex items-center gap-2">
                Cost & Fee Settings (Goods & Operational Controls)
                <Sparkles className="w-3.5 h-3.5 text-[#F5E086]" />
              </h3>
              <p className="text-xs text-white/60">
                Manage goods purchasing costs, add/rename raw materials, and configure operational fees. Auto-syncs with Ingredients tab and Excel reports.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Form */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {/* Section 1: Core Operational Margins & Fees */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#F5E086] mb-3 flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5" /> 1. Operational Percentages & Platform Fees
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {/* Food Cost (COGS) % */}
              <div className="bg-[#141C18] p-3 rounded-2xl border border-white/5 space-y-1.5">
                <div className="flex justify-between items-center text-white/80 font-semibold">
                  <span>Food Cost / COGS</span>
                  <span className="text-[#F5E086] font-mono font-bold">{localConfig.cogsPercentage}%</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="10"
                  max="70"
                  value={localConfig.cogsPercentage}
                  onChange={(e) => handleChange("cogsPercentage", Number(e.target.value))}
                  className="w-full bg-[#1E2B25] border border-white/15 rounded-xl px-3 py-1.5 text-white font-mono focus:outline-none focus:border-[#F5E086]"
                  required
                />
                <span className="text-[10px] text-white/40 block">
                  Artisanal benchmark: 28% – 35%
                </span>
              </div>

              {/* Target Wastage % */}
              <div className="bg-[#141C18] p-3 rounded-2xl border border-white/5 space-y-1.5">
                <div className="flex justify-between items-center text-white/80 font-semibold">
                  <span>Target Wastage</span>
                  <span className="text-amber-400 font-mono font-bold">{localConfig.targetWastagePercent}%</span>
                </div>
                <input
                  type="number"
                  step="0.1"
                  min="0.5"
                  max="20"
                  value={localConfig.targetWastagePercent}
                  onChange={(e) => handleChange("targetWastagePercent", Number(e.target.value))}
                  className="w-full bg-[#1E2B25] border border-white/15 rounded-xl px-3 py-1.5 text-white font-mono focus:outline-none focus:border-[#F5E086]"
                  required
                />
                <span className="text-[10px] text-white/40 block">
                  Wastage allowance threshold
                </span>
              </div>

              {/* Takeaway Packaging Fee (₹) */}
              <div className="bg-[#141C18] p-3 rounded-2xl border border-white/5 space-y-1.5">
                <div className="flex justify-between items-center text-white/80 font-semibold">
                  <span>Takeaway Fee (₹)</span>
                  <span className="text-emerald-400 font-mono font-bold">₹{localConfig.packagingFeePerTakeaway}</span>
                </div>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={localConfig.packagingFeePerTakeaway}
                  onChange={(e) => handleChange("packagingFeePerTakeaway", Number(e.target.value))}
                  className="w-full bg-[#1E2B25] border border-white/15 rounded-xl px-3 py-1.5 text-white font-mono focus:outline-none focus:border-[#F5E086]"
                  required
                />
                <span className="text-[10px] text-white/40 block">
                  Billed per takeaway order
                </span>
              </div>

              {/* Operating Overheads % */}
              <div className="bg-[#141C18] p-3 rounded-2xl border border-white/5 space-y-1.5">
                <div className="flex justify-between items-center text-white/80 font-semibold">
                  <span>Overheads Allocation</span>
                  <span className="text-purple-300 font-mono font-bold">{localConfig.overheadAllocationPercent}%</span>
                </div>
                <input
                  type="number"
                  step="0.5"
                  min="5"
                  max="50"
                  value={localConfig.overheadAllocationPercent}
                  onChange={(e) => handleChange("overheadAllocationPercent", Number(e.target.value))}
                  className="w-full bg-[#1E2B25] border border-white/15 rounded-xl px-3 py-1.5 text-white font-mono focus:outline-none focus:border-[#F5E086]"
                  required
                />
                <span className="text-[10px] text-white/40 block">
                  Staff payroll, power & lease
                </span>
              </div>

              {/* Zomato Commission % */}
              <div className="bg-[#141C18] p-3 rounded-2xl border border-white/5 space-y-1.5">
                <div className="flex justify-between items-center text-white/80 font-semibold">
                  <span>Zomato Commission</span>
                  <span className="text-rose-400 font-mono font-bold">{localConfig.zomatoCommissionPercent}%</span>
                </div>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="35"
                  value={localConfig.zomatoCommissionPercent}
                  onChange={(e) => handleChange("zomatoCommissionPercent", Number(e.target.value))}
                  className="w-full bg-[#1E2B25] border border-white/15 rounded-xl px-3 py-1.5 text-white font-mono focus:outline-none focus:border-[#F5E086]"
                  required
                />
                <span className="text-[10px] text-white/40 block">
                  Platform aggregator fee
                </span>
              </div>

              {/* Swiggy Commission % */}
              <div className="bg-[#141C18] p-3 rounded-2xl border border-white/5 space-y-1.5">
                <div className="flex justify-between items-center text-white/80 font-semibold">
                  <span>Swiggy Commission</span>
                  <span className="text-orange-400 font-mono font-bold">{localConfig.swiggyCommissionPercent}%</span>
                </div>
                <input
                  type="number"
                  step="0.5"
                  min="0"
                  max="35"
                  value={localConfig.swiggyCommissionPercent}
                  onChange={(e) => handleChange("swiggyCommissionPercent", Number(e.target.value))}
                  className="w-full bg-[#1E2B25] border border-white/15 rounded-xl px-3 py-1.5 text-white font-mono focus:outline-none focus:border-[#F5E086]"
                  required
                />
                <span className="text-[10px] text-white/40 block">
                  Platform aggregator fee
                </span>
              </div>
            </div>
          </div>

          {/* Section 2: Goods Price Money & Raw Material Purchasing Costs */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#F5E086] flex items-center gap-1.5">
                  <DollarSign className="w-3.5 h-3.5 text-emerald-400" />
                  2. Goods Price Money & Raw Materials Master ({goodsList.length})
                </h4>
                <p className="text-[11px] text-white/60">
                  Add new goods, rename existing raw materials, and update procurement prices. Everything here stays 100% synced with the Ingredients tab and Excel report.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddingGood(!isAddingGood)}
                  className="px-3 py-1.5 rounded-xl bg-[#F5E086] text-[#24332D] font-bold text-xs hover:bg-[#F8E79B] transition flex items-center gap-1 shadow cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{isAddingGood ? "Close Form" : "Add Good"}</span>
                </button>
              </div>
            </div>

            {/* Inline Add New Good Form */}
            {isAddingGood && (
              <div className="p-3.5 rounded-2xl bg-[#141C18] border border-[#F5E086]/30 space-y-3 animate-in fade-in">
                <div className="flex items-center justify-between">
                  <h5 className="font-niea font-bold text-xs text-[#F5E086] flex items-center gap-1.5">
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add New Good / Raw Material</span>
                  </h5>
                  <span className="text-[10px] text-white/40">
                    Syncs to Cost Settings & Ingredients
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                  <div>
                    <label className="text-white/70 block mb-1 text-[11px] font-semibold">
                      Good / Item Name *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Sourdough Loaf, Truffle Mayo"
                      value={goodName}
                      onChange={(e) => setGoodName(e.target.value)}
                      className="w-full bg-[#1E2B25] border border-white/15 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-[#F5E086]"
                    />
                  </div>

                  <div>
                    <label className="text-white/70 block mb-1 text-[11px] font-semibold">
                      Category
                    </label>
                    <select
                      value={goodCategory}
                      onChange={(e) =>
                        setGoodCategory(e.target.value as MasterIngredientTemplate["category"])
                      }
                      className="w-full bg-[#1E2B25] border border-white/15 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-[#F5E086]"
                    >
                      <option value="bread">Artisanal Bread</option>
                      <option value="dairy_cheese">Cheese & Dairy</option>
                      <option value="vegetables">Produce & Greens</option>
                      <option value="meat_fillings">Meats & Proteins</option>
                      <option value="sauces_condiments">Sauces & Condiments</option>
                      <option value="packaging">Packaging Materials</option>
                      <option value="beverage_beans">Beverages & Coffee</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-white/70 block mb-1 text-[11px] font-semibold">
                      Purchasing Unit
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. kg, loaves, litres, pack"
                      value={goodUnit}
                      onChange={(e) => setGoodUnit(e.target.value)}
                      className="w-full bg-[#1E2B25] border border-white/15 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-[#F5E086]"
                    />
                  </div>

                  <div>
                    <label className="text-white/70 block mb-1 text-[11px] font-semibold">
                      Unit Price (₹) *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={goodPrice}
                      onChange={(e) => setGoodPrice(e.target.value)}
                      className="w-full bg-[#1E2B25] border border-white/15 rounded-xl px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-[#F5E086]"
                    />
                  </div>

                  <div>
                    <label className="text-white/70 block mb-1 text-[11px] font-semibold">
                      Default Daily Qty
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={goodQuantity}
                      onChange={(e) => setGoodQuantity(e.target.value)}
                      className="w-full bg-[#1E2B25] border border-white/15 rounded-xl px-2.5 py-1.5 text-white font-mono text-xs focus:outline-none focus:border-[#F5E086]"
                    />
                  </div>

                  <div>
                    <label className="text-white/70 block mb-1 text-[11px] font-semibold">
                      Supplier / Sourcing Notes
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Local farm fresh"
                      value={goodNotes}
                      onChange={(e) => setGoodNotes(e.target.value)}
                      className="w-full bg-[#1E2B25] border border-white/15 rounded-xl px-2.5 py-1.5 text-white text-xs focus:outline-none focus:border-[#F5E086]"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setIsAddingGood(false)}
                    className="px-3 py-1.5 rounded-xl bg-white/10 text-white/70 hover:text-white text-xs font-semibold"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAddNewGood}
                    className="px-4 py-1.5 rounded-xl bg-[#F5E086] text-[#24332D] font-bold text-xs hover:bg-[#F8E79B] transition flex items-center gap-1 shadow"
                  >
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                    <span>Add to Cost Settings</span>
                  </button>
                </div>
              </div>
            )}

            {/* Search filter bar */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                placeholder="Search goods by name or category (e.g. Sourdough, Mozzarella, Packaging)..."
                value={goodsSearch}
                onChange={(e) => setGoodsSearch(e.target.value)}
                className="w-full bg-[#141C18] border border-white/10 rounded-xl pl-8 pr-3 py-2 text-white text-xs focus:outline-none focus:border-[#F5E086]"
              />
            </div>

            {/* Goods List Table */}
            <div className="rounded-2xl border border-white/10 overflow-hidden bg-[#141C18]">
              <div className="max-h-72 overflow-y-auto divide-y divide-white/5">
                {filteredGoods.length === 0 ? (
                  <div className="p-6 text-center text-white/50 text-xs">
                    No goods found matching "{goodsSearch}". Click "+ Add Good" above to create one.
                  </div>
                ) : (
                  filteredGoods.map((good) => {
                    const isRenaming = editingGoodId === good.id;

                    return (
                      <div
                        key={good.id}
                        className="p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-white/[0.02] transition"
                      >
                        {/* Left: Name & Category */}
                        <div className="flex-1 space-y-1">
                          {isRenaming ? (
                            <div className="flex items-center gap-1.5 max-w-sm">
                              <input
                                type="text"
                                autoFocus
                                value={editingGoodName}
                                onChange={(e) => setEditingGoodName(e.target.value)}
                                className="px-2 py-1 rounded-lg bg-[#1E2B25] border border-[#F5E086] text-white text-xs font-bold outline-none flex-1"
                              />
                              <button
                                type="button"
                                onClick={() => handleSaveRename(good.id)}
                                className="p-1 rounded-lg bg-emerald-500 text-white hover:bg-emerald-600 transition"
                                title="Save name"
                              >
                                <Check className="w-3.5 h-3.5 stroke-[3]" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setEditingGoodId(null)}
                                className="p-1 rounded-lg bg-white/10 text-white/70 hover:text-white"
                                title="Cancel rename"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <div className="flex items-center gap-2">
                              <span className="font-niea font-bold text-xs text-white">
                                {good.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => handleStartRename(good)}
                                className="p-1 text-white/40 hover:text-[#F5E086] transition cursor-pointer rounded hover:bg-white/5"
                                title={`Rename "${good.name}"`}
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}

                          <div className="flex items-center gap-2 text-[10px] text-white/50">
                            <span className="px-2 py-0.5 rounded-full bg-white/5 uppercase tracking-wider font-semibold border border-white/5">
                              {good.category.replace("_", " ")}
                            </span>
                            <span>
                              Default Daily: {good.defaultQuantity} {good.defaultUnit}
                            </span>
                            {good.supplierNotes && (
                              <span className="italic truncate max-w-xs text-white/40">
                                • {good.supplierNotes}
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Right: Editable Unit Price & Delete */}
                        <div className="flex items-center gap-2 shrink-0">
                          <div className="flex items-center gap-1.5 bg-[#1E2B25] px-2.5 py-1 rounded-xl border border-white/10">
                            <span className="text-[11px] text-white/50 font-bold">₹</span>
                            <input
                              type="number"
                              min="0"
                              value={good.defaultUnitPrice}
                              onChange={(e) =>
                                handlePriceChange(good.id, Number(e.target.value))
                              }
                              className="w-16 bg-transparent text-white font-mono font-bold text-xs text-right outline-none focus:text-[#F5E086]"
                            />
                            <span className="text-[10px] text-white/40 font-mono">
                              /{good.defaultUnit}
                            </span>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleDeleteGood(good.id, good.name)}
                            className="p-1.5 text-white/30 hover:text-rose-400 hover:bg-rose-950/30 rounded-lg transition cursor-pointer"
                            title="Delete good"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="pt-4 border-t border-white/10 flex items-center justify-between">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-white/50 hover:text-white flex items-center gap-1.5 transition text-xs font-semibold cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset to Defaults</span>
            </button>

            <div className="flex items-center gap-2.5">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-xl bg-white/10 text-white font-semibold hover:bg-white/20 transition cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 rounded-xl bg-[#F5E086] text-[#24332D] font-black hover:bg-[#F8E79B] transition flex items-center gap-1.5 shadow cursor-pointer active:scale-95"
              >
                <Check className="w-4 h-4 stroke-[3]" />
                <span>Save & Sync All Data</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
