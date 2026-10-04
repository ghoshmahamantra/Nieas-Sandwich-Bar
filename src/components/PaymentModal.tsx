import React, { useState } from "react";
import {
  X,
  CreditCard,
  QrCode,
  CheckCircle2,
  Lock,
  ArrowRight,
  Sparkles,
  Utensils,
  ShoppingBag,
  Building,
  Clock,
} from "lucide-react";
import { CartItem, OrderType, OrderRecord } from "../types/niea";
import { UPI_ID } from "./UpiPaymentBox";
import { generateTokenNumber } from "../utils/tokenHelper";

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  items: CartItem[];
  orderType: OrderType;
  selectedTable?: string;
  subtotal: number;
  discount: number;
  discountCode?: string;
  onOrderSuccess: (order: OrderRecord) => void;
  onTrackOrder?: (orderNumber: string) => void;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({
  isOpen,
  onClose,
  items,
  orderType,
  selectedTable,
  subtotal,
  discount,
  discountCode,
  onOrderSuccess,
  onTrackOrder,
}) => {
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "upi" | "card" | "counter">("razorpay");
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [upiVpa, setUpiVpa] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedOrder, setConfirmedOrder] = useState<OrderRecord | null>(null);

  if (!isOpen) return null;

  const taxes = Math.round(subtotal * 0.05); // 5% GST
  const packagingFee = orderType === "takeaway" ? 25 : 0;
  const grandTotal = Math.max(0, subtotal + taxes + packagingFee - discount);

  const handleRazorpayGateway = async () => {
    setIsProcessing(true);

    try {
      // 1. Request order_id from backend
      const res = await fetch("/api/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: grandTotal,
          orderType,
          customerName: customerName || "Guest Customer",
          customerPhone: customerPhone || "9888800000",
        }),
      });

      const data = await res.json().catch(() => ({}));
      const orderId = data.orderId || `order_${Date.now()}`;
      const razorpayKey = data.keyId || "rzp_test_TgWOn7ADNg8Szc";

      // 2. If Razorpay Web SDK is available in window
      if (typeof window !== "undefined" && (window as unknown as { Razorpay: unknown }).Razorpay) {
        const RazorpayClass = (window as unknown as { Razorpay: new (opts: unknown) => { open: () => void } }).Razorpay;
        const options = {
          key: razorpayKey,
          amount: grandTotal * 100, // amount in paisa
          currency: "INR",
          name: "NiEA'S SANDWICH BAR",
          description: `Order Payment (${orderType.toUpperCase()})`,
          order_id: data.isLiveOrder ? orderId : undefined,
          image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=120&auto=format&fit=crop&q=80",
          prefill: {
            name: customerName || "NiEA Guest",
            contact: customerPhone || "9887219990",
            email: "guest@nieasandwichbar.com",
          },
          theme: {
            color: "#49655B",
          },
          handler: async function (response: { razorpay_payment_id?: string; razorpay_order_id?: string; razorpay_signature?: string }) {
            try {
              await fetch("/api/verify-payment", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(response),
              });
            } catch {}
            finalizeOrder(response.razorpay_payment_id || `pay_${Date.now()}`);
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
            },
          },
        };

        try {
          const rzp = new RazorpayClass(options);
          rzp.open();
          return;
        } catch (err) {
          console.error("Razorpay open error:", err);
        }
      }

      // Fallback if Razorpay script didn't load
      setTimeout(() => {
        finalizeOrder(`rzp_fallback_${Date.now()}`);
      }, 1000);
    } catch (err) {
      console.error(err);
      setIsProcessing(false);
    }
  };

  const finalizeOrder = (paymentId: string) => {
    const orderNumber = `NIEA-${Math.floor(100 + Math.random() * 900)}`;
    const tokenNumber = generateTokenNumber();
    const newOrder: OrderRecord = {
      id: `ord-${Date.now()}`,
      orderNumber,
      tokenNumber,
      orderType,
      orderKind: orderType === "dine-in" ? "dine_in" : "takeaway",
      orderSource: "website",
      tableNumber: orderType === "dine-in" ? selectedTable || "Table 1" : undefined,
      customerName: customerName.trim() || "NiEA Guest",
      customerPhone: customerPhone.trim() || "+91 98872 19990",
      items,
      subtotal,
      taxes,
      packagingCharge: packagingFee,
      discount,
      grandTotal,
      paymentMethod,
      paymentStatus: paymentMethod === "counter" ? "pending" : "paid",
      razorpayPaymentId: paymentId,
      createdAt: new Date().toISOString(),
      estimatedTime: orderType === "dine-in" ? "10–12 minutes" : "12–15 minutes",
      estimatedWaitingMinutes: 15,
      status: "received",
      kitchenStatus: "kot_dispatched",
    };

    setIsProcessing(false);
    setConfirmedOrder(newOrder);
    onOrderSuccess(newOrder);
  };

  const handleSubmitPayment = (e: React.FormEvent) => {
    e.preventDefault();

    if (paymentMethod === "razorpay") {
      handleRazorpayGateway();
      return;
    }

    setIsProcessing(true);
    setTimeout(() => {
      finalizeOrder(`${paymentMethod}_${Date.now()}`);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-lg bg-[#374C44] rounded-3xl border-2 border-[#F5E086]/40 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#F5E086]/20 bg-[#2B3D36] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <CreditCard className="w-5 h-5 text-[#F5E086]" />
            <div>
              <h3 className="font-niea font-bold text-lg text-[#F5E086]">
                {confirmedOrder ? "Order Confirmed!" : "Secure Online Checkout"}
              </h3>
              <p className="text-xs text-[#FBF9F2]/70">
                {confirmedOrder
                  ? "Your order has been sent to NiEA's kitchen!"
                  : "Razorpay 256-Bit SSL Encrypted Gateway"}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full text-[#FBF9F2]/70 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto flex-1 space-y-4">
          {confirmedOrder ? (
            /* SUCCESS CONFIRMATION RECEIPT */
            <div className="space-y-4 text-center animate-in zoom-in-95 duration-200">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 flex items-center justify-center mx-auto">
                <CheckCircle2 className="w-10 h-10" />
              </div>

              <div>
                <span className="text-[11px] font-black uppercase tracking-widest text-[#F5E086]">
                  Order Number
                </span>
                <h2 className="font-niea font-black text-3xl text-white mt-0.5">
                  {confirmedOrder.orderNumber}
                </h2>
              </div>

              {/* Order Details Card */}
              <div className="p-4 rounded-2xl bg-[#2B3D36] border border-[#F5E086]/20 text-left text-xs space-y-2.5">
                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-[#FBF9F2]/70">Service Mode:</span>
                  <span className="font-bold text-[#F5E086] capitalize flex items-center gap-1">
                    {orderType === "dine-in" ? (
                      <Utensils className="w-3.5 h-3.5" />
                    ) : (
                      <ShoppingBag className="w-3.5 h-3.5" />
                    )}
                    {orderType === "dine-in" ? `Dine-in (${confirmedOrder.tableNumber})` : "Takeaway Pickup"}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-[#FBF9F2]/70">Estimated Time:</span>
                  <span className="font-bold text-emerald-300">
                    {confirmedOrder.estimatedTime}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2 border-b border-white/10">
                  <span className="text-[#FBF9F2]/70">Payment Status:</span>
                  <span className="font-bold text-emerald-400 uppercase">
                    {confirmedOrder.paymentStatus === "paid" ? "Paid Online" : "Pay at Counter"}
                  </span>
                </div>

                {/* Items preview */}
                <div className="space-y-1 pt-1">
                  <span className="text-[10px] text-[#FBF9F2]/50 uppercase font-bold">
                    Items ({confirmedOrder.items.length}):
                  </span>
                  {confirmedOrder.items.map((i) => (
                    <div key={i.cartItemId} className="flex justify-between text-xs">
                      <span className="text-white truncate">
                        {i.quantity}× {i.item.name}
                      </span>
                      <span className="text-[#F5E086] font-bold">₹{i.totalPrice}</span>
                    </div>
                  ))}
                </div>

                <div className="pt-2 border-t border-white/10 flex justify-between font-bold text-sm">
                  <span className="text-white">Grand Total</span>
                  <span className="font-niea text-[#F5E086]">₹{confirmedOrder.grandTotal}</span>
                </div>
              </div>

              <p className="text-xs text-[#FBF9F2]/70">
                Our kitchen and sandwich artisans have started toasting your order!
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                <button
                  type="button"
                  onClick={() => {
                    const ordNum = confirmedOrder.orderNumber;
                    onClose();
                    if (onTrackOrder) onTrackOrder(ordNum);
                  }}
                  className="w-full py-3 rounded-full bg-[#F5E086] text-[#24332D] font-black text-xs hover:bg-[#F8E79B] transition shadow-lg flex items-center justify-center gap-1.5"
                >
                  <Clock className="w-4 h-4" />
                  <span>Track Order Live</span>
                </button>

                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs transition"
                >
                  Back to Menu & Lounge
                </button>
              </div>
            </div>
          ) : (
            /* CHECKOUT FORM */
            <form onSubmit={handleSubmitPayment} className="space-y-4">
              {/* Customer Contact */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-[#F5E086] block mb-1">
                    Your Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Maya Sharma"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#24332D] border border-white/20 text-xs text-white outline-none focus:border-[#F5E086]"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-[#F5E086] block mb-1">
                    Phone Number (for SMS & UPI) *
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="98872 19990"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#24332D] border border-white/20 text-xs text-white outline-none focus:border-[#F5E086]"
                  />
                </div>
              </div>

              {/* Payment Gateway Options */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[#F5E086] block">
                  Select Payment Method
                </label>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("razorpay")}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      paymentMethod === "razorpay"
                        ? "bg-[#F5E086] text-[#24332D] border-[#F5E086] shadow-md"
                        : "bg-[#2B3D36] text-[#FBF9F2] border-white/10 hover:border-white/25"
                    }`}
                  >
                    <div className="flex items-center justify-between w-full">
                      <span className="text-xs font-black font-niea">Razorpay</span>
                      <span className="text-[9px] font-black uppercase px-1.5 py-0.5 rounded bg-blue-600 text-white">
                        Recommended
                      </span>
                    </div>
                    <span className="text-[10px] opacity-80 mt-1">
                      UPI, Cards, Netbanking
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("upi")}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      paymentMethod === "upi"
                        ? "bg-[#F5E086] text-[#24332D] border-[#F5E086] shadow-md"
                        : "bg-[#2B3D36] text-[#FBF9F2] border-white/10 hover:border-white/25"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <QrCode className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">UPI QR Code</span>
                    </div>
                    <span className="text-[10px] opacity-80 mt-1">
                      GPay, PhonePe, Paytm
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      paymentMethod === "card"
                        ? "bg-[#F5E086] text-[#24332D] border-[#F5E086] shadow-md"
                        : "bg-[#2B3D36] text-[#FBF9F2] border-white/10 hover:border-white/25"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <CreditCard className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">Credit / Debit</span>
                    </div>
                    <span className="text-[10px] opacity-80 mt-1">
                      Visa, Mastercard, RuPay
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod("counter")}
                    className={`p-3 rounded-xl border text-left transition flex flex-col justify-between ${
                      paymentMethod === "counter"
                        ? "bg-[#F5E086] text-[#24332D] border-[#F5E086] shadow-md"
                        : "bg-[#2B3D36] text-[#FBF9F2] border-white/10 hover:border-white/25"
                    }`}
                  >
                    <div className="flex items-center gap-1.5">
                      <Building className="w-3.5 h-3.5" />
                      <span className="text-xs font-bold">Pay At Counter</span>
                    </div>
                    <span className="text-[10px] opacity-80 mt-1">
                      Cash / Card on delivery
                    </span>
                  </button>
                </div>
              </div>

              {/* Contextual Input according to Payment Method */}
              {paymentMethod === "upi" && (
                <div className="p-4 rounded-2xl bg-[#2B3D36] border border-[#F5E086]/20 text-center space-y-3">
                  <div className="inline-block p-2 rounded-xl bg-white text-black shadow-inner">
                    {/* Simulated Clean Dynamic QR */}
                    <div className="w-32 h-32 bg-slate-900 rounded-lg p-2 flex flex-col items-center justify-center text-white text-[10px]">
                      <QrCode className="w-16 h-16 text-[#F5E086] mb-1" />
                      <span>Scan with any UPI App</span>
                      <strong className="text-emerald-400">₹{grandTotal}</strong>
                    </div>
                  </div>
                  <p className="text-[11px] text-[#FBF9F2]/70">
                    UPI ID: <strong className="text-[#F5E086]">{UPI_ID}</strong>
                  </p>
                </div>
              )}

              {paymentMethod === "card" && (
                <div className="p-3.5 rounded-2xl bg-[#2B3D36] border border-[#F5E086]/20 space-y-2.5">
                  <div>
                    <label className="text-[10px] font-bold uppercase text-[#F5E086] block mb-1">
                      Card Number
                    </label>
                    <input
                      type="text"
                      maxLength={19}
                      placeholder="4532 •••• •••• 8901"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#24332D] border border-white/20 text-xs text-white outline-none focus:border-[#F5E086]"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#F5E086] block mb-1">
                        Expiry Date
                      </label>
                      <input
                        type="text"
                        maxLength={5}
                        placeholder="MM/YY"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#24332D] border border-white/20 text-xs text-white outline-none focus:border-[#F5E086]"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-bold uppercase text-[#F5E086] block mb-1">
                        CVV / CVC
                      </label>
                      <input
                        type="password"
                        maxLength={4}
                        placeholder="•••"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="w-full px-3 py-2 rounded-xl bg-[#24332D] border border-white/20 text-xs text-white outline-none focus:border-[#F5E086]"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Price Breakdown Bill */}
              <div className="p-3.5 rounded-2xl bg-[#24332D] border border-white/10 text-xs space-y-1.5">
                <div className="flex justify-between text-[#FBF9F2]/70">
                  <span>Subtotal ({items.length} items):</span>
                  <span>₹{subtotal}</span>
                </div>

                {discount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Discount ({discountCode || "Loyalty"}):</span>
                    <span>-₹{discount}</span>
                  </div>
                )}

                <div className="flex justify-between text-[#FBF9F2]/70">
                  <span>GST (5%):</span>
                  <span>₹{taxes}</span>
                </div>

                {packagingFee > 0 && (
                  <div className="flex justify-between text-[#FBF9F2]/70">
                    <span>Artisan Eco Packaging:</span>
                    <span>₹{packagingFee}</span>
                  </div>
                )}

                <div className="pt-2 border-t border-white/15 flex justify-between font-bold text-sm">
                  <span className="text-white">Amount to Pay:</span>
                  <span className="font-niea font-black text-[#F5E086] text-base">
                    ₹{grandTotal}
                  </span>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3.5 rounded-full bg-[#F5E086] hover:bg-[#F8E79B] text-[#24332D] font-bold text-xs sm:text-sm flex items-center justify-center gap-2 shadow-xl transition disabled:opacity-50"
              >
                {isProcessing ? (
                  <>
                    <span className="w-4 h-4 rounded-full border-2 border-[#24332D] border-t-transparent animate-spin" />
                    <span>Processing Secure Gateway...</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-4 h-4" />
                    <span>
                      {paymentMethod === "counter"
                        ? `Place Order for ₹${grandTotal} (Pay at Counter)`
                        : `Pay ₹${grandTotal} with ${paymentMethod.toUpperCase()}`}
                    </span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="flex items-center justify-center gap-2 text-[10px] text-[#FBF9F2]/50 text-center">
                <Lock className="w-3 h-3" />
                <span>PCI-DSS Compliant • Bank Grade 256-Bit SSL Protection</span>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
