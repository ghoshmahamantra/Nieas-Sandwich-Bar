import { OrderRecord, OrderStepId, OrderPreparationStepDef } from "../types/niea";

export const ORDER_STEPS: OrderPreparationStepDef[] = [
  {
    id: "order_taken",
    stepNumber: 1,
    label: "Order Taken & Queued",
    shortLabel: "Order Taken",
    description: "Ticket logged in system, sourdough loaf selected and queued on line.",
    dineInDesc: "Chef received ticket for table service. Ingredients queued.",
    takeawayDesc: "Counter ticket registered. Sourdough loaf queued for prep.",
    percent: 15,
    icon: "receipt",
  },
  {
    id: "prep_assembly",
    stepNumber: 2,
    label: "Artisan Prep & Filling Assembly",
    shortLabel: "Prepping",
    description: "Freshly sliced house sourdough, layering gourmet meats, cheeses & fillings.",
    dineInDesc: "Slicing artisan loaf & assembling table order with compound butter.",
    takeawayDesc: "Fresh sourdough sliced & layered with chef's signature fillings.",
    percent: 40,
    icon: "chef-hat",
  },
  {
    id: "cooking_toasting",
    stepNumber: 3,
    label: "Cast-Iron Cooking & Toasting",
    shortLabel: "Cooking / Toasting",
    description: "Pressed on 210°C heavy ribbed cast-iron grill until cheese melts and crust crunches.",
    dineInDesc: "Sizzling on cast iron with cultured butter for table service.",
    takeawayDesc: "Pressed on cast iron at 210°C to ensure maximum heat retention.",
    percent: 70,
    icon: "flame",
  },
  {
    id: "garnish_packing",
    stepNumber: 4,
    label: "Garnish, Plating & Packaging",
    shortLabel: "Plating / Packing",
    description: "Sprinkled with sea salt, brushed with rosemary butter, boxed in thermal kraft wrap.",
    dineInDesc: "Freshly plated with house pickles & crisps, inspected for runner.",
    takeawayDesc: "Sealed in eco-thermal packaging to stay crisp on your journey.",
    percent: 88,
    icon: "package",
  },
  {
    id: "ready_calling",
    stepNumber: 5,
    label: "Ready for Pickup / Counter Call",
    shortLabel: "Ready at Counter",
    description: "Order is hot and ready. Token called on calling display and chime.",
    dineInDesc: "Plated fresh and being brought to your table right now!",
    takeawayDesc: "Hot & ready at the front pickup counter. Show token to collect.",
    percent: 100,
    icon: "bell",
  },
  {
    id: "served",
    stepNumber: 6,
    label: "Served & Completed",
    shortLabel: "Served / Taken",
    description: "Hand-delivered to table or collected by guest. Enjoy your meal!",
    dineInDesc: "Hand-delivered to table. Thank you for dining with NiEA'S!",
    takeawayDesc: "Collected by guest. Enjoy your artisan sourdough sandwich!",
    percent: 100,
    icon: "check",
  },
];

export interface StepProgressResult {
  currentStep: OrderPreparationStepDef;
  currentStepIndex: number;
  percent: number;
  isManual: boolean;
  sourceText: string;
  sourceType: "staff_announced" | "auto_timer" | "status_sync";
  statusMessage: string;
  announcedAt?: string;
  announcedNote?: string;
  elapsedMinutes: number;
  totalEstimatedMinutes: number;
  minutesRemaining: number;
  isCompleted: boolean;
  steps: OrderPreparationStepDef[];
}

/**
 * Computes the real-time preparation step and percentage progress.
 * If staff explicitly announced a step (isManualStepActive), uses staff authority.
 * If staff ignored/skipped it, automatically divides the preparation time
 * proportionally across the kitchen milestones.
 */
export function getOrderStepProgress(
  order: OrderRecord,
  simulatedNowMs?: number
): StepProgressResult {
  const steps = ORDER_STEPS;
  const now = simulatedNowMs || Date.now();
  const createdTime = order.createdAt ? new Date(order.createdAt).getTime() : now;
  const elapsedMs = Math.max(0, now - (isNaN(createdTime) ? now : createdTime));
  const elapsedMinutes = Math.floor(elapsedMs / (60 * 1000));

  // Determine target total prep duration
  const totalEstimatedMinutes =
    order.estimatedWaitingMinutes ||
    (order.orderType === "takeaway" ? 12 : 16);
  const totalTargetMs = totalEstimatedMinutes * 60 * 1000;

  // 1. If marked served
  if (order.status === "served") {
    const servedStep = steps[5]; // served
    return {
      currentStep: servedStep,
      currentStepIndex: 5,
      percent: 100,
      isManual: false,
      sourceText: "Order Completed",
      sourceType: "status_sync",
      statusMessage: "Delivered to guest. Order complete.",
      elapsedMinutes,
      totalEstimatedMinutes,
      minutesRemaining: 0,
      isCompleted: true,
      steps,
    };
  }

  // 2. If marked ready
  if (order.status === "ready" && (!order.isManualStepActive || order.manualStepId === "ready_calling")) {
    const readyStep = steps[4]; // ready_calling
    return {
      currentStep: readyStep,
      currentStepIndex: 4,
      percent: 100,
      isManual: !!order.isManualStepActive,
      sourceText: order.isManualStepActive ? "👨‍🍳 Staff Announced Ready" : "Counter Call Active",
      sourceType: order.isManualStepActive ? "staff_announced" : "status_sync",
      statusMessage: "Hot & ready for pickup at counter!",
      announcedAt: order.manualStepAnnouncedAt,
      announcedNote: order.manualStepAnnouncedNote,
      elapsedMinutes,
      totalEstimatedMinutes,
      minutesRemaining: 0,
      isCompleted: false,
      steps,
    };
  }

  // 3. If staff manually selected and announced a step
  if (order.isManualStepActive && order.manualStepId) {
    const foundIdx = steps.findIndex((s) => s.id === order.manualStepId);
    const stepIdx = foundIdx >= 0 ? foundIdx : 0;
    const currentStep = steps[stepIdx];

    const minsLeft =
      typeof order.estimatedMinutesLeft === "number"
        ? order.estimatedMinutesLeft
        : Math.max(0, Math.round(totalEstimatedMinutes * (1 - currentStep.percent / 100)));

    let announcedFormatted = "";
    if (order.manualStepAnnouncedAt) {
      try {
        announcedFormatted = new Date(order.manualStepAnnouncedAt).toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
        });
      } catch {}
    }

    return {
      currentStep,
      currentStepIndex: stepIdx,
      percent: currentStep.percent,
      isManual: true,
      sourceText: `👨‍🍳 Staff Announced${announcedFormatted ? ` (${announcedFormatted})` : ""}`,
      sourceType: "staff_announced",
      statusMessage: order.manualStepAnnouncedNote || currentStep.description,
      announcedAt: order.manualStepAnnouncedAt,
      announcedNote: order.manualStepAnnouncedNote,
      elapsedMinutes,
      totalEstimatedMinutes,
      minutesRemaining: minsLeft,
      isCompleted: false,
      steps,
    };
  }

  // 4. AUTOMATIC TIME-DIVISION (Staff ignored or left on automatic)
  // Divide time into proportional stages based on elapsed time vs total estimated time
  let timeRatio = totalTargetMs > 0 ? elapsedMs / totalTargetMs : 0.1;

  // If order is in "toasting" status, ensure at least 48% progress
  if (order.status === "toasting") {
    timeRatio = Math.max(timeRatio, 0.48);
  }

  // Factor in estimatedMinutesLeft if staff adjusted timer
  if (typeof order.estimatedMinutesLeft === "number" && order.estimatedMinutesLeft >= 0) {
    const computedLeftRatio = 1 - order.estimatedMinutesLeft / totalEstimatedMinutes;
    timeRatio = Math.max(timeRatio, Math.min(0.95, computedLeftRatio));
  }

  // Bound ratio between 8% and 94% until officially marked ready
  const clampedRatio = Math.min(0.94, Math.max(0.08, timeRatio));
  const autoPercent = Math.round(clampedRatio * 100);

  let autoStepIdx = 0;
  if (clampedRatio < 0.20) {
    autoStepIdx = 0; // order_taken
  } else if (clampedRatio < 0.48) {
    autoStepIdx = 1; // prep_assembly
  } else if (clampedRatio < 0.78) {
    autoStepIdx = 2; // cooking_toasting
  } else {
    autoStepIdx = 3; // garnish_packing
  }

  const currentStep = steps[autoStepIdx];
  const minutesRemaining =
    typeof order.estimatedMinutesLeft === "number"
      ? Math.max(0, order.estimatedMinutesLeft)
      : Math.max(
          1,
          Math.round(totalEstimatedMinutes * (1 - clampedRatio))
        );

  return {
    currentStep,
    currentStepIndex: autoStepIdx,
    percent: autoPercent,
    isManual: false,
    sourceText: "⚡ Auto Time-Divided",
    sourceType: "auto_timer",
    statusMessage: currentStep.description,
    elapsedMinutes,
    totalEstimatedMinutes,
    minutesRemaining,
    isCompleted: false,
    steps,
  };
}

/**
 * Audio Chime Synthesizer - automatic audio feedback disabled per user specification
 */
export function playCafeAnnouncementChime() {
  // Silent: Automatic audio feedback disabled when commands are given
}

/**
 * Text-to-Speech Announcement - automatic audio feedback disabled per user specification
 */
export function speakStepAnnouncement(
  _tokenNumber: string,
  _stepLabel: string,
  _extraPhrase?: string
) {
  // Silent: Automatic audio feedback disabled when commands are given
}
