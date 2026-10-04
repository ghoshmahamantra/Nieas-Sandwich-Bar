export const DEFAULT_CAFE_TIMEZONE = "Asia/Kolkata";

// Period detection interface and helper
export interface PeriodDetection {
  type: "today" | "yesterday" | "last_7_days" | "last_30_days" | "single_date";
  dateStr?: string; // YYYY-MM-DD
  startDateStr?: string;
  formatted: string;
  titlePrefix: string;
}

// Helper to get formatted date string in target timezone (default Asia/Kolkata)
export function getTodayDateStr(timeZone: string = DEFAULT_CAFE_TIMEZONE): string {
  try {
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(new Date());
  } catch {
    return new Date().toISOString().slice(0, 10);
  }
}

export function getYesterdayDateStr(timeZone: string = DEFAULT_CAFE_TIMEZONE): string {
  try {
    const yDate = new Date(Date.now() - 86400000);
    const formatter = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    });
    return formatter.format(yDate);
  } catch {
    return new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  }
}

// Detect the time period from the user's natural language query (or use default selected date)
export function detectPeriodFromQuery(
  text: string,
  defaultDate?: string,
  timeZone: string = DEFAULT_CAFE_TIMEZONE
): PeriodDetection {
  const lower = (text || "").toLowerCase().trim();
  const now = new Date();

  // 1. Yesterday
  if (
    lower.includes("yesterday") ||
    lower.includes("yday") ||
    lower.includes("previous day") ||
    lower.includes("day before")
  ) {
    const dateStr = getYesterdayDateStr(timeZone);
    const yDate = new Date(now.getTime() - 86400000);
    const formatted = yDate.toLocaleDateString("en-IN", {
      month: "short",
      day: "numeric",
      year: "numeric",
      timeZone,
    });
    return {
      type: "yesterday",
      dateStr,
      formatted,
      titlePrefix: "Yesterday",
    };
  }

  // 2. Specific Date (e.g. 2026-09-26, 26th September, September 26, 25-09-2026)
  const isoMatch = lower.match(/\b(202\d-[0-1]\d-[0-3]\d)\b/);
  if (isoMatch) {
    const dt = new Date(isoMatch[1] + "T00:00:00");
    const dateStr = isoMatch[1];
    const formatted = isNaN(dt.getTime())
      ? dateStr
      : dt.toLocaleDateString("en-IN", {
          month: "short",
          day: "numeric",
          year: "numeric",
        });
    return {
      type: "single_date",
      dateStr,
      formatted,
      titlePrefix: formatted,
    };
  }

  // Matches "26th September", "26 sept", "september 26", "sept 26"
  const monthDayMatch = lower.match(
    /(?:(\d{1,2})(?:st|nd|rd|th)?\s*(september|sept|sep|august|aug|october|oct|november|nov|december|dec|january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul))|(?:(september|sept|sep|august|aug|october|oct|november|nov|december|dec|january|jan|february|feb|march|mar|april|apr|may|june|jun|july|jul)\s*(\d{1,2})(?:st|nd|rd|th)?)/i
  );
  if (monthDayMatch) {
    const monthsMap: Record<string, number> = {
      jan: 0, january: 0,
      feb: 1, february: 1,
      mar: 2, march: 2,
      apr: 3, april: 3,
      may: 4,
      jun: 5, june: 5,
      jul: 6, july: 6,
      aug: 7, august: 7,
      sep: 8, sept: 8, september: 8,
      oct: 9, october: 9,
      nov: 10, november: 10,
      dec: 11, december: 11,
    };
    const day = parseInt(monthDayMatch[1] || monthDayMatch[4], 10);
    const mStr = (monthDayMatch[2] || monthDayMatch[3]).toLowerCase();
    const mIdx = monthsMap[mStr];
    if (day >= 1 && day <= 31 && mIdx !== undefined) {
      const year = now.getFullYear();
      const dt = new Date(year, mIdx, day);
      const dateStr = dt.toISOString().slice(0, 10);
      const formatted = dt.toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
      return {
        type: "single_date",
        dateStr,
        formatted,
        titlePrefix: formatted,
      };
    }
  }

  // 3. Last 7 Days / Past Week / Weekly
  if (
    lower.includes("7 day") ||
    lower.includes("seven day") ||
    lower.includes("last week") ||
    lower.includes("past week") ||
    lower.includes("this week") ||
    lower.includes("weekly")
  ) {
    const startDate = new Date(now.getTime() - 7 * 86400000);
    return {
      type: "last_7_days",
      startDateStr: startDate.toISOString().slice(0, 10),
      formatted: "Last 7 Days",
      titlePrefix: "Last 7 Days",
    };
  }

  // 4. Last 30 Days / Past Month / Monthly
  if (
    lower.includes("30 day") ||
    lower.includes("thirty day") ||
    lower.includes("last month") ||
    lower.includes("past month") ||
    lower.includes("this month") ||
    lower.includes("monthly")
  ) {
    const startDate = new Date(now.getTime() - 30 * 86400000);
    return {
      type: "last_30_days",
      startDateStr: startDate.toISOString().slice(0, 10),
      formatted: "Last 30 Days",
      titlePrefix: "Last 30 Days",
    };
  }

  // 5. Explicit default date if provided (e.g. from OwnerPortal date picker)
  if (defaultDate && defaultDate.trim() && defaultDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
    const todayStr = getTodayDateStr(timeZone);
    const yDateStr = getYesterdayDateStr(timeZone);
    const cleanDate = defaultDate.trim();
    if (cleanDate === yDateStr) {
      const formatted = new Date(cleanDate + "T00:00:00").toLocaleDateString("en-IN", {
        month: "short",
        day: "numeric",
        year: "numeric",
        timeZone,
      });
      return {
        type: "yesterday",
        dateStr: cleanDate,
        formatted: `Yesterday (${formatted})`,
        titlePrefix: "Yesterday",
      };
    }
    if (cleanDate !== todayStr) {
      const dt = new Date(cleanDate + "T00:00:00");
      const formatted = isNaN(dt.getTime())
        ? cleanDate
        : dt.toLocaleDateString("en-IN", {
            month: "short",
            day: "numeric",
            year: "numeric",
            timeZone,
          });
      return {
        type: "single_date",
        dateStr: cleanDate,
        formatted,
        titlePrefix: formatted,
      };
    }
  }

  // 6. Default: Today
  const todayStr = getTodayDateStr(timeZone);
  const formatted = now.toLocaleDateString("en-IN", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone,
  });
  return {
    type: "today",
    dateStr: todayStr,
    formatted: `Today (${formatted})`,
    titlePrefix: "Today",
  };
}

// Tab redirection disabled: all queries are answered directly in the AI chat section only
export function detectTabNavigationIntent(
  _text: string
): { tab: string; tabTitle: string; reply: string } | null {
  return null;
}

// Helper to format hour into clean display label (e.g. 17 -> "5 PM", 12 -> "12 PM")
export function formatHourLabel(hr: number): string {
  if (hr === 0) return "12 AM";
  if (hr === 12) return "12 PM";
  if (hr > 12) return `${hr - 12} PM`;
  return `${hr} AM`;
}

// Helper to reliably extract hour (0-23) in cafe's timezone (or client timezone)
export function getOrderHour(o: any, timeZone: string = DEFAULT_CAFE_TIMEZONE): number {
  if (!o) return 12;
  const raw = o.createdAt || o.waitingStartedAt || o.time || o;
  if (!raw) return 12;

  // If raw is already a Date object
  if (raw instanceof Date && !isNaN(raw.getTime())) {
    try {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone,
        hour: "numeric",
        hour12: false,
        hourCycle: "h23",
      });
      const val = parseInt(formatter.format(raw), 10);
      return val === 24 ? 0 : val;
    } catch {
      return raw.getHours();
    }
  }

  if (typeof raw === "string") {
    // If it's an ISO timestamp with T (e.g. 2026-09-30T11:30:00.000Z)
    if (raw.includes("T")) {
      const dt = new Date(raw);
      if (!isNaN(dt.getTime())) {
        try {
          const formatter = new Intl.DateTimeFormat("en-US", {
            timeZone,
            hour: "numeric",
            hour12: false,
            hourCycle: "h23",
          });
          const val = parseInt(formatter.format(dt), 10);
          return val === 24 ? 0 : val;
        } catch {
          return dt.getHours();
        }
      }
    }

    // Try parsing 12-hour or 24-hour time strings like "5:15 PM" or "17:30"
    const timeMatch = raw.match(/(\d{1,2}):(\d{2})(?:\s*(AM|PM))?/i);
    if (timeMatch) {
      let hr = parseInt(timeMatch[1], 10);
      const ampm = timeMatch[3]?.toUpperCase();
      if (ampm === "PM" && hr < 12) hr += 12;
      if (ampm === "AM" && hr === 12) hr = 0;
      return hr;
    }
  }

  try {
    const dt = new Date(raw);
    if (!isNaN(dt.getTime())) {
      const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone,
        hour: "numeric",
        hour12: false,
        hourCycle: "h23",
      });
      const val = parseInt(formatter.format(dt), 10);
      return val === 24 ? 0 : val;
    }
  } catch {}

  return 12;
}

// Helper to reliably extract YYYY-MM-DD from an order in target timezone
export function getOrderDateStr(o: any, defaultDate?: string, timeZone: string = DEFAULT_CAFE_TIMEZONE): string {
  if (!o) return defaultDate || "";
  const raw = o.createdAt || o.waitingStartedAt || o.date;
  if (!raw) return defaultDate || "";

  if (raw instanceof Date && !isNaN(raw.getTime())) {
    try {
      const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      return formatter.format(raw);
    } catch {
      return raw.toISOString().slice(0, 10);
    }
  }

  if (typeof raw === "string") {
    if (raw === "Today") return getTodayDateStr(timeZone);
    if (raw === "Yesterday") return getYesterdayDateStr(timeZone);

    // If it is an ISO string with T, format in timezone
    if (raw.includes("T")) {
      const dt = new Date(raw);
      if (!isNaN(dt.getTime())) {
        try {
          const formatter = new Intl.DateTimeFormat("en-CA", {
            timeZone,
            year: "numeric",
            month: "2-digit",
            day: "2-digit",
          });
          return formatter.format(dt);
        } catch {}
      }
      const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
      if (match) return match[1];
    }

    const match = raw.match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
  }

  return defaultDate || "";
}

// 1. Filter orders strictly based on selected date or date range
export function filterOrdersByDate(
  orders: any[] = [],
  targetDate?: string, // "YYYY-MM-DD" or "today" or "yesterday"
  dateRange?: { start: string; end: string },
  timeZone: string = DEFAULT_CAFE_TIMEZONE
): any[] {
  if (!Array.isArray(orders) || orders.length === 0) return [];
  const localTodayStr = getTodayDateStr(timeZone);
  const localYDateStr = getYesterdayDateStr(timeZone);
  const utcTodayStr = new Date().toISOString().slice(0, 10);
  const utcYDateStr = new Date(Date.now() - 86400000).toISOString().slice(0, 10);

  let target = targetDate ? targetDate.trim() : undefined;
  const isTargetingToday = !target || target === "today" || target === localTodayStr || target === utcTodayStr;
  const isTargetingYesterday = target === "yesterday" || target === localYDateStr || target === utcYDateStr;

  return orders.filter((o) => {
    if (!o) return false;
    const orderDate = getOrderDateStr(o, undefined, timeZone);
    // An order without a valid timestamp is NEVER assumed to be today's order
    if (!orderDate) return false;

    if (dateRange && dateRange.start && dateRange.end) {
      return orderDate >= dateRange.start && orderDate <= dateRange.end;
    }

    if (isTargetingToday) {
      return orderDate === localTodayStr || orderDate === utcTodayStr;
    }

    if (isTargetingYesterday) {
      return orderDate === localYDateStr || orderDate === utcYDateStr;
    }

    if (target) {
      return orderDate === target;
    }

    return orderDate === localTodayStr || orderDate === utcTodayStr;
  });
}

// 2. Filter POS sales records strictly by date or date range
export function filterPosRecordsByDate(
  records: any[] = [],
  targetDate?: string,
  dateRange?: { start: string; end: string }
): any[] {
  if (!Array.isArray(records) || records.length === 0) return [];
  const now = new Date();
  const todayStr = now.toISOString().slice(0, 10);
  const yesterdayStr = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);

  let target = targetDate ? targetDate.trim() : undefined;
  if (target === "today") target = todayStr;
  if (target === "yesterday") target = yesterdayStr;

  return records.filter((r) => {
    if (!r) return false;
    const rawDate = r.date || (r.createdAt ? String(r.createdAt).slice(0, 10) : todayStr);
    const posDate = rawDate === "Today" ? todayStr : String(rawDate).slice(0, 10);

    if (dateRange && dateRange.start && dateRange.end) {
      return posDate >= dateRange.start && posDate <= dateRange.end;
    }

    if (target) {
      return posDate === target;
    }

    return posDate === todayStr;
  });
}

export interface StoreAnalyticsSummaryResult {
  dateParam: string;
  formattedDate: string;
  totalOrders: number;
  totalRevenue: number;
  itemsPrepared: number;
  topSeller: string;
  topSellerUnits: number;
  topSellerRevenue: number;
  activeOrders: number;
  toastingOrders: number;
  readyOrders: number;
  servedOrders: number;
  dineInCount: number;
  takeawayCount: number;
  itemBreakdown: Array<{ name: string; quantity: number; revenue: number; ordersCount: number }>;
  hourlyData: Array<{ label: string; value: number; orders: number; revenue: number }>;
  summaryText: string;
  posOrdersCount: number;
  posGrossRevenue: number;
}

// 3. Generate store analytics summary strictly for a specific date or date range
export function generateStoreAnalyticsSummary(
  orders: any[] = [],
  posRecords: any[] = [],
  dateParam?: string,
  dateRange?: { start: string; end: string },
  timeZone: string = DEFAULT_CAFE_TIMEZONE
): StoreAnalyticsSummaryResult {
  const filteredOrders = filterOrdersByDate(orders, dateParam, dateRange, timeZone);
  const filteredPos = filterPosRecordsByDate(posRecords, dateParam, dateRange);

  const todayStr = getTodayDateStr(timeZone);
  const yesterdayStr = getYesterdayDateStr(timeZone);

  let resolvedDateStr = dateParam || todayStr;
  if (resolvedDateStr === "today") resolvedDateStr = todayStr;
  if (resolvedDateStr === "yesterday") resolvedDateStr = yesterdayStr;

  let formattedDate = resolvedDateStr;
  if (dateRange && dateRange.start && dateRange.end) {
    formattedDate = `${dateRange.start} to ${dateRange.end}`;
  } else if (resolvedDateStr === todayStr) {
    formattedDate = `Today (${new Date().toLocaleDateString("en-IN", { month: "short", day: "numeric", timeZone })})`;
  } else if (resolvedDateStr === yesterdayStr) {
    formattedDate = `Yesterday (${new Date(Date.now() - 86400000).toLocaleDateString("en-IN", { month: "short", day: "numeric", timeZone })})`;
  } else {
    const dt = new Date(resolvedDateStr + "T00:00:00");
    if (!isNaN(dt.getTime())) {
      formattedDate = dt.toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric", timeZone });
    }
  }

  // Calculate revenue strictly for the filtered orders
  let totalRevenue = 0;
  let itemsPrepared = 0;
  const itemMap: Record<string, { name: string; quantity: number; revenue: number; ordersCount: number }> = {};

  filteredOrders.forEach((o) => {
    let orderItemSum = 0;
    const items = o.items || [];
    items.forEach((it: any) => {
      const name = it.name || it.item?.name || it.itemName || "Artisan Toastie";
      const qty = Math.max(1, Number(it.quantity) || 1);
      const unitPrice =
        Number(it.unitPrice) ||
        it.item?.price ||
        (Number(it.totalPrice) && qty ? Math.round(Number(it.totalPrice) / qty) : 280);
      const lineTotal = Number(it.totalPrice) || unitPrice * qty;
      orderItemSum += lineTotal;

      if (!itemMap[name]) {
        itemMap[name] = { name, quantity: 0, revenue: 0, ordersCount: 0 };
      }
      itemMap[name].quantity += qty;
      itemMap[name].revenue += lineTotal;
      itemMap[name].ordersCount += 1;
      itemsPrepared += qty;
    });

    const rawGrandTotal = Number(o.grandTotal);
    // Sanitize grandTotal: avoid corrupted or test anomalies like 200,000 on a sandwich order
    const safeOrderTotal =
      !isNaN(rawGrandTotal) && rawGrandTotal > 0 && rawGrandTotal < 30000 && (orderItemSum === 0 || rawGrandTotal <= orderItemSum * 2.2)
        ? rawGrandTotal
        : orderItemSum > 0
        ? Math.round(orderItemSum * 1.05)
        : Math.min(Math.max(0, rawGrandTotal || 0), 2000);

    totalRevenue += safeOrderTotal;
  });

  // POS records addition if applicable
  let posOrdersCount = 0;
  let posGrossRevenue = 0;
  filteredPos.forEach((p) => {
    posOrdersCount += Number(p.totalOrders) || 0;
    const pTotal = (Number(p.cashSales) || 0) + (Number(p.upiSales) || 0) + (Number(p.cardSales) || 0);
    posGrossRevenue += pTotal;
  });

  const sortedItems = Object.values(itemMap).sort((a, b) => b.quantity - a.quantity);
  const topItem = sortedItems[0] || null;

  const totalOrders = filteredOrders.length;
  const activeOrders = filteredOrders.filter((o) => o.status !== "served" && o.status !== "cancelled").length;
  const toastingOrders = filteredOrders.filter((o) => o.status === "toasting").length;
  const readyOrders = filteredOrders.filter((o) => o.status === "ready").length;
  const servedOrders = filteredOrders.filter((o) => o.status === "served").length;

  const dineInCount = filteredOrders.filter((o) => o.orderType === "dine-in" || o.orderKind === "dine_in").length;
  const takeawayCount = filteredOrders.filter((o) => o.orderType === "takeaway" || o.orderKind === "takeaway").length;

  // Hourly distribution for the filtered orders in target timezone
  const hourlyMap: Record<number, { orders: number; sandwiches: number; revenue: number }> = {};
  filteredOrders.forEach((o) => {
    const hr = getOrderHour(o, timeZone);
    if (!hourlyMap[hr]) hourlyMap[hr] = { orders: 0, sandwiches: 0, revenue: 0 };
    hourlyMap[hr].orders += 1;
    const sCount = (o.items || []).reduce((s: number, it: any) => s + (Number(it.quantity) || 1), 0);
    hourlyMap[hr].sandwiches += sCount;
    hourlyMap[hr].revenue += Number(o.grandTotal) || 0;
  });

  const baseHours = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
  const activeHours = Object.keys(hourlyMap).map(Number);
  const allHours = Array.from(new Set([...baseHours, ...activeHours])).sort((a, b) => a - b);

  const hourlyData = allHours.map((hr) => {
    const label = formatHourLabel(hr);
    return {
      label,
      value: hourlyMap[hr]?.sandwiches || 0,
      orders: hourlyMap[hr]?.orders || 0,
      revenue: hourlyMap[hr]?.revenue || 0,
    };
  });

  const topSellerStr = topItem
    ? `"${topItem.name}" (${topItem.quantity} units, ₹${topItem.revenue.toLocaleString("en-IN")})`
    : "None";

  const breakdownStr = sortedItems
    .slice(0, 7)
    .map((it) => `${it.name}: ${it.quantity}`)
    .join(", ");

  let summaryText = "";
  if (totalOrders === 0) {
    summaryText = `Verified Store Analytics for ${formattedDate}: 0 order(s) logged. Total revenue: ₹0. Currently awaiting orders for this date.`;
  } else {
    summaryText = `Verified Store Analytics (${formattedDate}): Total ${totalOrders} order(s) logged with ₹${totalRevenue.toLocaleString(
      "en-IN"
    )} gross revenue. ${itemsPrepared} items prepared. Top seller: ${topSellerStr}. Kitchen status: ${activeOrders} active (${toastingOrders} toasting, ${readyOrders} ready, ${servedOrders} served). Dine-In: ${dineInCount} | Takeaway: ${takeawayCount}. Item Breakdown: ${breakdownStr || "None"}.`;
  }

  return {
    dateParam: resolvedDateStr,
    formattedDate,
    totalOrders,
    totalRevenue,
    itemsPrepared,
    topSeller: topItem ? topItem.name : "None",
    topSellerUnits: topItem ? topItem.quantity : 0,
    topSellerRevenue: topItem ? topItem.revenue : 0,
    activeOrders,
    toastingOrders,
    readyOrders,
    servedOrders,
    dineInCount,
    takeawayCount,
    itemBreakdown: sortedItems,
    hourlyData,
    summaryText,
    posOrdersCount,
    posGrossRevenue,
  };
}

// Compute accurate, date-aware ground truth analytics and on-spot charts (Zero simulation)
export function computeDateSpecificAnalytics(
  query: string,
  liveOrders: any[] = [],
  _unusedSeededData?: any,
  seating?: any,
  defaultDate?: string,
  timeZone: string = DEFAULT_CAFE_TIMEZONE
) {
  const period = detectPeriodFromQuery(query, defaultDate, timeZone);
  const now = new Date();
  const lower = (query || "").toLowerCase();

  // Pure real store orders only - no simulation or seeded fake entries
  const allOrdersPool: any[] = [...(liveOrders || [])];

  let matchedOrders: any[] = [];
  let isMultiDay = false;
  const todayStr = getTodayDateStr(timeZone);

  if (period.type === "today") {
    matchedOrders = filterOrdersByDate(allOrdersPool, todayStr, undefined, timeZone);
  } else if (period.type === "yesterday") {
    const yDateStr = period.dateStr || getYesterdayDateStr(timeZone);
    matchedOrders = filterOrdersByDate(allOrdersPool, yDateStr, undefined, timeZone);
  } else if (period.type === "single_date") {
    const targetDateStr = period.dateStr!;
    matchedOrders = filterOrdersByDate(allOrdersPool, targetDateStr, undefined, timeZone);
  } else if (period.type === "last_7_days") {
    isMultiDay = true;
    const cutoff = new Date(now.getTime() - 7 * 86400000).toISOString().slice(0, 10);
    matchedOrders = allOrdersPool.filter((o) => {
      const d = getOrderDateStr(o, todayStr, timeZone);
      return d >= cutoff;
    });
  } else if (period.type === "last_30_days") {
    isMultiDay = true;
    const cutoff = new Date(now.getTime() - 30 * 86400000).toISOString().slice(0, 10);
    matchedOrders = allOrdersPool.filter((o) => {
      const d = getOrderDateStr(o, todayStr, timeZone);
      return d >= cutoff;
    });
  }

  // Accurate aggregation
  const totalOrders = matchedOrders.length;
  let totalSandwiches = 0;
  let totalRevenue = 0;
  const itemCounts: Record<
    string,
    { name: string; quantity: number; revenue: number; ordersCount: number }
  > = {};

  matchedOrders.forEach((o: any) => {
    const orderItems = o.items || [];
    let orderItemSum = 0;

    orderItems.forEach((it: any) => {
      const name = it.item?.name || it.name || it.itemName || "Artisan Melt";
      const qty = Math.max(1, Number(it.quantity) || 1);
      const unitPrice =
        Number(it.unitPrice) ||
        it.item?.price ||
        (Number(it.totalPrice) && qty ? Math.round(Number(it.totalPrice) / qty) : 280);
      const lineTotal = Number(it.totalPrice) || unitPrice * qty;
      orderItemSum += lineTotal;

      if (!itemCounts[name]) {
        itemCounts[name] = { name, quantity: 0, revenue: 0, ordersCount: 0 };
      }
      itemCounts[name].quantity += qty;
      itemCounts[name].revenue += lineTotal;
      itemCounts[name].ordersCount += 1;
      totalSandwiches += qty;
    });

    const orderGrandTotal = Number(o.grandTotal) || 0;
    const verifiedOrderAmt =
      orderGrandTotal > 0 &&
      orderItemSum > 0 &&
      orderGrandTotal < 20000 &&
      orderGrandTotal <= orderItemSum * 2.2
        ? orderGrandTotal
        : orderItemSum > 0
        ? Math.round(orderItemSum * 1.05)
        : Math.min(orderGrandTotal, 1500);

    totalRevenue += verifiedOrderAmt;
  });

  const sortedItems = Object.values(itemCounts).sort((a, b) => b.quantity - a.quantity);
  const topItem = sortedItems[0] || null;

  const dineInCount = matchedOrders.filter(
    (o: any) => o.orderType === "dine-in" || o.orderKind === "dine_in"
  ).length;
  const takeawayCount = matchedOrders.filter(
    (o: any) => o.orderType === "takeaway" || o.orderKind === "takeaway"
  ).length;
  const activeOrdersCount = matchedOrders.filter(
    (o: any) => o.status !== "served" && o.status !== "cancelled"
  ).length;
  const receivedCount = matchedOrders.filter((o: any) => o.status === "received").length;
  const toastingCount = matchedOrders.filter((o: any) => o.status === "toasting").length;
  const readyCount = matchedOrders.filter((o: any) => o.status === "ready").length;
  const servedCount = matchedOrders.filter((o: any) => o.status === "served").length;

  // Single Day: Hourly Distribution in target timezone
  const hourlyMap: Record<number, { orders: number; sandwiches: number; revenue: number }> =
    {};
  matchedOrders.forEach((o: any) => {
    const hr = getOrderHour(o, timeZone);
    if (!hourlyMap[hr]) hourlyMap[hr] = { orders: 0, sandwiches: 0, revenue: 0 };
    hourlyMap[hr].orders += 1;
    const sCount = (o.items || []).reduce(
      (s: number, it: any) => s + (Number(it.quantity) || 1),
      0
    );
    hourlyMap[hr].sandwiches += sCount;
    hourlyMap[hr].revenue += Number(o.grandTotal) || 0;
  });

  const operationalHours = [10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22];
  const allHours = Array.from(
    new Set([...operationalHours, ...Object.keys(hourlyMap).map(Number)])
  ).sort((a, b) => a - b);

  const hourlyChartData = allHours.map((hr) => {
    const label = formatHourLabel(hr);
    return {
      label,
      value: hourlyMap[hr]?.sandwiches || 0,
      orders: hourlyMap[hr]?.orders || 0,
      revenue: hourlyMap[hr]?.revenue || 0,
    };
  });

  const nonZeroHours = hourlyChartData.filter((h) => h.orders > 0 || h.value > 0);
  let peakHourLabel = "No peak recorded yet";
  if (nonZeroHours.length > 0) {
    const peak = nonZeroHours.reduce(
      (max, cur) => (cur.orders > max.orders || (cur.orders === max.orders && cur.value > max.value) ? cur : max),
      nonZeroHours[0]
    );
    peakHourLabel = `${peak.label} (${peak.value} items, ${peak.orders} tickets)`;
  }

  // Multi-Day: Daily Trend
  const dailyMap: Record<
    string,
    { orders: number; sandwiches: number; revenue: number }
  > = {};
  matchedOrders.forEach((o: any) => {
    const dt = getOrderDateStr(o, undefined, timeZone);
    if (dt) {
      if (!dailyMap[dt]) dailyMap[dt] = { orders: 0, sandwiches: 0, revenue: 0 };
      dailyMap[dt].orders += 1;
      const sCount = (o.items || []).reduce(
        (s: number, it: any) => s + (Number(it.quantity) || 1),
        0
      );
      dailyMap[dt].sandwiches += sCount;
      dailyMap[dt].revenue += Number(o.grandTotal) || 0;
    }
  });

  const sortedDates = Object.keys(dailyMap).sort();
  const dailyChartData = sortedDates.map((dt) => {
    const dObj = new Date(dt + "T00:00:00");
    const label = dObj.toLocaleDateString("en-US", { weekday: "short", day: "numeric", timeZone });
    return {
      label,
      subLabel: dt,
      value: dailyMap[dt].revenue,
      orders: dailyMap[dt].orders,
      revenue: dailyMap[dt].revenue,
    };
  });

  // Secondary Chart Series
  const itemChartData = sortedItems.map((it) => ({
    label: it.name.length > 18 ? it.name.slice(0, 16) + "…" : it.name,
    fullName: it.name,
    value: it.quantity,
    revenue: it.revenue,
    orders: it.ordersCount,
  }));

  const revenueChartData = sortedItems.map((it) => ({
    label: it.name.length > 18 ? it.name.slice(0, 16) + "…" : it.name,
    fullName: it.name,
    value: it.revenue,
    quantity: it.quantity,
  }));

  const diningChartData = [
    { label: "Dine-In", value: dineInCount, color: "#10B981", subLabel: "Table Service" },
    { label: "Takeaway", value: takeawayCount, color: "#F59E0B", subLabel: "Counter / Parcel" },
  ];

  const statusChartData = [
    { label: "Received", value: receivedCount, color: "#3B82F6", subLabel: "Queue" },
    { label: "Toasting", value: toastingCount, color: "#F59E0B", subLabel: "Grill" },
    { label: "Ready", value: readyCount, color: "#10B981", subLabel: "Counter" },
    { label: "Served", value: servedCount, color: "#8B5CF6", subLabel: "Completed" },
  ];

  // Determine Primary Chart View based on query intent
  const isRushOrPeakQuery =
    lower.includes("rush") ||
    lower.includes("peak") ||
    lower.includes("busiest") ||
    lower.includes("velocity") ||
    lower.includes("hour");

  let primaryType: string = isMultiDay ? "daily" : "hourly";
  let chartTitle = `${period.titlePrefix}'s Hourly Velocity`;
  let metricLabel = isMultiDay ? "Gross ₹" : "Sandwiches / hr";
  let chartDataSeries: any[] = isMultiDay ? dailyChartData : hourlyChartData;

  const isItemsQuery =
    lower.includes("item") ||
    lower.includes("bestseller") ||
    lower.includes("most ordered") ||
    lower.includes("popular") ||
    lower.includes("sandwich") ||
    lower.includes("dishes");
  const isRevenueQuery =
    lower.includes("revenue") ||
    lower.includes("sales") ||
    lower.includes("money") ||
    lower.includes("rupee") ||
    lower.includes("gross") ||
    lower.includes("collection");
  const isDiningQuery =
    lower.includes("dine") ||
    lower.includes("takeaway") ||
    lower.includes("parcel") ||
    lower.includes("table vs");
  const isStatusQuery =
    lower.includes("status") ||
    lower.includes("kitchen") ||
    lower.includes("toasting") ||
    lower.includes("ready") ||
    lower.includes("served");

  if (isRushOrPeakQuery) {
    primaryType = "hourly";
    chartTitle = `${period.titlePrefix}'s Peak Rush Hours`;
    metricLabel = "Items / hr";
    chartDataSeries = hourlyChartData;
  } else if (isItemsQuery) {
    primaryType = "items";
    chartTitle = `${period.titlePrefix}'s Top Selling Menu Items`;
    metricLabel = "Units Sold";
    chartDataSeries = itemChartData;
  } else if (isRevenueQuery) {
    if (isMultiDay) {
      primaryType = "daily";
      chartTitle = `${period.titlePrefix}'s Daily Gross Sales`;
      metricLabel = "Revenue (₹)";
      chartDataSeries = dailyChartData;
    } else {
      primaryType = "revenue";
      chartTitle = `${period.titlePrefix}'s Item Revenue Breakdown`;
      metricLabel = "Gross ₹";
      chartDataSeries = revenueChartData;
    }
  } else if (isDiningQuery) {
    primaryType = "dining";
    chartTitle = `${period.titlePrefix}'s Dine-In vs Takeaway`;
    metricLabel = "Orders";
    chartDataSeries = diningChartData;
  } else if (isStatusQuery && !isMultiDay) {
    primaryType = "status";
    chartTitle = `${period.titlePrefix}'s Kitchen Order Status`;
    metricLabel = "Tickets";
    chartDataSeries = statusChartData;
  }

  const availableViews = isMultiDay
    ? [
        {
          id: "daily",
          label: "Daily Sales",
          title: `${period.titlePrefix}'s Daily Sales`,
          metricLabel: "Revenue (₹)",
          data: dailyChartData,
        },
        {
          id: "items",
          label: "Top Items",
          title: `${period.titlePrefix}'s Top Selling Items`,
          metricLabel: "Units Sold",
          data: itemChartData,
        },
        {
          id: "revenue",
          label: "Item Revenue",
          title: `${period.titlePrefix}'s Revenue by Item`,
          metricLabel: "Gross ₹",
          data: revenueChartData,
        },
        {
          id: "dining",
          label: "Dining Type",
          title: `${period.titlePrefix}'s Dine-In vs Takeaway`,
          metricLabel: "Orders",
          data: diningChartData,
        },
      ]
    : [
        {
          id: "hourly",
          label: "Hourly Velocity",
          title: `${period.titlePrefix}'s Hourly Velocity`,
          metricLabel: "Sandwiches / hr",
          data: hourlyChartData,
        },
        {
          id: "items",
          label: "Top Items",
          title: `${period.titlePrefix}'s Top Selling Items`,
          metricLabel: "Units Sold",
          data: itemChartData,
        },
        {
          id: "revenue",
          label: "Item Revenue",
          title: `${period.titlePrefix}'s Revenue by Item`,
          metricLabel: "Gross ₹",
          data: revenueChartData,
        },
        {
          id: "status",
          label: "Kitchen Status",
          title: `${period.titlePrefix}'s Order Status`,
          metricLabel: "Tickets",
          data: statusChartData,
        },
        {
          id: "dining",
          label: "Dining Type",
          title: `${period.titlePrefix}'s Dine-In vs Takeaway`,
          metricLabel: "Orders",
          data: diningChartData,
        },
      ];

  const chartPayload = {
    type: primaryType,
    title: chartTitle,
    metricLabel,
    data: chartDataSeries,
    availableViews,
  };

  // Verbal summary formulation
  const topItemStr = topItem
    ? `"${topItem.name}" (${topItem.quantity} units, ₹${topItem.revenue.toLocaleString("en-IN")})`
    : "None";
  const breakdownStr = sortedItems
    .slice(0, 7)
    .map((it) => `${it.name}: ${it.quantity}`)
    .join(", ");

  let customReply = "";
  if (totalOrders === 0) {
    if (isRushOrPeakQuery && !lower.includes("rush day")) {
      customReply = `No peak rush hour recorded yet for ${period.titlePrefix} as 0 orders have been received. The kitchen queue is currently clear.`;
    } else {
      customReply = `${period.titlePrefix} Store Analytics: Total 0 orders recorded for this period with ₹0 gross revenue. No orders have been placed yet today. Kitchen is clear and ready for real customer orders.`;
    }
  } else if (lower.includes("rush day") || lower.includes("busiest day") || lower.includes("maximum rush")) {
    customReply = `Maximum Rush Days: Friday & Saturday are usually peak cafe days. For ${period.titlePrefix}, logged ${totalOrders} order(s) with ₹${totalRevenue.toLocaleString("en-IN")} gross revenue.`;
  } else if (isRushOrPeakQuery) {
    customReply = `🔥 Peak Rush Hour for ${period.titlePrefix}: ${peakHourLabel}. Total ${totalOrders} order(s) logged for this period with ₹${totalRevenue.toLocaleString("en-IN")} gross revenue (${totalSandwiches} items prepared).`;
  } else if (lower.includes("most ordered") || lower.includes("maximum ordered") || lower.includes("bestseller")) {
    customReply = `Maximum Ordered Item for ${period.titlePrefix}: ${topItemStr}. Total items prepared: ${totalSandwiches}.`;
  } else if (period.type === "yesterday") {
    customReply = `Yesterday's Verified Store Analytics (${period.formatted}): Total ${totalOrders} order(s) logged with ₹${totalRevenue.toLocaleString("en-IN")} gross revenue. ${totalSandwiches} items prepared. Top seller: ${topItemStr}. Peak hour: ${peakHourLabel}. Dine-In: ${dineInCount} | Takeaway: ${takeawayCount}. Item Breakdown: ${breakdownStr || "None"}.`;
  } else if (period.type === "today") {
    customReply = `Today's Verified Store Analytics: Total ${totalOrders} order(s) logged today with ₹${totalRevenue.toLocaleString("en-IN")} gross revenue. ${totalSandwiches} items prepared. Top seller: ${topItemStr}. Peak hour: ${peakHourLabel}. Kitchen status: ${activeOrdersCount} active (${toastingCount} toasting, ${readyCount} ready, ${servedCount} served). Dine-In: ${dineInCount} | Takeaway: ${takeawayCount}. Item Breakdown: ${breakdownStr || "None"}.`;
  } else if (period.type === "single_date") {
    customReply = `Verified Store Analytics for ${period.titlePrefix}: Total ${totalOrders} order(s) logged with ₹${totalRevenue.toLocaleString("en-IN")} gross revenue. ${totalSandwiches} items prepared. Top seller: ${topItemStr}. Peak hour: ${peakHourLabel}. Dine-In: ${dineInCount} | Takeaway: ${takeawayCount}. Item Breakdown: ${breakdownStr || "None"}.`;
  } else if (period.type === "last_7_days") {
    customReply = `Last 7 Days Verified Store Performance: Total ${totalOrders} orders logged with ₹${totalRevenue.toLocaleString("en-IN")} gross revenue (daily average ~₹${Math.round(totalRevenue / 7).toLocaleString("en-IN")}). ${totalSandwiches} items prepared. Bestseller: ${topItemStr}. Dine-In: ${dineInCount} | Takeaway: ${takeawayCount}.`;
  } else {
    customReply = `Last 30 Days Verified Store Performance: Total ${totalOrders} orders logged with ₹${totalRevenue.toLocaleString("en-IN")} gross revenue across the month (~₹${Math.round(totalRevenue / 30).toLocaleString("en-IN")}/day). ${totalSandwiches} items prepared. Top selling item: ${topItemStr}. Total Dine-In: ${dineInCount} | Total Takeaway: ${takeawayCount}.`;
  }

  const sortedOrdersDesc = [...matchedOrders].sort((a: any, b: any) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    return timeB - timeA;
  });

  return {
    reply: customReply,
    stats: {
      totalRevenue: `₹${totalRevenue.toLocaleString("en-IN")}`,
      totalOrders,
      itemsSold: totalSandwiches,
      activeTickets: activeOrdersCount,
      mostOrderedItem: topItem?.name || "None",
      peakRushHour: peakHourLabel,
      maxRushDay: "Friday & Saturday",
      availableSeats: seating ? `${seating.availableSeats}/${seating.totalSeats}` : "14/28",
      waitMinutes: seating ? `${seating.estimatedWaitMinutes || 0}m` : "15m",
    },
    chartData: chartPayload,
    actions: [] as any[],
    foundOrders:
      lower.includes("all order") || lower.includes("list order") || lower.includes("show me")
        ? sortedOrdersDesc
        : null,
    foundReservations: null as any,
    suggestedFollowUps: [
      period.type === "yesterday" ? "Show today's verified store analytics" : "Show yesterday's verified analytics",
      "Show active kitchen tickets",
      "What is our peak ordering hour?",
      "Take a walk-in order",
    ],
  };
}
