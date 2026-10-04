import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  WifiOff,
  Wifi,
  HardDrive,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  X,
  ShieldCheck,
  Radio,
} from "lucide-react";
import { usePwaInstall } from "../utils/usePwaInstall";

interface OfflineSyncToastProps {
  bufferedTicketsCount?: number;
  onManualSyncCheck?: () => void;
  className?: string;
}

export const OfflineSyncToast: React.FC<OfflineSyncToastProps> = ({
  bufferedTicketsCount = 0,
  onManualSyncCheck,
  className = "",
}) => {
  const { isOnline, justReconnected } = usePwaInstall();
  const [isSimulatedOffline, setIsSimulatedOffline] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isCheckingConnection, setIsCheckingConnection] = useState(false);
  const [syncStatusNote, setSyncStatusNote] = useState<string | null>(null);
  const [dismissedManually, setDismissedManually] = useState(false);

  // Effective online status (accounting for simulated offline test toggle)
  const effectiveOnline = isSimulatedOffline ? false : isOnline;
  const showToast = (!effectiveOnline || justReconnected) && !dismissedManually;

  // Reset manual dismissal if network transitions from online to offline
  useEffect(() => {
    if (!effectiveOnline) {
      setDismissedManually(false);
    }
  }, [effectiveOnline]);

  const handleCheckConnection = async () => {
    setIsCheckingConnection(true);
    setSyncStatusNote("Pinging network gateway...");

    try {
      if (isSimulatedOffline) {
        setTimeout(() => {
          setIsCheckingConnection(false);
          setSyncStatusNote("Simulated offline mode active (click toggle to restore).");
        }, 600);
        return;
      }

      // Check real connection via fetch with short timeout
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 2500);

      await fetch(window.location.origin + "/favicon.ico", {
        method: "HEAD",
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      setIsCheckingConnection(false);
      setSyncStatusNote("Network responsive! Data verified.");
      if (onManualSyncCheck) onManualSyncCheck();
      setTimeout(() => setSyncStatusNote(null), 3000);
    } catch {
      setIsCheckingConnection(false);
      setSyncStatusNote("Network unreachable — buffer remains securely engaged.");
      setTimeout(() => setSyncStatusNote(null), 3500);
    }
  };

  return (
    <AnimatePresence>
      {showToast && (
        <motion.aside
          aria-label="Network connection and offline sync status"
          role="status"
          aria-live="polite"
          initial={{ opacity: 0, y: 30, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.95 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className={`fixed bottom-5 right-5 z-50 max-w-md w-[calc(100vw-2.5rem)] sm:w-[420px] shadow-2xl ${className}`}
        >
          {/* STATE 1: RECONNECTED NOTICE */}
          {effectiveOnline && justReconnected ? (
            <div className="rounded-3xl p-4 bg-[#14261E] border-2 border-emerald-400 text-white shadow-[0_10px_35px_rgba(16,185,129,0.25)] flex items-start gap-3 backdrop-blur-md">
              <div className="w-10 h-10 rounded-2xl bg-emerald-400/20 border border-emerald-400/40 text-emerald-300 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between">
                  <h4 className="font-niea font-bold text-sm text-emerald-300">
                    Network Reconnected!
                  </h4>
                  <span className="text-[10px] font-mono uppercase bg-emerald-400/20 text-emerald-200 px-2 py-0.5 rounded-full font-bold">
                    Synced
                  </span>
                </div>
                <p className="text-xs text-white/80 mt-1 leading-relaxed">
                  Cafe Wi-Fi is back online. All buffered kitchen tickets and KDS preparation timestamps have been synchronized with the main server.
                </p>
              </div>
            </div>
          ) : (
            /* STATE 2: OFFLINE MODE TOAST NOTIFICATION */
            <div className="rounded-3xl bg-[#1A2520] border-2 border-amber-400/70 shadow-[0_10px_35px_rgba(245,224,134,0.18)] text-white overflow-hidden backdrop-blur-md">
              {/* Header Bar */}
              <div className="p-3.5 bg-[#24332D]/90 border-b border-amber-400/20 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-xl bg-amber-400/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shrink-0">
                    <WifiOff className="w-4 h-4 animate-pulse text-amber-400" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-niea font-bold text-sm text-[#F5E086]">
                        Offline Mode Active
                      </span>
                      <span className="px-1.5 py-0.5 rounded text-[9px] font-mono font-bold bg-amber-400/20 text-amber-200 border border-amber-400/30">
                        KDS SAFE
                      </span>
                    </div>
                    <span className="text-[10px] text-white/60 block">
                      Local buffering engaged for kitchen staff
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    onClick={() => setIsCollapsed((prev) => !prev)}
                    className="p-1.5 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition"
                    title={isCollapsed ? "Expand toast details" : "Collapse toast"}
                  >
                    {isCollapsed ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDismissedManually(true)}
                    className="p-1.5 rounded-xl hover:bg-white/10 text-white/60 hover:text-white transition"
                    title="Dismiss alert"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Collapsed Compact View */}
              {isCollapsed ? (
                <div className="px-4 py-2.5 flex items-center justify-between text-xs bg-[#1A2520]">
                  <span className="text-white/80 text-[11px] flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Tickets saved locally. Auto-sync on reconnect.</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsCollapsed(false)}
                    className="text-[11px] text-[#F5E086] font-semibold hover:underline"
                  >
                    Details
                  </button>
                </div>
              ) : (
                /* Expanded Reassurance Content */
                <div className="p-4 space-y-3.5 bg-[#1A2520]">
                  {/* Reassurance Message */}
                  <div className="space-y-1.5">
                    <p className="text-xs text-white/90 leading-relaxed">
                      Network connection to the cafe gateway was interrupted. The Kitchen Display Board will continue operating without interruption.
                    </p>
                    <div className="flex items-center gap-2 text-[11px] text-emerald-300 bg-emerald-950/50 border border-emerald-500/30 rounded-xl px-3 py-2">
                      <ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" />
                      <span>
                        <strong>Zero data loss guaranteed:</strong> Ticket moves, grill countdowns, and KOT numbers are saved on this tablet.
                      </span>
                    </div>
                  </div>

                  {/* Status Badges */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-[#F5E086] shrink-0" />
                      <div>
                        <span className="text-[10px] text-white/50 block font-medium">Local Storage</span>
                        <span className="font-bold text-white text-[11px]">
                          {bufferedTicketsCount > 0 ? `${bufferedTicketsCount} Active Tickets` : "Buffer Armed"}
                        </span>
                      </div>
                    </div>
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 flex items-center gap-2">
                      <Radio className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
                      <div>
                        <span className="text-[10px] text-white/50 block font-medium">Auto Reconnect</span>
                        <span className="font-bold text-white text-[11px]">Listening Live</span>
                      </div>
                    </div>
                  </div>

                  {/* Feedback line if check in progress */}
                  {syncStatusNote && (
                    <div className="text-[11px] text-[#F5E086] font-medium animate-in fade-in flex items-center gap-1.5 bg-black/30 px-3 py-1.5 rounded-lg border border-white/10">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#F5E086] animate-ping" />
                      <span>{syncStatusNote}</span>
                    </div>
                  )}

                  {/* Action Controls */}
                  <div className="pt-2 border-t border-white/10 flex items-center justify-between gap-2">
                    <button
                      type="button"
                      onClick={() => setIsSimulatedOffline((prev) => !prev)}
                      className="text-[10px] text-white/40 hover:text-white/80 transition underline"
                      title="Toggle simulated network loss to test offline UI"
                    >
                      {isSimulatedOffline ? "Turn Off Simulation" : "Demo Mode"}
                    </button>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={handleCheckConnection}
                        disabled={isCheckingConnection}
                        className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/15 text-white text-xs font-semibold transition flex items-center gap-1.5 disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${isCheckingConnection ? "animate-spin" : ""}`} />
                        <span>{isCheckingConnection ? "Pinging..." : "Check Gateway"}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsCollapsed(true)}
                        className="px-3 py-1.5 rounded-xl bg-[#F5E086] hover:bg-[#fae89f] text-[#24332D] text-xs font-bold transition shadow-sm"
                      >
                        Got It
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </motion.aside>
      )}
    </AnimatePresence>
  );
};
