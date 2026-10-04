import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from "react";
import {
  MenuItem,
  OrderRecord,
  SeatingStatus,
  ReservationRecord,
  PosSalesRecord,
  CouponDiscount,
  StoreFinancialSettings,
  WebsiteContentConfig,
  WhatsAppTemplatesConfig,
  DailyIngredientEntry,
  DailyWastageEntry,
  MasterIngredientTemplate,
  LoyaltyProgramConfig,
  CafeHighlight,
  UserSession,
  OrderStepId,
  PreBookingConfig,
} from "../types/niea";
import {
  DEFAULT_WEBSITE_CONFIG,
  DEFAULT_PRE_BOOKING_CONFIG,
  DEFAULT_FINANCIAL_SETTINGS,
  DEFAULT_WHATSAPP_CONFIG,
  DEFAULT_LOYALTY_CONFIG,
  INITIAL_MENU_ITEMS,
  INITIAL_SEATING,
  INITIAL_POS_RECORDS,
  INITIAL_DAILY_INGREDIENTS,
  DEFAULT_MASTER_INGREDIENTS,
  DEFAULT_COUPONS,
  INITIAL_CAFE_HIGHLIGHT,
} from "../data/nieaData";
import { applyGlobalTypography } from "../utils/fontRegistry";
import {
  playChimeSound,
  speakAnnouncement,
  showBrowserNotification,
} from "../utils/voiceAnnouncement";
import {
  db,
  loginWithGoogle,
  logoutUser,
  subscribeToAuth,
  subscribeToSettingsDoc,
  saveSettingDoc,
  subscribeToOrders,
  saveOrderToFirestore,
  updateOrderStatusInFirestore,
  subscribeToReservations,
  saveReservationToFirestore,
  subscribeToPosRecords,
  savePosRecordToFirestore,
} from "../services/firebase";

interface FirebaseStoreContextType {
  // Authentication
  userSession: UserSession | null;
  isAuthLoading: boolean;
  signInWithGoogle: () => Promise<UserSession>;
  signOut: () => Promise<void>;
  updateUserSession: (session: UserSession | null) => void;

  // Real-time Cloud Data
  websiteConfig: WebsiteContentConfig;
  preBookingConfig: PreBookingConfig;
  financialSettings: StoreFinancialSettings;
  whatsappConfig: WhatsAppTemplatesConfig;
  loyaltyConfig: LoyaltyProgramConfig;
  seating: SeatingStatus;
  menuItems: MenuItem[];
  liveOrders: OrderRecord[];
  reservations: ReservationRecord[];
  posRecords: PosSalesRecord[];
  coupons: CouponDiscount[];
  dailyIngredients: DailyIngredientEntry[];
  dailyWastage: DailyWastageEntry[];
  masterIngredients: MasterIngredientTemplate[];
  cafeHighlight: CafeHighlight;
  isFloatingCatEnabled: boolean;
  isCloudSynced: boolean;

  // Real-time Updaters
  updateWebsiteConfig: (config: React.SetStateAction<WebsiteContentConfig>) => void;
  updatePreBookingConfig: (config: React.SetStateAction<PreBookingConfig>) => void;
  updateFinancialSettings: (settings: React.SetStateAction<StoreFinancialSettings>) => void;
  updateWhatsappConfig: (config: React.SetStateAction<WhatsAppTemplatesConfig>) => void;
  updateLoyaltyConfig: (config: React.SetStateAction<LoyaltyProgramConfig>) => void;
  updateSeating: (seating: React.SetStateAction<SeatingStatus>) => void;
  updateMenuItems: (items: React.SetStateAction<MenuItem[]>) => void;
  updateCoupons: (coupons: React.SetStateAction<CouponDiscount[]>) => void;
  updateDailyIngredients: (ingredients: React.SetStateAction<DailyIngredientEntry[]>) => void;
  updateDailyWastage: (wastage: React.SetStateAction<DailyWastageEntry[]>) => void;
  updateMasterIngredients: (master: React.SetStateAction<MasterIngredientTemplate[]>) => void;
  updateCafeHighlight: (highlight: React.SetStateAction<CafeHighlight>) => void;
  updateFloatingCatEnabled: (enabled: React.SetStateAction<boolean>) => void;

  // Order Operations
  placeOrder: (order: OrderRecord) => Promise<void>;
  updateOrderStatus: (orderId: string, newStatus: "received" | "toasting" | "ready" | "served" | "cancelled", customNote?: string) => Promise<void>;
  updateOrderStep: (orderId: string, stepId: OrderStepId | null, note?: string) => Promise<void>;
  updateOrderTimeLeft: (orderId: string, minutesLeft: number, note?: string) => Promise<void>;
  markKotPrinted: (orderId: string) => Promise<void>;
  sendOrderNotification: (orderId: string, title: string, message: string) => Promise<void>;
  callCustomerOrder: (params?: {
    orderId?: string;
    orderNumber?: string;
    tokenNumber?: string;
    customerName?: string;
    customerPhone?: string;
    targetUserId?: string;
    targetPhone?: string;
    message?: string;
  }) => Promise<void>;
  broadcastTakeawayAnnouncement: (params?: {
    orderId?: string;
    orderNumber?: string;
    tokenNumber?: string;
    customerName?: string;
    customerPhone?: string;
    targetUserId?: string;
    targetPhone?: string;
    message?: string;
  }) => Promise<void>;

  // Reservations & POS Operations
  addReservation: (reservation: ReservationRecord) => Promise<void>;
  updateReservationStatus: (id: string, status: "confirmed" | "seated" | "cancelled" | "no-show") => Promise<void>;
  deleteReservation: (id: string) => Promise<void>;
  addPosRecord: (record: PosSalesRecord) => Promise<void>;
  resetToDefaults: () => Promise<void>;
}

const FirebaseStoreContext = createContext<FirebaseStoreContextType | null>(null);

export const FirebaseStoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Auth state initialized from local cache so reload preserves logged-in state
  const [userSession, setUserSession] = useState<UserSession | null>(() => {
    try {
      const s = localStorage.getItem("niea_user_session");
      return s ? JSON.parse(s) : null;
    } catch {
      return null;
    }
  });
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [isCloudSynced, setIsCloudSynced] = useState<boolean>(false);

  const updateUserSession = useCallback((session: UserSession | null) => {
    setUserSession(session);
    if (session) {
      localStorage.setItem("niea_user_session", JSON.stringify(session));
      if (session.phoneNumber) {
        localStorage.setItem("niea_customer_phone", session.phoneNumber);
      }
      if (session.name) {
        localStorage.setItem("niea_customer_name", session.name);
      }
      if ((session as any).uid) {
        localStorage.setItem("niea_customer_uid", (session as any).uid);
      }
    } else {
      localStorage.removeItem("niea_user_session");
    }
  }, []);

  // Business State
  const [websiteConfig, setWebsiteConfig] = useState<WebsiteContentConfig>(() => {
    try {
      const s = localStorage.getItem("niea_website_config_v2");
      return s ? JSON.parse(s) : DEFAULT_WEBSITE_CONFIG;
    } catch {
      return DEFAULT_WEBSITE_CONFIG;
    }
  });

  const [preBookingConfig, setPreBookingConfig] = useState<PreBookingConfig>(() => {
    try {
      const s = localStorage.getItem("niea_prebooking_config_v4");
      return s ? JSON.parse(s) : DEFAULT_PRE_BOOKING_CONFIG;
    } catch {
      return DEFAULT_PRE_BOOKING_CONFIG;
    }
  });

  const [financialSettings, setFinancialSettings] = useState<StoreFinancialSettings>(() => {
    try {
      const s = localStorage.getItem("niea_financial_settings_v2");
      return s ? JSON.parse(s) : DEFAULT_FINANCIAL_SETTINGS;
    } catch {
      return DEFAULT_FINANCIAL_SETTINGS;
    }
  });

  const [whatsappConfig, setWhatsappConfig] = useState<WhatsAppTemplatesConfig>(() => {
    try {
      const s = localStorage.getItem("niea_whatsapp_config_v2");
      return s ? JSON.parse(s) : DEFAULT_WHATSAPP_CONFIG;
    } catch {
      return DEFAULT_WHATSAPP_CONFIG;
    }
  });

  const [loyaltyConfig, setLoyaltyConfig] = useState<LoyaltyProgramConfig>(() => {
    try {
      const s = localStorage.getItem("niea_loyalty_config");
      return s ? JSON.parse(s) : DEFAULT_LOYALTY_CONFIG;
    } catch {
      return DEFAULT_LOYALTY_CONFIG;
    }
  });

  const [seating, setSeating] = useState<SeatingStatus>(() => {
    try {
      const s = localStorage.getItem("niea_seating");
      return s ? JSON.parse(s) : INITIAL_SEATING;
    } catch {
      return INITIAL_SEATING;
    }
  });

  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => {
    try {
      const s = localStorage.getItem("niea_menu_items_v4");
      if (s) {
        const parsed = JSON.parse(s);
        if (Array.isArray(parsed) && parsed.some((p: any) => p.id === "the-top-bun")) {
          return parsed;
        }
      }
      localStorage.setItem("niea_menu_items_v4", JSON.stringify(INITIAL_MENU_ITEMS));
      return INITIAL_MENU_ITEMS;
    } catch {
      return INITIAL_MENU_ITEMS;
    }
  });

  const [liveOrders, setLiveOrders] = useState<OrderRecord[]>(() => {
    try {
      const s = localStorage.getItem("niea_orders");
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });

  const [reservations, setReservations] = useState<ReservationRecord[]>(() => {
    try {
      const s = localStorage.getItem("niea_reservations");
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });

  const [posRecords, setPosRecords] = useState<PosSalesRecord[]>(() => {
    try {
      const s = localStorage.getItem("niea_pos_records");
      return s ? JSON.parse(s) : INITIAL_POS_RECORDS;
    } catch {
      return INITIAL_POS_RECORDS;
    }
  });

  const [coupons, setCoupons] = useState<CouponDiscount[]>(() => {
    try {
      const s = localStorage.getItem("niea_coupons_v2");
      return s ? JSON.parse(s) : DEFAULT_COUPONS;
    } catch {
      return DEFAULT_COUPONS;
    }
  });

  const [dailyIngredients, setDailyIngredients] = useState<DailyIngredientEntry[]>(() => {
    try {
      const s = localStorage.getItem("niea_daily_ingredients");
      return s ? JSON.parse(s) : INITIAL_DAILY_INGREDIENTS;
    } catch {
      return INITIAL_DAILY_INGREDIENTS;
    }
  });

  const [dailyWastage, setDailyWastage] = useState<DailyWastageEntry[]>(() => {
    try {
      const s = localStorage.getItem("niea_daily_wastage");
      return s ? JSON.parse(s) : [];
    } catch {
      return [];
    }
  });

  const [masterIngredients, setMasterIngredients] = useState<MasterIngredientTemplate[]>(() => {
    try {
      const s = localStorage.getItem("niea_master_ingredients");
      return s ? JSON.parse(s) : DEFAULT_MASTER_INGREDIENTS;
    } catch {
      return DEFAULT_MASTER_INGREDIENTS;
    }
  });

  const [cafeHighlight, setCafeHighlight] = useState<CafeHighlight>(() => {
    try {
      const s = localStorage.getItem("niea_cafe_highlight");
      return s ? JSON.parse(s) : INITIAL_CAFE_HIGHLIGHT;
    } catch {
      return INITIAL_CAFE_HIGHLIGHT;
    }
  });

  const [isFloatingCatEnabled, setIsFloatingCatEnabled] = useState<boolean>(() => {
    try {
      const s = localStorage.getItem("niea_floating_cat_enabled");
      return s !== null ? JSON.parse(s) : true;
    } catch {
      return true;
    }
  });

  // 1. Subscribe to Firebase Authentication
  useEffect(() => {
    const unsubAuth = subscribeToAuth((session) => {
      setUserSession(session);
      setIsAuthLoading(false);
      if (session) {
        localStorage.setItem("niea_user_session", JSON.stringify(session));
      } else {
        localStorage.removeItem("niea_user_session");
      }
    });
    return () => unsubAuth();
  }, []);

  // Initialize and apply persistent font and UI theme preferences
  useEffect(() => {
    if (typeof window !== "undefined") {
      const family = localStorage.getItem("niea_font_family") || "jakarta";
      const scale = localStorage.getItem("niea_font_scale") || "normal";
      document.documentElement.setAttribute("data-font-family", family);
      document.documentElement.setAttribute("data-font-scale", scale);

      const savedLiquid = localStorage.getItem("niea_liquid_glass_enabled");
      const isLiquid = savedLiquid !== null ? savedLiquid === "true" : true;
      document.documentElement.setAttribute("data-liquid-glass", isLiquid ? "true" : "false");
    }
  }, []);

  const lastServerVersionRef = useRef<number>(0);
  const lastTakeawayAnnouncementIdRef = useRef<string>("");
  const knownOrderIdsRef = useRef<Set<string>>(new Set());

  // Apply consolidated server state
  const applyServerState = useCallback((data: any) => {
    if (!data || !data.success || !data.state) return;
    const s = data.state;
    if (data.version) {
      lastServerVersionRef.current = Math.max(lastServerVersionRef.current, data.version);
    }

    // 0. Targeted Customer Call & Voice Announcement Event Processing
    const callData = s.activeOrderCall || s.orderAnnouncement || s.takeawayAnnouncement;
    if (callData && callData.id) {
      if (
        callData.id !== lastTakeawayAnnouncementIdRef.current &&
        Date.now() - (callData.timestamp || 0) < 60000
      ) {
        lastTakeawayAnnouncementIdRef.current = callData.id;

        // TARGET VALIDATION: Check if THIS device/browser owns or placed this specific order!
        let isThisDeviceTarget = false;
        if (typeof window !== "undefined") {
          try {
            const myOrderIds: string[] = JSON.parse(localStorage.getItem("niea_my_order_ids") || "[]");
            const mySavedPhone = (localStorage.getItem("niea_customer_phone") || "").replace(/\D/g, "").slice(-10);
            const userPhoneClean = (userSession?.phoneNumber || "").replace(/\D/g, "").slice(-10);
            const userUid = (userSession as any)?.uid;
            const userEmail = userSession?.email?.toLowerCase();

            // 1. Matches Order ID, Order Number, or Token Number stored in this browser
            if (
              (callData.orderId && myOrderIds.includes(callData.orderId)) ||
              (callData.orderNumber && myOrderIds.includes(callData.orderNumber)) ||
              (callData.tokenNumber && myOrderIds.includes(callData.tokenNumber))
            ) {
              isThisDeviceTarget = true;
            }

            // 2. Matches customer phone number
            const targetPhoneClean = (callData.customerPhone || callData.targetPhone || "").replace(/\D/g, "").slice(-10);
            if (
              targetPhoneClean &&
              (targetPhoneClean === mySavedPhone || (userPhoneClean && targetPhoneClean === userPhoneClean))
            ) {
              isThisDeviceTarget = true;
            }

            // 3. Matches user UID or Email
            if (callData.targetUserId && userUid && callData.targetUserId === userUid) {
              isThisDeviceTarget = true;
            }
            if (callData.customerEmail && userEmail && callData.customerEmail.toLowerCase() === userEmail) {
              isThisDeviceTarget = true;
            }
          } catch {}
        }

        // STRICT TARGETING: Only user one gets the announcement. User two will NOT get that announcement!
        if (isThisDeviceTarget) {
          const tok = callData.tokenNumber || callData.orderNumber;
          const name = callData.customerName || "";
          const msg = callData.message || (tok ? `Token #${tok}: Your fresh order is ready for pickup!` : "Your order is ready for pickup!");
          const voiceText =
            callData.voiceText ||
            (tok
              ? `Attention ${name ? `${name}, ` : ""}Token number ${tok}, your fresh order is ready for pickup at the counter!`
              : `Attention please: Your fresh order is ready for pickup at the counter!`);

          playChimeSound("takeaway");
          setTimeout(() => {
            speakAnnouncement(voiceText);
          }, 450);

          showBrowserNotification(`🔔 Your Order is Ready! Token #${tok}`, msg);
          window.dispatchEvent(
            new CustomEvent("niea_takeaway_announcement", {
              detail: { ...callData, voiceText, isTarget: true },
            })
          );
        }
      }
    }

    if (s.websiteConfig) {
      setWebsiteConfig((prev) => ({ ...prev, ...s.websiteConfig }));
      localStorage.setItem("niea_website_config_v2", JSON.stringify(s.websiteConfig));
      const font = s.websiteConfig.fontFamily || "jakarta";
      const scalePct = s.websiteConfig.fontScalePercent || 100;
      applyGlobalTypography(font, scalePct, s.websiteConfig.heroTitleFontFamily, s.websiteConfig.heroTitleFontSize);
      if (typeof window !== "undefined") {
        const isLiquid = s.websiteConfig.isLiquidGlassEnabled !== false;
        document.documentElement.setAttribute("data-liquid-glass", isLiquid ? "true" : "false");
        localStorage.setItem("niea_liquid_glass_enabled", isLiquid ? "true" : "false");
      }
    }
    if (s.preBookingConfig) {
      setPreBookingConfig((prev) => ({ ...prev, ...s.preBookingConfig }));
      localStorage.setItem("niea_prebooking_config_v4", JSON.stringify(s.preBookingConfig));
    }
    if (s.financialSettings) {
      setFinancialSettings((prev) => ({ ...prev, ...s.financialSettings }));
      localStorage.setItem("niea_financial_settings_v2", JSON.stringify(s.financialSettings));
    }
    if (s.whatsappConfig) {
      setWhatsappConfig((prev) => ({ ...prev, ...s.whatsappConfig }));
      localStorage.setItem("niea_whatsapp_config_v2", JSON.stringify(s.whatsappConfig));
    }
    if (s.loyaltyConfig) {
      setLoyaltyConfig((prev) => ({ ...prev, ...s.loyaltyConfig }));
      localStorage.setItem("niea_loyalty_config", JSON.stringify(s.loyaltyConfig));
    }
    if (s.seating) {
      setSeating((prev) => ({ ...prev, ...s.seating }));
      localStorage.setItem("niea_seating", JSON.stringify(s.seating));
    }
    if (Array.isArray(s.menuItems) && s.menuItems.length > 0) {
      if (s.menuItems.some((p: any) => p.id === "the-top-bun")) {
        setMenuItems(s.menuItems);
        localStorage.setItem("niea_menu_items_v4", JSON.stringify(s.menuItems));
      } else {
        setMenuItems(INITIAL_MENU_ITEMS);
        localStorage.setItem("niea_menu_items_v4", JSON.stringify(INITIAL_MENU_ITEMS));
      }
    }
    if (Array.isArray(s.coupons) && s.coupons.length > 0) {
      setCoupons(s.coupons);
      localStorage.setItem("niea_coupons_v2", JSON.stringify(s.coupons));
    }
    if (Array.isArray(s.dailyIngredients)) {
      setDailyIngredients(s.dailyIngredients);
      localStorage.setItem("niea_daily_ingredients", JSON.stringify(s.dailyIngredients));
    }
    if (Array.isArray(s.dailyWastage)) {
      setDailyWastage(s.dailyWastage);
      localStorage.setItem("niea_daily_wastage", JSON.stringify(s.dailyWastage));
    }
    if (Array.isArray(s.masterIngredients) && s.masterIngredients.length > 0) {
      setMasterIngredients(s.masterIngredients);
      localStorage.setItem("niea_master_ingredients", JSON.stringify(s.masterIngredients));
    }
    if (s.cafeHighlight) {
      setCafeHighlight(s.cafeHighlight);
      localStorage.setItem("niea_cafe_highlight", JSON.stringify(s.cafeHighlight));
    }
    if (typeof s.isFloatingCatEnabled === "boolean") {
      setIsFloatingCatEnabled(s.isFloatingCatEnabled);
      localStorage.setItem("niea_floating_cat_enabled", JSON.stringify(s.isFloatingCatEnabled));
    }
    if (Array.isArray(s.liveOrders) && s.liveOrders.length > 0) {
      // Check for newly arrived orders to notify owner if unlocked with password
      const isOwnerUnlocked =
        typeof window !== "undefined" &&
        (sessionStorage.getItem("niea_portal_unlocked") === "true" ||
          localStorage.getItem("niea_portal_unlocked") === "true");

      if (knownOrderIdsRef.current.size > 0 && isOwnerUnlocked) {
        for (const o of s.liveOrders) {
          const key = o.id || o.orderNumber;
          if (key && !knownOrderIdsRef.current.has(key)) {
            const ageMs = Date.now() - new Date(o.createdAt || 0).getTime();
            if (o.status === "received" && ageMs < 300000) {
              // Sound alert
              playChimeSound("new_order");
              // Voice alert if enabled
              const isVoiceAlertEnabled = localStorage.getItem("niea_owner_voice_alerts_enabled") !== "false";
              if (isVoiceAlertEnabled) {
                setTimeout(() => {
                  speakAnnouncement(
                    `New order received! Token number ${o.tokenNumber || o.orderNumber}, ${
                      o.orderType === "takeaway" ? "takeaway order" : "dine-in order"
                    }.`
                  );
                }, 400);
              }
              // Push notification
              showBrowserNotification(
                "🔔 New Order Received!",
                `Token #${o.tokenNumber || o.orderNumber}: ${o.customerName || "Customer"} placed a ${
                  o.orderType === "takeaway" ? "Takeaway (needs packing)" : "Dine-in"
                } order!`
              );
              window.dispatchEvent(new CustomEvent("niea_owner_new_order", { detail: o }));
            }
          }
        }
      }

      for (const o of s.liveOrders) {
        const key = o.id || o.orderNumber;
        if (key) knownOrderIdsRef.current.add(key);
      }

      setLiveOrders((prev) => {
        const map = new Map<string, OrderRecord>();
        for (const o of prev) {
          const key = o.id || o.orderNumber;
          if (key) map.set(key, o);
        }
        for (const o of s.liveOrders) {
          const key = o.id || o.orderNumber;
          if (key) {
            const existing = map.get(key);
            if (!existing) {
              map.set(key, o);
            } else {
              const existingTime = new Date((existing as any).updatedAt || existing.createdAt || 0).getTime();
              const serverTime = new Date((o as any).updatedAt || o.createdAt || 0).getTime();
              if (serverTime >= existingTime) {
                map.set(key, { ...existing, ...o });
              }
            }
          }
        }
        const merged = Array.from(map.values()).sort((a, b) => {
          const tA = new Date(a.createdAt || 0).getTime();
          const tB = new Date(b.createdAt || 0).getTime();
          return tB - tA;
        });
        localStorage.setItem("niea_orders", JSON.stringify(merged));
        window.dispatchEvent(new CustomEvent("niea_orders_updated", { detail: merged }));
        return merged;
      });
    }
    if (Array.isArray(s.reservations)) {
      setReservations(s.reservations);
      localStorage.setItem("niea_reservations", JSON.stringify(s.reservations));
    }
    if (Array.isArray(s.posRecords) && s.posRecords.length > 0) {
      setPosRecords((prev) => {
        const map = new Map<string, PosSalesRecord>();
        for (const p of prev) {
          if (p && p.id) map.set(p.id, p);
        }
        for (const p of s.posRecords) {
          if (p && p.id) {
            const existing = map.get(p.id);
            if (!existing) {
              map.set(p.id, p);
            } else {
              map.set(p.id, {
                ...existing,
                ...p,
                cashSales: Math.max(existing.cashSales || 0, p.cashSales || 0),
                upiSales: Math.max(existing.upiSales || 0, p.upiSales || 0),
                totalOrders: Math.max(existing.totalOrders || 0, p.totalOrders || 0),
              });
            }
          }
        }
        const merged = Array.from(map.values()).sort((a, b) => (b.date || "").localeCompare(a.date || ""));
        localStorage.setItem("niea_pos_records", JSON.stringify(merged));
        return merged;
      });
    }
  }, []);

  // 2. Initial Bootstrap & Redundant Heartbeat Sync
  useEffect(() => {
    // Immediate initial sync from server store
    fetch("/api/sync/state")
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data && data.success) {
          applyServerState(data);
        }
      })
      .catch(() => {});

    // Periodic heartbeat to guarantee zero out-of-sync states across multiple laptops/screens
    const interval = setInterval(() => {
      fetch("/api/sync/state")
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && data.success) {
            applyServerState(data);
          }
        })
        .catch(() => {});
    }, 2500);

    return () => clearInterval(interval);
  }, [applyServerState]);

  // 3. Real-Time Cloud Listeners with Firestore WebSockets
  useEffect(() => {
    setIsCloudSynced(true);

    const unsubWebsite = subscribeToSettingsDoc<WebsiteContentConfig>("websiteConfig", (data) => {
      if (data) {
        setWebsiteConfig((prev) => ({ ...prev, ...data }));
        localStorage.setItem("niea_website_config_v2", JSON.stringify(data));
        const font = data.fontFamily || "jakarta";
        const scalePct = data.fontScalePercent || 100;
        applyGlobalTypography(font, scalePct, data.heroTitleFontFamily, data.heroTitleFontSize);
      }
    }, DEFAULT_WEBSITE_CONFIG);

    const unsubPreBooking = subscribeToSettingsDoc<PreBookingConfig>("preBookingConfig", (data) => {
      if (data) {
        setPreBookingConfig((prev) => ({ ...prev, ...data }));
        localStorage.setItem("niea_prebooking_config_v4", JSON.stringify(data));
      }
    }, DEFAULT_PRE_BOOKING_CONFIG);

    const unsubFinancial = subscribeToSettingsDoc<StoreFinancialSettings>("financialSettings", (data) => {
      if (data) {
        setFinancialSettings((prev) => ({ ...prev, ...data }));
        localStorage.setItem("niea_financial_settings_v2", JSON.stringify(data));
      }
    }, DEFAULT_FINANCIAL_SETTINGS);

    const unsubWhatsapp = subscribeToSettingsDoc<WhatsAppTemplatesConfig>("whatsappConfig", (data) => {
      if (data) {
        setWhatsappConfig((prev) => ({ ...prev, ...data }));
        localStorage.setItem("niea_whatsapp_config_v2", JSON.stringify(data));
      }
    }, DEFAULT_WHATSAPP_CONFIG);

    const unsubLoyalty = subscribeToSettingsDoc<LoyaltyProgramConfig>("loyaltyConfig", (data) => {
      if (data) {
        setLoyaltyConfig((prev) => ({ ...prev, ...data }));
        localStorage.setItem("niea_loyalty_config", JSON.stringify(data));
      }
    }, DEFAULT_LOYALTY_CONFIG);

    const unsubSeating = subscribeToSettingsDoc<SeatingStatus>("seating", (data) => {
      if (data) {
        setSeating((prev) => ({ ...prev, ...data }));
        localStorage.setItem("niea_seating", JSON.stringify(data));
      }
    }, INITIAL_SEATING);

    const unsubMenu = subscribeToSettingsDoc<{ items: MenuItem[] }>("menuItems", (data) => {
      if (data?.items && Array.isArray(data.items) && data.items.length > 0) {
        if (data.items.some((p: any) => p.id === "the-top-bun")) {
          setMenuItems(data.items);
          localStorage.setItem("niea_menu_items_v4", JSON.stringify(data.items));
        } else {
          setMenuItems(INITIAL_MENU_ITEMS);
          localStorage.setItem("niea_menu_items_v4", JSON.stringify(INITIAL_MENU_ITEMS));
        }
      }
    }, { items: INITIAL_MENU_ITEMS });

    const unsubCoupons = subscribeToSettingsDoc<{ list: CouponDiscount[] }>("coupons", (data) => {
      if (data?.list && Array.isArray(data.list) && data.list.length > 0) {
        setCoupons(data.list);
        localStorage.setItem("niea_coupons_v2", JSON.stringify(data.list));
      }
    }, { list: DEFAULT_COUPONS });

    const unsubDailyIng = subscribeToSettingsDoc<{ list: DailyIngredientEntry[] }>("dailyIngredients", (data) => {
      if (data?.list && Array.isArray(data.list)) {
        setDailyIngredients(data.list);
        localStorage.setItem("niea_daily_ingredients", JSON.stringify(data.list));
      }
    }, { list: INITIAL_DAILY_INGREDIENTS });

    const unsubDailyWastage = subscribeToSettingsDoc<{ list: DailyWastageEntry[] }>("dailyWastage", (data) => {
      if (data?.list && Array.isArray(data.list)) {
        setDailyWastage(data.list);
        localStorage.setItem("niea_daily_wastage", JSON.stringify(data.list));
      }
    }, { list: [] });

    const unsubMasterIng = subscribeToSettingsDoc<{ list: MasterIngredientTemplate[] }>("masterIngredients", (data) => {
      if (data?.list && Array.isArray(data.list) && data.list.length > 0) {
        setMasterIngredients(data.list);
        localStorage.setItem("niea_master_ingredients", JSON.stringify(data.list));
      }
    }, { list: DEFAULT_MASTER_INGREDIENTS });

    const unsubHighlight = subscribeToSettingsDoc<CafeHighlight>("cafeHighlight", (data) => {
      if (data) {
        setCafeHighlight(data);
        localStorage.setItem("niea_cafe_highlight", JSON.stringify(data));
      }
    }, INITIAL_CAFE_HIGHLIGHT);

    const unsubCat = subscribeToSettingsDoc<{ enabled: boolean }>("floatingCat", (data) => {
      if (data && typeof data.enabled === "boolean") {
        setIsFloatingCatEnabled(data.enabled);
        localStorage.setItem("niea_floating_cat_enabled", JSON.stringify(data.enabled));
      }
    }, { enabled: true });

    // Real-time collections
    const unsubOrders = subscribeToOrders((orders) => {
      if (Array.isArray(orders)) {
        setLiveOrders((prev) => {
          const map = new Map<string, OrderRecord>();
          for (const o of prev) {
            const key = o.id || o.orderNumber;
            if (key) map.set(key, o);
          }
          for (const o of orders) {
            const key = o.id || o.orderNumber;
            if (key) {
              const existing = map.get(key);
              if (!existing) {
                map.set(key, o);
              } else {
                const existingTime = new Date((existing as any).updatedAt || existing.createdAt || 0).getTime();
                const cloudTime = new Date((o as any).updatedAt || o.createdAt || 0).getTime();
                if (cloudTime >= existingTime) {
                  map.set(key, { ...existing, ...o });
                }
              }
            }
          }
          const merged = Array.from(map.values()).sort((a, b) => {
            const tA = new Date(a.createdAt || 0).getTime();
            const tB = new Date(b.createdAt || 0).getTime();
            return tB - tA;
          });
          localStorage.setItem("niea_orders", JSON.stringify(merged));
          window.dispatchEvent(new CustomEvent("niea_orders_updated", { detail: merged }));
          return merged;
        });
      }
    });

    const unsubReservations = subscribeToReservations((resList) => {
      if (Array.isArray(resList)) {
        setReservations(resList);
        localStorage.setItem("niea_reservations", JSON.stringify(resList));
      }
    });

    const unsubPos = subscribeToPosRecords((posList) => {
      if (Array.isArray(posList)) {
        setPosRecords(posList);
        localStorage.setItem("niea_pos_records", JSON.stringify(posList));
      }
    });

    return () => {
      unsubWebsite();
      unsubPreBooking();
      unsubFinancial();
      unsubWhatsapp();
      unsubLoyalty();
      unsubSeating();
      unsubMenu();
      unsubCoupons();
      unsubDailyIng();
      unsubDailyWastage();
      unsubMasterIng();
      unsubHighlight();
      unsubCat();
      unsubOrders();
      unsubReservations();
      unsubPos();
    };
  }, []);

  // Centralized Mutators with Instant Optimistic UI + Real-time Cloud Push
  const updateWebsiteConfig = useCallback((configAction: React.SetStateAction<WebsiteContentConfig>) => {
    setWebsiteConfig((prev) => {
      const next = typeof configAction === "function" ? configAction(prev) : configAction;
      saveSettingDoc("websiteConfig", next);
      localStorage.setItem("niea_website_config_v2", JSON.stringify(next));
      if (typeof window !== "undefined") {
        const isLiquid = next.isLiquidGlassEnabled !== false;
        document.documentElement.setAttribute("data-liquid-glass", isLiquid ? "true" : "false");
        localStorage.setItem("niea_liquid_glass_enabled", isLiquid ? "true" : "false");
      }
      fetch("/api/sync/website-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      }).catch(() => {});
      return next;
    });
  }, []);

  const updatePreBookingConfig = useCallback((configAction: React.SetStateAction<PreBookingConfig>) => {
    setPreBookingConfig((prev) => {
      const next = typeof configAction === "function" ? configAction(prev) : configAction;
      saveSettingDoc("preBookingConfig", next);
      fetch("/api/sync/prebooking-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      }).catch(() => {});
      return next;
    });
  }, []);

  const updateFinancialSettings = useCallback((action: React.SetStateAction<StoreFinancialSettings>) => {
    setFinancialSettings((prev) => {
      const next = typeof action === "function" ? action(prev) : action;
      saveSettingDoc("financialSettings", next);
      fetch("/api/sync/financial-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      }).catch(() => {});
      return next;
    });
  }, []);

  const updateWhatsappConfig = useCallback((action: React.SetStateAction<WhatsAppTemplatesConfig>) => {
    setWhatsappConfig((prev) => {
      const next = typeof action === "function" ? action(prev) : action;
      saveSettingDoc("whatsappConfig", next);
      fetch("/api/sync/whatsapp-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      }).catch(() => {});
      return next;
    });
  }, []);

  const updateLoyaltyConfig = useCallback((action: React.SetStateAction<LoyaltyProgramConfig>) => {
    setLoyaltyConfig((prev) => {
      const next = typeof action === "function" ? action(prev) : action;
      saveSettingDoc("loyaltyConfig", next);
      fetch("/api/sync/loyalty-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      }).catch(() => {});
      return next;
    });
  }, []);

  const updateSeating = useCallback((action: React.SetStateAction<SeatingStatus>) => {
    setSeating((prev) => {
      const next = typeof action === "function" ? action(prev) : action;
      saveSettingDoc("seating", next);
      fetch("/api/sync/seating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      }).catch(() => {});
      return next;
    });
  }, []);

  const updateMenuItems = useCallback((action: React.SetStateAction<MenuItem[]>) => {
    setMenuItems((prev) => {
      const next = typeof action === "function" ? action(prev) : action;
      saveSettingDoc("menuItems", { items: next });
      fetch("/api/sync/menu-items", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      }).catch(() => {});
      return next;
    });
  }, []);

  const updateCoupons = useCallback((action: React.SetStateAction<CouponDiscount[]>) => {
    setCoupons((prev) => {
      const next = typeof action === "function" ? action(prev) : action;
      saveSettingDoc("coupons", { list: next });
      fetch("/api/sync/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      }).catch(() => {});
      return next;
    });
  }, []);

  const updateDailyIngredients = useCallback((action: React.SetStateAction<DailyIngredientEntry[]>) => {
    setDailyIngredients((prev) => {
      const next = typeof action === "function" ? action(prev) : action;
      saveSettingDoc("dailyIngredients", { list: next });
      fetch("/api/sync/daily-ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      }).catch(() => {});
      return next;
    });
  }, []);

  const updateDailyWastage = useCallback((action: React.SetStateAction<DailyWastageEntry[]>) => {
    setDailyWastage((prev) => {
      const next = typeof action === "function" ? action(prev) : action;
      saveSettingDoc("dailyWastage", { list: next });
      fetch("/api/sync/daily-wastage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      }).catch(() => {});
      return next;
    });
  }, []);

  const updateMasterIngredients = useCallback((action: React.SetStateAction<MasterIngredientTemplate[]>) => {
    setMasterIngredients((prev) => {
      const next = typeof action === "function" ? action(prev) : action;
      saveSettingDoc("masterIngredients", { list: next });
      fetch("/api/sync/master-ingredients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      }).catch(() => {});
      return next;
    });
  }, []);

  const updateCafeHighlight = useCallback((action: React.SetStateAction<CafeHighlight>) => {
    setCafeHighlight((prev) => {
      const next = typeof action === "function" ? action(prev) : action;
      saveSettingDoc("cafeHighlight", next);
      fetch("/api/sync/cafe-highlight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(next),
      }).catch(() => {});
      return next;
    });
  }, []);

  const updateFloatingCatEnabled = useCallback((action: React.SetStateAction<boolean>) => {
    setIsFloatingCatEnabled((prev) => {
      const next = typeof action === "function" ? action(prev) : action;
      saveSettingDoc("floatingCat", { enabled: next });
      fetch("/api/sync/floating-cat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: next }),
      }).catch(() => {});
      return next;
    });
  }, []);

  // Order Operations
  const placeOrder = useCallback(async (order: OrderRecord) => {
    setLiveOrders((prev) => {
      const exists = prev.some((o) => o.id === order.id || o.orderNumber === order.orderNumber);
      const next = exists ? prev.map((o) => (o.id === order.id ? order : o)) : [order, ...prev];
      localStorage.setItem("niea_orders", JSON.stringify(next));
      window.dispatchEvent(new CustomEvent("niea_orders_updated", { detail: next }));
      return next;
    });

    await saveOrderToFirestore(order);

    // Notify owner if portal is unlocked in this browser
    try {
      const isOwnerUnlocked =
        typeof window !== "undefined" &&
        (sessionStorage.getItem("niea_portal_unlocked") === "true" ||
          localStorage.getItem("niea_portal_unlocked") === "true");

      if (isOwnerUnlocked) {
        playChimeSound("new_order");
        const isVoiceAlertEnabled = localStorage.getItem("niea_owner_voice_alerts_enabled") !== "false";
        if (isVoiceAlertEnabled) {
          setTimeout(() => {
            speakAnnouncement(
              `New order received! Token number ${order.tokenNumber || order.orderNumber}, ${
                order.orderType === "takeaway" ? "takeaway order" : "dine-in order"
              }.`
            );
          }, 400);
        }
        showBrowserNotification(
          "🔔 New Order Received!",
          `Token #${order.tokenNumber || order.orderNumber}: ${order.customerName || "Customer"} placed a ${
            order.orderType === "takeaway" ? "Takeaway (needs packing)" : "Dine-in"
          } order!`
        );
        window.dispatchEvent(new CustomEvent("niea_owner_new_order", { detail: order }));
      }
    } catch {
      // ignore
    }

    // Sync menu item stocks
    setMenuItems((prev) => {
      const updated = prev.map((item) => {
        const unitsOrdered = order.items
          .filter((ci) => ci.item.id === item.id)
          .reduce((sum, ci) => sum + (Number(ci.quantity) || 1), 0);
        if (unitsOrdered > 0) {
          return { ...item, stockLeft: Math.max(0, item.stockLeft - unitsOrdered) };
        }
        return item;
      });
      saveSettingDoc("menuItems", { items: updated });
      return updated;
    });

    // Sync sandwiches count
    const sandwichesSold = order.items.reduce((sum, ci) => {
      const isSandwich =
        ci.item.category === "burgers" ||
        ci.item.category === "hot-picks" ||
        ci.item.category === "green-room" ||
        ci.item.category === "sandwiches" ||
        ci.item.category === "toasties" ||
        ci.item.category === "seasonal";
      return sum + (ci.quantity || 1);
    }, 0);

    if (sandwichesSold > 0) {
      setSeating((prev) => {
        const next = { ...prev, availableSandwiches: Math.max(0, (prev.availableSandwiches ?? 38) - sandwichesSold) };
        saveSettingDoc("seating", next);
        return next;
      });
    }

    try {
      const res = await fetch("/api/sync/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });
      if (res.ok) {
        const data = await res.json();
        if (data && data.success && Array.isArray(data.liveOrders)) {
          setLiveOrders(data.liveOrders);
          localStorage.setItem("niea_orders", JSON.stringify(data.liveOrders));
        }
      }
    } catch (e) {
      console.warn("Failed to sync order to server:", e);
    }
  }, []);

  const updateOrderStatus = useCallback(
    async (
      orderId: string,
      newStatus: "received" | "toasting" | "ready" | "served" | "cancelled",
      customNote?: string
    ) => {
      const nowStr = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
      const statusTitles: Record<string, string> = {
        received: "Order Received by Kitchen",
        toasting: "Artisan Toasting & Grilling",
        ready: "Hot & Ready",
        served: "Served & Completed",
        cancelled: "Order Cancelled",
      };
      const defaultMessages: Record<string, string> = {
        received: "Chef confirmed ticket. Artisan sourdough and ingredients prepped.",
        toasting: "Grilling on cast-iron at 210°C with cultured butter for a golden crunchy crust.",
        ready: "Packed hot & fresh, ready for counter pickup or table service!",
        served: "Order hand-delivered. Thank you for dining with NiEA'S Sandwich Bar!",
        cancelled: "Your order has been cancelled.",
      };

      const newNotif = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        time: nowStr,
        title: statusTitles[newStatus] || "Order Status Updated",
        message: customNote || defaultMessages[newStatus] || `Status updated to ${newStatus}`,
        type: "status" as const,
        step: newStatus,
      };

      let nextMins: number | undefined = undefined;
      if (newStatus === "toasting") nextMins = 5;
      else if (newStatus === "ready" || newStatus === "served") nextMins = 0;

      const orderTarget = liveOrders.find((o) => o.id === orderId || o.orderNumber === orderId);
      const existingNotifs = orderTarget?.notifications || [];

      const patch: Partial<OrderRecord> = {
        status: newStatus,
        lastTimeLeftUpdated: new Date().toISOString(),
        notifications: [newNotif, ...existingNotifs],
      };
      if (nextMins !== undefined) {
        patch.estimatedMinutesLeft = nextMins;
      }

      setLiveOrders((prev) =>
        prev.map((o) => (o.id === orderId || o.orderNumber === orderId ? { ...o, ...patch } : o))
      );

      await updateOrderStatusInFirestore(orderId, patch);

      // Auto-update posRecords when an order is served to keep analytics in sync across devices
      if (newStatus === "served" && orderTarget && orderTarget.status !== "served") {
        const todayStr = new Date().toISOString().split("T")[0];
        const isCash = orderTarget.paymentMethod === "cash";
        const amt = orderTarget.grandTotal || 0;

        setPosRecords((prev) => {
          const existingDay = prev.find((p) => p.date === todayStr);
          let nextRecords: PosSalesRecord[];
          if (existingDay) {
            nextRecords = prev.map((p) =>
              p.date === todayStr
                ? {
                    ...p,
                    cashSales: p.cashSales + (isCash ? amt : 0),
                    upiSales: p.upiSales + (!isCash ? amt : 0),
                    totalOrders: p.totalOrders + 1,
                  }
                : p
            );
          } else {
            nextRecords = [
              {
                id: `pos_${todayStr}`,
                date: todayStr,
                cashSales: isCash ? amt : 0,
                upiSales: !isCash ? amt : 0,
                totalOrders: 1,
                cancelledOrders: 0,
                createdAt: new Date().toISOString(),
              },
              ...prev,
            ];
          }
          savePosRecordToFirestore(nextRecords[0]);
          localStorage.setItem("niea_pos_records", JSON.stringify(nextRecords));
          fetch("/api/sync/pos-records", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(nextRecords),
          }).catch(() => {});
          return nextRecords;
        });
      }

      fetch("/api/sync/order-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, status: newStatus, note: customNote }),
      }).catch(() => {});
    },
    [liveOrders]
  );

  const updateOrderStep = useCallback(
    async (orderId: string, stepId: OrderStepId | null, note?: string) => {
      const nowStr = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
      const orderTarget = liveOrders.find((o) => o.id === orderId);
      const existingNotifs = orderTarget?.notifications || [];

      const stepNotif = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        time: nowStr,
        title: `Kitchen Step: ${stepId || "Auto"}`,
        message: note || "Chef milestone updated",
        type: "kitchen" as const,
        step: stepId || undefined,
      };

      const patch: Partial<OrderRecord> = {
        manualStepId: stepId || undefined,
        isManualStepActive: stepId !== null,
        manualStepAnnouncedAt: new Date().toISOString(),
        manualStepAnnouncedNote: note,
        notifications: [stepNotif, ...existingNotifs],
      };

      setLiveOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ...patch } : o))
      );

      await updateOrderStatusInFirestore(orderId, patch);

      fetch("/api/sync/order-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, stepId, note }),
      }).catch(() => {});
    },
    [liveOrders]
  );

  const updateOrderTimeLeft = useCallback(
    async (orderId: string, minutesLeft: number, note?: string) => {
      const nowStr = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
      const orderTarget = liveOrders.find((o) => o.id === orderId);
      const existingNotifs = orderTarget?.notifications || [];

      const newNotif = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        time: nowStr,
        title: `Kitchen Time: ${minutesLeft} mins left`,
        message: note || `Chef estimated approx ${minutesLeft} minutes left`,
        type: "time" as const,
      };

      const patch: Partial<OrderRecord> = {
        estimatedMinutesLeft: Math.max(0, minutesLeft),
        estimatedTime: `${Math.max(0, minutesLeft)} mins`,
        lastTimeLeftUpdated: new Date().toISOString(),
        notifications: [newNotif, ...existingNotifs],
      };

      setLiveOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ...patch } : o))
      );

      await updateOrderStatusInFirestore(orderId, patch);

      fetch("/api/sync/order-status", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId, minutesLeft, note }),
      }).catch(() => {});
    },
    [liveOrders]
  );

  const markKotPrinted = useCallback(async (orderId: string) => {
    setLiveOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, kotPrinted: true } : o))
    );
    await updateOrderStatusInFirestore(orderId, { kotPrinted: true });
    fetch("/api/sync/order-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, kotPrinted: true }),
    }).catch(() => {});
  }, []);

  const sendOrderNotification = useCallback(
    async (orderId: string, title: string, message: string) => {
      const nowStr = new Date().toLocaleTimeString([], { hour: "numeric", minute: "2-digit", hour12: true });
      const orderTarget = liveOrders.find((o) => o.id === orderId);
      const existingNotifs = orderTarget?.notifications || [];

      const newNotif = {
        id: `notif_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`,
        time: nowStr,
        title: title || "Chef Update",
        message,
        type: "kitchen" as const,
      };

      const patch: Partial<OrderRecord> = {
        notifications: [newNotif, ...existingNotifs],
      };

      setLiveOrders((prev) =>
        prev.map((o) => (o.id === orderId ? { ...o, ...patch } : o))
      );

      await updateOrderStatusInFirestore(orderId, patch);
    },
    [liveOrders]
  );

  const callCustomerOrder = useCallback(
    async (params?: {
      orderId?: string;
      orderNumber?: string;
      tokenNumber?: string;
      customerName?: string;
      customerPhone?: string;
      targetUserId?: string;
      targetPhone?: string;
      message?: string;
    }) => {
      const payload = {
        orderId: params?.orderId || "",
        orderNumber: params?.orderNumber || "",
        tokenNumber: params?.tokenNumber || "",
        customerName: params?.customerName || "",
        customerPhone: params?.customerPhone || params?.targetPhone || "",
        targetUserId: params?.targetUserId || "",
        targetPhone: params?.targetPhone || params?.customerPhone || "",
        message:
          params?.message ||
          (params?.tokenNumber
            ? `Token #${params.tokenNumber}: Your fresh order is ready for pickup!`
            : "Your order is ready for pickup!"),
      };

      // Immediate voice chime and feedback on owner's terminal
      playChimeSound("takeaway");
      setTimeout(() => {
        const text = payload.tokenNumber
          ? `Calling ${payload.customerName ? `${payload.customerName}, ` : ""}Token number ${payload.tokenNumber}. Voice alert dispatched.`
          : payload.message;
        speakAnnouncement(text);
      }, 400);

      // Targeted cloud broadcast and automated Twilio dispatch
      try {
        await fetch("/api/sync/call-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        // Also initiate Twilio phone call if customer phone is provided
        if (payload.customerPhone) {
          fetch("/api/twilio/call-customer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              phone: payload.customerPhone,
              tokenNumber: payload.tokenNumber,
              customerName: payload.customerName,
              message: payload.message,
            }),
          }).catch(() => {});
        }
      } catch (err) {
        console.warn("Call customer announcement network error:", err);
      }
    },
    []
  );

  const broadcastTakeawayAnnouncement = callCustomerOrder;

  const addReservation = useCallback(async (res: ReservationRecord) => {
    setReservations((prev) => [res, ...prev]);
    await saveReservationToFirestore(res);
    fetch("/api/sync/reservations", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify([res, ...reservations]),
    }).catch(() => {});
  }, [reservations]);

  const updateReservationStatus = useCallback(
    async (id: string, status: "confirmed" | "seated" | "cancelled" | "no-show") => {
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
      await saveReservationToFirestore({
        ...reservations.find((r) => r.id === id)!,
        status,
      });
      fetch(`/api/reservations/${id}/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      }).catch(() => {});
    },
    [reservations]
  );

  const deleteReservation = useCallback(
    async (id: string) => {
      setReservations((prev) => prev.filter((r) => r.id !== id));
      saveSettingDoc("deletedReservations", { id, deletedAt: new Date().toISOString() });
    },
    []
  );

  const addPosRecord = useCallback(async (record: PosSalesRecord) => {
    setPosRecords((prev) => [record, ...prev]);
    await savePosRecordToFirestore(record);
    fetch("/api/pos-records", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(record),
    }).catch(() => {});
  }, []);

  const resetToDefaults = useCallback(async () => {
    setMenuItems(INITIAL_MENU_ITEMS);
    setSeating(INITIAL_SEATING);
    setReservations([]);
    setCafeHighlight(INITIAL_CAFE_HIGHLIGHT);
    setLiveOrders([]);
    setPosRecords([]);
    localStorage.clear();

    await saveSettingDoc("menuItems", { items: INITIAL_MENU_ITEMS });
    await saveSettingDoc("seating", INITIAL_SEATING);
    await saveSettingDoc("cafeHighlight", INITIAL_CAFE_HIGHLIGHT);

    fetch("/api/sync/state", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        menuItems: INITIAL_MENU_ITEMS,
        seating: INITIAL_SEATING,
        reservations: [],
        liveOrders: [],
        posRecords: [],
      }),
    }).catch(() => {});
  }, []);

  return (
    <FirebaseStoreContext.Provider
      value={{
        userSession,
        isAuthLoading,
        signInWithGoogle: loginWithGoogle,
        signOut: async () => {
          try {
            await logoutUser();
          } catch {}
          updateUserSession(null);
        },
        updateUserSession,
        websiteConfig,
        preBookingConfig,
        financialSettings,
        whatsappConfig,
        loyaltyConfig,
        seating,
        menuItems,
        liveOrders,
        reservations,
        posRecords,
        coupons,
        dailyIngredients,
        dailyWastage,
        masterIngredients,
        cafeHighlight,
        isFloatingCatEnabled,
        isCloudSynced,
        updateWebsiteConfig,
        updatePreBookingConfig,
        updateFinancialSettings,
        updateWhatsappConfig,
        updateLoyaltyConfig,
        updateSeating,
        updateMenuItems,
        updateCoupons,
        updateDailyIngredients,
        updateDailyWastage,
        updateMasterIngredients,
        updateCafeHighlight,
        updateFloatingCatEnabled,
        placeOrder,
        updateOrderStatus,
        updateOrderStep,
        updateOrderTimeLeft,
        markKotPrinted,
        sendOrderNotification,
        callCustomerOrder,
        broadcastTakeawayAnnouncement,
        addReservation,
        updateReservationStatus,
        deleteReservation,
        addPosRecord,
        resetToDefaults,
      }}
    >
      {children}
    </FirebaseStoreContext.Provider>
  );
};

export function useFirebaseStore() {
  const context = useContext(FirebaseStoreContext);
  if (!context) {
    throw new Error("useFirebaseStore must be used within a FirebaseStoreProvider");
  }
  return context;
}
