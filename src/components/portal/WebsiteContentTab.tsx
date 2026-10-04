import React, { useState, useEffect } from "react";
import {
  FileText,
  Clock,
  MapPin,
  Phone,
  Wifi,
  Shield,
  Check,
  RotateCcw,
  Sparkles,
  Instagram,
  Store,
  ToggleLeft,
  ToggleRight,
  Image as ImageIcon,
  Upload,
  Sliders,
  Eye,
  CalendarCheck,
  Type,
  Lock,
  KeyRound,
  ArrowRight,
  TextQuote,
  X,
} from "lucide-react";
import { WebsiteContentConfig } from "../../types/niea";
import { DEFAULT_WEBSITE_CONFIG } from "../../data/nieaData";
import { FONT_REGISTRY, getFontById, applyGlobalTypography } from "../../utils/fontRegistry";

interface WebsiteContentTabProps {
  config: WebsiteContentConfig;
  onUpdateConfig: (updated: WebsiteContentConfig) => void;
  onNotice?: (msg: string) => void;
  isFloatingCatEnabled?: boolean;
  onToggleFloatingCat?: (enabled: boolean) => void;
}

export const WebsiteContentTab: React.FC<WebsiteContentTabProps> = ({
  config,
  onUpdateConfig,
  onNotice,
  isFloatingCatEnabled = true,
  onToggleFloatingCat,
}) => {
  const [formData, setFormData] = useState<WebsiteContentConfig>({
    ...DEFAULT_WEBSITE_CONFIG,
    ...config,
  });
  const [isSaved, setIsSaved] = useState(false);
  const [newPasscode, setNewPasscode] = useState("");
  const [confirmPasscode, setConfirmPasscode] = useState("");
  const [passcodeUpdateNotice, setPasscodeUpdateNotice] = useState<string | null>(null);

  useEffect(() => {
    setFormData({
      ...DEFAULT_WEBSITE_CONFIG,
      ...config,
    });
  }, [config]);

  const handleChange = (field: keyof WebsiteContentConfig, value: string | number | boolean) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const rawDataUrl = event.target?.result as string;
      if (!rawDataUrl) return;

      // Compress via Canvas to ensure optimal resolution and small size (< 150KB)
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1080;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (ctx) {
          ctx.drawImage(img, 0, 0, width, height);
          const compressedDataUrl = canvas.toDataURL("image/jpeg", 0.82);

          // Upload to server storage
          fetch("/api/upload-image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              imageBase64: compressedDataUrl,
              filename: file.name || "hero_bg.jpg",
            }),
          })
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => {
              const finalUrl = data?.url || compressedDataUrl;
              setFormData((prev) => {
                const next = { ...prev, heroBackgroundImage: finalUrl };
                onUpdateConfig(next);
                return next;
              });
              onNotice?.("📸 Background photo uploaded & published live across all devices!");
            })
            .catch(() => {
              setFormData((prev) => {
                const next = { ...prev, heroBackgroundImage: compressedDataUrl };
                onUpdateConfig(next);
                return next;
              });
              onNotice?.("📸 Background photo saved & synced!");
            });
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
    onNotice?.("✅ Website background & details successfully published!");
  };

  const handleReset = () => {
    if (confirm("Reset all website texts, hero background image, and contact details to original Kolkata cafe defaults?")) {
      setFormData(DEFAULT_WEBSITE_CONFIG);
      onUpdateConfig(DEFAULT_WEBSITE_CONFIG);
      onNotice?.("Website texts and background reset to defaults.");
    }
  };

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-3xl bg-[#1E2B25] border border-[#F5E086]/25 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-[#F5E086] text-[#24332D] flex items-center justify-center font-black">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-niea font-bold text-lg text-[#F5E086]">
                Website Hero Background & Content Customizer
              </h3>
              <p className="text-xs text-white/60">
                Change landing page background image, hero titles, announcements, cafe timings, and contact details
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isSaved && (
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30 flex items-center gap-1.5 animate-in fade-in">
                <Check className="w-3.5 h-3.5" />
                <span>Live on Website</span>
              </span>
            )}
            <button
              type="button"
              onClick={handleReset}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Defaults</span>
            </button>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          {/* SECTION 1: LANDING PAGE BACKGROUND IMAGE CUSTOMIZER */}
          <div className="p-4 rounded-2xl bg-[#14201B] border border-[#F5E086]/30 space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-[#F5E086] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <ImageIcon className="w-4 h-4 text-[#F5E086]" />
                <span>1. Landing Page Background Image (Owner Controlled)</span>
              </h4>
              <span className="text-[10px] text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full font-bold">
                Active on Home Page
              </span>
            </div>

            {/* Presets Row */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-white/80 font-bold block">Quick Presets (Click to Auto-Apply & Sync)</label>
                <span className="text-[10px] text-[#F5E086] font-semibold">⚡ Instant Sync on Click</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    const next = { ...formData, heroBackgroundImage: "/PHOTO-2026-10-02-15-59-48.jpg" };
                    setFormData(next);
                    onUpdateConfig(next);
                    setIsSaved(true);
                    setTimeout(() => setIsSaved(false), 2500);
                    onNotice?.("📸 Background set to 'Cafe Storefront at Night' & synced live to all devices!");
                  }}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
                    (formData.heroBackgroundImage || "/PHOTO-2026-10-02-15-59-48.jpg") === "/PHOTO-2026-10-02-15-59-48.jpg"
                      ? "bg-[#25372E] border-[#F5E086] text-[#F5E086] ring-2 ring-[#F5E086]/30"
                      : "bg-[#1A2520] border-white/10 text-white/70 hover:border-white/30"
                  }`}
                >
                  <img
                    src="/PHOTO-2026-10-02-15-59-48.jpg"
                    alt=""
                    className="w-12 h-9 rounded-lg object-cover shrink-0 border border-white/10"
                  />
                  <div>
                    <span className="font-bold block text-xs">Cafe Storefront at Night</span>
                    <span className="text-[10px] opacity-75">Neon sign & cozy night patrons (Default)</span>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const next = { ...formData, heroBackgroundImage: "/Niea's_PNG_cropped.png" };
                    setFormData(next);
                    onUpdateConfig(next);
                    setIsSaved(true);
                    setTimeout(() => setIsSaved(false), 2500);
                    onNotice?.("📸 Background set to 'Official NiEA's Cat Artwork' & synced live to all devices!");
                  }}
                  className={`p-2.5 rounded-xl border text-left flex items-center gap-3 transition cursor-pointer ${
                    formData.heroBackgroundImage === "/Niea's_PNG_cropped.png"
                      ? "bg-[#25372E] border-[#F5E086] text-[#F5E086] ring-2 ring-[#F5E086]/30"
                      : "bg-[#1A2520] border-white/10 text-white/70 hover:border-white/30"
                  }`}
                >
                  <img
                    src="/Niea's_PNG_cropped.png"
                    alt=""
                    className="w-12 h-9 rounded-lg object-contain bg-black/40 p-1 shrink-0 border border-white/10"
                  />
                  <div>
                    <span className="font-bold block text-xs">Official NiEA's Cat Artwork</span>
                    <span className="text-[10px] opacity-75">Illustrated logo wordmark</span>
                  </div>
                </button>
              </div>
            </div>

            {/* Custom URL or File Upload */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="text-white/80 font-bold block mb-1">
                  Custom Image URL or Path
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="/PHOTO-2026-10-02-15-59-48.jpg or https://..."
                    value={formData.heroBackgroundImage || ""}
                    onChange={(e) => handleChange("heroBackgroundImage", e.target.value)}
                    onBlur={() => {
                      if (formData.heroBackgroundImage) {
                        onUpdateConfig(formData);
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        onUpdateConfig(formData);
                        setIsSaved(true);
                        setTimeout(() => setIsSaved(false), 2500);
                        onNotice?.("📸 Background updated & synced!");
                      }
                    }}
                    className="flex-1 bg-[#1A2520] border border-white/15 rounded-xl px-3 py-2 text-white text-xs focus:outline-none focus:border-[#F5E086]"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      onUpdateConfig(formData);
                      setIsSaved(true);
                      setTimeout(() => setIsSaved(false), 2500);
                      onNotice?.("📸 Custom background saved & broadcast live!");
                    }}
                    className="px-3 py-2 bg-[#F5E086] text-[#24332D] font-bold text-xs rounded-xl hover:bg-[#F8E79B] transition shrink-0 cursor-pointer"
                  >
                    Apply URL
                  </button>
                </div>
              </div>

              <div>
                <label className="text-white/80 font-bold block mb-1">
                  Upload from Device
                </label>
                <label className="w-full py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 border border-white/15 text-white text-xs font-semibold flex items-center justify-center gap-1.5 cursor-pointer transition">
                  <Upload className="w-3.5 h-3.5 text-[#F5E086]" />
                  <span>Choose Photo</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    className="hidden"
                  />
                </label>
              </div>
            </div>

            {/* Overlay Tint Opacity Slider (Full 0% to 100% Dynamic Dim Range) */}
            <div className="p-3 rounded-xl bg-[#1A2520] border border-white/10 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-white/90 font-bold flex items-center gap-1.5">
                  <Sliders className="w-3.5 h-3.5 text-[#e1ad01]" />
                  <span>Dim Background Effect (Dark to Bright)</span>
                </span>
                <span className="font-mono text-[#e1ad01] font-bold text-sm bg-black/40 px-2 py-0.5 rounded-md border border-[#e1ad01]/30">
                  {Math.round((formData.heroBackgroundOverlayOpacity ?? 0.45) * 100)}% Dim
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.01"
                value={formData.heroBackgroundOverlayOpacity ?? 0.45}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  handleChange("heroBackgroundOverlayOpacity", val);
                }}
                onMouseUp={() => onUpdateConfig(formData)}
                onTouchEnd={() => onUpdateConfig(formData)}
                className="w-full accent-[#e1ad01] cursor-pointer"
              />
              <div className="flex items-center justify-between text-[10px] text-white/60 pt-0.5 font-medium">
                <span>0% (Full Bright / No Dim)</span>
                <span>25% (Light)</span>
                <span>50% (Balanced)</span>
                <span>75% (Deep)</span>
                <span>100% (Solid Dark)</span>
              </div>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {[
                  { label: "0% Bright", val: 0.0 },
                  { label: "20% Mild", val: 0.2 },
                  { label: "45% Default", val: 0.45 },
                  { label: "70% Dark", val: 0.7 },
                  { label: "90% Max Dark", val: 0.9 },
                ].map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => {
                      const next = { ...formData, heroBackgroundOverlayOpacity: preset.val };
                      setFormData(next);
                      onUpdateConfig(next);
                    }}
                    className={`px-2 py-1 rounded-md text-[10px] font-semibold transition ${
                      Math.abs((formData.heroBackgroundOverlayOpacity ?? 0.45) - preset.val) < 0.05
                        ? "bg-[#e1ad01] text-[#1E2B25] font-bold"
                        : "bg-white/10 hover:bg-white/20 text-white/80"
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
              <span className="text-[10px] text-white/50 block">
                Adjusts dark dimming effect so text & "Order Now" button contrast perfectly over bright background photos.
              </span>
            </div>

            {/* Live Preview Card & Direct Publish Button */}
            <div className="space-y-2">
              <div className="relative rounded-2xl overflow-hidden h-36 border border-white/15 shadow-inner">
                <img
                  src={formData.heroBackgroundImage || "/PHOTO-2026-10-02-15-59-48.jpg"}
                  alt="Preview"
                  className="w-full h-full object-cover object-center"
                />
                <div
                  className="absolute inset-0 bg-[#121B17]"
                  style={{ opacity: formData.heroBackgroundOverlayOpacity ?? 0.45 }}
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center p-3 text-center pointer-events-none">
                  <span className="text-[9px] font-bold px-2.5 py-0.5 rounded-full bg-[#1F2F28]/80 text-[#F5E086] border border-[#F5E086]/30 mb-1">
                    {formData.heroPillText || "ARTISANAL SOURDOUGH & SPECIALTY SANDWICHES • KOLKATA"}
                  </span>
                  <span className="font-serif text-lg font-bold text-[#F5E086] drop-shadow-md">
                    {formData.heroTitle || "NiEA'S Sandwich Bar"}
                  </span>
                  <span className="text-[10px] text-white/80 line-clamp-1 max-w-sm mt-0.5">
                    {formData.tagline}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-[11px] text-emerald-300 font-medium flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>Real-time Live Sync Active across all laptops & devices</span>
                </span>
                <button
                  type="button"
                  onClick={() => {
                    onUpdateConfig(formData);
                    setIsSaved(true);
                    setTimeout(() => setIsSaved(false), 2500);
                    onNotice?.("⚡ Background photo & overlay settings broadcasted live to all devices!");
                  }}
                  className="px-3.5 py-1.5 bg-[#F5E086] text-[#24332D] font-bold text-xs rounded-xl hover:bg-[#F8E79B] transition flex items-center gap-1.5 cursor-pointer shadow"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Publish Background Now</span>
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 2: FRONT PAGE TEXT VISIBILITY TOGGLES (OWNER CONTROLS TO REMOVE WRITING) */}
          <div className="p-4 rounded-2xl bg-[#14201B] border border-[#e1ad01]/40 space-y-3.5">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-[#e1ad01] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Eye className="w-4 h-4 text-[#e1ad01]" />
                <span>Front Page Text Visibility (Show or Remove Texts)</span>
              </h4>
              <span className="text-[10px] text-white/60">Toggle to hide any writing on front page</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {/* Toggle 1: NiEA's Sandwich Bar writing */}
              <div className="p-3 rounded-xl bg-[#1A2520] border border-white/10 flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-white text-xs block">"NiEA'S Sandwich Bar" Writing</span>
                  <span className="text-[10px] text-white/50 block">Front page large hero brand headline</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = formData.showHeroTitle === false ? true : false;
                    handleChange("showHeroTitle", nextVal);
                    onUpdateConfig({ ...formData, showHeroTitle: nextVal });
                    onNotice?.(nextVal ? "Front page title restored." : "Front page title removed.");
                  }}
                  className={`px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                    formData.showHeroTitle !== false
                      ? "bg-emerald-500 text-white shadow-xs"
                      : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  }`}
                >
                  {formData.showHeroTitle !== false ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Shown</span>
                    </>
                  ) : (
                    <>
                      <X className="w-3 h-3" />
                      <span>Removed</span>
                    </>
                  )}
                </button>
              </div>

              {/* Toggle 2: Top category pill text */}
              <div className="p-3 rounded-xl bg-[#1A2520] border border-white/10 flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-white text-xs block">Top Category Pill Text</span>
                  <span className="text-[10px] text-white/50 block">"Artisanal Sourdough & Specialty Sandwiches"</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = formData.showHeroPill === false ? true : false;
                    handleChange("showHeroPill", nextVal);
                    onUpdateConfig({ ...formData, showHeroPill: nextVal });
                    onNotice?.(nextVal ? "Top pill badge restored." : "Top pill badge removed.");
                  }}
                  className={`px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                    formData.showHeroPill !== false
                      ? "bg-emerald-500 text-white shadow-xs"
                      : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  }`}
                >
                  {formData.showHeroPill !== false ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Shown</span>
                    </>
                  ) : (
                    <>
                      <X className="w-3 h-3" />
                      <span>Removed</span>
                    </>
                  )}
                </button>
              </div>

              {/* Toggle 3: Subtitle / Tagline */}
              <div className="p-3 rounded-xl bg-[#1A2520] border border-white/10 flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-white text-xs block">Hero Tagline / Subtitle Text</span>
                  <span className="text-[10px] text-white/50 block">Descriptive paragraph under the hero title</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = formData.showHeroTagline === false ? true : false;
                    handleChange("showHeroTagline", nextVal);
                    onUpdateConfig({ ...formData, showHeroTagline: nextVal });
                    onNotice?.(nextVal ? "Hero tagline restored." : "Hero tagline removed.");
                  }}
                  className={`px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                    formData.showHeroTagline !== false
                      ? "bg-emerald-500 text-white shadow-xs"
                      : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  }`}
                >
                  {formData.showHeroTagline !== false ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Shown</span>
                    </>
                  ) : (
                    <>
                      <X className="w-3 h-3" />
                      <span>Removed</span>
                    </>
                  )}
                </button>
              </div>

              {/* Toggle 4: Sandwiches Remaining Counter */}
              <div className="p-3 rounded-xl bg-[#1A2520] border border-white/10 flex items-center justify-between gap-3">
                <div>
                  <span className="font-bold text-white text-xs block">Sandwiches Left Counter</span>
                  <span className="text-[10px] text-white/50 block">Live portion counter badge on hero</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = formData.showHeroSandwichCount === false ? true : false;
                    handleChange("showHeroSandwichCount", nextVal);
                    onUpdateConfig({ ...formData, showHeroSandwichCount: nextVal });
                    onNotice?.(nextVal ? "Sandwich counter restored." : "Sandwich counter removed.");
                  }}
                  className={`px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                    formData.showHeroSandwichCount !== false
                      ? "bg-emerald-500 text-white shadow-xs"
                      : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  }`}
                >
                  {formData.showHeroSandwichCount !== false ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Shown</span>
                    </>
                  ) : (
                    <>
                      <X className="w-3 h-3" />
                      <span>Removed</span>
                    </>
                  )}
                </button>
              </div>

              {/* Toggle 5: Operating Hours & Address Line */}
              <div className="p-3 rounded-xl bg-[#1A2520] border border-white/10 flex items-center justify-between gap-3 sm:col-span-2">
                <div>
                  <span className="font-bold text-white text-xs block">Operating Hours & Address Line</span>
                  <span className="text-[10px] text-white/50 block">Timing and location details below buttons</span>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    const nextVal = formData.showHeroOperatingInfo === false ? true : false;
                    handleChange("showHeroOperatingInfo", nextVal);
                    onUpdateConfig({ ...formData, showHeroOperatingInfo: nextVal });
                    onNotice?.(nextVal ? "Hours & address line restored." : "Hours & address line removed.");
                  }}
                  className={`px-3 py-1.5 rounded-full font-bold text-xs flex items-center gap-1.5 transition cursor-pointer ${
                    formData.showHeroOperatingInfo !== false
                      ? "bg-emerald-500 text-white shadow-xs"
                      : "bg-rose-500/20 text-rose-300 border border-rose-500/40"
                  }`}
                >
                  {formData.showHeroOperatingInfo !== false ? (
                    <>
                      <Check className="w-3 h-3" />
                      <span>Shown</span>
                    </>
                  ) : (
                    <>
                      <X className="w-3 h-3" />
                      <span>Removed</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 3: "ORDER NOW" BUTTON CUSTOMIZER (SIZE & MUSTARD YELLOW #e1ad01) */}
          <div className="p-4 rounded-2xl bg-[#14201B] border border-[#e1ad01]/40 space-y-3.5">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-[#e1ad01] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-[#e1ad01]" />
                <span>"Order Now" Button Customizer (Size & Mustard Yellow #e1ad01)</span>
              </h4>
              <span className="text-[10px] text-[#e1ad01] font-bold bg-[#e1ad01]/10 px-2 py-0.5 rounded-full border border-[#e1ad01]/30">
                Color: Mustard Yellow #e1ad01 (No Emoji)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              {/* Size Preset Selector */}
              <div>
                <label className="text-white/80 font-bold block mb-1">Button Size Preset</label>
                <div className="grid grid-cols-4 gap-1.5">
                  {(["sm", "md", "lg", "xl"] as const).map((sz) => (
                    <button
                      key={sz}
                      type="button"
                      onClick={() => {
                        const next = { ...formData, orderNowButtonSize: sz };
                        setFormData(next);
                        onUpdateConfig(next);
                      }}
                      className={`py-2 px-1 rounded-xl text-center font-bold text-xs capitalize transition cursor-pointer ${
                        (formData.orderNowButtonSize || "md") === sz
                          ? "bg-[#e1ad01] text-[#1E2B25] shadow-md ring-2 ring-[#e1ad01]/50 font-black"
                          : "bg-white/10 hover:bg-white/15 text-white/80"
                      }`}
                    >
                      {sz === "sm" ? "Small" : sz === "md" ? "Medium" : sz === "lg" ? "Large" : "Extra L"}
                    </button>
                  ))}
                </div>
              </div>

              {/* Exact Font Size Slider */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-white/80 font-bold">Button Font Size</label>
                  <span className="text-[#e1ad01] font-mono font-bold">
                    {formData.orderNowButtonFontSize || 15}px
                  </span>
                </div>
                <input
                  type="range"
                  min="12"
                  max="24"
                  step="1"
                  value={formData.orderNowButtonFontSize || 15}
                  onChange={(e) => {
                    const val = parseInt(e.target.value, 10);
                    handleChange("orderNowButtonFontSize", val);
                  }}
                  onMouseUp={() => onUpdateConfig(formData)}
                  onTouchEnd={() => onUpdateConfig(formData)}
                  className="w-full accent-[#e1ad01] cursor-pointer"
                />
                <span className="text-[10px] text-white/50 block mt-0.5">
                  Adjust button text scale smoothly from 12px up to 24px.
                </span>
              </div>
            </div>

            {/* Live Button Preview Card */}
            <div className="p-3 rounded-xl bg-[#1A2520] border border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-white/70">Live Button Appearance:</span>
              <button
                type="button"
                style={{
                  fontSize: `${formData.orderNowButtonFontSize || 15}px`,
                }}
                className={`rounded-full bg-[#e1ad01] hover:bg-[#cca000] text-[#1E2B25] font-black transition-all shadow-[0_0_24px_rgba(225,173,1,0.65)] border border-[#ffd233] tracking-wide cursor-pointer ${
                  (formData.orderNowButtonSize || "md") === "sm"
                    ? "px-5 py-2"
                    : (formData.orderNowButtonSize || "md") === "md"
                    ? "px-7 py-2.5"
                    : (formData.orderNowButtonSize || "md") === "lg"
                    ? "px-9 py-3"
                    : "px-11 py-3.5"
                }`}
              >
                Order Now
              </button>
            </div>
          </div>

          {/* SECTION 4: HERO & BRANDING TEXT */}
          <div className="space-y-3 pt-2">
            <h4 className="font-bold text-[#F5E086] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>4. Hero Typography & Copy (Text Inputs)</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-white/80 font-bold block mb-1">Hero Main Title</label>
                <input
                  type="text"
                  required
                  value={formData.heroTitle || "NiEA'S Sandwich Bar"}
                  onChange={(e) => handleChange("heroTitle", e.target.value)}
                  className="w-full bg-[#1A2520] border border-white/15 rounded-xl px-3 py-2 text-white font-serif text-sm focus:outline-none focus:border-[#F5E086]"
                />
              </div>

              <div>
                <label className="text-white/80 font-bold block mb-1">Top Pill Category Text</label>
                <input
                  type="text"
                  required
                  value={formData.heroPillText || "ARTISANAL SOURDOUGH & SPECIALTY SANDWICHES • KOLKATA"}
                  onChange={(e) => handleChange("heroPillText", e.target.value)}
                  className="w-full bg-[#1A2520] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#F5E086]"
                />
              </div>

              <div>
                <label className="text-white/80 font-bold block mb-1">Cafe Brand Name (Footer / Global)</label>
                <input
                  type="text"
                  required
                  value={formData.cafeName}
                  onChange={(e) => handleChange("cafeName", e.target.value)}
                  className="w-full bg-[#1A2520] border border-white/15 rounded-xl px-3 py-2 text-white font-niea text-sm focus:outline-none focus:border-[#F5E086]"
                />
              </div>

              <div>
                <label className="text-white/80 font-bold block mb-1">Top Announcement Marquee</label>
                <input
                  type="text"
                  required
                  value={formData.announcement}
                  onChange={(e) => handleChange("announcement", e.target.value)}
                  className="w-full bg-[#1A2520] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#F5E086]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-white/80 font-bold block mb-1">Hero Tagline / Subtitle</label>
                <textarea
                  rows={2}
                  required
                  value={formData.tagline}
                  onChange={(e) => handleChange("tagline", e.target.value)}
                  className="w-full bg-[#1A2520] border border-white/15 rounded-xl p-3 text-white focus:outline-none focus:border-[#F5E086]"
                />
              </div>
            </div>
          </div>

          {/* SECTION 2: HOURS & LOCATION */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <h4 className="font-bold text-[#F5E086] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>2. Cafe Hours, Contact & Store Location</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
              <div>
                <label className="text-white/80 font-bold block mb-1">Operating Hours</label>
                <input
                  type="text"
                  required
                  value={formData.weekdayHours}
                  onChange={(e) => handleChange("weekdayHours", e.target.value)}
                  className="w-full bg-[#1A2520] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#F5E086]"
                />
              </div>

              <div>
                <label className="text-white/80 font-bold block mb-1">Weekly Off Day</label>
                <input
                  type="text"
                  value={formData.closedDay}
                  onChange={(e) => handleChange("closedDay", e.target.value)}
                  className="w-full bg-[#1A2520] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#F5E086]"
                />
              </div>

              <div>
                <label className="text-white/80 font-bold block mb-1">Kitchen Last Call Time</label>
                <input
                  type="text"
                  value={formData.kitchenLastCall}
                  onChange={(e) => handleChange("kitchenLastCall", e.target.value)}
                  className="w-full bg-[#1A2520] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#F5E086]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-white/80 font-bold block mb-1">Store Address (New Town)</label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => handleChange("address", e.target.value)}
                  className="w-full bg-[#1A2520] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#F5E086]"
                />
              </div>

              <div>
                <label className="text-white/80 font-bold block mb-1">Official Cafe Phone</label>
                <input
                  type="text"
                  required
                  value={formData.phone}
                  onChange={(e) => handleChange("phone", e.target.value)}
                  className="w-full bg-[#1A2520] border border-white/15 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#F5E086]"
                />
              </div>

              <div>
                <label className="text-white/80 font-bold block mb-1">Customer Wi-Fi SSID</label>
                <input
                  type="text"
                  value={formData.wifiName}
                  onChange={(e) => handleChange("wifiName", e.target.value)}
                  className="w-full bg-[#1A2520] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#F5E086]"
                />
              </div>

              <div>
                <label className="text-white/80 font-bold block mb-1">FSSAI License #</label>
                <input
                  type="text"
                  value={formData.fssaiNumber}
                  onChange={(e) => handleChange("fssaiNumber", e.target.value)}
                  className="w-full bg-[#1A2520] border border-white/15 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#F5E086]"
                />
              </div>

              <div>
                <label className="text-white/80 font-bold block mb-1">GSTIN Number</label>
                <input
                  type="text"
                  value={formData.gstin}
                  onChange={(e) => handleChange("gstin", e.target.value)}
                  className="w-full bg-[#1A2520] border border-white/15 rounded-xl px-3 py-2 text-white font-mono focus:outline-none focus:border-[#F5E086]"
                />
              </div>
            </div>
          </div>

          {/* SECTION 3: FOOTER & SOCIAL STORY */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <h4 className="font-bold text-[#F5E086] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" />
              <span>3. Footer Story & Instagram Handle</span>
            </h4>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
              <div>
                <label className="text-white/80 font-bold block mb-1">Instagram Handle</label>
                <input
                  type="text"
                  value={formData.instagramHandle}
                  onChange={(e) => handleChange("instagramHandle", e.target.value)}
                  className="w-full bg-[#1A2520] border border-white/15 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-[#F5E086]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="text-white/80 font-bold block mb-1">Footer About Story Paragraph</label>
                <textarea
                  rows={2}
                  value={formData.footerStory}
                  onChange={(e) => handleChange("footerStory", e.target.value)}
                  className="w-full bg-[#1A2520] border border-white/15 rounded-xl p-3 text-white focus:outline-none focus:border-[#F5E086]"
                />
              </div>
            </div>
          </div>

          {/* SECTION 4: FLOATING TUXEDO CAT MASCOT */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <h4 className="font-bold text-[#F5E086] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <span>🐱</span>
              <span>4. Floating Tuxedo Cat Mascot (Menu Opener)</span>
            </h4>

            <div className="p-4 rounded-2xl bg-[#1A2520] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Interactive NiEA Mascot on Customer Website</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                    isFloatingCatEnabled ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40" : "bg-white/10 text-white/40"
                  }`}>
                    {isFloatingCatEnabled ? "Active (Click Opens Menu)" : "Disabled"}
                  </span>
                </p>
                <p className="text-[11px] text-white/60 mt-1">
                  When enabled, the cute animated tuxedo cat floats on the bottom corner of the website. Clicking the cat instantly opens the food & beverage menu for customers!
                </p>
              </div>

              {onToggleFloatingCat && (
                <button
                  type="button"
                  onClick={() => {
                    const next = !isFloatingCatEnabled;
                    onToggleFloatingCat(next);
                    onNotice?.(`Mascot ${next ? "enabled" : "disabled"} on customer website.`);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border self-start sm:self-auto shrink-0 shadow-sm cursor-pointer"
                  style={{
                    backgroundColor: isFloatingCatEnabled ? "#F5E086" : "rgba(255,255,255,0.08)",
                    color: isFloatingCatEnabled ? "#24332D" : "#ffffff",
                    borderColor: isFloatingCatEnabled ? "#F5E086" : "rgba(255,255,255,0.15)",
                  }}
                >
                  {isFloatingCatEnabled ? (
                    <>
                      <ToggleRight className="w-5 h-5 text-[#24332D]" />
                      <span>Mascot: ON</span>
                    </>
                  ) : (
                    <>
                      <ToggleLeft className="w-5 h-5 text-white/50" />
                      <span>Mascot: OFF</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* SECTION 5: TABLE RESERVATIONS FEATURE (FUTURE MODE) */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <h4 className="font-bold text-[#F5E086] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <CalendarCheck className="w-3.5 h-3.5" />
              <span>5. Table Reservations System (Future Mode Toggle)</span>
            </h4>

            <div className="p-4 rounded-2xl bg-[#1A2520] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Table Reservations on Landing Page & Navigation</span>
                  <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                    formData.isReservationEnabled !== false ? "bg-emerald-500/20 text-emerald-300 border border-emerald-400/40" : "bg-amber-500/20 text-amber-300 border border-amber-400/40"
                  }`}>
                    {formData.isReservationEnabled !== false ? "Enabled" : "Disabled (Coming in Future)"}
                  </span>
                </p>
                <p className="text-[11px] text-white/60 mt-1">
                  When disabled: The 'Book Table' button is removed from the landing page, the 'Order Now' button is enlarged and centered, and navigation tabs display 'Coming Soon'.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const nextVal = !(formData.isReservationEnabled ?? false);
                  handleChange("isReservationEnabled", nextVal);
                  onNotice?.(`Table reservations ${nextVal ? "enabled" : "disabled (Coming in Future mode active)"}.`);
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border self-start sm:self-auto shrink-0 shadow-sm cursor-pointer"
                style={{
                  backgroundColor: formData.isReservationEnabled !== false ? "rgba(244,63,94,0.15)" : "#F5E086",
                  color: formData.isReservationEnabled !== false ? "#fda4af" : "#24332D",
                  borderColor: formData.isReservationEnabled !== false ? "rgba(244,63,94,0.4)" : "#F5E086",
                }}
              >
                {formData.isReservationEnabled !== false ? (
                  <>
                    <ToggleRight className="w-5 h-5 text-rose-300" />
                    <span>Disable Reservations</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-5 h-5 text-[#24332D]/70" />
                    <span>Enable Reservations</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* SECTION 5.5: APPLE LIQUID GLASS & TACTILE JIGGLE UI */}
          <div className="space-y-3 pt-2 border-t border-white/10">
            <h4 className="font-bold text-[#F5E086] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" />
              <span>6. Apple Liquid Glass UI & Dynamic Physics Mode</span>
            </h4>

            <div className="p-4 rounded-2xl bg-[#1A2520] border border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <p className="text-xs font-bold text-white flex items-center gap-1.5">
                  <span>Apple Liquid Glass Aesthetic & Jiggly Physics</span>
                  <span
                    className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase ${
                      formData.isLiquidGlassEnabled !== false
                        ? "bg-amber-400/20 text-[#F5E086] border border-[#F5E086]/40"
                        : "bg-white/10 text-white/50"
                    }`}
                  >
                    {formData.isLiquidGlassEnabled !== false ? "Liquid Glass Active" : "Classic Solid UI"}
                  </span>
                </p>
                <p className="text-[11px] text-white/60 mt-1">
                  When enabled: Controls and buttons feature realistic liquid light refractions, specular highlights, and fluid harmonic jiggle compression on tap. When disabled, elements use crisp classic solid UI.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  const nextVal = !(formData.isLiquidGlassEnabled ?? true);
                  handleChange("isLiquidGlassEnabled", nextVal);
                  if (typeof window !== "undefined") {
                    document.documentElement.setAttribute("data-liquid-glass", nextVal ? "true" : "false");
                    localStorage.setItem("niea_liquid_glass_enabled", nextVal ? "true" : "false");
                  }
                  onNotice?.(
                    nextVal
                      ? "✨ Liquid Glass UI enabled across website!"
                      : "🌿 Classic Solid UI enabled across website!"
                  );
                }}
                className="px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 border self-start sm:self-auto shrink-0 shadow-sm cursor-pointer"
                style={{
                  backgroundColor: formData.isLiquidGlassEnabled !== false ? "#F5E086" : "rgba(255,255,255,0.08)",
                  color: formData.isLiquidGlassEnabled !== false ? "#24332D" : "#ffffff",
                  borderColor: formData.isLiquidGlassEnabled !== false ? "#F5E086" : "rgba(255,255,255,0.15)",
                }}
              >
                {formData.isLiquidGlassEnabled !== false ? (
                  <>
                    <ToggleRight className="w-5 h-5 text-[#24332D]" />
                    <span>Liquid Glass: ON</span>
                  </>
                ) : (
                  <>
                    <ToggleLeft className="w-5 h-5 text-white/50" />
                    <span>Liquid Glass: OFF</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* SECTION 7: WEBSITE BRAND TYPOGRAPHY & TEXT SCALE SLIDER */}
          <div className="space-y-4 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-[#F5E086] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Type className="w-3.5 h-3.5" />
                <span>7. Brand Typography & Global Text Scale</span>
              </h4>
              <span className="text-[10px] text-white/50">Owner-only brand styling • Cloud synced to all visitors</span>
            </div>

            {/* Typography Font Dropdown Selection with 17+ Google Fonts */}
            <div className="space-y-2 p-4 rounded-2xl bg-[#1A2520] border border-white/10">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <label className="text-xs text-white font-bold block flex items-center gap-1.5">
                    <span>Primary Website Typeface</span>
                    <span className="text-[10px] text-[#F5E086] font-normal font-mono">
                      ({FONT_REGISTRY.length} Google Fonts Available)
                    </span>
                  </label>
                  <p className="text-[11px] text-white/60">
                    Sets the universal font for menus, descriptions, prices, buttons, and customer viewports.
                  </p>
                </div>

                {/* Dropdown Menu */}
                <div className="relative min-w-[240px]">
                  <select
                    value={formData.fontFamily || "jakarta"}
                    onChange={(e) => {
                      const selectedId = e.target.value;
                      handleChange("fontFamily", selectedId);
                      applyGlobalTypography(
                        selectedId,
                        formData.fontScalePercent || 100,
                        formData.heroTitleFontFamily,
                        formData.heroTitleFontSize
                      );
                      const fontObj = getFontById(selectedId);
                      onNotice?.(`🔤 Primary font updated to ${fontObj.name} (${fontObj.styleLabel})`);
                    }}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#24332D] text-white font-bold text-xs border border-white/20 focus:outline-none focus:border-[#F5E086] cursor-pointer shadow-sm"
                  >
                    <optgroup label="Modern Clean & Sans-Serif">
                      {FONT_REGISTRY.filter((f) => f.category === "sans").map((f) => (
                        <option key={f.id} value={f.id} className="bg-[#24332D] text-white py-1">
                          {f.name} — {f.styleLabel}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Luxury & Artisanal Serif">
                      {FONT_REGISTRY.filter((f) => f.category === "serif").map((f) => (
                        <option key={f.id} value={f.id} className="bg-[#24332D] text-white py-1">
                          {f.name} — {f.styleLabel}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Modern Display & Impact Signage">
                      {FONT_REGISTRY.filter((f) => f.category === "display").map((f) => (
                        <option key={f.id} value={f.id} className="bg-[#24332D] text-white py-1">
                          {f.name} — {f.styleLabel}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Artisanal Handcrafted & Script">
                      {FONT_REGISTRY.filter((f) => f.category === "handwriting").map((f) => (
                        <option key={f.id} value={f.id} className="bg-[#24332D] text-white py-1">
                          {f.name} — {f.styleLabel}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>
              </div>

              {/* Live Specimen Preview of Selected Font */}
              {(() => {
                const currentFont = getFontById(formData.fontFamily || "jakarta");
                return (
                  <div
                    style={{ fontFamily: currentFont.fontFamilyCss }}
                    className="mt-2 p-3 rounded-xl bg-[#202E27] border border-[#F5E086]/20 flex flex-col sm:flex-row sm:items-center justify-between gap-2"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-[#F5E086]">{currentFont.name}</span>
                        <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-[#F5E086]/15 text-[#F5E086] border border-[#F5E086]/30">
                          {currentFont.styleLabel}
                        </span>
                      </div>
                      <p className="text-xs text-white/90 mt-1">
                        Cultured Artisanal Sourdough Melts, Fresh Bakes & Specialty Brews
                      </p>
                    </div>
                    <span className="text-[10px] text-white/50 font-sans italic self-start sm:self-auto shrink-0">
                      {currentFont.description}
                    </span>
                  </div>
                );
              })()}
            </div>

            {/* Interactive Website Text Scale Slider */}
            <div className="space-y-3 p-4 rounded-2xl bg-[#1A2520] border border-white/10">
              <div className="flex items-center justify-between">
                <div>
                  <label className="text-xs text-white font-bold block flex items-center gap-1.5">
                    <Sliders className="w-3.5 h-3.5 text-[#F5E086]" />
                    <span>Website Text Scale (Continuous Slider)</span>
                  </label>
                  <p className="text-[11px] text-white/60">
                    Adjusts the base font scale universally across mobile, tablet, and desktop viewports.
                  </p>
                </div>

                <div className="px-3 py-1 rounded-xl bg-[#25372E] border border-[#F5E086]/40 text-[#F5E086] font-mono font-bold text-xs shrink-0 shadow-sm">
                  {formData.fontScalePercent || 100}% Scale (
                  {(((formData.fontScalePercent || 100) * 16) / 100).toFixed(1)}px base)
                </div>
              </div>

              {/* Range Slider Control */}
              <div className="space-y-2 pt-1">
                <input
                  type="range"
                  min="85"
                  max="140"
                  step="1"
                  value={formData.fontScalePercent || 100}
                  onChange={(e) => {
                    const newScale = parseInt(e.target.value, 10);
                    handleChange("fontScalePercent", newScale);
                    applyGlobalTypography(
                      formData.fontFamily || "jakarta",
                      newScale,
                      formData.heroTitleFontFamily,
                      formData.heroTitleFontSize
                    );
                  }}
                  className="w-full h-2 rounded-lg bg-[#24332D] accent-[#F5E086] cursor-pointer"
                />

                {/* Quick Preset Buttons */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  <span className="text-[10px] text-white/50 mr-1 font-semibold">Quick Presets:</span>
                  {[
                    { pct: 88, label: "88% Compact" },
                    { pct: 100, label: "100% Standard (Default)" },
                    { pct: 110, label: "110% Comfortable" },
                    { pct: 122, label: "122% High-Visibility" },
                    { pct: 135, label: "135% Senior / Extra Large" },
                  ].map((preset) => {
                    const isActive = (formData.fontScalePercent || 100) === preset.pct;
                    return (
                      <button
                        key={preset.pct}
                        type="button"
                        onClick={() => {
                          handleChange("fontScalePercent", preset.pct);
                          applyGlobalTypography(
                            formData.fontFamily || "jakarta",
                            preset.pct,
                            formData.heroTitleFontFamily,
                            formData.heroTitleFontSize
                          );
                          onNotice?.(`🔍 Text scale set to ${preset.label}`);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[10px] font-bold transition cursor-pointer border ${
                          isActive
                            ? "bg-[#F5E086] text-[#24332D] border-[#F5E086] shadow-xs"
                            : "bg-[#24332D] text-white/70 border-white/10 hover:border-white/30 hover:text-white"
                        }`}
                      >
                        {preset.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* SECTION 8: HERO MAIN TITLE FONT & SIZE CUSTOMIZER */}
          <div className="space-y-4 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-[#F5E086] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <TextQuote className="w-3.5 h-3.5" />
                <span>8. Hero Main Title Font & Size Customizer</span>
              </h4>
              <span className="text-[10px] text-white/50">Custom headline styling on Landing Page</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#1A2520] border border-white/10 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Hero Title Font Family Dropdown */}
                <div className="space-y-1.5">
                  <label className="text-xs text-white/80 font-bold block">
                    Hero Title Typeface
                  </label>
                  <select
                    value={formData.heroTitleFontFamily || "playfair"}
                    onChange={(e) => {
                      const selectedFont = e.target.value;
                      handleChange("heroTitleFontFamily", selectedFont);
                      applyGlobalTypography(
                        formData.fontFamily || "jakarta",
                        formData.fontScalePercent || 100,
                        selectedFont,
                        formData.heroTitleFontSize || 64
                      );
                      const fontObj = getFontById(selectedFont);
                      onNotice?.(`🎨 Hero title font set to ${fontObj.name}`);
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#24332D] text-white font-bold text-xs border border-white/20 focus:outline-none focus:border-[#F5E086] cursor-pointer shadow-sm"
                  >
                    <optgroup label="Luxury & Artisanal Serif">
                      {FONT_REGISTRY.filter((f) => f.category === "serif").map((f) => (
                        <option key={f.id} value={f.id} className="bg-[#24332D] text-white">
                          {f.name} — {f.styleLabel}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Modern Display & Impact Signage">
                      {FONT_REGISTRY.filter((f) => f.category === "display").map((f) => (
                        <option key={f.id} value={f.id} className="bg-[#24332D] text-white">
                          {f.name} — {f.styleLabel}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Modern Clean & Sans-Serif">
                      {FONT_REGISTRY.filter((f) => f.category === "sans").map((f) => (
                        <option key={f.id} value={f.id} className="bg-[#24332D] text-white">
                          {f.name} — {f.styleLabel}
                        </option>
                      ))}
                    </optgroup>
                    <optgroup label="Artisanal Handcrafted & Script">
                      {FONT_REGISTRY.filter((f) => f.category === "handwriting").map((f) => (
                        <option key={f.id} value={f.id} className="bg-[#24332D] text-white">
                          {f.name} — {f.styleLabel}
                        </option>
                      ))}
                    </optgroup>
                  </select>
                </div>

                {/* Hero Title Size Slider */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="text-xs text-white/80 font-bold block">
                      Hero Title Size
                    </label>
                    <span className="text-xs font-mono font-bold text-[#F5E086]">
                      {formData.heroTitleFontSize || 64}px
                    </span>
                  </div>
                  <input
                    type="range"
                    min="36"
                    max="96"
                    step="2"
                    value={formData.heroTitleFontSize || 64}
                    onChange={(e) => {
                      const newSize = parseInt(e.target.value, 10);
                      handleChange("heroTitleFontSize", newSize);
                      applyGlobalTypography(
                        formData.fontFamily || "jakarta",
                        formData.fontScalePercent || 100,
                        formData.heroTitleFontFamily || "playfair",
                        newSize
                      );
                    }}
                    className="w-full h-2 rounded-lg bg-[#24332D] accent-[#F5E086] cursor-pointer"
                  />

                  {/* Size Preset Pills */}
                  <div className="flex flex-wrap gap-1 pt-1">
                    {[
                      { size: 48, label: "48px Subtle" },
                      { size: 64, label: "64px Standard" },
                      { size: 76, label: "76px Large" },
                      { size: 88, label: "88px Mega" },
                    ].map((sz) => (
                      <button
                        key={sz.size}
                        type="button"
                        onClick={() => {
                          handleChange("heroTitleFontSize", sz.size);
                          applyGlobalTypography(
                            formData.fontFamily || "jakarta",
                            formData.fontScalePercent || 100,
                            formData.heroTitleFontFamily || "playfair",
                            sz.size
                          );
                          onNotice?.(`Hero title size set to ${sz.label}`);
                        }}
                        className={`px-2 py-0.5 rounded text-[9px] font-bold border transition cursor-pointer ${
                          (formData.heroTitleFontSize || 64) === sz.size
                            ? "bg-[#F5E086] text-[#24332D] border-[#F5E086]"
                            : "bg-[#24332D] text-white/70 border-white/10 hover:text-white"
                        }`}
                      >
                        {sz.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Hero Title Visual Specimen Box */}
              <div className="p-4 rounded-2xl bg-[#15201A] border border-[#F5E086]/25 text-center shadow-inner space-y-1">
                <span className="text-[10px] uppercase font-bold text-white/40 block tracking-widest">
                  Live Hero Title Rendering Preview
                </span>
                <h2
                  style={{
                    fontFamily: getFontById(formData.heroTitleFontFamily || "playfair").fontFamilyCss,
                    fontSize: `${Math.min(formData.heroTitleFontSize || 64, 56)}px`,
                  }}
                  className="font-normal text-[#F5E086] tracking-tight leading-tight drop-shadow-md"
                >
                  {formData.heroTitle || "NiEA'S Sandwich Bar"}
                </h2>
                <p className="text-[10px] text-white/50">
                  Typeface:{" "}
                  <strong className="text-[#F5E086]">
                    {getFontById(formData.heroTitleFontFamily || "playfair").name}
                  </strong>{" "}
                  • Rendered at {formData.heroTitleFontSize || 64}px scale
                </p>
              </div>
            </div>
          </div>

          {/* SECTION 9: OWNER SECURITY PIN & PASSCODE MANAGEMENT */}
          <div className="space-y-4 pt-3 border-t border-white/10">
            <div className="flex items-center justify-between">
              <h4 className="font-bold text-[#F5E086] uppercase tracking-wider text-[11px] flex items-center gap-1.5">
                <Lock className="w-3.5 h-3.5" />
                <span>9. Changeable Owner Portal Security PIN</span>
              </h4>
              <span className="text-[10px] text-white/50">Private Passcode Security</span>
            </div>

            <div className="p-4 rounded-2xl bg-[#1A2520] border border-white/10 space-y-3">
              <p className="text-xs text-white/80">
                Set a custom secret passcode to protect your Owner Portal, financials, stock manager, and live kitchen tickets.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-white/70 block">
                    New Security PIN
                  </label>
                  <input
                    type="password"
                    maxLength={10}
                    placeholder="Enter new 4-10 digit PIN"
                    value={newPasscode}
                    onChange={(e) => {
                      setNewPasscode(e.target.value);
                      setPasscodeUpdateNotice(null);
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#24332D] border border-white/15 text-white text-sm font-mono focus:outline-none focus:border-[#F5E086]"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-white/70 block">
                    Confirm New PIN
                  </label>
                  <input
                    type="password"
                    maxLength={10}
                    placeholder="Re-enter new PIN"
                    value={confirmPasscode}
                    onChange={(e) => {
                      setConfirmPasscode(e.target.value);
                      setPasscodeUpdateNotice(null);
                    }}
                    className="w-full px-3.5 py-2 rounded-xl bg-[#24332D] border border-white/15 text-white text-sm font-mono focus:outline-none focus:border-[#F5E086]"
                  />
                </div>
              </div>

              {passcodeUpdateNotice && (
                <p
                  className={`text-xs font-semibold flex items-center gap-1.5 ${
                    passcodeUpdateNotice.startsWith("✅") ? "text-emerald-400" : "text-rose-400"
                  }`}
                >
                  <span>{passcodeUpdateNotice}</span>
                </p>
              )}

              <div className="flex justify-end pt-1">
                <button
                  type="button"
                  onClick={() => {
                    if (!newPasscode.trim()) {
                      setPasscodeUpdateNotice("❌ Please enter a new PIN before saving.");
                      return;
                    }
                    if (newPasscode.trim().length < 4) {
                      setPasscodeUpdateNotice("❌ PIN must be at least 4 digits/characters.");
                      return;
                    }
                    if (newPasscode.trim() !== confirmPasscode.trim()) {
                      setPasscodeUpdateNotice("❌ New PIN and Confirm PIN do not match.");
                      return;
                    }

                    const updated = {
                      ...formData,
                      ownerPasscode: newPasscode.trim(),
                    };
                    setFormData(updated);
                    onUpdateConfig(updated);
                    setNewPasscode("");
                    setConfirmPasscode("");
                    setPasscodeUpdateNotice("✅ Security PIN successfully changed and saved to cloud!");
                    onNotice?.("🔒 Owner Portal PIN successfully updated!");
                    setTimeout(() => setPasscodeUpdateNotice(null), 5000);
                  }}
                  className="px-4 py-2 rounded-xl bg-[#F5E086] hover:bg-[#F8E79B] text-[#24332D] font-bold text-xs transition flex items-center gap-1.5 shadow-sm cursor-pointer"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Update & Save Security PIN</span>
                </button>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#F5E086] text-[#24332D] font-bold text-xs hover:bg-[#F8E79B] transition shadow-md flex items-center gap-2"
            >
              <Check className="w-4 h-4" />
              <span>Save & Publish All Website Content</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
