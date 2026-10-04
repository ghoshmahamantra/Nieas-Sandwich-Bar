import { OrderRecord, PosSalesRecord, MenuItem } from "../types/niea";
import { INITIAL_MENU_ITEMS } from "../data/nieaData";
import { OwnerFinanceConfig, DEFAULT_OWNER_FINANCE_CONFIG } from "../types/ownerFinanceConfig";
import {
  DateComparisonItem,
  DateComparisonResult,
  CompetingItemMetric,
  ItemCompetitionResult,
  HourlyTrajectoryPoint,
} from "../types/comparisonTypes";

export const COMPARISON_PALETTE = [
  "#F5E086", // Gold
  "#34D399", // Emerald
  "#38BDF8", // Sky
  "#FB923C", // Orange
  "#C084FC", // Purple
];

/**
 * Computes deep operational, financial, and trajectory comparison between 2, 3, 4, or 5 dates.
 */
export function computeDateComparison(
  selectedDates: string[],
  allOrders: OrderRecord[],
  allPos: PosSalesRecord[],
  ownerConfig: OwnerFinanceConfig = DEFAULT_OWNER_FINANCE_CONFIG
): DateComparisonResult {
  // Ensure valid dates (up to 5)
  const safeDates = selectedDates.slice(0, 5);

  const items: DateComparisonItem[] = safeDates.map((dateStr, idx) => {
    const dObj = new Date(dateStr + "T00:00:00");
    const formattedDate = dObj.toLocaleDateString("en-IN", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });
    const dayOfWeek = dObj.toLocaleDateString("en-IN", { weekday: "long" });
    const shortLabel = dObj.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
    const color = COMPARISON_PALETTE[idx % COMPARISON_PALETTE.length];

    // Filter orders and POS matching this single date
    const dateOrders = allOrders.filter((o) => o.createdAt.startsWith(dateStr));
    const datePos = allPos.filter((p) => {
      const pDate = p.date || p.createdAt?.slice(0, 10);
      return pDate === dateStr;
    });

    let grossSales = 0;
    let netFoodSales = 0;
    let discountsGiven = 0;
    let taxesCollected = 0;
    let packagingCharges = 0;

    let totalOrders = 0;
    let successfulOrders = 0;
    let cancelledOrders = 0;

    let upiSales = 0;
    let cashSales = 0;
    let cardSales = 0;

    let dineInRevenue = 0;
    let dineInCount = 0;
    let takeawayRevenue = 0;
    let takeawayCount = 0;
    let walkInRevenue = 0;
    let walkInCount = 0;
    let onlineAggregatorRevenue = 0;
    let onlineAggregatorCount = 0;

    const itemCountsMap = new Map<string, { name: string; units: number; revenue: number }>();

    // Process digital & in-store orders
    dateOrders.forEach((o) => {
      totalOrders++;
      const isCancelled = o.kitchenStatus === "cancelled" || (o as any).status === "cancelled";

      if (isCancelled) {
        cancelledOrders++;
      } else {
        successfulOrders++;
        grossSales += o.grandTotal;
        netFoodSales += o.subtotal;
        discountsGiven += o.discount || 0;
        taxesCollected += o.taxes || Math.round(o.subtotal * (ownerConfig.gstTaxRatePercent / 100));

        const pkg =
          o.packagingCharge !== undefined && o.packagingCharge > 0
            ? o.packagingCharge
            : o.orderType === "takeaway"
            ? ownerConfig.packagingFeePerTakeaway
            : 0;
        packagingCharges += pkg;

        // Payment
        const method = (o.paymentMethod || "").toLowerCase();
        if (method === "cash" || method === "counter") {
          cashSales += o.grandTotal;
        } else if (method === "card" || method === "pos") {
          cardSales += o.grandTotal;
        } else {
          upiSales += o.grandTotal;
        }

        // Channel
        const source = (o.orderSource || "").toLowerCase();
        const kind = (o.orderKind || "").toLowerCase();
        if (source === "zomato" || source === "swiggy" || kind === "zomato" || kind === "swiggy") {
          onlineAggregatorCount++;
          onlineAggregatorRevenue += o.grandTotal;
        } else if (source === "walk_in" || kind === "walk_in") {
          walkInCount++;
          walkInRevenue += o.grandTotal;
        } else if (o.orderType === "takeaway") {
          takeawayCount++;
          takeawayRevenue += o.grandTotal;
        } else {
          dineInCount++;
          dineInRevenue += o.grandTotal;
        }

        // Items count
        o.items.forEach((ci) => {
          const prev = itemCountsMap.get(ci.item.id);
          if (prev) {
            prev.units += ci.quantity;
            prev.revenue += ci.totalPrice;
          } else {
            itemCountsMap.set(ci.item.id, {
              name: ci.item.name,
              units: ci.quantity,
              revenue: ci.totalPrice,
            });
          }
        });
      }
    });

    // Blend physical counter register batches
    datePos.forEach((p) => {
      const posTotal = p.cashSales + p.upiSales + (p.cardSales || 0);
      grossSales += posTotal;
      netFoodSales += Math.round(posTotal * 0.95);
      taxesCollected += Math.round(posTotal * (ownerConfig.gstTaxRatePercent / 100));

      totalOrders += p.totalOrders;
      const okOrders = p.totalOrders - p.cancelledOrders;
      successfulOrders += okOrders;
      cancelledOrders += p.cancelledOrders;

      cashSales += p.cashSales;
      upiSales += p.upiSales;
      cardSales += p.cardSales || 0;

      walkInCount += Math.round(okOrders * 0.7);
      walkInRevenue += Math.round(posTotal * 0.7);
      takeawayCount += Math.round(okOrders * 0.3);
      takeawayRevenue += Math.round(posTotal * 0.3);
    });

    // Cost of Goods Sold & Margins
    const cogs = Math.round(netFoodSales * (ownerConfig.cogsPercentage / 100));
    const grossProfit = grossSales - cogs;
    const grossMarginPercent = grossSales > 0 ? Number(((grossProfit / grossSales) * 100).toFixed(1)) : 0;

    // Operating expenses allocation & aggregator commissions
    const operatingExpenses = Math.round(netFoodSales * (ownerConfig.overheadAllocationPercent / 100));
    const aggregatorFees = Math.round(
      onlineAggregatorRevenue * (Math.max(ownerConfig.zomatoCommissionPercent, ownerConfig.swiggyCommissionPercent) / 100)
    );
    const actualWastageLoss = Math.round(grossSales * 0.015); // realistic variance

    const netProfit = grossProfit - operatingExpenses - aggregatorFees - actualWastageLoss;
    const netProfitMarginPercent = grossSales > 0 ? Number(((netProfit / grossSales) * 100).toFixed(1)) : 0;

    const cancellationRate = totalOrders > 0 ? Number(((cancelledOrders / totalOrders) * 100).toFixed(1)) : 0;
    const avgOrderValue = successfulOrders > 0 ? Math.round(grossSales / successfulOrders) : 0;

    // Determine top item of this date
    let topItemName = "None";
    let topItemUnits = 0;
    let topItemRevenue = 0;
    itemCountsMap.forEach((val) => {
      if (val.units > topItemUnits) {
        topItemName = val.name;
        topItemUnits = val.units;
        topItemRevenue = val.revenue;
      }
    });

    // Hourly Trajectory (11 AM to 10 PM)
    const hours = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
    const hourlyTrajectory: HourlyTrajectoryPoint[] = hours.map((hr) => {
      const hrLabel = hr === 12 ? "12 PM" : hr > 12 ? `${hr - 12} PM` : `${hr} AM`;
      const hrOrders = dateOrders.filter((o) => new Date(o.createdAt).getHours() === hr);
      const rev = hrOrders.reduce((s, o) => s + (o.kitchenStatus !== "cancelled" ? o.grandTotal : 0), 0);
      const ordCount = hrOrders.filter((o) => o.kitchenStatus !== "cancelled").length;

      return {
        hour: hr,
        hourLabel: hrLabel,
        revenue: rev,
        ordersCount: ordCount,
      };
    });

    return {
      date: dateStr,
      formattedDate,
      dayOfWeek,
      shortLabel,
      color,
      grossSales,
      netFoodSales,
      discountsGiven,
      taxesCollected,
      packagingCharges,
      cogs,
      grossProfit,
      grossMarginPercent,
      operatingExpenses,
      aggregatorFees,
      actualWastageLoss,
      netProfit,
      netProfitMarginPercent,
      totalOrders,
      successfulOrders,
      cancelledOrders,
      cancellationRate,
      avgOrderValue,
      upiSales,
      cashSales,
      cardSales,
      dineInRevenue,
      dineInCount,
      takeawayRevenue,
      takeawayCount,
      walkInRevenue,
      walkInCount,
      onlineAggregatorRevenue,
      onlineAggregatorCount,
      topItemName,
      topItemUnits,
      topItemRevenue,
      hourlyTrajectory,
    };
  });

  // Champions
  const sortedByRevenue = [...items].sort((a, b) => b.grossSales - a.grossSales);
  const sortedByNetProfit = [...items].sort((a, b) => b.netProfit - a.netProfit);
  const sortedByMargin = [...items].sort((a, b) => b.netProfitMarginPercent - a.netProfitMarginPercent);
  const sortedByOrders = [...items].sort((a, b) => b.totalOrders - a.totalOrders);
  const sortedByAov = [...items].sort((a, b) => b.avgOrderValue - a.avgOrderValue);
  const sortedByCancellations = [...items].sort((a, b) => a.cancellationRate - b.cancellationRate);

  const totalGross = items.reduce((s, it) => s + it.grossSales, 0);
  const totalNet = items.reduce((s, it) => s + it.netProfit, 0);
  const totalOrd = items.reduce((s, it) => s + it.totalOrders, 0);
  const count = Math.max(items.length, 1);

  return {
    dates: safeDates,
    items,
    highestRevenueDate: sortedByRevenue[0] || items[0],
    highestNetProfitDate: sortedByNetProfit[0] || items[0],
    highestMarginDate: sortedByMargin[0] || items[0],
    highestOrdersDate: sortedByOrders[0] || items[0],
    highestAovDate: sortedByAov[0] || items[0],
    lowestCancellationDate: sortedByCancellations[0] || items[0],
    averageGrossSales: Math.round(totalGross / count),
    averageNetProfit: Math.round(totalNet / count),
    averageTotalOrders: Math.round(totalOrd / count),
    averageAov: totalOrd > 0 ? Math.round(totalGross / totalOrd) : 0,
    averageMarginPercent: Number((items.reduce((s, it) => s + it.netProfitMarginPercent, 0) / count).toFixed(1)),
  };
}

/**
 * Computes deep head-to-head competition between 2, 3, 4, or 5 menu items.
 */
export function computeItemCompetition(
  itemIds: string[],
  allOrders: OrderRecord[],
  allMenuItems: MenuItem[] = INITIAL_MENU_ITEMS,
  ownerConfig: OwnerFinanceConfig = DEFAULT_OWNER_FINANCE_CONFIG
): ItemCompetitionResult {
  const safeIds = itemIds.slice(0, 5);
  const totalOrdersAnalyzed = allOrders.length;

  const competingItems: CompetingItemMetric[] = safeIds.map((itemId, idx) => {
    const menuItem =
      allMenuItems.find((m) => m.id === itemId) || {
        id: itemId,
        name: itemId,
        category: "sandwiches",
        price: 350,
        imageUrl: "",
        isVeg: true,
      };

    const color = COMPARISON_PALETTE[idx % COMPARISON_PALETTE.length];

    let unitsSold = 0;
    let grossRevenue = 0;
    let ordersContainingItem = 0;

    let dineInUnits = 0;
    let takeawayUnits = 0;
    let onlineAggregatorUnits = 0;

    let morningUnits = 0;
    let lunchUnits = 0;
    let eveningUnits = 0;
    let dinnerUnits = 0;

    allOrders.forEach((o) => {
      const isCancelled = o.kitchenStatus === "cancelled" || (o as any).status === "cancelled";
      if (isCancelled) return;

      const orderItem = o.items.find((ci) => ci.item.id === itemId);
      if (orderItem) {
        ordersContainingItem++;
        const qty = orderItem.quantity || 1;
        unitsSold += qty;
        grossRevenue += orderItem.totalPrice || orderItem.unitPrice * qty;

        // Channel
        const source = (o.orderSource || "").toLowerCase();
        const kind = (o.orderKind || "").toLowerCase();
        if (source === "zomato" || source === "swiggy" || kind === "zomato" || kind === "swiggy") {
          onlineAggregatorUnits += qty;
        } else if (o.orderType === "takeaway" || source === "walk_in") {
          takeawayUnits += qty;
        } else {
          dineInUnits += qty;
        }

        // Time slot
        const hour = new Date(o.createdAt).getHours();
        if (hour < 12) {
          morningUnits += qty;
        } else if (hour < 16) {
          lunchUnits += qty;
        } else if (hour < 20) {
          eveningUnits += qty;
        } else {
          dinnerUnits += qty;
        }
      }
    });

    // Approximate baseline COGS for this item
    const cogsEstimated = Math.round(grossRevenue * (ownerConfig.cogsPercentage / 100));
    const grossProfit = grossRevenue - cogsEstimated;
    const profitMarginPercent = grossRevenue > 0 ? Number(((grossProfit / grossRevenue) * 100).toFixed(1)) : 0;

    const attachRatePercent =
      totalOrdersAnalyzed > 0 ? Number(((ordersContainingItem / totalOrdersAnalyzed) * 100).toFixed(1)) : 0;

    const avgUnitsPerOrder =
      ordersContainingItem > 0 ? Number((unitsSold / ordersContainingItem).toFixed(2)) : 1;

    // Peak time slot determination
    const slots = [
      { name: "Morning (8 - 11 AM)", units: morningUnits },
      { name: "Lunch Rush (12 - 3 PM)", units: lunchUnits },
      { name: "Evening Tea (4 - 7 PM)", units: eveningUnits },
      { name: "Dinner (8 - 10 PM)", units: dinnerUnits },
    ];
    slots.sort((a, b) => b.units - a.units);
    const peakTimeSlot = slots[0]?.name || "Lunch Rush (12 - 3 PM)";

    return {
      id: menuItem.id,
      name: menuItem.name,
      category: menuItem.category,
      price: menuItem.price,
      imageUrl: menuItem.imageUrl,
      isVeg: menuItem.isVeg,
      color,
      rank: 1, // Will be set after sorting
      unitsSold,
      grossRevenue,
      cogsEstimated,
      grossProfit,
      profitMarginPercent,
      ordersContainingItem,
      attachRatePercent,
      avgUnitsPerOrder,
      dineInUnits,
      takeawayUnits,
      onlineAggregatorUnits,
      morningUnits,
      lunchUnits,
      eveningUnits,
      dinnerUnits,
      peakTimeSlot,
    };
  });

  // Sort items by units sold to establish competition ranks
  competingItems.sort((a, b) => b.unitsSold - a.unitsSold);
  competingItems.forEach((it, idx) => {
    it.rank = idx + 1;
  });

  const totalCompetingUnits = competingItems.reduce((s, it) => s + it.unitsSold, 0);
  const totalCompetingRevenue = competingItems.reduce((s, it) => s + it.grossRevenue, 0);

  const sortedByVolume = [...competingItems].sort((a, b) => b.unitsSold - a.unitsSold);
  const sortedByRevenue = [...competingItems].sort((a, b) => b.grossRevenue - a.grossRevenue);
  const sortedByProfit = [...competingItems].sort((a, b) => b.grossProfit - a.grossProfit);
  const sortedByAttachRate = [...competingItems].sort((a, b) => b.attachRatePercent - a.attachRatePercent);
  const sortedByMarginPercent = [...competingItems].sort((a, b) => b.profitMarginPercent - a.profitMarginPercent);

  return {
    itemIds: safeIds,
    items: competingItems,
    totalOrdersAnalyzed,
    totalCompetingUnits,
    totalCompetingRevenue,
    volumeLeader: sortedByVolume[0] || competingItems[0],
    revenueLeader: sortedByRevenue[0] || competingItems[0],
    profitLeader: sortedByProfit[0] || competingItems[0],
    attachRateLeader: sortedByAttachRate[0] || competingItems[0],
    marginPercentLeader: sortedByMarginPercent[0] || competingItems[0],
  };
}
