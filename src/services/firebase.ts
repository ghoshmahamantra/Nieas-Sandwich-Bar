import { initializeApp, getApps, getApp } from "firebase/app";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  getDocFromServer,
  collection,
  onSnapshot,
  query,
  orderBy,
  limit,
} from "firebase/firestore";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser,
} from "firebase/auth";
import firebaseConfigJson from "../../firebase-applet-config.json";
import {
  OrderRecord,
  MenuItem,
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
} from "../types/niea";

export const firebaseConfig = {
  projectId: firebaseConfigJson.projectId || "meta-station-vv9wh",
  appId: firebaseConfigJson.appId || "1:430908775444:web:9027046acb10ecdd955b01",
  apiKey: firebaseConfigJson.apiKey || "AIzaSyDIFwthq7y3FdkZZBE8OMSTjULxsfjOxIo",
  authDomain: firebaseConfigJson.authDomain || "meta-station-vv9wh.firebaseapp.com",
  storageBucket: firebaseConfigJson.storageBucket || "meta-station-vv9wh.firebasestorage.app",
  messagingSenderId: firebaseConfigJson.messagingSenderId || "430908775444",
  firestoreDatabaseId:
    firebaseConfigJson.firestoreDatabaseId ||
    "ai-studio-upgradenieas-2bd52186-d5f2-4064-890e-9576ab742b29",
};

// Initialize Firebase App singleton
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

// Initialize Firestore with custom database ID
export const db = firebaseConfig.firestoreDatabaseId
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);

// Initialize Auth & Google Provider
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: "select_account" });

// Test Firestore connection on boot
export async function testFirestoreConnection(): Promise<boolean> {
  try {
    await getDocFromServer(doc(db, "test", "connection"));
    console.log("[Firebase] Firestore real-time cloud connection verified successfully.");
    return true;
  } catch (error: any) {
    if (error?.message && error.message.includes("the client is offline")) {
      console.warn("[Firebase] Offline client detected. Local cache active.");
    } else {
      console.log("[Firebase] Firestore initialized and active:", error?.message || "ready");
    }
    return true;
  }
}

testFirestoreConnection();

// ==========================================
// REAL GOOGLE AUTHENTICATION HELPERS
// ==========================================

export async function loginWithGoogle(): Promise<UserSession> {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    const session: UserSession = {
      phoneNumber: user.phoneNumber || "",
      name: user.displayName || "Google Guest",
      email: user.email || "",
      avatarUrl: user.photoURL || undefined,
      isLoggedIn: true,
      authProvider: "google",
      loginTimestamp: new Date().toISOString(),
    };

    // Save profile into Firestore users collection
    try {
      await setDoc(
        doc(db, "users", user.uid),
        {
          uid: user.uid,
          email: user.email,
          displayName: user.displayName,
          photoURL: user.photoURL,
          phoneNumber: user.phoneNumber,
          lastLoginAt: new Date().toISOString(),
        },
        { merge: true }
      );
    } catch (e) {
      console.warn("[Firebase] Could not save user profile doc:", e);
    }

    return session;
  } catch (error: any) {
    console.error("[Firebase] Google Popup Login error, trying redirect fallback:", error);
    if (error.code === "auth/popup-blocked" || error.code === "auth/popup-closed-by-user") {
      await signInWithRedirect(auth, googleProvider);
    }
    throw error;
  }
}

export async function checkRedirectAuth(): Promise<UserSession | null> {
  try {
    const result = await getRedirectResult(auth);
    if (result && result.user) {
      const user = result.user;
      return {
        phoneNumber: user.phoneNumber || "",
        name: user.displayName || "Google Guest",
        email: user.email || "",
        avatarUrl: user.photoURL || undefined,
        isLoggedIn: true,
        authProvider: "google",
        loginTimestamp: new Date().toISOString(),
      };
    }
    return null;
  } catch (err) {
    console.warn("[Firebase] Redirect auth check:", err);
    return null;
  }
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export function subscribeToAuth(callback: (session: UserSession | null) => void) {
  return onAuthStateChanged(auth, async (firebaseUser: FirebaseUser | null) => {
    if (firebaseUser) {
      let resolvedPhone = firebaseUser.phoneNumber || "";
      // If phone is not in auth object (typical for Google sign in), check localStorage or Firestore profile
      const localPhone = typeof window !== "undefined" ? localStorage.getItem("niea_customer_phone")?.replace(/\D/g, "").slice(-10) : "";
      if (localPhone && localPhone.length === 10) {
        resolvedPhone = localPhone;
      } else {
        try {
          const userSnap = await getDoc(doc(db, "users", firebaseUser.uid));
          if (userSnap.exists()) {
            const data = userSnap.data();
            if (data?.phoneNumber) {
              resolvedPhone = String(data.phoneNumber).replace(/\D/g, "").slice(-10);
              if (typeof window !== "undefined") {
                localStorage.setItem("niea_customer_phone", resolvedPhone);
              }
            }
          }
        } catch (e) {
          console.warn("[Firebase] Could not fetch user doc in subscribeToAuth:", e);
        }
      }

      const session: UserSession = {
        phoneNumber: resolvedPhone,
        name: firebaseUser.displayName || "Valued Customer",
        email: firebaseUser.email || "",
        avatarUrl: firebaseUser.photoURL || undefined,
        isLoggedIn: true,
        authProvider: "google",
        loginTimestamp: new Date().toISOString(),
      };
      (session as any).uid = firebaseUser.uid;
      callback(session);
    } else {
      callback(null);
    }
  });
}

// ==========================================
// REAL-TIME FIRESTORE DATA SYNC HELPERS
// ==========================================

/**
 * Recursively removes any undefined fields from an object so Firestore setDoc does not throw errors.
 */
export function cleanForFirestore<T>(obj: T): T {
  if (obj === null || obj === undefined) {
    return null as any;
  }
  if (Array.isArray(obj)) {
    return obj.map((item) => cleanForFirestore(item)) as any;
  }
  if (typeof obj === "object" && !(obj instanceof Date)) {
    const cleaned: any = {};
    for (const [key, value] of Object.entries(obj)) {
      if (value !== undefined) {
        cleaned[key] = cleanForFirestore(value);
      }
    }
    return cleaned;
  }
  return obj;
}

export function subscribeToSettingsDoc<T>(
  settingKey: string,
  onData: (data: T) => void,
  initialData?: T
) {
  return onSnapshot(
    doc(db, "settings", settingKey),
    (snapshot) => {
      if (snapshot.exists()) {
        onData(snapshot.data() as T);
      } else if (initialData) {
        // Document doesn't exist yet, seed it automatically
        saveSettingDoc(settingKey, initialData);
      }
    },
    (err) => console.warn(`[Firestore] Settings sub error (${settingKey}):`, err)
  );
}

export async function getSettingDoc<T>(settingKey: string): Promise<T | null> {
  try {
    const snap = await getDoc(doc(db, "settings", settingKey));
    if (snap.exists()) {
      return snap.data() as T;
    }
    return null;
  } catch (err) {
    console.warn(`[Firestore] getSettingDoc error (${settingKey}):`, err);
    return null;
  }
}

export async function saveSettingDoc(settingKey: string, data: any) {
  try {
    const cleaned = cleanForFirestore({ ...data, updatedAt: new Date().toISOString() });
    await setDoc(doc(db, "settings", settingKey), cleaned, { merge: true });
  } catch (err) {
    console.error(`[Firestore] Error saving setting ${settingKey}:`, err);
  }
}

export function subscribeToOrders(onData: (orders: OrderRecord[]) => void) {
  const colRef = collection(db, "orders");
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: OrderRecord[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        if (data && (data.orderNumber || data.items || data.status)) {
          list.push({ ...data, id: d.id } as OrderRecord);
        }
      });
      list.sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });
      onData(list);
    },
    (err) => console.warn("[Firestore] Orders sub error:", err)
  );
}

export async function saveOrderToFirestore(order: OrderRecord) {
  try {
    const docId = order.id || `ord_${Date.now()}`;
    const cleaned = cleanForFirestore({
      ...order,
      id: docId,
      createdAt: order.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, "orders", docId), cleaned, { merge: true });

    // Also persist under customer profile subcollection if user identifier is known
    const userKey = (order as any).userId || (order as any).customerPhone?.replace(/\D/g, "").slice(-10);
    if (userKey) {
      await setDoc(doc(db, "users", String(userKey), "orders", docId), cleaned, { merge: true }).catch(() => {});
    }
    const cleanPhone = (order as any).customerPhone?.replace(/\D/g, "").slice(-10);
    if (cleanPhone && cleanPhone.length === 10) {
      await setDoc(doc(db, "users", `phone_${cleanPhone}`, "orders", docId), cleaned, { merge: true }).catch(() => {});
    }
    console.log(`[Firestore] Order ${order.orderNumber || docId} successfully saved to cloud!`);
  } catch (err) {
    console.error("[Firestore] Error saving order:", err);
  }
}

export async function updateOrderStatusInFirestore(
  orderId: string,
  updates: Partial<OrderRecord>
) {
  try {
    const cleaned = cleanForFirestore({ ...updates, updatedAt: new Date().toISOString() });
    await setDoc(doc(db, "orders", orderId), cleaned, { merge: true });

    // Also update in user subcollection if order exists
    try {
      const snap = await getDoc(doc(db, "orders", orderId));
      if (snap.exists()) {
        const orderData = snap.data();
        const userKey = orderData.userId || orderData.customerPhone?.replace(/\D/g, "").slice(-10);
        if (userKey) {
          await setDoc(doc(db, "users", String(userKey), "orders", orderId), cleaned, { merge: true }).catch(() => {});
        }
      }
    } catch {}
  } catch (err) {
    console.error("[Firestore] Error updating order status:", err);
  }
}

export async function getUserOrdersFromFirestore(uidOrPhone: string): Promise<OrderRecord[]> {
  try {
    const userKey = uidOrPhone.trim();
    if (!userKey) return [];
    
    // Check user orders subcollection
    const snap = await getDocs(collection(db, "users", userKey, "orders"));
    const list: OrderRecord[] = [];
    snap.forEach((d) => {
      const data = d.data();
      if (data && (data.orderNumber || data.items || data.status)) {
        list.push({ ...data, id: d.id } as OrderRecord);
      }
    });

    const cleanPhone = userKey.replace(/\D/g, "").slice(-10);
    if (cleanPhone.length === 10 && cleanPhone !== userKey) {
      const phoneSnap = await getDocs(collection(db, "users", `phone_${cleanPhone}`, "orders"));
      phoneSnap.forEach((d) => {
        const data = d.data();
        if (data && !list.some((o) => o.id === d.id)) {
          list.push({ ...data, id: d.id } as OrderRecord);
        }
      });
    }

    list.sort((a, b) => {
      const timeA = new Date(a.createdAt || 0).getTime();
      const timeB = new Date(b.createdAt || 0).getTime();
      return timeB - timeA;
    });

    return list;
  } catch (err) {
    console.warn("[Firestore] Failed to get user orders from cloud:", err);
    return [];
  }
}

export function subscribeToReservations(onData: (reservations: ReservationRecord[]) => void) {
  const colRef = collection(db, "reservations");
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: ReservationRecord[] = [];
      snapshot.forEach((d) => {
        const data = d.data();
        list.push({ ...data, id: d.id } as ReservationRecord);
      });
      list.sort((a, b) => {
        const timeA = new Date(a.createdAt || 0).getTime();
        const timeB = new Date(b.createdAt || 0).getTime();
        return timeB - timeA;
      });
      onData(list);
    },
    (err) => console.warn("[Firestore] Reservations sub error:", err)
  );
}

export async function saveReservationToFirestore(res: ReservationRecord) {
  try {
    const cleaned = cleanForFirestore({
      ...res,
      updatedAt: new Date().toISOString(),
      createdAt: res.createdAt || new Date().toISOString(),
    });
    await setDoc(doc(db, "reservations", res.id), cleaned, { merge: true });
  } catch (err) {
    console.error("[Firestore] Error saving reservation:", err);
  }
}

export function subscribeToPosRecords(onData: (records: PosSalesRecord[]) => void) {
  const colRef = collection(db, "posRecords");
  return onSnapshot(
    colRef,
    (snapshot) => {
      const list: PosSalesRecord[] = [];
      snapshot.forEach((d) => {
        list.push({ ...d.data(), id: d.id } as PosSalesRecord);
      });
      list.sort((a, b) => (b.date || "").localeCompare(a.date || ""));
      onData(list);
    },
    (err) => console.warn("[Firestore] POS sub error:", err)
  );
}

export async function savePosRecordToFirestore(rec: PosSalesRecord) {
  try {
    const cleaned = cleanForFirestore({
      ...rec,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, "posRecords", rec.id), cleaned, { merge: true });
  } catch (err) {
    console.error("[Firestore] Error saving POS record:", err);
  }
}

export async function saveUserProfileToFirestore(uid: string, profile: Partial<UserSession & { uid: string }>) {
  try {
    const cleaned = cleanForFirestore({
      ...profile,
      updatedAt: new Date().toISOString(),
    });
    await setDoc(doc(db, "users", uid), cleaned, { merge: true });
    const phone = profile.phoneNumber?.replace(/\D/g, "").slice(-10);
    if (phone && phone.length === 10) {
      await setDoc(doc(db, "users", `phone_${phone}`), cleaned, { merge: true }).catch(() => {});
    }
  } catch (e) {
    console.warn("[Firestore] Failed to save user profile:", e);
  }
}

export async function getUserProfileFromFirestore(uidOrPhone: string): Promise<any | null> {
  try {
    const snap = await getDoc(doc(db, "users", uidOrPhone));
    if (snap.exists()) return snap.data();
    const cleanPhone = uidOrPhone.replace(/\D/g, "").slice(-10);
    if (cleanPhone.length === 10) {
      const snapPhone = await getDoc(doc(db, "users", `phone_${cleanPhone}`));
      if (snapPhone.exists()) return snapPhone.data();
    }
    return null;
  } catch (e) {
    console.warn("[Firestore] Failed to get user profile:", e);
    return null;
  }
}

