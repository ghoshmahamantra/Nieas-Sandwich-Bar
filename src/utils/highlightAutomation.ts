import { MenuItem, OrderRecord, CafeHighlight } from "../types/niea";

export const INITIAL_CAFE_HIGHLIGHT: CafeHighlight = {
  id: "spotlight-highlight",
  title: "Autumn Truffle & Wild Mushroom Melt",
  badge: "Seasonal Autumn Special",
  description:
    "Slow-sautéed portobello and shiitake mushrooms, white truffle cream, aged Gruyère & sharp Emmental on thick-cut house sourdough.",
  price: 380,
  imageUrl:
    "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=700&auto=format&fit=crop&q=80",
  menuItemId: "autumn-truffle-mushroom",
  mode: "auto",
  autoSource: "today_top_orders",
  lastUpdated: "Today 10:00 AM",
  dailyOrderCount: 42,
};

// Seed baseline order historical counts (representative of yesterday & previous shifts)
export const BASELINE_SALES_HISTORY: Record<string, { today: number; yesterday: number }> = {
  "autumn-truffle-mushroom": { today: 42, yesterday: 38 },
  "burrata-fig-focaccia": { today: 31, yesterday: 29 },
  "nieas-club-supreme": { today: 39, yesterday: 52 }, // Yesterday's highest
  "classic-four-cheese-melt": { today: 28, yesterday: 34 },
  "ceremonial-matcha-latte": { today: 36, yesterday: 31 },
  "japanese-brioche-french-toast": { today: 24, yesterday: 27 },
};

/**
 * Computes the top-ordered menu item from order history + live session orders.
 */
export function getTopOrderedItem(
  menuItems: MenuItem[],
  liveOrders: OrderRecord[],
  scope: "today_top_orders" | "yesterday_top_orders"
): { item: MenuItem; count: number } | null {
  const counts: Record<string, number> = {};

  // 1. Incorporate baseline historical sales
  Object.entries(BASELINE_SALES_HISTORY).forEach(([itemId, record]) => {
    counts[itemId] = scope === "today_top_orders" ? record.today : record.yesterday;
  });

  // 2. Incorporate live session orders if analyzing today
  if (scope === "today_top_orders") {
    liveOrders.forEach((order) => {
      order.items.forEach((cartItem) => {
        const id = cartItem.item.id;
        counts[id] = (counts[id] || 0) + cartItem.quantity;
      });
    });
  }

  // 3. Find item with maximum count
  let maxCount = -1;
  let topItemId = "";

  Object.entries(counts).forEach(([itemId, count]) => {
    if (count > maxCount) {
      maxCount = count;
      topItemId = itemId;
    }
  });

  const matchedItem = menuItems.find((m) => m.id === topItemId) || menuItems[0];
  if (!matchedItem) return null;

  return { item: matchedItem, count: Math.max(1, maxCount) };
}

/**
 * Builds an automated CafeHighlight record from calculated top items.
 */
export function generateAutomatedHighlight(
  menuItems: MenuItem[],
  liveOrders: OrderRecord[],
  source: "today_top_orders" | "yesterday_top_orders"
): CafeHighlight {
  const result = getTopOrderedItem(menuItems, liveOrders, source);

  if (!result) {
    return INITIAL_CAFE_HIGHLIGHT;
  }

  const { item, count } = result;
  const isToday = source === "today_top_orders";

  return {
    id: "spotlight-highlight",
    title: item.name,
    badge: isToday
      ? `Most Ordered Today (${count} Served)`
      : `Yesterday's Bestseller (${count} Served)`,
    description: item.description,
    price: item.price,
    imageUrl: item.imageUrl,
    menuItemId: item.id,
    mode: "auto",
    autoSource: source,
    lastUpdated: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    dailyOrderCount: count,
  };
}
