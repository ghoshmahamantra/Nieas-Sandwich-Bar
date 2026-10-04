// Types for Date Multi-Comparison and Menu Item Competition in NiEA POS Analytics

export interface HourlyTrajectoryPoint {
  hour: number;
  hourLabel: string;
  revenue: number;
  ordersCount: number;
}

export interface DateComparisonItem {
  date: string;              // YYYY-MM-DD
  formattedDate: string;     // e.g. "Wed, Sep 24, 2026"
  dayOfWeek: string;         // e.g. "Wednesday"
  shortLabel: string;        // e.g. "Sep 24"
  color: string;             // Distinct color for charts

  // Financials
  grossSales: number;
  netFoodSales: number;
  discountsGiven: number;
  taxesCollected: number;
  packagingCharges: number;
  cogs: number;
  grossProfit: number;
  grossMarginPercent: number;
  operatingExpenses: number;
  aggregatorFees: number;
  actualWastageLoss: number;
  netProfit: number;
  netProfitMarginPercent: number;

  // Order Volume & Quality
  totalOrders: number;
  successfulOrders: number;
  cancelledOrders: number;
  cancellationRate: number;
  avgOrderValue: number;

  // Payments Split
  upiSales: number;
  cashSales: number;
  cardSales: number;

  // Channel Split
  dineInRevenue: number;
  dineInCount: number;
  takeawayRevenue: number;
  takeawayCount: number;
  walkInRevenue: number;
  walkInCount: number;
  onlineAggregatorRevenue: number;
  onlineAggregatorCount: number;

  // Best Performer of the Day
  topItemName: string;
  topItemUnits: number;
  topItemRevenue: number;

  // Hourly curve (11 AM to 10 PM)
  hourlyTrajectory: HourlyTrajectoryPoint[];
}

export interface DateComparisonResult {
  dates: string[];
  items: DateComparisonItem[];

  // Champions
  highestRevenueDate: DateComparisonItem;
  highestNetProfitDate: DateComparisonItem;
  highestMarginDate: DateComparisonItem;
  highestOrdersDate: DateComparisonItem;
  highestAovDate: DateComparisonItem;
  lowestCancellationDate: DateComparisonItem;

  // Averages across the compared dates
  averageGrossSales: number;
  averageNetProfit: number;
  averageTotalOrders: number;
  averageAov: number;
  averageMarginPercent: number;
}

// -------------------------------------------------------------
// Menu Item Competition Structures
// -------------------------------------------------------------

export interface CompetingItemMetric {
  id: string;
  name: string;
  category: string;
  price: number;
  imageUrl?: string;
  isVeg: boolean;
  color: string;
  rank: number; // 1 to 5 based on units sold

  // Performance
  unitsSold: number;
  grossRevenue: number;
  cogsEstimated: number;
  grossProfit: number;
  profitMarginPercent: number;

  // Frequency
  ordersContainingItem: number;
  attachRatePercent: number; // % of orders containing this item
  avgUnitsPerOrder: number;

  // Channel breakdown
  dineInUnits: number;
  takeawayUnits: number;
  onlineAggregatorUnits: number;

  // Time slot breakdown
  morningUnits: number; // 8 - 11 AM
  lunchUnits: number;   // 12 - 3 PM
  eveningUnits: number; // 4 - 7 PM
  dinnerUnits: number;  // 8 - 10 PM
  peakTimeSlot: string;
}

export interface ItemCompetitionResult {
  itemIds: string[];
  items: CompetingItemMetric[];
  totalOrdersAnalyzed: number;
  totalCompetingUnits: number;
  totalCompetingRevenue: number;

  // Battle Champions
  volumeLeader: CompetingItemMetric;
  revenueLeader: CompetingItemMetric;
  profitLeader: CompetingItemMetric;
  attachRateLeader: CompetingItemMetric;
  marginPercentLeader: CompetingItemMetric;
}
