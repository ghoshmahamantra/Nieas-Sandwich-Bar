import React, { useState } from "react";
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Check,
  X,
  RotateCcw,
  Layers,
  CalendarRange,
  Clock,
} from "lucide-react";
import { CustomDateSelectionMode, DateFilterState } from "../../types/analyticsDashboard";

interface CuteCalendarModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentFilter: DateFilterState;
  onApply: (newFilter: DateFilterState) => void;
}

export const CuteCalendarModal: React.FC<CuteCalendarModalProps> = ({
  isOpen,
  onClose,
  currentFilter,
  onApply,
}) => {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);

  // Local state for calendar navigation & selections
  const [navYear, setNavYear] = useState<number>(today.getFullYear());
  const [navMonth, setNavMonth] = useState<number>(today.getMonth()); // 0-indexed

  // Selection mode: "range" | "multi_dates" | "single"
  const [mode, setMode] = useState<CustomDateSelectionMode>(
    currentFilter.customMode || "range"
  );

  // Range mode state
  const [rangeStart, setRangeStart] = useState<string>(
    currentFilter.startDate ||
      new Date(Date.now() - 14 * 86400000).toISOString().slice(0, 10)
  );
  const [rangeEnd, setRangeEnd] = useState<string>(
    currentFilter.endDate || todayStr
  );
  const [isPickingEnd, setIsPickingEnd] = useState(false);

  // Multi-dates mode state
  const [selectedDates, setSelectedDates] = useState<string[]>(
    currentFilter.selectedDates && currentFilter.selectedDates.length > 0
      ? [...currentFilter.selectedDates]
      : [todayStr]
  );

  // Single date mode state
  const [singleDate, setSingleDate] = useState<string>(
    currentFilter.singleDate || todayStr
  );

  if (!isOpen) return null;

  // Month navigation handlers
  const handlePrevMonth = () => {
    if (navMonth === 0) {
      setNavMonth(11);
      setNavYear((y) => y - 1);
    } else {
      setNavMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (navMonth === 11) {
      setNavMonth(0);
      setNavYear((y) => y + 1);
    } else {
      setNavMonth((m) => m + 1);
    }
  };

  // Calendar matrix computation
  const daysInMonth = new Date(navYear, navMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(navYear, navMonth, 1).getDay(); // 0 is Sun

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  // Helper date formatter
  const formatDateStr = (year: number, month: number, day: number) => {
    const m = (month + 1).toString().padStart(2, "0");
    const d = day.toString().padStart(2, "0");
    return `${year}-${m}-${d}`;
  };

  // Click on a day in calendar
  const handleDayClick = (dateStr: string) => {
    if (mode === "single") {
      setSingleDate(dateStr);
    } else if (mode === "multi_dates") {
      // Toggle date in array
      if (selectedDates.includes(dateStr)) {
        if (selectedDates.length > 1) {
          setSelectedDates(selectedDates.filter((d) => d !== dateStr));
        }
      } else {
        setSelectedDates([...selectedDates, dateStr].sort());
      }
    } else {
      // Range mode
      if (!isPickingEnd) {
        setRangeStart(dateStr);
        setRangeEnd(dateStr);
        setIsPickingEnd(true);
      } else {
        if (dateStr < rangeStart) {
          setRangeEnd(rangeStart);
          setRangeStart(dateStr);
        } else {
          setRangeEnd(dateStr);
        }
        setIsPickingEnd(false);
      }
    }
  };

  // Quick preset shortcuts
  const selectThisWeekends = () => {
    setMode("multi_dates");
    const weekends: string[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const d = new Date(navYear, navMonth, day);
      if (d.getDay() === 0 || d.getDay() === 6) {
        weekends.push(formatDateStr(navYear, navMonth, day));
      }
    }
    if (weekends.length > 0) setSelectedDates(weekends);
  };

  const selectLast7Days = () => {
    setMode("range");
    const end = todayStr;
    const start = new Date(Date.now() - 6 * 86400000).toISOString().slice(0, 10);
    setRangeStart(start);
    setRangeEnd(end);
    setIsPickingEnd(false);
  };

  const handleApply = () => {
    if (mode === "single") {
      onApply({
        type: "custom",
        customMode: "single",
        singleDate,
      });
    } else if (mode === "multi_dates") {
      onApply({
        type: "custom",
        customMode: "multi_dates",
        selectedDates: [...selectedDates].sort(),
      });
    } else {
      const sortedStart = rangeStart <= rangeEnd ? rangeStart : rangeEnd;
      const sortedEnd = rangeStart <= rangeEnd ? rangeEnd : rangeStart;
      onApply({
        type: "custom",
        customMode: "range",
        startDate: sortedStart,
        endDate: sortedEnd,
      });
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/85 backdrop-blur-md animate-in fade-in">
      <div className="bg-[#1E2B25] border border-white/20 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="bg-[#17221D] p-4 sm:p-5 border-b border-white/10 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-2xl bg-[#F5E086]/15 text-[#F5E086] border border-[#F5E086]/30">
              <CalendarIcon className="w-5 h-5" />
            </span>
            <div>
              <h3 className="font-niea font-bold text-base sm:text-lg text-[#F5E086] flex items-center gap-2">
                Custom Date Selector
                <Sparkles className="w-3.5 h-3.5 text-[#F5E086]" />
              </h3>
              <p className="text-xs text-white/60">
                Choose random dates, a continuous date range, or a single day
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-white/50 hover:text-white hover:bg-white/10 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode Selector Tabs */}
        <div className="p-3 sm:p-4 bg-[#1A2520] border-b border-white/10">
          <div className="grid grid-cols-3 gap-1.5 p-1 rounded-2xl bg-[#141C18] border border-white/10 text-xs">
            <button
              type="button"
              onClick={() => {
                setMode("range");
                setIsPickingEnd(false);
              }}
              className={`py-2 px-2 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
                mode === "range"
                  ? "bg-[#F5E086] text-[#24332D] shadow"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <CalendarRange className="w-3.5 h-3.5" />
              <span>Date Range</span>
            </button>

            <button
              type="button"
              onClick={() => setMode("multi_dates")}
              className={`py-2 px-2 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
                mode === "multi_dates"
                  ? "bg-[#F5E086] text-[#24332D] shadow"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>Random Dates</span>
            </button>

            <button
              type="button"
              onClick={() => setMode("single")}
              className={`py-2 px-2 rounded-xl font-bold transition flex items-center justify-center gap-1.5 ${
                mode === "single"
                  ? "bg-[#F5E086] text-[#24332D] shadow"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Single Day</span>
            </button>
          </div>

          {/* Mode Guidance Tip */}
          <div className="mt-2 text-[11px] text-white/60 px-1 flex items-center justify-between">
            <span>
              {mode === "range" && "Click start date, then click end date to highlight range"}
              {mode === "multi_dates" && "Click multiple random dates together to compare them"}
              {mode === "single" && "Click any single calendar day to inspect hourly timeline"}
            </span>
            <div className="flex gap-2">
              {mode === "multi_dates" && (
                <button
                  type="button"
                  onClick={selectThisWeekends}
                  className="text-[#F5E086] hover:underline font-semibold"
                >
                  All Weekends
                </button>
              )}
              {mode === "range" && (
                <button
                  type="button"
                  onClick={selectLast7Days}
                  className="text-[#F5E086] hover:underline font-semibold"
                >
                  Past 7D
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Calendar Body */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 flex-1">
          {/* Month / Year Navigator */}
          <div className="flex items-center justify-between">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white transition border border-white/10"
              title="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="text-center">
              <span className="font-niea font-bold text-base text-white">
                {monthNames[navMonth]} {navYear}
              </span>
            </div>

            <button
              type="button"
              onClick={handleNextMonth}
              className="p-2 rounded-xl bg-white/5 hover:bg-white/15 text-white transition border border-white/10"
              title="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase text-white/50 pb-1 border-b border-white/5">
            <span>Sun</span>
            <span>Mon</span>
            <span>Tue</span>
            <span>Wed</span>
            <span>Thu</span>
            <span>Fri</span>
            <span>Sat</span>
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1.5 text-xs">
            {/* Blank offset tiles for first day */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`blank_${i}`} className="h-9 sm:h-10" />
            ))}

            {/* Actual day numbers */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const dateStr = formatDateStr(navYear, navMonth, dayNum);
              const isToday = dateStr === todayStr;

              // Check selection states based on active mode
              let isSelected = false;
              let isRangeStart = false;
              let isRangeEnd = false;
              let isInRangeMiddle = false;

              if (mode === "single") {
                isSelected = dateStr === singleDate;
              } else if (mode === "multi_dates") {
                isSelected = selectedDates.includes(dateStr);
              } else {
                const s = rangeStart <= rangeEnd ? rangeStart : rangeEnd;
                const e = rangeStart <= rangeEnd ? rangeEnd : rangeStart;
                isRangeStart = dateStr === s;
                isRangeEnd = dateStr === e;
                isSelected = isRangeStart || isRangeEnd;
                isInRangeMiddle = dateStr > s && dateStr < e;
              }

              return (
                <button
                  key={dateStr}
                  type="button"
                  onClick={() => handleDayClick(dateStr)}
                  className={`h-9 sm:h-10 rounded-2xl text-xs font-bold transition flex flex-col items-center justify-center relative ${
                    isSelected
                      ? "bg-[#F5E086] text-[#24332D] shadow-lg font-black scale-105 z-10"
                      : isInRangeMiddle
                      ? "bg-[#F5E086]/20 text-[#F5E086] border border-[#F5E086]/30 font-semibold"
                      : isToday
                      ? "bg-white/10 text-white border border-[#F5E086]/60 hover:bg-white/20"
                      : "text-white/80 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  <span>{dayNum}</span>
                  {isToday && !isSelected && (
                    <span className="w-1 h-1 rounded-full bg-[#F5E086] absolute bottom-1" />
                  )}
                  {mode === "multi_dates" && isSelected && (
                    <span className="w-1 h-1 rounded-full bg-[#24332D] absolute bottom-1" />
                  )}
                </button>
              );
            })}
          </div>

          {/* Multi-Dates Selected Tags Preview */}
          {mode === "multi_dates" && selectedDates.length > 0 && (
            <div className="pt-3 border-t border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs text-white/60">
                <span>
                  Picked Dates (<strong>{selectedDates.length}</strong> selected):
                </span>
                <button
                  type="button"
                  onClick={() => setSelectedDates([todayStr])}
                  className="text-amber-400 hover:underline text-[11px] flex items-center gap-1"
                >
                  <RotateCcw className="w-3 h-3" /> Reset
                </button>
              </div>

              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1">
                {selectedDates.map((d) => (
                  <span
                    key={d}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-[#24332D] text-[#F5E086] border border-white/15 text-[11px] font-mono"
                  >
                    <span>{d}</span>
                    {selectedDates.length > 1 && (
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedDates(selectedDates.filter((x) => x !== d));
                        }}
                        className="hover:text-red-400 ml-0.5"
                      >
                        ✕
                      </button>
                    )}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Range Preview */}
          {mode === "range" && (
            <div className="pt-2 text-xs text-white/70 flex items-center justify-between bg-[#141C18] p-2.5 rounded-xl border border-white/5">
              <span>Selected Scope:</span>
              <strong className="text-[#F5E086] font-mono">
                {rangeStart <= rangeEnd
                  ? `${rangeStart}  ➔  ${rangeEnd}`
                  : `${rangeEnd}  ➔  ${rangeStart}`}
              </strong>
            </div>
          )}

          {/* Single Day Preview */}
          {mode === "single" && (
            <div className="pt-2 text-xs text-white/70 flex items-center justify-between bg-[#141C18] p-2.5 rounded-xl border border-white/5">
              <span>Target Single Date:</span>
              <strong className="text-[#F5E086] font-mono">{singleDate}</strong>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 bg-[#17221D] border-t border-white/10 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-white/10 text-white text-xs font-semibold hover:bg-white/20 transition"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={handleApply}
            className="px-5 py-2.5 rounded-xl bg-[#F5E086] text-[#24332D] text-xs font-black hover:bg-[#F8E79B] transition flex items-center gap-2 shadow-lg"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Apply & View Analytics</span>
          </button>
        </div>
      </div>
    </div>
  );
};
