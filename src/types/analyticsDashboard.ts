// Enterprise Restaurant POS & Analytics Data Structures for NiEA Single Outlet
import { OwnerFinanceConfig } from "./ownerFinanceConfig";

export type AnalyticsTimeRangeType =
  | "today"
  | "weekly"
  | "monthly"
  | "this_month"
  | "custom";

export type CustomDateSelectionMode = "range" | "multi_dates" | "single";

export interface DateFilterState {
  type: AnalyticsTimeRangeType;
  customMode?: CustomDateSelectionMode;
  singleDate?: string;       // YYYY-MM-DD
  startDate?: string;        // YYYY-MM-DD
  endDate?: string;          // YYYY-MM-DD
  selectedDates?: string[];  // Array of individual YYYY-MM-DD dates selected together
}

// 1. Financial Performance Metrics
export interface FinancialMetrics {
  grossSales: number;          // Total billed before discounts & tax deductions
  discountsGiven: number;      // Total discounts & vouchers
  netFoodSales: number;        // Food & beverage revenue after discount
  taxesCollected: number;      // GST collected on F&B
  packagingCharges: number;    // Takeaway & delivery parcel fee collected
  deliveryFeesCollected: number;
  totalRevenue: number;        // Gross collections (Net + Tax + Packaging)
  cogs: number;                // Cost of Goods Sold based on configured baseline %
  grossProfit: number;         // Total Revenue - COGS
  operatingExpenses: number;   // Kitchen staff, utilities & rent allocation
  aggregatorPlatformFees: number; // Swiggy & Zomato commission deductions
  actualWastageLoss: number;   // Ingredient loss in INR from variances exceeding tolerance
  netProfit: number;           // Gross Profit - Operating Expenses - Aggregator Fees - Wastage Loss
  profitMarginPercent: number; // (Net Profit / Total Revenue) * 100
  avgOrderValue: number;       // Average bill size (AOV)
}

// 2. Order Volume & Accuracy
export interface OrderVolumeMetrics {
  totalOrders: number;
  successfulOrders: number;
  cancelledOrders: number;
  refundedOrders: number;
  totalRefundAmount: number;
  cancellationRate: number;    // Percentage
  activeOrders: number;
  avgKitchenPrepTimeMin: number;
}

// 3. Channel Breakdown (Dine-in, Takeaway, Website, Aggregators)
export interface ChannelBreakdownItem {
  id: "dine_in" | "takeaway" | "walk_in" | "website" | "zomato" | "swiggy";
  label: string;
  ordersCount: number;
  revenue: number;
  percentage: number;
  color: string;
}

// 4. Payment Modes Breakdown (Cash, UPI, Card, Wallets)
export interface PaymentModeItem {
  id: "upi" | "cash" | "card" | "wallet";
  label: string;
  ordersCount: number;
  amount: number;
  percentage: number;
  color: string;
}

// 5. Time Series Point for Recharts
export interface TimeSeriesPoint {
  key: string;
  label: string;
  subLabel?: string;
  dateStr: string;
  revenue: number;
  netSales: number;
  ordersCount: number;
  successfulCount: number;
  cancelledCount: number;
  upiSales: number;
  cashSales: number;
  cardSales: number;
  dineInCount: number;
  takeawayCount: number;
  onlineCount: number;
  avgOrderValue: number;
}

// 6. Histogram Bucket for Ticket Size Distribution
export interface HistogramBucket {
  rangeLabel: string;
  min: number;
  max: number;
  orderCount: number;
  totalRevenue: number;
  percentage: number;
}

// 7. Pareto Point (80/20 rule: Descending values + Cumulative %)
export interface ParetoPoint {
  label: string;
  revenue: number;
  ordersCount: number;
  cumulativeRevenue: number;
  cumulativePercent: number; // 0 to 100
}

// 8. Radar Metric Point (360-degree store performance vectors)
export interface RadarMetricPoint {
  subject: string;
  value: number; // normalized 0 to 100
  actualValue: string;
  benchmark: number;
}

// 9. Menu Item Performance (Top Selling & Slow Moving)
export interface MenuItemMetric {
  id: string;
  name: string;
  category: string;
  unitsSold: number;
  revenue: number;
  cogsPerUnit: number;
  marginPercent: number;
  velocityStatus: "star" | "popular" | "slow_moving" | "dead_stock";
  stockLeft: number;
}

// 10. Inventory & Recipe Variance / Wastage
export interface InventoryVarianceRecord {
  id: string;
  ingredientName: string;
  category: "Bakery/Bread" | "Dairy/Cheese" | "Specialty Coffee" | "Produce/Meat" | "Packaging";
  unit: string;
  theoreticalUsage: number; // Recipe standard BOM
  actualUsage: number;      // Actual inventory drawn
  varianceQuantity: number; // Difference
  variancePercent: number;
  wastageCost: number;      // Loss in INR
  status: "normal" | "warning" | "critical";
  lastAudited: string;
}

// Complete Master Dashboard Analytics Snapshot Payload
export interface EnterpriseAnalyticsSnapshot {
  filter: DateFilterState;
  periodLabel: string;
  outletName: string;
  isSingleDay: boolean;
  ownerConfig: OwnerFinanceConfig;
  financials: FinancialMetrics;
  orderVolume: OrderVolumeMetrics;
  channels: ChannelBreakdownItem[];
  paymentModes: PaymentModeItem[];
  timeSeries: TimeSeriesPoint[];
  histogramData: HistogramBucket[];
  paretoData: ParetoPoint[];
  radarData: RadarMetricPoint[];
  topSellingItems: MenuItemMetric[];
  slowMovingItems: MenuItemMetric[];
  inventoryVariances: InventoryVarianceRecord[];
}
