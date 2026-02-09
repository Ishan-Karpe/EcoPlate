import { motion } from "motion/react";
import { MapPin, Clock, CheckCircle2, Copy, Check, X, Timer, AlertTriangle } from "lucide-react";
import { Drop, Reservation, formatTime } from "./ecoplate-types";
import { useState, useEffect } from "react";

interface PickupCodeProps {
  drop: Drop;
  reservation: Reservation;
  onPickedUp: () => void;
  onCancel: () => void;
}

export function PickupCode({ drop, reservation, onPickedUp, onCancel }: PickupCodeProps) {
  const [copied, setCopied] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [minutesLeft, setMinutesLeft] = useState(90);

  // Simulated countdown timer
  useEffect(() => {
    const interval = setInterval(() => {
      setMinutesLeft((prev) => Math.max(0, prev - 1));
    }, 60000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  const handleCopy = () => {
    navigator.clipboard?.writeText(reservation.pickupCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (showCancelConfirm) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-card rounded-2xl border border-border p-6 w-full max-w-sm text-center space-y-4"
        >
          <div className="w-14 h-14 bg-amber-100 rounded-full flex items-center justify-center mx-auto">
            <AlertTriangle className="w-7 h-7 text-amber-600" />
          </div>
          <h2 className="text-[1.25rem]" style={{ fontWeight: 700 }}>
            Cancel reservation?
          </h2>
          <p className="text-[0.875rem] text-muted-foreground">
            Your box will be released back for other students to claim.
            {reservation.paymentMethod === "credit" && " Your Rescue Credit will be returned."}
            {reservation.paymentMethod === "card" && " Your payment will be refunded."}
          </p>
          <div className="space-y-2 pt-2">
            <button
              onClick={onCancel}
              className="w-full bg-destructive text-destructive-foreground py-3 rounded-xl text-[0.9375rem] active:scale-[0.98] transition-transform"
              style={{ fontWeight: 600 }}
            >
              Yes, cancel reservation
            </button>
            <button
              onClick={() => setShowCancelConfirm(false)}
              className="w-full bg-muted text-muted-foreground py-3 rounded-xl text-[0.9375rem]"
              style={{ fontWeight: 500 }}
            >
              Keep my reservation
            </button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Success header */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-primary text-primary-foreground px-5 pt-14 pb-8 rounded-b-[2rem] text-center"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: "spring", stiffness: 200 }}
          className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3"
        >
          <CheckCircle2 className="w-8 h-8" />
        </motion.div>
        <h1 className="text-[1.375rem]" style={{ fontWeight: 700 }}>
          You rescued a meal!
        </h1>
        <p className="text-white/80 text-[0.875rem] mt-1">
          Show this code at the pickup window
        </p>
      </motion.div>

      <div className="flex-1 px-5 py-6 space-y-4">
        {/* Countdown timer */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className={`rounded-xl p-3 flex items-center justify-center gap-2 ${
            minutesLeft <= 15
              ? "bg-red-50 border border-red-200"
              : minutesLeft <= 30
              ? "bg-amber-50 border border-amber-200"
              : "bg-blue-50 border border-blue-200"
          }`}
        >
          <Timer
            className={`w-4 h-4 ${
              minutesLeft <= 15
                ? "text-red-600"
                : minutesLeft <= 30
                ? "text-amber-600"
                : "text-blue-600"
            }`}
          />
          <span
            className={`text-[0.8rem] ${
              minutesLeft <= 15
                ? "text-red-700"
                : minutesLeft <= 30
                ? "text-amber-700"
                : "text-blue-700"
            }`}
            style={{ fontWeight: 600 }}
          >
            {minutesLeft > 0 ? `${minutesLeft} min left in pickup window` : "Window closing soon!"}
          </span>
        </motion.div>

        {/* Pickup Code */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl border-2 border-primary/20 p-6 text-center"
        >
          <p
            className="text-[0.75rem] text-muted-foreground mb-2"
            style={{ fontWeight: 500, textTransform: "uppercase", letterSpacing: "0.1em" }}
          >
            Your pickup code
          </p>
          <div className="flex items-center justify-center gap-3">
            <p
              className="text-[2.5rem] tracking-[0.15em] text-primary"
              style={{ fontWeight: 800, fontFamily: "'Inter', monospace" }}
            >
              {reservation.pickupCode}
            </p>
            <button
              onClick={handleCopy}
              className="p-2 rounded-lg bg-secondary text-primary hover:bg-accent transition-colors"
            >
              {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>
          <p className="text-[0.7rem] text-muted-foreground mt-2">
            Payment: {reservation.paymentMethod === "credit"
              ? "1 Rescue Credit used"
              : reservation.paymentMethod === "card"
              ? "Card charged"
              : `Pay $${drop.priceMin}-$${drop.priceMax} at pickup`}
          </p>
        </motion.div>

        {/* Pickup Details */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card rounded-2xl border border-border p-4 space-y-3"
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center">
              <MapPin className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-[0.875rem]" style={{ fontWeight: 600 }}>
                {drop.location}
              </p>
              <p className="text-[0.75rem] text-muted-foreground">{drop.locationDetail}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-accent rounded-lg flex items-center justify-center">
              <Clock className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="text-[0.875rem]" style={{ fontWeight: 600 }}>
                {formatTime(drop.windowStart)} - {formatTime(drop.windowEnd)}
              </p>
              <p className="text-[0.75rem] text-muted-foreground">Don't miss your window!</p>
            </div>
          </div>
        </motion.div>

        {/* No-show warning */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-center"
        >
          <p className="text-[0.8rem] text-amber-800">
            If you can't make it, cancel below so someone else can claim your box.
            No-shows without cancellation may affect your future access.
          </p>
        </motion.div>
      </div>

      {/* Action buttons */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="px-5 pb-8 pt-2 space-y-2"
      >
        <button
          onClick={onPickedUp}
          className="w-full bg-primary text-primary-foreground py-4 rounded-2xl text-[1.125rem] shadow-lg shadow-primary/25 active:scale-[0.98] transition-transform"
          style={{ fontWeight: 700 }}
        >
          I Picked Up My Box
        </button>
        <button
          onClick={() => setShowCancelConfirm(true)}
          className="w-full bg-card border border-border text-muted-foreground py-3 rounded-xl text-[0.875rem] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          style={{ fontWeight: 500 }}
        >
          <X className="w-4 h-4" />
          Cancel Reservation
        </button>
      </motion.div>
    </div>
  );
}
