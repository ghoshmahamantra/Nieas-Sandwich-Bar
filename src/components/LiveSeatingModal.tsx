import React from "react";
import { X, Users, MapPin, Clock, CheckCircle2, Sparkles, Coffee, Utensils } from "lucide-react";
import { SeatingStatus } from "../types/niea";

interface LiveSeatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  seating: SeatingStatus;
  selectedTable?: string;
  onSelectTable: (tableName: string) => void;
}

const TABLES = [
  { id: "T1", name: "Table 1 (Cozy Sourdough Table)", seats: 4, type: "Indoor", isOccupied: false },
  { id: "T2", name: "Table 2 (Cozy Window Table)", seats: 4, type: "Indoor", isOccupied: false },
];

export const LiveSeatingModal: React.FC<LiveSeatingModalProps> = ({
  isOpen,
  onClose,
  seating,
  selectedTable,
  onSelectTable,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in">
      <div className="w-full max-w-2xl bg-[#374C44] rounded-3xl border border-[#F5E086]/30 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#F5E086]/15 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F5E086] text-[#24332D] flex items-center justify-center font-black">
              <Utensils className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-niea font-bold text-xl text-[#F5E086]">
                Daily Sandwiches & Cafe Floor
              </h3>
              <p className="text-xs text-[#FBF9F2]/70">
                Fresh daily batch of 50 handcrafted sourdough melts • Cozy 2-Table Cafe in New Town Kolkata
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

        {/* Daily Sandwiches Hero Gauge */}
        <div className="p-4 bg-[#24332D] border-b border-[#F5E086]/15">
          <div className="flex items-center justify-between text-xs mb-2">
            <span className="text-white/80 font-bold flex items-center gap-1.5">
              <Utensils className="w-3.5 h-3.5 text-[#F5E086]" />
              <span>Daily Sandwich Batch Remaining:</span>
            </span>
            <span className="font-niea text-[#F5E086] font-bold text-sm">
              {seating.availableSandwiches ?? 38} of 50 available
            </span>
          </div>
          <div className="w-full bg-[#1D2B25] h-2.5 rounded-full overflow-hidden border border-white/10">
            <div
              className="bg-[#F5E086] h-full rounded-full transition-all duration-500"
              style={{
                width: `${Math.min(100, Math.max(0, ((seating.availableSandwiches ?? 38) / 50) * 100))}%`,
              }}
            />
          </div>
          <div className="flex items-center justify-between text-[11px] text-white/60 mt-1.5">
            <span>Daily batch limit: 50 sandwiches</span>
            <span className="text-emerald-400 font-medium">Baking fresh daily</span>
          </div>
        </div>

        {/* Status Highlights */}
        <div className="p-4 grid grid-cols-3 gap-2.5 border-b border-[#F5E086]/15 bg-[#2B3D36]/60 text-center">
          <div className="p-2.5 rounded-2xl bg-[#374C44]/80 border border-[#F5E086]/15">
            <span className="text-[10px] uppercase font-bold text-[#FBF9F2]/60">
              Sandwiches Left
            </span>
            <p className="font-niea text-xl font-black text-[#F5E086] mt-0.5">
              {seating.availableSandwiches ?? 38} / 50
            </p>
          </div>
          <div className="p-2.5 rounded-2xl bg-[#374C44]/80 border border-[#F5E086]/15">
            <span className="text-[10px] uppercase font-bold text-[#FBF9F2]/60">
              Cafe Tables
            </span>
            <p className="font-niea text-xl font-black text-emerald-400 mt-0.5">
              2 Tables Total
            </p>
          </div>
          <div className="p-2.5 rounded-2xl bg-[#374C44]/80 border border-[#F5E086]/15">
            <span className="text-[10px] uppercase font-bold text-[#FBF9F2]/60">
              Dine-in Seats
            </span>
            <p className="font-niea text-xl font-black text-amber-300 mt-0.5">
              {seating.availableSeats} / {seating.totalSeats}
            </p>
          </div>
        </div>

        {/* Interactive Floor Plan Selection */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          <div className="flex items-center justify-between text-xs text-[#FBF9F2]/80">
            <span className="font-bold flex items-center gap-1.5">
              <Coffee className="w-4 h-4 text-[#F5E086]" />
              Select your preferred table for your Dine-in order:
            </span>
            <div className="flex items-center gap-3 text-[11px]">
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400" /> Open
              </span>
              <span className="flex items-center gap-1">
                <span className="w-2.5 h-2.5 rounded-full bg-rose-400" /> Occupied
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {TABLES.map((t) => {
              const isSelected = selectedTable === t.name;
              return (
                <div
                  key={t.id}
                  onClick={() => {
                    if (!t.isOccupied) {
                      onSelectTable(t.name);
                    }
                  }}
                  className={`p-3.5 rounded-2xl border transition text-left relative ${
                    t.isOccupied
                      ? "bg-black/20 border-white/5 opacity-50 cursor-not-allowed"
                      : isSelected
                      ? "bg-[#F5E086] text-[#24332D] border-[#F5E086] shadow-lg cursor-pointer scale-[1.02]"
                      : "bg-[#2B3D36]/80 text-[#FBF9F2] border-[#F5E086]/15 hover:border-[#F5E086]/50 cursor-pointer"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span
                        className={`text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-full ${
                          isSelected
                            ? "bg-[#24332D] text-[#F5E086]"
                            : "bg-white/10 text-[#FBF9F2]/80"
                        }`}
                      >
                        {t.type} • {t.seats} Seats
                      </span>
                      <h4
                        className={`font-bold text-sm mt-1.5 ${
                          isSelected ? "text-[#24332D]" : "text-[#FBF9F2]"
                        }`}
                      >
                        {t.name}
                      </h4>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {t.isOccupied ? (
                        <span className="text-[10px] text-rose-300 font-bold">
                          Occupied
                        </span>
                      ) : isSelected ? (
                        <span className="text-[11px] font-black text-[#24332D] flex items-center gap-1">
                          <CheckCircle2 className="w-4 h-4" /> Selected
                        </span>
                      ) : (
                        <span className="text-[10px] text-emerald-400 font-bold">
                          Available
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[#F5E086]/15 bg-[#2B3D36]/80 flex items-center justify-between">
          <p className="text-xs text-[#FBF9F2]/70">
            {selectedTable ? (
              <span>
                Selected: <strong className="text-[#F5E086]">{selectedTable}</strong>
              </span>
            ) : (
              <span>Walk-ins welcome • Table assigned upon arrival if unselected</span>
            )}
          </p>

          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-full bg-[#F5E086] text-[#24332D] font-bold text-xs hover:bg-[#F8E79B] transition shadow-md"
          >
            Confirm & Continue Order
          </button>
        </div>
      </div>
    </div>
  );
};
