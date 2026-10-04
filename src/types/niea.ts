export type OrderType = "dine-in" | "takeaway";
export type OrderKind = "pre_order" | "dine_in" | "takeaway" | "walk_in" | "zomato" | "swiggy";
export type OrderSource = "website" | "pos" | "walk_in" | "zomato" | "swiggy";
export type PaymentMode = "cash" | "upi" | "card" | "pos" | "counter" | "razorpay";
export type KitchenStatus = "kot_dispatched" | "received" | "preparing" | "ready" | "served" | "cancelled";

export interface PreBookingConfig {
  isEnabled: boolean;
  isForceOpen?: boolean; // Force enable pre-booking override button
  startHour: number; // e.g. 11 (11:00 AM)
  startMinute?: number; // e.g. 0
  endHour: number; // e.g. 15 (3:00 PM)
  endMinute?: number; // e.g. 0
  startTime?: string; // e.g. "11:00"
  endTime?: string; // e.g. "15:00"
  timeSlotIntervalMinutes: number;
  advanceDepositAmount: number;
  message?: string;
}

export interface LoyaltyProgramConfig {
  isEnabled: boolean; // Owner toggle to enable/disable Perks program
  programName: string; // e.g. "NiEA Paws & Perks Club"
  stampsRequired: number; // e.g. 6
  rewardDiscountAmount: number; // e.g. 150
  rewardDescription: string; // e.g. "Flat ₹150 off on completing 6 sandwich stamps"
}

export interface DailyIngredientEntry {
  id: string;
  date: string; // YYYY-MM-DD
  name: string;
  category: "bread" | "vegetables" | "dairy_cheese" | "meat_fillings" | "sauces_condiments" | "packaging" | "beverage_beans";
  quantity: number;
  unit: string; // "loaves", "kg", "litres", "packets", "units"
  unitPrice: number; // ₹ per unit
  totalCost: number; // quantity * unitPrice
  supplierNotes?: string;
  createdAt: string;
}

export interface MasterIngredientTemplate {
  id: string;
  name: string;
  category: "bread" | "vegetables" | "dairy_cheese" | "meat_fillings" | "sauces_condiments" | "packaging" | "beverage_beans";
  defaultQuantity: number;
  defaultUnit: string;
  defaultUnitPrice: number;
  supplierNotes?: string;
  updatedAt?: string;
}

export interface DailyWastageEntry {
  id: string;
  date: string; // YYYY-MM-DD
  itemName: string;
  category: string;
  quantity: number;
  unit: string;
  costLoss: number; // ₹ loss
  reason: "expired" | "damaged" | "prep_scrap" | "overprepared";
  createdAt: string;
}

export interface CouponDiscount {
  id: string;
  code: string;
  title: string;
  description?: string;
  discountType: "flat" | "percentage";
  discountValue: number; // e.g. 50 (flat ₹50) or 10 (10%)
  minOrderAmount?: number;
  maxDiscount?: number;
  isActive: boolean;
}

export interface StoreFinancialSettings {
  gstRatePercent: number; // e.g. 5
  packagingChargeTakeaway: number; // e.g. 0 or 25
  advanceDepositAmount: number; // e.g. 150
  cogsPercentage: number; // e.g. 32
  overheadAllocationPercent: number; // e.g. 24
  targetWastagePercent?: number; // e.g. 4.0
  zomatoCommissionPercent?: number; // e.g. 18
  swiggyCommissionPercent?: number; // e.g. 18
  razorpayKeyId?: string; // e.g. rzp_live_xxx or rzp_test_xxx
  razorpayKeySecret?: string; // e.g. secret key
  isPayAtCounterEnabled?: boolean; // Controls whether cash / pay at counter is allowed for pre-orders & takeaway (default false)
}

export interface WebsiteContentConfig {
  cafeName: string;
  tagline: string;
  announcement: string;
  address: string;
  phone: string;
  wifiName: string;
  weekdayHours: string;
  closedDay: string;
  kitchenLastCall: string;
  fssaiNumber: string;
  gstin: string;
  footerStory: string;
  instagramHandle: string;
  heroBackgroundImage?: string;
  heroBackgroundOverlayOpacity?: number;
  heroPillText?: string;
  heroTitle?: string;
  heroTitleFontFamily?: string; // Custom font for Hero Title (e.g. "playfair", "cinzel", "fraunces")
  heroTitleFontSize?: number; // Custom font size for Hero Title in px (e.g. 48 to 84)
  showHeroTitle?: boolean; // Controls showing/removing "NiEA'S Sandwich Bar" text on front page
  showHeroPill?: boolean; // Controls showing/removing the top category pill
  showHeroTagline?: boolean; // Controls showing/removing the subtitle/tagline
  showHeroSandwichCount?: boolean; // Controls showing/removing the sandwiches remaining counter
  showHeroOperatingInfo?: boolean; // Controls showing/removing the hours and address below the buttons
  orderNowButtonSize?: "sm" | "md" | "lg" | "xl"; // Adjustable "Order Now" button size preset
  orderNowButtonFontSize?: number; // Adjustable font size in px (e.g. 12px to 24px)
  isReservationEnabled?: boolean; // Controls whether table reservation is enabled or in 'coming soon' mode
  fontFamily?: string; // Global website font family
  fontScale?: string; // Legacy font scale
  fontScalePercent?: number; // Interactive slider font scale percent (85% to 140%)
  isLiquidGlassEnabled?: boolean; // Controls Apple Liquid Glass UI refraction and fluid spring physics
  ownerPasscode?: string; // Changeable owner portal security PIN (default "1234")
}

export interface WhatsAppTemplatesConfig {
  ownerAlertPhone: string;
  isOwnerAlertEnabled: boolean;
  orderCustomerTemplate: string;
  orderReadyTemplate: string;
  reservationCustomerTemplate: string;
  ownerOrderAlertTemplate: string;
  ownerReservationAlertTemplate: string;
}

export interface PosSalesRecord {
  id: string;
  date: string;
  cashSales: number;
  upiSales: number;
  cardSales?: number;
  totalOrders: number;
  cancelledOrders: number;
  notes?: string;
  createdAt: string;
}

export type MenuCategory =
  | "burgers"
  | "hot-picks"
  | "green-room"
  | "sides"
  | "drinkables"
  | "extras"
  | "seasonal"
  | "sandwiches"
  | "toasties"
  | "beverages"
  | "bakery";

export interface CustomizationOption {
  name: string;
  price: number;
}

export interface MenuItem {
  id: string;
  name: string;
  subtitle?: string;
  description: string;
  price: number;
  category: MenuCategory;
  isVeg: boolean;
  isVegan?: boolean;
  tags: string[];
  imageUrl: string;
  stockLeft: number; // e.g. 4
  initialStock: number;
  restockSchedule: string; // e.g. "Fresh batch daily at 2:00 PM"
  isSeasonal?: boolean;
  isBestseller?: boolean;
  breadChoices?: string[];
  customizations?: CustomizationOption[];
}

export interface CartItem {
  cartItemId: string;
  item: MenuItem;
  quantity: number;
  selectedBread?: string;
  selectedCustomizations: CustomizationOption[];
  specialInstructions?: string;
  unitPrice: number;
  totalPrice: number;
}

export interface SeatingStatus {
  totalSeats: number;
  availableSeats: number;
  totalSandwiches: number;
  availableSandwiches: number;
  tablesTotal: number;
  tablesOccupied: number;
  estimatedWaitMinutes: number;
  lastUpdated: string;
}

export interface LoyaltyProfile {
  customerName: string;
  phoneNumber: string;
  pawsPoints: number;
  stampsCount: number; // 0 to 6
  tier: "Kitten" | "Tuxedo Pal" | "Baron Von Cat";
  petInteractions: number;
  unlockedVouchers: {
    id: string;
    title: string;
    discount: number; // INR
    description: string;
    code: string;
  }[];
}

export interface ReservationRecord {
  id: string;
  bookingRef: string;
  tokenNumber?: string;
  bookingType?: "table" | "pre_order";
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  date: string;
  timeSlot: string;
  guestCount: number;
  seatingArea: "table1" | "table2" | "patio" | "indoor" | "window";
  specialNotes?: string;
  status: "confirmed" | "seated" | "cancelled" | "no-show" | "completed";
  advanceDeposit?: number;
  depositStatus?: "paid" | "pending" | "exempt";
  depositTxnId?: string;
  autoHoldActive?: boolean;
  autoReleased?: boolean;
  createdAt: string;
}

export interface CafeHighlight {
  id: string;
  title: string;
  badge: string;
  description: string;
  price: number;
  imageUrl: string;
  menuItemId: string;
  mode: "manual" | "auto";
  autoSource: "today_top_orders" | "yesterday_top_orders";
  lastUpdated: string;
  dailyOrderCount?: number;
}

export interface OrderNotification {
  id: string;
  time: string;
  title: string;
  message: string;
  type: "status" | "time" | "kitchen";
  step?: "received" | "toasting" | "ready" | "served" | "cancelled" | OrderStepId;
}

export type OrderStepId =
  | "order_taken"
  | "prep_assembly"
  | "cooking_toasting"
  | "garnish_packing"
  | "ready_calling"
  | "served";

export interface OrderPreparationStepDef {
  id: OrderStepId;
  stepNumber: number;
  label: string;
  shortLabel: string;
  description: string;
  dineInDesc: string;
  takeawayDesc: string;
  percent: number;
  icon: string;
}

export interface OrderRecord {
  id: string;
  orderNumber: string;
  tokenNumber: string; // McDonald's-style token e.g. "T-101"
  userId?: string;
  orderType: OrderType;
  orderKind?: OrderKind; // "pre_order" | "dine_in" | "takeaway" | "walk_in"
  orderSource?: OrderSource; // "website" | "pos" | "walk_in"
  tableNumber?: string;
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  items: CartItem[];
  subtotal: number;
  taxes: number; // 5% GST
  tip?: number; // Kitchen & staff tip
  packagingCharge: number;
  discount: number;
  grandTotal: number;
  paymentMethod: PaymentMode;
  paymentStatus: "paid" | "pending";
  advancePaid?: number;
  preOrderSlot?: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  createdAt: string;
  estimatedTime: string;
  estimatedWaitingMinutes?: number; // e.g. 45
  waitingStartedAt?: string;
  calledAt?: string;
  kotPrinted?: boolean;
  kotPrintedAt?: string;
  orderNotes?: string;
  whatsappNotified?: boolean;
  readyNotified?: boolean;
  estimatedMinutesLeft?: number;
  lastTimeLeftUpdated?: string;
  status: "received" | "toasting" | "ready" | "served" | "cancelled";
  kitchenStatus?: KitchenStatus;
  manualStepId?: OrderStepId;
  manualStepAnnouncedAt?: string;
  manualStepAnnouncedNote?: string;
  isManualStepActive?: boolean;
  notifications?: OrderNotification[];
  feedbackShared?: boolean;
  feedbackRating?: number;
  feedbackComment?: string;
  feedbackPlatform?: string;
  feedbackSharedAt?: string;
}

export interface UserSession {
  uid?: string;
  phoneNumber?: string;
  name: string;
  isLoggedIn: boolean;
  email?: string;
  avatarUrl?: string;
  authProvider?: "google" | "guest" | "phone";
  savedAddress?: string;
  loginTimestamp?: string;
}

