import React, { useState, useEffect } from "react";
import {
  MessageSquare,
  Phone,
  Check,
  Send,
  Sparkles,
  RotateCcw,
  BellRing,
  Info,
  Smartphone,
  ExternalLink,
} from "lucide-react";
import { WhatsAppTemplatesConfig } from "../../types/niea";
import { DEFAULT_WHATSAPP_CONFIG } from "../../data/nieaData";

interface WhatsAppAlertsTabProps {
  config: WhatsAppTemplatesConfig;
  onUpdateConfig: (updated: WhatsAppTemplatesConfig) => void;
  onNotice?: (msg: string) => void;
}

export const WhatsAppAlertsTab: React.FC<WhatsAppAlertsTabProps> = ({
  config,
  onUpdateConfig,
  onNotice,
}) => {
  const [formData, setFormData] = useState<WhatsAppTemplatesConfig>({
    ...DEFAULT_WHATSAPP_CONFIG,
    ...config,
  });
  const [isSaved, setIsSaved] = useState(false);
  const [testSent, setTestSent] = useState(false);

  useEffect(() => {
    setFormData({
      ...DEFAULT_WHATSAPP_CONFIG,
      ...config,
    });
  }, [config]);

  const handleChange = (field: keyof WhatsAppTemplatesConfig, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateConfig(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2500);
    onNotice?.("✅ WhatsApp alert templates & owner phone successfully updated!");
  };

  const handleTestOwnerAlert = () => {
    const cleanPhone = formData.ownerAlertPhone.replace(/\D/g, "").slice(-10);
    if (!cleanPhone || cleanPhone.length !== 10) {
      alert("Please specify a valid 10-digit owner WhatsApp number.");
      return;
    }

    const sampleMsg = formData.ownerOrderAlertTemplate
      .replace(/\{tokenNumber\}/g, "T101")
      .replace(/\{orderNumber\}/g, "NIEA-4819")
      .replace(/\{orderType\}/g, "Dine-In (Table 1)")
      .replace(/\{customerName\}/g, "Test Customer")
      .replace(/\{customerPhone\}/g, "9876543210")
      .replace(/\{items\}/g, "1x Autumn Truffle Melt, 1x Iced Matcha Tonic")
      .replace(/\{grandTotal\}/g, "540")
      .replace(/\{paymentMethod\}/g, "UPI")
      .replace(/\{paymentStatus\}/g, "PAID");

    const waUrl = `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(sampleMsg)}`;

    // Open WhatsApp in direct user click gesture (never blocked by popup blocker!)
    const win = window.open(waUrl, "_blank", "noopener,noreferrer");
    if (!win) {
      window.location.href = waUrl;
    }

    // Also dispatch via backend API
    fetch("/api/whatsapp/notify-order", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tokenNumber: "T101",
        orderNumber: "NIEA-TEST-101",
        customerName: "Test Customer",
        customerPhone: cleanPhone,
        grandTotal: 540,
        items: [{ item: { name: "Autumn Truffle Melt" }, quantity: 1, totalPrice: 540 }],
        orderType: "dine-in",
        paymentMethod: "upi",
        ownerTemplate: formData.ownerOrderAlertTemplate,
      }),
    }).catch(() => {});

    setTestSent(true);
    setTimeout(() => setTestSent(false), 3000);
    onNotice?.(`✅ Test WhatsApp alert triggered for +91 ${cleanPhone}`);
  };

  return (
    <div className="space-y-6">
      <div className="p-5 rounded-3xl bg-[#1E2B25] border border-[#F5E086]/25 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 flex items-center justify-center font-black">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-niea font-bold text-lg text-[#F5E086]">
                Automated WhatsApp Alerts & Preset Message Templates
              </h3>
              <p className="text-xs text-white/60">
                Customise automated messages sent to customers & instant alerts sent to owner's WhatsApp
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 self-start sm:self-auto">
            {isSaved && (
              <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-400/30 flex items-center gap-1.5 animate-in fade-in">
                <Check className="w-3.5 h-3.5" />
                <span>Templates Active</span>
              </span>
            )}
            <button
              type="button"
              onClick={() => {
                setFormData(DEFAULT_WHATSAPP_CONFIG);
                onUpdateConfig(DEFAULT_WHATSAPP_CONFIG);
                onNotice?.("WhatsApp templates reset to defaults.");
              }}
              className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition flex items-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>
          </div>
        </div>

        {/* OWNER DIRECT ALERT CONFIGURATION */}
        <div className="p-4 rounded-2xl bg-[#24332D] border border-emerald-400/30 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
            <div>
              <h4 className="font-niea font-bold text-sm text-[#F5E086] flex items-center gap-2">
                <BellRing className="w-4 h-4 text-emerald-400" />
                <span>Owner Real-Time WhatsApp Order & Pre-Booking Alert</span>
              </h4>
              <p className="text-[11px] text-white/70 mt-0.5">
                Whenever a customer creates an order or books a table, an automated alert is sent instantly to the owner's WhatsApp number.
              </p>
            </div>

            <button
              type="button"
              onClick={handleTestOwnerAlert}
              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold transition flex items-center gap-1.5 shadow-sm shrink-0 self-start sm:self-auto"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{testSent ? "Alert Opened!" : "Test WhatsApp Alert"}</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs pt-1">
            <div>
              <label className="text-white/80 font-bold block mb-1">Owner WhatsApp Phone (+91)</label>
              <div className="relative flex items-center">
                <span className="absolute left-3 text-xs font-bold text-[#F5E086] border-r border-white/10 pr-2">
                  +91
                </span>
                <input
                  type="tel"
                  required
                  value={formData.ownerAlertPhone}
                  onChange={(e) => handleChange("ownerAlertPhone", e.target.value.replace(/\D/g, "").slice(0, 10))}
                  placeholder="8274047424"
                  className="w-full bg-[#1A2520] border border-white/15 rounded-xl pl-14 pr-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-[#F5E086]"
                />
              </div>
            </div>

            <div className="flex items-center gap-3 pt-5">
              <label className="flex items-center gap-2.5 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={formData.isOwnerAlertEnabled}
                  onChange={(e) => handleChange("isOwnerAlertEnabled", e.target.checked)}
                  className="w-4 h-4 rounded-md accent-[#F5E086] cursor-pointer"
                />
                <span className="text-white font-bold text-xs">
                  Enable automated alerts to Owner WhatsApp
                </span>
              </label>
            </div>
          </div>
        </div>

        {/* PRESET MESSAGE TEMPLATES */}
        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div className="p-3 rounded-2xl bg-black/20 border border-white/5 text-[11px] text-white/60 space-y-1">
            <span className="font-bold text-[#F5E086] flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              Available Dynamic Tags:
            </span>
            <div className="flex flex-wrap gap-1.5 font-mono text-[10px] text-emerald-300">
              <span className="bg-white/10 px-1.5 py-0.5 rounded">{"{customerName}"}</span>
              <span className="bg-white/10 px-1.5 py-0.5 rounded">{"{tokenNumber}"}</span>
              <span className="bg-white/10 px-1.5 py-0.5 rounded">{"{orderNumber}"}</span>
              <span className="bg-white/10 px-1.5 py-0.5 rounded">{"{items}"}</span>
              <span className="bg-white/10 px-1.5 py-0.5 rounded">{"{grandTotal}"}</span>
              <span className="bg-white/10 px-1.5 py-0.5 rounded">{"{orderType}"}</span>
              <span className="bg-white/10 px-1.5 py-0.5 rounded">{"{tableNumber}"}</span>
              <span className="bg-white/10 px-1.5 py-0.5 rounded">{"{bookingRef}"}</span>
              <span className="bg-white/10 px-1.5 py-0.5 rounded">{"{date}"}</span>
              <span className="bg-white/10 px-1.5 py-0.5 rounded">{"{timeSlot}"}</span>
            </div>
          </div>

          {/* Template 1: Customer Order Confirmation */}
          <div className="space-y-1.5">
            <label className="text-white/80 font-bold block">
              1. Customer Order Received Message Preset
            </label>
            <textarea
              rows={3}
              value={formData.orderCustomerTemplate}
              onChange={(e) => handleChange("orderCustomerTemplate", e.target.value)}
              className="w-full bg-[#1A2520] border border-white/15 rounded-xl p-3 text-white font-mono text-xs focus:outline-none focus:border-[#F5E086]"
            />
          </div>

          {/* Template 2: Customer Order Ready */}
          <div className="space-y-1.5">
            <label className="text-white/80 font-bold block">
              2. Customer Order Hot & Ready Message Preset
            </label>
            <textarea
              rows={2}
              value={formData.orderReadyTemplate}
              onChange={(e) => handleChange("orderReadyTemplate", e.target.value)}
              className="w-full bg-[#1A2520] border border-white/15 rounded-xl p-3 text-white font-mono text-xs focus:outline-none focus:border-[#F5E086]"
            />
          </div>

          {/* Template 3: Customer Table Booking */}
          <div className="space-y-1.5">
            <label className="text-white/80 font-bold block">
              3. Customer Table Reservation Confirmation Preset
            </label>
            <textarea
              rows={2}
              value={formData.reservationCustomerTemplate}
              onChange={(e) => handleChange("reservationCustomerTemplate", e.target.value)}
              className="w-full bg-[#1A2520] border border-white/15 rounded-xl p-3 text-white font-mono text-xs focus:outline-none focus:border-[#F5E086]"
            />
          </div>

          {/* Template 4: Owner WhatsApp Alert (New Order) */}
          <div className="space-y-1.5">
            <label className="text-white/80 font-bold block text-emerald-300">
              4. Owner WhatsApp Alert Preset (New Order Placed)
            </label>
            <textarea
              rows={3}
              value={formData.ownerOrderAlertTemplate}
              onChange={(e) => handleChange("ownerOrderAlertTemplate", e.target.value)}
              className="w-full bg-[#1A2520] border border-emerald-500/30 rounded-xl p-3 text-white font-mono text-xs focus:outline-none focus:border-[#F5E086]"
            />
          </div>

          {/* Template 5: Owner WhatsApp Alert (New Table Booking) */}
          <div className="space-y-1.5">
            <label className="text-white/80 font-bold block text-emerald-300">
              5. Owner WhatsApp Alert Preset (New Table Booking)
            </label>
            <textarea
              rows={3}
              value={formData.ownerReservationAlertTemplate}
              onChange={(e) => handleChange("ownerReservationAlertTemplate", e.target.value)}
              className="w-full bg-[#1A2520] border border-emerald-500/30 rounded-xl p-3 text-white font-mono text-xs focus:outline-none focus:border-[#F5E086]"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl bg-[#F5E086] text-[#24332D] font-bold text-xs hover:bg-[#F8E79B] transition shadow-md flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Save WhatsApp Alert Presets</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
