import React from "react";
import { Heart, Clock, MapPin, Phone, Instagram, Shield, Sparkles, Wifi, Award, Settings } from "lucide-react";
import { NieaLogo } from "./NieaLogo";
import { WebsiteContentConfig, LoyaltyProgramConfig } from "../types/niea";

interface FooterProps {
  onOpenOwnerPortal: () => void;
  onOpenLoyalty: () => void;
  onOpenTrackOrder?: () => void;
  websiteConfig?: WebsiteContentConfig;
  loyaltyConfig?: LoyaltyProgramConfig;
}

export const Footer: React.FC<FooterProps> = ({
  onOpenOwnerPortal,
  onOpenLoyalty,
  onOpenTrackOrder,
  websiteConfig,
  loyaltyConfig,
}) => {
  const brandStory =
    websiteConfig?.footerStory ||
    "Artisanal toasted sandwiches, cultured sourdough, warm brioche, and specialty beverages in New Town’s favorite sandwich bar.";
  const hours = websiteConfig?.weekdayHours || "Tuesday – Sunday: 1:00 PM – 11:00 PM";
  const closed = websiteConfig?.closedDay || "Monday: Closed";
  const lastCall = websiteConfig?.kitchenLastCall || "Kitchen Last Call: 10:30 PM";
  const address =
    websiteConfig?.address ||
    "NiEA'S Sandwich Bar, Action Area 1, New Town, Kolkata, West Bengal 700156";
  const phone = websiteConfig?.phone || "+91 82740 47424";
  const wifi = websiteConfig?.wifiName || "NiEAs_SandwichBar_5G";
  const fssai = websiteConfig?.fssaiNumber || "21223190000412";
  const insta = websiteConfig?.instagramHandle || "@nieas.sandwichbar";
  const cafeName = websiteConfig?.cafeName || "NiEA'S SANDWICH BAR";
  return (
    <footer className="bg-[#2B3D36] text-[#FBF9F2] border-t border-[#F5E086]/20 pt-12 pb-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-10">
          {/* Col 1: Brand & Vibe */}
          <div className="space-y-3 md:col-span-1">
            <div className="w-[180px] -ml-2 mb-1">
              <NieaLogo size="sm" interactive={false} />
            </div>
            <p className="text-xs text-[#FBF9F2]/75 leading-relaxed">
              {brandStory}
            </p>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#374C44] border border-[#F5E086]/20 text-[11px] text-[#F5E086]">
              <span>Tuxedo Cat Inspired Sandwich Bar</span>
            </div>
          </div>

          {/* Col 2: Hours & Fresh Bakes */}
          <div className="space-y-2.5 text-xs">
            <h4 className="font-niea font-bold text-sm text-[#F5E086] uppercase tracking-wider">
              Cafe Hours & Bakes
            </h4>
            <ul className="space-y-2 text-[#FBF9F2]/80">
              <li className="flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-[#F5E086]" />
                <span>{hours}</span>
              </li>
              <li className="text-amber-300 font-semibold flex items-center gap-1.5">
                <span>{closed}</span>
              </li>
              <li>
                <span className="text-[#F5E086] font-bold">{lastCall}</span>
              </li>
              <li>
                <span className="text-emerald-300 font-medium">Dine-in, Takeaway & Table Booking</span>
              </li>
            </ul>
          </div>

          {/* Col 3: Location & Contact */}
          <div className="space-y-2.5 text-xs">
            <h4 className="font-niea font-bold text-sm text-[#F5E086] uppercase tracking-wider">
              Find Our Store
            </h4>
            <ul className="space-y-2 text-[#FBF9F2]/80">
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-[#F5E086] shrink-0 mt-0.5" />
                <span>{address}</span>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-3.5 h-3.5 text-[#F5E086]" />
                <a href={`tel:${phone.replace(/\s+/g, "")}`} className="hover:text-[#F5E086] font-bold text-white transition">
                  {phone}
                </a>
              </li>
              <li className="text-[11px] text-emerald-300 flex items-center gap-1.5">
                <Wifi className="w-3.5 h-3.5 text-emerald-400" />
                <span>WiFi: {wifi}</span>
              </li>
            </ul>
          </div>

          {/* Col 4: Perks & Owner Portal */}
          <div className="space-y-3 text-xs">
            <h4 className="font-niea font-bold text-sm text-[#F5E086] uppercase tracking-wider">
              Cafe Links
            </h4>
            <div className="flex flex-col gap-2">
              {onOpenTrackOrder && (
                <button
                  type="button"
                  onClick={onOpenTrackOrder}
                  className="text-left text-xs font-semibold text-emerald-300 hover:text-white flex items-center gap-1.5"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span>Track Order Live (Real-Time Prep)</span>
                </button>
              )}

              {loyaltyConfig?.isEnabled !== false && (
                <button
                  type="button"
                  onClick={onOpenLoyalty}
                  className="text-left text-xs font-semibold text-[#F5E086] hover:underline flex items-center gap-1.5"
                >
                  <Award className="w-3.5 h-3.5" />
                  <span>{loyaltyConfig?.programName || "Paws & Perks Club (6-Stamp Rewards)"}</span>
                </button>
              )}

              <button
                type="button"
                onClick={onOpenOwnerPortal}
                className="text-left text-xs font-semibold text-white/80 hover:text-[#F5E086] flex items-center gap-1.5"
              >
                <Settings className="w-3.5 h-3.5" />
                <span>Owner & Staff Portal</span>
              </button>

              <div className="pt-2 text-[11px] text-[#FBF9F2]/60">
                <span className="flex items-center gap-1">
                  <Shield className="w-3 h-3 text-[#F5E086]" />
                  <span>Licensed under FSSAI #{fssai}</span>
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom copyright */}
        <div className="pt-6 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between text-xs text-[#FBF9F2]/60 gap-3">
          <p>© {new Date().getFullYear()} {cafeName}. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Crafted with <Heart className="w-3 h-3 text-rose-400 fill-rose-400" /> for sandwich and cat lovers.
          </p>
        </div>
      </div>
    </footer>
  );
};
