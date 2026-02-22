import { useState, useEffect } from "react";
import { motion } from "motion/react";
import { MapPin, Clock, Copy, Check, Sparkles, Home } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { Drop, Reservation, formatTime } from "./ecoplate-types";

interface PickupCodeProps {
  drop: Drop;
  reservation: Reservation;
  onBackToHome: () => void;
}

export function PickupCode({ drop, reservation, onBackToHome }: PickupCodeProps) {
  const [copied, setCopied] = useState(false);
  // Auto-return countdown: 8 seconds
  const [countdown, setCountdown] = useState(8);
  const [autoReturning, setAutoReturning] = useState(true);

  const qrValue = `ECOPLATE:${reservation.pickupCode}:${drop.location}`;

  useEffect(() => {
    if (!autoReturning) return;
    if (countdown <= 0) {
      onBackToHome();
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, autoReturning, onBackToHome]);

  const handleCopy = () => {
    const text = reservation.pickupCode;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).catch(() => fallbackCopy(text));
    } else {
      fallbackCopy(text);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const fallbackCopy = (text: string) => {
    const el = document.createElement("textarea");
    el.value = text;
    el.style.position = "fixed";
    el.style.opacity = "0";
    document.body.appendChild(el);
    el.focus();
    el.select();
    try { document.execCommand("copy"); } catch (_) { /* silent */ }
    document.body.removeChild(el);
  };

  const handleGoHome = () => {
    setAutoReturning(false);
    onBackToHome();
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F9F6F1" }}>
      {/* Success header */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="px-5 pt-14 pb-7 rounded-b-[2.5rem] text-center relative overflow-hidden"
        style={{ backgroundColor: "#006838" }}
      >
        {/* Celebration particles */}
        {[...Array(12)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ y: 0, x: 0, opacity: 1, scale: 1 }}
            animate={{
              y: -90 - Math.random() * 70,
              x: (Math.random() - 0.5) * 220,
              opacity: 0,
              scale: 0,
            }}
            transition={{ duration: 1.3, delay: i * 0.04, ease: "easeOut" }}
            className="absolute rounded-full"
            style={{
              width: i % 2 === 0 ? 8 : 6,
              height: i % 2 === 0 ? 8 : 6,
              left: "50%",
              top: "45%",
              backgroundColor:
                i % 3 === 0 ? "#86efac" : i % 3 === 1 ? "#fbbf24" : "#ffffff",
            }}
          />
        ))}

        <motion.div
          initial={{ scale: 0, rotate: -15 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 220 }}
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-3"
          style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
        >
          <Sparkles className="w-8 h-8 text-white" />
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-white"
          style={{ fontSize: "1.375rem", fontWeight: 800 }}
        >
          You rescued a meal!
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="text-white/80 mt-1"
          style={{ fontSize: "0.875rem" }}
        >
          Show either code at the pickup window
        </motion.p>
      </motion.div>

      <div className="flex-1 px-4 py-5 space-y-4 overflow-y-auto pb-4">

        {/* Combined: QR + Code on same screen */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="rounded-2xl overflow-hidden shadow-sm"
          style={{ backgroundColor: "white", border: "2px solid rgba(0,104,56,0.15)" }}
        >
          {/* QR Code section */}
          <div className="flex flex-col items-center pt-5 pb-4 px-5">
            <p
              className="mb-3"
              style={{
                fontSize: "0.68rem",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#7A6B5A",
              }}
            >
              Scan at pickup window
            </p>
            <div
              className="p-3 rounded-2xl"
              style={{ backgroundColor: "white", border: "3px solid #006838" }}
            >
              <QRCodeSVG
                value={qrValue}
                size={160}
                fgColor="#006838"
                bgColor="#ffffff"
                level="M"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3 px-5">
            <div className="flex-1 h-px" style={{ backgroundColor: "#EDE8E1" }} />
            <span style={{ fontSize: "0.72rem", color: "#7A6B5A", fontWeight: 600 }}>
              or read code aloud
            </span>
            <div className="flex-1 h-px" style={{ backgroundColor: "#EDE8E1" }} />
          </div>

          {/* Text code section */}
          <div className="px-5 pt-4 pb-5">
            <div className="flex items-center justify-center gap-3">
              <p
                style={{
                  fontSize: "2.5rem",
                  fontWeight: 900,
                  letterSpacing: "0.22em",
                  fontFamily: "monospace",
                  color: "#006838",
                }}
              >
                {reservation.pickupCode}
              </p>
              <button
                onClick={handleCopy}
                className="p-2.5 rounded-xl active:scale-[0.95] transition-transform"
                style={{ backgroundColor: "#E8F5EE", color: "#006838" }}
                title="Copy code"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </button>
            </div>
            <p className="text-center mt-1" style={{ fontSize: "0.75rem", color: "#7A6B5A" }}>
              {copied ? "Copied to clipboard!" : "Tap to copy"}
            </p>
          </div>
        </motion.div>

        {/* Pickup details */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="rounded-2xl p-4 space-y-3 shadow-sm"
          style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.1)" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: "#E8F5EE" }}
            >
              <MapPin className="w-4 h-4" style={{ color: "#006838" }} />
            </div>
            <div>
              <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1C2B1C" }}>
                {drop.location}
              </p>
              <p style={{ fontSize: "0.75rem", color: "#7A6B5A" }}>{drop.locationDetail}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
              style={{ backgroundColor: "#E8F5EE" }}
            >
              <Clock className="w-4 h-4" style={{ color: "#006838" }} />
            </div>
            <div>
              <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1C2B1C" }}>
                {formatTime(drop.windowStart)} – {formatTime(drop.windowEnd)}
              </p>
              <p style={{ fontSize: "0.75rem", color: "#7A6B5A" }}>
                Don't miss your 90-minute pickup window!
              </p>
            </div>
          </div>
        </motion.div>

        {/* Payment note */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="rounded-xl p-3 text-center"
          style={{ backgroundColor: "#F0EBE3" }}
        >
          <p style={{ fontSize: "0.78rem", color: "#7A6B5A" }}>
            {reservation.paymentMethod === "credit"
              ? "1 Rescue Credit used · Available on home screen anytime"
              : reservation.paymentMethod === "card"
              ? `$${reservation.currentPrice} charged to your card`
              : `Pay $${reservation.currentPrice} at pickup`}
          </p>
        </motion.div>
      </div>

      {/* Auto-return button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="px-4 pb-24 pt-2 space-y-2"
      >
        <button
          onClick={handleGoHome}
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          style={{
            backgroundColor: "#006838",
            color: "white",
            fontSize: "1.0rem",
            fontWeight: 700,
            boxShadow: "0 4px 20px rgba(0,104,56,0.3)",
          }}
        >
          <Home className="w-5 h-5" />
          Go to Home Screen
          {autoReturning && (
            <span
              className="ml-1 px-2 py-0.5 rounded-full"
              style={{
                backgroundColor: "rgba(255,255,255,0.25)",
                fontSize: "0.78rem",
                fontWeight: 700,
              }}
            >
              {countdown}s
            </span>
          )}
        </button>
        <p className="text-center" style={{ fontSize: "0.72rem", color: "#7A6B5A" }}>
          Your code is accessible from the home screen banner anytime.
        </p>
      </motion.div>
    </div>
  );
}