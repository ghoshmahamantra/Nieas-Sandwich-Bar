import React from "react";
import { Utensils, ShoppingBag, Users, Clock, Sparkles } from "lucide-react";
import { OrderType, SeatingStatus } from "../types/niea";

interface OrderingTogglesProps {
  orderType: OrderType;
  onToggle: (type: OrderType) => void;
  seating: SeatingStatus;
  onOpenSeatingModal?: () => void;
}

export const OrderingToggles: React.FC<OrderingTogglesProps> = ({
  orderType,
  onToggle,
  seating,
  onOpenSeatingModal,
}) => {
  const isDineIn = orderType === "dine-in";
  const seatPercentage = Math.round((seating.availableSeats / seating.totalSeats) * 100);

  return (
    <div className="w-full max-w-xl mx-auto">
      {/* Sleek Pill Toggle Container */}
      <div className="p-1.5 rounded-full bg-[#374C44] border border-[#F5E086]/25 shadow-xl flex items-center relative">
        {/* Animated Active Pill Indicator */}
        <div
          className="absolute top-1.5 bottom-1.5 rounded-full bg-[#F5E086] shadow-md transition-all duration-300 ease-out"
          style={{
            left: isDineIn ? "6px" : "calc(50% + 3px)",
            width: "calc(50% - 9px)",
          }}
        />

        {/* Dine-In Button */}
        <button
          type="button"
          onClick={() => onToggle("dine-in")}
          className={`relative z-10 flex-1 py-3 px-4 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors duration-200 ${
            isDineIn ? "text-[#24332D] font-black" : "text-[#FBF9F2]/80 hover:text-[#FBF9F2]"
          }`}
        >
          <Utensils className="w-4 h-4" />
          <span>Dine-in</span>
          {isDineIn && (
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-[#24332D]/10 text-[10px] font-extrabold uppercase">
              Table Service
            </span>
          )}
        </button>

        {/* Takeaway Button */}
        <button
          type="button"
          onClick={() => onToggle("takeaway")}
          className={`relative z-10 flex-1 py-3 px-4 rounded-full font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-colors duration-200 ${
            !isDineIn ? "text-[#24332D] font-black" : "text-[#FBF9F2]/80 hover:text-[#FBF9F2]"
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Takeaway</span>
          {!isDineIn && (
            <span className="hidden sm:inline-block px-2 py-0.5 rounded-full bg-[#24332D]/10 text-[10px] font-extrabold uppercase">
              Fast Pickup
            </span>
          )}
        </button>
      </div>

      {/* Dynamic Contextual Status Bar below toggle */}
      <div className="mt-3 flex items-center justify-between px-3 text-xs">
        {isDineIn ? (
          <div
            onClick={onOpenSeatingModal}
            className="w-full flex items-center justify-between p-2 rounded-xl bg-[#374C44]/70 border border-[#F5E086]/20 text-[#FBF9F2] cursor-pointer hover:border-[#F5E086]/40 transition group"
          >
            <div className="flex items-center gap-2">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
              </span>
              <span className="font-semibold">
                Available Seats:{" "}
                <strong className="text-[#F5E086] font-extrabold">
                  {seating.availableSeats} / {seating.totalSeats}
                </strong>
              </span>
              <span className="text-[11px] text-emerald-300 hidden sm:inline">
                ({seatPercentage}% Open)
              </span>
            </div>

            <span className="text-[11px] text-[#F5E086] underline font-bold group-hover:text-white transition flex items-center gap-1">
              <Users className="w-3 h-3" />
              <span>View Seating Plan →</span>
            </span>
          </div>
        ) : (
          <div className="w-full flex items-center justify-between p-2 rounded-xl bg-[#374C44]/70 border border-[#F5E086]/20 text-[#FBF9F2]">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-[#F5E086]" />
              <span className="font-semibold">
                Estimated Pickup Time:{" "}
                <strong className="text-[#F5E086]">12–15 mins</strong>
              </span>
            </div>
            <span className="text-[11px] text-amber-200 flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              <span>Freshly toasted & boxed</span>
            </span>
          </div>
        )}
      </div>
    </div>
  );
};
