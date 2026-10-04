import React, { useState, useEffect, useRef } from "react";
import { Type, Check, ChevronDown, Sparkles } from "lucide-react";

export type FontFamilyType = "outfit" | "jakarta" | "playfair" | "inter";
export type FontScaleType = "normal" | "medium" | "large" | "xlarge";

export interface FontConfig {
  family: FontFamilyType;
  scale: FontScaleType;
}

const FONT_OPTIONS: { id: FontFamilyType; name: string; sample: string; desc: string }[] = [
  { id: "outfit", name: "NiEA Signature", sample: "Gourmet Artisanal Melts", desc: "Warm Outfit & Fredoka cafe styling" },
  { id: "jakarta", name: "Modern Clean", sample: "Crisp Precision Sourdough", desc: "Crisp, balanced Plus Jakarta Sans" },
  { id: "playfair", name: "Classic Bistro", sample: "Artisanal Brioche Toasties", desc: "Refined luxury serif display" },
  { id: "inter", name: "High Legibility", sample: "Fresh Bakes & Specialty Brews", desc: "Neutral, ultra-clear system sans" },
];

const SCALE_OPTIONS: { id: FontScaleType; label: string; percent: string; desc: string }[] = [
  { id: "normal", label: "A", percent: "100%", desc: "Standard text size" },
  { id: "medium", label: "A+", percent: "110%", desc: "Comfortable reading size" },
  { id: "large", label: "A++", percent: "122%", desc: "Large high-visibility" },
  { id: "xlarge", label: "A+++", percent: "135%", desc: "Extra large display" },
];

export const FontSwitcherDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const [fontConfig, setFontConfig] = useState<FontConfig>(() => {
    try {
      const savedFamily = (localStorage.getItem("niea_font_family") as FontFamilyType) || "outfit";
      const savedScale = (localStorage.getItem("niea_font_scale") as FontScaleType) || "normal";
      return { family: savedFamily, scale: savedScale };
    } catch {
      return { family: "outfit", scale: "normal" };
    }
  });

  // Apply to document root whenever fontConfig changes
  useEffect(() => {
    try {
      document.documentElement.setAttribute("data-font-family", fontConfig.family);
      document.documentElement.setAttribute("data-font-scale", fontConfig.scale);
      localStorage.setItem("niea_font_family", fontConfig.family);
      localStorage.setItem("niea_font_scale", fontConfig.scale);
    } catch (e) {
      console.warn("Could not save font settings:", e);
    }
  }, [fontConfig]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () => document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isOpen]);

  const handleSelectFamily = (family: FontFamilyType) => {
    setFontConfig((prev) => ({ ...prev, family }));
  };

  const handleSelectScale = (scale: FontScaleType) => {
    setFontConfig((prev) => ({ ...prev, scale }));
  };

  const activeFamilyObj = FONT_OPTIONS.find((f) => f.id === fontConfig.family) || FONT_OPTIONS[0];

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-full bg-[#374C44] hover:bg-[#3E564D] border border-[#F5E086]/30 text-xs font-bold text-[#F5E086] transition shadow-xs cursor-pointer select-none"
        title="Customize Website Typography (Font Family & Text Size)"
        aria-expanded={isOpen}
      >
        <span className="font-serif font-black text-sm tracking-tight leading-none text-[#F5E086]">
          A<span className="text-[10px] text-white/80">a</span>
        </span>
        <span className="hidden md:inline text-[11px] font-semibold text-white/90">
          Font
        </span>
        <ChevronDown className={`w-3 h-3 text-white/70 transition-transform ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-72 sm:w-80 bg-[#24332D] text-[#FBF9F2] rounded-3xl border border-white/20 shadow-2xl p-4 z-50 animate-in fade-in zoom-in-95 duration-150 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <div className="flex items-center gap-2">
              <Type className="w-4 h-4 text-[#F5E086]" />
              <span className="text-xs font-black uppercase tracking-wider text-[#F5E086]">
                Typography & Size
              </span>
            </div>
            <span className="text-[10px] text-white/50">Auto-saved</span>
          </div>

          {/* 1. Font Size Scaling */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-white/70 block">
              Text Scaling
            </span>
            <div className="grid grid-cols-4 gap-1.5">
              {SCALE_OPTIONS.map((scale) => {
                const isSelected = fontConfig.scale === scale.id;
                return (
                  <button
                    key={scale.id}
                    type="button"
                    onClick={() => handleSelectScale(scale.id)}
                    className={`py-2 px-2 rounded-2xl border text-center transition flex flex-col items-center gap-0.5 cursor-pointer ${
                      isSelected
                        ? "bg-[#F5E086] text-[#24332D] border-[#F5E086] shadow-sm font-black"
                        : "bg-[#2B3D36] text-white/80 border-white/10 hover:border-white/30"
                    }`}
                  >
                    <span className="font-black text-xs">{scale.label}</span>
                    <span className="text-[9px] opacity-80">{scale.percent}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Font Family Selection */}
          <div className="space-y-1.5">
            <span className="text-[11px] font-bold text-white/70 block">
              Font Family
            </span>
            <div className="space-y-1.5">
              {FONT_OPTIONS.map((opt) => {
                const isSelected = fontConfig.family === opt.id;
                return (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => handleSelectFamily(opt.id)}
                    className={`w-full p-2.5 rounded-2xl border text-left transition flex items-center justify-between gap-2 cursor-pointer ${
                      isSelected
                        ? "bg-[#374C44] border-[#F5E086] text-white shadow-xs"
                        : "bg-[#2B3D36] border-white/10 text-white/80 hover:border-white/25"
                    }`}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold ${isSelected ? "text-[#F5E086]" : "text-white"}`}>
                          {opt.name}
                        </span>
                        {isSelected && (
                          <span className="px-1.5 py-0.2 rounded-full bg-[#F5E086] text-[#24332D] text-[9px] font-black">
                            Active
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-white/60 truncate mt-0.5">
                        {opt.desc}
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center">
                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-[#F5E086] text-[#24332D] flex items-center justify-center">
                          <Check className="w-3 h-3 font-bold" />
                        </div>
                      ) : (
                        <div className="w-5 h-5 rounded-full border border-white/20" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="pt-2 border-t border-white/10 text-[11px] text-white/60 text-center">
            Adapts all menu cards, checkout slips & live orders.
          </div>
        </div>
      )}
    </div>
  );
};
