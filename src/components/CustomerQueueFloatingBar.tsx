import React, { useState } from "react";
import {
  Clock,
  Flame,
  CheckCircle2,
  Tv,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Ticket,
  ChefHat,
} from "lucide-react";
import { OrderRecord } from "../types/niea";
import { getOrderStepProgress } from "../utils/orderStepProgress";
import { formatTokenNumber } from "../utils/tokenHelper";

interface CustomerQueueFloatingBarProps {
  activeOrder: OrderRecord | null;
  queueOrdersAhead: number;
  onOpenTrack: (orderNumber?: string) => void;
  onOpenLiveCallingBoard: (tokenNumber?: string) => void;
}

export const CustomerQueueFloatingBar: React.FC<CustomerQueueFloatingBarProps> = ({
  activeOrder,
  queueOrdersAhead,
  onOpenTrack,
  onOpenLiveCallingBoard,
}) => {
  const [isMinimized, setIsMinimized] = useState(false);

  if (!activeOrder || activeOrder.status === "served" || activeOrder.status === "cancelled") {
    return null;
  }

  const isReady = activeOrder.status === "ready";
  const isToasting = activeOrder.status === "toasting";
  const stepProgress = getOrderStepProgress(activeOrder);

  if (isMinimized) {
    return (
      <aside
        aria-label="Active order token widget"
        className="fixed bottom-20 sm:bottom-6 right-4 z-40 animate-in fade-in slide-in-from-bottom-2 duration-200"
      >
        <button
          onClick={() => setIsMinimized(false)}
          className={`flex items-center gap-2 px-3.5 py-2 rounded-full shadow-2xl border transition transform hover:scale-105 ${
            isReady
              ? "bg-emerald-500 text-[#17221D] border-emerald-300 font-black animate-bounce"
              : "bg-[#24332D] text-[#F5E086] border-[#F5E086]/50 font-bold"
          }`}
          title="Click to expand active token widget"
        >
          <Ticket className="w-4 h-4" />
          <span className="font-niea font-black text-sm tracking-wider">
            {activeOrder.tokenNumber || activeOrder.orderNumber}
          </span>
          <span className="text-[11px] opacity-90">
            {isReady ? "Ready!" : `${queueOrdersAhead} ahead`}
          </span>
          <ChevronUp className="w-3.5 h-3.5 ml-0.5 opacity-70" />
        </button>
      </aside>
    );
  }

  return (
    <aside
      aria-label="Active order token status banner"
      className="fixed bottom-20 sm:bottom-6 right-3 sm:right-6 z-40 max-w-sm w-[calc(100vw-1.5rem)] sm:w-auto animate-in fade-in slide-in-from-bottom-4 duration-300"
    >
      <div
        className={`rounded-2xl p-3.5 sm:p-4 shadow-2xl border backdrop-blur-md transition-all ${
          isReady
            ? "bg-[#1E2E26]/95 border-emerald-400 text-white shadow-emerald-950/60 ring-2 ring-emerald-400/40"
            : "bg-[#1E2B25]/95 border-[#F5E086]/40 text-[#FBF9F2] shadow-black/60"
        }`}
      >
        {/* Top Header Row with Token & Minimize */}
        <div className="flex items-center justify-between gap-3 pb-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <span
              className={`p-1.5 rounded-xl flex items-center justify-center ${
                isReady
                  ? "bg-emerald-500 text-[#17221D]"
                  : isToasting
                  ? "bg-amber-400 text-[#24332D]"
                  : "bg-[#F5E086] text-[#24332D]"
              }`}
            >
              <Ticket className="w-4 h-4" />
            </span>
            <div>
              <span className="text-[10px] uppercase font-bold tracking-widest text-white/60 block leading-tight">
                Your Order Token
              </span>
              <div className="flex items-baseline gap-1.5">
                <span className="font-niea font-black text-xl text-[#F5E086] tracking-wider">
                  {formatTokenNumber(activeOrder.tokenNumber)}
                </span>
                <span className="text-[10px] text-white/50 font-mono">
                  #{activeOrder.orderNumber}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <span
              className={`px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1 border ${
                isReady
                  ? "bg-emerald-500/20 text-emerald-300 border-emerald-400/40 animate-pulse"
                  : isToasting
                  ? "bg-amber-500/20 text-amber-300 border-amber-400/40"
                  : "bg-sky-500/20 text-sky-300 border-sky-400/40"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  isReady ? "bg-emerald-400" : isToasting ? "bg-amber-400" : "bg-sky-400"
                } animate-ping`}
              />
              <span>
                {isReady ? "READY FOR PICKUP" : isToasting ? "TOASTING" : "IN QUEUE"}
              </span>
            </span>

            <button
              onClick={() => setIsMinimized(true)}
              className="p-1 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition"
              title="Minimize widget"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Middle Status Detail */}
        <div className="py-2 flex items-center justify-between text-xs gap-2">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            {isReady ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            ) : isToasting ? (
              <Flame className="w-4 h-4 text-amber-400 shrink-0" />
            ) : (
              <Clock className="w-4 h-4 text-[#F5E086] shrink-0" />
            )}
            <span className="text-[11px] text-white/90 truncate">
              {isReady ? (
                <strong className="text-emerald-300">
                  Hot & ready at counter! Please collect.
                </strong>
              ) : queueOrdersAhead === 0 ? (
                <strong className="text-[#F5E086]">
                  ⚡ Next up! Toasting your sandwich now.
                </strong>
              ) : (
                <span>
                  Queue:{" "}
                  <strong className="text-[#F5E086]">
                    {queueOrdersAhead} ahead
                  </strong>
                </span>
              )}
            </span>
          </div>

          {!isReady && (
            <span className="px-2 py-0.5 rounded-lg bg-emerald-500/15 border border-emerald-400/30 text-emerald-300 font-mono font-bold text-[10px] sm:text-[11px] shrink-0 whitespace-nowrap shadow-xs">
              ~{typeof activeOrder.estimatedMinutesLeft === "number"
                ? activeOrder.estimatedMinutesLeft
                : (activeOrder.estimatedWaitingMinutes || 15)}m left
            </span>
          )}
        </div>

        {/* Step milestone line */}
        {!isReady && (
          <div className="py-1 px-2 mb-1.5 rounded-lg bg-black/20 border border-white/5 flex items-center justify-between text-[10px]">
            <span className="flex items-center gap-1 font-semibold text-[#F5E086]">
              <ChefHat className="w-3 h-3 text-[#F5E086]" />
              <span>Step: {stepProgress.currentStep.shortLabel}</span>
            </span>
            <span className="font-mono text-emerald-300 font-bold">
              {stepProgress.percent}% • {stepProgress.isManual ? "Staff Verified" : "Auto"}
            </span>
          </div>
        )}

        {/* Bottom Actions */}
        <div className="grid grid-cols-2 gap-2 pt-2 border-t border-white/10 text-xs">
          <button
            type="button"
            onClick={() => onOpenTrack(activeOrder.orderNumber)}
            className="py-1.5 px-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-bold text-[11px] transition flex items-center justify-center gap-1.5"
          >
            <Clock className="w-3.5 h-3.5 text-[#F5E086]" />
            <span>Track Timeline</span>
          </button>

          <button
            type="button"
            onClick={() => onOpenLiveCallingBoard(activeOrder.tokenNumber)}
            className="py-1.5 px-2.5 rounded-xl bg-[#F5E086] hover:bg-[#F8E79B] text-[#24332D] font-black text-[11px] transition flex items-center justify-center gap-1.5 shadow-sm"
          >
            <Tv className="w-3.5 h-3.5" />
            <span>Live TV Board</span>
          </button>
        </div>
      </div>
    </aside>
  );
};
