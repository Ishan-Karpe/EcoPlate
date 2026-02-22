import { motion } from "motion/react";
import { useState } from "react";
import { Bell, TrendingUp, X, Check, Zap, Shield, Leaf, CreditCard, Lock, User, Mail } from "lucide-react";

interface AccountPromptProps {
  onSignUp: (plan: "none" | "basic" | "premium", name: string, email: string) => void;
  onDismiss: () => void;
}

export function AccountPrompt({ onSignUp, onDismiss }: AccountPromptProps) {
  const [step, setStep] = useState<"intro" | "form" | "plans">("intro");
  const [selectedPlan, setSelectedPlan] = useState<"none" | "basic" | "premium">("none");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [formError, setFormError] = useState("");

  const handleFormNext = () => {
    if (!name.trim()) { setFormError("Please enter your name"); return; }
    if (!email.includes("@")) { setFormError("Please enter a valid email"); return; }
    setFormError("");
    setStep("plans");
  };

  if (step === "intro") {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F9F6F1" }}>
        <div className="px-5 pt-12 flex justify-end">
          <button
            onClick={onDismiss}
            className="p-2 rounded-full"
            style={{ backgroundColor: "#EDE8E1", color: "#7A6B5A" }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 px-5 py-4 flex flex-col">
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-8"
          >
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
              className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "#E8F5EE" }}
            >
              <Leaf className="w-10 h-10" style={{ color: "#006838" }} />
            </motion.div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1C2B1C" }}>
              You just rescued your first box!
            </h1>
            <p className="mt-2" style={{ fontSize: "1rem", color: "#7A6B5A" }}>
              Want to make it a habit?
            </p>
          </motion.div>

          <div className="space-y-3 mb-8">
            {[
              {
                icon: <Bell className="w-5 h-5" style={{ color: "#006838" }} />,
                title: "Drop alerts",
                desc: "Get notified when tonight's boxes go live",
              },
              {
                icon: <CreditCard className="w-5 h-5" style={{ color: "#006838" }} />,
                title: "Rescue Credits",
                desc: "Subscribe and never miss a meal",
              },
              {
                icon: <TrendingUp className="w-5 h-5" style={{ color: "#006838" }} />,
                title: "Your impact",
                desc: "Track meals rescued and waste prevented",
              },
            ].map((perk, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + i * 0.1 }}
                className="rounded-xl p-4 flex items-start gap-3 shadow-sm"
                style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.1)" }}
              >
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
                  style={{ backgroundColor: "#E8F5EE" }}
                >
                  {perk.icon}
                </div>
                <div>
                  <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1C2B1C" }}>
                    {perk.title}
                  </p>
                  <p style={{ fontSize: "0.8rem", color: "#7A6B5A" }}>{perk.desc}</p>
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
              onClick={() => setStep("form")}
              className="w-full py-4 rounded-2xl active:scale-[0.98] transition-transform"
              style={{
                backgroundColor: "#006838",
                color: "white",
                fontSize: "1.125rem",
                fontWeight: 700,
                boxShadow: "0 4px 20px rgba(0,104,56,0.3)",
              }}
            >
              Create My Account
            </button>
            <button
              onClick={onDismiss}
              className="w-full py-3 mt-1"
              style={{ fontSize: "0.875rem", color: "#7A6B5A" }}
            >
              Maybe later
            </button>
          </motion.div>
        </div>
      </div>
    );
  }

  if (step === "form") {
    return (
      <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F9F6F1" }}>
        <div className="px-5 pt-12 flex justify-end">
          <button
            onClick={onDismiss}
            className="p-2 rounded-full"
            style={{ backgroundColor: "#EDE8E1", color: "#7A6B5A" }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="px-5 pb-4">
          <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#1C2B1C" }}>
            Create your account
          </h1>
          <p className="mt-1" style={{ fontSize: "0.875rem", color: "#7A6B5A" }}>
            Quick setup — just name and email
          </p>
        </div>

        <div className="flex-1 px-5 space-y-4 overflow-y-auto">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-5 space-y-4 shadow-sm"
            style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.1)" }}
          >
            <div>
              <label
                className="flex items-center gap-1.5 mb-1.5"
                style={{ fontSize: "0.75rem", fontWeight: 600, color: "#7A6B5A" }}
              >
                <User className="w-3.5 h-3.5" />
                Your name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="First name"
                className="w-full px-4 py-3 rounded-xl outline-none"
                style={{ backgroundColor: "#F5F1EB", fontSize: "1rem", color: "#1C2B1C" }}
              />
            </div>
            <div>
              <label
                className="flex items-center gap-1.5 mb-1.5"
                style={{ fontSize: "0.75rem", fontWeight: 600, color: "#7A6B5A" }}
              >
                <Mail className="w-3.5 h-3.5" />
                Email address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@uci.edu"
                className="w-full px-4 py-3 rounded-xl outline-none"
                style={{ backgroundColor: "#F5F1EB", fontSize: "1rem", color: "#1C2B1C" }}
              />
            </div>
            {formError && (
              <p style={{ fontSize: "0.8rem", color: "#C0392B" }}>{formError}</p>
            )}
          </motion.div>

          <div
            className="rounded-xl p-3 flex items-start gap-2"
            style={{ backgroundColor: "#F0EBE3" }}
          >
            <Lock className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#8B6F47" }} />
            <p style={{ fontSize: "0.72rem", color: "#7A6B5A" }}>
              Your card on file will be used for future reservations. You won't be asked to enter it
              again. Upgrade plans live in a separate tab — no pressure.
            </p>
          </div>
        </div>

        <div className="px-5 pb-8 pt-4">
          <button
            onClick={handleFormNext}
            className="w-full py-4 rounded-2xl active:scale-[0.98] transition-transform"
            style={{
              backgroundColor: "#006838",
              color: "white",
              fontSize: "1.125rem",
              fontWeight: 700,
              boxShadow: "0 4px 20px rgba(0,104,56,0.3)",
            }}
          >
            Continue
          </button>
        </div>
      </div>
    );
  }

  // Plan selection step
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F9F6F1" }}>
      <div className="px-5 pt-12 flex justify-end">
        <button
          onClick={onDismiss}
          className="p-2 rounded-full"
          style={{ backgroundColor: "#EDE8E1", color: "#7A6B5A" }}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="px-5 pb-4">
        <h1 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#1C2B1C" }}>
          Choose your plan
        </h1>
        <p className="mt-1" style={{ fontSize: "0.875rem", color: "#7A6B5A" }}>
          Free users pay per box. Plans give you credits at a better rate.
        </p>
      </div>

      <div className="flex-1 px-5 space-y-3 overflow-y-auto pb-4">
        {/* Free */}
        <PlanCard
          selected={selectedPlan === "none"}
          onSelect={() => setSelectedPlan("none")}
          title="Free Account"
          badge=""
          price=""
          priceNote="Pay per box ($3–$5 each)"
          features={[
            "Drop alerts when boxes go live",
            "Impact tracking",
            "No monthly commitment",
          ]}
        />

        {/* Basic */}
        <PlanCard
          selected={selectedPlan === "basic"}
          onSelect={() => setSelectedPlan("basic")}
          title="Rescue Basic"
          badge="Popular"
          price="$15/mo"
          priceNote="~$2.14 per meal"
          features={[
            "7 Rescue Credits/month",
            "Credits roll for 30 days",
            "Drop alerts + priority support",
          ]}
          accent
        />

        {/* Premium */}
        <PlanCard
          selected={selectedPlan === "premium"}
          onSelect={() => setSelectedPlan("premium")}
          title="Rescue Premium"
          badge=""
          price="$30/mo"
          priceNote="~$2.00 per meal"
          features={[
            "15 Rescue Credits/month",
            "Early access — reserve before others",
            "Credits roll for 30 days",
          ]}
          premium
        />

        {/* Fairness policy */}
        <div
          className="rounded-xl p-3 flex items-start gap-2"
          style={{ backgroundColor: "#F0EBE3" }}
        >
          <Shield className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#8B6F47" }} />
          <p style={{ fontSize: "0.7rem", color: "#7A6B5A" }}>
            <strong>Fairness policy:</strong> If you use less than 50% of credits for 2 months due
            to low supply, you can auto-downgrade the next month.
          </p>
        </div>
      </div>

      <div className="px-5 pb-8 pt-3">
        <button
          onClick={() => onSignUp(selectedPlan, name, email)}
          className="w-full py-4 rounded-2xl active:scale-[0.98] transition-transform"
          style={{
            backgroundColor: "#006838",
            color: "white",
            fontSize: "1.125rem",
            fontWeight: 700,
            boxShadow: "0 4px 20px rgba(0,104,56,0.3)",
          }}
        >
          {selectedPlan === "none"
            ? "Create Free Account"
            : selectedPlan === "basic"
            ? "Start Basic – $15/mo"
            : "Start Premium – $30/mo"}
        </button>
        <button
          onClick={onDismiss}
          className="w-full py-3 mt-1"
          style={{ fontSize: "0.875rem", color: "#7A6B5A" }}
        >
          Maybe later
        </button>
      </div>
    </div>
  );
}

function PlanCard({
  selected,
  onSelect,
  title,
  badge,
  price,
  priceNote,
  features,
  accent,
  premium,
}: {
  selected: boolean;
  onSelect: () => void;
  title: string;
  badge: string;
  price: string;
  priceNote: string;
  features: string[];
  accent?: boolean;
  premium?: boolean;
}) {
  return (
    <button
      onClick={onSelect}
      className="w-full rounded-xl p-4 text-left transition-all active:scale-[0.98]"
      style={{
        backgroundColor: selected ? "#E8F5EE" : "white",
        border: selected ? "2px solid #006838" : "2px solid rgba(0,104,56,0.12)",
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span style={{ fontSize: "0.9375rem", fontWeight: 700, color: "#1C2B1C" }}>{title}</span>
          {badge && (
            <span
              className="px-2 py-0.5 rounded-full"
              style={{ backgroundColor: "#E8F5EE", color: "#006838", fontSize: "0.6rem", fontWeight: 700 }}
            >
              {badge}
            </span>
          )}
          {premium && <Zap className="w-3.5 h-3.5" style={{ color: "#8B6F47" }} />}
        </div>
        <div
          className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
          style={{ borderColor: selected ? "#006838" : "#D0C8BF" }}
        >
          {selected && <Check className="w-3 h-3" style={{ color: "#006838" }} />}
        </div>
      </div>

      {price && (
        <div className="flex items-baseline gap-1 mb-2">
          <span style={{ fontSize: "1.375rem", fontWeight: 800, color: "#006838" }}>{price}</span>
        </div>
      )}
      <p className="mb-2" style={{ fontSize: "0.78rem", color: "#7A6B5A" }}>{priceNote}</p>

      <div className="space-y-1">
        {features.map((f, i) => (
          <div key={i} className="flex items-center gap-2">
            <Check className="w-3.5 h-3.5 shrink-0" style={{ color: "#006838" }} />
            <span style={{ fontSize: "0.78rem", color: "#4A3728" }}>{f}</span>
          </div>
        ))}
      </div>
    </button>
  );
}
