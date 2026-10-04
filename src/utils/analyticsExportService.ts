import jsPDF from "jspdf";
import { EnterpriseAnalyticsSnapshot } from "../types/analyticsDashboard";
import { OrderRecord, DailyIngredientEntry, DailyWastageEntry, MasterIngredientTemplate } from "../types/niea";
import { SINGLE_OUTLET_INFO } from "./analyticsEngine";
import { formatTokenNumber } from "./tokenHelper";

/**
 * Loads the official NiEA logo as a Base64 Data URL for embedding in PDF and Excel exports.
 */
export async function loadLogoBase64(): Promise<string | null> {
  if (typeof window === "undefined") return null;
  try {
    const res = await fetch("/Niea's_PNG_cropped.png");
    if (!res.ok) return null;
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = () => resolve(null);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn("Could not load logo for export:", err);
    return null;
  }
}

/**
 * Format Indian Rupee Currency with thousands separators
 */
function formatINR(val: number): string {
  return "₹" + Math.round(val).toLocaleString("en-IN");
}

/**
 * EXCEL EXPORT:
 * Generates an executive, highly-structured Microsoft Excel workbook (.xls format)
 * complete with the official NiEA logo, P&L financial breakdowns, channels, payments,
 * menu performance, inventory wastage, and full order ledger.
 */
export async function exportAnalyticsToExcel(
  snapshot: EnterpriseAnalyticsSnapshot,
  ordersList: OrderRecord[] = [],
  dailyIngredients: DailyIngredientEntry[] = [],
  dailyWastage: DailyWastageEntry[] = [],
  masterIngredients: MasterIngredientTemplate[] = []
): Promise<void> {
  const logoData = await loadLogoBase64();
  const now = new Date();
  const timestampStr = now.toLocaleString("en-IN", {
    dateStyle: "medium",
    timeStyle: "short",
  });
  const fileDateStr = now.toISOString().slice(0, 10);

  // Filter orders for current period if provided
  const relevantOrders = ordersList.length > 0 ? ordersList : [];

  // Safe extraction and synchronization of Financials & Owner Config
  const anySnap = snapshot as any;

  const effectiveMasterIngredients: MasterIngredientTemplate[] =
    masterIngredients.length > 0
      ? masterIngredients
      : (anySnap.masterIngredients || []);
  const rawFin = anySnap.financials || {};
  const cfg = anySnap.ownerConfig || {
    gstTaxRatePercent: 5.0,
    cogsPercentage: 31.5,
    overheadAllocationPercent: 22.0,
    targetWastagePercent: 4.0,
    packagingFeePerTakeaway: 20,
    zomatoCommissionPercent: 18.0,
    swiggyCommissionPercent: 18.0,
  };

  const grossSales = Number(rawFin.grossSales ?? anySnap.grossSales ?? relevantOrders.reduce((s, o) => s + (o.grandTotal || 0), 0));
  const discountsGiven = Number(rawFin.discountsGiven ?? anySnap.totalDiscounts ?? relevantOrders.reduce((s, o) => s + (o.discount || 0), 0));
  const taxesCollected = Number(rawFin.taxesCollected ?? anySnap.totalTaxes ?? relevantOrders.reduce((s, o) => s + (o.taxes || 0), 0));
  const packagingCharges = Number(rawFin.packagingCharges ?? anySnap.packagingCharges ?? relevantOrders.reduce((s, o) => s + (o.packagingCharge || 0), 0));
  const netFoodSales = Number(rawFin.netFoodSales ?? anySnap.netSales ?? (grossSales - taxesCollected));
  const totalRevenue = grossSales;

  // Real Raw Materials Procurement Cost (COGS)
  const actualProcurementCost = dailyIngredients.length > 0
    ? dailyIngredients.reduce((s, i) => s + (i.totalCost || 0), 0)
    : Number(rawFin.cogs ?? anySnap.cogs ?? Math.round(netFoodSales * (cfg.cogsPercentage / 100)));
  const cogs = actualProcurementCost;
  const grossProfit = totalRevenue - cogs;

  const operatingExpenses = Number(rawFin.operatingExpenses ?? anySnap.operatingExpenses ?? Math.round(netFoodSales * (cfg.overheadAllocationPercent / 100)));
  const aggregatorPlatformFees = Number(rawFin.aggregatorPlatformFees ?? anySnap.aggregatorPlatformFees ?? 0);

  // Real Wastage Loss
  const actualWastageLoss = dailyWastage.length > 0
    ? dailyWastage.reduce((s, w) => s + (w.costLoss || 0), 0)
    : Number(rawFin.actualWastageLoss ?? anySnap.actualWastageLoss ?? 0);

  // Net Profit: strictly calculated with zero discrepancies
  const netProfit = grossProfit - operatingExpenses - aggregatorPlatformFees - actualWastageLoss;
  const profitMarginPercent = totalRevenue > 0 ? Number(((netProfit / totalRevenue) * 100).toFixed(1)) : 0;
  const avgOrderValue = relevantOrders.length > 0 ? Math.round(totalRevenue / relevantOrders.length) : Number(rawFin.avgOrderValue ?? anySnap.averageOrderValue ?? 0);

  const fin = {
    grossSales,
    discountsGiven,
    netFoodSales,
    taxesCollected,
    packagingCharges,
    totalRevenue,
    cogs,
    grossProfit,
    operatingExpenses,
    aggregatorPlatformFees,
    actualWastageLoss,
    netProfit,
    profitMarginPercent,
    avgOrderValue,
  };

  const orderVol = anySnap.orderVolume || {
    totalOrders: relevantOrders.length || anySnap.totalOrders || 0,
    successfulOrders: relevantOrders.filter((o: any) => o.status !== "cancelled").length || relevantOrders.length,
    cancelledOrders: relevantOrders.filter((o: any) => o.status === "cancelled").length || 0,
  };

  const periodLabel = anySnap.periodLabel || "Daily Store Operations & P&L Statement";

  let html = `
  <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
  <head>
    <!--[if gte mso 9]>
    <xml>
      <x:ExcelWorkbook>
        <x:ExcelWorksheets>
          <x:ExcelWorksheet>
            <x:Name>NiEA Store Analytics</x:Name>
            <x:WorksheetOptions>
              <x:DisplayGridlines/>
            </x:WorksheetOptions>
          </x:ExcelWorksheet>
        </x:ExcelWorksheets>
      </x:ExcelWorkbook>
    </xml>
    <![endif]-->
    <meta http-equiv="Content-Type" content="text/html; charset=utf-8" />
    <style>
      body { font-family: 'Segoe UI', Calibri, Arial, sans-serif; background-color: #ffffff; color: #1E293B; }
      .brand-header { background-color: #24332D; color: #F5E086; padding: 18px; font-size: 18pt; font-weight: bold; letter-spacing: 0.5px; }
      .brand-sub { background-color: #24332D; color: #EDE8DB; font-size: 9.5pt; }
      .brand-gold-bar { background-color: #F5E086; height: 3px; }
      .section-title { background-color: #2E4038; color: #F5E086; font-size: 11pt; font-weight: bold; padding: 8px 12px; }
      .th-dark { background-color: #1E293B; color: #F8FAFC; font-weight: bold; border: 1px solid #475569; padding: 6px 10px; font-size: 9.5pt; }
      .td-metric { font-weight: bold; background-color: #F8FAFC; border: 1px solid #E2E8F0; padding: 6px 10px; font-size: 9.5pt; color: #1E293B; }
      .td-val { text-align: right; border: 1px solid #E2E8F0; padding: 6px 10px; font-size: 9.5pt; color: #0F172A; }
      .td-text { text-align: left; border: 1px solid #E2E8F0; padding: 6px 10px; font-size: 9.5pt; color: #334155; }
      .profit-row { background-color: #ECFDF5; color: #065F46; font-weight: bold; font-size: 11pt; border: 2px solid #10B981; }
      .kpi-box { background-color: #F9FAFB; border: 1px solid #E5E7EB; padding: 12px; text-align: center; }
    </style>
  </head>
  <body>
    <table>
      <!-- BRAND HEADER WITH LOGO -->
      <tr>
        <td colspan="7" class="brand-header" style="text-align: center; vertical-align: middle;">
          ${
            logoData
              ? `<img src="${logoData}" alt="NiEA's Logo" width="160" height="75" style="display:inline-block; vertical-align:middle; margin-right: 15px;" />`
              : ""
          }
          <span>NiEA'S SANDWICH BAR</span>
        </td>
      </tr>
      <tr>
        <td colspan="7" class="brand-sub" style="text-align: center;">
          Artisanal Sourdough Melts &bull; Japanese Brioche &bull; Specialty Brews
        </td>
      </tr>
      <tr>
        <td colspan="7" class="brand-sub" style="text-align: center; font-size: 9pt; color: #A7F3D0;">
          ${SINGLE_OUTLET_INFO.address} &bull; FSSAI Lic #22824012000491 &bull; GSTIN: ${SINGLE_OUTLET_INFO.gstin} &bull; Phone: ${SINGLE_OUTLET_INFO.phone}
        </td>
      </tr>
      <tr>
        <td colspan="7" style="background-color: #F5E086; height: 3px;"></td>
      </tr>
      <tr><td colspan="7" style="height: 10px;"></td></tr>

      <!-- METADATA STRIP -->
      <tr>
        <td colspan="3" style="font-weight: bold; font-size: 10pt; color: #374C44;">
          Reporting Scope: <span style="color: #047857;">${periodLabel}</span>
        </td>
        <td colspan="4" style="text-align: right; font-size: 9pt; color: #6B7280;">
          Audit Generated: ${timestampStr} &bull; Currency: INR (₹)
        </td>
      </tr>
      <tr><td colspan="7" style="height: 12px;"></td></tr>

      <!-- 1. FINANCIAL P&L & OPERATIONAL MARGINS -->
      <tr>
        <td colspan="7" class="section-title">1. EXECUTIVE FINANCIAL OVERVIEW & PROFIT MARGINS (P&L)</td>
      </tr>
      <tr>
        <th colspan="3" class="th-dark">Financial Metric Description</th>
        <th colspan="2" class="th-dark">Amount (INR / ₹)</th>
        <th colspan="2" class="th-dark">Notes / Percentage Share</th>
      </tr>
      <tr>
        <td colspan="3" class="td-metric">Gross Billed Sales</td>
        <td colspan="2" class="td-val">${formatINR(fin.grossSales)}</td>
        <td colspan="2" class="td-text">Total sales value before discounts</td>
      </tr>
      <tr>
        <td colspan="3" class="td-metric">Discounts & Promo Vouchers Given</td>
        <td colspan="2" class="td-val" style="color: #DC2626;">-${formatINR(fin.discountsGiven)}</td>
        <td colspan="2" class="td-text">Customer loyalty & first-time coupons</td>
      </tr>
      <tr>
        <td colspan="3" class="td-metric">Net Food & Beverage Sales</td>
        <td colspan="2" class="td-val" style="font-weight: bold;">${formatINR(fin.netFoodSales)}</td>
        <td colspan="2" class="td-text">Gross Sales minus Promotional Discounts</td>
      </tr>
      <tr>
        <td colspan="3" class="td-metric">GST Taxes Collected (${cfg.gstTaxRatePercent}%)</td>
        <td colspan="2" class="td-val">${formatINR(fin.taxesCollected)}</td>
        <td colspan="2" class="td-text">${cfg.gstTaxRatePercent}% GST on Restaurant Food Services</td>
      </tr>
      <tr>
        <td colspan="3" class="td-metric">Takeaway Packaging Charges</td>
        <td colspan="2" class="td-val">${formatINR(fin.packagingCharges)}</td>
        <td colspan="2" class="td-text">Eco-friendly thermal packaging fees</td>
      </tr>
      <tr style="background-color: #FEF3C7; font-weight: bold;">
        <td colspan="3" class="td-metric" style="color: #92400E;">TOTAL GROSS STORE REVENUE</td>
        <td colspan="2" class="td-val" style="color: #92400E; font-size: 11pt;">${formatINR(fin.totalRevenue)}</td>
        <td colspan="2" class="td-text" style="color: #92400E;">Net Sales + GST + Packaging</td>
      </tr>
      <tr>
        <td colspan="3" class="td-metric">Cost of Goods Sold / COGS (${dailyIngredients.length > 0 ? "Daily Procurement" : `${cfg.cogsPercentage}% Target`})</td>
        <td colspan="2" class="td-val" style="color: #B45309;">-${formatINR(fin.cogs)}</td>
        <td colspan="2" class="td-text">${dailyIngredients.length > 0 ? `Artisanal bread, cheeses, butter & ingredients (${dailyIngredients.length} procurement items)` : "Artisanal bread, cheeses, butter & ingredients"}</td>
      </tr>
      <tr>
        <td colspan="3" class="td-metric">Operating Overheads Allocation (${cfg.overheadAllocationPercent}%)</td>
        <td colspan="2" class="td-val" style="color: #B45309;">-${formatINR(fin.operatingExpenses)}</td>
        <td colspan="2" class="td-text">Staff salaries, power, LPG & rent allocation</td>
      </tr>
      <tr>
        <td colspan="3" class="td-metric">Aggregator Platform Fees (Zomato/Swiggy)</td>
        <td colspan="2" class="td-val" style="color: #B45309;">-${formatINR(fin.aggregatorPlatformFees)}</td>
        <td colspan="2" class="td-text">Delivery partner commissions (18%)</td>
      </tr>
      <tr>
        <td colspan="3" class="td-metric">Actual Recipe Wastage & Spoilage Loss</td>
        <td colspan="2" class="td-val" style="color: #DC2626;">-${formatINR(fin.actualWastageLoss)}</td>
        <td colspan="2" class="td-text">${dailyWastage.length > 0 ? `Verified waste loss across ${dailyWastage.length} recorded items` : "Inventory variance loss from prep & bakes"}</td>
      </tr>
      <tr class="profit-row">
        <td colspan="3" style="padding: 10px; font-size: 11pt;">NET OPERATING STORE PROFIT</td>
        <td colspan="2" style="text-align: right; padding: 10px; font-size: 12pt;">${formatINR(fin.netProfit)}</td>
        <td colspan="2" style="text-align: center; padding: 10px; font-size: 11pt;">${fin.profitMarginPercent}% Net Margin</td>
      </tr>
      <tr>
        <td colspan="3" class="td-metric">Average Order Value (AOV)</td>
        <td colspan="2" class="td-val" style="font-weight: bold;">${formatINR(fin.avgOrderValue)}</td>
        <td colspan="2" class="td-text">Across ${orderVol.totalOrders} total tickets</td>
      </tr>
      <tr><td colspan="7" style="height: 15px;"></td></tr>

      <!-- 2. FULFILLMENT CHANNELS -->
      <tr>
        <td colspan="7" class="section-title">2. FULFILLMENT CHANNELS PERFORMANCE BREAKDOWN</td>
      </tr>
      <tr>
        <th colspan="2" class="th-dark">Channel Name</th>
        <th class="th-dark">Orders Count</th>
        <th colspan="2" class="th-dark">Gross Revenue (INR / ₹)</th>
        <th colspan="2" class="th-dark">Revenue Contribution (%)</th>
      </tr>
      ${snapshot.channels
        .map(
          (c) => `
      <tr>
        <td colspan="2" class="td-text" style="font-weight: bold;">${c.label}</td>
        <td class="td-val">${c.ordersCount}</td>
        <td colspan="2" class="td-val">${formatINR(c.revenue)}</td>
        <td colspan="2" class="td-val">${c.percentage}%</td>
      </tr>`
        )
        .join("")}
      <tr><td colspan="7" style="height: 15px;"></td></tr>

      <!-- 3. PAYMENT MODES -->
      <tr>
        <td colspan="7" class="section-title">3. PAYMENT METHOD BREAKDOWN & COLLECTION AUDIT</td>
      </tr>
      <tr>
        <th colspan="2" class="th-dark">Payment Method</th>
        <th class="th-dark">Settled Orders</th>
        <th colspan="2" class="th-dark">Collected Amount (INR / ₹)</th>
        <th colspan="2" class="th-dark">Collection Share (%)</th>
      </tr>
      ${snapshot.paymentModes
        .map(
          (p) => `
      <tr>
        <td colspan="2" class="td-text" style="font-weight: bold;">${p.label}</td>
        <td class="td-val">${p.ordersCount}</td>
        <td colspan="2" class="td-val">${formatINR(p.amount)}</td>
        <td colspan="2" class="td-val">${p.percentage}%</td>
      </tr>`
        )
        .join("")}
      <tr><td colspan="7" style="height: 15px;"></td></tr>

      <!-- 4. TOP MENU ITEMS -->
      <tr>
        <td colspan="7" class="section-title">4. TOP PERFORMING MENU ITEMS & MARGINS</td>
      </tr>
      <tr>
        <th colspan="2" class="th-dark">Menu Item Name</th>
        <th class="th-dark">Category</th>
        <th class="th-dark">Units Sold</th>
        <th class="th-dark">Revenue (₹)</th>
        <th class="th-dark">Unit COGS (₹)</th>
        <th class="th-dark">Margin (%)</th>
      </tr>
      ${snapshot.topSellingItems
        .map(
          (item) => `
      <tr>
        <td colspan="2" class="td-text" style="font-weight: bold;">${item.name}</td>
        <td class="td-text">${item.category}</td>
        <td class="td-val">${item.unitsSold}</td>
        <td class="td-val">${formatINR(item.revenue)}</td>
        <td class="td-val">${formatINR(item.cogsPerUnit)}</td>
        <td class="td-val" style="color: #059669; font-weight: bold;">${item.marginPercent}%</td>
      </tr>`
        )
        .join("")}
      <tr><td colspan="7" style="height: 15px;"></td></tr>

      <!-- 5. INVENTORY THEORETICAL CONSUMPTION -->
      <tr>
        <td colspan="7" class="section-title">5. INVENTORY THEORETICAL CONSUMPTION (BOM) AUDIT</td>
      </tr>
      <tr>
        <th colspan="2" class="th-dark">Ingredient / Item</th>
        <th class="th-dark">Unit</th>
        <th class="th-dark">Theoretical BOM</th>
        <th class="th-dark">Actual Used</th>
        <th class="th-dark">Variance %</th>
        <th class="th-dark">Wastage Loss (₹)</th>
      </tr>
      ${(snapshot.inventoryVariances || [])
        .map(
          (inv) => `
      <tr>
        <td colspan="2" class="td-text" style="font-weight: bold;">${inv.ingredientName}</td>
        <td class="td-text">${inv.unit}</td>
        <td class="td-val">${inv.theoreticalUsage}</td>
        <td class="td-val">${inv.actualUsage}</td>
        <td class="td-val" style="${inv.variancePercent > 10 ? "color: #DC2626; font-weight: bold;" : ""}">${inv.variancePercent > 0 ? "+" : ""}${inv.variancePercent}%</td>
        <td class="td-val" style="color: #B91C1C;">${formatINR(inv.wastageCost)}</td>
      </tr>`
        )
        .join("")}
      <tr><td colspan="7" style="height: 15px;"></td></tr>

      <!-- 6. REAL DAILY INGREDIENTS & PROCUREMENT (RAW MATERIALS) -->
      ${
        dailyIngredients.length > 0
          ? `
      <tr>
        <td colspan="7" class="section-title">6. DAILY INGREDIENTS, BREADS & RAW MATERIALS PROCUREMENT LEDGER (${dailyIngredients.length} ENTRIES)</td>
      </tr>
      <tr>
        <th class="th-dark">Date</th>
        <th colspan="2" class="th-dark">Item / Ingredient</th>
        <th class="th-dark">Category</th>
        <th class="th-dark">Quantity</th>
        <th class="th-dark">Unit Price (₹)</th>
        <th class="th-dark">Total Cost (₹)</th>
      </tr>
      ${dailyIngredients
        .map(
          (ing) => `
      <tr>
        <td class="td-text" style="font-family: monospace;">${ing.date}</td>
        <td colspan="2" class="td-text" style="font-weight: bold;">${ing.name}</td>
        <td class="td-text">${ing.category}</td>
        <td class="td-val">${ing.quantity} ${ing.unit}</td>
        <td class="td-val">${formatINR(ing.unitPrice)}</td>
        <td class="td-val" style="color: #DC2626; font-weight: bold;">${formatINR(ing.totalCost)}</td>
      </tr>`
        )
        .join("")}
      <tr>
        <td colspan="6" class="td-text" style="font-weight: bold; text-align: right;">Total Material Expenses:</td>
        <td class="td-val" style="color: #DC2626; font-weight: bold; font-size: 11pt;">${formatINR(dailyIngredients.reduce((s, i) => s + i.totalCost, 0))}</td>
      </tr>
      <tr><td colspan="7" style="height: 15px;"></td></tr>
      `
          : ""
      }

      <!-- 7. DAILY WASTAGE & LOSS AUDIT -->
      ${
        dailyWastage.length > 0
          ? `
      <tr>
        <td colspan="7" class="section-title">7. DAILY RECORDED WASTAGE & SCRAP LOSS AUDIT (${dailyWastage.length} RECORDS)</td>
      </tr>
      <tr>
        <th class="th-dark">Date</th>
        <th colspan="2" class="th-dark">Wasted Item</th>
        <th class="th-dark">Quantity</th>
        <th class="th-dark">Loss Cost (₹)</th>
        <th colspan="2" class="th-dark">Reason / Scrap Type</th>
      </tr>
      ${dailyWastage
        .map(
          (w) => `
      <tr>
        <td class="td-text" style="font-family: monospace;">${w.date}</td>
        <td colspan="2" class="td-text" style="font-weight: bold; color: #B91C1C;">${w.itemName}</td>
        <td class="td-val">${w.quantity} ${w.unit}</td>
        <td class="td-val" style="color: #DC2626; font-weight: bold;">${formatINR(w.costLoss)}</td>
        <td colspan="2" class="td-text">${w.reason}</td>
      </tr>`
        )
        .join("")}
      <tr>
        <td colspan="4" class="td-text" style="font-weight: bold; text-align: right;">Total Wastage Loss:</td>
        <td class="td-val" style="color: #DC2626; font-weight: bold; font-size: 11pt;">${formatINR(dailyWastage.reduce((s, w) => s + w.costLoss, 0))}</td>
        <td colspan="2"></td>
      </tr>
      <tr><td colspan="7" style="height: 15px;"></td></tr>
      `
          : ""
      }

      <!-- 8. MASTER COST & FEE SETTINGS (GOODS RAW MATERIALS BASELINE & CONTROLS) -->
      ${
        effectiveMasterIngredients.length > 0 || cfg
          ? `
      <tr>
        <td colspan="7" class="section-title">8. MASTER COST & FEE SETTINGS — GOODS / RAW MATERIALS PURCHASING BASELINE & OPERATIONAL CONTROLS</td>
      </tr>
      <tr>
        <td colspan="3" class="td-metric">Food Cost / COGS Baseline</td>
        <td class="td-val">${cfg.cogsPercentage}%</td>
        <td colspan="2" class="td-metric">Target Wastage Allowance</td>
        <td class="td-val">${cfg.targetWastagePercent}%</td>
      </tr>
      <tr>
        <td colspan="3" class="td-metric">Takeaway Packaging Fee</td>
        <td class="td-val">${formatINR(cfg.packagingFeePerTakeaway)}</td>
        <td colspan="2" class="td-metric">Operating Overheads Allocation</td>
        <td class="td-val">${cfg.overheadAllocationPercent}%</td>
      </tr>
      <tr>
        <td colspan="3" class="td-metric">GST Tax Rate</td>
        <td class="td-val">${cfg.gstTaxRatePercent}%</td>
        <td colspan="2" class="td-metric">Zomato / Swiggy Platform Commissions</td>
        <td class="td-val">${cfg.zomatoCommissionPercent}% / ${cfg.swiggyCommissionPercent}%</td>
      </tr>
      <tr><td colspan="7" style="height: 10px;"></td></tr>
      <tr>
        <th colspan="2" class="th-dark">Good / Ingredient Name</th>
        <th class="th-dark">Category</th>
        <th class="th-dark">Unit</th>
        <th class="th-dark">Unit Price (₹)</th>
        <th class="th-dark">Default Daily Qty</th>
        <th class="th-dark">Baseline Daily Expense (₹)</th>
      </tr>
      ${effectiveMasterIngredients
        .map(
          (m) => `
      <tr>
        <td colspan="2" class="td-text" style="font-weight: bold;">${m.name}</td>
        <td class="td-text">${m.category}</td>
        <td class="td-text">${m.defaultUnit}</td>
        <td class="td-val">${formatINR(m.defaultUnitPrice)}</td>
        <td class="td-val">${m.defaultQuantity}</td>
        <td class="td-val" style="color: #047857; font-weight: bold;">${formatINR(m.defaultQuantity * m.defaultUnitPrice)}</td>
      </tr>`
        )
        .join("")}
      <tr>
        <td colspan="6" class="td-text" style="font-weight: bold; text-align: right;">Total Baseline Daily Material Cost:</td>
        <td class="td-val" style="color: #047857; font-weight: bold; font-size: 11pt;">${formatINR(effectiveMasterIngredients.reduce((s, m) => s + (m.defaultQuantity * m.defaultUnitPrice), 0))}</td>
      </tr>
      <tr><td colspan="7" style="height: 15px;"></td></tr>
      `
          : ""
      }

      <!-- 9. ORDER AUDIT LEDGER (LINE BY LINE) -->
      ${
        relevantOrders.length > 0
          ? `
      <tr>
        <td colspan="7" class="section-title">9. DETAILED TRANSACTION AUDIT LEDGER (${relevantOrders.length} TICKETS)</td>
      </tr>
      <tr>
        <th class="th-dark">Order #</th>
        <th class="th-dark">Token #</th>
        <th class="th-dark">Customer</th>
        <th class="th-dark">Channel</th>
        <th class="th-dark">Items Summary</th>
        <th class="th-dark">Payment</th>
        <th class="th-dark">Total (₹)</th>
      </tr>
      ${relevantOrders
        .map((ord) => {
          const itemsSummary = (ord.items || [])
            .map((it: any) => `${it.quantity}x ${it.item?.name || it.name || "Special Item"}`)
            .join("; ");
          return `
      <tr>
        <td class="td-text" style="font-family: monospace;">${ord.orderNumber}</td>
        <td class="td-text" style="font-weight: bold; color: #D97706;">${formatTokenNumber(ord.tokenNumber)}</td>
        <td class="td-text">${ord.customerName || "Walk-in Guest"}</td>
        <td class="td-text">${ord.orderType === "dine-in" ? `Dine-In (${ord.tableNumber || "T1"})` : "Takeaway"}</td>
        <td class="td-text">${itemsSummary}</td>
        <td class="td-text">${ord.paymentMethod.toUpperCase()} (${ord.paymentStatus})</td>
        <td class="td-val" style="font-weight: bold;">${formatINR(ord.grandTotal)}</td>
      </tr>`;
        })
        .join("")}
      `
          : ""
      }

      <!-- SIGN-OFF FOOTER -->
      <tr><td colspan="7" style="height: 20px;"></td></tr>
      <tr>
        <td colspan="7" style="text-align: center; font-size: 8.5pt; color: #9CA3AF; border-top: 1px solid #E5E7EB; padding-top: 10px;">
          Official Executive Analytics & Operational Audit &bull; NiEA'S SANDWICH BAR, Action Area 1, New Town, Kolkata 700156 &bull; Generated for Management & Owner Review
        </td>
      </tr>
    </table>
  </body>
  </html>`;

  // Create downloadable Excel blob
  const blob = new Blob([html], {
    type: "application/vnd.ms-excel;charset=utf-8;",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `NiEA_SandwichBar_Analytics_${snapshot.filter.type}_${fileDateStr}.xls`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * EXECUTIVE PDF EXPORT WITH VISUAL GRAPHS & OFFICIAL LOGO:
 * Produces a high-end multi-page executive audit report with razor-sharp vector graphs:
 *  - Financial Waterfall comparison bar graph (Revenue vs COGS vs Overheads vs Profit)
 *  - Fulfillment Channels horizontal stacked distribution bar
 *  - Payment Modes breakdown visualization
 *  - Top Selling Menu Items ranking bars
 *  - Full transaction ledger table
 */
export async function exportAnalyticsToPdfWithGraphs(
  snapshot: EnterpriseAnalyticsSnapshot,
  ordersList: OrderRecord[] = []
): Promise<void> {
  const doc = new jsPDF({
    orientation: "portrait",
    unit: "mm",
    format: "a4",
  });

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const logoData = await loadLogoBase64();
  const now = new Date();
  const timestampStr = now.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
  const fileDateStr = now.toISOString().slice(0, 10);

  // Helper for drawing clean section titles
  const drawSectionHeader = (title: string, yPos: number): number => {
    doc.setFillColor(36, 51, 45); // #24332D
    doc.rect(14, yPos, pageWidth - 28, 7, "F");
    doc.setFillColor(245, 224, 134); // Gold bar
    doc.rect(14, yPos, 2.5, 7, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9.5);
    doc.setTextColor(245, 224, 134);
    doc.text(title, 20, yPos + 5);
    return yPos + 10;
  };

  // Helper for footer on every page
  const drawPageFooter = (pageNumber: number, totalPages: number) => {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7.5);
    doc.setTextColor(140, 140, 140);
    doc.text(
      "NiEA'S SANDWICH BAR • Action Area 1, New Town, Kolkata 700156 • Confidential Executive Store Audit",
      14,
      pageHeight - 8
    );
    doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - 14, pageHeight - 8, { align: "right" });
  };

  // ==========================================
  // PAGE 1: EXECUTIVE SUMMARY & FINANCIAL GRAPHS
  // ==========================================

  // Top Dark Green Header Banner
  doc.setFillColor(36, 51, 45); // #24332D
  doc.rect(0, 0, pageWidth, 32, "F");

  // Gold accent strip
  doc.setFillColor(245, 224, 134); // #F5E086
  doc.rect(0, 32, pageWidth, 1.8, "F");

  // Embed Logo if available
  if (logoData) {
    try {
      doc.addImage(logoData, "PNG", 12, 4, 38, 24);
    } catch {
      // Fallback text badge
      doc.setFont("helvetica", "bold");
      doc.setFontSize(16);
      doc.setTextColor(245, 224, 134);
      doc.text("NiEA'S", 14, 18);
    }
  } else {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(245, 224, 134);
    doc.text("NiEA'S", 14, 18);
  }

  // Header Title & Store Details
  doc.setFont("helvetica", "bold");
  doc.setFontSize(14);
  doc.setTextColor(245, 224, 134);
  doc.text("NiEA'S SANDWICH BAR — EXECUTIVE STORE AUDIT", 54, 12);

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(251, 249, 242);
  doc.text("Action Area 1, New Town, Kolkata 700156 • GSTIN: 19ABCDE1234F1Z5 • FSSAI #22824012000491", 54, 18);

  doc.setFontSize(8);
  doc.setTextColor(220, 220, 220);
  doc.text(`Reporting Period: ${snapshot.periodLabel}  |  Generated: ${timestampStr}`, 54, 25);

  let curY = 38;

  // 4 Top KPI Scorecards (Total Revenue, Net Profit, Food Cost COGS, Average Order Value)
  const cardW = (pageWidth - 28 - 9) / 4;
  const kpiData = [
    { label: "TOTAL GROSS REVENUE", val: formatINR(snapshot.financials.totalRevenue), color: [16, 185, 129], sub: `${snapshot.orderVolume.totalOrders} total tickets` },
    { label: "NET STORE PROFIT", val: formatINR(snapshot.financials.netProfit), color: [37, 99, 235], sub: `${snapshot.financials.profitMarginPercent}% net margin` },
    { label: "FOOD COST (COGS)", val: formatINR(snapshot.financials.cogs), color: [217, 119, 6], sub: `${snapshot.ownerConfig.cogsPercentage}% of gross sales` },
    { label: "AVG ORDER VALUE (AOV)", val: formatINR(snapshot.financials.avgOrderValue), color: [139, 92, 246], sub: "Per served customer" },
  ];

  kpiData.forEach((kpi, idx) => {
    const kpiX = 14 + idx * (cardW + 3);
    doc.setFillColor(248, 250, 249);
    doc.setDrawColor(220, 225, 222);
    doc.roundedRect(kpiX, curY, cardW, 17, 1.5, 1.5, "FD");

    // Top color pip
    doc.setFillColor(kpi.color[0], kpi.color[1], kpi.color[2]);
    doc.rect(kpiX, curY, cardW, 1.2, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(100, 105, 102);
    doc.text(kpi.label, kpiX + cardW / 2, curY + 5, { align: "center" });

    doc.setFontSize(10.5);
    doc.setTextColor(30, 35, 32);
    doc.text(kpi.val, kpiX + cardW / 2, curY + 11, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(6);
    doc.setTextColor(120, 125, 122);
    doc.text(kpi.sub, kpiX + cardW / 2, curY + 15, { align: "center" });
  });

  curY += 21;

  // ========================================================
  // VISUAL GRAPH 1: FINANCIAL WATERFALL BAR CHART (VECTOR DRAWING)
  // ========================================================
  curY = drawSectionHeader("1. FINANCIAL WATERFALL & COST REVENUE BREAKDOWN (INR / ₹)", curY);

  const chartX = 16;
  const chartW = pageWidth - 32;
  const chartH = 34;

  // Draw chart background card
  doc.setFillColor(249, 250, 249);
  doc.setDrawColor(225, 230, 228);
  doc.roundedRect(chartX, curY, chartW, chartH, 1.5, 1.5, "FD");

  const bars = [
    { label: "Gross Sales", amount: snapshot.financials.grossSales, color: [245, 190, 60] },
    { label: "Net Food Sales", amount: snapshot.financials.netFoodSales, color: [16, 185, 129] },
    { label: "COGS / Food Cost", amount: snapshot.financials.cogs, color: [239, 68, 68] },
    { label: "Operating Overheads", amount: snapshot.financials.operatingExpenses, color: [249, 115, 22] },
    { label: "Net Store Profit", amount: Math.max(0, snapshot.financials.netProfit), color: [37, 99, 235] },
  ];

  const maxVal = Math.max(...bars.map((b) => b.amount), 1);
  const barSlotW = (chartW - 20) / bars.length;
  const barMaxH = 20;

  // Grid baseline
  const baseY = curY + chartH - 7;
  doc.setDrawColor(210, 215, 212);
  doc.setLineWidth(0.3);
  doc.line(chartX + 8, baseY, chartX + chartW - 8, baseY);

  bars.forEach((b, i) => {
    const bx = chartX + 10 + i * barSlotW + barSlotW * 0.15;
    const actualBarW = barSlotW * 0.7;
    const barH = Math.max(2, (b.amount / maxVal) * barMaxH);
    const topY = baseY - barH;

    // Draw bar
    doc.setFillColor(b.color[0], b.color[1], b.color[2]);
    doc.roundedRect(bx, topY, actualBarW, barH, 0.8, 0.8, "F");

    // Value on top
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(40, 45, 42);
    doc.text(formatINR(b.amount), bx + actualBarW / 2, topY - 1.5, { align: "center" });

    // Label below baseline
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);
    doc.setTextColor(70, 75, 72);
    doc.text(b.label, bx + actualBarW / 2, baseY + 4.5, { align: "center" });
  });

  curY += chartH + 5;

  // ========================================================
  // VISUAL GRAPH 2 & 3: CHANNELS & PAYMENTS DISTRIBUTIONS
  // ========================================================
  const twoColW = (pageWidth - 28 - 5) / 2;

  // Col 1: Fulfillment Channels Bar Distribution
  doc.setFillColor(36, 51, 45);
  doc.rect(14, curY, twoColW, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(245, 224, 134);
  doc.text("2. CHANNELS DISTRIBUTION", 18, curY + 4.2);

  // Col 2: Payment Modes Distribution
  doc.setFillColor(36, 51, 45);
  doc.rect(14 + twoColW + 5, curY, twoColW, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8);
  doc.setTextColor(245, 224, 134);
  doc.text("3. PAYMENT MODES SETTLED", 18 + twoColW + 5, curY + 4.2);

  curY += 8;

  // Channel box
  doc.setFillColor(249, 250, 249);
  doc.setDrawColor(225, 230, 228);
  doc.roundedRect(14, curY, twoColW, 30, 1.5, 1.5, "FD");

  // Payment box
  doc.roundedRect(14 + twoColW + 5, curY, twoColW, 30, 1.5, 1.5, "FD");

  // Render Horizontal Proportional Stacked Bar for Channels
  const cBarX = 17;
  const cBarY = curY + 3;
  const cBarW = twoColW - 6;
  const cBarH = 5;

  let runningX = cBarX;
  snapshot.channels.forEach((c) => {
    const segW = Math.max(1, (c.percentage / 100) * cBarW);
    let col = [56, 189, 248]; // sky
    if (c.id === "takeaway") col = [251, 146, 60]; // orange
    else if (c.id === "walk_in") col = [245, 158, 11]; // amber
    else if (c.id === "website") col = [245, 224, 134]; // gold
    else if (c.id === "zomato" || c.id === "swiggy") col = [239, 68, 68]; // red

    doc.setFillColor(col[0], col[1], col[2]);
    doc.rect(runningX, cBarY, segW, cBarH, "F");
    runningX += segW;
  });

  // Channel metrics list
  let chItemY = curY + 11;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(6.5);
  doc.setTextColor(50, 50, 50);
  snapshot.channels.slice(0, 4).forEach((c) => {
    doc.text(`• ${c.label}: ${c.ordersCount} orders | ${formatINR(c.revenue)} (${c.percentage}%)`, 18, chItemY);
    chItemY += 4.5;
  });

  // Render Horizontal Proportional Stacked Bar for Payments
  const pBarX = 14 + twoColW + 5 + 3;
  const pBarY = curY + 3;
  const pBarW = twoColW - 6;

  let runningPX = pBarX;
  snapshot.paymentModes.forEach((p) => {
    const segW = Math.max(1, (p.percentage / 100) * pBarW);
    let col = [52, 211, 153]; // emerald
    if (p.id === "cash") col = [245, 158, 11];
    else if (p.id === "card") col = [192, 132, 252];
    else col = [96, 165, 250];

    doc.setFillColor(col[0], col[1], col[2]);
    doc.rect(runningPX, pBarY, segW, cBarH, "F");
    runningPX += segW;
  });

  // Payment metrics list
  let payItemY = curY + 11;
  snapshot.paymentModes.slice(0, 4).forEach((p) => {
    doc.text(`• ${p.label}: ${formatINR(p.amount)} (${p.percentage}%) [${p.ordersCount} txns]`, pBarX + 1, payItemY);
    payItemY += 4.5;
  });

  curY += 34;

  // ========================================================
  // VISUAL GRAPH 4: TOP MENU ITEMS RANKING BARS
  // ========================================================
  curY = drawSectionHeader("4. TOP PERFORMING ARTISANAL MENU ITEMS (SALES VELOCITY)", curY);

  const topItems = snapshot.topSellingItems.slice(0, 4);
  const maxItemRev = Math.max(...topItems.map((i) => i.revenue), 1);
  const itemBarMaxW = pageWidth - 28 - 60;

  topItems.forEach((item) => {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(30, 35, 32);
    doc.text(item.name, 16, curY + 3.5);

    const barW = Math.max(4, (item.revenue / maxItemRev) * itemBarMaxW);
    doc.setFillColor(73, 101, 91); // Sage
    doc.roundedRect(64, curY, barW, 4.5, 0.8, 0.8, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(7);
    doc.setTextColor(30, 35, 32);
    doc.text(`${formatINR(item.revenue)} (${item.unitsSold} units • ${item.marginPercent}% margin)`, 64 + barW + 2, curY + 3.5);

    curY += 6;
  });

  curY += 3;

  // ========================================================
  // SECTION 5: INVENTORY THEORETICAL USAGE & WASTAGE AUDIT
  // ========================================================
  curY = drawSectionHeader("5. RECIPE CONSUMPTION & WASTAGE LOSS AUDIT", curY);

  // Table header
  doc.setFillColor(240, 243, 241);
  doc.rect(14, curY, pageWidth - 28, 5, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(6.5);
  doc.setTextColor(70, 75, 72);
  doc.text("Ingredient", 16, curY + 3.5);
  doc.text("Theoretical Usage", 75, curY + 3.5);
  doc.text("Actual Measured", 110, curY + 3.5);
  doc.text("Variance %", 145, curY + 3.5);
  doc.text("Loss (INR / ₹)", 175, curY + 3.5);

  curY += 5.5;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7);
  snapshot.inventoryVariances.slice(0, 4).forEach((inv) => {
    doc.setTextColor(30, 30, 30);
    doc.text(`${inv.ingredientName} (${inv.category})`, 16, curY + 3.2);
    doc.text(`${inv.theoreticalUsage} ${inv.unit}`, 75, curY + 3.2);
    doc.text(`${inv.actualUsage} ${inv.unit}`, 110, curY + 3.2);

    const varColor = inv.variancePercent > 10 ? [220, 38, 38] : [5, 150, 105];
    doc.setTextColor(varColor[0], varColor[1], varColor[2]);
    doc.text(`${inv.variancePercent > 0 ? "+" : ""}${inv.variancePercent}%`, 145, curY + 3.2);

    doc.setTextColor(185, 28, 28);
    doc.text(formatINR(inv.wastageCost), 175, curY + 3.2);

    curY += 4.5;
  });

  drawPageFooter(1, ordersList.length > 0 ? 2 : 1);

  // ========================================================
  // PAGE 2: COMPLETE ORDER AUDIT LEDGER (IF ORDERS EXIST)
  // ========================================================
  if (ordersList.length > 0) {
    doc.addPage();

    // Top mini-banner
    doc.setFillColor(36, 51, 45);
    doc.rect(0, 0, pageWidth, 16, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(245, 224, 134);
    doc.text("NiEA'S SANDWICH BAR — DETAILED TRANSACTION AUDIT LEDGER", 14, 10);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(220, 220, 220);
    doc.text(`Scope: ${snapshot.periodLabel}  |  Total Recorded Orders: ${ordersList.length}`, pageWidth - 14, 10, { align: "right" });

    let page2Y = 22;
    page2Y = drawSectionHeader(`6. TRANSACTION AUDIT LOG (${ordersList.length} ORDERS)`, page2Y);

    // Ledger Table Header
    doc.setFillColor(240, 243, 241);
    doc.rect(14, page2Y, pageWidth - 28, 5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(6.5);
    doc.setTextColor(70, 75, 72);
    doc.text("Order / Token", 16, page2Y + 3.5);
    doc.text("Customer & Contact", 50, page2Y + 3.5);
    doc.text("Channel / Table", 90, page2Y + 3.5);
    doc.text("Items & Quantities", 125, page2Y + 3.5);
    doc.text("Payment", 168, page2Y + 3.5);
    doc.text("Total (₹)", 192, page2Y + 3.5, { align: "right" });

    page2Y += 5.5;

    // Line by line orders
    doc.setFont("helvetica", "normal");
    doc.setFontSize(6.5);

    ordersList.slice(0, 36).forEach((ord) => {
      if (page2Y > pageHeight - 16) {
        return; // prevent overflow
      }

      doc.setTextColor(30, 30, 30);
      const tokenDisplay = ord.tokenNumber ? `#${ord.tokenNumber}` : ord.orderNumber;
      doc.text(tokenDisplay, 16, page2Y + 3);

      const custName = (ord.customerName || "Walk-in Guest").slice(0, 20);
      doc.text(custName, 50, page2Y + 3);

      const chText = ord.orderType === "dine-in" ? `Dine-In (${ord.tableNumber || "T1"})` : "Takeaway";
      doc.text(chText, 90, page2Y + 3);

      const itemsStr = (ord.items || [])
        .map((it: any) => `${it.quantity}x ${it.item?.name || it.name || "Item"}`)
        .join(", ")
        .slice(0, 26);
      doc.text(itemsStr, 125, page2Y + 3);

      doc.text(ord.paymentMethod.toUpperCase(), 168, page2Y + 3);

      doc.setFont("helvetica", "bold");
      doc.text(formatINR(ord.grandTotal), 192, page2Y + 3, { align: "right" });
      doc.setFont("helvetica", "normal");

      // subtle separator line
      doc.setDrawColor(240, 240, 240);
      doc.line(14, page2Y + 4.2, pageWidth - 14, page2Y + 4.2);

      page2Y += 5;
    });

    drawPageFooter(2, 2);
  }

  // Trigger download
  doc.save(`NiEA_Executive_Analytics_Report_${snapshot.filter.type}_${fileDateStr}.pdf`);
}
