import React, { useState, useEffect } from "react";
import { X, Type, Check, RotateCcw, Sparkles } from "lucide-react";

interface FontPreferencesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export type FontFamilyType = "jakarta" | "outfit" | "playfair" | "inter";
export type FontScaleType = "normal" | "medium" | "large" | "xlarge";

const FONT_FAMILIES: {
  id: FontFamilyType;
  name: string;
  category: string;
  cssFamily: string;
  description: string;
}[] = [
  {
    id: "jakarta",
    name: "Plus Jakarta Sans",
    category: "Modern Clean (Default)",
    cssFamily: "'Plus Jakarta Sans', sans-serif",
    description: "Balanced, contemporary, and highly readable on all screens.",
  },
  {
    id: "outfit",
    name: "Outfit",
    category: "Artisanal Geometric",
    cssFamily: "'Outfit', sans-serif",
    description: "Trendy, clean geometric curves popular in modern bistros.",
  },
  {
    id: "playfair",
    name: "Playfair Display",
    category: "Luxury Gourmet Serif",
    cssFamily: "'Playfair Display', serif",
    description: "Elegant, artisanal serif reminiscent of European boutique bakeries.",
  },
  {
    id: "inter",
    name: "Inter",
    category: "Crisp High-Legibility",
    cssFamily: "'Inter', sans-serif",
    description: "Ultra-clear neutral grotesque font crafted for maximum clarity.",
  },
];

const FONT_SCALES: {
  id: FontScaleType;
  label: string;
  sublabel: string;
  sampleSize: string;
}[] = [
  {
    id: "normal",
    label: "Normal",
    sublabel: "100% (16px base)",
    sampleSize: "text-sm",
  },
  {
    id: "medium",
    label: "Medium",
    sublabel: "110% (17.5px base)",
    sampleSize: "text-base",
  },
  {
    id: "large",
    label: "Large",
    sublabel: "122% (19.5px base)",
    sampleSize: "text-lg",
  },
  {
    id: "xlarge",
    label: "Extra Large",
    sublabel: "135% (21.5px base)",
    sampleSize: "text-xl",
  },
];

export const FontPreferencesModal: React.FC<FontPreferencesModalProps> = ({
  isOpen,
  onClose,
}) => {
  const [selectedFont, setSelectedFont] = useState<FontFamilyType>(() => {
    return (localStorage.getItem("niea_font_family") as FontFamilyType) || "jakarta";
  });

  const [selectedScale, setSelectedScale] = useState<FontScaleType>(() => {
    return (localStorage.getItem("niea_font_scale") as FontScaleType) || "normal";
  });

  // Apply immediately to the live page documentElement
  const applyFontPreferences = (family: FontFamilyType, scale: FontScaleType) => {
    document.documentElement.setAttribute("data-font-family", family);
    document.documentElement.setAttribute("data-font-scale", scale);
    localStorage.setItem("niea_font_family", family);
    localStorage.setItem("niea_font_scale", scale);
  };

  // Sync state if localStorage changes or modal opens
  useEffect(() => {
    if (isOpen) {
      const savedFont = (localStorage.getItem("niea_font_family") as FontFamilyType) || "jakarta";
      const savedScale = (localStorage.getItem("niea_font_scale") as FontScaleType) || "normal";
      setSelectedFont(savedFont);
      setSelectedScale(savedScale);
    }
  }, [isOpen]);

  const handleSelectFont = (font: FontFamilyType) => {
    setSelectedFont(font);
    applyFontPreferences(font, selectedScale);
  };

  const handleSelectScale = (scale: FontScaleType) => {
    setSelectedScale(scale);
    applyFontPreferences(selectedFont, scale);
  };

  const handleReset = () => {
    setSelectedFont("jakarta");
    setSelectedScale("normal");
    applyFontPreferences("jakarta", "normal");
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in">
      <div className="relative w-full max-w-lg bg-[#24332D] rounded-3xl border border-[#F5E086]/30 shadow-2xl p-6 sm:p-7 text-white space-y-6 animate-in zoom-in-95">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-[#F5E086] text-[#24332D] flex items-center justify-center shadow-md">
              <Type className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-niea font-bold text-xl text-[#F5E086]">
                Website Font & Size
              </h3>
              <p className="text-xs text-white/70">
                Customize typography and text scale to suit your reading preference
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-white/60 hover:text-white hover:bg-white/10 transition"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 1. Font Family Options */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-[#F5E086] uppercase tracking-wider block">
            1. Typography Style (Font Family)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {FONT_FAMILIES.map((font) => {
              const isSelected = selectedFont === font.id;
              return (
                <button
                  key={font.id}
                  type="button"
                  onClick={() => handleSelectFont(font.id)}
                  style={{ fontFamily: font.cssFamily }}
                  className={`p-3.5 rounded-2xl border text-left transition relative cursor-pointer ${
                    isSelected
                      ? "bg-[#374C44] border-[#F5E086] shadow-md ring-1 ring-[#F5E086]/50"
                      : "bg-[#2B3D36] border-white/10 hover:border-white/25 hover:bg-[#32473F]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-sm text-white">
                      {font.name}
                    </span>
                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-[#F5E086] text-[#24332D] flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 stroke-[3]" />
                      </div>
                    )}
                  </div>
                  <span className="block text-[11px] text-[#F5E086] font-sans font-medium mb-0.5">
                    {font.category}
                  </span>
                  <p className="text-[10px] text-white/60 font-sans leading-tight">
                    {font.description}
                  </p>
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Font Size Scale Options */}
        <div className="space-y-2.5">
          <label className="text-xs font-bold text-[#F5E086] uppercase tracking-wider block">
            2. Text Size & Readability
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {FONT_SCALES.map((scale) => {
              const isSelected = selectedScale === scale.id;
              return (
                <button
                  key={scale.id}
                  type="button"
                  onClick={() => handleSelectScale(scale.id)}
                  className={`p-3 rounded-2xl border text-center transition cursor-pointer ${
                    isSelected
                      ? "bg-[#F5E086] text-[#24332D] border-[#F5E086] font-bold shadow-sm"
                      : "bg-[#2B3D36] text-white/80 border-white/10 hover:border-white/25 hover:text-white"
                  }`}
                >
                  <span className="block font-bold text-xs">{scale.label}</span>
                  <span
                    className={`block text-[10px] mt-0.5 ${
                      isSelected ? "text-[#24332D]/80" : "text-white/50"
                    }`}
                  >
                    {scale.sublabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. Live Preview Card */}
        <div className="p-4 rounded-2xl bg-[#1E2B25] border border-white/10 space-y-1.5">
          <div className="flex items-center gap-1.5 text-emerald-400 text-[11px] font-bold">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Instant Live Preview</span>
          </div>
          <h4 className="font-niea font-bold text-base text-[#F5E086]">
            Artisan Sourdough Melts & French Brioche
          </h4>
          <p className="text-xs text-white/80 leading-relaxed font-body">
            Handcrafted with cultured butter, slow-fermented organic sourdough, and melted farmhouse cheddar in New Town, Kolkata.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="flex items-center justify-between pt-2 border-t border-white/10">
          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-2 text-xs font-bold text-white/60 hover:text-white transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset to Default</span>
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2.5 rounded-full bg-[#F5E086] hover:bg-[#F8E79B] text-[#24332D] font-bold text-xs transition shadow-md"
          >
            Done & Keep Changes
          </button>
        </div>
      </div>
    </div>
  );
};
