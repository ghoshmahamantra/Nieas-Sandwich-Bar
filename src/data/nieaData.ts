import {
  MenuItem,
  SeatingStatus,
  LoyaltyProfile,
  CafeHighlight,
  OrderRecord,
  PreBookingConfig,
  PosSalesRecord,
  CouponDiscount,
  StoreFinancialSettings,
  WebsiteContentConfig,
  WhatsAppTemplatesConfig,
  LoyaltyProgramConfig,
  DailyIngredientEntry,
  DailyWastageEntry,
  MasterIngredientTemplate,
  CustomizationOption,
} from "../types/niea";

export const DEFAULT_PRE_BOOKING_CONFIG: PreBookingConfig = {
  isEnabled: true,
  isForceOpen: false,
  startHour: 11, // 11:00 AM
  startMinute: 0,
  endHour: 10, // 10:00 AM (Next day)
  endMinute: 0,
  timeSlotIntervalMinutes: 30,
  advanceDepositAmount: 150, // INR
  message: "Pre-orders operate strictly within the configured window (11:00 AM – 10:00 AM).",
};

export const DEFAULT_LOYALTY_CONFIG: LoyaltyProgramConfig = {
  isEnabled: true,
  programName: "NiEA Paws & Perks Club",
  stampsRequired: 6,
  rewardDiscountAmount: 150,
  rewardDescription: "Complete 6 stamps to unlock Flat ₹150 OFF your next artisan melt!",
};

export const DEFAULT_MASTER_INGREDIENTS: MasterIngredientTemplate[] = [
  {
    id: "master-sourdough",
    name: "Artisan Sourdough Loaves (Fresh Daily Bake)",
    category: "bread",
    defaultQuantity: 25,
    defaultUnit: "loaves",
    defaultUnitPrice: 85,
    supplierNotes: "Local New Town Baker - Cultured starter batch",
  },
  {
    id: "master-shokupan",
    name: "Japanese Shokupan Brioche Loaves",
    category: "bread",
    defaultQuantity: 15,
    defaultUnit: "loaves",
    defaultUnitPrice: 95,
    supplierNotes: "Milk butter enriched bakery supply",
  },
  {
    id: "master-cheddar",
    name: "Aged Cheddar & Mozzarella Blend",
    category: "dairy_cheese",
    defaultQuantity: 6,
    defaultUnit: "kg",
    defaultUnitPrice: 420,
    supplierNotes: "Premium melting block",
  },
  {
    id: "master-mushrooms",
    name: "Fresh Farm Mushrooms & Portobello",
    category: "vegetables",
    defaultQuantity: 4,
    defaultUnit: "kg",
    defaultUnitPrice: 180,
    supplierNotes: "Morning mandi fresh delivery",
  },
  {
    id: "master-tomatoes",
    name: "Organic Vine Tomatoes, Microgreens & Basil",
    category: "vegetables",
    defaultQuantity: 5,
    defaultUnit: "kg",
    defaultUnitPrice: 90,
    supplierNotes: "Hydroponic farm Kolkata",
  },
  {
    id: "master-butter",
    name: "French Style Salted Cultured Butter",
    category: "dairy_cheese",
    defaultQuantity: 5,
    defaultUnit: "kg",
    defaultUnitPrice: 380,
    supplierNotes: "Griddle searing butter",
  },
  {
    id: "master-boxes",
    name: "Biodegradable Toastie Boxes & Greaseproof Wraps",
    category: "packaging",
    defaultQuantity: 60,
    defaultUnit: "units",
    defaultUnitPrice: 12,
    supplierNotes: "Custom NiEA branded kraft liners",
  },
];

export const INITIAL_DAILY_INGREDIENTS: DailyIngredientEntry[] = [
  {
    id: "ing-1",
    date: new Date().toISOString().slice(0, 10),
    name: "Artisan Sourdough Loaves (Fresh Daily Bake)",
    category: "bread",
    quantity: 25,
    unit: "loaves",
    unitPrice: 85,
    totalCost: 2125,
    supplierNotes: "Local New Town Baker - Cultured starter batch",
    createdAt: new Date().toISOString(),
  },
  {
    id: "ing-2",
    date: new Date().toISOString().slice(0, 10),
    name: "Japanese Shokupan Brioche Loaves",
    category: "bread",
    quantity: 15,
    unit: "loaves",
    unitPrice: 95,
    totalCost: 1425,
    supplierNotes: "Milk butter enriched bakery supply",
    createdAt: new Date().toISOString(),
  },
  {
    id: "ing-3",
    date: new Date().toISOString().slice(0, 10),
    name: "Aged Cheddar & Mozzarella Blend",
    category: "dairy_cheese",
    quantity: 6,
    unit: "kg",
    unitPrice: 420,
    totalCost: 2520,
    supplierNotes: "Premium melting block",
    createdAt: new Date().toISOString(),
  },
  {
    id: "ing-4",
    date: new Date().toISOString().slice(0, 10),
    name: "Fresh Farm Mushrooms & Portobello",
    category: "vegetables",
    quantity: 4,
    unit: "kg",
    unitPrice: 180,
    totalCost: 720,
    supplierNotes: "Morning mandi fresh delivery",
    createdAt: new Date().toISOString(),
  },
  {
    id: "ing-5",
    date: new Date().toISOString().slice(0, 10),
    name: "Organic Vine Tomatoes, Microgreens & Basil",
    category: "vegetables",
    quantity: 5,
    unit: "kg",
    unitPrice: 90,
    totalCost: 450,
    supplierNotes: "Hydroponic farm Kolkata",
    createdAt: new Date().toISOString(),
  },
  {
    id: "ing-6",
    date: new Date().toISOString().slice(0, 10),
    name: "French Style Salted Cultured Butter",
    category: "dairy_cheese",
    quantity: 5,
    unit: "kg",
    unitPrice: 380,
    totalCost: 1900,
    supplierNotes: "Griddle searing butter",
    createdAt: new Date().toISOString(),
  },
  {
    id: "ing-7",
    date: new Date().toISOString().slice(0, 10),
    name: "Biodegradable Toastie Boxes & Greaseproof Wraps",
    category: "packaging",
    quantity: 60,
    unit: "units",
    unitPrice: 12,
    totalCost: 720,
    supplierNotes: "Custom NiEA branded kraft liners",
    createdAt: new Date().toISOString(),
  },
];

export const INITIAL_DAILY_WASTAGE: DailyWastageEntry[] = [
  {
    id: "w-1",
    date: new Date().toISOString().slice(0, 10),
    itemName: "End Heel Slices (Sourdough)",
    category: "bread",
    quantity: 4,
    unit: "slices",
    costLoss: 60,
    reason: "prep_scrap",
    createdAt: new Date().toISOString(),
  },
  {
    id: "w-2",
    date: new Date().toISOString().slice(0, 10),
    itemName: "Bruised Cherry Tomatoes",
    category: "vegetables",
    quantity: 0.5,
    unit: "kg",
    costLoss: 45,
    reason: "damaged",
    createdAt: new Date().toISOString(),
  },
];

export const DEFAULT_COUPONS: CouponDiscount[] = [
  {
    id: "c-paws10",
    code: "PAWS10",
    title: "10% Off Sourdough Melts",
    description: "10% off any order above ₹300",
    discountType: "percentage",
    discountValue: 10,
    minOrderAmount: 300,
    maxDiscount: 100,
    isActive: true,
  },
  {
    id: "c-nieafirst",
    code: "NIEAFIRST",
    title: "Flat ₹50 Off First Visit",
    description: "Welcome discount for all new sandwich lovers",
    discountType: "flat",
    discountValue: 50,
    minOrderAmount: 250,
    isActive: true,
  },
  {
    id: "c-cookiepurr",
    code: "COOKIEPURR",
    title: "Flat ₹60 Sweet Treat Discount",
    description: "Redeemable with any sourdough toastie order",
    discountType: "flat",
    discountValue: 60,
    minOrderAmount: 200,
    isActive: true,
  },
];

export const DEFAULT_FINANCIAL_SETTINGS: StoreFinancialSettings = {
  gstRatePercent: 5, // 5% GST
  packagingChargeTakeaway: 0, // Complimentary eco-kraft box by default
  advanceDepositAmount: 150, // ₹150 deposit
  cogsPercentage: 32, // 32% food cost
  overheadAllocationPercent: 24, // 24% overhead
  razorpayKeyId: "",
  razorpayKeySecret: "",
  isPayAtCounterEnabled: false, // Keep disabled by default for online pre-orders
};

export const DEFAULT_WEBSITE_CONFIG: WebsiteContentConfig = {
  cafeName: "NiEA'S SANDWICH BAR",
  tagline: "Cultured sourdough melts, toasted brioche & specialty beverages. Handcrafted fresh daily in New Town Action Area 1, Kolkata.",
  announcement: "Autumn Truffle Melt Feature Live • Fresh Artisanal Bread Baked Daily • Welcome to NiEA'S in New Town, Kolkata",
  address: "Action Area 1, New Town, Kolkata, West Bengal 700156",
  phone: "+91 82740 47424",
  wifiName: "NiEAs_SandwichBar_5G",
  weekdayHours: "Tuesday – Sunday: 1:00 PM – 11:00 PM",
  closedDay: "Monday: Closed",
  kitchenLastCall: "Kitchen Last Call: 10:30 PM",
  fssaiNumber: "22824012000491",
  gstin: "19ABCDE1234F1Z5",
  footerStory: "Artisanal toasted sandwiches, cultured sourdough, warm brioche, and specialty beverages in New Town's favorite sandwich bar.",
  instagramHandle: "@nieas.sandwichbar",
  heroBackgroundImage: "/PHOTO-2026-10-02-15-59-48.jpg",
  heroBackgroundOverlayOpacity: 0.45,
  heroPillText: "ARTISANAL SOURDOUGH & SPECIALTY SANDWICHES • KOLKATA",
  heroTitle: "NiEA'S Sandwich Bar",
  heroTitleFontFamily: "playfair",
  heroTitleFontSize: 64,
  showHeroTitle: true,
  showHeroPill: true,
  showHeroTagline: true,
  showHeroSandwichCount: true,
  showHeroOperatingInfo: true,
  orderNowButtonSize: "md",
  orderNowButtonFontSize: 15,
  isReservationEnabled: false,
  fontFamily: "jakarta",
  fontScale: "normal",
  fontScalePercent: 100,
  isLiquidGlassEnabled: true,
  ownerPasscode: "1234",
};

export const DEFAULT_WHATSAPP_CONFIG: WhatsAppTemplatesConfig = {
  ownerAlertPhone: "8274047424",
  isOwnerAlertEnabled: true,
  orderCustomerTemplate: "🥪 *NiEA'S SANDWICH BAR* \nHello {customerName}! Your order *#{orderNumber}* (Token *#{tokenNumber}*) is received! \nType: {orderType} \nItems: {items} \nTotal: ₹{grandTotal} \nEstimated prep time: {estimatedTime}. We will alert you the moment it is sizzling hot!",
  orderReadyTemplate: "🔔 *NiEA'S SANDWICH BAR* \nToken *#{tokenNumber}* is HOT & READY! \n{customerName}, please pick up your order at the counter / it is being brought to your table.",
  reservationCustomerTemplate: "✨ *NiEA'S SANDWICH BAR - Table Confirmed* \nHello {customerName}! Your table booking *{bookingRef}* for {guestCount} guests on {date} at {timeSlot} is confirmed. ₹{advanceDeposit} deposit credited to your bill.",
  ownerOrderAlertTemplate: "🚨 *NEW ORDER ALERT - NiEA'S* \nToken: *#{tokenNumber}* ({orderType}) \nCustomer: {customerName} ({customerPhone}) \nItems: {items} \nTotal: ₹{grandTotal} \nStatus: {paymentMethod} ({paymentStatus})",
  ownerReservationAlertTemplate: "📅 *NEW TABLE BOOKING ALERT* \nRef: {bookingRef} \nGuest: {customerName} ({customerPhone}) \nDate: {date} @ {timeSlot} ({guestCount} Guests) \nDeposit: ₹{advanceDeposit} ({depositStatus})",
};

export const INITIAL_POS_RECORDS: PosSalesRecord[] = [];

export const INITIAL_SEATING: SeatingStatus = {
  totalSeats: 8,
  availableSeats: 8,
  totalSandwiches: 50,
  availableSandwiches: 50,
  tablesTotal: 2,
  tablesOccupied: 0,
  estimatedWaitMinutes: 0,
  lastUpdated: "Just now",
};

export const STANDARD_EXTRAS: CustomizationOption[] = [
  { name: "Cheddar / Mozzarella (Veg)", price: 99 },
  { name: "Bacon (Non-Veg)", price: 150 },
  { name: "Ham (Non-Veg) (Choice of Pork Ham or Chicken Ham)", price: 120 },
  { name: "Olives / Pickles / Gherkins (Veg)", price: 60 },
];

export const INITIAL_MENU_ITEMS: MenuItem[] = [
  // OG NiEa's Burger & Additional Items
  {
    id: "the-top-bun",
    name: "The Top Bun",
    subtitle: "The burger your 90s crush would order",
    description:
      "The burger your 90s crush would order: grilled patty, roasted garlic mayo, caramelised onions, cream cheese, and a secret ingredient. Meat choices include chicken, pork, or mutton.",
    price: 430,
    category: "burgers",
    isVeg: false,
    tags: ["OG Burger", "Grilled Patty", "Non-Veg", "Bestseller"],
    imageUrl:
      "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=700&auto=format&fit=crop&q=80",
    stockLeft: 12,
    initialStock: 25,
    restockSchedule: "Grilled fresh to order",
    isBestseller: true,
    breadChoices: ["Grilled Chicken Patty", "Grilled Pork Patty", "Grilled Mutton Patty (+₹110)"],
    customizations: [
      { name: "Add Double Patty", price: 169 },
      { name: "Mutton Patty Upgrade", price: 110 },
      { name: "Cheddar / Mozzarella (Veg)", price: 99 },
      { name: "Bacon (Non-Veg)", price: 150 },
      { name: "Ham (Non-Veg) (Choice of Pork Ham or Chicken Ham)", price: 120 },
      { name: "Olives / Pickles / Gherkins (Veg)", price: 60 },
    ],
  },
  {
    id: "red-hot-rebel",
    name: "Red Hot Rebel",
    subtitle: "It was love at first bite",
    description:
      "It was love at first bite: featuring spiced paneer steak, caramelised onions, pickled onions, and a fiery kick.",
    price: 330,
    category: "burgers",
    isVeg: true,
    tags: ["Spiced Paneer", "Fiery Kick", "Vegetarian", "Bestseller"],
    imageUrl:
      "https://images.unsplash.com/photo-1550547660-d9450f859349?w=700&auto=format&fit=crop&q=80",
    stockLeft: 10,
    initialStock: 20,
    restockSchedule: "Grilled fresh to order",
    isBestseller: true,
    breadChoices: ["Toasted Brioche Bun", "Artisan Sesame Bun"],
    customizations: [
      { name: "Double Paneer Steak", price: 120 },
      { name: "Cheddar / Mozzarella (Veg)", price: 99 },
      { name: "Olives / Pickles / Gherkins (Veg)", price: 60 },
      { name: "Extra Caramelised & Pickled Onions", price: 40 },
    ],
  },

  // NiEa's Hot Picks
  {
    id: "cheater-parker",
    name: "Cheater Parker",
    subtitle: "Your Friendly Neighbourhood Cheat Meal",
    description:
      "Your Friendly Neighbourhood Cheat Meal: slow-roasted, tender meat piled onto sourdough with creamy house-made guacamole, punchy in-house salsa, crispy bacon, and salami. Meat choices include roasted pork, roasted chicken, or roasted mutton.",
    price: 385,
    category: "hot-picks",
    isVeg: false,
    tags: ["Hot Picks", "Guacamole & Salsa", "Sourdough", "Non-Veg", "Bestseller"],
    imageUrl:
      "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=700&auto=format&fit=crop&q=80",
    stockLeft: 8,
    initialStock: 18,
    restockSchedule: "Slow-roasted daily batches",
    isBestseller: true,
    breadChoices: ["Slow-Roasted Chicken", "Slow-Roasted Pork", "Slow-Roasted Mutton (+₹110)"],
    customizations: [
      { name: "Roasted Mutton Upgrade", price: 110 },
      { name: "Cheddar / Mozzarella (Veg)", price: 99 },
      { name: "Bacon (Non-Veg)", price: 150 },
      { name: "Ham (Non-Veg) (Choice of Pork Ham or Chicken Ham)", price: 120 },
      { name: "Olives / Pickles / Gherkins (Veg)", price: 60 },
      { name: "Extra House Guacamole", price: 60 },
    ],
  },
  {
    id: "wish-you-were-hen",
    name: "Wish You Were Hen",
    subtitle: "Come as you are. Leave with a crunch",
    description:
      "Come as you are. Leave with a crunch: made with panini bread, crispy fried chicken, hot ghost pepper sauce, gherkins, and secret mayo.",
    price: 350,
    category: "hot-picks",
    isVeg: false,
    tags: ["Hot Picks", "Ghost Pepper", "Crispy Chicken", "Panini", "Non-Veg", "Spicy"],
    imageUrl:
      "https://images.unsplash.com/photo-1603064752734-4c48eff53d05?w=700&auto=format&fit=crop&q=80",
    stockLeft: 10,
    initialStock: 22,
    restockSchedule: "Crispy fried fresh to order",
    breadChoices: ["Toasted Panini Bread", "Pressed Sourdough"],
    customizations: [
      { name: "Cheddar / Mozzarella (Veg)", price: 99 },
      { name: "Bacon (Non-Veg)", price: 150 },
      { name: "Ham (Non-Veg) (Choice of Pork Ham or Chicken Ham)", price: 120 },
      { name: "Olives / Pickles / Gherkins (Veg)", price: 60 },
      { name: "Extra Ghost Pepper Sauce", price: 30 },
      { name: "Extra Fried Chicken Cutlet", price: 120 },
    ],
  },
  {
    id: "bread-pitt",
    name: "Bread Pitt",
    subtitle: "The Hollywood classic, between bread",
    description:
      "The Hollywood classic, between bread: containing sourdough, ham, cheese, pickles, and mustard mayo. Ham choices include pork ham or chicken ham.",
    price: 330,
    category: "hot-picks",
    isVeg: false,
    tags: ["Hot Picks", "Hollywood Classic", "Ham & Cheese", "Sourdough", "Non-Veg"],
    imageUrl:
      "https://images.unsplash.com/photo-1553909489-cd47e0907980?w=700&auto=format&fit=crop&q=80",
    stockLeft: 9,
    initialStock: 20,
    restockSchedule: "Toasted fresh to order",
    breadChoices: ["Pork Ham Sourdough", "Chicken Ham Sourdough"],
    customizations: [
      { name: "Double Ham Portion", price: 120 },
      { name: "Cheddar / Mozzarella (Veg)", price: 99 },
      { name: "Bacon (Non-Veg)", price: 150 },
      { name: "Olives / Pickles / Gherkins (Veg)", price: 60 },
      { name: "Extra Mustard Mayo", price: 30 },
    ],
  },

  // The Green Room
  {
    id: "the-sailorman",
    name: "The Sailorman",
    subtitle: "Popeye always told us to eat our greens",
    description:
      "Popeye always told us to eat our greens. We just made them cheesy: featuring spinach, paneer, melted cheese, and a secret ingredient.",
    price: 330,
    category: "green-room",
    isVeg: true,
    tags: ["The Green Room", "Spinach & Paneer", "Melted Cheese", "Vegetarian", "Bestseller"],
    imageUrl:
      "https://images.unsplash.com/photo-1528736235302-52922df5c122?w=700&auto=format&fit=crop&q=80",
    stockLeft: 11,
    initialStock: 25,
    restockSchedule: "Sautéed fresh daily",
    isBestseller: true,
    breadChoices: ["Artisan Sourdough", "French Brioche", "Herb Focaccia"],
    customizations: [
      { name: "Cheddar / Mozzarella (Veg)", price: 99 },
      { name: "Olives / Pickles / Gherkins (Veg)", price: 60 },
      { name: "Extra Spiced Paneer", price: 60 },
    ],
  },

  // Sides
  {
    id: "wingdom",
    name: "Wingdom",
    subtitle: "Signature Crisp Chicken Wings",
    description:
      "Crispy, juicy, golden fried chicken wings tossed in our signature herbs and glaze.",
    price: 329,
    category: "sides",
    isVeg: false,
    tags: ["Sides", "Chicken Wings", "Crispy", "Non-Veg"],
    imageUrl:
      "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?w=700&auto=format&fit=crop&q=80",
    stockLeft: 14,
    initialStock: 25,
    restockSchedule: "Fresh fried on order",
    customizations: [
      { name: "Tossed in Ghost Pepper Sauce", price: 30 },
      { name: "Side of Garlic Mayo", price: 35 },
      { name: "Cheddar / Mozzarella Dip", price: 99 },
    ],
  },
  {
    id: "fishy-fish",
    name: "Fishy Fish",
    subtitle: "Golden Fish Bites",
    description:
      "Crispy golden fried fish bites served with house-made tartar and zesty dipping sauce.",
    price: 329,
    category: "sides",
    isVeg: false,
    tags: ["Sides", "Crispy Fish", "Seafood", "Non-Veg"],
    imageUrl:
      "https://images.unsplash.com/photo-1534422298391-e4f8c172dddb?w=700&auto=format&fit=crop&q=80",
    stockLeft: 12,
    initialStock: 20,
    restockSchedule: "Fresh fried on order",
    customizations: [
      { name: "Extra House Tartar Dip", price: 35 },
      { name: "Side of Pickled Gherkins", price: 60 },
    ],
  },

  // Drinkables
  {
    id: "water-bottle",
    name: "Packaged Mineral Water",
    subtitle: "Chilled Mineral Water",
    description: "Chilled packaged drinking mineral water bottle (500ml).",
    price: 10,
    category: "drinkables",
    isVeg: true,
    tags: ["Drinkables", "Water", "Chilled"],
    imageUrl:
      "https://images.unsplash.com/photo-1559839914-17aae19cec71?w=700&auto=format&fit=crop&q=80",
    stockLeft: 60,
    initialStock: 80,
    restockSchedule: "Chilled stock continuous",
  },
];

export const INITIAL_LOYALTY: LoyaltyProfile = {
  customerName: "Guest",
  phoneNumber: "",
  pawsPoints: 0,
  stampsCount: 0, // 0 stamps for new guest
  tier: "Kitten",
  petInteractions: 0,
  unlockedVouchers: [
    {
      id: "v-paws10",
      title: "10% Off Any Item",
      discount: 40,
      description: "Applies to all OG burgers, hot picks, and green room specials.",
      code: "PAWS10",
    },
    {
      id: "v-freewater",
      title: "Free Chilled Water Bottle",
      discount: 10,
      description: "Redeemable with any order.",
      code: "CHILLPURR",
    },
  ],
};

export const INITIAL_CAFE_HIGHLIGHT: CafeHighlight = {
  id: "highlight-top-bun",
  menuItemId: "the-top-bun",
  title: "The Top Bun",
  badge: "Featured: Most Ordered Today",
  description:
    "The burger your 90s crush would order: grilled patty, roasted garlic mayo, caramelised onions, cream cheese, and a secret ingredient.",
  price: 430,
  imageUrl:
    "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=700&auto=format&fit=crop&q=80",
  mode: "auto",
  autoSource: "today_top_orders",
  lastUpdated: "Synced with Today's Top Orders",
};

export const INITIAL_SAMPLE_ORDERS: OrderRecord[] = [];

