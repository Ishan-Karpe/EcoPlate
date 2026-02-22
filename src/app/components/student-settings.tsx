import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User,
  CreditCard,
  Bell,
  ChevronRight,
  CheckCircle2,
  Leaf,
  Shield,
  Zap,
} from "lucide-react";
import { UserState } from "./ecoplate-types";

interface StudentSettingsProps {
  user: UserState;
  onCreateAccount: (plan: "none" | "basic" | "premium", name: string, email: string) => void;
  onUpdatePlan: (plan: "none" | "basic" | "premium") => void;
}

const PLANS: {
  id: "none" | "basic" | "premium";
  name: string;
  price: string;
  credits: number;
  earlyAccess: boolean;
  features: string[];
}[] = [
  {
    id: "none",
    name: "Guest",
    price: "Free",
    credits: 0,
    earlyAccess: false,
    features: ["Reserve boxes at listed price", "Standard drop access"],
  },
  {
    id: "basic",
    name: "Rescue Basic",
    price: "$15 / mo",
    credits: 7,
    earlyAccess: false,
    features: ["7 Rescue Credits per month", "Use credits at checkout", "Reservation history"],
  },
  {
    id: "premium",
    name: "Rescue Premium",
    price: "$30 / mo",
    credits: 15,
    earlyAccess: true,
    features: [
      "15 Rescue Credits per month",
      "Early access to drops",
      "Priority waitlist position",
      "Everything in Basic",
    ],
  },
];

export function StudentSettings({ user, onCreateAccount, onUpdatePlan }: StudentSettingsProps) {
  const [selectedPlan, setSelectedPlan] = useState<"none" | "basic" | "premium">(
    user.membership?.plan ?? "none"
  );
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [showDetails, setShowDetails] = useState(false);
  const [saved, setSaved] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<{ name?: string; email?: string }>({});

  const currentPlanId = user.membership?.plan ?? "none";
  const planChanged = selectedPlan !== currentPlanId;

  const validateDetails = () => {
    const errs: { name?: string; email?: string } = {};
    if (!name.trim()) errs.name = "Name is required";
    if (!email.trim()) {
      errs.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errs.email = "Enter a valid email address";
    } else if (!email.toLowerCase().endsWith(".edu")) {
      errs.email = "Use your university .edu email";
    }
    setFieldErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleAction = () => {
    if (!user.hasAccount) {
      if (!showDetails) {
        setShowDetails(true);
        return;
      }
      if (!validateDetails()) return;
      onCreateAccount(selectedPlan, name.trim(), email.trim());
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } else {
      onUpdatePlan(selectedPlan);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    }
  };

  const actionLabel = () => {
    if (saved) return "Saved!";
    if (!user.hasAccount) {
      if (!showDetails) return selectedPlan === "none" ? "Continue as Guest" : `Continue with ${PLANS.find(p => p.id === selectedPlan)?.name}`;
      return selectedPlan === "none" ? "Create Free Account" : `Start ${PLANS.find(p => p.id === selectedPlan)?.name}`;
    }
    if (!planChanged) return "Plan is up to date";
    return `Switch to ${PLANS.find(p => p.id === selectedPlan)?.name}`;
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F9F6F1" }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pt-12 pb-6 rounded-b-[2rem] shadow-sm"
        style={{ backgroundColor: "#006838" }}
      >
        <div className="flex items-center gap-2.5 mb-1">
          <div
            className="w-9 h-9 rounded-xl flex items-center justify-center"
            style={{ backgroundColor: "rgba(255,255,255,0.18)" }}
          >
            <User className="w-5 h-5 text-white" />
          </div>
          <span className="text-white" style={{ fontWeight: 800, fontSize: "1.2rem" }}>
            {user.hasAccount ? "My Account" : "Profile"}
          </span>
        </div>
        <p className="text-white/70 mt-1" style={{ fontSize: "0.8rem" }}>
          {user.hasAccount
            ? "Manage your membership, credits, and preferences"
            : "Create an account to unlock credits and membership perks"}
        </p>
      </motion.div>

      <div className="flex-1 px-4 py-5 space-y-4 overflow-y-auto pb-28">

        {/* Account status card */}
        {user.hasAccount ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4 shadow-sm"
            style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.1)" }}
          >
            <div className="flex items-center gap-3">
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#E8F5EE" }}
              >
                <User className="w-5 h-5" style={{ color: "#006838" }} />
              </div>
              <div className="flex-1 min-w-0">
                <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1C2B1C" }}>
                  UCI Student
                </p>
                <p style={{ fontSize: "0.73rem", color: "#7A6B5A", marginTop: 1 }}>
                  {user.membership
                    ? `${user.membership.plan === "basic" ? "Rescue Basic" : "Rescue Premium"} · ${user.creditsRemaining} credits left`
                    : "Free account · No active plan"}
                </p>
              </div>
              <div
                className="px-2.5 py-1 rounded-full"
                style={{ backgroundColor: "#E8F5EE" }}
              >
                <span style={{ fontSize: "0.68rem", fontWeight: 700, color: "#006838" }}>
                  Active
                </span>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-4"
            style={{ backgroundColor: "#E8F5EE", border: "1px solid rgba(0,104,56,0.25)" }}
          >
            <div className="flex items-start gap-3">
              <Leaf className="w-5 h-5 mt-0.5 shrink-0" style={{ color: "#006838" }} />
              <div>
                <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#004D28" }}>
                  You're browsing as a guest
                </p>
                <p style={{ fontSize: "0.78rem", color: "#006838", marginTop: 3 }}>
                  Create a free account to track your impact, get drop notifications, and use Rescue Credits to pay for meals.
                </p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Membership plan selection */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p
            className="mb-3"
            style={{
              fontSize: "0.72rem",
              fontWeight: 700,
              letterSpacing: "0.07em",
              textTransform: "uppercase",
              color: "#7A6B5A",
            }}
          >
            {user.hasAccount ? "Change Plan" : "Choose a Plan"}
          </p>
          <div className="space-y-3">
            {PLANS.map((plan) => {
              const isCurrent = plan.id === currentPlanId;
              const isSelected = plan.id === selectedPlan;
              return (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className="w-full text-left rounded-2xl p-4 transition-all active:scale-[0.99]"
                  style={{
                    backgroundColor: isSelected ? "#E8F5EE" : "white",
                    border: `2px solid ${isSelected ? "#006838" : "rgba(0,104,56,0.1)"}`,
                    boxShadow: isSelected ? "0 2px 12px rgba(0,104,56,0.1)" : "0 1px 4px rgba(0,0,0,0.04)",
                  }}
                >
                  <div className="flex items-start gap-3">
                    {/* Radio */}
                    <div
                      className="w-5 h-5 rounded-full border-2 flex items-center justify-center mt-0.5 shrink-0"
                      style={{
                        borderColor: isSelected ? "#006838" : "#C4B9A8",
                        backgroundColor: isSelected ? "#006838" : "transparent",
                      }}
                    >
                      {isSelected && <div className="w-2 h-2 rounded-full bg-white" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1C2B1C" }}>
                          {plan.name}
                        </p>
                        {isCurrent && (
                          <span
                            className="px-1.5 py-0.5 rounded-full"
                            style={{
                              backgroundColor: "#006838",
                              color: "white",
                              fontSize: "0.58rem",
                              fontWeight: 700,
                            }}
                          >
                            Current
                          </span>
                        )}
                        {plan.earlyAccess && (
                          <span
                            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full"
                            style={{
                              backgroundColor: "#FEF3C7",
                              color: "#92400E",
                              fontSize: "0.58rem",
                              fontWeight: 700,
                            }}
                          >
                            <Zap className="w-2.5 h-2.5" />
                            Early Access
                          </span>
                        )}
                      </div>

                      <p style={{ fontSize: "1rem", fontWeight: 900, color: "#006838", marginTop: 2 }}>
                        {plan.price}
                      </p>

                      {plan.credits > 0 && (
                        <p style={{ fontSize: "0.72rem", color: "#8B6F47", fontWeight: 600, marginTop: 1 }}>
                          {plan.credits} Rescue Credits/month — use like cash at checkout
                        </p>
                      )}

                      <div className="mt-2 space-y-1">
                        {plan.features.map((f) => (
                          <div key={f} className="flex items-center gap-1.5">
                            <CheckCircle2
                              className="w-3 h-3 shrink-0"
                              style={{ color: isSelected ? "#006838" : "#C4B9A8" }}
                            />
                            <span style={{ fontSize: "0.72rem", color: "#7A6B5A" }}>{f}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Account details form — shown when creating account */}
        <AnimatePresence>
          {!user.hasAccount && showDetails && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="overflow-hidden"
            >
              <div
                className="rounded-2xl p-5 shadow-sm space-y-3"
                style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.1)" }}
              >
                <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1C2B1C" }}>
                  Your details
                </p>
                <div>
                  <label style={{ fontSize: "0.72rem", fontWeight: 600, color: fieldErrors.name ? "#C0392B" : "#7A6B5A" }}>
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, name: undefined }));
                    }}
                    placeholder="Your name"
                    className="w-full mt-1 px-3 py-2.5 rounded-xl outline-none"
                    style={{
                      backgroundColor: "#F5F1EB",
                      fontSize: "0.875rem",
                      color: "#1C2B1C",
                      border: fieldErrors.name ? "1.5px solid #FECACA" : "1.5px solid transparent",
                    }}
                  />
                  {fieldErrors.name && (
                    <p style={{ fontSize: "0.7rem", color: "#C0392B", marginTop: 3 }}>{fieldErrors.name}</p>
                  )}
                </div>
                <div>
                  <label style={{ fontSize: "0.72rem", fontWeight: 600, color: fieldErrors.email ? "#C0392B" : "#7A6B5A" }}>
                    UCI Email
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      setFieldErrors((prev) => ({ ...prev, email: undefined }));
                    }}
                    placeholder="you@uci.edu"
                    className="w-full mt-1 px-3 py-2.5 rounded-xl outline-none"
                    style={{
                      backgroundColor: "#F5F1EB",
                      fontSize: "0.875rem",
                      color: "#1C2B1C",
                      border: fieldErrors.email ? "1.5px solid #FECACA" : "1.5px solid transparent",
                    }}
                  />
                  {fieldErrors.email && (
                    <p style={{ fontSize: "0.7rem", color: "#C0392B", marginTop: 3 }}>{fieldErrors.email}</p>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Action button */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <button
            onClick={handleAction}
            disabled={user.hasAccount && !planChanged}
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            style={{
              backgroundColor: saved ? "#004D28" : user.hasAccount && !planChanged ? "#EDE8E1" : "#006838",
              color: user.hasAccount && !planChanged && !saved ? "#7A6B5A" : "white",
              fontSize: "1rem",
              fontWeight: 700,
              boxShadow: user.hasAccount && !planChanged ? "none" : "0 4px 20px rgba(0,104,56,0.28)",
              cursor: user.hasAccount && !planChanged ? "default" : "pointer",
            }}
          >
            {saved ? (
              <>
                <CheckCircle2 className="w-5 h-5" />
                Saved!
              </>
            ) : (
              actionLabel()
            )}
          </button>
        </motion.div>

        {/* Additional settings (for account holders) */}
        {user.hasAccount && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="rounded-2xl overflow-hidden shadow-sm"
            style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.1)" }}
          >
            {[
              {
                icon: Bell,
                label: "Drop Notifications",
                sublabel: "Get notified when new drops are posted",
              },
              {
                icon: CreditCard,
                label: "Payment Methods",
                sublabel: user.hasCardSaved
                  ? `Card ending in ${user.cardLast4}`
                  : "No saved card",
              },
              {
                icon: Shield,
                label: "Privacy & Data",
                sublabel: "Manage your data preferences",
              },
            ].map(({ icon: Icon, label, sublabel }, i, arr) => (
              <div key={label}>
                <button className="w-full flex items-center gap-3 p-4 active:bg-gray-50 transition-colors">
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "#F5F1EB" }}
                  >
                    <Icon className="w-4 h-4" style={{ color: "#8B6F47" }} />
                  </div>
                  <div className="flex-1 text-left">
                    <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1C2B1C" }}>
                      {label}
                    </p>
                    <p style={{ fontSize: "0.72rem", color: "#7A6B5A" }}>{sublabel}</p>
                  </div>
                  <ChevronRight className="w-4 h-4" style={{ color: "#C4B9A8" }} />
                </button>
                {i < arr.length - 1 && (
                  <div style={{ height: 1, backgroundColor: "#F0EBE3", marginLeft: 60 }} />
                )}
              </div>
            ))}
          </motion.div>
        )}

        {/* Privacy note */}
        <p className="text-center pb-2" style={{ fontSize: "0.7rem", color: "#7A6B5A" }}>
          EcoPlate is not intended for collecting sensitive personal information.
          Data is used solely for the UCI food rescue program.
        </p>
      </div>
    </div>
  );
}