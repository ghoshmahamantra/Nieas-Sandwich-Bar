// Owner Configurable Cost & Operational Parameters
export interface OwnerFinanceConfig {
  cogsPercentage: number;          // Target Food Cost / COGS baseline (e.g., 31.5%)
  targetWastagePercent: number;    // Acceptable baseline wastage allowance (e.g., 3.5%)
  packagingFeePerTakeaway: number; // Packaging fee charged per takeaway / parcel in INR (e.g., 20)
  zomatoCommissionPercent: number; // Platform commission % for Zomato (e.g., 18%)
  swiggyCommissionPercent: number; // Platform commission % for Swiggy (e.g., 18%)
  gstTaxRatePercent: number;       // Goods & Services Tax % (e.g., 5.0%)
  overheadAllocationPercent: number; // Kitchen staff, power & utilities overhead % (e.g., 22%)
  
  // Real ingredient unit purchasing prices (in INR)
  ingredientUnitPrices: {
    sourdoughLoaf: number;         // per loaf
    shokupanLoaf: number;          // per loaf
    cheddarBlendKg: number;        // per KG
    specialtyArabicaKg: number;    // per KG
    hassAvocadosKg: number;        // per KG
    smokedChickenKg: number;       // per KG
    biodegradableBoxPiece: number; // per box
  };
}

export const DEFAULT_OWNER_FINANCE_CONFIG: OwnerFinanceConfig = {
  cogsPercentage: 31.5,
  targetWastagePercent: 4.0,
  packagingFeePerTakeaway: 20,
  zomatoCommissionPercent: 18.0,
  swiggyCommissionPercent: 18.0,
  gstTaxRatePercent: 5.0,
  overheadAllocationPercent: 22.0,
  ingredientUnitPrices: {
    sourdoughLoaf: 160,
    shokupanLoaf: 180,
    cheddarBlendKg: 520,
    specialtyArabicaKg: 980,
    hassAvocadosKg: 340,
    smokedChickenKg: 440,
    biodegradableBoxPiece: 14,
  },
};

const STORAGE_KEY = "niea_owner_finance_config_v1";

export function getStoredOwnerFinanceConfig(): OwnerFinanceConfig {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return { ...DEFAULT_OWNER_FINANCE_CONFIG, ...parsed };
    }
  } catch (e) {
    console.warn("Could not load owner finance config from localStorage", e);
  }
  return DEFAULT_OWNER_FINANCE_CONFIG;
}

export function saveStoredOwnerFinanceConfig(config: OwnerFinanceConfig) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (e) {
    console.error("Could not save owner finance config to localStorage", e);
  }
}

/**
 * Synchronize StoreFinancialSettings from Owner Portal into OwnerFinanceConfig
 */
export function syncFinancialSettingsToOwnerConfig(
  settings: {
    gstRatePercent?: number;
    packagingChargeTakeaway?: number;
    cogsPercentage?: number;
    overheadAllocationPercent?: number;
    targetWastagePercent?: number;
    zomatoCommissionPercent?: number;
    swiggyCommissionPercent?: number;
    advanceDepositAmount?: number;
  },
  existingConfig?: OwnerFinanceConfig
): OwnerFinanceConfig {
  const base = existingConfig || getStoredOwnerFinanceConfig();
  const updated: OwnerFinanceConfig = {
    ...base,
    gstTaxRatePercent: settings.gstRatePercent !== undefined ? settings.gstRatePercent : base.gstTaxRatePercent,
    packagingFeePerTakeaway: settings.packagingChargeTakeaway !== undefined ? settings.packagingChargeTakeaway : base.packagingFeePerTakeaway,
    cogsPercentage: settings.cogsPercentage !== undefined ? settings.cogsPercentage : base.cogsPercentage,
    overheadAllocationPercent: settings.overheadAllocationPercent !== undefined ? settings.overheadAllocationPercent : base.overheadAllocationPercent,
    targetWastagePercent: settings.targetWastagePercent !== undefined ? settings.targetWastagePercent : base.targetWastagePercent,
    zomatoCommissionPercent: settings.zomatoCommissionPercent !== undefined ? settings.zomatoCommissionPercent : base.zomatoCommissionPercent,
    swiggyCommissionPercent: settings.swiggyCommissionPercent !== undefined ? settings.swiggyCommissionPercent : base.swiggyCommissionPercent,
  };
  saveStoredOwnerFinanceConfig(updated);
  return updated;
}

