import { motion } from "motion/react";
import { useState } from "react";
import { Bell, CreditCard, TrendingUp, X, Check, Zap, Shield } from "lucide-react";

interface AccountPromptProps {
  onSignUp: (plan: "none" | "basic" | "premium") => void;
  onDismiss: () => void;
  isFirstPickup: boolean;
}

export function AccountPrompt({ onSignUp, onDismiss, isFirstPickup }: AccountPromptProps) {
  const [selectedPlan, setSelectedPlan] = useState<"none" | "basic" | "premium">("none");
  const [step, setStep] = useState<"intro" | "plans">(isFirstPickup ? "intro" : "plans");

  const perks = [
    {
      icon: <Bell className="w-5 h-5 text-primary" />,
      title: "Drop alerts",
      desc: "Get notified when tonight's boxes go live",
    },
    {
      icon: <CreditCard className="w-5 h-5 text-primary" />,
      title: "Rescue Credits",
      desc: "Subscribe and never miss a meal",
    },
    {
      icon: <TrendingUp className="w-5 h-5 text-primary" />,
      title: "Your impact",
      desc: "Track meals rescued and waste prevented",
    },
  ];

  if (step === "plans") {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <div className="px-5 pt-12 flex justify-end">
          <button onClick={onDismiss} className="p-2 rounded-full bg-muted text-muted-foreground">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 px-5 py-4 flex flex-col">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <h1 className="text-[1.375rem]" style={{ fontWeight: 700 }}>
              Choose your plan
            </h1>
            <p className="text-muted-foreground text-[0.875rem] mt-1">
              Unlock credits, early access, and notifications
            </p>
          </motion.div>

          {/* Plan cards */}
          <div className="space-y-3 mb-4">
            {/* Free account */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              onClick={() => setSelectedPlan("none")}
              className={`w-full bg-card rounded-xl border-2 p-4 text-left transition-colors ${
                selectedPlan === "none" ? "border-primary" : "border-border"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-[0.9375rem]" style={{ fontWeight: 600 }}>
                  Free Account
                </p>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedPlan === "none" ? "border-primary bg-primary" : "border-gray-300"
                  }`}
                >
                  {selectedPlan === "none" && <Check className="w-3 h-3 text-white" />}
                </div>
              </div>
              <p className="text-[0.8rem] text-muted-foreground">
                Pay per box. Get drop alerts and impact tracking.
              </p>
            </motion.button>

            {/* Basic plan */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              onClick={() => setSelectedPlan("basic")}
              className={`w-full rounded-xl border-2 p-4 text-left transition-colors relative overflow-hidden ${
                selectedPlan === "basic"
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <p className="text-[0.9375rem]" style={{ fontWeight: 600 }}>
                    Rescue Basic
                  </p>
                  <span
                    className="bg-primary/10 text-primary text-[0.6rem] px-2 py-0.5 rounded-full"
                    style={{ fontWeight: 600 }}
                  >
                    Popular
                  </span>
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedPlan === "basic" ? "border-primary bg-primary" : "border-gray-300"
                  }`}
                >
                  {selectedPlan === "basic" && <Check className="w-3 h-3 text-white" />}
                </div>
              </div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-[1.5rem] text-primary" style={{ fontWeight: 800 }}>
                  $15
                </span>
                <span className="text-[0.8rem] text-muted-foreground">/month</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-[0.8rem]">Up to 7 Rescue Credits/month</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-[0.8rem]">~$2.14 per meal</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-[0.8rem]">Unused credits roll for 30 days</span>
                </div>
              </div>
            </motion.button>

            {/* Premium plan */}
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 }}
              onClick={() => setSelectedPlan("premium")}
              className={`w-full rounded-xl border-2 p-4 text-left transition-colors ${
                selectedPlan === "premium"
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card"
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <p className="text-[0.9375rem]" style={{ fontWeight: 600 }}>
                    Rescue Premium
                  </p>
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                </div>
                <div
                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                    selectedPlan === "premium" ? "border-primary bg-primary" : "border-gray-300"
                  }`}
                >
                  {selectedPlan === "premium" && <Check className="w-3 h-3 text-white" />}
                </div>
              </div>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-[1.5rem] text-primary" style={{ fontWeight: 800 }}>
                  $30
                </span>
                <span className="text-[0.8rem] text-muted-foreground">/month</span>
              </div>
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-[0.8rem]">Up to 15 Rescue Credits/month</span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-[0.8rem]">~$2.00 per meal</span>
                </div>
                <div className="flex items-center gap-2">
                  <Zap className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span className="text-[0.8rem]" style={{ fontWeight: 500 }}>
                    Early access: reserve first
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-primary shrink-0" />
                  <span className="text-[0.8rem]">Unused credits roll for 30 days</span>
                </div>
              </div>
            </motion.button>
          </div>

          {/* Fairness policy */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="bg-secondary rounded-xl p-3 flex items-start gap-2 mb-4"
          >
            <Shield className="w-4 h-4 text-primary mt-0.5 shrink-0" />
            <p className="text-[0.7rem] text-muted-foreground">
              <strong>Fairness policy:</strong> If you use less than 50% of credits for 2 months
              due to low supply, you can auto-downgrade the next month. We keep it fair.
            </p>
          </motion.div>

          <div className="mt-auto" />

          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="pb-8"
          >
            <button
              onClick={() => onSignUp(selectedPlan)}
              className="w-full bg-primary text-primary-foreground py-4 rounded-2xl text-[1.125rem] shadow-lg shadow-primary/25 active:scale-[0.98] transition-transform"
              style={{ fontWeight: 700 }}
            >
              {selectedPlan === "none"
                ? "Create Free Account"
                : selectedPlan === "basic"
                ? "Start Basic - $15/mo"
                : "Start Premium - $30/mo"}
            </button>
            <button onClick={onDismiss} className="w-full py-3 text-muted-foreground text-[0.875rem] mt-1">
              Maybe later
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  // Intro step (first pickup celebration)
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-5 pt-12 flex justify-end">
        <button onClick={onDismiss} className="p-2 rounded-full bg-muted text-muted-foreground">
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 px-5 py-4 flex flex-col">
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="text-[3.5rem] mb-3">🌱</div>
          <h1 className="text-[1.5rem] mb-2" style={{ fontWeight: 700 }}>
            You just rescued your first box!
          </h1>
          <p className="text-muted-foreground text-[1rem]">Want to make it a habit?</p>
        </motion.div>

        <div className="space-y-3 mb-8">
          {perks.map((perk, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.1 }}
              className="bg-card rounded-xl border border-border p-4 flex items-start gap-3"
            >
              <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center shrink-0">
                {perk.icon}
              </div>
              <div>
                <p className="text-[0.875rem]" style={{ fontWeight: 600 }}>
                  {perk.title}
                </p>
                <p className="text-[0.8rem] text-muted-foreground">{perk.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="mt-auto" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="pb-8"
        >
          <button
            onClick={() => setStep("plans")}
            className="w-full bg-primary text-primary-foreground py-4 rounded-2xl text-[1.125rem] shadow-lg shadow-primary/25 active:scale-[0.98] transition-transform"
            style={{ fontWeight: 700 }}
          >
            See Plans & Create Account
          </button>
          <button onClick={onDismiss} className="w-full py-3 text-muted-foreground text-[0.875rem] mt-1">
            Maybe later
          </button>
        </motion.div>
      </div>
    </div>
  );
}
