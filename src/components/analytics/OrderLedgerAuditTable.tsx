import React, { useState } from "react";
import {
  Search,
  Filter,
  CheckCircle2,
  XCircle,
  Clock,
  ShoppingBag,
  CreditCard,
  User,
  ArrowUpDown,
} from "lucide-react";
import { OrderRecord } from "../../types/niea";

interface OrderLedgerAuditTableProps {
  orders: OrderRecord[];
}

export const OrderLedgerAuditTable: React.FC<OrderLedgerAuditTableProps> = React.memo(({
  orders,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [channelFilter, setChannelFilter] = useState<string>("all");
  const [paymentFilter, setPaymentFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredOrders = React.useMemo(() => {
    return orders.filter((o) => {
      // Search
      const matchesSearch =
        o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        o.customerPhone.includes(searchTerm);

      // Channel
      const matchesChannel =
        channelFilter === "all" ||
        (channelFilter === "dine_in" && o.orderType === "dine-in") ||
        (channelFilter === "takeaway" && o.orderType === "takeaway") ||
        (channelFilter === "walk_in" && (o.orderKind === "walk_in" || o.orderSource === "walk_in"));

      // Payment
      const matchesPayment =
        paymentFilter === "all" ||
        (paymentFilter === "cash" && (o.paymentMethod === "cash" || o.paymentMethod === "counter")) ||
        (paymentFilter === "upi" && (o.paymentMethod === "upi" || o.paymentMethod === "razorpay")) ||
        (paymentFilter === "card" && (o.paymentMethod === "card" || o.paymentMethod === "pos"));

      // Status
      const isCancelled = o.kitchenStatus === "cancelled" || o.status === ("cancelled" as any);
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "cancelled" && isCancelled) ||
        (statusFilter === "served" && !isCancelled && (o.kitchenStatus === "served" || o.status === "served")) ||
        (statusFilter === "active" && !isCancelled && o.kitchenStatus !== "served" && o.status !== "served");

      return matchesSearch && matchesChannel && matchesPayment && matchesStatus;
    });
  }, [orders, searchTerm, channelFilter, paymentFilter, statusFilter]);

  return (
    <div className="bg-[#24332D] p-5 rounded-2xl border border-white/10 space-y-4">
      {/* Header & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-3">
        <div>
          <h4 className="font-niea font-bold text-sm text-[#F5E086]">
            Granular Transaction Ledger & Order Audit
          </h4>
          <p className="text-[11px] text-white/60">
            Real-time audit log with customer channels, payment gateways & billing breakdown
          </p>
        </div>

        {/* Search input */}
        <div className="relative min-w-[240px]">
          <Search className="w-3.5 h-3.5 text-white/40 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Order ID, Name, Phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#1A2520] text-white text-xs pl-8 pr-3 py-1.5 rounded-xl border border-white/15 focus:outline-none focus:border-[#F5E086]"
          />
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="text-white/50 text-[11px] font-semibold flex items-center gap-1">
          <Filter className="w-3 h-3 text-[#F5E086]" /> Filters:
        </span>

        {/* Channel select */}
        <select
          value={channelFilter}
          onChange={(e) => setChannelFilter(e.target.value)}
          className="bg-[#1A2520] text-white text-xs border border-white/10 rounded-lg px-2.5 py-1 focus:outline-none focus:border-[#F5E086]"
        >
          <option value="all">All Channels</option>
          <option value="dine_in">Dine-In</option>
          <option value="takeaway">Takeaway</option>
          <option value="walk_in">Walk-in Queue</option>
        </select>

        {/* Payment select */}
        <select
          value={paymentFilter}
          onChange={(e) => setPaymentFilter(e.target.value)}
          className="bg-[#1A2520] text-white text-xs border border-white/10 rounded-lg px-2.5 py-1 focus:outline-none focus:border-[#F5E086]"
        >
          <option value="all">All Payment Methods</option>
          <option value="upi">UPI / QR</option>
          <option value="cash">Counter Cash</option>
          <option value="card">Card / POS</option>
        </select>

        {/* Status select */}
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-[#1A2520] text-white text-xs border border-white/10 rounded-lg px-2.5 py-1 focus:outline-none focus:border-[#F5E086]"
        >
          <option value="all">All Statuses</option>
          <option value="served">Served / Completed</option>
          <option value="active">Active In Kitchen</option>
          <option value="cancelled">Cancelled / Refunded</option>
        </select>

        <span className="text-white/40 text-[11px] ml-auto">
          Showing <strong>{filteredOrders.length}</strong> of {orders.length} orders
        </span>
      </div>

      {/* Audit Table */}
      <div className="overflow-x-auto rounded-xl border border-white/10 max-h-96">
        <table className="w-full text-left text-xs text-white">
          <thead className="bg-[#1A2520] text-white/60 text-[10px] uppercase tracking-wider font-semibold border-b border-white/10 sticky top-0 z-10">
            <tr>
              <th className="py-2.5 px-3">Order ID & Time</th>
              <th className="py-2.5 px-3">Customer</th>
              <th className="py-2.5 px-3">Channel / Type</th>
              <th className="py-2.5 px-3">Payment</th>
              <th className="py-2.5 px-3">Items Summary</th>
              <th className="py-2.5 px-3 text-right">Net</th>
              <th className="py-2.5 px-3 text-right">GST</th>
              <th className="py-2.5 px-3 text-right">Total</th>
              <th className="py-2.5 px-3 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 bg-[#1E2B25]/60 font-mono">
            {filteredOrders.length === 0 ? (
              <tr>
                <td colSpan={9} className="py-8 text-center text-white/40 italic font-sans">
                  No orders match the selected search and filter criteria.
                </td>
              </tr>
            ) : (
              filteredOrders.map((o) => {
                const isCancelled = o.kitchenStatus === "cancelled" || o.status === ("cancelled" as any);
                const orderTime = new Date(o.createdAt).toLocaleTimeString("en-IN", {
                  hour: "2-digit",
                  minute: "2-digit",
                });
                const orderDate = new Date(o.createdAt).toLocaleDateString("en-IN", {
                  month: "short",
                  day: "numeric",
                });

                return (
                  <tr key={o.id} className="hover:bg-white/5 transition">
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-[#F5E086] text-xs font-mono">{o.id}</div>
                      <div className="text-[10px] text-white/50">{orderDate}, {orderTime}</div>
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <div className="font-semibold text-white truncate max-w-[120px]">{o.customerName}</div>
                      <div className="text-[10px] text-white/50 font-mono">{o.customerPhone}</div>
                    </td>
                    <td className="py-2.5 px-3 font-sans">
                      <span className="capitalize font-medium text-white/90">
                        {o.orderType}
                      </span>
                      {o.orderKind === "walk_in" && (
                        <span className="ml-1 text-[9px] px-1 py-0.2 rounded bg-amber-500/20 text-amber-300">
                          Walk-in
                        </span>
                      )}
                    </td>
                    <td className="py-2.5 px-3 font-sans capitalize">
                      <span className="px-2 py-0.5 rounded-md text-[10px] font-bold bg-white/5 text-white/80 border border-white/10">
                        {o.paymentMethod || "UPI"}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-sans text-[11px] text-white/80 max-w-[160px] truncate" title={o.items.map((i) => `${i.quantity}x ${i.item.name}`).join(", ")}>
                      {o.items.map((i) => `${i.quantity}x ${i.item.name}`).join(", ")}
                    </td>
                    <td className="py-2.5 px-3 text-right text-white/70">
                      ₹{o.subtotal.toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5 px-3 text-right text-sky-300">
                      ₹{(o.taxes || Math.round(o.subtotal * 0.05)).toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-[#F5E086]">
                      ₹{o.grandTotal.toLocaleString("en-IN")}
                    </td>
                    <td className="py-2.5 px-3 text-center font-sans">
                      {isCancelled ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-400/30">
                          <XCircle className="w-3 h-3" /> Cancelled
                        </span>
                      ) : o.kitchenStatus === "served" || o.status === "served" ? (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          <CheckCircle2 className="w-3 h-3" /> Served
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-300 border border-amber-500/20">
                          <Clock className="w-3 h-3" /> In Kitchen
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
});
