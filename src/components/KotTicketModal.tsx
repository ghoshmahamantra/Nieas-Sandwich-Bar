import React from "react";
import { X, Printer, ChefHat, Clock, AlertCircle, CheckCircle2 } from "lucide-react";
import { OrderRecord } from "../types/niea";

interface KotTicketModalProps {
  order: OrderRecord | null;
  isOpen: boolean;
  onClose: () => void;
  onAdvanceStatus?: (orderId: string, nextStatus: "toasting" | "ready" | "served") => void;
  onPrintKot?: (orderId: string) => void;
}

export const KotTicketModal: React.FC<KotTicketModalProps> = ({
  order,
  isOpen,
  onClose,
  onAdvanceStatus,
  onPrintKot,
}) => {
  if (!isOpen || !order) return null;

  const handlePrint = () => {
    onPrintKot?.(order.id);
    window.print();
  };

  const orderKindBadge =
    order.orderKind === "pre_order"
      ? "PRE-ORDER"
      : order.orderKind === "walk_in"
      ? "WALK-IN"
      : order.orderType === "dine-in"
      ? "DINE-IN"
      : "TAKEAWAY";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-md bg-[#24332D] text-[#FBF9F2] rounded-3xl border border-[#F5E086]/30 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 bg-[#1E2B25] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#F5E086] text-[#24332D] flex items-center justify-center font-bold">
              <ChefHat className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-niea font-bold text-base text-[#F5E086]">Kitchen Order Ticket (KOT)</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-white/10 text-white">
                  {orderKindBadge}
                </span>
              </div>
              <p className="text-[11px] text-white/60">Cast-iron chef & barista dispatch</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Printable Ticket Area */}
        <div id="printable-kot" className="p-5 overflow-y-auto flex-1 space-y-4 font-mono text-xs">
          {/* Thermal Receipt styling */}
          <div className="bg-[#FAF8F0] text-gray-900 p-4 sm:p-5 rounded-2xl shadow-inner border border-amber-200/50 space-y-3">
            {/* Header info */}
            <div className="text-center border-b border-dashed border-gray-400 pb-2.5 space-y-1">
              <h2 className="font-black text-lg tracking-wider">NiEA'S SANDWICH BAR</h2>
              <p className="text-[10px] text-gray-600 font-sans">KITCHEN ORDER TICKET (KOT)</p>
              <div className="pt-1">
                <span className="inline-block px-3 py-1 bg-black text-white font-black text-xl rounded-md">
                  TOKEN {order.tokenNumber || order.orderNumber}
                </span>
              </div>
            </div>

            {/* Meta Details */}
            <div className="grid grid-cols-2 gap-1 text-[11px] border-b border-dashed border-gray-400 pb-2">
              <div>
                <span className="text-gray-500 font-sans text-[10px]">Type / Table:</span>
                <p className="font-bold text-black uppercase">
                  {order.tableNumber || (order.orderType === "dine-in" ? "Dine-In Table" : "Counter Takeaway")}
                </p>
              </div>
              <div className="text-right">
                <span className="text-gray-500 font-sans text-[10px]">Time / Server:</span>
                <p className="font-bold text-black">
                  {new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })} •{" "}
                  {order.orderSource?.toUpperCase() || "WEB"}
                </p>
              </div>
              <div>
                <span className="text-gray-500 font-sans text-[10px]">Guest:</span>
                <p className="font-bold text-black truncate">{order.customerName}</p>
              </div>
              <div className="text-right">
                <span className="text-gray-500 font-sans text-[10px]">Est. Prep Target:</span>
                <p className="font-bold text-emerald-800">{order.estimatedWaitingMinutes || 25} MINS</p>
              </div>
            </div>

            {/* Item List */}
            <div className="space-y-2.5 py-1">
              <div className="flex justify-between font-black text-[11px] text-gray-700 uppercase border-b border-gray-200 pb-1">
                <span>ITEM / SPECIAL MODS</span>
                <span>QTY</span>
              </div>

              {order.items.map((it, idx) => (
                <div key={idx} className="border-b border-gray-100 pb-1.5 space-y-0.5">
                  <div className="flex justify-between items-start font-bold text-sm text-black">
                    <span className="flex-1 pr-2">
                      [{idx + 1}] {it.item.name}
                    </span>
                    <span className="text-base font-black px-2 py-0.5 bg-gray-200 rounded">x{it.quantity}</span>
                  </div>

                  {it.selectedBread && (
                    <p className="text-[10px] text-gray-700 font-semibold pl-4">
                      • Bread: <span className="underline">{it.selectedBread}</span>
                    </p>
                  )}

                  {it.selectedCustomizations && it.selectedCustomizations.length > 0 && (
                    <div className="text-[10px] text-amber-900 font-bold pl-4">
                      • Add-ons: {it.selectedCustomizations.map((c) => c.name).join(", ")}
                    </div>
                  )}

                  {it.specialInstructions && (
                    <p className="text-[10px] text-rose-700 font-bold pl-4 bg-rose-50 p-1 rounded">
                      ⚠️ Note: {it.specialInstructions}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Special Order Notes */}
            {order.orderNotes && (
              <div className="p-2 bg-amber-50 border border-amber-300 rounded text-[11px] text-amber-950 font-sans font-semibold">
                <strong>Kitchen Note:</strong> {order.orderNotes}
              </div>
            )}

            {/* Footer */}
            <div className="pt-2 border-t border-dashed border-gray-400 text-center text-[10px] text-gray-500 space-y-0.5 font-sans">
              <p>NiEA'S SANDWICH BAR • Fresh artisanal sourdough</p>
              <p>Ref: {order.orderNumber} • KOT Dispatched</p>
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#1E2B25] border-t border-white/10 flex items-center justify-between gap-2.5">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="px-3.5 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition flex items-center gap-1.5"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print KOT</span>
            </button>
            <a
              href={`https://wa.me/91${(order.customerPhone || "").replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(`🔔 *NiEA'S SANDWICH BAR — Your Order is Hot & Ready!* 🥪\n\nHello ${order.customerName || "Valued Guest"}!\n\n✨ *Token Number: ${order.tokenNumber || order.orderNumber} is READY!*\n\n${order.orderType === "dine-in" ? `🪑 Your table (${order.tableNumber || "1"}) is being served with your hot melts. Enjoy!` : `🛍️ Please collect your fresh hot takeaway parcel at the NiEA'S counter.\n\nShow token *${order.tokenNumber || order.orderNumber}* to the counter barista.`}\n\nThank you for dining with us! 🐾`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3.5 py-2 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs transition flex items-center gap-1.5 shadow-sm"
              title="Notify customer on WhatsApp"
            >
              <span>📲 WhatsApp</span>
            </a>
          </div>

          <div className="flex items-center gap-2">
            {onAdvanceStatus && order.status === "received" && (
              <button
                type="button"
                onClick={() => {
                  onAdvanceStatus(order.id, "toasting");
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-[#F5E086] hover:bg-[#F8E79B] text-[#24332D] font-bold text-xs transition shadow flex items-center gap-1"
              >
                <span>Start Toasting</span>
              </button>
            )}

            {onAdvanceStatus && order.status === "toasting" && (
              <button
                type="button"
                onClick={() => {
                  onAdvanceStatus(order.id, "ready");
                  onClose();
                }}
                className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-[#1E2B25] font-black text-xs transition shadow flex items-center gap-1"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Mark Hot & Ready</span>
              </button>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 font-semibold text-xs transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
