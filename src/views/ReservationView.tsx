import React, { useState } from "react";
import {
  CalendarCheck,
  Clock,
  Users,
  MapPin,
  CheckCircle2,
  Sparkles,
  Heart,
  Phone,
  ShieldCheck,
  CreditCard,
  QrCode,
  Lock,
  AlertCircle,
  Zap,
  Utensils,
  Coffee,
} from "lucide-react";
import { SeatingStatus, ReservationRecord, UserSession, PreBookingConfig, WebsiteContentConfig } from "../types/niea";
import { UpiPaymentBox, UPI_ID } from "../components/UpiPaymentBox";
import { generateTokenNumber } from "../utils/tokenHelper";
import { NavTab } from "../components/Header";

interface ReservationViewProps {
  seating: SeatingStatus;
  onSelectTable?: (table: string) => void;
  onNewReservation?: (res: ReservationRecord) => void;
  activeHoldsCount?: number;
  userSession?: UserSession | null;
  onOpenAuth?: () => void;
  preBookingConfig?: PreBookingConfig;
  websiteConfig?: WebsiteContentConfig;
  onSelectTab?: (tab: NavTab) => void;
}

export const ReservationView: React.FC<ReservationViewProps> = ({
  seating,
  onNewReservation,
  activeHoldsCount = 0,
  userSession,
  onOpenAuth,
  preBookingConfig = {
    isEnabled: true,
    startHour: 11,
    endHour: 16,
    timeSlotIntervalMinutes: 30,
    advanceDepositAmount: 150,
  },
  websiteConfig,
  onSelectTab,
}) => {
  const [date, setDate] = useState("Today");
  const [timeSlot, setTimeSlot] = useState("2:00 PM (Afternoon Brioche)");
  const [guestCount, setGuestCount] = useState(2);
  const [seatingArea, setSeatingArea] = useState<"table1" | "table2" | "patio" | "indoor" | "window">("table1");
  const [name, setName] = useState(userSession?.name || "");
  const [phone, setPhone] = useState(userSession?.phoneNumber || "");
  const [email, setEmail] = useState("");
  const [notes, setNotes] = useState("");

  // Sync userSession changes
  React.useEffect(() => {
    if (userSession?.isLoggedIn) {
      if (userSession.name) setName(userSession.name);
      if (userSession.phoneNumber) setPhone(userSession.phoneNumber);
    }
  }, [userSession]);
  const [depositPaymentMethod, setDepositPaymentMethod] = useState<"razorpay">("razorpay");
  const [isProcessing, setIsProcessing] = useState(false);
  const [confirmedReservation, setConfirmedReservation] = useState<ReservationRecord | null>(null);

  const TABLE_DEPOSIT_AMOUNT = 150; // INR flat table deposit, 100% credited against cafe bill

  const timeSlots = [
    "1:00 PM (Opening & Lunch)",
    "2:30 PM (Afternoon Brioche & Melts)",
    "4:00 PM (Cat Siesta & Refreshers)",
    "5:30 PM (Evening Artisan Bakes)",
    "7:00 PM (Prime Dinner Rush)",
    "8:30 PM (Late Sourdough Toasties)",
    "9:45 PM (Night Bites & Dessert)",
  ];

  const handleBook = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      alert("Please enter your name and phone number for table reservation.");
      return;
    }

    const depositAmount = preBookingConfig.advanceDepositAmount || TABLE_DEPOSIT_AMOUNT;

    const finalizeReservation = (paymentId?: string) => {
      const ref = `NIEA-RES-${Math.floor(1000 + Math.random() * 9000)}`;
      const tokenNum = generateTokenNumber();
      const newReservation: ReservationRecord = {
        id: `res_${Date.now()}`,
        bookingRef: ref,
        tokenNumber: tokenNum,
        bookingType: "pre_order",
        customerName: name,
        customerPhone: phone,
        customerEmail: email,
        date,
        timeSlot,
        guestCount,
        seatingArea,
        specialNotes: notes,
        status: "confirmed",
        advanceDeposit: depositAmount,
        depositStatus: "paid",
        depositTxnId: paymentId || undefined,
        autoHoldActive: false,
        autoReleased: false,
        createdAt: new Date().toISOString(),
      };

      // Notify backend API
      fetch("/api/reservations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newReservation),
      }).catch(() => {});

      // Dispatch automated WhatsApp notification for table pre-booking
      if (phone.replace(/\D/g, "").slice(-10).length === 10) {
        fetch("/api/whatsapp/notify-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tokenNumber: tokenNum,
            orderNumber: ref,
            customerName: name,
            customerPhone: phone,
            orderType: "dine-in",
            orderKind: "pre_order",
            tableNumber: seatingArea.toUpperCase(),
            items: [{ item: { name: `Table Booking (${guestCount} Guests - ${timeSlot})` }, quantity: 1, totalPrice: depositAmount }],
            grandTotal: depositAmount,
            estimatedWaitingMinutes: 0,
            paymentMethod: depositPaymentMethod,
          }),
        }).catch((err) => console.error("WhatsApp reservation notify error:", err));
      }

      if (onNewReservation) {
        onNewReservation(newReservation);
      }

      setIsProcessing(false);
      setConfirmedReservation(newReservation);
    };

    if (depositPaymentMethod === "razorpay" && typeof window !== "undefined" && (window as unknown as { Razorpay: unknown }).Razorpay) {
      setIsProcessing(true);
      try {
        const res = await fetch("/api/create-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            amount: depositAmount,
            orderType: "dine-in",
            customerName: name,
            customerPhone: phone,
          }),
        });
        const orderData = await res.json().catch(() => ({}));
        const RazorpayClass = (window as unknown as { Razorpay: new (opts: unknown) => { open: () => void } }).Razorpay;
        const razorpayKey = orderData.keyId || "rzp_test_TgWOn7ADNg8Szc";
        const options = {
          key: razorpayKey,
          amount: Math.round(depositAmount * 100),
          currency: "INR",
          name: "NiEA'S SANDWICH BAR",
          description: `Table Reservation Deposit (${guestCount} Guests)`,
          order_id: orderData.isLiveOrder ? orderData.orderId : undefined,
          image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=120&auto=format&fit=crop&q=80",
          prefill: {
            name: name || "NiEA Guest",
            contact: phone || "9887219990",
            email: email || "guest@nieasandwichbar.com",
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
            finalizeReservation(response.razorpay_payment_id || `pay_${Date.now()}`);
          },
          modal: {
            ondismiss: function () {
              setIsProcessing(false);
            },
          },
        };
        const rzp = new RazorpayClass(options);
        rzp.open();
        return;
      } catch (err) {
        console.error("Razorpay reservation checkout error:", err);
      }
    }

    finalizeReservation();
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10 space-y-8">
      {/* Title & Introduction */}
      <div className="text-center max-w-2xl mx-auto">
        <span className="text-xs uppercase font-extrabold tracking-widest text-[#F5E086]">
          Guaranteed Table Booking
        </span>
        <h1 className="font-niea font-bold text-3xl sm:text-4xl text-white mt-1">
          Table Reservation & Cat Lounge
        </h1>
        <p className="text-xs sm:text-sm text-[#FBF9F2]/80 mt-2 leading-relaxed">
          Book your table at NiEA'S in Action Area 1, New Town, Kolkata. Enjoy handcrafted sourdough melts, French brioche toasties, and warm artisanal brews.
        </p>
      </div>

      {/* If Table Reservations are disabled */}
      {websiteConfig?.isReservationEnabled === false ? (
        <div className="max-w-xl mx-auto bg-[#374C44] rounded-3xl border border-[#F5E086]/30 p-8 sm:p-10 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-[#F5E086]/15 border border-[#F5E086]/40 text-[#F5E086] flex items-center justify-center mx-auto">
            <CalendarCheck className="w-8 h-8" />
          </div>

          <div className="space-y-2">
            <span className="text-xs font-bold text-[#F5E086] uppercase tracking-wider px-3 py-1 rounded-full bg-[#F5E086]/10 border border-[#F5E086]/20 inline-block">
              Coming in Future
            </span>
            <h2 className="font-niea font-bold text-2xl sm:text-3xl text-white">
              Table Reservations Launching Soon
            </h2>
            <p className="text-xs sm:text-sm text-[#FBF9F2]/80 leading-relaxed max-w-md mx-auto">
              We are currently fine-tuning our cozy dining space in Action Area 1, New Town. Online table booking with advance seat reservations will go live in an upcoming update!
            </p>
          </div>

          <div className="p-4 rounded-2xl bg-[#24332D]/70 border border-white/10 text-left space-y-2 text-xs">
            <div className="flex items-center gap-2 text-[#F5E086] font-bold">
              <Sparkles className="w-4 h-4" />
              <span>Takeaway & Pre-Orders Are Open!</span>
            </div>
            <p className="text-white/70">
              You can still browse our handcrafted sourdough sandwiches, order fresh takeaway, or pre-order your favorite melts online.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => onSelectTab?.("menu")}
              className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-[#F5E086] hover:bg-[#F8E79B] text-[#24332D] font-extrabold text-sm transition shadow-lg flex items-center justify-center gap-2 mx-auto cursor-pointer active:scale-95"
            >
              <Utensils className="w-4 h-4" />
              <span>Explore Menu & Order Takeaway</span>
            </button>
          </div>
        </div>
      ) : confirmedReservation ? (
        /* Booking Confirmation Card */
        <div className="max-w-xl mx-auto bg-[#374C44] rounded-3xl border border-[#F5E086]/30 p-6 sm:p-8 shadow-2xl text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-400 flex items-center justify-center mx-auto text-2xl">
            <CheckCircle2 className="w-9 h-9" />
          </div>

          <div className="space-y-1">
            <span className="text-xs font-bold text-[#F5E086] uppercase tracking-wider">
              Table Confirmed & Secured
            </span>
            <h2 className="font-niea font-bold text-2xl sm:text-3xl text-white">
              We look forward to hosting you, {confirmedReservation.customerName}!
            </h2>
            <p className="text-xs text-[#FBF9F2]/75">
              Advance deposit of <strong>₹{confirmedReservation.advanceDeposit}</strong> received and credited to your bill.
            </p>
          </div>

          {/* Token Box */}
          {confirmedReservation.tokenNumber && (
            <div className="bg-[#1E2B25] p-4 rounded-2xl border-2 border-[#F5E086]/50 text-center space-y-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-white/50 block">
                PRIORITY QUEUE TOKEN
              </span>
              <div className="font-niea font-black text-4xl text-[#F5E086]">
                {confirmedReservation.tokenNumber}
              </div>
              <p className="text-[11px] text-emerald-300 font-semibold">
                💬 Automated WhatsApp booking confirmation sent to {confirmedReservation.customerPhone}
              </p>
            </div>
          )}

          {/* Ticket voucher */}
          <div className="bg-[#2B3D36] rounded-2xl p-5 border border-[#F5E086]/20 text-left space-y-3">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <div>
                <span className="text-[10px] uppercase font-bold text-white/50 block">Booking Reference</span>
                <span className="font-niea font-bold text-lg text-[#F5E086]">{confirmedReservation.bookingRef}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] uppercase font-bold text-white/50 block">Status</span>
                <span className="px-2.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30">
                  Confirmed & Active
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <span className="text-[10px] uppercase text-white/50 block">Date & Time Slot</span>
                <span className="font-semibold text-[#FBF9F2]">{confirmedReservation.date} • {confirmedReservation.timeSlot}</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-white/50 block">Reserved Headcount</span>
                <span className="font-semibold text-[#FBF9F2]">{confirmedReservation.guestCount} Guests</span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-white/50 block">Seating Table</span>
                <span className="font-semibold text-[#F5E086] capitalize">
                  {confirmedReservation.seatingArea === "table2"
                    ? "Cozy Table 2 (Window)"
                    : "Cozy Table 1 (Sourdough)"}
                </span>
              </div>
              <div>
                <span className="text-[10px] uppercase text-white/50 block">Deposit Credited</span>
                <span className="font-bold text-emerald-300">₹{confirmedReservation.advanceDeposit} Paid (Deductible)</span>
              </div>
            </div>
          </div>

          {/* Table hold and arrival info for guest */}
          <div className="p-4 rounded-2xl bg-[#24332D] text-left text-xs text-[#FBF9F2]/80 space-y-1.5 border border-[#F5E086]/20">
            <div className="flex items-center gap-1.5 font-bold text-[#F5E086]">
              <Sparkles className="w-4 h-4" />
              <span>Table Reservation Details:</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              • Your table is prepared and held starting 10 minutes before your reserved time.
            </p>
            <p className="text-[11px] leading-relaxed">
              • We hold tables with a 30-minute grace window. Please check in with staff when you arrive.
            </p>
            <p className="text-[11px] leading-relaxed">
              • Your ₹{confirmedReservation.advanceDeposit} advance deposit is directly credited to your final bill.
            </p>
          </div>

          <button
            onClick={() => setConfirmedReservation(null)}
            className="px-6 py-2.5 rounded-full bg-[#F5E086] hover:bg-[#F8E79B] text-[#24332D] font-bold text-xs transition"
          >
            Book Another Table
          </button>
        </div>
      ) : (
        /* Reservation Form & Seating Status */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Booking Form (Left 7 cols) */}
          <div className="lg:col-span-7 bg-[#374C44] rounded-3xl border border-[#F5E086]/20 p-6 sm:p-7 shadow-xl">
            <form onSubmit={handleBook} className="space-y-6">
              {/* Pre-Booking Operating Window Banner */}
              <div className="p-4 rounded-2xl bg-[#1E2B25] border border-[#F5E086]/30 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-[#F5E086] flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-400" />
                    <span>Online Pre-Booking: {preBookingConfig.startHour % 12 || 12}:00 {preBookingConfig.startHour >= 12 ? "PM" : "AM"} – {preBookingConfig.endHour % 12 || 12}:00 {preBookingConfig.endHour >= 12 ? "PM" : "AM"}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                    Advance Slot Active
                  </span>
                </div>
                <p className="text-[11px] text-white/70 leading-relaxed">
                  {preBookingConfig.message || "Pre-booking reserves your table and sandwich slots. Afterward, walk-in dining and live queue tickets are active."}
                </p>
              </div>

              {/* Step 1: Date Selection */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#F5E086] block mb-2.5">
                  1. Date
                </label>
                <div className="grid grid-cols-3 gap-2 sm:gap-3 text-xs">
                  {["Today", "Tomorrow", "This Weekend"].map((d) => (
                    <button
                      key={d}
                      type="button"
                      onClick={() => setDate(d)}
                      className={`py-2.5 px-3 rounded-2xl font-bold border transition text-center ${
                        date === d
                          ? "bg-[#F5E086] text-[#24332D] border-[#F5E086]"
                          : "bg-[#2B3D36] text-white/80 border-white/10 hover:border-[#F5E086]/40"
                      }`}
                    >
                      {d}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 2: Time Slot Selection */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-[#F5E086] block mb-2.5">
                  2. Time Slot
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {timeSlots.map((ts) => (
                    <button
                      key={ts}
                      type="button"
                      onClick={() => setTimeSlot(ts)}
                      className={`p-2.5 rounded-xl text-left border transition ${
                        timeSlot === ts
                          ? "bg-[#F5E086] text-[#24332D] font-bold border-[#F5E086]"
                          : "bg-[#2B3D36] text-white/80 border-white/10 hover:border-[#F5E086]/30 font-medium"
                      }`}
                    >
                      {ts}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 3: Guest Count */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#F5E086]">
                    3. Number of Guests (Seats to Reserve)
                  </label>
                  <span className="text-xs text-white/70 font-semibold">{guestCount} People</span>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto pb-1">
                  {[1, 2, 3, 4].map((num) => (
                    <button
                      key={num}
                      type="button"
                      onClick={() => setGuestCount(num)}
                      className={`w-11 h-11 rounded-2xl font-black text-sm shrink-0 border transition ${
                        guestCount === num
                          ? "bg-[#F5E086] text-[#24332D] border-[#F5E086] shadow-sm"
                          : "bg-[#2B3D36] text-white/80 border-white/10 hover:border-[#F5E086]/30"
                      }`}
                    >
                      {num}
                    </button>
                  ))}
                </div>
              </div>

              {/* Step 4: Table Selection */}
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#F5E086]">
                    4. Select Table (Only 2 Tables Total)
                  </label>
                  <span className="text-[11px] text-[#F5E086] font-semibold bg-[#24332D] px-2 py-0.5 rounded-full border border-[#F5E086]/20">
                    Cozy Small Cafe
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <button
                    type="button"
                    onClick={() => setSeatingArea("table1")}
                    className={`p-3.5 rounded-2xl border text-left transition ${
                      seatingArea === "table1" || seatingArea === "indoor"
                        ? "bg-[#F5E086] text-[#24332D] border-[#F5E086] font-bold shadow-md"
                        : "bg-[#2B3D36] text-white/80 border-white/10 hover:border-[#F5E086]/30"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Utensils className="w-4 h-4" />
                      <span className="text-[10px] font-mono font-bold bg-[#24332D]/20 px-2 py-0.5 rounded-full">
                        Up to 4 Guests
                      </span>
                    </div>
                    <span className="font-bold block text-sm">Table 1</span>
                    <span
                      className={`text-[11px] block mt-0.5 ${
                        seatingArea === "table1" || seatingArea === "indoor"
                          ? "text-[#24332D]/80"
                          : "text-white/60"
                      }`}
                    >
                      Cozy Sourdough Table • Center seating
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSeatingArea("table2")}
                    className={`p-3.5 rounded-2xl border text-left transition ${
                      seatingArea === "table2" || seatingArea === "patio" || seatingArea === "window"
                        ? "bg-[#F5E086] text-[#24332D] border-[#F5E086] font-bold shadow-md"
                        : "bg-[#2B3D36] text-white/80 border-white/10 hover:border-[#F5E086]/30"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <Coffee className="w-4 h-4" />
                      <span className="text-[10px] font-mono font-bold bg-[#24332D]/20 px-2 py-0.5 rounded-full">
                        Up to 4 Guests
                      </span>
                    </div>
                    <span className="font-bold block text-sm">Table 2</span>
                    <span
                      className={`text-[11px] block mt-0.5 ${
                        seatingArea === "table2" || seatingArea === "patio" || seatingArea === "window"
                          ? "text-[#24332D]/80"
                          : "text-white/60"
                      }`}
                    >
                      Cozy Window Table • Natural light & view
                    </span>
                  </button>
                </div>
              </div>

              {/* Step 5: Guest Details */}
              <div className="space-y-3 pt-2 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#F5E086] block">
                    5. Guest Information
                  </label>
                  {userSession?.isLoggedIn ? (
                    <span className="text-[11px] text-emerald-300 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      Auto-filled from Google Profile
                    </span>
                  ) : (
                    onOpenAuth && (
                      <button
                        type="button"
                        onClick={onOpenAuth}
                        className="text-[11px] text-[#F5E086] font-bold hover:underline"
                      >
                        Sign in with Google to auto-fill →
                      </button>
                    )
                  )}
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <input
                    type="text"
                    placeholder="Your Full Name *"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#2B3D36] border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#F5E086]"
                  />
                  <input
                    type="tel"
                    placeholder="Mobile Number *"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#2B3D36] border border-white/10 text-white placeholder-white/40 focus:outline-none focus:border-[#F5E086]"
                  />
                </div>
                <input
                  type="text"
                  placeholder="Special requests or dietary needs..."
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-[#2B3D36] border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#F5E086]"
                />
              </div>

              {/* Step 6: Advance Deposit Policy & QR Code */}
              <div className="space-y-3 pt-3 border-t border-white/10">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold uppercase tracking-wider text-[#F5E086] block">
                    6. Table Guarantee Deposit (₹{TABLE_DEPOSIT_AMOUNT})
                  </label>
                  <span className="text-[11px] text-emerald-400 font-semibold">
                    100% Deductible from Bill
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-[#2B3D36] border border-white/10 text-xs text-[#FBF9F2]/85 space-y-2">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-[#F5E086] shrink-0 mt-0.5" />
                    <p className="text-[11px] leading-relaxed">
                      To prevent ghost bookings and guarantee seat availability, reservations require a small advance deposit of <strong>₹{TABLE_DEPOSIT_AMOUNT}</strong>. Pay at counter is not unlocked for reservations.
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#24332D] border border-[#F5E086]/20 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <CreditCard className="w-4 h-4 text-[#F5E086]" />
                      <div>
                        <span className="font-bold text-white block">Razorpay Instant Gateway</span>
                        <span className="text-[10px] text-white/60 block">UPI QR Auto-Detect, GPay, PhonePe, Cards</span>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30">
                      Auto-Verified
                    </span>
                  </div>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isProcessing}
                className="w-full py-3.5 rounded-full bg-[#e1ad01] hover:bg-[#cca000] disabled:opacity-60 text-[#1E2B25] font-black text-sm transition shadow-[0_0_24px_rgba(225,173,1,0.55)] hover:shadow-[0_0_32px_rgba(225,173,1,0.85)] border border-[#ffd233] flex items-center justify-center gap-2 active:scale-98 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-[#24332D] border-t-transparent rounded-full animate-spin" />
                    <span>Processing with Razorpay...</span>
                  </>
                ) : (
                  <>
                    <CalendarCheck className="w-4 h-4" />
                    <span>Confirm & Lock Table ({guestCount} Guests • ₹{TABLE_DEPOSIT_AMOUNT} Deposit)</span>
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Right Column: Live Floor Status & Intelligent Automation (5 cols) */}
          <div className="lg:col-span-5 space-y-6">
            {/* Live Seating Gauge Card */}
            <div className="bg-[#374C44] rounded-3xl border border-[#F5E086]/20 p-6 shadow-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-niea font-bold text-lg text-[#F5E086]">
                    Floor Availability
                  </h3>
                  <p className="text-[11px] text-white/60">Auto-synced with active reservations</p>
                </div>
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
              </div>

              <div className="bg-[#2B3D36] rounded-2xl p-4 border border-white/10 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-white/70">Seats Free Right Now:</span>
                  <span className="font-bold text-[#F5E086] text-sm">
                    {seating.availableSeats} of {seating.totalSeats} seats
                  </span>
                </div>
                <div className="w-full bg-[#24332D] h-2.5 rounded-full overflow-hidden">
                  <div
                    className="bg-[#F5E086] h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.min(100, (seating.availableSeats / seating.totalSeats) * 100)}%`,
                    }}
                  />
                </div>
                <div className="flex items-center justify-between text-[11px] text-[#FBF9F2]/75">
                  <span>Active Holds: <strong className="text-[#F5E086]">{activeHoldsCount} seats</strong></span>
                  <span className="text-emerald-300">Live Auto-Sync Active</span>
                </div>
              </div>

              {/* Intelligent Automation Rule Card */}
              <div className="p-3.5 rounded-2xl bg-[#24332D] border border-white/10 text-xs space-y-2">
                <div className="flex items-center gap-2 text-[#F5E086] font-bold">
                  <Zap className="w-4 h-4" />
                  <span>How Our Smart Seating Sync Works</span>
                </div>
                <ul className="text-[11px] text-white/80 space-y-1.5 list-disc list-inside">
                  <li>
                    <strong>T-minus 10 mins:</strong> Available seats automatically decrease by your party size before you arrive.
                  </li>
                  <li>
                    <strong>Check-in:</strong> When staff seat you, the table remains occupied.
                  </li>
                  <li>
                    <strong>30-min auto-release:</strong> If customers don't arrive within 30 mins, seats auto-restore for walk-ins.
                  </li>
                </ul>
              </div>

              {/* Table Zones */}
              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#2B3D36] border border-white/5">
                  <span className="flex items-center gap-2">
                    <Utensils className="w-3.5 h-3.5 text-[#F5E086]" />
                    <span className="font-medium text-[#FBF9F2]">Table 1 (Cozy Sourdough • 4 Seats)</span>
                  </span>
                  <span className="text-emerald-400 font-bold">Available</span>
                </div>

                <div className="flex items-center justify-between p-2.5 rounded-xl bg-[#2B3D36] border border-white/5">
                  <span className="flex items-center gap-2">
                    <Coffee className="w-3.5 h-3.5 text-[#F5E086]" />
                    <span className="font-medium text-[#FBF9F2]">Table 2 (Cozy Window • 4 Seats)</span>
                  </span>
                  <span className="text-emerald-400 font-bold">Available</span>
                </div>
              </div>
            </div>

            {/* Cafe Location & Contact */}
            <div className="bg-[#374C44]/70 rounded-3xl border border-[#F5E086]/15 p-5 space-y-3 text-xs text-[#FBF9F2]/80">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-[#F5E086] shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-white block">NiEA'S Cafe Location</span>
                  <span>Action Area 1, New Town, Kolkata, West Bengal 700156</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-2 border-t border-white/5">
                <Clock className="w-4 h-4 text-[#F5E086] shrink-0" />
                <div>
                  <span className="font-semibold text-white">Hours: 1:00 PM – 11:00 PM</span>
                  <span className="block text-[11px] text-amber-300 font-bold">Monday: Closed</span>
                </div>
              </div>

              <div className="flex items-center gap-2.5 pt-2 border-t border-white/5">
                <Phone className="w-4 h-4 text-[#F5E086] shrink-0" />
                <a href="tel:+918274047424" className="hover:text-[#F5E086] font-bold text-white transition">
                  Host Stand & Table Support: +91 82740 47424
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
