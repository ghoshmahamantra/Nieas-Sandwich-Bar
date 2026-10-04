import React, { useState } from "react";
import {
  QrCode,
  Copy,
  Check,
  Smartphone,
  ShieldCheck,
  ExternalLink,
  Sparkles,
} from "lucide-react";

interface UpiPaymentBoxProps {
  amount: number;
  note?: string;
  onTxnIdChange?: (txnId: string) => void;
  txnIdValue?: string;
  title?: string;
  subtitle?: string;
}

export const UPI_ID = "9123722482@ybl";
export const PAYEE_NAME = "NiEA'S Sandwich Bar";

export const UpiPaymentBox: React.FC<UpiPaymentBoxProps> = ({
  amount,
  note = "NiEA Cafe Payment",
  onTxnIdChange,
  txnIdValue = "",
  title = "Instant UPI QR Code Payment",
  subtitle = "Zero convenience fee • Instant kitchen verification",
}) => {
  const [copied, setCopied] = useState(false);

  // Construct standard UPI intent link with exact amount & payee
  const encodedPn = encodeURIComponent(PAYEE_NAME);
  const encodedTn = encodeURIComponent(note);
  const upiIntentUrl = `upi://pay?pa=${UPI_ID}&pn=${encodedPn}&am=${amount}&cu=INR&tn=${encodedTn}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&margin=8&data=${encodeURIComponent(
    upiIntentUrl
  )}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(UPI_ID);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleOpenUpiApp = () => {
    window.location.href = upiIntentUrl;
  };

  return (
    <div className="p-4 sm:p-5 rounded-2xl bg-[#24332D] border-2 border-[#F5E086]/30 text-center space-y-3.5 shadow-lg">
      <div className="space-y-1">
        <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#F5E086] uppercase tracking-wider">
          <QrCode className="w-4 h-4" />
          <span>{title}</span>
        </div>
        <p className="text-[11px] text-[#FBF9F2]/70">{subtitle}</p>
      </div>

      {/* Dynamic QR Box */}
      <div className="relative w-44 h-44 bg-white rounded-2xl mx-auto p-2.5 shadow-md flex items-center justify-center group border border-[#F5E086]/40">
        <img
          src={qrImageUrl}
          alt={`Pay ₹${amount} to ${UPI_ID}`}
          className="w-full h-full object-contain"
        />
        {/* Corner Scan Accent */}
        <span className="absolute -bottom-2.5 bg-[#2B3D36] text-[#F5E086] text-[9px] font-black uppercase px-2.5 py-0.5 rounded-full border border-[#F5E086]/40 shadow-xs">
          Scan to Pay ₹{amount}
        </span>
      </div>

      {/* UPI Details & Copy VPA */}
      <div className="pt-2 max-w-xs mx-auto space-y-2 text-xs">
        <div className="flex items-center justify-between p-2 rounded-xl bg-[#2B3D36] border border-white/10">
          <div className="text-left">
            <span className="text-[10px] text-white/50 block">UPI ID / VPA</span>
            <span className="font-mono font-bold text-white tracking-wide text-xs">
              {UPI_ID}
            </span>
          </div>

          <button
            type="button"
            onClick={handleCopy}
            className="px-2.5 py-1 rounded-lg bg-[#F5E086] hover:bg-[#F8E79B] text-[#24332D] font-bold text-[11px] transition flex items-center gap-1"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-800" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Payable Amount Highlight */}
        <div className="flex items-center justify-between px-2 text-[11px] text-[#FBF9F2]/80">
          <span>Accurate Payable Total:</span>
          <span className="font-niea font-bold text-base text-[#F5E086]">
            ₹{amount}
          </span>
        </div>

        {/* Mobile One-Tap Pay Button */}
        <button
          type="button"
          onClick={handleOpenUpiApp}
          className="w-full py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 border border-white/15"
        >
          <Smartphone className="w-3.5 h-3.5 text-[#F5E086]" />
          <span>Pay Directly with GPay / PhonePe / Paytm</span>
          <ExternalLink className="w-3 h-3 text-white/60" />
        </button>

        {/* Required UTR / Reference ID Field */}
        {onTxnIdChange && (
          <div className="pt-1 text-left">
            <label className="text-[10px] text-amber-200/90 font-bold block mb-1">
              Required: 12-digit UPI UTR / Ref No (for payment verification)
            </label>
            <input
              type="text"
              placeholder="e.g. 423985172039"
              value={txnIdValue}
              onChange={(e) => onTxnIdChange(e.target.value)}
              className="w-full px-3 py-1.5 rounded-lg bg-[#1D2B24] border border-white/15 text-xs text-white placeholder-white/30 focus:outline-none focus:border-[#F5E086]"
            />
          </div>
        )}
      </div>

      {/* Verification footer */}
      <div className="text-[10px] text-emerald-400/90 flex items-center justify-center gap-1">
        <ShieldCheck className="w-3.5 h-3.5" />
        <span>Verified Merchant: NiEA'S Sandwich Bar (Indiranagar)</span>
      </div>
    </div>
  );
};
