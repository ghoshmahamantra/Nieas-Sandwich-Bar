import React, { useState, useEffect, useRef } from "react";
import {
  X,
  User,
  CheckCircle2,
  ShieldCheck,
  Sparkles,
  Edit3,
  Check,
  LogOut,
  Mail,
  Phone,
  ArrowRight,
  Coffee,
  HelpCircle,
  Receipt,
  KeyRound,
  RotateCcw,
  Smartphone,
} from "lucide-react";
import { UserSession } from "../types/niea";
import { loginWithGoogle, saveUserProfileToFirestore } from "../services/firebase";

declare global {
  interface Window {
    google?: any;
  }
}

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  userSession: UserSession | null;
  onLoginSuccess: (session: UserSession) => void;
  onLogout: () => void;
  autoMessage?: string;
  onOpenOrderHistory?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  userSession,
  onLoginSuccess,
  onLogout,
  autoMessage,
  onOpenOrderHistory,
}) => {
  // Top-level tabs: "google" | "phone" | "profile"
  const [activeTab, setActiveTab] = useState<"google" | "phone" | "profile">(
    userSession?.isLoggedIn ? "profile" : "google"
  );

  const [savedOrdersCount, setSavedOrdersCount] = useState<number>(0);

  // Sync saved orders count from localStorage 'niea_orders'
  useEffect(() => {
    if (!isOpen) return;
    try {
      const saved = localStorage.getItem("niea_orders");
      if (saved) {
        const parsed = JSON.parse(saved);
        setSavedOrdersCount(Array.isArray(parsed) ? parsed.length : 0);
      } else {
        setSavedOrdersCount(0);
      }
    } catch {
      setSavedOrdersCount(0);
    }
  }, [isOpen]);

  // Google Sign-In state
  const [googleEmail, setGoogleEmail] = useState("");
  const [googleName, setGoogleName] = useState("");
  const [gsiConfig, setGsiConfig] = useState<{ hasClientId: boolean; clientId: string | null }>({
    hasClientId: false,
    clientId: null,
  });

  // Mobile OTP Auth state
  const [mobileNumber, setMobileNumber] = useState("");
  const [guestName, setGuestName] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [generatedOtpHint, setGeneratedOtpHint] = useState<string | null>(null);
  const [resendCountdown, setResendCountdown] = useState(0);

  // Profile edit state
  const [isEditingPhone, setIsEditingPhone] = useState(false);
  const [tempPhone, setTempPhone] = useState(userSession?.phoneNumber || "");

  // Mandatory phone number validation state
  const [pendingSession, setPendingSession] = useState<UserSession | null>(null);
  const [mandatoryPhoneInput, setMandatoryPhoneInput] = useState<string>("");

  // Status feedback
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const otpInputRef = useRef<HTMLInputElement | null>(null);

  // Resend countdown timer effect
  useEffect(() => {
    if (resendCountdown <= 0) return;
    const timer = setInterval(() => {
      setResendCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [resendCountdown]);

  // Reset tab on modal open
  useEffect(() => {
    if (isOpen) {
      setErrorMsg("");
      setSuccessMsg("");
      setPendingSession(null);
      if (userSession?.isLoggedIn) {
        setActiveTab("profile");
      } else {
        setActiveTab("google");
      }
    }
  }, [isOpen, userSession]);

  // Fetch Google Client ID configuration
  useEffect(() => {
    let isMounted = true;
    fetch("/api/auth/google-config")
      .then((res) => res.json())
      .then((data) => {
        if (isMounted) {
          setGsiConfig(data);
        }
      })
      .catch(() => {});
    return () => {
      isMounted = false;
    };
  }, [isOpen]);

  // Process session and strictly mandate phone number
  const processSessionWithMandatoryPhone = (session: UserSession) => {
    const savedPhone = localStorage.getItem("niea_customer_phone")?.replace(/\D/g, "").slice(-10);
    const effectivePhone = session.phoneNumber?.replace(/\D/g, "").slice(-10) || (savedPhone && savedPhone.length === 10 ? savedPhone : "");

    if (effectivePhone && effectivePhone.length === 10) {
      const fullSession: UserSession = { ...session, phoneNumber: effectivePhone };
      localStorage.setItem("niea_customer_phone", effectivePhone);
      if (session.name) localStorage.setItem("niea_customer_name", session.name);
      onLoginSuccess(fullSession);
      setSuccessMsg(`Welcome, ${fullSession.name}!`);
      setTimeout(() => onClose(), 600);
    } else {
      // Prompt mandatory phone number immediately
      setPendingSession(session);
      setMandatoryPhoneInput("");
      setErrorMsg("");
      setSuccessMsg("");
    }
  };

  const handleCompleteMandatoryPhone = async (e: React.FormEvent) => {
    e.preventDefault();
    const clean = mandatoryPhoneInput.replace(/\D/g, "").slice(-10);
    if (!clean || clean.length !== 10) {
      setErrorMsg("Please enter a valid 10-digit mobile number.");
      return;
    }
    if (!pendingSession) return;

    const fullSession: UserSession = {
      ...pendingSession,
      phoneNumber: clean,
    };

    localStorage.setItem("niea_customer_phone", clean);
    if (fullSession.name) localStorage.setItem("niea_customer_name", fullSession.name);

    const uidOrEmail = (pendingSession as any).uid || pendingSession.email || clean;
    if (uidOrEmail) {
      saveUserProfileToFirestore(uidOrEmail, fullSession).catch(() => {});
    }

    onLoginSuccess(fullSession);
    setSuccessMsg(`Welcome, ${fullSession.name}! Mobile number linked.`);
    setPendingSession(null);
    setTimeout(() => onClose(), 600);
  };

  // Initialize official Google Identity Services (GSI) if client ID exists
  useEffect(() => {
    if (!isOpen || userSession?.isLoggedIn || activeTab !== "google") return;

    const clientId = gsiConfig.clientId || (import.meta as any).env?.VITE_GOOGLE_CLIENT_ID;

    if (clientId && window.google?.accounts?.id) {
      try {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: (response: any) => {
            handleGoogleCredential(response.credential);
          },
          auto_select: false,
        });

        const targetDiv = document.getElementById("gsiOfficialButtonContainer");
        if (targetDiv) {
          targetDiv.innerHTML = "";
          window.google.accounts.id.renderButton(targetDiv, {
            theme: "outline",
            size: "large",
            text: "continue_with",
            shape: "pill",
            width: 320,
          });
        }
      } catch (err) {
        console.warn("GSI init warning:", err);
      }
    }
  }, [isOpen, gsiConfig, userSession, activeTab]);

  // Firebase Real Google Authentication
  const handleFirebaseGoogleLogin = async () => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const session = await loginWithGoogle();
      processSessionWithMandatoryPhone(session);
    } catch (err: any) {
      console.error("Firebase Google Auth Error:", err);
      if (err.code !== "auth/popup-closed-by-user") {
        setErrorMsg(err.message || "Google Authentication failed. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Google Credential JWT response from Google GSI
  const handleGoogleCredential = async (credential: string) => {
    setIsLoading(true);
    setErrorMsg("");
    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential }),
      });
      const data = await res.json();
      if (data.success && data.user) {
        const session: UserSession = {
          name: data.user.name,
          email: data.user.email,
          avatarUrl: data.user.picture,
          phoneNumber: data.user.phoneNumber || "",
          isLoggedIn: true,
          authProvider: "google",
          loginTimestamp: data.user.loginTimestamp,
        };
        processSessionWithMandatoryPhone(session);
      } else {
        setErrorMsg(data.error || "Google sign-in failed. Please try again.");
      }
    } catch {
      setErrorMsg("Network error during Google sign-in. Please retry.");
    } finally {
      setIsLoading(false);
    }
  };

  // Direct Google Authentication
  const handleDirectGoogleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!googleEmail.trim()) {
      setErrorMsg("Please enter your Gmail / Google email address.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    const targetEmail = googleEmail.trim().toLowerCase();
    const targetName = googleName.trim() || targetEmail.split("@")[0] || "NiEA Guest";
    const avatar = `https://api.dicebear.com/7.x/notionists/svg?seed=${encodeURIComponent(targetName)}`;

    try {
      const res = await fetch("/api/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: targetEmail,
          name: targetName,
          picture: avatar,
        }),
      });

      const data = await res.json();
      if (data.success && data.user) {
        const session: UserSession = {
          name: data.user.name,
          email: data.user.email,
          avatarUrl: data.user.picture,
          phoneNumber: data.user.phoneNumber || "",
          isLoggedIn: true,
          authProvider: "google",
          loginTimestamp: data.user.loginTimestamp,
        };
        processSessionWithMandatoryPhone(session);
      } else {
        setErrorMsg(data.error || "Failed to authenticate with Google");
      }
    } catch {
      setErrorMsg("Unable to connect to authentication server.");
    } finally {
      setIsLoading(false);
    }
  };

  // Send Mobile OTP
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleanPhone = mobileNumber.replace(/\D/g, "").slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      setErrorMsg("Please enter a valid 10-digit Indian mobile number.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");
    setSuccessMsg("");

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: cleanPhone,
          channel: "whatsapp",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setOtpSent(true);
        setResendCountdown(30);
        if (data.otp) {
          setGeneratedOtpHint(data.otp);
        }
        setSuccessMsg(`Verification code sent to +91 ${cleanPhone}`);
        setTimeout(() => {
          otpInputRef.current?.focus();
        }, 100);
      } else {
        setErrorMsg(data.error || "Failed to dispatch verification code.");
      }
    } catch {
      setErrorMsg("Network error connecting to SMS/WhatsApp verification service.");
    } finally {
      setIsLoading(false);
    }
  };

  // Verify OTP and complete login
  const handleVerifyOtp = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const cleanPhone = mobileNumber.replace(/\D/g, "").slice(-10);
    const cleanOtp = otpCode.trim();

    if (!cleanOtp || cleanOtp.length < 4) {
      setErrorMsg("Please enter the 4-digit verification code.");
      return;
    }

    setIsLoading(true);
    setErrorMsg("");

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phoneNumber: cleanPhone,
          otp: cleanOtp,
          name: guestName.trim() || undefined,
        }),
      });

      const data = await res.json();
      if (data.success) {
        const session: UserSession = {
          name: data.name || guestName.trim() || "Valued Guest",
          phoneNumber: cleanPhone,
          isLoggedIn: true,
          authProvider: "phone",
          loginTimestamp: new Date().toISOString(),
        };
        localStorage.setItem("niea_customer_phone", cleanPhone);
        if (session.name) localStorage.setItem("niea_customer_name", session.name);
        saveUserProfileToFirestore(`phone_${cleanPhone}`, session).catch(() => {});
        onLoginSuccess(session);
        setSuccessMsg(`Welcome, ${session.name}! Mobile verified & linked.`);
        setTimeout(() => onClose(), 700);
      } else {
        setErrorMsg(data.error || "Incorrect OTP code. Please try again.");
      }
    } catch {
      setErrorMsg("Error verifying OTP. Please check your network.");
    } finally {
      setIsLoading(false);
    }
  };

  // Update phone in logged-in profile
  const handleSavePhone = () => {
    const clean = tempPhone.replace(/\D/g, "").slice(-10);
    if (clean.length !== 10) {
      setErrorMsg("Please enter a valid 10-digit number.");
      return;
    }
    setIsEditingPhone(false);
    localStorage.setItem("niea_customer_phone", clean);
    if (userSession) {
      const updated: UserSession = {
        ...userSession,
        phoneNumber: clean,
      };
      const uidKey = (userSession as any).uid || userSession.email || clean;
      saveUserProfileToFirestore(uidKey, updated).catch(() => {});
      onLoginSuccess(updated);
      setSuccessMsg("Phone number updated!");
    }
  };

  if (!isOpen) return null;

  return (
    <div
      id="auth-modal-backdrop"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div
        id="auth-modal-card"
        className="relative w-full max-w-md bg-[#24332D] text-[#FBF9F2] rounded-3xl border border-white/15 shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
      >
        {/* Modal Top Bar */}
        <div className="p-5 pb-4 border-b border-white/10 flex items-center justify-between bg-[#1D2B25]/90">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#F5E086] text-[#24332D] flex items-center justify-center shadow-md font-black">
              {activeTab === "google" ? (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
              ) : activeTab === "phone" ? (
                <Smartphone className="w-5 h-5 text-[#24332D]" />
              ) : (
                <User className="w-5 h-5 text-[#24332D]" />
              )}
            </div>
            <div>
              <h3 className="font-niea font-bold text-base text-[#F5E086] flex items-center gap-1.5">
                {userSession?.isLoggedIn
                  ? "NiEA'S Customer Profile"
                  : activeTab === "google"
                  ? "Sign In with Google"
                  : "Mobile Number & OTP"}
              </h3>
              <p className="text-[11px] text-[#FBF9F2]/70">
                {userSession?.isLoggedIn
                  ? "Verified Member • Auto-fills Table & Orders"
                  : activeTab === "google"
                  ? "Instant Google verification for invoices & bookings"
                  : "Direct OTP verification via WhatsApp & SMS"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {onOpenOrderHistory && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenOrderHistory();
                }}
                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-[#374C44] hover:bg-[#3E564D] border border-[#F5E086]/30 text-[11px] font-bold text-[#F5E086] transition shadow-xs"
                title="View Past Orders & Receipts"
              >
                <Receipt className="w-3.5 h-3.5" />
                <span className="inline text-[11px]">Orders</span>
                {savedOrdersCount > 0 && (
                  <span className="px-1.5 py-0.2 rounded-full bg-[#F5E086] text-[#24332D] text-[10px] font-black">
                    {savedOrdersCount}
                  </span>
                )}
              </button>
            )}

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Tab Switcher (When Not Logged In) */}
        {!userSession?.isLoggedIn && (
          <div className="px-6 pt-4 pb-0">
            <div className="flex p-1 rounded-2xl bg-black/30 border border-white/10">
              <button
                type="button"
                onClick={() => {
                  setActiveTab("google");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
                  activeTab === "google"
                    ? "bg-[#F5E086] text-[#24332D] shadow-sm font-black"
                    : "text-white/70 hover:text-white"
                }`}
              >
                <Mail className="w-3.5 h-3.5" />
                <span>Gmail / Google</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setActiveTab("phone");
                  setErrorMsg("");
                  setSuccessMsg("");
                }}
                className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition ${
                  activeTab === "phone"
                    ? "bg-[#F5E086] text-[#24332D] shadow-sm font-black"
                    : "text-white/70 hover:text-white"
                }`}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>Mobile OTP</span>
              </button>
            </div>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 space-y-4">
          {autoMessage && !userSession?.isLoggedIn && (
            <div className="p-3 rounded-2xl bg-[#F5E086]/10 border border-[#F5E086]/30 flex items-center gap-2.5 text-xs text-[#F5E086]">
              <Sparkles className="w-4 h-4 shrink-0" />
              <span>{autoMessage}</span>
            </div>
          )}

          {errorMsg && (
            <div className="p-3 rounded-2xl bg-rose-500/15 border border-rose-500/40 text-xs text-rose-300">
              {errorMsg}
            </div>
          )}

          {successMsg && (
            <div className="p-3 rounded-2xl bg-emerald-500/15 border border-emerald-500/40 text-xs text-emerald-300 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* =======================================================
             VIEW 0: MANDATORY PHONE NUMBER STEP FOR GOOGLE SIGN-IN
             ======================================================= */}
          {pendingSession ? (
            <div className="space-y-4 animate-in fade-in zoom-in-95 duration-200">
              <div className="p-4 rounded-2xl bg-[#F5E086]/10 border border-[#F5E086]/30 text-center space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-[#F5E086] text-[#24332D] flex items-center justify-center mx-auto shadow-md">
                  <Phone className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-white text-base">
                  Link Mobile Number (Mandatory)
                </h3>
                <p className="text-xs text-white/80 leading-relaxed max-w-xs mx-auto">
                  Hi <strong className="text-[#F5E086]">{pendingSession.name}</strong>! NiEA requires a valid 10-digit mobile number for order queue tokens, SMS alerts & table updates.
                </p>
              </div>

              <form onSubmit={handleCompleteMandatoryPhone} className="space-y-3.5">
                <div>
                  <label className="text-xs text-white/80 font-bold block mb-1.5">
                    Your 10-Digit Mobile Number *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#F5E086]">
                      +91
                    </span>
                    <input
                      type="tel"
                      required
                      maxLength={10}
                      autoFocus
                      placeholder="98765 43210"
                      value={mandatoryPhoneInput}
                      onChange={(e) => setMandatoryPhoneInput(e.target.value.replace(/\D/g, "").slice(0, 10))}
                      className="w-full pl-12 pr-4 py-3 rounded-xl bg-[#2B3D36] border border-white/20 text-white font-mono text-sm placeholder-white/40 focus:outline-none focus:border-[#F5E086] shadow-inner"
                    />
                  </div>
                  <span className="text-[11px] text-white/50 block mt-1">
                    This will be saved to your profile and auto-filled at checkout.
                  </span>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={isLoading || mandatoryPhoneInput.length !== 10}
                    className="flex-1 py-3 rounded-xl bg-[#F5E086] text-[#24332D] font-black text-xs hover:bg-[#F8E79B] transition shadow-md flex items-center justify-center gap-2 cursor-pointer disabled:opacity-40"
                  >
                    <Check className="w-4 h-4" />
                    <span>Save Number & Complete Login</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setPendingSession(null);
                      setActiveTab("google");
                    }}
                    className="px-4 py-3 rounded-xl bg-white/10 hover:bg-white/15 text-white/70 font-semibold text-xs transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            </div>
          ) : userSession?.isLoggedIn ? (
            <div className="space-y-4 animate-in fade-in duration-150">
              <div className="p-4 rounded-2xl bg-[#2B3D36] border border-white/10 space-y-3.5 shadow-md">
                <div className="flex items-center gap-3.5">
                  <div className="relative">
                    {userSession.avatarUrl ? (
                      <img
                        src={userSession.avatarUrl}
                        alt={userSession.name}
                        className="w-12 h-12 rounded-full object-cover border-2 border-emerald-400/60 shadow-sm"
                        referrerPolicy="no-referrer"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-full bg-emerald-700 text-white font-black text-lg flex items-center justify-center border-2 border-emerald-400">
                        {userSession.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <span className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-emerald-500 border-2 border-[#24332D] flex items-center justify-center">
                      <Check className="w-2.5 h-2.5 text-white" />
                    </span>
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <h4 className="font-bold text-sm text-[#F5E086] truncate">
                        {userSession.name}
                      </h4>
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-300 px-1.5 py-0.5 rounded-full font-bold">
                        Verified
                      </span>
                    </div>
                    {userSession.email && (
                      <p className="text-xs text-white/70 truncate flex items-center gap-1 mt-0.5">
                        <Mail className="w-3 h-3 text-white/50" />
                        <span>{userSession.email}</span>
                      </p>
                    )}
                    {userSession.phoneNumber && (
                      <p className="text-xs text-white/70 truncate flex items-center gap-1 mt-0.5">
                        <Phone className="w-3 h-3 text-white/50" />
                        <span>+91 {userSession.phoneNumber}</span>
                      </p>
                    )}
                  </div>
                </div>

                {/* Optional Phone Sync / Edit */}
                <div className="pt-3 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-white/70 flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-[#F5E086]" />
                      SMS / Order Updates Mobile
                    </span>
                    {!isEditingPhone && (
                      <button
                        type="button"
                        onClick={() => {
                          setTempPhone(userSession.phoneNumber || "");
                          setIsEditingPhone(true);
                        }}
                        className="text-[11px] text-[#F5E086] hover:underline font-bold flex items-center gap-1"
                      >
                        <Edit3 className="w-3 h-3" />
                        <span>{userSession.phoneNumber ? "Edit" : "+ Add Phone"}</span>
                      </button>
                    )}
                  </div>

                  {isEditingPhone && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-2 text-xs font-bold text-white/60">
                          +91
                        </span>
                        <input
                          type="tel"
                          value={tempPhone}
                          onChange={(e) => setTempPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                          placeholder="98765 43210"
                          className="w-full pl-10 pr-3 py-1.5 rounded-xl bg-[#1E2B25] border border-[#F5E086]/30 text-xs text-white focus:outline-none focus:border-[#F5E086]"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={handleSavePhone}
                        className="px-3 py-1.5 rounded-xl bg-[#F5E086] text-[#24332D] text-xs font-bold hover:bg-[#F8E79B] transition"
                      >
                        Save
                      </button>
                      <button
                        type="button"
                        onClick={() => setIsEditingPhone(false)}
                        className="px-2.5 py-1.5 rounded-xl bg-white/10 text-white text-xs hover:bg-white/20 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-2">
                {onOpenOrderHistory && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenOrderHistory();
                    }}
                    className="w-full py-2.5 px-4 rounded-xl bg-[#2B3D36] hover:bg-[#344941] border border-white/10 text-xs font-bold text-white transition flex items-center justify-between"
                  >
                    <span className="flex items-center gap-2">
                      <Receipt className="w-4 h-4 text-[#F5E086]" />
                      <span>View Past Orders & Tax Invoices</span>
                    </span>
                    <ArrowRight className="w-3.5 h-3.5 opacity-60" />
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => {
                    onLogout();
                    onClose();
                  }}
                  className="w-full py-2.5 px-4 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 border border-rose-500/30 text-rose-300 text-xs font-bold transition flex items-center justify-center gap-2"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Sign Out of NiEA'S</span>
                </button>
              </div>
            </div>
          ) : activeTab === "google" ? (
            /* =======================================================
               TAB 1: GMAIL / GOOGLE SIGN-IN VIEW
               ======================================================= */
            <div className="space-y-4 animate-in fade-in duration-150">
              {/* Primary Real Google Authentication Button */}
              <button
                type="button"
                onClick={handleFirebaseGoogleLogin}
                disabled={isLoading}
                className="w-full py-3 px-4 rounded-2xl bg-white hover:bg-neutral-100 text-[#1f1f1f] font-bold text-sm transition shadow-lg flex items-center justify-center gap-3 cursor-pointer active:scale-98 disabled:opacity-50 border border-black/10"
              >
                <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>{isLoading ? "Connecting with Google..." : "Continue with Google"}</span>
              </button>

              {/* Official Google GSI button container */}
              <div id="gsiOfficialButtonContainer" className="flex justify-center min-h-[1px]"></div>

              <div className="relative flex items-center justify-center">
                <span className="border-t border-white/10 w-full" />
                <span className="bg-[#24332D] px-3 text-[10px] text-white/50 uppercase tracking-widest shrink-0 font-bold">
                  Or manual login
                </span>
                <span className="border-t border-white/10 w-full" />
              </div>

              <form onSubmit={handleDirectGoogleLogin} className="space-y-3">
                <div>
                  <label className="block text-[11px] font-semibold text-white/70 mb-1">
                    Google Email Address *
                  </label>
                  <div className="relative">
                    <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      type="email"
                      required
                      value={googleEmail}
                      onChange={(e) => setGoogleEmail(e.target.value)}
                      placeholder="yourname@gmail.com"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#1E2B25] border border-white/15 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#F5E086] transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-semibold text-white/70 mb-1">
                    Your Name (Optional)
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                    <input
                      type="text"
                      value={googleName}
                      onChange={(e) => setGoogleName(e.target.value)}
                      placeholder="e.g. Rahul Sen"
                      className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#1E2B25] border border-white/15 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#F5E086] transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-2.5 rounded-xl bg-[#F5E086] hover:bg-[#F8E79B] text-[#24332D] font-bold text-xs transition shadow flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
                >
                  <Check className="w-4 h-4" />
                  <span>{isLoading ? "Signing in..." : "Continue with Google Account"}</span>
                </button>
              </form>

              <div className="p-3 rounded-2xl bg-black/20 border border-white/5 text-[11px] text-white/60 space-y-1">
                <span className="font-bold text-[#F5E086] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Why sign in with Google?
                </span>
                <p>
                  Saves your table bookings, live takeaway orders, stamps, and tax invoices across all visits to NiEA'S Sandwich Bar.
                </p>
              </div>
            </div>
          ) : (
            /* =======================================================
               TAB 2: MOBILE NUMBER & OTP AUTH VIEW
               ======================================================= */
            <div className="space-y-4 animate-in fade-in duration-150">
              {!otpSent ? (
                /* STEP 1: Enter Phone Number */
                <form onSubmit={handleSendOtp} className="space-y-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-white/70 mb-1">
                      Indian Mobile Number *
                    </label>
                    <div className="relative flex items-center">
                      <span className="absolute left-3 text-xs font-bold text-[#F5E086] flex items-center gap-1 border-r border-white/10 pr-2">
                        +91
                      </span>
                      <input
                        type="tel"
                        required
                        value={mobileNumber}
                        onChange={(e) => setMobileNumber(e.target.value.replace(/\D/g, "").slice(0, 10))}
                        placeholder="98765 43210"
                        className="w-full pl-14 pr-3 py-2 rounded-xl bg-[#1E2B25] border border-white/15 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#F5E086] font-mono tracking-wider transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-white/70 mb-1">
                      Guest Name (for table & kitchen token)
                    </label>
                    <div className="relative">
                      <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-white/40" />
                      <input
                        type="text"
                        value={guestName}
                        onChange={(e) => setGuestName(e.target.value)}
                        placeholder="e.g. Sayan Mukherjee"
                        className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#1E2B25] border border-white/15 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#F5E086] transition"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isLoading || mobileNumber.replace(/\D/g, "").length !== 10}
                    className="w-full py-2.5 rounded-xl bg-[#F5E086] hover:bg-[#F8E79B] text-[#24332D] font-bold text-xs transition shadow flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>{isLoading ? "Sending OTP Code..." : "Send Verification OTP"}</span>
                  </button>
                </form>
              ) : (
                /* STEP 2: Enter 4-Digit OTP Code */
                <form onSubmit={handleVerifyOtp} className="space-y-4">
                  <div className="p-3 rounded-2xl bg-[#1D2B25] border border-[#F5E086]/25 flex items-center justify-between text-xs">
                    <div>
                      <span className="text-white/60 block text-[10px]">OTP sent to:</span>
                      <strong className="text-[#F5E086] font-mono text-sm">+91 {mobileNumber}</strong>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setOtpSent(false);
                        setOtpCode("");
                      }}
                      className="text-[11px] text-[#F5E086] hover:underline flex items-center gap-1 font-bold"
                    >
                      <Edit3 className="w-3 h-3" />
                      <span>Change</span>
                    </button>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-white/70 mb-1.5 text-center">
                      Enter 4-Digit Verification Code
                    </label>
                    <div className="flex justify-center">
                      <input
                        ref={otpInputRef}
                        type="text"
                        maxLength={4}
                        required
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value.replace(/\D/g, "").slice(0, 4))}
                        placeholder="••••"
                        className="w-40 text-center py-2.5 rounded-2xl bg-[#1E2B25] border-2 border-[#F5E086] text-xl font-mono font-black text-[#F5E086] tracking-[0.5em] focus:outline-none focus:ring-2 focus:ring-[#F5E086]/50"
                      />
                    </div>
                  </div>

                  {/* Test Auto-fill helper if generated */}
                  {generatedOtpHint && (
                    <div className="flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => {
                          setOtpCode(generatedOtpHint);
                          setTimeout(() => handleVerifyOtp(), 150);
                        }}
                        className="px-3 py-1 rounded-full bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-400/40 text-emerald-300 text-[11px] font-bold transition flex items-center gap-1.5 shadow-xs"
                      >
                        <Sparkles className="w-3 h-3 text-[#F5E086]" />
                        <span>1-Tap Auto Fill: <strong>{generatedOtpHint}</strong></span>
                      </button>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isLoading || otpCode.length < 4}
                    className="w-full py-2.5 rounded-xl bg-[#F5E086] hover:bg-[#F8E79B] text-[#24332D] font-bold text-xs transition shadow flex items-center justify-center gap-2 cursor-pointer active:scale-98 disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" />
                    <span>{isLoading ? "Verifying..." : "Verify & Sign In"}</span>
                  </button>

                  <div className="flex items-center justify-between text-[11px] text-white/60 pt-1">
                    <span>Didn't receive SMS/WhatsApp?</span>
                    {resendCountdown > 0 ? (
                      <span className="text-white/40 font-mono">Resend in {resendCountdown}s</span>
                    ) : (
                      <button
                        type="button"
                        onClick={handleSendOtp}
                        className="text-[#F5E086] hover:underline font-bold flex items-center gap-1"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Resend Code</span>
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
