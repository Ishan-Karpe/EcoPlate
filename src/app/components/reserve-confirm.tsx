import { motion } from "motion/react";
import { useState } from "react";
import { MapPin, Clock, ArrowLeft, ShieldCheck, CreditCard, Wallet, Banknote } from "lucide-react";
import { Drop, formatTime, UserState } from "./ecoplate-types";

interface ReserveConfirmProps {
  drop: Drop;
  user: UserState;
  onConfirm: (paymentMethod: "card" | "credit" | "pay_at_pickup") => void;
  onBack: () => void;
}

export function ReserveConfirm({ drop, user, onConfirm, onBack }: ReserveConfirmProps) {
  const [paymentMethod, setPaymentMethod] = useState<"card" | "credit" | "pay_at_pickup">(
    user.membership && user.creditsRemaining > 0 ? "credit" : "pay_at_pickup"
  );
  const hasCredits = user.membership && user.creditsRemaining > 0;

  const paymentOptions: {
    value: "card" | "credit" | "pay_at_pickup";
    icon: React.ReactNode;
    label: string;
    desc: string;
    available: boolean;
  }[] = [
    ...(hasCredits
      ? [
          {
            value: "credit" as const,
            icon: <Wallet className="w-4 h-4" />,
            label: "Use Rescue Credit",
            desc: `${user.creditsRemaining} credits remaining`,
            available: true,
          },
        ]
      : []),
    {
      value: "pay_at_pickup" as const,
      icon: <Banknote className="w-4 h-4" />,
      label: "Pay at pickup",
      desc: `$${drop.priceMin}-$${drop.priceMax} cash or card`,
      available: true,
    },
    {
      value: "card" as const,
      icon: <CreditCard className="w-4 h-4" />,
      label: "Pay now by card",
      desc: `$${drop.priceMin}-$${drop.priceMax} charged immediately`,
      available: true,
    },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="px-5 pt-12 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-muted-foreground text-[0.875rem] mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Back
        </button>
        <h1 className="text-[1.5rem]" style={{ fontWeight: 700 }}>
          Confirm your box
        </h1>
        <p className="text-muted-foreground text-[0.875rem] mt-1">
          You're about to rescue a meal. Nice.
        </p>
      </div>

      {/* Summary Card */}
      <div className="flex-1 px-5 py-4 space-y-4 overflow-y-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card rounded-2xl border border-border p-5 space-y-4"
        >
          <div className="flex items-center gap-3 pb-4 border-b border-border">
            <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center text-[1.5rem]">
              {drop.emoji}
            </div>
            <div>
              <p className="text-[1rem]" style={{ fontWeight: 600 }}>
                Rescue Box
              </p>
              <p className="text-[0.8rem] text-muted-foreground">{drop.location}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-primary shrink-0" />
              <div>
                <p className="text-[0.875rem]" style={{ fontWeight: 500 }}>
                  {drop.locationDetail}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Clock className="w-4 h-4 text-primary shrink-0" />
              <div>
                <p className="text-[0.875rem]" style={{ fontWeight: 500 }}>
                  {formatTime(drop.windowStart)} - {formatTime(drop.windowEnd)}
                </p>
                <p className="text-[0.75rem] text-muted-foreground">90-minute pickup window</p>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between pt-4 border-t border-border">
            <span className="text-[0.875rem] text-muted-foreground">Estimated price</span>
            <span className="text-[1.25rem] text-primary" style={{ fontWeight: 700 }}>
              ${drop.priceMin}-${drop.priceMax}
            </span>
          </div>
        </motion.div>

        {/* Payment method selection */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-[0.8rem] text-muted-foreground mb-2" style={{ fontWeight: 600 }}>
            Payment method
          </p>
          <div className="space-y-2">
            {paymentOptions
              .filter((opt) => opt.available)
              .map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => setPaymentMethod(opt.value)}
                  className={`w-full bg-card rounded-xl border-2 p-3.5 flex items-center gap-3 text-left transition-colors ${
                    paymentMethod === opt.value
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/30"
                  }`}
                >
                  <div
                    className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${
                      paymentMethod === opt.value
                        ? "bg-primary text-white"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {opt.icon}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[0.875rem]" style={{ fontWeight: 600 }}>
                      {opt.label}
                    </p>
                    <p className="text-[0.75rem] text-muted-foreground">{opt.desc}</p>
                  </div>
                  <div
                    className={`w-5 h-5 rounded-full border-2 shrink-0 ml-auto flex items-center justify-center ${
                      paymentMethod === opt.value ? "border-primary" : "border-gray-300"
                    }`}
                  >
                    {paymentMethod === opt.value && (
                      <div className="w-2.5 h-2.5 bg-primary rounded-full" />
                    )}
                  </div>
                </button>
              ))}
          </div>
        </motion.div>

        {/* How pickup works */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-secondary rounded-2xl p-4 space-y-3"
        >
          <p className="text-[0.8rem] text-secondary-foreground" style={{ fontWeight: 600 }}>
            How pickup works
          </p>
          <div className="space-y-2">
            {[
              "You'll get a 6-digit pickup code",
              "Show it to staff at the pickup window",
              "Grab your box and enjoy!",
            ].map((step, i) => (
              <div key={i} className="flex items-center gap-2.5">
                <div
                  className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-[0.65rem]"
                  style={{ fontWeight: 700 }}
                >
                  {i + 1}
                </div>
                <span className="text-[0.8rem] text-secondary-foreground">{step}</span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* No-show warning */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-amber-50 border border-amber-200 rounded-xl p-3"
        >
          <p className="text-[0.75rem] text-amber-800">
            <strong>No-show policy:</strong> If you can't make it, cancel before the window starts
            to keep your credit. Repeat no-shows may lose early access privileges.
          </p>
        </motion.div>

        <div className="flex items-center gap-2 justify-center py-1">
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span className="text-[0.75rem] text-muted-foreground">
            Food handled by campus dining staff
          </span>
        </div>
      </div>

      {/* Confirm Button */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="px-5 pb-8 pt-2"
      >
        <button
          onClick={() => onConfirm(paymentMethod)}
          className="w-full bg-primary text-primary-foreground py-4 rounded-2xl text-[1.125rem] shadow-lg shadow-primary/25 active:scale-[0.98] transition-transform"
          style={{ fontWeight: 700 }}
        >
          {paymentMethod === "credit"
            ? "Use 1 Credit & Reserve"
            : paymentMethod === "card"
            ? `Pay $${drop.priceMin} & Reserve`
            : "Confirm Reservation"}
        </button>
        <p className="text-center text-[0.7rem] text-muted-foreground mt-2">
          {paymentMethod === "pay_at_pickup"
            ? "Pay at pickup. No-show? Box goes to someone else."
            : "Confirmed instantly. Cancel before window for a refund."}
        </p>
      </motion.div>
    </div>
  );
}
