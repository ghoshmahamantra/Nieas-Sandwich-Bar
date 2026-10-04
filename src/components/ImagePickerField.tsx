import React, { useState, useRef } from "react";
import {
  Upload,
  Image as ImageIcon,
  Link as LinkIcon,
  X,
  Sparkles,
  Check,
  RefreshCw,
} from "lucide-react";

export const ARTISANAL_PRESET_IMAGES = [
  {
    label: "Artisan Sourdough Melt",
    url: "https://images.unsplash.com/photo-1528735602780-2552fd46c7af?w=700&auto=format&fit=crop&q=80",
    tag: "Sourdough",
  },
  {
    label: "Golden Brioche Toastie",
    url: "https://images.unsplash.com/photo-1554433601-5547f64ae9d0?w=700&auto=format&fit=crop&q=80",
    tag: "Brioche",
  },
  {
    label: "Gourmet Club Toastie",
    url: "https://images.unsplash.com/photo-1567234669003-dce7a7a88821?w=700&auto=format&fit=crop&q=80",
    tag: "Club",
  },
  {
    label: "Japanese Tamago Egg Sando",
    url: "https://images.unsplash.com/photo-1525351484163-7529414344d8?w=700&auto=format&fit=crop&q=80",
    tag: "Egg Sando",
  },
  {
    label: "Rosemary Focaccia Panini",
    url: "https://images.unsplash.com/photo-1509722747041-616f39b57569?w=700&auto=format&fit=crop&q=80",
    tag: "Focaccia",
  },
  {
    label: "Fresh Butter Croissant / Bake",
    url: "https://images.unsplash.com/photo-1555507036-ab1f4038808a?w=700&auto=format&fit=crop&q=80",
    tag: "Patisserie",
  },
  {
    label: "Specialty Iced Matcha / Brew",
    url: "https://images.unsplash.com/photo-1517701550927-30cf4ba1dba5?w=700&auto=format&fit=crop&q=80",
    tag: "Beverage",
  },
  {
    label: "Cheesy Panini Melt",
    url: "https://images.unsplash.com/photo-1628191010210-a59de33e5941?w=700&auto=format&fit=crop&q=80",
    tag: "Panini",
  },
];

interface ImagePickerFieldProps {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  helpText?: string;
  allowPresets?: boolean;
}

export const ImagePickerField: React.FC<ImagePickerFieldProps> = ({
  label = "Item Photo / Visual",
  value,
  onChange,
  helpText = "Upload a photo from your device, paste a web URL, or choose from our artisanal photo library.",
  allowPresets = true,
}) => {
  const [activeTab, setActiveTab] = useState<"upload" | "url" | "presets">(
    value ? "upload" : "presets"
  );
  const [urlInput, setUrlInput] = useState("");
  const [uploadError, setUploadError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Handle local device image upload
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError("");
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setUploadError("Please choose a valid image file (JPG, PNG, WebP).");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setUploadError("Image is larger than 5MB. Please choose a smaller photo.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (typeof event.target?.result === "string") {
        onChange(event.target.result);
        setUploadError("");
      }
    };
    reader.onerror = () => {
      setUploadError("Failed to read image file. Please try another.");
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!urlInput.trim()) return;
    onChange(urlInput.trim());
    setUrlInput("");
  };

  const isDataUrl = value?.startsWith("data:image");

  return (
    <div className="space-y-2 text-xs">
      <div className="flex items-center justify-between">
        <label className="text-white/80 font-bold flex items-center gap-1.5">
          <ImageIcon className="w-3.5 h-3.5 text-[#F5E086]" />
          <span>{label}</span>
        </label>
        {value && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono font-medium flex items-center gap-1">
            <Check className="w-2.5 h-2.5" />
            <span>Image Attached</span>
          </span>
        )}
      </div>

      {helpText && <p className="text-[11px] text-white/50">{helpText}</p>}

      {/* Main Image Preview Box */}
      {value ? (
        <div className="p-3 rounded-2xl bg-[#24332D] border border-white/10 space-y-2.5">
          <div className="relative rounded-xl overflow-hidden aspect-video max-h-48 bg-black/40 border border-white/10 group">
            <img
              src={value}
              alt="Item Visual Preview"
              className="w-full h-full object-cover transition duration-300 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-80" />

            <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
              <span className="text-[10px] bg-black/60 backdrop-blur-xs text-white/90 px-2 py-0.5 rounded-md font-mono">
                {isDataUrl ? "Uploaded from device" : "Web / Presets"}
              </span>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-2 py-1 rounded-lg bg-white/20 hover:bg-[#F5E086] hover:text-[#24332D] text-white text-[10px] font-bold transition flex items-center gap-1"
                >
                  <RefreshCw className="w-3 h-3" />
                  <span>Replace</span>
                </button>
                <button
                  type="button"
                  onClick={() => onChange("")}
                  className="p-1 rounded-lg bg-rose-500/80 hover:bg-rose-600 text-white transition"
                  title="Remove image"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Empty State Image Selector Box */
        <div className="p-3 rounded-2xl bg-[#24332D] border border-dashed border-white/20 space-y-3">
          {/* Sub Navigation Modes */}
          <div className="flex p-0.5 rounded-xl bg-black/30 border border-white/10">
            <button
              type="button"
              onClick={() => setActiveTab("upload")}
              className={`flex-1 py-1 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
                activeTab === "upload"
                  ? "bg-[#F5E086] text-[#24332D]"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <Upload className="w-3 h-3" />
              <span>Upload File</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("url")}
              className={`flex-1 py-1 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
                activeTab === "url"
                  ? "bg-[#F5E086] text-[#24332D]"
                  : "text-white/70 hover:text-white"
              }`}
            >
              <LinkIcon className="w-3 h-3" />
              <span>Web URL</span>
            </button>
            {allowPresets && (
              <button
                type="button"
                onClick={() => setActiveTab("presets")}
                className={`flex-1 py-1 rounded-lg font-bold flex items-center justify-center gap-1.5 transition ${
                  activeTab === "presets"
                    ? "bg-[#F5E086] text-[#24332D]"
                    : "text-white/70 hover:text-white"
                }`}
              >
                <Sparkles className="w-3 h-3" />
                <span>Presets</span>
              </button>
            )}
          </div>

          {/* Mode 1: Device Upload */}
          {activeTab === "upload" && (
            <div className="text-center py-3 px-2 space-y-2">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
                id="image-picker-file-input"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="mx-auto w-full py-2.5 px-4 rounded-xl bg-white/10 hover:bg-[#F5E086] hover:text-[#24332D] text-white font-bold transition flex items-center justify-center gap-2 border border-white/10 group"
              >
                <Upload className="w-4 h-4 text-[#F5E086] group-hover:text-[#24332D]" />
                <span>Choose Image from Device / Photos</span>
              </button>
              <p className="text-[10px] text-white/50">
                Supports JPG, PNG, WebP (Max 5MB). Photo is embedded directly.
              </p>
            </div>
          )}

          {/* Mode 2: Web URL */}
          {activeTab === "url" && (
            <div className="space-y-2">
              <div className="flex gap-2">
                <input
                  type="url"
                  value={urlInput}
                  onChange={(e) => setUrlInput(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="flex-1 px-3 py-1.5 rounded-xl bg-[#2B3D36] border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#F5E086] text-xs"
                />
                <button
                  type="button"
                  onClick={() => handleApplyUrl()}
                  disabled={!urlInput.trim()}
                  className="px-3 py-1.5 rounded-xl bg-[#F5E086] text-[#24332D] font-bold disabled:opacity-40 hover:bg-[#F8E79B] transition"
                >
                  Apply
                </button>
              </div>
              <p className="text-[10px] text-white/50">
                Paste any direct image URL from Unsplash, Imgur, or cloud storage.
              </p>
            </div>
          )}

          {/* Mode 3: Presets Gallery */}
          {activeTab === "presets" && allowPresets && (
            <div className="space-y-2">
              <div className="grid grid-cols-4 gap-1.5 max-h-44 overflow-y-auto pr-1">
                {ARTISANAL_PRESET_IMAGES.map((preset) => (
                  <button
                    key={preset.url}
                    type="button"
                    onClick={() => onChange(preset.url)}
                    className="relative rounded-xl overflow-hidden aspect-square border border-white/15 hover:border-[#F5E086] group transition"
                    title={preset.label}
                  >
                    <img
                      src={preset.url}
                      alt={preset.label}
                      className="w-full h-full object-cover group-hover:scale-110 transition duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/10 transition" />
                    <span className="absolute bottom-1 left-1 right-1 text-[8px] bg-black/70 text-white px-1 py-0.5 rounded truncate font-medium block text-center">
                      {preset.tag}
                    </span>
                  </button>
                ))}
              </div>
              <p className="text-[10px] text-white/50 text-center">
                Tap any preset photo to attach it to this menu item.
              </p>
            </div>
          )}

          {uploadError && (
            <p className="text-[11px] text-rose-400 text-center font-medium">
              {uploadError}
            </p>
          )}
        </div>
      )}

      {/* Hidden File Input for Replace Actions */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
};
