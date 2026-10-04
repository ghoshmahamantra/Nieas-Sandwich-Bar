import React, { useState } from "react";
import {
  UserPlus,
  Plus,
  Minus,
  Clock,
  Receipt,
  CheckCircle2,
  DollarSign,
  Coffee,
  ShoppingBag,
  Send,
  AlertCircle,
} from "lucide-react";
import { MenuItem, OrderRecord, CartItem, PaymentMode } from "../../types/niea";
import { generateTokenNumber } from "../../utils/tokenHelper";

interface WalkInOrderTabProps {
  menuItems: MenuItem[];
  onAddOrder: (order: OrderRecord) => void;
  onOpenKot: (order: OrderRecord) => void;
}

export const WalkInOrderTab: React.FC<WalkInOrderTabProps> = ({
  menuItems,
  onAddOrder,
  onOpenKot,
}) => {
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderType, setOrderType] = useState<"dine-in" | "takeaway">("takeaway");
  const [tableNumber, setTableNumber] = useState("Counter Walk-In");
  const [estimatedWaitingMinutes, setEstimatedWaitingMinutes] = useState<number>(45);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMode>("cash");
  const [orderNotes, setOrderNotes] = useState("");

  // Item selections: map of itemId -> quantity
  const [selectedCounts, setSelectedCounts] = useState<Record<string, number>>({});
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successOrder, setSuccessOrder] = useState<OrderRecord | null>(null);

  const filteredItems = menuItems.filter((item) => {
    const matchesCategory = categoryFilter === "all" || item.category === categoryFilter;
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleUpdateItemCount = (itemId: string, delta: number) => {
    setSelectedCounts((prev) => {
      const current = prev[itemId] || 0;
      const next = Math.max(0, current + delta);
      if (next === 0) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return { ...prev, [itemId]: next };
    });
  };

  // Compute cart items & total
  const selectedItemsList: { item: MenuItem; quantity: number }[] = Object.entries(selectedCounts)
    .map(([id, qty]) => {
      const it = menuItems.find((m) => m.id === id);
      return it ? { item: it, quantity: qty } : null;
    })
    .filter(Boolean) as { item: MenuItem; quantity: number }[];

  const subtotal = selectedItemsList.reduce((sum, entry) => sum + entry.item.price * entry.quantity, 0);
  const taxes = Math.round(subtotal * 0.05); // 5% GST
  const grandTotal = subtotal + taxes;

  const handleCreateWalkInOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      alert("Please enter customer name");
      return;
    }
    if (selectedItemsList.length === 0) {
      alert("Please select at least 1 item for the walk-in order");
      return;
    }

    setIsSubmitting(true);

    // Generate clean token number (e.g. T105)
    const tokenNumber = generateTokenNumber();
    const orderNumber = `NIEA-WALK-${Math.floor(1000 + Math.random() * 9000)}`;

    const cartItems: CartItem[] = selectedItemsList.map((entry) => ({
      cartItemId: `walkin_${entry.item.id}_${Date.now()}`,
      item: entry.item,
      quantity: entry.quantity,
      selectedBread: entry.item.breadChoices?.[0] || "Artisan Sourdough",
      selectedCustomizations: [],
      unitPrice: entry.item.price,
      totalPrice: entry.item.price * entry.quantity,
    }));

    const nowIso = new Date().toISOString();
    const newOrder: OrderRecord = {
      id: `ord_walk_${Date.now()}`,
      orderNumber,
      tokenNumber,
      orderType,
      orderKind: "walk_in",
      orderSource: "walk_in",
      tableNumber: orderType === "dine-in" ? tableNumber : "Counter Queue",
      customerName: customerName.trim(),
      customerPhone: customerPhone.trim() || "Walk-in Guest",
      items: cartItems,
      subtotal,
      taxes,
      packagingCharge: 0,
      discount: 0,
      grandTotal,
      paymentMethod,
      paymentStatus: "paid",
      createdAt: nowIso,
      estimatedTime: `${estimatedWaitingMinutes} mins`,
      estimatedWaitingMinutes,
      waitingStartedAt: nowIso,
      estimatedMinutesLeft: estimatedWaitingMinutes,
      status: "received",
      kitchenStatus: "kot_dispatched",
      kotPrinted: true,
      orderNotes: orderNotes.trim() || undefined,
    };

    // Save order
    onAddOrder(newOrder);

    // Send automated WhatsApp if phone provided
    if (customerPhone.replace(/\D/g, "").slice(-10).length === 10) {
      try {
        await fetch("/api/whatsapp/notify-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tokenNumber,
            orderNumber,
            customerName: newOrder.customerName,
            customerPhone: newOrder.customerPhone,
            orderType: newOrder.orderType,
            orderKind: "walk_in",
            tableNumber: newOrder.tableNumber,
            items: newOrder.items,
            grandTotal: newOrder.grandTotal,
            estimatedWaitingMinutes,
            paymentMethod,
          }),
        });
      } catch (err) {
        console.error("WhatsApp notify error:", err);
      }
    }

    setSuccessOrder(newOrder);
    setIsSubmitting(false);

    // Reset form
    setCustomerName("");
    setCustomerPhone("");
    setSelectedCounts({});
    setOrderNotes("");
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Header Info Banner */}
      <div className="bg-gradient-to-r from-[#1E2B25] to-[#24332D] p-4 sm:p-5 rounded-2xl border border-[#F5E086]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F5E086] text-[#24332D] flex items-center justify-center font-bold shadow-md">
            <UserPlus className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-niea font-bold text-lg text-[#F5E086]">Staff Walk-In Order Portal</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                Staff Only
              </span>
            </div>
            <p className="text-xs text-white/70">
              Create manual walk-in tickets for queue surges, assign wait times, and dispatch instant KOT.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs">
          <span className="text-white/60">Rush Queue Default:</span>
          <span className="px-2.5 py-1 bg-amber-400/20 text-amber-300 border border-amber-400/30 rounded-lg font-bold">
            ⏱️ 45 Mins Wait Time
          </span>
        </div>
      </div>

      {/* Success Notification Bar */}
      {successOrder && (
        <div className="p-4 bg-emerald-950/70 border border-emerald-500/50 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-emerald-200">
          <div className="flex items-center gap-2.5">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
            <div>
              <p className="text-sm font-bold text-white">
                Walk-In Token Created: <span className="text-[#F5E086] text-base font-black">{successOrder.tokenNumber}</span>
              </p>
              <p className="text-xs text-emerald-300/80">
                {successOrder.customerName} • {successOrder.estimatedWaitingMinutes} mins wait time assigned • KOT sent to kitchen
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => onOpenKot(successOrder)}
              className="px-3 py-1.5 rounded-xl bg-emerald-500 text-[#1E2B25] font-black text-xs hover:bg-emerald-400 transition flex items-center gap-1 shadow"
            >
              <Receipt className="w-3.5 h-3.5" />
              <span>View KOT</span>
            </button>
            <button
              type="button"
              onClick={() => setSuccessOrder(null)}
              className="text-xs text-white/60 hover:text-white px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Main Form & Items Grid */}
      <form onSubmit={handleCreateWalkInOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Customer & Wait Details (5 Cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-[#24332D] p-5 rounded-2xl border border-white/10 space-y-4">
            <h4 className="font-niea font-bold text-sm text-[#F5E086] flex items-center gap-2">
              <span>1. Guest & Waiting Details</span>
            </h4>

            {/* Customer Name */}
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1">
                Customer Name <span className="text-rose-400">*</span>
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Siddharth Sen"
                className="w-full bg-[#1E2B25] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#F5E086]"
              />
            </div>

            {/* Phone */}
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1">
                Phone Number (For WhatsApp Token Alert)
              </label>
              <input
                type="tel"
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="10-digit number e.g. 9830012345"
                className="w-full bg-[#1E2B25] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-[#F5E086]"
              />
            </div>

            {/* Order Type */}
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1">Dining Mode</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setOrderType("takeaway");
                    setTableNumber("Counter Queue");
                  }}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 ${
                    orderType === "takeaway"
                      ? "bg-[#F5E086] text-[#24332D] border-[#F5E086]"
                      : "bg-[#1E2B25] text-white/70 border-white/10 hover:border-white/20"
                  }`}
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>Takeaway</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setOrderType("dine-in");
                    setTableNumber("Table 1");
                  }}
                  className={`p-2.5 rounded-xl text-xs font-bold border transition flex items-center justify-center gap-2 ${
                    orderType === "dine-in"
                      ? "bg-[#F5E086] text-[#24332D] border-[#F5E086]"
                      : "bg-[#1E2B25] text-white/70 border-white/10 hover:border-white/20"
                  }`}
                >
                  <Coffee className="w-4 h-4" />
                  <span>Dine-In</span>
                </button>
              </div>
            </div>

            {/* Table Number if Dine-in */}
            {orderType === "dine-in" && (
              <div>
                <label className="block text-xs font-semibold text-white/80 mb-1">Table Number</label>
                <select
                  value={tableNumber}
                  onChange={(e) => setTableNumber(e.target.value)}
                  className="w-full bg-[#1E2B25] border border-white/15 rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-[#F5E086]"
                >
                  <option value="Table 1">Table 1 (Window Seating - 4 seats)</option>
                  <option value="Table 2">Table 2 (Cozy Booth - 4 seats)</option>
                  <option value="Table 3">Table 3 (Espresso Counter - 2 seats)</option>
                  <option value="Table 4">Table 4 (Artisan Bar - 2 seats)</option>
                  <option value="Waiting Lounge">Waiting Lounge Area</option>
                </select>
              </div>
            )}

            {/* Estimated Waiting Time Selector */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-white/80 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-400" />
                  <span>Estimated Waiting Time</span>
                </label>
                <span className="text-xs font-black text-amber-300">
                  {estimatedWaitingMinutes} Mins
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[15, 30, 45, 60].map((mins) => (
                  <button
                    key={mins}
                    type="button"
                    onClick={() => setEstimatedWaitingMinutes(mins)}
                    className={`py-2 rounded-xl text-xs font-black border transition ${
                      estimatedWaitingMinutes === mins
                        ? "bg-amber-400 text-[#1E2B25] border-amber-300 shadow-sm"
                        : "bg-[#1E2B25] text-white/70 border-white/10 hover:border-white/20"
                    }`}
                  >
                    {mins}m
                  </button>
                ))}
              </div>
            </div>

            {/* Payment Method */}
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1">Payment Collected</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "cash", label: "💵 Cash" },
                  { id: "upi", label: "📱 UPI" },
                  { id: "pos", label: "📟 POS Machine" },
                ].map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPaymentMethod(p.id as PaymentMode)}
                    className={`py-2 rounded-xl text-xs font-bold border transition ${
                      paymentMethod === p.id
                        ? "bg-[#F5E086] text-[#24332D] border-[#F5E086]"
                        : "bg-[#1E2B25] text-white/70 border-white/10 hover:border-white/20"
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Kitchen Notes */}
            <div>
              <label className="block text-xs font-semibold text-white/80 mb-1">Special Chef Note</label>
              <input
                type="text"
                value={orderNotes}
                onChange={(e) => setOrderNotes(e.target.value)}
                placeholder="e.g. Cut in halves, pack for flight, extra crisp"
                className="w-full bg-[#1E2B25] border border-white/15 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#F5E086]"
              />
            </div>
          </div>

          {/* Cart Bill Summary Card */}
          <div className="bg-[#1E2B25] p-5 rounded-2xl border border-white/10 space-y-3">
            <div className="flex justify-between items-center text-xs font-semibold text-white/70 border-b border-white/10 pb-2">
              <span>Items in Order: {selectedItemsList.reduce((s, it) => s + it.quantity, 0)}</span>
              <span>Subtotal: ₹{subtotal}</span>
            </div>
            <div className="flex justify-between items-center text-xs text-white/70">
              <span>5% GST:</span>
              <span>₹{taxes}</span>
            </div>
            <div className="flex justify-between items-center text-base font-black text-[#F5E086] pt-1 border-t border-white/10">
              <span>Grand Total:</span>
              <span>₹{grandTotal}</span>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || selectedItemsList.length === 0 || !customerName.trim()}
              className="w-full py-3.5 rounded-xl bg-[#F5E086] hover:bg-[#F8E79B] disabled:opacity-50 text-[#24332D] font-black text-sm tracking-wide transition shadow-lg flex items-center justify-center gap-2 mt-2"
            >
              <Send className="w-4 h-4" />
              <span>Generate Walk-In Token & KOT</span>
            </button>
          </div>
        </div>

        {/* Right Column: Menu Item Selector (7 Cols) */}
        <div className="lg:col-span-7 bg-[#24332D] p-5 rounded-2xl border border-white/10 space-y-4 flex flex-col">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/10">
            <div>
              <h4 className="font-niea font-bold text-sm text-[#F5E086]">2. Select Order Items</h4>
              <p className="text-xs text-white/60">Tap + to add items to this walk-in ticket</p>
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
              {[
                { id: "all", label: "All" },
                { id: "burgers", label: "OG Burgers" },
                { id: "hot-picks", label: "Hot Picks" },
                { id: "green-room", label: "Green Room" },
                { id: "sides", label: "Sides" },
                { id: "drinkables", label: "Drinkables" },
              ].map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategoryFilter(c.id)}
                  className={`px-2.5 py-1 rounded-lg font-bold transition whitespace-nowrap ${
                    categoryFilter === c.id
                      ? "bg-[#F5E086] text-[#24332D]"
                      : "bg-[#1E2B25] text-white/70 hover:text-white"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search bar */}
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search sourdough melts, matcha, pastrami..."
            className="w-full bg-[#1E2B25] border border-white/10 rounded-xl px-3.5 py-2 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#F5E086]"
          />

          {/* Menu Items List */}
          <div className="flex-1 overflow-y-auto space-y-2.5 max-h-[500px] pr-1">
            {filteredItems.map((item) => {
              const count = selectedCounts[item.id] || 0;
              const isOutOfStock = item.stockLeft <= 0;

              return (
                <div
                  key={item.id}
                  className={`p-3 rounded-xl border transition flex items-center justify-between gap-3 ${
                    count > 0
                      ? "bg-[#1E2B25] border-[#F5E086]/50 shadow-sm"
                      : "bg-[#1E2B25]/50 border-white/5 hover:border-white/15"
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-12 h-12 rounded-lg object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <h5 className="font-bold text-xs text-white truncate">{item.name}</h5>
                        {item.stockLeft <= 3 && item.stockLeft > 0 && (
                          <span className="text-[10px] text-amber-300 font-semibold">
                            Only {item.stockLeft} left
                          </span>
                        )}
                        {isOutOfStock && (
                          <span className="text-[10px] text-rose-400 font-bold">Sold Out</span>
                        )}
                      </div>
                      <p className="text-xs font-black text-[#F5E086]">₹{item.price}</p>
                    </div>
                  </div>

                  {/* Quantity selector */}
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      disabled={count === 0}
                      onClick={() => handleUpdateItemCount(item.id, -1)}
                      className="w-7 h-7 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-20 flex items-center justify-center text-white transition"
                    >
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <span className="w-5 text-center font-black text-sm text-white">
                      {count}
                    </span>
                    <button
                      type="button"
                      disabled={isOutOfStock}
                      onClick={() => handleUpdateItemCount(item.id, 1)}
                      className="w-7 h-7 rounded-lg bg-[#F5E086] hover:bg-[#F8E79B] disabled:opacity-20 flex items-center justify-center text-[#24332D] font-bold transition shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </form>
    </div>
  );
};
