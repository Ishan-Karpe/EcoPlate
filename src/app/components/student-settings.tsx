import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  User,
  CreditCard,
  Bell,
  ChevronRight,
  ChevronDown,
  CheckCircle2,
  Leaf,
  Shield,
  Zap,
  Info,
  Users,
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
  monthlyPrice: string;
  annualPrice: string;
  credits: number;
  earlyAccess: boolean;
  features: string[];
}[] = [
  {
    id: "none",
    name: "Guest",
    monthlyPrice: "Free",
    annualPrice: "Free",
    credits: 0,
    earlyAccess: false,
    features: ["Browse available drops", "Pay per box at listed price ($3\u20135)"],
  },
  {
    id: "basic",
    name: "Rescue Member",
    monthlyPrice: "$15 / mo",
    annualPrice: "$12 / mo",
    credits: 7,
    earlyAccess: false,
    features: ["7 Rescue Credits per month", "Use credits at checkout", "Reservation history"],
  },
  {
    id: "premium",
    name: "Rescue Premium",
    monthlyPrice: "$30 / mo",
    annualPrice: "$24 / mo",
    credits: 15,
    earlyAccess: true,
    features: [
      "15 Rescue Credits per month",
      "Early access to drops",
      "Priority waitlist position",
      "Everything in Member",
    ],
  },
];

const COMPARISON = [
  { feature: "Browse & reserve", guest: true, basic: true, premium: true },
  { feature: "Monthly credits", guest: "-", basic: "7", premium: "15" },
  { feature: "Pay per box ($3\u20135)", guest: true, basic: true, premium: true },
  { feature: "Early access (30 min)", guest: false, basic: false, premium: true },
  { feature: "Priority waitlist", guest: false, basic: false, premium: true },
  { feature: "Impact tracking", guest: false, basic: true, premium: true },
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
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("monthly");
  const [showWhyUpgrade, setShowWhyUpgrade] = useState(false);
  const [showEarlyAccessTip, setShowEarlyAccessTip] = useState(false);

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
                    ? `${user.membership.plan === "basic" ? "Rescue Member" : "Rescue Premium"} \u00b7 ${user.creditsRemaining} credits left`
                    : "Free account \u00b7 No active plan"}
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

        {/* Billing cycle toggle */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="flex items-center justify-center gap-1 p-1 rounded-full mx-auto w-fit"
          style={{ backgroundColor: "#EDE8E1" }}
        >
          <button
            onClick={() => setBillingCycle("monthly")}
            className="px-4 py-1.5 rounded-full transition-all"
            style={{
              backgroundColor: billingCycle === "monthly" ? "white" : "transparent",
              color: billingCycle === "monthly" ? "#1C2B1C" : "#7A6B5A",
              fontSize: "0.78rem",
              fontWeight: 600,
              boxShadow: billingCycle === "monthly" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}
          >
            Monthly
          </button>
          <button
            onClick={() => setBillingCycle("annual")}
            className="px-4 py-1.5 rounded-full transition-all flex items-center gap-1"
            style={{
              backgroundColor: billingCycle === "annual" ? "white" : "transparent",
              color: billingCycle === "annual" ? "#1C2B1C" : "#7A6B5A",
              fontSize: "0.78rem",
              fontWeight: 600,
              boxShadow: billingCycle === "annual" ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
            }}
          >
            Annual
            <span
              className="px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: "#E8F5EE", color: "#006838", fontSize: "0.58rem", fontWeight: 700 }}
            >
              Save 20%
            </span>
          </button>
        </motion.div>

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
              const isGuest = plan.id === "none";
              const isMostPopular = plan.id === "basic";
              const price = billingCycle === "annual" ? plan.annualPrice : plan.monthlyPrice;

              return (
                <button
                  key={plan.id}
                  onClick={() => setSelectedPlan(plan.id)}
                  className="w-full text-left rounded-2xl p-4 transition-all active:scale-[0.99] relative"
                  style={{
                    backgroundColor: isSelected ? (isGuest ? "#F5F1EB" : "#E8F5EE") : isGuest ? "#FAFAF8" : "white",
                    border: `2px solid ${isSelected ? "#006838" : isGuest ? "rgba(0,0,0,0.06)" : "rgba(0,104,56,0.1)"}`,
                    boxShadow: isSelected ? "0 2px 12px rgba(0,104,56,0.1)" : "0 1px 4px rgba(0,0,0,0.04)",
                    opacity: isGuest && !isSelected ? 0.85 : 1,
                  }}
                >
                  {/* Most Popular badge */}
                  {isMostPopular && (
                    <div
                      className="absolute -top-2.5 left-4 px-2.5 py-0.5 rounded-full"
                      style={{ backgroundColor: "#006838", color: "white", fontSize: "0.6rem", fontWeight: 700 }}
                    >
                      Most Popular
                    </div>
                  )}

                  <div className="flex items-start gap-3">
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
                        <p style={{ fontSize: isGuest ? "0.85rem" : "0.9rem", fontWeight: 700, color: "#1C2B1C" }}>
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
                            role="button"
                            tabIndex={0}
                            onClick={(e) => { e.stopPropagation(); setShowEarlyAccessTip(!showEarlyAccessTip); }}
                            onKeyDown={(e) => { if (e.key === "Enter") { e.stopPropagation(); setShowEarlyAccessTip(!showEarlyAccessTip); } }}
                            className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full cursor-pointer"
                            style={{
                              backgroundColor: "#FEF3C7",
                              color: "#92400E",
                              fontSize: "0.58rem",
                              fontWeight: 700,
                            }}
                          >
                            <Zap className="w-2.5 h-2.5" />
                            Early Access
                            <Info className="w-2.5 h-2.5 ml-0.5" />
                          </span>
                        )}
                      </div>

                      {/* Early access tooltip */}
                      {plan.earlyAccess && showEarlyAccessTip && (
                        <motion.div
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="mt-1 px-2.5 py-1.5 rounded-lg"
                          style={{ backgroundColor: "#FEF3C7", border: "1px solid #FCD34D" }}
                        >
                          <p style={{ fontSize: "0.68rem", color: "#92400E" }}>
                            Reserve 30 minutes before general release. Be first in line for every drop.
                          </p>
                        </motion.div>
                      )}

                      <p style={{ fontSize: isGuest ? "0.9rem" : "1rem", fontWeight: 900, color: "#006838", marginTop: 2 }}>
                        {price}
                      </p>

                      {plan.credits > 0 && (
                        <p style={{ fontSize: "0.72rem", color: "#8B6F47", fontWeight: 600, marginTop: 1 }}>
                          {plan.credits} Rescue Credits/month - use like cash at checkout
                        </p>
                      )}

                      {/* Cancel anytime */}
                      {plan.id !== "none" && (
                        <p style={{ fontSize: "0.65rem", color: "#B0A898", marginTop: 2 }}>
                          Cancel anytime
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

        {/* Social proof */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="flex items-center justify-center gap-2 py-2"
        >
          <Users className="w-3.5 h-3.5" style={{ color: "#006838" }} />
          <p style={{ fontSize: "0.75rem", color: "#006838", fontWeight: 600 }}>
            94 students are on Rescue Member
          </p>
        </motion.div>

        {/* Mini comparison table */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="rounded-2xl overflow-hidden shadow-sm"
          style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.1)" }}
        >
          <div className="px-4 py-3" style={{ borderBottom: "1px solid #F0EBE3" }}>
            <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "#1C2B1C" }}>
              Plan Comparison
            </p>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full" style={{ fontSize: "0.68rem" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #F0EBE3" }}>
                  <th className="text-left px-3 py-2" style={{ color: "#7A6B5A", fontWeight: 600 }}>Feature</th>
                  <th className="text-center px-2 py-2" style={{ color: "#7A6B5A", fontWeight: 600 }}>Guest</th>
                  <th className="text-center px-2 py-2" style={{ color: "#006838", fontWeight: 700 }}>Member</th>
                  <th className="text-center px-2 py-2" style={{ color: "#8B6F47", fontWeight: 700 }}>Premium</th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr key={i} style={{ borderBottom: i < COMPARISON.length - 1 ? "1px solid #F8F5F0" : "none" }}>
                    <td className="px-3 py-2" style={{ color: "#4A3728" }}>{row.feature}</td>
                    {(["guest", "basic", "premium"] as const).map((col) => {
                      const val = row[col];
                      return (
                        <td key={col} className="text-center px-2 py-2">
                          {typeof val === "boolean" ? (
                            val ? (
                              <CheckCircle2 className="w-3.5 h-3.5 mx-auto" style={{ color: "#006838" }} />
                            ) : (
                              <span style={{ color: "#D5CFC7" }}>&ndash;</span>
                            )
                          ) : (
                            <span style={{ fontWeight: 700, color: "#006838" }}>{val}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </motion.div>

        {/* Why upgrade? collapsible */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl overflow-hidden shadow-sm"
          style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.1)" }}
        >
          <button
            onClick={() => setShowWhyUpgrade(!showWhyUpgrade)}
            className="w-full flex items-center justify-between px-4 py-3"
          >
            <span style={{ fontSize: "0.82rem", fontWeight: 700, color: "#1C2B1C" }}>
              Why upgrade?
            </span>
            <ChevronDown
              className="w-4 h-4 transition-transform"
              style={{ color: "#7A6B5A", transform: showWhyUpgrade ? "rotate(180deg)" : "rotate(0)" }}
            />
          </button>
          <AnimatePresence>
            {showWhyUpgrade && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
                <div className="px-4 pb-4 space-y-2">
                  {[
                    "Save up to 40% versus pay-per-box pricing over a month",
                    "Never miss a drop with early access and priority waitlist",
                    "Track your environmental impact and food rescue history",
                    "Credits roll over for one month if unused",
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{ color: "#006838" }} />
                      <p style={{ fontSize: "0.75rem", color: "#7A6B5A", lineHeight: 1.4 }}>{item}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        {/* Account details form */}
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
                    maxLength={100}
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
                    maxLength={254}
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
          transition={{ delay: 0.25 }}
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
            transition={{ delay: 0.3 }}
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