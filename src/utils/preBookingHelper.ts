import { PreBookingConfig } from "../types/niea";

export interface PreBookingWindowStatus {
  isOpen: boolean;
  isForceOpen: boolean;
  currentHour: number;
  currentMinute: number;
  startHour: number;
  startMinute: number;
  endHour: number;
  endMinute: number;
  displayWindowText: string;
  closedReason: string;
  nextOpenText: string;
  currentTimeFormatted: string;
  startFormatted: string;
  endFormatted: string;
}

/**
 * Checks if the store's Pre-Booking / Pre-Order window is currently active.
 * Time range is fully flexible (any start time to any end time).
 * Includes "isForceOpen" override which forces pre-orders open 24/7 if turned on by owner.
 */
export function checkPreBookingWindow(config?: PreBookingConfig): PreBookingWindowStatus {
  const now = new Date();
  const currentHour = now.getHours();
  const currentMinute = now.getMinutes();
  const currentTotalMinutes = currentHour * 60 + currentMinute;

  const isEnabled = config?.isEnabled ?? true;
  const isForceOpen = Boolean(config?.isForceOpen);

  const startHour = typeof config?.startHour === "number" ? config.startHour : 11;
  const startMinute = typeof config?.startMinute === "number" ? config.startMinute : 0;
  const endHour = typeof config?.endHour === "number" ? config.endHour : 15;
  const endMinute = typeof config?.endMinute === "number" ? config.endMinute : 0;

  const startTotalMinutes = startHour * 60 + startMinute;
  const endTotalMinutes = endHour * 60 + endMinute;

  let isWithinHours = false;
  if (endTotalMinutes > startTotalMinutes) {
    isWithinHours = currentTotalMinutes >= startTotalMinutes && currentTotalMinutes < endTotalMinutes;
  } else if (endTotalMinutes < startTotalMinutes) {
    // Overnight window e.g. 19:00 to 02:00
    isWithinHours = currentTotalMinutes >= startTotalMinutes || currentTotalMinutes < endTotalMinutes;
  } else {
    // Same time set: active all day if enabled
    isWithinHours = true;
  }

  // Force enable overrides time bounds
  const isOpen = isForceOpen || (isEnabled && isWithinHours);

  const formatTime = (h: number, m: number = 0) => {
    const period = h >= 12 ? "PM" : "AM";
    const displayH = h % 12 === 0 ? 12 : h % 12;
    const displayM = m > 0 ? `:${String(m).padStart(2, "0")}` : ":00";
    return `${displayH}${displayM} ${period}`;
  };

  const startFormatted = formatTime(startHour, startMinute);
  const endFormatted = formatTime(endHour, endMinute);

  const displayWindowText = isForceOpen
    ? "Pre-Orders Open (Force Override Active)"
    : `${startFormatted} – ${endFormatted} Daily`;

  const currentTimeFormatted = now.toLocaleTimeString([], {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

  let closedReason = "";
  if (isOpen) {
    closedReason = "";
  } else if (!isEnabled) {
    closedReason = "Pre-orders are currently paused by cafe management.";
  } else {
    closedReason = `Pre-orders operate strictly ${startFormatted} to ${endFormatted}. Store is currently closed for online pre-orders (Current Time: ${currentTimeFormatted}).`;
  }

  const nextOpenText = `${startFormatted}`;

  return {
    isOpen,
    isForceOpen,
    currentHour,
    currentMinute,
    startHour,
    startMinute,
    endHour,
    endMinute,
    displayWindowText,
    closedReason,
    nextOpenText,
    currentTimeFormatted,
    startFormatted,
    endFormatted,
  };
}
