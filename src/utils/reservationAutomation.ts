import { ReservationRecord, SeatingStatus } from "../types/niea";

export interface AutomationResult {
  effectiveAvailableSeats: number;
  totalSeats: number;
  totalHeldByReservations: number;
  activeHolds: {
    reservationId: string;
    customerName: string;
    guestCount: number;
    timeSlot: string;
    reason: string;
  }[];
  autoReleasedReservations: {
    reservationId: string;
    customerName: string;
    guestCount: number;
    timeSlot: string;
    releasedAt: string;
  }[];
  updatedReservations: ReservationRecord[];
  simulatedTimeLabel: string;
}

/**
 * Extracts hour and minute (in minutes from midnight 0..1439) from a string like "2:00 PM" or "1:00 PM (Lunch Rush)"
 */
export function parseTimeSlotToMinutes(timeSlot: string): number | null {
  if (!timeSlot) return null;
  const clean = timeSlot.trim();

  // Try matching HH:MM (AM/PM)? e.g. "2:00 PM", "10:30 AM", "2:00 PM (Lunch)"
  let match = clean.match(/(\d{1,2}):(\d{2})\s*(AM|PM)?/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const meridian = match[3] ? match[3].toUpperCase() : null;

    if (meridian === "PM" && hours < 12) {
      hours += 12;
    } else if (meridian === "AM" && hours === 12) {
      hours = 0;
    }

    return hours * 60 + minutes;
  }

  // Try matching HH (AM/PM) e.g. "2 PM", "11 AM"
  match = clean.match(/(\d{1,2})\s*(AM|PM)/i);
  if (match) {
    let hours = parseInt(match[1], 10);
    const meridian = match[2].toUpperCase();
    if (meridian === "PM" && hours < 12) {
      hours += 12;
    } else if (meridian === "AM" && hours === 12) {
      hours = 0;
    }
    return hours * 60;
  }

  // Try 24-hour HH:MM format e.g. "14:00"
  match = clean.match(/^(\d{1,2}):(\d{2})$/);
  if (match) {
    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    return hours * 60 + minutes;
  }

  return null;
}

/**
 * Intelligent automation rule engine:
 * 1. Decreases seats immediately if customer is "seated".
 * 2. If "confirmed":
 *    - 10 minutes BEFORE reservation time: seats automatically decrease by guestCount (hold active).
 *    - Up to 30 minutes AFTER reservation time: hold remains active.
 *    - If 30 minutes have elapsed without seating confirmation: auto-releases the hold and restores available seats!
 */
export function processReservationAutomations(
  reservations: ReservationRecord[],
  baseCapacity: { totalSeats: number; walkInOccupiedSeats?: number },
  overrideMinutes?: number // Optional simulated time for testing & demo
): AutomationResult {
  const now = new Date();
  const currentMinutes =
    overrideMinutes !== undefined
      ? overrideMinutes
      : now.getHours() * 60 + now.getMinutes();

  const totalSeats = baseCapacity.totalSeats || 28;
  const walkInOccupied = baseCapacity.walkInOccupiedSeats || 0;

  let totalHeld = 0;
  const activeHolds: AutomationResult["activeHolds"] = [];
  const autoReleased: AutomationResult["autoReleasedReservations"] = [];

  const updatedReservations = reservations.map((res) => {
    // We only automate active bookings for "Today" or matching today
    const isToday =
      !res.date ||
      res.date.toLowerCase().includes("today") ||
      res.date === now.toLocaleDateString("en-US", { month: "short", day: "numeric" });

    if (!isToday || res.status === "cancelled") {
      return { ...res, autoHoldActive: false };
    }

    if (res.status === "seated") {
      totalHeld += res.guestCount;
      activeHolds.push({
        reservationId: res.id,
        customerName: res.customerName,
        guestCount: res.guestCount,
        timeSlot: res.timeSlot,
        reason: `Customer Seated at Table (-${res.guestCount} seats occupied)`,
      });
      return { ...res, autoHoldActive: true };
    }

    if (res.status === "confirmed") {
      const slotMinutes = parseTimeSlotToMinutes(res.timeSlot);

      // If cannot parse time, hold as standard confirmed booking
      if (slotMinutes === null) {
        totalHeld += res.guestCount;
        activeHolds.push({
          reservationId: res.id,
          customerName: res.customerName,
          guestCount: res.guestCount,
          timeSlot: res.timeSlot,
          reason: `Active Confirmed Booking (-${res.guestCount} seats)`,
        });
        return { ...res, autoHoldActive: true };
      }

      const diff = currentMinutes - slotMinutes;

      // Case 1: More than 10 minutes before slot -> Not held yet
      if (diff < -10) {
        return { ...res, autoHoldActive: false };
      }

      // Case 2: Between 10 minutes before and 30 minutes after -> AUTO-HOLD ACTIVE!
      if (diff >= -10 && diff <= 30) {
        totalHeld += res.guestCount;
        const timingText =
          diff < 0
            ? `Auto-Hold (10m pre-booking prep for ${Math.abs(diff)}m before ${res.timeSlot})`
            : `Auto-Hold (Grace period active, +${diff}m past ${res.timeSlot})`;

        activeHolds.push({
          reservationId: res.id,
          customerName: res.customerName,
          guestCount: res.guestCount,
          timeSlot: res.timeSlot,
          reason: `${timingText}: -${res.guestCount} seats`,
        });
        return { ...res, autoHoldActive: true, autoReleased: false };
      }

      // Case 3: More than 30 minutes after slot and customer is still not seated -> AUTO-RELEASE!
      if (diff > 30) {
        autoReleased.push({
          reservationId: res.id,
          customerName: res.customerName,
          guestCount: res.guestCount,
          timeSlot: res.timeSlot,
          releasedAt: `${diff} mins past schedule`,
        });
        return {
          ...res,
          status: "no-show" as const,
          autoHoldActive: false,
          autoReleased: true,
        };
      }
    }

    return res;
  });

  const effectiveAvailableSeats = Math.max(0, totalSeats - walkInOccupied - totalHeld);

  const displayHours = Math.floor(currentMinutes / 60) % 24;
  const displayMins = currentMinutes % 60;
  const ampm = displayHours >= 12 ? "PM" : "AM";
  const formattedHours = displayHours % 12 === 0 ? 12 : displayHours % 12;
  const simulatedTimeLabel = `${formattedHours}:${displayMins < 10 ? "0" : ""}${displayMins} ${ampm}`;

  return {
    effectiveAvailableSeats,
    totalSeats,
    totalHeldByReservations: totalHeld,
    activeHolds,
    autoReleasedReservations: autoReleased,
    updatedReservations,
    simulatedTimeLabel,
  };
}
