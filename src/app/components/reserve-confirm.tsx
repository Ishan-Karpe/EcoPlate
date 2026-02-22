import { motion } from "motion/react";
import { useState } from "react";
import {
  MapPin,
  Clock,
  ArrowLeft,
  ShieldCheck,
  CreditCard,
  Wallet,
  Lock,
  ChevronRight,
  Zap,
} from "lucide-react";
import { Drop, formatTime, UserState, calculateCurrentPrice } from "./ecoplate-types";

interface ReserveConfirmProps {
  drop: Drop;
  user: UserState;
  onConfirm: (paymentMethod: "card" | "credit" | "pay_at_pickup", cardLast4?: string) => void;
  onBack: () => void;
}

export function ReserveConfirm({ drop, user, onConfirm, onBack }: ReserveConfirmProps) {
  const hasCredits = !!(user.membership && user.creditsRemaining > 0);
  const hasSavedCard = user.hasCardSaved;

  // Decision tree: credit → saved card → new card
  const defaultMethod: "card" | "credit" = hasCredits ? "credit" : "card";
  const [paymentMethod, setPaymentMethod] = useState<"card" | "credit">(defaultMethod);
  const [showCardEntry, setShowCardEntry] = useState(false);
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{
    cardNumber?: string;
    expiry?: string;
    cvc?: string;
  }>({});
  const [isConfirming, setIsConfirming] = useState(false);

  const currentPrice = calculateCurrentPrice(drop);

  const formatCardNumber = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 16);
    return digits.replace(/(.{4})/g, "$1 ").trim();
  };
  const formatExpiry = (val: string) => {
    const digits = val.replace(/\D/g, "").slice(0, 4);
    if (digits.length >= 3) return digits.slice(0, 2) + "/" + digits.slice(2);
    return digits;
  };

  const handleConfirm = () => {
    if (paymentMethod === "credit") {
      // One-tap credit redemption: no form needed
      setIsConfirming(true);
      setTimeout(() => onConfirm("credit"), 400);
      return;
    }
    if (hasSavedCard) {
      // One-tap pay authorization: use saved card silently
      setIsConfirming(true);
      setTimeout(() => onConfirm("card"), 400);
      return;
    }
    // First-time card entry
    setShowCardEntry(true);
  };

  const handleCardSubmit = () => {
    if (isConfirming) return; // Prevent double submit

    const digits = cardNumber.replace(/\s/g, "");
    const errs: typeof fieldErrors = {};

    if (digits.length < 16) {
      errs.cardNumber = "Enter a valid 16-digit card number";
    } else if (!/^[0-9]{16}$/.test(digits)) {
      errs.cardNumber = "Card number must contain only digits";
    }
    if (expiry.length < 5) {
      errs.expiry = "Enter expiry in MM/YY format";
    } else {
      const parts = expiry.split("/");
      const mm = parts[0] ?? "";
      const yy = parts[1] ?? "";
      const month = parseInt(mm, 10);
      const year = 2000 + parseInt(yy, 10);
      if (isNaN(month) || isNaN(year)) {
        errs.expiry = "Enter a valid expiry date";
      } else if (month < 1 || month > 12) {
        errs.expiry = "Month must be 01-12";
      } else {
        const now = new Date();
        if (year < now.getFullYear() || (year === now.getFullYear() && month < now.getMonth() + 1)) {
          errs.expiry = "Card has expired";
        }
      }
    }
    const cvcDigits = cvc.replace(/\D/g, "");
    if (cvcDigits.length < 3) {
      errs.cvc = "CVC must be 3-4 digits";
    }

    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }
    setFieldErrors({});
    const last4 = digits.slice(-4);
    setIsConfirming(true);
    setTimeout(() => onConfirm("card", last4), 400);
  };

  // First-time card entry view
  if (showCardEntry) {
    return (
      <motion.div
        initial={{ opacity: 0, x: 30 }}
        animate={{ opacity: 1, x: 0 }}
        className="min-h-screen flex flex-col"
        style={{ backgroundColor: "#F9F6F1" }}
      >
        <div className="px-5 pt-12 pb-4">
          <button
            onClick={() => setShowCardEntry(false)}
            className="flex items-center gap-1 mb-4"
            style={{ color: "#7A6B5A", fontSize: "0.875rem" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
          <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#1C2B1C" }}>
            Add your card
          </h1>
          <p className="mt-1" style={{ fontSize: "0.875rem", color: "#7A6B5A" }}>
            Saved securely. Never asked again.
          </p>
        </div>

        <div className="flex-1 px-5 space-y-4 overflow-y-auto pb-4">
          {/* Order summary */}
          <div
            className="rounded-2xl overflow-hidden shadow-sm"
            style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.1)" }}
          >
            <div className="relative h-28 overflow-hidden">
              <img
                src={drop.imageUrl}
                alt={drop.location}
                className="w-full h-full object-cover"
              />
              <div
                className="absolute inset-0 flex items-end px-4 pb-3"
                style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent)" }}
              >
                <div>
                  <p className="text-white" style={{ fontSize: "1rem", fontWeight: 700 }}>
                    Rescue Box · {drop.location}
                  </p>
                  <p className="text-white/70" style={{ fontSize: "0.75rem" }}>
                    {formatTime(drop.windowStart)} – {formatTime(drop.windowEnd)}
                  </p>
                </div>
              </div>
            </div>
            <div
              className="px-4 py-3 flex items-center justify-between"
              style={{ borderTop: "1px solid rgba(0,104,56,0.08)" }}
            >
              <span style={{ fontSize: "0.875rem", color: "#7A6B5A" }}>Tonight's price</span>
              <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "#006838" }}>
                ${currentPrice}
              </span>
            </div>
          </div>

          {/* Card form */}
          <div
            className="rounded-2xl p-5 space-y-4 shadow-sm"
            style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.1)" }}
          >
            <div className="flex items-center gap-2 mb-1">
              <Lock className="w-4 h-4" style={{ color: "#006838" }} />
              <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#1C2B1C" }}>
                Secure card entry
              </p>
            </div>

            {/* Card number */}
            <div>
              <label style={{ fontSize: "0.75rem", fontWeight: 600, color: fieldErrors.cardNumber ? "#C0392B" : "#7A6B5A" }}>
                Card number
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={cardNumber}
                onChange={(e) => {
                  setCardNumber(formatCardNumber(e.target.value));
                  setFieldErrors((prev) => ({ ...prev, cardNumber: undefined }));
                }}
                placeholder="1234 5678 9012 3456"
                className="w-full mt-1.5 px-4 py-3 rounded-xl outline-none"
                style={{
                  backgroundColor: "#F5F1EB",
                  fontSize: "1rem",
                  fontFamily: "monospace",
                  letterSpacing: "0.05em",
                  color: "#1C2B1C",
                  border: fieldErrors.cardNumber ? "1.5px solid #FECACA" : "1.5px solid transparent",
                }}
              />
              {fieldErrors.cardNumber && (
                <p style={{ fontSize: "0.72rem", color: "#C0392B", marginTop: 4 }}>
                  {fieldErrors.cardNumber}
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              {/* Expiry */}
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: fieldErrors.expiry ? "#C0392B" : "#7A6B5A" }}>
                  Expiry
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={expiry}
                  onChange={(e) => {
                    setExpiry(formatExpiry(e.target.value));
                    setFieldErrors((prev) => ({ ...prev, expiry: undefined }));
                  }}
                  placeholder="MM/YY"
                  className="w-full mt-1.5 px-4 py-3 rounded-xl outline-none"
                  style={{
                    backgroundColor: "#F5F1EB",
                    fontSize: "1rem",
                    fontFamily: "monospace",
                    color: "#1C2B1C",
                    border: fieldErrors.expiry ? "1.5px solid #FECACA" : "1.5px solid transparent",
                  }}
                />
                {fieldErrors.expiry && (
                  <p style={{ fontSize: "0.68rem", color: "#C0392B", marginTop: 4 }}>
                    {fieldErrors.expiry}
                  </p>
                )}
              </div>
              {/* CVC */}
              <div>
                <label style={{ fontSize: "0.75rem", fontWeight: 600, color: fieldErrors.cvc ? "#C0392B" : "#7A6B5A" }}>
                  CVC
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  value={cvc}
                  onChange={(e) => {
                    setCvc(e.target.value.replace(/\D/g, "").slice(0, 4));
                    setFieldErrors((prev) => ({ ...prev, cvc: undefined }));
                  }}
                  placeholder="•••"
                  className="w-full mt-1.5 px-4 py-3 rounded-xl outline-none"
                  style={{
                    backgroundColor: "#F5F1EB",
                    fontSize: "1rem",
                    fontFamily: "monospace",
                    color: "#1C2B1C",
                    border: fieldErrors.cvc ? "1.5px solid #FECACA" : "1.5px solid transparent",
                  }}
                />
                {fieldErrors.cvc && (
                  <p style={{ fontSize: "0.68rem", color: "#C0392B", marginTop: 4 }}>
                    {fieldErrors.cvc}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Lock className="w-3 h-3" style={{ color: "#7A6B5A" }} />
              <p style={{ fontSize: "0.72rem", color: "#7A6B5A" }}>
                Your card is saved for future reservations. You won't be asked again.
              </p>
            </div>
          </div>
        </div>

        <div className="px-5 pb-24 pt-3">
          <button
            onClick={handleCardSubmit}
            disabled={isConfirming}
            className="w-full py-4 rounded-2xl active:scale-[0.98] transition-transform"
            style={{
              backgroundColor: isConfirming ? "#4A9B6A" : "#006838",
              color: "white",
              fontSize: "1.125rem",
              fontWeight: 700,
              boxShadow: "0 4px 20px rgba(0,104,56,0.3)",
            }}
          >
            {isConfirming ? "Reserving..." : `Pay $${currentPrice} and Reserve`}
          </button>
          <p className="text-center mt-2" style={{ fontSize: "0.7rem", color: "#7A6B5A" }}>
            Cancel before the window for a full refund.
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F9F6F1" }}>
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 mb-4"
          style={{ color: "#7A6B5A", fontSize: "0.875rem" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1C2B1C" }}>
          Confirm your box
        </h1>
        <p className="mt-1" style={{ fontSize: "0.875rem", color: "#7A6B5A" }}>
          You're about to rescue a meal.
        </p>
      </div>

      <div className="flex-1 px-5 space-y-4 overflow-y-auto pb-4">
        {/* Food photo + order summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-2xl overflow-hidden shadow-sm"
          style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.1)" }}
        >
          <div className="relative h-36 overflow-hidden">
            <img
              src={drop.imageUrl}
              alt={drop.location}
              className="w-full h-full object-cover"
            />
            <div
              className="absolute inset-0 flex items-end px-4 pb-3"
              style={{ background: "linear-gradient(to top, rgba(0,0,0,0.55), transparent)" }}
            >
              <div>
                <p className="text-white" style={{ fontSize: "1rem", fontWeight: 700 }}>
                  Rescue Box · {drop.location}
                </p>
                <p className="text-white/70" style={{ fontSize: "0.75rem" }}>
                  {drop.locationDetail}
                </p>
              </div>
            </div>
          </div>

          <div className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 shrink-0" style={{ color: "#006838" }} />
              <div>
                <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "#1C2B1C" }}>
                  {formatTime(drop.windowStart)} – {formatTime(drop.windowEnd)}
                </p>
                <p style={{ fontSize: "0.75rem", color: "#7A6B5A" }}>90-minute pickup window</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 shrink-0" style={{ color: "#006838" }} />
              <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "#1C2B1C" }}>
                {drop.locationDetail}
              </p>
            </div>

            <div
              className="flex items-center justify-between pt-3"
              style={{ borderTop: "1px solid rgba(0,104,56,0.1)" }}
            >
              <div>
                <span style={{ fontSize: "0.875rem", color: "#7A6B5A" }}>Tonight's price</span>
                <div className="flex items-center gap-1 mt-0.5">
                  <Zap className="w-3 h-3" style={{ color: "#8B6F47" }} />
                  <span style={{ fontSize: "0.68rem", color: "#8B6F47" }}>Dynamic $3–$5</span>
                </div>
              </div>
              <span style={{ fontSize: "1.375rem", fontWeight: 800, color: "#006838" }}>
                ${currentPrice}
              </span>
            </div>
          </div>
        </motion.div>

        {/* Payment method selection */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p
            className="mb-2"
            style={{ fontSize: "0.8rem", fontWeight: 600, color: "#7A6B5A" }}
          >
            Payment method
          </p>
          <div className="space-y-2">
            {hasCredits && (
              <PaymentOption
                selected={paymentMethod === "credit"}
                onSelect={() => setPaymentMethod("credit")}
                icon={<Wallet className="w-4 h-4" />}
                label="Use Rescue Credit"
                desc={`${user.creditsRemaining} credit${user.creditsRemaining !== 1 ? "s" : ""} remaining`}
                badge="Fastest"
              />
            )}
            <PaymentOption
              selected={paymentMethod === "card"}
              onSelect={() => setPaymentMethod("card")}
              icon={<CreditCard className="w-4 h-4" />}
              label={hasSavedCard ? `Saved card ••••${user.cardLast4}` : "Pay by card"}
              desc={
                hasSavedCard
                  ? `$${currentPrice} charged now, one tap`
                  : "Enter card details next"
              }
              badge={hasSavedCard && !hasCredits ? "One tap" : ""}
            />
          </div>
        </motion.div>

        {/* How pickup works */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="rounded-2xl p-4 space-y-3"
          style={{ backgroundColor: "#F0EBE3" }}
        >
          <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#4A3728" }}>How pickup works</p>
          {[
            "You'll get a QR code + 6-digit pickup code",
            "Show either one to staff at the pickup counter",
            "Grab your Rescue Box and enjoy!",
          ].map((step, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div
                className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: "#006838", color: "white", fontSize: "0.65rem", fontWeight: 700 }}
              >
                {i + 1}
              </div>
              <span style={{ fontSize: "0.8rem", color: "#4A3728" }}>{step}</span>
            </div>
          ))}
        </motion.div>

        {/* No-show warning */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-xl p-3"
          style={{ backgroundColor: "#FEF3C7", border: "1px solid #FCD34D" }}
        >
          <p style={{ fontSize: "0.75rem", color: "#92400E" }}>
            <strong>No-show policy:</strong> If you can't make it, cancel from the home screen
            before the window starts. Repeat no-shows may lose early access.
          </p>
        </motion.div>

        <div className="flex items-center gap-2 justify-center py-1">
          <ShieldCheck className="w-4 h-4" style={{ color: "#006838" }} />
          <span style={{ fontSize: "0.75rem", color: "#7A6B5A" }}>
            Food handled by campus dining staff
          </span>
        </div>
      </div>

      {/* Confirm Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="px-5 pb-24 pt-3"
      >
        <button
          onClick={handleConfirm}
          disabled={isConfirming}
          className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
          style={{
            backgroundColor: isConfirming ? "#4A9B6A" : "#006838",
            color: "white",
            fontSize: "1.125rem",
            fontWeight: 700,
            boxShadow: "0 4px 20px rgba(0,104,56,0.3)",
          }}
        >
          {isConfirming ? (
            "Reserving..."
          ) : paymentMethod === "credit" ? (
            <>
              Use 1 Credit and Reserve
              <ChevronRight className="w-5 h-5" />
            </>
          ) : hasSavedCard ? (
            <>
              Pay ${currentPrice} and Reserve
              <ChevronRight className="w-5 h-5" />
            </>
          ) : (
            <>
              Continue to Payment
              <ChevronRight className="w-5 h-5" />
            </>
          )}
        </button>
        <p className="text-center mt-2" style={{ fontSize: "0.7rem", color: "#7A6B5A" }}>
          {paymentMethod === "card" && !hasSavedCard
            ? "You'll enter card details on the next screen."
            : "Cancel before window opens for a full refund."}
        </p>
      </motion.div>
    </div>
  );
}

function PaymentOption({
  selected,
  onSelect,
  icon,
  label,
  desc,
  badge,
}: {
  selected: boolean;
  onSelect: () => void;
  icon: React.ReactNode;
  label: string;
  desc: string;
  badge?: string;
}) {
  return (
    <button
      onClick={onSelect}
      className="w-full rounded-xl p-3.5 flex items-center gap-3 text-left transition-colors"
      style={{
        border: selected ? "2px solid #006838" : "2px solid rgba(0,104,56,0.12)",
        backgroundColor: selected ? "#E8F5EE" : "white",
      }}
    >
      <div
        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
        style={{
          backgroundColor: selected ? "#006838" : "#EDE8E1",
          color: selected ? "white" : "#7A6B5A",
        }}
      >
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1C2B1C" }}>{label}</p>
          {badge && (
            <span
              className="px-1.5 py-0.5 rounded-md"
              style={{ backgroundColor: "#E8F5EE", color: "#006838", fontSize: "0.6rem", fontWeight: 700 }}
            >
              {badge}
            </span>
          )}
        </div>
        <p style={{ fontSize: "0.75rem", color: "#7A6B5A" }}>{desc}</p>
      </div>
      <div
        className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0"
        style={{ borderColor: selected ? "#006838" : "#D0C8BF" }}
      >
        {selected && <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: "#006838" }} />}
      </div>
    </button>
  );
}