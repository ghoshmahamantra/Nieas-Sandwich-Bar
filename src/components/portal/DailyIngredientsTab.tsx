import React, { useState, useMemo } from "react";
import {
  ShoppingBag,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  FileSpreadsheet,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  Package,
  X,
  Check,
  RefreshCw,
  Layers,
  Settings,
  Sparkles,
  Info,
  Clock,
  ArrowRight,
  ShieldCheck,
  RotateCcw,
} from "lucide-react";
import {
  DailyIngredientEntry,
  DailyWastageEntry,
  MasterIngredientTemplate,
  StoreFinancialSettings,
  OrderRecord,
} from "../../types/niea";
import { exportAnalyticsToExcel } from "../../utils/analyticsExportService";

interface DailyIngredientsTabProps {
  ingredients: DailyIngredientEntry[];
  onUpdateIngredients: (ingredients: DailyIngredientEntry[]) => void;
  wastage: DailyWastageEntry[];
  onUpdateWastage: (wastage: DailyWastageEntry[]) => void;
  masterIngredients?: MasterIngredientTemplate[];
  onUpdateMasterIngredients?: (master: MasterIngredientTemplate[]) => void;
  financialSettings?: StoreFinancialSettings;
  onUpdateFinancialSettings?: (settings: StoreFinancialSettings) => void;
  orders: OrderRecord[];
  onNotice?: (msg: string) => void;
  currentDate?: string;
}

export const DailyIngredientsTab: React.FC<DailyIngredientsTabProps> = ({
  ingredients,
  onUpdateIngredients,
  wastage,
  onUpdateWastage,
  masterIngredients = [],
  onUpdateMasterIngredients,
  financialSettings,
  onUpdateFinancialSettings,
  orders,
  onNotice,
  currentDate = new Date().toISOString().slice(0, 10),
}) => {
  // Navigation sub-tab: Daily purchases log vs Master Cost Settings defaults
  const [activeSubTab, setActiveSubTab] = useState<"daily_log" | "cost_settings">("daily_log");

  const [selectedDate, setSelectedDate] = useState<string>(currentDate);
  const [dateMode, setDateMode] = useState<"single" | "range">("single");
  const [dateRangeEnd, setDateRangeEnd] = useState<string>(currentDate);

  // Form state for adding/editing a daily ingredient
  const [isAddingIngredient, setIsAddingIngredient] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<DailyIngredientEntry | null>(null);

  const [formName, setFormName] = useState("");
  const [formCategory, setFormCategory] = useState<DailyIngredientEntry["category"]>("bread");
  const [formQuantity, setFormQuantity] = useState<number>(10);
  const [formUnit, setFormUnit] = useState("loaves");
  const [formUnitPrice, setFormUnitPrice] = useState<number>(85);
  const [formNotes, setFormNotes] = useState("");
  const [updateAsMasterDefault, setUpdateAsMasterDefault] = useState(true);

  // Master Ingredient Form state (for cost settings tab)
  const [isAddingMaster, setIsAddingMaster] = useState(false);
  const [editingMaster, setEditingMaster] = useState<MasterIngredientTemplate | null>(null);
  const [masterFormName, setMasterFormName] = useState("");
  const [masterFormCategory, setMasterFormCategory] = useState<MasterIngredientTemplate["category"]>("bread");
  const [masterFormQuantity, setMasterFormQuantity] = useState<number>(10);
  const [masterFormUnit, setMasterFormUnit] = useState("loaves");
  const [masterFormUnitPrice, setMasterFormUnitPrice] = useState<number>(85);
  const [masterFormNotes, setMasterFormNotes] = useState("");

  // Wastage form state
  const [isAddingWastage, setIsAddingWastage] = useState(false);
  const [wastageItemName, setWastageItemName] = useState("");
  const [wastageQuantity, setWastageQuantity] = useState<number>(1);
  const [wastageUnit, setWastageUnit] = useState("loaves");
  const [wastageCostLoss, setWastageCostLoss] = useState<number>(85);
  const [wastageReason, setWastageReason] = useState<DailyWastageEntry["reason"]>("prep_scrap");

  // Determine if direct entries exist for the selected date
  const directEntriesForDate = useMemo(() => {
    return ingredients.filter((ing) => ing.date === selectedDate);
  }, [ingredients, selectedDate]);

  // When dateMode is single and no manual entries exist, generate default baseline entries from Cost Settings (Master Ingredients)
  const isUsingDefaultsForDate = dateMode === "single" && directEntriesForDate.length === 0;

  const defaultEntriesForDate: DailyIngredientEntry[] = useMemo(() => {
    if (!isUsingDefaultsForDate) return [];
    return masterIngredients.map((m, idx) => ({
      id: `def_${selectedDate}_${m.id || idx}`,
      date: selectedDate,
      name: m.name,
      category: m.category,
      quantity: m.defaultQuantity,
      unit: m.defaultUnit,
      unitPrice: m.defaultUnitPrice,
      totalCost: m.defaultQuantity * m.defaultUnitPrice,
      supplierNotes: m.supplierNotes ? `${m.supplierNotes} (Default Cost Setting)` : "Default from Cost Settings",
      createdAt: `${selectedDate}T09:00:00.000Z`,
    }));
  }, [isUsingDefaultsForDate, masterIngredients, selectedDate]);

  // Active displayed ingredients for table and math
  const effectiveIngredientsForDate = useMemo(() => {
    if (dateMode === "single") {
      return directEntriesForDate.length > 0 ? directEntriesForDate : defaultEntriesForDate;
    }
    return ingredients.filter((ing) => ing.date >= selectedDate && ing.date <= dateRangeEnd);
  }, [dateMode, directEntriesForDate, defaultEntriesForDate, ingredients, selectedDate, dateRangeEnd]);

  // Filtered wastage
  const filteredWastage = useMemo(() => {
    return wastage.filter((w) => {
      if (dateMode === "single") return w.date === selectedDate;
      return w.date >= selectedDate && w.date <= dateRangeEnd;
    });
  }, [wastage, dateMode, selectedDate, dateRangeEnd]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      const oDate = o.createdAt ? o.createdAt.slice(0, 10) : "";
      if (dateMode === "single") return oDate === selectedDate;
      return oDate >= selectedDate && oDate <= dateRangeEnd;
    });
  }, [orders, dateMode, selectedDate, dateRangeEnd]);

  // Core Math Calculations
  const totalIngredientCost = effectiveIngredientsForDate.reduce((sum, item) => sum + (item.totalCost || 0), 0);
  const totalWastageLoss = filteredWastage.reduce((sum, item) => sum + (item.costLoss || 0), 0);
  const totalGrossSales = filteredOrders.reduce((sum, o) => sum + (o.grandTotal || 0), 0);
  const totalTaxes = filteredOrders.reduce((sum, o) => sum + (o.taxes || 0), 0);
  const totalPackaging = filteredOrders.reduce((sum, o) => sum + (o.packagingCharge || 0), 0);
  const netFoodSales = Math.max(0, totalGrossSales - totalTaxes);

  // Financial rates from settings
  const gstRate = financialSettings?.gstRatePercent ?? 5;
  const overheadRate = financialSettings?.overheadAllocationPercent ?? 22;
  const overheadExpense = Math.round(netFoodSales * (overheadRate / 100));

  // Net Profit formula matching PetPooja Analytics to the exact rupee
  const realNetProfit = totalGrossSales - totalIngredientCost - overheadExpense - totalWastageLoss;
  const profitMarginPercent = totalGrossSales > 0 ? Number(((realNetProfit / totalGrossSales) * 100).toFixed(1)) : 0;

  // Total daily default budget
  const totalDefaultDailyBudget = masterIngredients.reduce(
    (sum, m) => sum + m.defaultQuantity * m.defaultUnitPrice,
    0
  );

  // All known ingredients list for dropdown in wastage form
  const allKnownIngredientNames = useMemo(() => {
    const names = new Set<string>();
    masterIngredients.forEach((m) => names.add(m.name));
    ingredients.forEach((i) => names.add(i.name));
    return Array.from(names).sort();
  }, [masterIngredients, ingredients]);

  // Seed / Instantiate Default Baseline into official day records
  const handleInstantiateDefaultsForDate = () => {
    if (directEntriesForDate.length > 0) {
      if (!confirm(`A manual log already exists for ${selectedDate}. Replace with Master Cost Settings defaults?`)) {
        return;
      }
    }
    const newDayRecords: DailyIngredientEntry[] = masterIngredients.map((m, idx) => ({
      id: `ing_${Date.now()}_${idx}`,
      date: selectedDate,
      name: m.name,
      category: m.category,
      quantity: m.defaultQuantity,
      unit: m.defaultUnit,
      unitPrice: m.defaultUnitPrice,
      totalCost: m.defaultQuantity * m.defaultUnitPrice,
      supplierNotes: m.supplierNotes || "Procured via Master Cost Settings baseline",
      createdAt: new Date().toISOString(),
    }));

    // Remove any previous day records and append new ones
    const remaining = ingredients.filter((ing) => ing.date !== selectedDate);
    onUpdateIngredients([...newDayRecords, ...remaining]);
    onNotice?.(`✅ Loaded official procurement log for ${selectedDate} (${newDayRecords.length} items, ₹${totalDefaultDailyBudget})`);
  };

  // Start adding a daily ingredient
  const handleStartAdd = () => {
    setEditingIngredient(null);
    setFormName("");
    setFormCategory("bread");
    setFormQuantity(10);
    setFormUnit("loaves");
    setFormUnitPrice(85);
    setFormNotes("");
    setUpdateAsMasterDefault(true);
    setIsAddingIngredient(true);
  };

  // Start editing an ingredient
  const handleStartEdit = (item: DailyIngredientEntry) => {
    setEditingIngredient(item);
    setFormName(item.name);
    setFormCategory(item.category);
    setFormQuantity(item.quantity);
    setFormUnit(item.unit);
    setFormUnitPrice(item.unitPrice);
    setFormNotes(item.supplierNotes || "");
    setUpdateAsMasterDefault(true);
    setIsAddingIngredient(true);
  };

  // Save Daily Ingredient (and update master default if requested)
  const handleSaveIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = formName.trim();
    if (!cleanName) return;

    const totalCost = Number(formQuantity) * Number(formUnitPrice);

    // If day was currently showing defaults, instantiate all other defaults as real entries first
    let baseList = [...ingredients];
    if (isUsingDefaultsForDate) {
      const otherDefaults = defaultEntriesForDate
        .filter((d) => (editingIngredient ? d.id !== editingIngredient.id : d.name.toLowerCase() !== cleanName.toLowerCase()))
        .map((d, idx) => ({
          ...d,
          id: `ing_${Date.now()}_${idx}`,
          createdAt: new Date().toISOString(),
        }));
      baseList = [...otherDefaults, ...baseList];
    }

    if (editingIngredient) {
      const updated = baseList.map((ing) =>
        ing.id === editingIngredient.id
          ? {
              ...ing,
              date: selectedDate,
              name: cleanName,
              category: formCategory,
              quantity: Number(formQuantity),
              unit: formUnit.trim(),
              unitPrice: Number(formUnitPrice),
              totalCost,
              supplierNotes: formNotes.trim() || undefined,
            }
          : ing
      );
      onUpdateIngredients(updated);
      onNotice?.(`Updated "${cleanName}" (₹${totalCost}) for ${selectedDate}`);
    } else {
      const newEntry: DailyIngredientEntry = {
        id: `ing_${Date.now()}`,
        date: selectedDate,
        name: cleanName,
        category: formCategory,
        quantity: Number(formQuantity),
        unit: formUnit.trim(),
        unitPrice: Number(formUnitPrice),
        totalCost,
        supplierNotes: formNotes.trim() || undefined,
        createdAt: new Date().toISOString(),
      };
      onUpdateIngredients([newEntry, ...baseList]);
      onNotice?.(`Added "${cleanName}" (₹${totalCost}) for ${selectedDate}`);
    }

    // "if the owner inputs a new value then that value should be updated as the new default (if next day no manual input is given)"
    if (updateAsMasterDefault && onUpdateMasterIngredients) {
      const existingMasterIndex = masterIngredients.findIndex(
        (m) => m.name.toLowerCase().trim() === cleanName.toLowerCase() || (editingIngredient && m.name.toLowerCase().trim() === editingIngredient.name.toLowerCase().trim())
      );

      let updatedMasterList: MasterIngredientTemplate[];
      if (existingMasterIndex >= 0) {
        updatedMasterList = masterIngredients.map((m, idx) =>
          idx === existingMasterIndex
            ? {
                ...m,
                name: cleanName,
                category: formCategory,
                defaultQuantity: Number(formQuantity),
                defaultUnit: formUnit.trim(),
                defaultUnitPrice: Number(formUnitPrice),
                supplierNotes: formNotes.trim() || m.supplierNotes,
                updatedAt: new Date().toISOString(),
              }
            : m
        );
      } else {
        const newMaster: MasterIngredientTemplate = {
          id: `master_${Date.now()}`,
          name: cleanName,
          category: formCategory,
          defaultQuantity: Number(formQuantity),
          defaultUnit: formUnit.trim(),
          defaultUnitPrice: Number(formUnitPrice),
          supplierNotes: formNotes.trim() || undefined,
          updatedAt: new Date().toISOString(),
        };
        updatedMasterList = [...masterIngredients, newMaster];
      }
      onUpdateMasterIngredients(updatedMasterList);
      onNotice?.(`⚡ Saved new default value (Qty: ${formQuantity} ${formUnit}, Price: ₹${formUnitPrice}) in Cost Settings!`);
    }

    setIsAddingIngredient(false);
    setEditingIngredient(null);
  };

  const handleDeleteIngredient = (id: string, name: string) => {
    if (confirm(`Remove ingredient "${name}" from ${selectedDate}'s procurement log?`)) {
      onUpdateIngredients(ingredients.filter((i) => i.id !== id));
      onNotice?.(`Removed "${name}" from ${selectedDate}`);
    }
  };

  // Master Ingredient Handlers
  const handleStartAddMaster = () => {
    setEditingMaster(null);
    setMasterFormName("");
    setMasterFormCategory("bread");
    setMasterFormQuantity(10);
    setMasterFormUnit("loaves");
    setMasterFormUnitPrice(85);
    setMasterFormNotes("");
    setIsAddingMaster(true);
  };

  const handleStartEditMaster = (item: MasterIngredientTemplate) => {
    setEditingMaster(item);
    setMasterFormName(item.name);
    setMasterFormCategory(item.category);
    setMasterFormQuantity(item.defaultQuantity);
    setMasterFormUnit(item.defaultUnit);
    setMasterFormUnitPrice(item.defaultUnitPrice);
    setMasterFormNotes(item.supplierNotes || "");
    setIsAddingMaster(true);
  };

  const handleSaveMasterIngredient = (e: React.FormEvent) => {
    e.preventDefault();
    const cleanName = masterFormName.trim();
    if (!cleanName || !onUpdateMasterIngredients) return;

    if (editingMaster) {
      const oldName = editingMaster.name;
      const updated = masterIngredients.map((m) =>
        m.id === editingMaster.id
          ? {
              ...m,
              name: cleanName,
              category: masterFormCategory,
              defaultQuantity: Number(masterFormQuantity),
              defaultUnit: masterFormUnit.trim(),
              defaultUnitPrice: Number(masterFormUnitPrice),
              supplierNotes: masterFormNotes.trim() || undefined,
              updatedAt: new Date().toISOString(),
            }
          : m
      );
      onUpdateMasterIngredients(updated);

      // Auto-sync daily log entries if name or unit was updated
      if (oldName.toLowerCase() !== cleanName.toLowerCase() && onUpdateIngredients && ingredients.length > 0) {
        const syncedDaily = ingredients.map((ing) =>
          ing.name.toLowerCase().trim() === oldName.toLowerCase().trim()
            ? { ...ing, name: cleanName, category: masterFormCategory, unit: masterFormUnit.trim() }
            : ing
        );
        onUpdateIngredients(syncedDaily);
      }

      onNotice?.(`✅ Updated Master Cost Setting for "${cleanName}" and synced logs!`);
    } else {
      const newMaster: MasterIngredientTemplate = {
        id: `master_${Date.now()}`,
        name: cleanName,
        category: masterFormCategory,
        defaultQuantity: Number(masterFormQuantity),
        defaultUnit: masterFormUnit.trim(),
        defaultUnitPrice: Number(masterFormUnitPrice),
        supplierNotes: masterFormNotes.trim() || undefined,
        updatedAt: new Date().toISOString(),
      };
      onUpdateMasterIngredients([...masterIngredients, newMaster]);
      onNotice?.(`✅ Added new Master Ingredient "${cleanName}" into Cost Settings!`);
    }

    setIsAddingMaster(false);
    setEditingMaster(null);
  };

  const handleDeleteMaster = (id: string, name: string) => {
    if (confirm(`Delete master default ingredient "${name}"? Future days without manual logs will no longer include this ingredient.`)) {
      if (onUpdateMasterIngredients) {
        onUpdateMasterIngredients(masterIngredients.filter((m) => m.id !== id));
        onNotice?.(`Deleted master ingredient "${name}"`);
      }
    }
  };

  // Wastage handlers
  const handleSelectWastageItem = (name: string) => {
    setWastageItemName(name);
    // Auto-populate unit & unit price from master or current ingredients
    const matchedMaster = masterIngredients.find((m) => m.name.toLowerCase() === name.toLowerCase());
    const matchedDaily = effectiveIngredientsForDate.find((i) => i.name.toLowerCase() === name.toLowerCase());
    const unit = matchedDaily?.unit || matchedMaster?.defaultUnit || "units";
    const unitPrice = matchedDaily?.unitPrice || matchedMaster?.defaultUnitPrice || 50;

    setWastageUnit(unit);
    setWastageCostLoss(Math.round(wastageQuantity * unitPrice));
  };

  const handleWastageQuantityChange = (qty: number) => {
    setWastageQuantity(qty);
    const matchedMaster = masterIngredients.find((m) => m.name.toLowerCase() === wastageItemName.toLowerCase());
    const matchedDaily = effectiveIngredientsForDate.find((i) => i.name.toLowerCase() === wastageItemName.toLowerCase());
    const unitPrice = matchedDaily?.unitPrice || matchedMaster?.defaultUnitPrice || 50;
    setWastageCostLoss(Math.round(qty * unitPrice));
  };

  const handleSaveWastage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wastageItemName.trim()) return;

    const newWastage: DailyWastageEntry = {
      id: `w_${Date.now()}`,
      date: selectedDate,
      itemName: wastageItemName.trim(),
      category: "kitchen_prep",
      quantity: Number(wastageQuantity),
      unit: wastageUnit.trim(),
      costLoss: Number(wastageCostLoss),
      reason: wastageReason,
      createdAt: new Date().toISOString(),
    };

    onUpdateWastage([newWastage, ...wastage]);
    setIsAddingWastage(false);
    setWastageItemName("");
    onNotice?.(`Recorded wastage for "${newWastage.itemName}" (Loss: ₹${newWastage.costLoss})`);
  };

  const handleDeleteWastage = (id: string) => {
    if (confirm("Delete this wastage record?")) {
      onUpdateWastage(wastage.filter((w) => w.id !== id));
      onNotice?.("Wastage record deleted");
    }
  };

  // Professional Excel Export
  const handleExportExcel = async () => {
    const dateLabel = dateMode === "single" ? selectedDate : `${selectedDate} to ${dateRangeEnd}`;

    // Construct fully synchronized snapshot
    const snapshot: any = {
      periodLabel: `Daily Procurement & P&L Statement (${dateLabel})`,
      netSales: netFoodSales,
      grossSales: totalGrossSales,
      totalOrders: filteredOrders.length,
      averageOrderValue: filteredOrders.length > 0 ? Math.round(totalGrossSales / filteredOrders.length) : 0,
      totalTaxes: totalTaxes,
      totalDiscounts: filteredOrders.reduce((sum, o) => sum + (o.discount || 0), 0),
      cogs: totalIngredientCost,
      grossProfit: totalGrossSales - totalIngredientCost,
      operatingExpenses: overheadExpense,
      netProfit: realNetProfit,
      profitMarginPercent,
      financials: {
        grossSales: totalGrossSales,
        discountsGiven: filteredOrders.reduce((sum, o) => sum + (o.discount || 0), 0),
        netFoodSales,
        taxesCollected: totalTaxes,
        packagingCharges: totalPackaging,
        totalRevenue: totalGrossSales,
        cogs: totalIngredientCost,
        grossProfit: totalGrossSales - totalIngredientCost,
        operatingExpenses: overheadExpense,
        aggregatorPlatformFees: 0,
        actualWastageLoss: totalWastageLoss,
        netProfit: realNetProfit,
        profitMarginPercent,
        avgOrderValue: filteredOrders.length > 0 ? Math.round(totalGrossSales / filteredOrders.length) : 0,
      },
      ownerConfig: {
        gstTaxRatePercent: gstRate,
        cogsPercentage: financialSettings?.cogsPercentage ?? 31.5,
        overheadAllocationPercent: overheadRate,
        targetWastagePercent: financialSettings?.targetWastagePercent ?? 4.0,
        packagingFeePerTakeaway: financialSettings?.packagingChargeTakeaway ?? 20,
        zomatoCommissionPercent: financialSettings?.zomatoCommissionPercent ?? 18.0,
        swiggyCommissionPercent: financialSettings?.swiggyCommissionPercent ?? 18.0,
      },
      channels: [
        {
          label: "Dine-In Orders",
          ordersCount: filteredOrders.filter((o) => o.orderType === "dine-in").length,
          revenue: filteredOrders.filter((o) => o.orderType === "dine-in").reduce((s, o) => s + (o.grandTotal || 0), 0),
          percentage: filteredOrders.length > 0 ? Math.round((filteredOrders.filter((o) => o.orderType === "dine-in").length / filteredOrders.length) * 100) : 60,
        },
        {
          label: "Takeaway Counter",
          ordersCount: filteredOrders.filter((o) => o.orderType === "takeaway").length,
          revenue: filteredOrders.filter((o) => o.orderType === "takeaway").reduce((s, o) => s + (o.grandTotal || 0), 0),
          percentage: filteredOrders.length > 0 ? Math.round((filteredOrders.filter((o) => o.orderType === "takeaway").length / filteredOrders.length) * 100) : 40,
        },
      ],
      paymentModes: [
        {
          label: "UPI (Google Pay / PhonePe)",
          ordersCount: filteredOrders.filter((o) => o.paymentMethod === "upi" || o.paymentMethod === "razorpay").length,
          amount: filteredOrders.filter((o) => o.paymentMethod === "upi" || o.paymentMethod === "razorpay").reduce((s, o) => s + (o.grandTotal || 0), 0),
          percentage: 80,
        },
        {
          label: "Cards & Counter Cash",
          ordersCount: filteredOrders.filter((o) => o.paymentMethod === "cash" || o.paymentMethod === "counter" || o.paymentMethod === "card").length,
          amount: filteredOrders.filter((o) => o.paymentMethod === "cash" || o.paymentMethod === "counter" || o.paymentMethod === "card").reduce((s, o) => s + (o.grandTotal || 0), 0),
          percentage: 20,
        },
      ],
      topSellingItems: [],
      inventoryVariances: [],
    };

    await exportAnalyticsToExcel(snapshot, filteredOrders, effectiveIngredientsForDate, filteredWastage, masterIngredients);
    onNotice?.(`✅ Generated official Excel workbook for ${dateLabel}!`);
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Mode Navigation Switcher: Daily Purchases Log vs Cost Settings (Master Defaults) */}
      <div className="bg-[#1E2B25] p-2 rounded-2xl border border-white/10 flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSubTab("daily_log")}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
              activeSubTab === "daily_log"
                ? "bg-[#F5E086] text-[#24332D] shadow-md"
                : "text-white/70 hover:text-white hover:bg-white/5"
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Daily Procurement & P&L Log</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSubTab("cost_settings")}
            className={`px-4 py-2.5 rounded-xl font-bold text-xs sm:text-sm flex items-center gap-2 transition ${
              activeSubTab === "cost_settings"
                ? "bg-[#F5E086] text-[#24332D] shadow-md"
                : "text-white/70 hover:text-white hover:bg-white/5"
            }`}
          >
            <Settings className="w-4 h-4" />
            <span>Cost Settings & Master Defaults ({masterIngredients.length})</span>
          </button>
        </div>

        <button
          type="button"
          onClick={handleExportExcel}
          className="px-4 py-2 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/40 text-emerald-300 border border-emerald-500/40 text-xs font-bold transition flex items-center gap-2"
        >
          <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          <span className="hidden sm:inline">Export Official Excel</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SUB-TAB 1: DAILY PROCUREMENT & P&L LOG                                    */}
      {/* ========================================================================= */}
      {activeSubTab === "daily_log" && (
        <div className="space-y-6">
          {/* Top Filter & Date Controller */}
          <div className="bg-[#1E2B25] p-5 rounded-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#F5E086] text-[#24332D] flex items-center justify-center font-bold">
                  <ShoppingBag className="w-4 h-4" />
                </div>
                <h3 className="font-niea font-bold text-lg text-[#F5E086]">
                  Daily Ingredients, Breads, Cost & Wastage
                </h3>
              </div>
              <p className="text-xs text-white/60 mt-1">
                Records daily purchases of breads, cheeses, and produce. Defaults are pre-filled from your Cost Settings if no manual log is given.
              </p>
            </div>

            {/* Date Selector Controls */}
            <div className="flex flex-wrap items-center gap-2.5">
              <div className="bg-[#17221D] p-1 rounded-xl border border-white/10 flex items-center gap-1 text-xs">
                <button
                  type="button"
                  onClick={() => setDateMode("single")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    dateMode === "single" ? "bg-[#F5E086] text-[#24332D]" : "text-white/60 hover:text-white"
                  }`}
                >
                  Single Date
                </button>
                <button
                  type="button"
                  onClick={() => setDateMode("range")}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    dateMode === "range" ? "bg-[#F5E086] text-[#24332D]" : "text-white/60 hover:text-white"
                  }`}
                >
                  Date Range
                </button>
              </div>

              <div className="flex items-center gap-2 bg-[#17221D] px-3 py-2 rounded-xl border border-white/10">
                <Calendar className="w-4 h-4 text-[#F5E086]" />
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="bg-transparent text-white text-xs font-mono font-bold focus:outline-none"
                />
                {dateMode === "range" && (
                  <>
                    <span className="text-white/40 text-xs">to</span>
                    <input
                      type="date"
                      value={dateRangeEnd}
                      onChange={(e) => setDateRangeEnd(e.target.value)}
                      className="bg-transparent text-white text-xs font-mono font-bold focus:outline-none"
                    />
                  </>
                )}
              </div>
            </div>
          </div>

          {/* ACTIVE STATUS BANNER: Defaults Active vs Manual Log */}
          {dateMode === "single" && (
            <div
              className={`p-4 rounded-2xl border flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                isUsingDefaultsForDate
                  ? "bg-amber-500/10 border-amber-400/30 text-amber-200"
                  : "bg-emerald-500/10 border-emerald-400/30 text-emerald-200"
              }`}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold ${
                    isUsingDefaultsForDate ? "bg-amber-400/20 text-amber-300" : "bg-emerald-400/20 text-emerald-300"
                  }`}
                >
                  {isUsingDefaultsForDate ? <Clock className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                </div>
                <div>
                  <h4 className="font-bold text-sm">
                    {isUsingDefaultsForDate
                      ? `Default Cost Settings Active for ${selectedDate}`
                      : `Verified Manual Procurement Log for ${selectedDate}`}
                  </h4>
                  <p className="text-xs opacity-80">
                    {isUsingDefaultsForDate
                      ? "No manual procurement was logged today. Showing baseline defaults from Cost Settings. Any edits will update today's log and save as your new default for future days."
                      : `${directEntriesForDate.length} verified item purchase records saved for this date.`}
                  </p>
                </div>
              </div>

              {isUsingDefaultsForDate && (
                <button
                  type="button"
                  onClick={handleInstantiateDefaultsForDate}
                  className="px-3.5 py-2 rounded-xl bg-amber-400 text-[#24332D] text-xs font-black hover:bg-amber-300 transition flex items-center gap-1.5 self-start sm:self-auto shadow-md"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Save Defaults as Official Day Log</span>
                </button>
              )}
            </div>
          )}

          {/* REAL FINANCIAL METRICS KPI CARDS (SYNCED WITH PETPOOJA ANALYTICS) */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
            <div className="bg-[#1E2B25] p-4 rounded-2xl border border-white/10">
              <span className="text-[11px] font-bold text-white/50 block uppercase tracking-wider">Gross Billed Sales</span>
              <span className="font-niea font-bold text-2xl text-white mt-1 block">₹{totalGrossSales.toLocaleString("en-IN")}</span>
              <span className="text-[10px] text-white/40 block mt-0.5">{filteredOrders.length} tickets settled</span>
            </div>

            <div className="bg-[#1E2B25] p-4 rounded-2xl border border-rose-400/20">
              <span className="text-[11px] font-bold text-rose-300 block uppercase tracking-wider">Raw Material Purchases (COGS)</span>
              <span className="font-niea font-bold text-2xl text-rose-300 mt-1 block">₹{totalIngredientCost.toLocaleString("en-IN")}</span>
              <span className="text-[10px] text-rose-300/60 block mt-0.5">
                {isUsingDefaultsForDate ? "From Cost Settings Defaults" : "From Verified Daily Log"}
              </span>
            </div>

            <div className="bg-[#1E2B25] p-4 rounded-2xl border border-amber-400/20">
              <span className="text-[11px] font-bold text-amber-300 block uppercase tracking-wider">Kitchen Wastage Loss</span>
              <span className="font-niea font-bold text-2xl text-amber-300 mt-1 block">₹{totalWastageLoss.toLocaleString("en-IN")}</span>
              <span className="text-[10px] text-amber-300/60 block mt-0.5">{filteredWastage.length} recorded waste entries</span>
            </div>

            <div className="bg-[#1E2B25] p-4 rounded-2xl border border-white/10">
              <span className="text-[11px] font-bold text-white/50 block uppercase tracking-wider">Operating Overheads ({overheadRate}%)</span>
              <span className="font-niea font-bold text-2xl text-white/90 mt-1 block">₹{overheadExpense.toLocaleString("en-IN")}</span>
              <span className="text-[10px] text-white/40 block mt-0.5">Kitchen staff, rent, power allocation</span>
            </div>

            <div className="col-span-2 lg:col-span-1 bg-gradient-to-br from-[#1E2B25] to-[#2B3D36] p-4 rounded-2xl border-2 border-[#10B981] shadow-lg">
              <span className="text-[11px] font-bold text-emerald-300 block uppercase tracking-wider">Net Operating Profit</span>
              <span className="font-niea font-black text-2xl text-emerald-400 mt-1 block">₹{realNetProfit.toLocaleString("en-IN")}</span>
              <span className="text-[10px] text-emerald-300/70 font-bold block mt-0.5">{profitMarginPercent}% Net Operating Margin</span>
            </div>
          </div>

          {/* INGREDIENTS PROCUREMENT LEDGER SECTION */}
          <div className="bg-[#24332D] p-5 rounded-2xl border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <h4 className="font-niea font-bold text-base text-[#F5E086] flex items-center gap-2">
                  <Package className="w-4 h-4 text-[#F5E086]" />
                  <span>
                    Raw Materials & Bread Purchases ({effectiveIngredientsForDate.length} Entries)
                  </span>
                </h4>
                <p className="text-xs text-white/60">
                  {dateMode === "single" ? `Active ingredients for ${selectedDate}` : `Procurement entries from ${selectedDate} to ${dateRangeEnd}`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleStartAdd}
                  className="px-3.5 py-1.5 rounded-xl bg-[#F5E086] hover:bg-[#F8E79B] text-[#24332D] text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-md"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>+ Add Ingredient</span>
                </button>
              </div>
            </div>

            {/* ADD / EDIT INGREDIENT FORM */}
            {isAddingIngredient && (
              <form onSubmit={handleSaveIngredient} className="p-4 rounded-2xl bg-[#1E2B25] border border-[#F5E086]/40 space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between border-b border-white/10 pb-2">
                  <span className="font-bold text-xs text-[#F5E086] flex items-center gap-2">
                    <Edit2 className="w-3.5 h-3.5" />
                    <span>{editingIngredient ? `Edit "${editingIngredient.name}"` : `Add New Ingredient for ${selectedDate}`}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingIngredient(false);
                      setEditingIngredient(null);
                    }}
                    className="p-1 text-white/40 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                  <div>
                    <label className="text-white/80 block mb-1">Ingredient / Bread Name *</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Sourdough Loaf / Aged Cheddar"
                      className="w-full bg-[#24332D] border border-white/15 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-[#F5E086]"
                    />
                  </div>

                  <div>
                    <label className="text-white/80 block mb-1">Category</label>
                    <select
                      value={formCategory}
                      onChange={(e) => setFormCategory(e.target.value as any)}
                      className="w-full bg-[#24332D] border border-white/15 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-[#F5E086]"
                    >
                      <option value="bread">Bakery & Breads</option>
                      <option value="dairy_cheese">Dairy & Cheeses</option>
                      <option value="vegetables">Fresh Produce & Veggies</option>
                      <option value="meat_fillings">Meat & Gourmet Fillings</option>
                      <option value="sauces_condiments">Sauces & Condiments</option>
                      <option value="packaging">Boxes & Thermal Packaging</option>
                      <option value="beverage_beans">Specialty Coffee Beans</option>
                    </select>
                  </div>

                  <div>
                    <label className="text-white/80 block mb-1">Purchased Quantity</label>
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        required
                        value={formQuantity}
                        onChange={(e) => setFormQuantity(Number(e.target.value))}
                        className="w-2/3 bg-[#24332D] border border-white/15 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-[#F5E086]"
                      />
                      <input
                        type="text"
                        required
                        value={formUnit}
                        onChange={(e) => setFormUnit(e.target.value)}
                        placeholder="kg / loaves"
                        className="w-1/3 bg-[#24332D] border border-white/15 rounded-xl px-2 py-1.5 text-white text-center focus:outline-none focus:border-[#F5E086]"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-white/80 block mb-1">Unit Price (₹ per unit)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      required
                      value={formUnitPrice}
                      onChange={(e) => setFormUnitPrice(Number(e.target.value))}
                      className="w-full bg-[#24332D] border border-white/15 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-[#F5E086]"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                  <div className="sm:col-span-2">
                    <label className="text-white/80 block mb-1">Supplier / Mandi Notes (Optional)</label>
                    <input
                      type="text"
                      value={formNotes}
                      onChange={(e) => setFormNotes(e.target.value)}
                      placeholder="e.g. Morning fresh delivery from New Town baker"
                      className="w-full bg-[#24332D] border border-white/15 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-[#F5E086]"
                    />
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-3 pt-4 sm:pt-0">
                    <div className="text-right">
                      <span className="text-[10px] text-white/50 block">Calculated Total</span>
                      <span className="font-mono font-bold text-sm text-[#F5E086]">
                        ₹{Number(formQuantity) * Number(formUnitPrice)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Auto-Sync with Cost Settings Toggle */}
                <div className="pt-2 border-t border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-white/80 select-none">
                    <input
                      type="checkbox"
                      checked={updateAsMasterDefault}
                      onChange={(e) => setUpdateAsMasterDefault(e.target.checked)}
                      className="w-4 h-4 rounded text-[#F5E086] accent-[#F5E086] cursor-pointer"
                    />
                    <span>
                      <strong className="text-[#F5E086]">Save as New Master Default in Cost Settings</strong>
                      <span className="block text-[11px] text-white/50">
                        Automatically applies this quantity ({formQuantity} {formUnit}) and price (₹{formUnitPrice}) as the default when no manual input is given on upcoming days.
                      </span>
                    </span>
                  </label>

                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    <button
                      type="button"
                      onClick={() => {
                        setIsAddingIngredient(false);
                        setEditingIngredient(null);
                      }}
                      className="px-3.5 py-1.5 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-1.5 rounded-xl bg-[#F5E086] text-[#24332D] font-bold hover:bg-[#F8E79B] transition flex items-center gap-1.5"
                    >
                      <Check className="w-3.5 h-3.5" />
                      <span>{editingIngredient ? "Save Changes & Update Default" : "Add to Log & Save Default"}</span>
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* Ingredients Table */}
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#1E2B25] text-white/70 font-semibold border-b border-white/10">
                    <th className="p-3">Date</th>
                    <th className="p-3">Item / Bread</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Quantity</th>
                    <th className="p-3 text-right">Unit Price</th>
                    <th className="p-3 text-right">Total Cost</th>
                    <th className="p-3">Supplier Notes</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {effectiveIngredientsForDate.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="p-6 text-center text-white/50">
                        No ingredient records logged for this period. Click "+ Add Ingredient" or load Master Cost Settings defaults.
                      </td>
                    </tr>
                  ) : (
                    effectiveIngredientsForDate.map((item) => (
                      <tr key={item.id} className="hover:bg-white/5 transition">
                        <td className="p-3 font-mono text-white/60">
                          {item.date}
                          {isUsingDefaultsForDate && (
                            <span className="ml-1.5 px-1.5 py-0.5 rounded bg-amber-400/20 text-amber-300 text-[9px] font-bold">
                              Default
                            </span>
                          )}
                        </td>
                        <td className="p-3 font-bold text-white">{item.name}</td>
                        <td className="p-3">
                          <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] uppercase font-semibold text-[#F5E086]">
                            {item.category.replace("_", " ")}
                          </span>
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-white">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="p-3 text-right font-mono text-white/70">₹{item.unitPrice}</td>
                        <td className="p-3 text-right font-mono font-bold text-rose-300">₹{item.totalCost}</td>
                        <td className="p-3 text-white/60 text-[11px] max-w-xs truncate">{item.supplierNotes || "—"}</td>
                        <td className="p-3 text-center">
                          <div className="flex items-center justify-center gap-1.5">
                            <button
                              type="button"
                              onClick={() => handleStartEdit(item)}
                              className="p-1 rounded-lg text-[#F5E086] hover:bg-white/10"
                              title="Edit ingredient & update default"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {!isUsingDefaultsForDate && (
                              <button
                                type="button"
                                onClick={() => handleDeleteIngredient(item.id, item.name)}
                                className="p-1 rounded-lg text-rose-400 hover:bg-white/10"
                                title="Delete entry"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {effectiveIngredientsForDate.length > 0 && (
                  <tfoot className="border-t-2 border-white/20 font-bold bg-[#1E2B25]">
                    <tr>
                      <td colSpan={5} className="p-3 text-right text-white">
                        Total Procurement Expense (COGS):
                      </td>
                      <td className="p-3 text-right text-rose-300 font-mono text-sm font-black">
                        ₹{totalIngredientCost.toLocaleString("en-IN")}
                      </td>
                      <td colSpan={2} className="p-3 text-xs text-white/40">
                        {isUsingDefaultsForDate ? "100% matched with Master Cost Settings" : "Verified against verified receipts"}
                      </td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>

          {/* DAILY WASTAGE & SCRAP LOSS TRACKER */}
          <div className="bg-[#24332D] p-5 rounded-2xl border border-white/10 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
              <div>
                <h4 className="font-niea font-bold text-base text-amber-300 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-400" />
                  <span>Daily Wastage, Prep Scraps & Loss Ledger</span>
                </h4>
                <p className="text-xs text-white/60">
                  Track stale bread slices, trimmed produce, or kitchen scrap to reflect true cost of goods. All newly added ingredients are selectable here.
                </p>
              </div>

              <button
                type="button"
                onClick={() => setIsAddingWastage(!isAddingWastage)}
                className="px-3.5 py-1.5 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-400/40 text-xs font-bold transition flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>+ Record Wastage</span>
              </button>
            </div>

            {/* Wastage Form with Auto-Select & Auto-Price Calculation */}
            {isAddingWastage && (
              <form onSubmit={handleSaveWastage} className="p-4 rounded-2xl bg-[#1E2B25] border border-amber-400/50 space-y-3 animate-in fade-in">
                <span className="font-bold text-xs text-amber-300 block">Record Wastage for {selectedDate}</span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                  <div className="lg:col-span-2">
                    <label className="text-white/80 block mb-1">Select Ingredient / Item *</label>
                    <div className="flex gap-2">
                      <select
                        onChange={(e) => handleSelectWastageItem(e.target.value)}
                        className="w-1/2 bg-[#24332D] border border-white/15 rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-400"
                        defaultValue=""
                      >
                        <option value="" disabled>-- Pick from Ingredients --</option>
                        {allKnownIngredientNames.map((name) => (
                          <option key={name} value={name}>{name}</option>
                        ))}
                      </select>
                      <input
                        type="text"
                        required
                        value={wastageItemName}
                        onChange={(e) => setWastageItemName(e.target.value)}
                        placeholder="Or custom item name"
                        className="w-1/2 bg-[#24332D] border border-white/15 rounded-xl px-2.5 py-1.5 text-white focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-white/80 block mb-1">Wasted Quantity & Unit</label>
                    <div className="flex gap-1.5">
                      <input
                        type="number"
                        min="0.1"
                        step="any"
                        required
                        value={wastageQuantity}
                        onChange={(e) => handleWastageQuantityChange(Number(e.target.value))}
                        className="w-2/3 bg-[#24332D] border border-white/15 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-amber-400"
                      />
                      <input
                        type="text"
                        required
                        value={wastageUnit}
                        onChange={(e) => setWastageUnit(e.target.value)}
                        placeholder="loaves / kg"
                        className="w-1/3 bg-[#24332D] border border-white/15 rounded-xl px-2 py-1.5 text-white text-center focus:outline-none focus:border-amber-400"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-white/80 block mb-1">Cost Loss (₹)</label>
                    <input
                      type="number"
                      min="0"
                      required
                      value={wastageCostLoss}
                      onChange={(e) => setWastageCostLoss(Number(e.target.value))}
                      className="w-full bg-[#24332D] border border-white/15 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-amber-400"
                    />
                  </div>

                  <div>
                    <label className="text-white/80 block mb-1">Scrap Reason</label>
                    <select
                      value={wastageReason}
                      onChange={(e) => setWastageReason(e.target.value as any)}
                      className="w-full bg-[#24332D] border border-white/15 rounded-xl px-3 py-1.5 text-white focus:outline-none focus:border-amber-400"
                    >
                      <option value="prep_scrap">Prep Scrap / Trimming</option>
                      <option value="expired">Expired / Stale Bake</option>
                      <option value="damaged">Damaged / Dropped</option>
                      <option value="overprepared">Overprepared Surplus</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsAddingWastage(false)}
                    className="px-3 py-1.5 rounded-xl bg-white/10 text-white font-medium hover:bg-white/20 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-amber-400 text-[#24332D] font-bold hover:bg-amber-300 transition"
                  >
                    Save Wastage Entry
                  </button>
                </div>
              </form>
            )}

            {/* Wastage Table */}
            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#1E2B25] text-white/70 font-semibold border-b border-white/10">
                    <th className="p-3">Date</th>
                    <th className="p-3">Wasted Item</th>
                    <th className="p-3 text-right">Quantity</th>
                    <th className="p-3 text-right">Cost Loss (₹)</th>
                    <th className="p-3">Reason / Scrap Type</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {filteredWastage.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="p-4 text-center text-white/40">
                        Zero wastage recorded for this date. Kitchen operation running at peak efficiency!
                      </td>
                    </tr>
                  ) : (
                    filteredWastage.map((item) => (
                      <tr key={item.id} className="hover:bg-white/5 transition">
                        <td className="p-3 font-mono text-white/60">{item.date}</td>
                        <td className="p-3 font-bold text-amber-200">{item.itemName}</td>
                        <td className="p-3 text-right font-mono font-bold text-white">
                          {item.quantity} {item.unit}
                        </td>
                        <td className="p-3 text-right font-mono font-bold text-rose-400">₹{item.costLoss}</td>
                        <td className="p-3 text-white/60 capitalize">{item.reason.replace("_", " ")}</td>
                        <td className="p-3 text-center">
                          <button
                            type="button"
                            onClick={() => handleDeleteWastage(item.id)}
                            className="p-1 rounded-lg text-rose-400 hover:bg-white/10"
                            title="Delete wastage"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
                {filteredWastage.length > 0 && (
                  <tfoot className="border-t border-white/10 font-bold bg-[#1E2B25]">
                    <tr>
                      <td colSpan={3} className="p-3 text-right text-white">Total Wastage Loss:</td>
                      <td className="p-3 text-right text-rose-400 font-mono font-bold text-sm">₹{totalWastageLoss}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                )}
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SUB-TAB 2: MASTER COST SETTINGS & DEFAULTS                                */}
      {/* ========================================================================= */}
      {activeSubTab === "cost_settings" && (
        <div className="space-y-6">
          {/* Header Card */}
          <div className="bg-[#1E2B25] p-5 rounded-2xl border border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[#F5E086] text-[#24332D] flex items-center justify-center font-bold">
                  <Settings className="w-4 h-4" />
                </div>
                <h3 className="font-niea font-bold text-lg text-[#F5E086]">
                  Master Cost Settings & Default Ingredient Baselines
                </h3>
              </div>
              <p className="text-xs text-white/60 mt-1">
                The default values and prices set here are automatically loaded if daily input is not provided by the owner. When you update a value in the daily log, it updates here as the new default.
              </p>
            </div>

            <button
              type="button"
              onClick={handleStartAddMaster}
              className="px-4 py-2 rounded-xl bg-[#F5E086] hover:bg-[#F8E79B] text-[#24332D] text-xs font-bold transition flex items-center gap-1.5 self-start md:self-auto shadow-md"
            >
              <Plus className="w-4 h-4" />
              <span>+ Add Master Ingredient</span>
            </button>
          </div>

          {/* Master Stats Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
            <div className="bg-[#1E2B25] p-4 rounded-2xl border border-white/10">
              <span className="text-[11px] font-bold text-white/50 block uppercase tracking-wider">Configured Master Ingredients</span>
              <span className="font-niea font-bold text-2xl text-white mt-1 block">{masterIngredients.length} Items</span>
              <span className="text-[10px] text-white/40 block mt-0.5">Breads, dairy, produce & packaging</span>
            </div>

            <div className="bg-[#1E2B25] p-4 rounded-2xl border border-[#F5E086]/20">
              <span className="text-[11px] font-bold text-[#F5E086] block uppercase tracking-wider">Default Daily Procurement Budget</span>
              <span className="font-niea font-bold text-2xl text-[#F5E086] mt-1 block">₹{totalDefaultDailyBudget.toLocaleString("en-IN")}</span>
              <span className="text-[10px] text-[#F5E086]/60 block mt-0.5">Applied when daily manual log is absent</span>
            </div>

            <div className="bg-[#1E2B25] p-4 rounded-2xl border border-white/10">
              <span className="text-[11px] font-bold text-white/50 block uppercase tracking-wider">Synchronization Status</span>
              <span className="font-niea font-bold text-2xl text-emerald-400 mt-1 block">100% Synced</span>
              <span className="text-[10px] text-white/40 block mt-0.5">Syncs with Analytics, Wastage & Excel</span>
            </div>
          </div>

          {/* Add / Edit Master Ingredient Form */}
          {isAddingMaster && (
            <form onSubmit={handleSaveMasterIngredient} className="p-5 rounded-2xl bg-[#1E2B25] border border-[#F5E086] space-y-4 animate-in fade-in">
              <div className="flex items-center justify-between border-b border-white/10 pb-2">
                <span className="font-bold text-sm text-[#F5E086] flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-[#F5E086]" />
                  <span>{editingMaster ? `Edit Master Default "${editingMaster.name}"` : "Add New Master Default Ingredient"}</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddingMaster(false);
                    setEditingMaster(null);
                  }}
                  className="p-1 text-white/40 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
                <div>
                  <label className="text-white/80 block mb-1">Ingredient Name *</label>
                  <input
                    type="text"
                    required
                    value={masterFormName}
                    onChange={(e) => setMasterFormName(e.target.value)}
                    placeholder="e.g. Sourdough Loaves"
                    className="w-full bg-[#24332D] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#F5E086]"
                  />
                </div>

                <div>
                  <label className="text-white/80 block mb-1">Category</label>
                  <select
                    value={masterFormCategory}
                    onChange={(e) => setMasterFormCategory(e.target.value as any)}
                    className="w-full bg-[#24332D] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#F5E086]"
                  >
                    <option value="bread">Bakery & Breads</option>
                    <option value="dairy_cheese">Dairy & Cheeses</option>
                    <option value="vegetables">Fresh Produce & Veggies</option>
                    <option value="meat_fillings">Meat & Gourmet Fillings</option>
                    <option value="sauces_condiments">Sauces & Condiments</option>
                    <option value="packaging">Boxes & Thermal Packaging</option>
                    <option value="beverage_beans">Specialty Coffee Beans</option>
                  </select>
                </div>

                <div>
                  <label className="text-white/80 block mb-1">Default Daily Quantity</label>
                  <div className="flex gap-1.5">
                    <input
                      type="number"
                      min="0.1"
                      step="any"
                      required
                      value={masterFormQuantity}
                      onChange={(e) => setMasterFormQuantity(Number(e.target.value))}
                      className="w-2/3 bg-[#24332D] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#F5E086]"
                    />
                    <input
                      type="text"
                      required
                      value={masterFormUnit}
                      onChange={(e) => setMasterFormUnit(e.target.value)}
                      placeholder="kg / loaves"
                      className="w-1/3 bg-[#24332D] border border-white/15 rounded-xl px-2 py-2 text-white text-center focus:outline-none focus:border-[#F5E086]"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-white/80 block mb-1">Default Unit Price (₹)</label>
                  <input
                    type="number"
                    min="0"
                    step="any"
                    required
                    value={masterFormUnitPrice}
                    onChange={(e) => setMasterFormUnitPrice(Number(e.target.value))}
                    className="w-full bg-[#24332D] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#F5E086]"
                  />
                </div>
              </div>

              <div>
                <label className="text-white/80 block mb-1 text-xs">Supplier / Sourcing Notes</label>
                <input
                  type="text"
                  value={masterFormNotes}
                  onChange={(e) => setMasterFormNotes(e.target.value)}
                  placeholder="e.g. Local New Town baker - cultured sourdough batch"
                  className="w-full bg-[#24332D] border border-white/15 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#F5E086]"
                />
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className="text-xs text-[#F5E086]">
                  Default Daily Cost: <strong>₹{Number(masterFormQuantity) * Number(masterFormUnitPrice)}</strong>
                </span>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingMaster(false);
                      setEditingMaster(null);
                    }}
                    className="px-3.5 py-1.5 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-1.5 rounded-xl bg-[#F5E086] text-[#24332D] text-xs font-bold hover:bg-[#F8E79B] transition"
                  >
                    {editingMaster ? "Save Master Default" : "Create Master Default"}
                  </button>
                </div>
              </div>
            </form>
          )}

          {/* Master Ingredients Table */}
          <div className="bg-[#24332D] p-5 rounded-2xl border border-white/10 space-y-3">
            <h4 className="font-niea font-bold text-base text-[#F5E086]">
              All Master Default Ingredients ({masterIngredients.length})
            </h4>

            <div className="overflow-x-auto rounded-xl border border-white/10">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-[#1E2B25] text-white/70 font-semibold border-b border-white/10">
                    <th className="p-3">Ingredient Name</th>
                    <th className="p-3">Category</th>
                    <th className="p-3 text-right">Default Daily Qty</th>
                    <th className="p-3 text-right">Default Price (₹)</th>
                    <th className="p-3 text-right">Daily Cost (₹)</th>
                    <th className="p-3">Supplier / Baker Notes</th>
                    <th className="p-3 text-center">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {masterIngredients.map((item) => (
                    <tr key={item.id} className="hover:bg-white/5 transition">
                      <td className="p-3 font-bold text-white">{item.name}</td>
                      <td className="p-3">
                        <span className="px-2 py-0.5 rounded-md bg-white/10 text-[10px] uppercase font-semibold text-[#F5E086]">
                          {item.category.replace("_", " ")}
                        </span>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-white">
                        {item.defaultQuantity} {item.defaultUnit}
                      </td>
                      <td className="p-3 text-right font-mono text-white/70">₹{item.defaultUnitPrice}</td>
                      <td className="p-3 text-right font-mono font-bold text-[#F5E086]">
                        ₹{item.defaultQuantity * item.defaultUnitPrice}
                      </td>
                      <td className="p-3 text-white/60 text-[11px] max-w-xs truncate">{item.supplierNotes || "—"}</td>
                      <td className="p-3 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => handleStartEditMaster(item)}
                            className="p-1 rounded-lg text-[#F5E086] hover:bg-white/10"
                            title="Edit Master Default"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDeleteMaster(item.id, item.name)}
                            className="p-1 rounded-lg text-rose-400 hover:bg-white/10"
                            title="Delete Master Default"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="border-t-2 border-white/20 font-bold bg-[#1E2B25]">
                  <tr>
                    <td colSpan={4} className="p-3 text-right text-white">Total Default Daily Procurement Budget:</td>
                    <td className="p-3 text-right text-[#F5E086] font-mono font-black text-sm">
                      ₹{totalDefaultDailyBudget.toLocaleString("en-IN")}
                    </td>
                    <td colSpan={2} className="p-3 text-xs text-white/40">
                      Applied each morning until custom daily entries are logged
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
