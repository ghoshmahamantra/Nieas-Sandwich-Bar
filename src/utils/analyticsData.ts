import { OrderRecord, PosSalesRecord, ReservationRecord, MenuItem } from "../types/niea";
import { INITIAL_MENU_ITEMS } from "../data/nieaData";

export interface AnalyticsTimeFilter {
  type: "today" | "yesterday" | "7d" | "30d" | "this_month" | "single_date" | "date_range" | "lifetime";
  singleDate?: string; // YYYY-MM-DD
  startDate?: string;  // YYYY-MM-DD
  endDate?: string;    // YYYY-MM-DD
}

export interface AggregatedAnalytics {
  periodLabel: string;
  isSingleDay: boolean;
  totalRevenue: number;
  grossSales: number;
  netSales: number;
  taxesCollected: number;
  packagingCharges: number;
  discountsGiven: number;
  
  // Orders
  totalOrders: number;
  successfulOrders: number;
  cancelledOrders: number;
  cancellationRate: number;
  activeOrders: number;
  avgOrderValue: number;

  // Channels
  onlineOrdersCount: number;
  onlineOrdersRevenue: number;
  dineInOrdersCount: number;
  dineInOrdersRevenue: number;
  takeawayOrdersCount: number;
  takeawayOrdersRevenue: number;
  walkInOrdersCount: number;
  walkInOrdersRevenue: number;
  preOrdersCount: number;
  preOrdersRevenue: number;

  // Reservations
  totalReservations: number;
  confirmedReservations: number;
  seatedReservations: number;
  cancelledReservations: number;
  totalGuestsBooked: number;
  advanceDepositsCollected: number;

  // Payments
  cashSales: number;
  cashOrdersCount: number;
  upiSales: number;
  upiOrdersCount: number;
  cardSales: number;
  cardOrdersCount: number;
  onlineGatewaySales: number;

  // Chart data series
  timeSeriesData: TimeSeriesPoint[];
  
  // Item Breakdown
  topItems: {
    id: string;
    name: string;
    category: string;
    quantity: number;
    revenue: number;
  }[];
  
  categorySales: {
    category: string;
    revenue: number;
    count: number;
    percentage: number;
  }[];

  // Raw orders and POS in this filtered scope
  matchedOrders: OrderRecord[];
  matchedPosRecords: PosSalesRecord[];
  matchedReservations: ReservationRecord[];
}

export interface TimeSeriesPoint {
  key: string;
  label: string;
  subLabel?: string;
  totalSales: number;
  ordersCount: number;
  successfulCount: number;
  cancelledCount: number;
  cashSales: number;
  upiSales: number;
  cardSales: number;
  onlineSales: number;
  dineInCount: number;
  takeawayCount: number;
  walkInCount: number;
  onlineCount: number;
}

// Module-level cache (Zero simulation: empty records)
export function getSeededHistoricalData(_currentDate: Date = new Date()) {
  return {
    seededOrders: [] as OrderRecord[],
    seededPos: [] as PosSalesRecord[],
    seededReservations: [] as ReservationRecord[],
  };
}

function _unusedSeedEngine() {
  return;
}

/*
  const seededOrders: OrderRecord[] = [];
  const seededPos: PosSalesRecord[] = [];
  const seededReservations: ReservationRecord[] = [];

  const customerNames = [
    "Aarav Sharma", "Pooja Patel", "Rohan Mehta", "Sneha Mukherjee", "Vikram Malhotra",
    "Ananya Sen", "Kabir Bedi", "Tanvi Joshi", "Arjun Nair", "Ishaan Verma",
    "Dia Roy", "Karan Singhania", "Riya Chakraborty", "Aditya Bose", "Meera Kapoor"
  ];

  const breadOptions = [
    "Artisan Sourdough",
    "Japanese Shokupan Brioche",
    "House Herb Focaccia",
    "Rustic Whole Wheat"
  ];

  // Loop back 35 days (plenty for 30D, month-to-date, weekly and custom comparisons)
  for (let d = 34; d >= 0; d--) {
    const targetDate = new Date(currentDate);
    targetDate.setDate(targetDate.getDate() - d);
    const dateStr = targetDate.toISOString().slice(0, 10);
    const dayOfWeek = targetDate.getDay(); // 0 is Sun, 6 is Sat
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    // Daily order volume variation
    const baseOrdersCount = isWeekend ? 32 + (d % 6) : 18 + (d % 5);
    let dayWebSales = 0;
    let dayPosCash = 0;
    let dayPosUpi = 0;
    let dayPosOrders = 0;

    // Daily reservations (2 to 7 on weekdays, 5 to 12 on weekends)
    const resCount = isWeekend ? 6 + (d % 6) : 3 + (d % 4);
    for (let r = 0; r < resCount; r++) {
      const isCancelled = (d + r) % 17 === 0;
      const isSeated = !isCancelled;
      const guestCount = 2 + ((d + r) % 4);
      seededReservations.push({
        id: `res_seed_${dateStr}_${r}`,
        bookingRef: `RES-${1000 + (d * 10) + r}`,
        tokenNumber: `TB-${r + 1}`,
        bookingType: "table",
        customerName: customerNames[(d + r) % customerNames.length],
        customerPhone: `98${10000000 + (d * 50) + r}`,
        date: dateStr,
        timeSlot: `${12 + (r % 8)}:00 PM`,
        guestCount,
        seatingArea: (["indoor", "patio", "window", "table1", "table2"] as const)[r % 5],
        status: isCancelled ? "cancelled" : isSeated ? "seated" : "confirmed",
        advanceDeposit: 150,
        depositStatus: "paid",
        createdAt: new Date(targetDate.getTime() - 86400000 * 2).toISOString(),
      });
    }

    // Generate individual orders for this date
    for (let o = 0; o < baseOrdersCount; o++) {
      const hour = 11 + Math.floor((o / baseOrdersCount) * 11); // 11 AM to 10 PM
      const minute = (o * 17) % 60;
      const orderDate = new Date(targetDate);
      orderDate.setHours(hour, minute, 0, 0);

      const isCancelled = (o === 3 && d % 5 === 0); // occasional realistic cancellation
      const kindRatio = (o + d) % 12;
      let orderKind: "dine_in" | "takeaway" | "walk_in" | "pre_order" = "dine_in";
      let orderType: "dine-in" | "takeaway" = "dine-in";
      let orderSource: "website" | "pos" | "walk_in" | "zomato" | "swiggy" = "website";

      if (kindRatio === 0 || kindRatio === 1) {
        orderKind = "walk_in";
        orderType = (o % 2 === 0) ? "dine-in" : "takeaway";
        orderSource = "walk_in";
      } else if (kindRatio === 2 || kindRatio === 3) {
        orderKind = "takeaway";
        orderType = "takeaway";
        orderSource = "pos";
      } else if (kindRatio === 4) {
        orderKind = "takeaway";
        orderType = "takeaway";
        orderSource = "zomato";
      } else if (kindRatio === 5) {
        orderKind = "takeaway";
        orderType = "takeaway";
        orderSource = "swiggy";
      } else if (kindRatio === 6 || kindRatio === 7) {
        orderKind = "pre_order";
        orderType = "dine-in";
        orderSource = "website";
      } else {
        orderKind = "dine_in";
        orderType = "dine-in";
        orderSource = "website";
      }

      // Payment mode distribution: UPI ~60%, Cash ~28%, Card ~12%
      const payRand = (o * 7 + d * 3) % 100;
      let paymentMethod: "cash" | "upi" | "card" | "pos" | "counter" | "razorpay" = "upi";
      if (payRand < 28) {
        paymentMethod = orderSource === "walk_in" ? "cash" : "counter";
      } else if (payRand < 88) {
        paymentMethod = orderSource === "website" ? "upi" : "upi";
      } else {
        paymentMethod = "card";
      }

      // Pick 1-3 menu items
      const selectedItem1 = INITIAL_MENU_ITEMS[(o + d) % INITIAL_MENU_ITEMS.length];
      const selectedItem2 = ((o + d) % 3 === 0) ? INITIAL_MENU_ITEMS[(o + d + 2) % INITIAL_MENU_ITEMS.length] : null;
      
      const qty1 = 1 + (o % 2);
      const subtotal = (selectedItem1.price * qty1) + (selectedItem2 ? selectedItem2.price : 0);
      const taxes = Math.round(subtotal * 0.05);
      const packagingCharge = orderType === "takeaway" ? 20 : 0;
      const grandTotal = subtotal + taxes + packagingCharge;

      const orderRecord: OrderRecord = {
        id: `seed_ord_${dateStr}_${o}`,
        orderNumber: `NIEA-${1000 + (d * 50) + o}`,
        tokenNumber: `T${100 + (o % 90)}`,
        orderType,
        orderKind,
        orderSource,
        tableNumber: orderType === "dine-in" ? `Table ${(o % 2) + 1}` : "Counter Queue",
        customerName: customerNames[(o + d) % customerNames.length],
        customerPhone: `98${20000000 + (d * 40) + o}`,
        items: [
          {
            cartItemId: `seed_c_${d}_${o}_1`,
            item: selectedItem1,
            quantity: qty1,
            selectedBread: breadOptions[o % breadOptions.length],
            selectedCustomizations: [],
            unitPrice: selectedItem1.price,
            totalPrice: selectedItem1.price * qty1,
          },
          ...(selectedItem2 ? [{
            cartItemId: `seed_c_${d}_${o}_2`,
            item: selectedItem2,
            quantity: 1,
            selectedBread: breadOptions[(o + 1) % breadOptions.length],
            selectedCustomizations: [],
            unitPrice: selectedItem2.price,
            totalPrice: selectedItem2.price,
          }] : []),
        ],
        subtotal,
        taxes,
        packagingCharge,
        discount: 0,
        grandTotal,
        paymentMethod,
        paymentStatus: "paid",
        createdAt: orderDate.toISOString(),
        estimatedTime: isCancelled ? "Cancelled" : "Served",
        estimatedWaitingMinutes: 20,
        status: isCancelled ? "received" : "served",
        kitchenStatus: isCancelled ? "cancelled" : "served",
      };

      seededOrders.push(orderRecord);
      dayWebSales += grandTotal;
    }

    // POS offline register daily sync record
    dayPosOrders = isWeekend ? 16 + (d % 6) : 10 + (d % 5);
    dayPosCash = dayPosOrders * 320;
    dayPosUpi = dayPosOrders * 480;
    seededPos.push({
      id: `seed_pos_${dateStr}`,
      date: dateStr,
      cashSales: dayPosCash,
      upiSales: dayPosUpi,
      cardSales: Math.round(dayPosOrders * 120),
      totalOrders: dayPosOrders,
      cancelledOrders: d % 7 === 0 ? 1 : 0,
      notes: `Physical Counter POS Register Sync (${dateStr})`,
      createdAt: `${dateStr}T22:30:00.000Z`,
    });
  }

  _cachedHistoricalData = { seededOrders, seededPos, seededReservations };
  return _cachedHistoricalData;
}
*/

// Compute all robust analytics based on filter
export function computeRobustAnalytics(
  liveOrders: OrderRecord[],
  livePosRecords: PosSalesRecord[],
  liveReservations: ReservationRecord[],
  filter: AnalyticsTimeFilter
): AggregatedAnalytics {
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);

  // Helper date parsing
  const getMidnight = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const todayMidnight = getMidnight(now);

  let periodLabel = "All Time Analytics";
  let isSingleDay = false;
  let isHourly = false;
  let targetSingleDateStr = "";

  // Date filtering logic
  let isInPeriod = (dateIsoOrStr: string): boolean => true;

  if (filter.type === "today") {
    periodLabel = `Today (${now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })})`;
    isSingleDay = true;
    isHourly = true;
    targetSingleDateStr = todayStr;
    isInPeriod = (s) => s.startsWith(todayStr);
  } else if (filter.type === "yesterday") {
    const yest = new Date(todayMidnight);
    yest.setDate(yest.getDate() - 1);
    const yestStr = yest.toISOString().slice(0, 10);
    periodLabel = `Yesterday (${yest.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })})`;
    isSingleDay = true;
    isHourly = true;
    targetSingleDateStr = yestStr;
    isInPeriod = (s) => s.startsWith(yestStr);
  } else if (filter.type === "7d") {
    const start7 = new Date(todayMidnight);
    start7.setDate(start7.getDate() - 6);
    periodLabel = `Past 7 Days (${start7.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${now.toLocaleDateString("en-US", { month: "short", day: "numeric" })})`;
    isInPeriod = (s) => {
      const d = new Date(s);
      return d >= start7 && d <= now;
    };
  } else if (filter.type === "30d") {
    const start30 = new Date(todayMidnight);
    start30.setDate(start30.getDate() - 29);
    periodLabel = `Past 30 Days (${start30.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${now.toLocaleDateString("en-US", { month: "short", day: "numeric" })})`;
    isInPeriod = (s) => {
      const d = new Date(s);
      return d >= start30 && d <= now;
    };
  } else if (filter.type === "this_month") {
    const startMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    periodLabel = `This Month (${now.toLocaleDateString("en-US", { month: "long", year: "numeric" })})`;
    isInPeriod = (s) => {
      const d = new Date(s);
      return d >= startMonth && d <= now;
    };
  } else if (filter.type === "single_date" && filter.singleDate) {
    const dateObj = new Date(filter.singleDate + "T00:00:00");
    periodLabel = `Date: ${dateObj.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}`;
    isSingleDay = true;
    isHourly = true;
    targetSingleDateStr = filter.singleDate;
    isInPeriod = (s) => s.startsWith(filter.singleDate!);
  } else if (filter.type === "date_range" && filter.startDate && filter.endDate) {
    const sDate = new Date(filter.startDate + "T00:00:00");
    const eDate = new Date(filter.endDate + "T23:59:59.999");
    periodLabel = `Custom Range: ${sDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${eDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`;
    isInPeriod = (s) => {
      const d = new Date(s);
      return d >= sDate && d <= eDate;
    };
  }

  // Filter orders
  const matchedOrders = liveOrders.filter((o) => isInPeriod(o.createdAt));
  
  // Filter POS records
  const matchedPosRecords = livePosRecords.filter((p) => {
    const recDate = p.date || p.createdAt?.slice(0, 10);
    return recDate ? isInPeriod(recDate) : false;
  });

  // Filter reservations
  const matchedReservations = liveReservations.filter((r) => {
    const recDate = r.date || r.createdAt?.slice(0, 10);
    return recDate ? isInPeriod(recDate) : false;
  });

  // Calculate Aggregates
  let totalRevenue = 0;
  let grossSales = 0;
  let netSales = 0;
  let taxesCollected = 0;
  let packagingCharges = 0;
  let discountsGiven = 0;

  let totalOrders = 0;
  let successfulOrders = 0;
  let cancelledOrders = 0;
  let activeOrders = 0;

  // Channels
  let onlineOrdersCount = 0;
  let onlineOrdersRevenue = 0;
  let dineInOrdersCount = 0;
  let dineInOrdersRevenue = 0;
  let takeawayOrdersCount = 0;
  let takeawayOrdersRevenue = 0;
  let walkInOrdersCount = 0;
  let walkInOrdersRevenue = 0;
  let preOrdersCount = 0;
  let preOrdersRevenue = 0;

  // Payments
  let cashSales = 0;
  let cashOrdersCount = 0;
  let upiSales = 0;
  let upiOrdersCount = 0;
  let cardSales = 0;
  let cardOrdersCount = 0;
  let onlineGatewaySales = 0;

  // Item counts
  const itemMap = new Map<string, { id: string; name: string; category: string; quantity: number; revenue: number }>();
  const categoryMap = new Map<string, { revenue: number; count: number }>();

  // Process website / live orders
  matchedOrders.forEach((o) => {
    totalOrders++;
    const isCancelled = o.kitchenStatus === "cancelled" || o.status === "cancelled" as any;
    
    if (isCancelled) {
      cancelledOrders++;
    } else {
      successfulOrders++;
      if (o.kitchenStatus !== "served" && o.status !== "served") {
        activeOrders++;
      }
      grossSales += o.grandTotal;
      netSales += o.subtotal;
      taxesCollected += o.taxes || 0;
      packagingCharges += o.packagingCharge || 0;
      discountsGiven += o.discount || 0;

      // Channels
      if (o.orderKind === "walk_in" || o.orderSource === "walk_in") {
        walkInOrdersCount++;
        walkInOrdersRevenue += o.grandTotal;
      } else if (o.orderKind === "pre_order") {
        preOrdersCount++;
        preOrdersRevenue += o.grandTotal;
        onlineOrdersCount++;
        onlineOrdersRevenue += o.grandTotal;
      } else if (o.orderSource === "pos") {
        // POS entry
      } else {
        onlineOrdersCount++;
        onlineOrdersRevenue += o.grandTotal;
      }

      if (o.orderType === "dine-in") {
        dineInOrdersCount++;
        dineInOrdersRevenue += o.grandTotal;
      } else {
        takeawayOrdersCount++;
        takeawayOrdersRevenue += o.grandTotal;
      }

      // Payments
      const method = o.paymentMethod;
      if (method === "cash" || method === "counter") {
        cashSales += o.grandTotal;
        cashOrdersCount++;
      } else if (method === "upi") {
        upiSales += o.grandTotal;
        upiOrdersCount++;
      } else if (method === "card" || method === "pos") {
        cardSales += o.grandTotal;
        cardOrdersCount++;
      } else if (method === "razorpay") {
        onlineGatewaySales += o.grandTotal;
        upiSales += o.grandTotal;
        upiOrdersCount++;
      }

      // Items
      o.items.forEach((ci) => {
        const item = ci.item;
        const existing = itemMap.get(item.id) || {
          id: item.id,
          name: item.name,
          category: item.category || "sandwiches",
          quantity: 0,
          revenue: 0,
        };
        existing.quantity += ci.quantity;
        existing.revenue += ci.totalPrice;
        itemMap.set(item.id, existing);

        const catExisting = categoryMap.get(item.category) || { revenue: 0, count: 0 };
        catExisting.revenue += ci.totalPrice;
        catExisting.count += ci.quantity;
        categoryMap.set(item.category, catExisting);
      });
    }
  });

  // Process POS records
  matchedPosRecords.forEach((p) => {
    const posTotal = p.cashSales + p.upiSales + (p.cardSales || 0);
    grossSales += posTotal;
    netSales += Math.round(posTotal * 0.95);
    taxesCollected += Math.round(posTotal * 0.05);

    totalOrders += p.totalOrders;
    successfulOrders += (p.totalOrders - p.cancelledOrders);
    cancelledOrders += p.cancelledOrders;

    cashSales += p.cashSales;
    upiSales += p.upiSales;
    cardSales += (p.cardSales || 0);

    const estCashOrders = Math.round(p.totalOrders * (p.cashSales / (posTotal || 1)));
    const estUpiOrders = Math.round(p.totalOrders * (p.upiSales / (posTotal || 1)));
    cashOrdersCount += estCashOrders;
    upiOrdersCount += estUpiOrders;
    cardOrdersCount += (p.totalOrders - estCashOrders - estUpiOrders);

    // Channel contribution from POS register
    takeawayOrdersCount += Math.round(p.totalOrders * 0.5);
    takeawayOrdersRevenue += Math.round(posTotal * 0.5);
    dineInOrdersCount += Math.round(p.totalOrders * 0.5);
    dineInOrdersRevenue += Math.round(posTotal * 0.5);
  });

  totalRevenue = grossSales;
  const avgOrderValue = successfulOrders > 0 ? Math.round(totalRevenue / successfulOrders) : 0;
  const cancellationRate = totalOrders > 0 ? Number(((cancelledOrders / totalOrders) * 100).toFixed(1)) : 0;

  // Reservations aggregation
  let totalReservations = matchedReservations.length;
  let confirmedReservations = 0;
  let seatedReservations = 0;
  let cancelledReservations = 0;
  let totalGuestsBooked = 0;
  let advanceDepositsCollected = 0;

  matchedReservations.forEach((r) => {
    if (r.status === "cancelled") {
      cancelledReservations++;
    } else if (r.status === "seated" || r.status === "completed") {
      seatedReservations++;
      totalGuestsBooked += r.guestCount || 2;
      advanceDepositsCollected += r.advanceDeposit || 0;
    } else {
      confirmedReservations++;
      totalGuestsBooked += r.guestCount || 2;
      advanceDepositsCollected += r.advanceDeposit || 0;
    }
  });

  // Top Items
  const topItems = Array.from(itemMap.values()).sort((a, b) => b.revenue - a.revenue);

  // Category sales
  const categorySales = Array.from(categoryMap.entries()).map(([cat, val]) => ({
    category: cat.toUpperCase(),
    revenue: val.revenue,
    count: val.count,
    percentage: totalRevenue > 0 ? Math.round((val.revenue / totalRevenue) * 100) : 0,
  }));

  // Construct Time Series Data
  const timeSeriesData: TimeSeriesPoint[] = [];

  if (isHourly) {
    // 12 operating hourly buckets: 11:00 AM to 10:00 PM
    const hours = [11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
    hours.forEach((hr) => {
      const hrLabel = hr === 12 ? "12 PM" : hr > 12 ? `${hr - 12} PM` : `${hr} AM`;
      const hourOrders = matchedOrders.filter((o) => {
        const d = new Date(o.createdAt);
        return d.getHours() === hr;
      });

      const hrSales = hourOrders.reduce((s, o) => s + (o.kitchenStatus !== "cancelled" ? o.grandTotal : 0), 0);
      const hrCash = hourOrders
        .filter((o) => (o.paymentMethod === "cash" || o.paymentMethod === "counter") && o.kitchenStatus !== "cancelled")
        .reduce((s, o) => s + o.grandTotal, 0);
      const hrUpi = hourOrders
        .filter((o) => (o.paymentMethod === "upi" || o.paymentMethod === "razorpay") && o.kitchenStatus !== "cancelled")
        .reduce((s, o) => s + o.grandTotal, 0);
      const hrCard = hourOrders
        .filter((o) => (o.paymentMethod === "card" || o.paymentMethod === "pos") && o.kitchenStatus !== "cancelled")
        .reduce((s, o) => s + o.grandTotal, 0);

      timeSeriesData.push({
        key: `hour_${hr}`,
        label: hrLabel,
        subLabel: `${hr}:00 – ${hr + 1}:00`,
        totalSales: hrSales,
        ordersCount: hourOrders.length,
        successfulCount: hourOrders.filter((o) => o.kitchenStatus !== "cancelled").length,
        cancelledCount: hourOrders.filter((o) => o.kitchenStatus === "cancelled").length,
        cashSales: hrCash,
        upiSales: hrUpi,
        cardSales: hrCard,
        onlineSales: hrUpi,
        dineInCount: hourOrders.filter((o) => o.orderType === "dine-in").length,
        takeawayCount: hourOrders.filter((o) => o.orderType === "takeaway").length,
        walkInCount: hourOrders.filter((o) => o.orderKind === "walk_in").length,
        onlineCount: hourOrders.filter((o) => o.orderSource === "website").length,
      });
    });
  } else {
    // Multi-day: group by individual dates
    const dateMap = new Map<string, TimeSeriesPoint>();

    // Determine span of dates
    const allDates = new Set<string>();
    matchedOrders.forEach((o) => allDates.add(o.createdAt.slice(0, 10)));
    matchedPosRecords.forEach((p) => allDates.add(p.date || p.createdAt?.slice(0, 10) || ""));
    allDates.delete("");

    const sortedDates = Array.from(allDates).sort();

    sortedDates.forEach((dt) => {
      const dObj = new Date(dt + "T00:00:00");
      const dOrders = matchedOrders.filter((o) => o.createdAt.startsWith(dt));
      const dPos = matchedPosRecords.filter((p) => (p.date === dt || p.createdAt?.startsWith(dt)));

      const posSales = dPos.reduce((s, p) => s + p.cashSales + p.upiSales + (p.cardSales || 0), 0);
      const posOrders = dPos.reduce((s, p) => s + p.totalOrders, 0);
      const posCash = dPos.reduce((s, p) => s + p.cashSales, 0);
      const posUpi = dPos.reduce((s, p) => s + p.upiSales, 0);
      const posCard = dPos.reduce((s, p) => s + (p.cardSales || 0), 0);
      const posCancelled = dPos.reduce((s, p) => s + p.cancelledOrders, 0);

      const webSales = dOrders.reduce((s, o) => s + (o.kitchenStatus !== "cancelled" ? o.grandTotal : 0), 0);
      const webCash = dOrders
        .filter((o) => (o.paymentMethod === "cash" || o.paymentMethod === "counter") && o.kitchenStatus !== "cancelled")
        .reduce((s, o) => s + o.grandTotal, 0);
      const webUpi = dOrders
        .filter((o) => (o.paymentMethod === "upi" || o.paymentMethod === "razorpay") && o.kitchenStatus !== "cancelled")
        .reduce((s, o) => s + o.grandTotal, 0);
      const webCard = dOrders
        .filter((o) => (o.paymentMethod === "card" || o.paymentMethod === "pos") && o.kitchenStatus !== "cancelled")
        .reduce((s, o) => s + o.grandTotal, 0);

      const dSucc = dOrders.filter((o) => o.kitchenStatus !== "cancelled").length + (posOrders - posCancelled);
      const dCanc = dOrders.filter((o) => o.kitchenStatus === "cancelled").length + posCancelled;

      dateMap.set(dt, {
        key: dt,
        label: dObj.toLocaleDateString("en-US", { weekday: "short", day: "numeric" }),
        subLabel: dt,
        totalSales: webSales + posSales,
        ordersCount: dOrders.length + posOrders,
        successfulCount: dSucc,
        cancelledCount: dCanc,
        cashSales: webCash + posCash,
        upiSales: webUpi + posUpi,
        cardSales: webCard + posCard,
        onlineSales: webUpi,
        dineInCount: dOrders.filter((o) => o.orderType === "dine-in").length + Math.round(posOrders * 0.5),
        takeawayCount: dOrders.filter((o) => o.orderType === "takeaway").length + Math.round(posOrders * 0.5),
        walkInCount: dOrders.filter((o) => o.orderKind === "walk_in").length,
        onlineCount: dOrders.filter((o) => o.orderSource === "website").length,
      });
    });

    timeSeriesData.push(...Array.from(dateMap.values()));
  }

  return {
    periodLabel,
    isSingleDay,
    totalRevenue,
    grossSales,
    netSales,
    taxesCollected,
    packagingCharges,
    discountsGiven,
    totalOrders,
    successfulOrders,
    cancelledOrders,
    cancellationRate,
    activeOrders,
    avgOrderValue,
    onlineOrdersCount,
    onlineOrdersRevenue,
    dineInOrdersCount,
    dineInOrdersRevenue,
    takeawayOrdersCount,
    takeawayOrdersRevenue,
    walkInOrdersCount,
    walkInOrdersRevenue,
    preOrdersCount,
    preOrdersRevenue,
    totalReservations,
    confirmedReservations,
    seatedReservations,
    cancelledReservations,
    totalGuestsBooked,
    advanceDepositsCollected,
    cashSales,
    cashOrdersCount,
    upiSales,
    upiOrdersCount,
    cardSales,
    cardOrdersCount,
    onlineGatewaySales,
    timeSeriesData,
    topItems,
    categorySales,
    matchedOrders,
    matchedPosRecords,
    matchedReservations,
  };
}

// Generate CSV string from analytics data for export
export function generateAnalyticsCsv(data: AggregatedAnalytics): string {
  const lines: string[] = [];
  lines.push(`NiEA Sandwiches & Specialty Coffee - Business Analytics Report`);
  lines.push(`Report Period:,"${data.periodLabel}"`);
  lines.push(`Generated At:,"${new Date().toLocaleString("en-IN")}"`);
  lines.push("");
  lines.push("--- FINANCIAL SUMMARY ---");
  lines.push(`Total Gross Revenue (INR),${data.totalRevenue}`);
  lines.push(`Net Food Sales (INR),${data.netSales}`);
  lines.push(`5% GST Collected (INR),${data.taxesCollected}`);
  lines.push(`Packaging Charges Collected (INR),${data.packagingCharges}`);
  lines.push(`Discounts Given (INR),${data.discountsGiven}`);
  lines.push(`Average Order Value / AOV (INR),${data.avgOrderValue}`);
  lines.push("");
  lines.push("--- ORDER VOLUME & ACCURACY ---");
  lines.push(`Total Orders,${data.totalOrders}`);
  lines.push(`Successful Orders,${data.successfulOrders}`);
  lines.push(`Cancelled Orders,${data.cancelledOrders}`);
  lines.push(`Cancellation Rate (%),${data.cancellationRate}%`);
  lines.push("");
  lines.push("--- PAYMENT BREAKDOWN ---");
  lines.push(`Cash Sales (INR),${data.cashSales},(${data.cashOrdersCount} orders)`);
  lines.push(`UPI / QR Scan Sales (INR),${data.upiSales},(${data.upiOrdersCount} orders)`);
  lines.push(`Card / POS EDC Machine (INR),${data.cardSales},(${data.cardOrdersCount} orders)`);
  lines.push("");
  lines.push("--- FULFILLMENT CHANNELS ---");
  lines.push(`Online Website Orders,${data.onlineOrdersCount},Revenue: ₹${data.onlineOrdersRevenue}`);
  lines.push(`Dine-In Table Orders,${data.dineInOrdersCount},Revenue: ₹${data.dineInOrdersRevenue}`);
  lines.push(`Takeaway / Pickup Orders,${data.takeawayOrdersCount},Revenue: ₹${data.takeawayOrdersRevenue}`);
  lines.push(`Walk-In Live Queue,${data.walkInOrdersCount},Revenue: ₹${data.walkInOrdersRevenue}`);
  lines.push(`Advance Pre-Orders,${data.preOrdersCount},Revenue: ₹${data.preOrdersRevenue}`);
  lines.push("");
  lines.push("--- TABLE RESERVATIONS ---");
  lines.push(`Total Bookings,${data.totalReservations}`);
  lines.push(`Confirmed,${data.confirmedReservations}`);
  lines.push(`Seated / Completed,${data.seatedReservations}`);
  lines.push(`Cancelled Bookings,${data.cancelledReservations}`);
  lines.push(`Total Guests Served,${data.totalGuestsBooked}`);
  lines.push(`Advance Deposits Collected (INR),${data.advanceDepositsCollected}`);
  lines.push("");
  lines.push("--- ITEM SALES LEADERBOARD ---");
  lines.push("Item ID,Item Name,Category,Units Sold,Revenue (INR)");
  data.topItems.forEach((item) => {
    lines.push(`"${item.id}","${item.name}","${item.category}",${item.quantity},${item.revenue}`);
  });
  lines.push("");
  lines.push("--- ITEMIZED ORDER LEDGER ---");
  lines.push("Order Token,Timestamp,Customer,Type,Channel,Payment Method,Status,Amount (INR)");
  data.matchedOrders.forEach((o) => {
    lines.push(`"${o.tokenNumber || o.orderNumber}","${o.createdAt}","${o.customerName || "Customer"}","${o.orderType}","${o.orderKind || o.orderSource || "website"}","${o.paymentMethod}","${o.kitchenStatus || o.status}",${o.grandTotal}`);
  });

  return lines.join("\n");
}
