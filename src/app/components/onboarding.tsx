import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  GraduationCap,
  Store,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  Search,
  QrCode,
  ShoppingBag,
  Leaf,
} from "lucide-react";
import { EcoplateLogo, EcoplateLogo_Icon } from "./ecoplate-logo";

type OnboardingStep = "college" | "role" | "discover" | "reserve" | "pickup" | "plan";

interface OnboardingProps {
  onComplete: (plan: "none" | "basic" | "premium") => void;
  onSkip: () => void;
}

const COLLEGES = [
  "UC Irvine",
  "UCLA",
  "UC Berkeley",
  "UC San Diego",
  "UC Davis",
  "UC Santa Barbara",
  "UC Santa Cruz",
  "UC Riverside",
  "UC Merced",
];

const PLANS = [
  {
    id: "none" as const,
    name: "Guest",
    price: "Free",
    desc: "Browse only, pay per box at listed price",
    features: ["Browse available drops", "Pay $3\u20135 per box"],
  },
  {
    id: "basic" as const,
    name: "Rescue Member",
    price: "$15/mo",
    desc: "7 credits per month",
    features: ["7 Rescue Credits/month", "Impact tracking", "Reservation history"],
    popular: true,
  },
  {
    id: "premium" as const,
    name: "Rescue Premium",
    price: "$30/mo",
    desc: "15 credits + early access",
    features: ["15 Rescue Credits/month", "30-min early access", "Priority waitlist", "Everything in Member"],
  },
];

export function Onboarding({ onComplete, onSkip }: OnboardingProps) {
  const [step, setStep] = useState<OnboardingStep>("college");
  const [selectedCollege, setSelectedCollege] = useState("UC Irvine");
  const [collegeSearch, setCollegeSearch] = useState("");
  const [showCollegeDropdown, setShowCollegeDropdown] = useState(false);
  const [selectedRole, setSelectedRole] = useState<"student" | "partner" | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<"none" | "basic" | "premium">("basic");

  const filteredColleges = COLLEGES.filter((c) =>
    c.toLowerCase().includes(collegeSearch.toLowerCase())
  );

  const stepIndex = ["college", "role", "discover", "reserve", "pickup", "plan"].indexOf(step);
  const totalSteps = 6;

  const goNext = () => {
    const steps: OnboardingStep[] = ["college", "role", "discover", "reserve", "pickup", "plan"];
    const current = steps.indexOf(step);
    if (current < steps.length - 1) {
      setStep(steps[current + 1]);
    }
  };

  const goBack = () => {
    const steps: OnboardingStep[] = ["college", "role", "discover", "reserve", "pickup", "plan"];
    const current = steps.indexOf(step);
    if (current > 0) {
      setStep(steps[current - 1]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F9F6F1" }}>
      {/* Progress bar */}
      <div className="px-6 pt-14 pb-2">
        <div className="flex items-center gap-1.5">
          {Array.from({ length: totalSteps }).map((_, i) => (
            <div key={i} className="flex-1 h-1 rounded-full overflow-hidden" style={{ backgroundColor: "#EDE8E1" }}>
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: i < stepIndex ? "#006838" : i === stepIndex ? "#006838" : "transparent" }}
                initial={{ width: 0 }}
                animate={{ width: i <= stepIndex ? "100%" : "0%" }}
                transition={{ duration: 0.3 }}
              />
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between mt-2">
          <span style={{ fontSize: "0.68rem", color: "#7A6B5A", fontWeight: 600 }}>
            Step {stepIndex + 1} of {totalSteps}
          </span>
          {stepIndex > 0 && stepIndex < totalSteps - 1 && (
            <span
              className="flex items-center gap-0.5"
              style={{ fontSize: "0.68rem", color: "#7A6B5A" }}
            >
              {Array.from({ length: stepIndex }).map((_, i) => (
                <CheckCircle2 key={i} className="w-3 h-3" style={{ color: "#006838" }} />
              ))}
            </span>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {/* ── STEP 1: CHOOSE COLLEGE ──────────────────────────────────────── */}
        {step === "college" && (
          <motion.div
            key="college"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col px-6 pb-10"
          >
            <div className="flex justify-center mt-6 mb-6">
              <EcoplateLogo_Icon size={56} color="#8B6F47" />
            </div>

            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1C2B1C", textAlign: "center" }}>
              Welcome to EcoPlate
            </h1>
            <p className="text-center mt-2 mb-8" style={{ fontSize: "0.875rem", color: "#7A6B5A" }}>
              Let's get you set up in 30 seconds
            </p>

            <label style={{ fontSize: "0.78rem", fontWeight: 700, color: "#4A3728", marginBottom: 8, display: "block" }}>
              Choose Your College
            </label>

            <div className="relative">
              <div
                className="flex items-center gap-2 px-4 py-3.5 rounded-2xl cursor-pointer"
                style={{
                  backgroundColor: "white",
                  border: "2px solid rgba(0,104,56,0.2)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                }}
                onClick={() => setShowCollegeDropdown(!showCollegeDropdown)}
              >
                <Search className="w-4 h-4 shrink-0" style={{ color: "#8B6F47" }} />
                <input
                  type="text"
                  placeholder="Search colleges..."
                  value={showCollegeDropdown ? collegeSearch : selectedCollege}
                  onChange={(e) => {
                    setCollegeSearch(e.target.value);
                    setShowCollegeDropdown(true);
                  }}
                  onFocus={() => {
                    setShowCollegeDropdown(true);
                    setCollegeSearch("");
                  }}
                  className="flex-1 bg-transparent outline-none"
                  style={{ fontSize: "0.9375rem", color: "#1C2B1C" }}
                />
                <ChevronRight
                  className="w-4 h-4 shrink-0 transition-transform"
                  style={{ color: "#7A6B5A", transform: showCollegeDropdown ? "rotate(90deg)" : "rotate(0)" }}
                />
              </div>

              <AnimatePresence>
                {showCollegeDropdown && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute top-full left-0 right-0 mt-1 rounded-xl overflow-hidden z-10 max-h-48 overflow-y-auto"
                    style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.12)", boxShadow: "0 8px 24px rgba(0,0,0,0.1)" }}
                  >
                    {filteredColleges.map((c) => (
                      <button
                        key={c}
                        onClick={() => {
                          setSelectedCollege(c);
                          setShowCollegeDropdown(false);
                          setCollegeSearch("");
                        }}
                        className="w-full text-left px-4 py-3 flex items-center justify-between transition-colors"
                        style={{
                          backgroundColor: selectedCollege === c ? "#E8F5EE" : "transparent",
                          borderBottom: "1px solid #F8F5F0",
                        }}
                      >
                        <span style={{ fontSize: "0.85rem", color: "#1C2B1C", fontWeight: selectedCollege === c ? 700 : 400 }}>
                          {c}
                        </span>
                        {selectedCollege === c && (
                          <CheckCircle2 className="w-4 h-4" style={{ color: "#006838" }} />
                        )}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <div className="flex-1" />

            <button
              onClick={goNext}
              disabled={!selectedCollege}
              className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              style={{
                backgroundColor: selectedCollege ? "#006838" : "#C4B9A8",
                color: "white",
                fontSize: "1rem",
                fontWeight: 700,
                boxShadow: selectedCollege ? "0 4px 16px rgba(0,104,56,0.3)" : "none",
                cursor: selectedCollege ? "pointer" : "not-allowed",
              }}
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onSkip}
              className="w-full mt-3 py-2 text-center"
              style={{ fontSize: "0.78rem", color: "#B0A898" }}
            >
              Skip for Demo
            </button>
          </motion.div>
        )}

        {/* ── STEP 2: CHOOSE ROLE ─────────────────────────────────────────── */}
        {step === "role" && (
          <motion.div
            key="role"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col px-6 pb-10"
          >
            <h1
              className="mt-6 mb-2"
              style={{ fontSize: "1.375rem", fontWeight: 800, color: "#1C2B1C", textAlign: "center" }}
            >
              Choose Your Role at {selectedCollege}
            </h1>
            <p className="text-center mb-8" style={{ fontSize: "0.85rem", color: "#7A6B5A" }}>
              This helps us personalize your experience
            </p>

            <div className="space-y-3 mb-auto">
              {/* Student card */}
              <button
                onClick={() => setSelectedRole("student")}
                className="w-full rounded-2xl p-5 text-left transition-all active:scale-[0.99]"
                style={{
                  backgroundColor: selectedRole === "student" ? "#E8F5EE" : "white",
                  border: `2px solid ${selectedRole === "student" ? "#006838" : "rgba(0,104,56,0.1)"}`,
                  boxShadow: selectedRole === "student" ? "0 4px 16px rgba(0,104,56,0.12)" : "0 1px 4px rgba(0,0,0,0.04)",
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "#E8F5EE" }}
                  >
                    <GraduationCap className="w-6 h-6" style={{ color: "#006838" }} />
                  </div>
                  <div>
                    <p style={{ fontSize: "1rem", fontWeight: 700, color: "#1C2B1C" }}>
                      I'm a Student
                    </p>
                    <p style={{ fontSize: "0.8rem", color: "#7A6B5A", marginTop: 2 }}>
                      Find affordable rescued meals near you
                    </p>
                  </div>
                </div>
              </button>

              {/* Dining Partner card */}
              <button
                onClick={() => setSelectedRole("partner")}
                className="w-full rounded-2xl p-5 text-left transition-all active:scale-[0.99]"
                style={{
                  backgroundColor: selectedRole === "partner" ? "#FEF3C7" : "white",
                  border: `2px solid ${selectedRole === "partner" ? "#D97706" : "rgba(0,104,56,0.1)"}`,
                  boxShadow: selectedRole === "partner" ? "0 4px 16px rgba(217,119,6,0.12)" : "0 1px 4px rgba(0,0,0,0.04)",
                }}
              >
                <div className="flex items-start gap-4">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "#FEF3C7" }}
                  >
                    <Store className="w-6 h-6" style={{ color: "#D97706" }} />
                  </div>
                  <div>
                    <p style={{ fontSize: "1rem", fontWeight: 700, color: "#1C2B1C" }}>
                      I'm a Dining Partner
                    </p>
                    <p style={{ fontSize: "0.8rem", color: "#7A6B5A", marginTop: 2 }}>
                      Post surplus food responsibly
                    </p>
                  </div>
                </div>
              </button>
            </div>

            <div className="flex-1" />

            <button
              onClick={goNext}
              disabled={!selectedRole}
              className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              style={{
                backgroundColor: selectedRole ? "#006838" : "#C4B9A8",
                color: "white",
                fontSize: "1rem",
                fontWeight: 700,
                boxShadow: selectedRole ? "0 4px 16px rgba(0,104,56,0.3)" : "none",
                cursor: selectedRole ? "pointer" : "not-allowed",
              }}
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={goBack}
              className="w-full mt-3 py-2 text-center"
              style={{ fontSize: "0.78rem", color: "#8B6F47" }}
            >
              Back to College Selection
            </button>
          </motion.div>
        )}

        {/* ── STEP 3: DISCOVER ────────────────────────────────────────────── */}
        {step === "discover" && (
          <motion.div
            key="discover"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col items-center justify-center px-6 pb-10"
          >
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
              style={{ backgroundColor: "#E8F5EE" }}
            >
              <QrCode className="w-12 h-12" style={{ color: "#006838" }} />
            </div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1C2B1C", textAlign: "center" }}>
              Discover Rescue Boxes
            </h1>
            <p className="text-center mt-3 mb-2" style={{ fontSize: "0.9rem", color: "#7A6B5A", maxWidth: 280 }}>
              Scan the QR code at any dining hall to see tonight's available Rescue Boxes.
            </p>
            <p className="text-center mb-auto" style={{ fontSize: "0.78rem", color: "#B0A898" }}>
              No account required to browse
            </p>

            <div className="flex-1" />

            <button
              onClick={goNext}
              className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              style={{
                backgroundColor: "#006838",
                color: "white",
                fontSize: "1rem",
                fontWeight: 700,
                boxShadow: "0 4px 16px rgba(0,104,56,0.3)",
              }}
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* ── STEP 4: RESERVE ─────────────────────────────────────────────── */}
        {step === "reserve" && (
          <motion.div
            key="reserve"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col items-center justify-center px-6 pb-10"
          >
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
              style={{ backgroundColor: "#E8F5EE" }}
            >
              <ShoppingBag className="w-12 h-12" style={{ color: "#006838" }} />
            </div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1C2B1C", textAlign: "center" }}>
              Reserve in Seconds
            </h1>
            <p className="text-center mt-3 mb-2" style={{ fontSize: "0.9rem", color: "#7A6B5A", maxWidth: 280 }}>
              Pick a box, tap reserve, done. It takes less than 30 seconds.
            </p>
            <p className="text-center mb-auto" style={{ fontSize: "0.78rem", color: "#B0A898" }}>
              Rescue Boxes from $3&ndash;5 each
            </p>

            <div className="flex-1" />

            <button
              onClick={goNext}
              className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              style={{
                backgroundColor: "#006838",
                color: "white",
                fontSize: "1rem",
                fontWeight: 700,
                boxShadow: "0 4px 16px rgba(0,104,56,0.3)",
              }}
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* ── STEP 5: PICK UP ─────────────────────────────────────────────── */}
        {step === "pickup" && (
          <motion.div
            key="pickup"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col items-center justify-center px-6 pb-10"
          >
            <div
              className="w-24 h-24 rounded-full flex items-center justify-center mb-6"
              style={{ backgroundColor: "#E8F5EE" }}
            >
              <Leaf className="w-12 h-12" style={{ color: "#006838" }} />
            </div>
            <h1 style={{ fontSize: "1.5rem", fontWeight: 800, color: "#1C2B1C", textAlign: "center" }}>
              Pick Up and Make Impact
            </h1>
            <p className="text-center mt-3 mb-2" style={{ fontSize: "0.9rem", color: "#7A6B5A", maxWidth: 300 }}>
              Collect within 90 minutes and reduce food waste and emissions.
            </p>
            <p className="text-center mb-auto" style={{ fontSize: "0.78rem", color: "#B0A898" }}>
              Every box rescued makes a difference
            </p>

            <div className="flex-1" />

            <button
              onClick={goNext}
              className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              style={{
                backgroundColor: "#006838",
                color: "white",
                fontSize: "1rem",
                fontWeight: 700,
                boxShadow: "0 4px 16px rgba(0,104,56,0.3)",
              }}
            >
              Continue
              <ArrowRight className="w-4 h-4" />
            </button>
          </motion.div>
        )}

        {/* ── STEP 6: PLAN SELECTION ──────────────────────────────────────── */}
        {step === "plan" && (
          <motion.div
            key="plan"
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -30 }}
            transition={{ duration: 0.2 }}
            className="flex-1 flex flex-col px-6 pb-10"
          >
            <h1
              className="mt-4 mb-2"
              style={{ fontSize: "1.375rem", fontWeight: 800, color: "#1C2B1C", textAlign: "center" }}
            >
              Choose Your Plan
            </h1>
            <p className="text-center mb-6" style={{ fontSize: "0.85rem", color: "#7A6B5A" }}>
              Pick the option that fits your lifestyle
            </p>

            <div className="space-y-3 mb-4">
              {PLANS.map((plan) => {
                const isSelected = plan.id === selectedPlan;
                return (
                  <button
                    key={plan.id}
                    onClick={() => setSelectedPlan(plan.id)}
                    className="w-full text-left rounded-2xl p-4 transition-all active:scale-[0.99] relative"
                    style={{
                      backgroundColor: isSelected ? "#E8F5EE" : "white",
                      border: `2px solid ${isSelected ? "#006838" : "rgba(0,104,56,0.1)"}`,
                      boxShadow: isSelected ? "0 2px 12px rgba(0,104,56,0.1)" : "0 1px 4px rgba(0,0,0,0.04)",
                    }}
                  >
                    {plan.popular && (
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
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1C2B1C" }}>
                            {plan.name}
                          </p>
                          <span style={{ fontSize: "0.9rem", fontWeight: 900, color: "#006838" }}>
                            {plan.price}
                          </span>
                        </div>
                        <p style={{ fontSize: "0.72rem", color: "#7A6B5A", marginTop: 2 }}>
                          {plan.desc}
                        </p>
                        <div className="mt-2 space-y-1">
                          {plan.features.map((f) => (
                            <div key={f} className="flex items-center gap-1.5">
                              <CheckCircle2 className="w-3 h-3 shrink-0" style={{ color: isSelected ? "#006838" : "#C4B9A8" }} />
                              <span style={{ fontSize: "0.7rem", color: "#7A6B5A" }}>{f}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>

            <div className="flex-1" />

            <button
              onClick={() => onComplete(selectedPlan)}
              className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              style={{
                backgroundColor: "#006838",
                color: "white",
                fontSize: "1rem",
                fontWeight: 700,
                boxShadow: "0 4px 16px rgba(0,104,56,0.3)",
              }}
            >
              {selectedPlan === "none" ? "Start as Guest" : `Start ${PLANS.find(p => p.id === selectedPlan)?.name}`}
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={() => onComplete("none")}
              className="w-full mt-3 py-2 text-center"
              style={{ fontSize: "0.78rem", color: "#B0A898" }}
            >
              Skip for Now
            </button>
            <p className="text-center mt-2" style={{ fontSize: "0.68rem", color: "#C4BAB0" }}>
              You can always upgrade later from your profile
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}