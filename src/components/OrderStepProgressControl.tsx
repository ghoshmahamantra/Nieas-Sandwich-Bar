import React, { useState } from "react";
import {
  ChefHat,
  Flame,
  Package,
  Bell,
  CheckCircle2,
  FileText,
  Volume2,
  RotateCcw,
  Sparkles,
  Clock,
  Radio,
} from "lucide-react";
import { OrderRecord, OrderStepId } from "../types/niea";
import {
  ORDER_STEPS,
  getOrderStepProgress,
} from "../utils/orderStepProgress";

interface OrderStepProgressControlProps {
  order: OrderRecord;
  onUpdateStep: (
    orderId: string,
    stepId: OrderStepId | null,
    note?: string,
    announce?: boolean
  ) => void;
  compact?: boolean;
}

export const OrderStepProgressControl: React.FC<OrderStepProgressControlProps> = ({
  order,
  onUpdateStep,
  compact = false,
}) => {
  const [customNote, setCustomNote] = useState("");
  const [isAnnouncing, setIsAnnouncing] = useState(false);
  const [successFeedback, setSuccessFeedback] = useState<string | null>(null);

  // Compute live step progress (either manual or auto-time-divided)
  const progressInfo = getOrderStepProgress(order);
  const { currentStep, currentStepIndex, percent, isManual, sourceText } = progressInfo;

  const handleStepClick = (stepId: OrderStepId, announceImmediate = false) => {
    onUpdateStep(order.id, stepId, customNote.trim() || undefined, announceImmediate);
    const selectedStep = ORDER_STEPS.find((s) => s.id === stepId);

    // Step update executed silently without automatic audio feedback
    setSuccessFeedback(
      announceImmediate
        ? `Set to: ${selectedStep?.shortLabel}`
        : `Step updated to: ${selectedStep?.shortLabel}`
    );
    setTimeout(() => setSuccessFeedback(null), 3000);
  };

  const handleResetToAuto = () => {
    onUpdateStep(order.id, null);
    setSuccessFeedback("Reverted to automatic time-divided progression");
    setTimeout(() => setSuccessFeedback(null), 3000);
  };

  const handleVoiceBroadcast = () => {
    setIsAnnouncing(true);
    onUpdateStep(order.id, currentStep.id, customNote.trim() || undefined, true);
    setSuccessFeedback(`Token ${order.tokenNumber} - ${currentStep.shortLabel}`);
    setTimeout(() => {
      setIsAnnouncing(false);
      setTimeout(() => setSuccessFeedback(null), 2500);
    }, 800);
  };

  const getStepIcon = (id: OrderStepId, isCurrent: boolean) => {
    const iconClass = `w-3.5 h-3.5 ${isCurrent ? "text-[#1E2B25]" : "text-[#F5E086]"}`;
    switch (id) {
      case "order_taken":
        return <FileText className={iconClass} />;
      case "prep_assembly":
        return <ChefHat className={iconClass} />;
      case "cooking_toasting":
        return <Flame className={iconClass} />;
      case "garnish_packing":
        return <Package className={iconClass} />;
      case "ready_calling":
        return <Bell className={iconClass} />;
      case "served":
        return <CheckCircle2 className={iconClass} />;
      default:
        return <ChefHat className={iconClass} />;
    }
  };

  return (
    <div className="p-3.5 rounded-2xl bg-[#23352E] border border-[#F5E086]/30 shadow-md space-y-3">
      {/* Header with Title and Mode Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-white/10 pb-2.5">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-[#F5E086]/20 border border-[#F5E086]/40 flex items-center justify-center text-[#F5E086]">
            <Radio className="w-4 h-4 animate-pulse" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-[#F5E086] tracking-wide">
                Queue Order Steps & Milestones
              </span>
              <span className="text-[10px] text-white/50 font-mono">
                (Staff Optional Override)
              </span>
            </div>
            <p className="text-[11px] text-white/70">
              Staff can announce milestones or let the system automatically divide prep time.
            </p>
          </div>
        </div>

        {/* Current Mode Badge */}
        <div className="flex items-center gap-2">
          <span
            className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1.5 border ${
              isManual
                ? "bg-amber-400/20 text-amber-300 border-amber-400/40"
                : "bg-emerald-500/20 text-emerald-300 border-emerald-400/30"
            }`}
          >
            {isManual ? (
              <>
                <ChefHat className="w-3 h-3 text-amber-300" />
                <span>{sourceText}</span>
              </>
            ) : (
              <>
                <Clock className="w-3 h-3 text-emerald-400" />
                <span>{sourceText}</span>
              </>
            )}
          </span>

          {isManual && (
            <button
              type="button"
              onClick={handleResetToAuto}
              className="text-[10px] text-white/60 hover:text-[#F5E086] underline flex items-center gap-1 transition"
              title="Return to auto time division"
            >
              <RotateCcw className="w-2.5 h-2.5" />
              <span>Reset to Auto</span>
            </button>
          )}
        </div>
      </div>

      {/* Live Active Step Summary Banner */}
      <div className="bg-[#1C2923] p-2.5 rounded-xl border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-0.5">
          <div className="flex items-center gap-2">
            <span className="text-[10px] uppercase font-bold text-white/50 tracking-wider">
              Current Stage:
            </span>
            <span className="text-xs font-black text-[#F5E086] flex items-center gap-1.5">
              <span>{currentStep.label}</span>
              <span className="font-mono text-white/80">({percent}%)</span>
            </span>
          </div>
          <p className="text-[11px] text-white/70">{currentStep.description}</p>
        </div>

        {/* Progress percent meter */}
        <div className="sm:text-right shrink-0 w-full sm:w-44 space-y-1">
          <div className="flex justify-between text-[10px] font-mono text-white/60">
            <span>Progress</span>
            <strong className="text-emerald-300 font-bold">{percent}%</strong>
          </div>
          <div className="w-full h-2 rounded-full bg-white/10 overflow-hidden p-0.5 border border-white/10">
            <div
              className="h-full rounded-full bg-gradient-to-r from-amber-400 via-[#F5E086] to-emerald-400 transition-all duration-500 ease-out"
              style={{ width: `${percent}%` }}
            />
          </div>
        </div>
      </div>

      {/* 6 Interactive Milestone Chips */}
      <div>
        <div className="flex items-center justify-between text-[10px] font-bold text-white/50 uppercase tracking-wider mb-1.5">
          <span>Tap any step to set/announce:</span>
          <span>1 → 6 Flow</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-1.5">
          {ORDER_STEPS.map((s, idx) => {
            const isCurrent = currentStep.id === s.id;
            const isPassed = currentStepIndex > idx;

            return (
              <button
                key={s.id}
                type="button"
                onClick={() => handleStepClick(s.id, false)}
                className={`p-2 rounded-xl text-left border transition flex flex-col justify-between gap-1 group relative ${
                  isCurrent
                    ? "bg-[#F5E086] text-[#24332D] border-[#F5E086] shadow-md ring-2 ring-[#F5E086]/30 font-black"
                    : isPassed
                    ? "bg-white/10 text-white/90 border-emerald-400/30 hover:bg-white/15"
                    : "bg-white/5 text-white/60 border-white/10 hover:bg-white/10 hover:text-white"
                }`}
                title={`Click to set step: ${s.label}`}
              >
                <div className="flex items-center justify-between w-full">
                  <span
                    className={`w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold ${
                      isCurrent
                        ? "bg-[#24332D] text-[#F5E086]"
                        : isPassed
                        ? "bg-emerald-500/20 text-emerald-300"
                        : "bg-white/10 text-white/50"
                    }`}
                  >
                    {isPassed ? "✓" : idx + 1}
                  </span>
                  <div className="shrink-0">{getStepIcon(s.id, isCurrent)}</div>
                </div>

                <div>
                  <span className="text-[11px] font-bold block leading-tight truncate">
                    {s.shortLabel}
                  </span>
                  <span
                    className={`text-[9px] block ${
                      isCurrent ? "text-[#24332D]/80 font-mono" : "text-white/40"
                    }`}
                  >
                    {s.percent}%
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Staff Announcement Controls & Broadcast Action */}
      {!compact && (
        <div className="pt-1 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
            <input
              type="text"
              placeholder="Optional staff note/shoutout (e.g. Fresh batch slicing, double cheese)..."
              value={customNote}
              onChange={(e) => setCustomNote(e.target.value)}
              className="w-full sm:max-w-md px-3 py-1.5 rounded-xl bg-[#1C2923] border border-white/15 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#F5E086]"
            />
          </div>

          <div className="flex items-center gap-2 shrink-0 w-full sm:w-auto justify-end">
            <button
              type="button"
              onClick={handleVoiceBroadcast}
              disabled={isAnnouncing}
              className="px-3 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-[#17221D] font-bold text-xs transition shadow-sm flex items-center gap-1.5 disabled:opacity-50"
              title="Voice chime & announce token status over audio + notify user"
            >
              <Volume2 className="w-3.5 h-3.5" />
              <span>{isAnnouncing ? "Announcing..." : "📢 Announce Voice & Broadcast"}</span>
            </button>
          </div>
        </div>
      )}

      {/* Success Notification feedback banner */}
      {successFeedback && (
        <div className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[11px] font-bold flex items-center gap-1.5 animate-in fade-in">
          <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
          <span>{successFeedback}</span>
        </div>
      )}
    </div>
  );
};
