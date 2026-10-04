import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  X,
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Clock,
  Sparkles,
  Flame,
  CheckCircle2,
  Bell,
  Search,
  RefreshCw,
  Ticket,
} from "lucide-react";
import { OrderRecord } from "../types/niea";
import { getOrderStepProgress } from "../utils/orderStepProgress";

interface LiveTokenCallingModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: OrderRecord[];
  myTokenNumber?: string | null;
  highlightedToken?: string | null;
  isOwner?: boolean;
}

export const LiveTokenCallingModal: React.FC<LiveTokenCallingModalProps> = ({
  isOpen,
  onClose,
  orders: propOrders = [],
  myTokenNumber,
  highlightedToken,
  isOwner = false,
}) => {
  const currentOrders = propOrders;
  const [audioEnabled, setAudioEnabled] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [lastAnnouncedToken, setLastAnnouncedToken] = useState<string | null>(null);
  const [searchToken, setSearchToken] = useState("");
  const [, setTimerTick] = useState(0);
  const readyContainerRef = useRef<HTMLDivElement>(null);

  // Auto-detect target token from props or localStorage
  const activeTokenTarget = useMemo(() => {
    if (highlightedToken) return highlightedToken;
    if (myTokenNumber) return myTokenNumber;
    try {
      const myIds: string[] = JSON.parse(localStorage.getItem("niea_my_order_ids") || "[]");
      if (myIds.length > 0) {
        const found = currentOrders.find((o) => {
          if (o.status === "served") return false;
          return (
            myIds.includes(o.id) ||
            myIds.includes(o.orderNumber) ||
            (o.tokenNumber && myIds.includes(o.tokenNumber))
          );
        });
        if (found?.tokenNumber) return found.tokenNumber;
      }
    } catch {}
    return null;
  }, [highlightedToken, myTokenNumber, currentOrders]);

  // Live countdown ticker to ensure remaining time updates smoothly
  useEffect(() => {
    if (!isOpen) return;
    const interval = setInterval(() => {
      setTimerTick((t) => (t + 1) % 100000);
    }, 5000);

    return () => clearInterval(interval);
  }, [isOpen]);

  // Web Audio chime generator
  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;

      // Note 1 (880Hz - A5)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(880, now);
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc1.connect(gain1);
      gain1.connect(ctx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);

      // Note 2 (1320Hz - E6)
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(1320, now + 0.12);
      gain2.gain.setValueAtTime(0.3, now + 0.12);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.7);
      osc2.connect(gain2);
      gain2.connect(ctx.destination);
      osc2.start(now + 0.12);
      osc2.stop(now + 0.7);
    } catch {
      // AudioContext blocked
    }
  };

  // Filter active orders
  const preparingOrders = useMemo(() => {
    return currentOrders
      .filter((o) => o.status === "received" || o.status === "toasting")
      .filter((o) => {
        if (!searchToken.trim()) return true;
        const q = searchToken.toLowerCase();
        return (
          (o.tokenNumber && o.tokenNumber.toLowerCase().includes(q)) ||
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q)
        );
      });
  }, [currentOrders, searchToken]);

  const readyOrders = useMemo(() => {
    return currentOrders
      .filter((o) => o.status === "ready")
      .filter((o) => {
        if (!searchToken.trim()) return true;
        const q = searchToken.toLowerCase();
        return (
          (o.tokenNumber && o.tokenNumber.toLowerCase().includes(q)) ||
          o.orderNumber.toLowerCase().includes(q) ||
          o.customerName.toLowerCase().includes(q)
        );
      });
  }, [currentOrders, searchToken]);

  // Find user's order and queue position
  const userOrder = useMemo(() => {
    if (!activeTokenTarget) return null;
    return (
      currentOrders.find(
        (o) =>
          o.tokenNumber?.toLowerCase() === activeTokenTarget.toLowerCase() ||
          o.orderNumber.toLowerCase() === activeTokenTarget.toLowerCase()
      ) || null
    );
  }, [currentOrders, activeTokenTarget]);

  const userQueueAheadCount = useMemo(() => {
    if (!userOrder || userOrder.status === "ready" || userOrder.status === "served") return 0;
    const idx = preparingOrders.findIndex(
      (o) => o.id === userOrder.id || o.orderNumber === userOrder.orderNumber
    );
    return idx >= 0 ? idx : 0;
  }, [preparingOrders, userOrder]);

  // Audio announcement and chime for newly ready orders
  useEffect(() => {
    if (!audioEnabled) return;

    const latestReady = readyOrders[0];
    if (latestReady && latestReady.tokenNumber && latestReady.tokenNumber !== lastAnnouncedToken) {
      setLastAnnouncedToken(latestReady.tokenNumber);
      playChime();

      if (typeof window !== "undefined" && "speechSynthesis" in window) {
        try {
          const text = `Token ${latestReady.tokenNumber}, please collect your order.`;
          const utterance = new SpeechSynthesisUtterance(text);
          utterance.rate = 0.95;
          utterance.pitch = 1.05;
          // slight delay after chime
          setTimeout(() => {
            window.speechSynthesis.speak(utterance);
          }, 350);
        } catch {
          // Speech synthesis blocked
        }
      }
    }
  }, [readyOrders, audioEnabled, lastAnnouncedToken]);

  if (!isOpen) return null;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      document.exitFullscreen().catch(() => {});
      setIsFullscreen(false);
    }
  };

  const getElapsedMinutes = (order: OrderRecord): number => {
    const start = order.waitingStartedAt
      ? new Date(order.waitingStartedAt).getTime()
      : new Date(order.createdAt).getTime();
    if (!start || isNaN(start)) return 0;
    return Math.max(0, Math.floor((Date.now() - start) / (1000 * 60)));
  };

  const getRemainingMinutes = (order: OrderRecord): number => {
    if (order.status === "ready" || order.status === "served") return 0;
    const elapsed = getElapsedMinutes(order);

    if (typeof order.estimatedMinutesLeft === "number") {
      if (order.lastTimeLeftUpdated) {
        const updateTime = new Date(order.lastTimeLeftUpdated).getTime();
        if (!isNaN(updateTime) && updateTime > 0) {
          const minsSince = Math.floor((Date.now() - updateTime) / (1000 * 60));
          return Math.max(0, order.estimatedMinutesLeft - minsSince);
        }
      }
      return Math.max(0, order.estimatedMinutesLeft);
    }

    const totalEst = order.estimatedWaitingMinutes || 25;
    return Math.max(0, totalEst - elapsed);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-black/90 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-5xl bg-[#1E2B25] text-[#FBF9F2] rounded-3xl border border-[#F5E086]/30 shadow-2xl overflow-hidden flex flex-col h-[94vh]">
        {/* Header Bar */}
        <div className="p-4 sm:p-5 bg-[#17221D] border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F5E086] text-[#24332D] flex items-center justify-center font-black text-xl shadow-md">
              ⚡
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-niea font-bold text-xl sm:text-2xl text-[#F5E086]">
                  Live Token Display
                </h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 text-[10px] font-bold border border-emerald-400/30 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Calling Board
                </span>
              </div>
              <p className="text-xs text-[#FBF9F2]/70">
                Real-time queue & calling display for NiEA'S Sandwich Bar
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setAudioEnabled((prev) => !prev)}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition ${
                audioEnabled
                  ? "bg-[#F5E086]/10 border-[#F5E086]/40 text-[#F5E086]"
                  : "bg-white/5 border-white/10 text-white/50"
              }`}
              title={audioEnabled ? "Voice announcements active" : "Voice chime muted"}
            >
              {audioEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
              <span className="hidden sm:inline">{audioEnabled ? "Voice Chime On" : "Muted"}</span>
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 transition"
              title="Toggle Fullscreen Kiosk Mode"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white/80 border border-white/10 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter & Controls Bar */}
        <div className="bg-[#24332D] px-4 py-2 border-b border-white/10 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
            <input
              type="text"
              placeholder="Search token # or customer..."
              value={searchToken}
              onChange={(e) => setSearchToken(e.target.value)}
              className="w-full pl-8 pr-3 py-1 rounded-full bg-[#1A2520] border border-white/10 text-xs text-white placeholder-white/40 focus:outline-none focus:border-[#F5E086]"
            />
          </div>

          <div className="flex items-center gap-2 text-xs">
            {isOwner && (
              <button
                type="button"
                onClick={playChime}
                className="px-3 py-1 rounded-full bg-white/10 hover:bg-white/20 text-white/80 text-[11px] font-semibold transition flex items-center gap-1.5 cursor-pointer"
                title="Test audio chime"
              >
                <Bell className="w-3 h-3 text-[#F5E086]" />
                <span>Test Chime</span>
              </button>
            )}
            <span className="text-[10px] text-emerald-400/80 font-mono flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live auto-sync
            </span>
          </div>
        </div>

        {/* Customer Active Spotlight Banner if customer has an order */}
        {activeTokenTarget && (
          <div className="bg-gradient-to-r from-[#22332A] via-[#2B3E34] to-[#22332A] border-b border-[#F5E086]/30 px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-2 shadow-inner">
            <div className="flex items-center gap-2.5 text-xs">
              <span className="p-1.5 rounded-xl bg-[#F5E086] text-[#24332D] font-black">
                <Ticket className="w-4 h-4" />
              </span>
              <div>
                <span className="text-[10px] uppercase font-bold text-white/50 block">
                  Your Calling Token
                </span>
                <span className="text-[#F5E086] text-lg font-niea font-black tracking-wider">
                  #{activeTokenTarget}
                </span>
              </div>

              {userOrder && (
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className={`ml-2 px-3 py-1 rounded-full text-[11px] font-bold border flex items-center gap-1.5 ${
                      userOrder.status === "ready"
                        ? "bg-emerald-500 text-[#17221D] border-emerald-300 animate-bounce"
                        : "bg-amber-400/20 text-amber-300 border-amber-400/40"
                    }`}
                  >
                    <span
                      className={`w-2 h-2 rounded-full ${
                        userOrder.status === "ready" ? "bg-[#17221D]" : "bg-amber-400"
                      } animate-pulse`}
                    />
                    <span>
                      {userOrder.status === "ready"
                        ? "HOT & READY FOR PICKUP NOW!"
                        : userQueueAheadCount === 0
                        ? "⚡ NEXT UP IN KITCHEN!"
                        : `Waiting Queue: ${userQueueAheadCount} order${
                            userQueueAheadCount > 1 ? "s" : ""
                          } ahead`}
                    </span>
                  </span>

                  {userOrder.status !== "ready" && (
                    <span className="px-3 py-1 rounded-full bg-black/40 border border-amber-400/40 text-[#F5E086] text-xs font-bold font-mono flex items-center gap-1.5 shadow-sm flex-wrap max-w-full">
                      <Clock className="w-3.5 h-3.5 text-amber-300 animate-pulse shrink-0" />
                      <span>Remaining: ~{getRemainingMinutes(userOrder)}m</span>
                      {userOrder.lastTimeLeftUpdated && (
                        <span className="text-[10px] text-emerald-400 font-sans font-semibold">● Kitchen Updated</span>
                      )}
                    </span>
                  )}
                </div>
              )}
            </div>

            <div className="text-[11px] text-[#FBF9F2]/80 flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
              <span>
                {userOrder?.status === "ready"
                  ? "Please show your screen at the counter to collect!"
                  : "Audio chime will sound automatically when your number is called"}
              </span>
            </div>
          </div>
        )}

        {/* 2-Column McDonald's Style Token Board */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/10 overflow-hidden">
          {/* Column 1: NOW PREPARING */}
          <div className="flex flex-col h-full bg-[#1A2520]/60 p-4 sm:p-6 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-amber-400/20 mb-4">
              <div className="flex items-center gap-2">
                <Flame className="w-5 h-5 text-amber-400" />
                <h3 className="font-niea font-bold text-lg text-amber-300">Now Preparing</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-amber-400/20 text-amber-300 text-xs font-bold">
                {preparingOrders.length} in Kitchen
              </span>
            </div>

            {preparingOrders.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-white/40 space-y-2">
                <Clock className="w-10 h-10 opacity-40" />
                <p className="text-sm font-semibold">Kitchen queue is all caught up!</p>
                <p className="text-xs">New orders will appear here immediately.</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {preparingOrders.map((order) => {
                  const elapsed = getElapsedMinutes(order);
                  const remaining = getRemainingMinutes(order);
                  const est = order.estimatedWaitingMinutes || 25;
                  const isMine =
                    activeTokenTarget === order.tokenNumber ||
                    activeTokenTarget === order.orderNumber;

                  return (
                    <div
                      key={order.id}
                      className={`p-4 rounded-2xl border transition-all text-center space-y-2.5 relative overflow-hidden ${
                        isMine
                          ? "bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/50"
                          : "bg-[#24332D] border-white/10 hover:border-amber-400/40"
                      }`}
                    >
                      {isMine && (
                        <span className="absolute top-1 right-1 px-1.5 py-0.2 bg-[#F5E086] text-[#24332D] text-[9px] font-black rounded-full">
                          YOU
                        </span>
                      )}

                      <span className="text-[10px] uppercase font-bold text-white/50 block">
                        {order.orderType === "dine-in" ? "Dine-In" : "Takeaway"}
                      </span>

                      <div className="font-niea font-black text-3xl sm:text-4xl text-[#F5E086] tracking-tight">
                        {order.tokenNumber || order.orderNumber}
                      </div>

                      {/* Prominent Live Remaining Time Block on Queue TV */}
                      <div className="p-2 sm:p-2.5 rounded-xl bg-black/60 border border-amber-400/30 shadow-inner flex flex-col items-center justify-center gap-0.5 w-full">
                        <span className="text-[10px] sm:text-[11px] font-bold text-white/75 uppercase tracking-wider flex items-center justify-center gap-1">
                          <Clock className="w-3 h-3 text-amber-300 animate-pulse shrink-0" />
                          <span>Remaining Time</span>
                        </span>
                        <span className="font-niea font-black text-sm sm:text-base text-[#F5E086] tracking-wide text-center">
                          {remaining > 0 ? `~${remaining} mins` : "Finishing (< 1m)"}
                        </span>
                        {order.lastTimeLeftUpdated && (
                          <span className="inline-flex items-center gap-1 px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 text-[9px] font-bold mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            <span>Kitchen Updated</span>
                          </span>
                        )}
                      </div>

                      {/* Step Progress & Elapsed vs Estimated */}
                      {(() => {
                        const stepInfo = getOrderStepProgress(order);
                        return (
                          <div className="space-y-1">
                            <div className="flex justify-between text-[10px] text-white/70">
                              <span className="text-[#F5E086] font-semibold truncate max-w-[120px]">
                                {stepInfo.currentStep.shortLabel}
                              </span>
                              <span className="font-bold text-amber-300 font-mono">
                                {stepInfo.percent}%
                              </span>
                            </div>
                            <div className="w-full bg-black/40 h-1.5 rounded-full overflow-hidden">
                              <div
                                className="bg-gradient-to-r from-amber-400 to-emerald-400 h-full rounded-full transition-all duration-500"
                                style={{ width: `${stepInfo.percent}%` }}
                              />
                            </div>
                            <div className="flex justify-between items-center text-[9px] text-white/50 pt-0.5">
                              <span>{elapsed}m elapsed</span>
                              <span className="text-[8px] opacity-75">
                                {stepInfo.isManual ? "Announced" : "Auto"}
                              </span>
                            </div>
                          </div>
                        );
                      })()}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Column 2: READY FOR PICKUP / TABLE */}
          <div className="flex flex-col h-full bg-[#162720]/80 p-4 sm:p-6 overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-emerald-400/20 mb-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-400 animate-pulse" />
                <h3 className="font-niea font-bold text-lg text-emerald-300">Ready for Pickup / Table</h3>
              </div>
              <span className="px-2.5 py-0.5 rounded-full bg-emerald-400/20 text-emerald-300 text-xs font-bold animate-pulse">
                {readyOrders.length} Ready
              </span>
            </div>

            {readyOrders.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-white/40 space-y-2">
                <Bell className="w-10 h-10 opacity-40" />
                <p className="text-sm font-semibold">No orders currently waiting for pickup</p>
                <p className="text-xs">When chef marks an order ready, it will flash here!</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                {readyOrders.map((order) => {
                  const isMine =
                    activeTokenTarget === order.tokenNumber ||
                    activeTokenTarget === order.orderNumber;

                  return (
                    <div
                      key={order.id}
                      className={`p-5 rounded-2xl border-2 transition-all space-y-3 relative overflow-hidden shadow-lg ${
                        isMine
                          ? "bg-emerald-950/80 border-emerald-300 ring-4 ring-emerald-400/40"
                          : "bg-emerald-900/30 border-emerald-400/60 hover:border-emerald-300"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="px-2 py-0.5 bg-emerald-500 text-[#17221D] font-black text-[10px] rounded-full uppercase tracking-wider animate-pulse">
                          HOT & READY
                        </span>
                        <span className="text-xs text-emerald-200 font-semibold">
                          {order.tableNumber || "Takeaway Counter"}
                        </span>
                      </div>

                      <div className="text-center py-1">
                        <span className="text-[10px] uppercase font-bold text-emerald-300/70 block">
                          CALLING TOKEN
                        </span>
                        <div className="font-niea font-black text-4xl sm:text-5xl text-emerald-300 tracking-tight drop-shadow-sm">
                          {order.tokenNumber || order.orderNumber}
                        </div>
                      </div>

                      <div className="bg-[#17221D]/80 p-2.5 rounded-xl text-center space-y-0.5 border border-emerald-400/20">
                        <p className="text-xs font-bold text-white truncate">{order.customerName}</p>
                        <p className="text-[10px] text-emerald-300">
                          {order.orderType === "dine-in"
                            ? `Served to ${order.tableNumber || "Table"}`
                            : "Please collect at Pickup Counter"}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Bottom Ticker */}
        <div className="bg-[#17221D] p-3 px-5 border-t border-white/10 flex items-center justify-between text-xs text-white/70">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
            <span>Showing active orders. Orders update automatically when staff or chef advances status.</span>
          </div>
          <span className="font-niea font-bold text-[#F5E086] hidden sm:inline">
            NiEA'S SANDWICH BAR • New Town
          </span>
        </div>
      </div>
    </div>
  );
};
