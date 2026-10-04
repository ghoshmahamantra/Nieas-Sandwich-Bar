import React, { useState, useEffect } from "react";
import {
  Clock,
  CheckCircle2,
  AlertCircle,
  ToggleLeft,
  ToggleRight,
  Save,
  Zap,
  Sparkles,
  Info,
} from "lucide-react";
import { PreBookingConfig } from "../../types/niea";
import { checkPreBookingWindow } from "../../utils/preBookingHelper";

interface PreBookingConfigTabProps {
  config: PreBookingConfig;
  onUpdateConfig: (nextConfig: PreBookingConfig) => void;
  onNotice?: (msg: string) => void;
}

export const PreBookingConfigTab: React.FC<PreBookingConfigTabProps> = ({
  config,
  onUpdateConfig,
  onNotice,
}) => {
  const [isEnabled, setIsEnabled] = useState(config.isEnabled);
  const [isForceOpen, setIsForceOpen] = useState(Boolean(config.isForceOpen));
  const [startHour, setStartHour] = useState(typeof config.startHour === "number" ? config.startHour : 11);
  const [startMinute, setStartMinute] = useState(typeof config.startMinute === "number" ? config.startMinute : 0);
  const [endHour, setEndHour] = useState(typeof config.endHour === "number" ? config.endHour : 10);
  const [endMinute, setEndMinute] = useState(typeof config.endMinute === "number" ? config.endMinute : 0);
  const [depositAmount, setDepositAmount] = useState(config.advanceDepositAmount || 150);
  const [noticeMessage, setNoticeMessage] = useState(
    config.message ||
      "Pre-orders operate strictly within the configured window. Outside this window, pre-ordering is closed."
  );
  const [isSaved, setIsSaved] = useState(false);

  // Sync incoming config props
  useEffect(() => {
    setIsEnabled(config.isEnabled);
    setIsForceOpen(Boolean(config.isForceOpen));
    if (typeof config.startHour === "number") setStartHour(config.startHour);
    if (typeof config.startMinute === "number") setStartMinute(config.startMinute);
    if (typeof config.endHour === "number") setEndHour(config.endHour);
    if (typeof config.endMinute === "number") setEndMinute(config.endMinute);
    if (typeof config.advanceDepositAmount === "number") setDepositAmount(config.advanceDepositAmount);
    if (config.message) setNoticeMessage(config.message);
  }, [config]);

  const currentStatus = checkPreBookingWindow({
    isEnabled,
    isForceOpen,
    startHour,
    startMinute,
    endHour,
    endMinute,
    timeSlotIntervalMinutes: 30,
    advanceDepositAmount: depositAmount,
    message: noticeMessage,
  });

  const formatHourLabel = (h: number) => {
    const period = h >= 12 ? "PM" : "AM";
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH}:00 ${period}`;
  };

  const formatTimeLabel = (h: number, m: number) => {
    const period = h >= 12 ? "PM" : "AM";
    const displayH = h % 12 === 0 ? 12 : h % 12;
    const displayM = m > 0 ? `:${String(m).padStart(2, "0")}` : ":00";
    return `${displayH}${displayM} ${period}`;
  };

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const updated: PreBookingConfig = {
      isEnabled,
      isForceOpen,
      startHour: Number(startHour),
      startMinute: Number(startMinute),
      endHour: Number(endHour),
      endMinute: Number(endMinute),
      timeSlotIntervalMinutes: 30,
      advanceDepositAmount: Number(depositAmount),
      message: noticeMessage.trim(),
    };

    onUpdateConfig(updated);
    setIsSaved(true);

    fetch("/api/config/pre-booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    }).catch(() => {});

    onNotice?.(`✅ Pre-booking window updated: ${updated.isForceOpen ? "FORCE OPEN (24/7)" : `${formatTimeLabel(startHour, startMinute)} – ${formatTimeLabel(endHour, endMinute)}`}`);
    setTimeout(() => setIsSaved(false), 3000);
  };

  const handleToggleForceOpen = () => {
    const nextForce = !isForceOpen;
    setIsForceOpen(nextForce);
    const updated: PreBookingConfig = {
      isEnabled,
      isForceOpen: nextForce,
      startHour: Number(startHour),
      startMinute: Number(startMinute),
      endHour: Number(endHour),
      endMinute: Number(endMinute),
      timeSlotIntervalMinutes: 30,
      advanceDepositAmount: Number(depositAmount),
      message: noticeMessage.trim(),
    };
    onUpdateConfig(updated);
    fetch("/api/config/pre-booking", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    }).catch(() => {});

    onNotice?.(nextForce ? "⚡ Force Pre-Booking is now ON: Online pre-orders are open 24/7!" : "⚡ Force Pre-Booking turned OFF: Operating on scheduled time window.");
  };

  return (
    <div className="space-y-6 animate-in fade-in">
      {/* Top Banner with Real-Time Window Calculation */}
      <div className="bg-[#1E2B25] p-5 rounded-2xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#F5E086] text-[#24332D] flex items-center justify-center font-bold shadow-md shrink-0">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h3 className="font-niea font-bold text-lg text-[#F5E086]">Pre-Booking System Settings</h3>
              <span
                className={`px-2.5 py-0.5 rounded-full text-[10px] font-black border flex items-center gap-1 ${
                  currentStatus.isOpen
                    ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
                    : "bg-amber-500/20 text-amber-300 border-amber-400/30"
                }`}
              >
                <span className={`w-1.5 h-1.5 rounded-full ${currentStatus.isOpen ? "bg-emerald-400 animate-pulse" : "bg-amber-400"}`} />
                <span>
                  {isForceOpen
                    ? "⚡ FORCE OPEN (Override Active)"
                    : currentStatus.isOpen
                    ? `Open Now (${currentStatus.startFormatted} – ${currentStatus.endFormatted})`
                    : `Closed (Reopens ${currentStatus.nextOpenText})`}
                </span>
              </span>
            </div>
            <p className="text-xs text-white/70 mt-1">
              Set any custom daily operating time range. Outside this window, customer menu displays a prominent closed banner with disabled checkout.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto shrink-0">
          {isSaved && (
            <span className="px-3 py-1 bg-emerald-500 text-[#1E2B25] font-black text-xs rounded-xl flex items-center gap-1 shadow">
              <CheckCircle2 className="w-3.5 h-3.5" /> Saved & Synced!
            </span>
          )}
        </div>
      </div>

      {/* Force Enable Pre-Booking Callout Card */}
      <div className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
        isForceOpen
          ? "bg-gradient-to-r from-emerald-950/70 via-[#1E2B25] to-emerald-950/70 border-emerald-400/50 shadow-md"
          : "bg-[#24332D] border-white/10"
      }`}>
        <div className="flex items-start sm:items-center gap-3">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black shrink-0 ${
            isForceOpen ? "bg-emerald-400 text-[#24332D]" : "bg-white/10 text-white/50"
          }`}>
            <Zap className="w-5 h-5" />
          </div>
          <div>
            <p className="text-sm font-bold text-white flex items-center gap-2">
              <span>Force Enable Pre-Booking (Emergency Override)</span>
              {isForceOpen && (
                <span className="px-2 py-0.2 rounded-full bg-emerald-400/20 text-emerald-300 text-[10px] font-black border border-emerald-400/40 animate-pulse">
                  ACTIVE
                </span>
              )}
            </p>
            <p className="text-xs text-white/60 mt-0.5">
              Instantly keep the pre-ordering system open right now regardless of the scheduled hours. Perfect for special tasting events, rush catering, or testing.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={handleToggleForceOpen}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border self-start sm:self-auto shrink-0 shadow-sm cursor-pointer ${
            isForceOpen
              ? "bg-emerald-400 text-[#24332D] border-emerald-400 hover:bg-emerald-300"
              : "bg-white/10 text-white/80 border-white/20 hover:bg-white/20 hover:text-white"
          }`}
        >
          {isForceOpen ? (
            <>
              <ToggleRight className="w-5 h-5 text-[#24332D]" />
              <span>Force Open: ON</span>
            </>
          ) : (
            <>
              <ToggleLeft className="w-5 h-5 text-white/50" />
              <span>Force Open: OFF</span>
            </>
          )}
        </button>
      </div>

      {/* Main Settings Form */}
      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Column: Operating Window & Advance */}
        <div className="bg-[#24332D] p-5 rounded-2xl border border-white/10 space-y-4">
          <h4 className="font-niea font-bold text-sm text-[#F5E086] border-b border-white/10 pb-2">
            1. Operating Time Window & Deposit
          </h4>

          {/* Master Enable Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-[#1E2B25] rounded-xl border border-white/5">
            <div>
              <p className="text-xs font-bold text-white">Enable Scheduled Pre-Booking Window</p>
              <p className="text-[11px] text-white/60">Enforce daily scheduled pre-order hours</p>
            </div>
            <button
              type="button"
              onClick={() => setIsEnabled((prev) => !prev)}
              className="text-[#F5E086] transition hover:scale-105"
            >
              {isEnabled ? (
                <ToggleRight className="w-8 h-8 text-emerald-400" />
              ) : (
                <ToggleLeft className="w-8 h-8 text-white/40" />
              )}
            </button>
          </div>

          {/* Flexible Hours & Minutes Picker */}
          <div className="p-3.5 bg-[#1E2B25] rounded-xl border border-white/10 space-y-3">
            <p className="text-xs font-bold text-[#F5E086]">Daily Scheduled Operating Hours</p>
            
            <div className="grid grid-cols-2 gap-3">
              {/* Start Time */}
              <div>
                <label className="block text-[11px] font-semibold text-white/80 mb-1">
                  Opens At (Start Time)
                </label>
                <div className="flex gap-1.5">
                  <select
                    value={startHour}
                    onChange={(e) => setStartHour(Number(e.target.value))}
                    className="w-full bg-[#24332D] border border-white/15 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#F5E086]"
                  >
                    {Array.from({ length: 24 }).map((_, h) => (
                      <option key={h} value={h}>
                        {formatHourLabel(h)}
                      </option>
                    ))}
                  </select>
                  <select
                    value={startMinute}
                    onChange={(e) => setStartMinute(Number(e.target.value))}
                    className="w-20 bg-[#24332D] border border-white/15 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#F5E086]"
                  >
                    {[0, 15, 30, 45].map((m) => (
                      <option key={m} value={m}>
                        :{String(m).padStart(2, "0")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* End Time */}
              <div>
                <label className="block text-[11px] font-semibold text-white/80 mb-1">
                  Closes At (End Time)
                </label>
                <div className="flex gap-1.5">
                  <select
                    value={endHour}
                    onChange={(e) => setEndHour(Number(e.target.value))}
                    className="w-full bg-[#24332D] border border-white/15 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#F5E086]"
                  >
                    {Array.from({ length: 24 }).map((_, h) => (
                      <option key={h} value={h}>
                        {formatHourLabel(h)}
                      </option>
                    ))}
                  </select>
                  <select
                    value={endMinute}
                    onChange={(e) => setEndMinute(Number(e.target.value))}
                    className="w-20 bg-[#24332D] border border-white/15 rounded-xl px-2 py-1.5 text-xs text-white focus:outline-none focus:border-[#F5E086]"
                  >
                    {[0, 15, 30, 45].map((m) => (
                      <option key={m} value={m}>
                        :{String(m).padStart(2, "0")}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {/* Quick Preset Buttons */}
            <div className="pt-2 border-t border-white/5">
              <span className="text-[10px] text-white/50 block mb-1.5 font-bold uppercase">Quick Time Presets:</span>
              <div className="flex flex-wrap gap-1.5 text-[11px]">
                <button
                  type="button"
                  onClick={() => {
                    setStartHour(11);
                    setStartMinute(0);
                    setEndHour(15);
                    setEndMinute(0);
                  }}
                  className={`px-2.5 py-1 rounded-lg border transition ${
                    startHour === 11 && endHour === 15 && startMinute === 0
                      ? "bg-[#F5E086] text-[#24332D] font-bold border-[#F5E086]"
                      : "bg-white/5 text-white/70 border-white/10 hover:text-white"
                  }`}
                >
                  11 AM – 3 PM (Standard)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStartHour(11);
                    setStartMinute(0);
                    setEndHour(17);
                    setEndMinute(0);
                  }}
                  className={`px-2.5 py-1 rounded-lg border transition ${
                    startHour === 11 && endHour === 17
                      ? "bg-[#F5E086] text-[#24332D] font-bold border-[#F5E086]"
                      : "bg-white/5 text-white/70 border-white/10 hover:text-white"
                  }`}
                >
                  11 AM – 5 PM (Lunch Rush)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setStartHour(13);
                    setStartMinute(0);
                    setEndHour(22);
                    setEndMinute(30);
                  }}
                  className={`px-2.5 py-1 rounded-lg border transition ${
                    startHour === 13 && endHour === 22
                      ? "bg-[#F5E086] text-[#24332D] font-bold border-[#F5E086]"
                      : "bg-white/5 text-white/70 border-white/10 hover:text-white"
                  }`}
                >
                  1 PM – 10:30 PM (All Day Cafe)
                </button>
              </div>
            </div>
          </div>

          {/* Advance Deposit */}
          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1">
              Advance Pre-Order Deposit (₹)
            </label>
            <input
              type="number"
              min="0"
              step="50"
              value={depositAmount}
              onChange={(e) => setDepositAmount(Number(e.target.value))}
              placeholder="e.g. 150"
              className="w-full bg-[#1E2B25] border border-white/15 rounded-xl px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-[#F5E086]"
            />
            <span className="text-[10px] text-white/50 mt-1 block">
              Credited toward the customer's total bill upon arrival at the cafe counter.
            </span>
          </div>

          {/* Save Button */}
          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-[#F5E086] hover:bg-[#F8E79B] text-[#24332D] font-black text-xs transition shadow-lg flex items-center justify-center gap-1.5 cursor-pointer"
          >
            <Save className="w-4 h-4" />
            <span>Save & Synchronize Pre-Booking Window</span>
          </button>
        </div>

        {/* Right Column: Customer Message & Live Preview */}
        <div className="bg-[#24332D] p-5 rounded-2xl border border-white/10 space-y-4">
          <h4 className="font-niea font-bold text-sm text-[#F5E086] border-b border-white/10 pb-2">
            2. Customer Closed Message & Preview
          </h4>

          <div>
            <label className="block text-xs font-semibold text-white/80 mb-1">
              Closed Window Custom Notice
            </label>
            <textarea
              rows={3}
              value={noticeMessage}
              onChange={(e) => setNoticeMessage(e.target.value)}
              className="w-full bg-[#1E2B25] border border-white/15 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#F5E086]"
            />
            <span className="text-[10px] text-white/50 mt-1 block">
              Displayed on the huge closed banner when customer visits the menu outside pre-booking hours.
            </span>
          </div>

          {/* Live Customer Banner Preview */}
          <div className="p-4 rounded-2xl bg-[#1E2B25] border border-white/10 space-y-2">
            <span className="text-[10px] uppercase font-bold text-white/60 block">Customer Menu Closed Banner Preview:</span>
            <div className="p-4 rounded-xl bg-gradient-to-r from-amber-950/80 via-[#2A1D17] to-amber-950/80 border-2 border-amber-400/60 text-center space-y-2 shadow-lg">
              <span className="px-3 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-400/40 text-[10px] font-black tracking-widest uppercase">
                ⚠️ PRE-ORDERS ARE CLOSED NOW
              </span>
              <h5 className="font-niea font-bold text-white text-base">
                WILL OPEN FROM {currentStatus.startFormatted}
              </h5>
              <p className="text-xs text-amber-100/80 max-w-sm mx-auto">
                {noticeMessage}
              </p>
              <div className="pt-1 text-[11px] text-[#F5E086] font-semibold">
                Daily Window: {formatTimeLabel(startHour, startMinute)} – {formatTimeLabel(endHour, endMinute)}
              </div>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
};
