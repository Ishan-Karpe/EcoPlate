import { motion } from "motion/react";
import { Leaf, TrendingUp, Package, Award, Info, BarChart2 } from "lucide-react";
import { UserState } from "./ecoplate-types";

interface StudentInsightsProps {
  user: UserState;
}

export function StudentInsights({ user }: StudentInsightsProps) {
  const mealsRescued = user.totalPickups;
  const moneySaved = mealsRescued * 8; // vs ~$12 campus meal, saved ~$8 each
  const foodWaste = (mealsRescued * 0.75).toFixed(1); // ~0.75 lbs per meal
  const co2Saved = (mealsRescued * 1.2).toFixed(1);   // ~1.2 kg CO₂ per meal

  const programStats = [
    { label: "Total meals rescued (all users)", value: "357+" },
    { label: "Active dining locations", value: "2" },
    { label: "Avg. student saving per box", value: "~$8" },
    { label: "Pilot weeks running", value: "3" },
  ];

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
            <TrendingUp className="w-5 h-5 text-white" />
          </div>
          <span className="text-white" style={{ fontWeight: 800, fontSize: "1.2rem" }}>
            My Impact
          </span>
        </div>
        <p className="text-white/70 mt-1" style={{ fontSize: "0.8rem" }}>
          Your contribution to reducing food waste at UCI
        </p>
      </motion.div>

      <div className="flex-1 px-4 py-5 space-y-4 overflow-y-auto pb-28">

        {/* Personal impact stats grid */}
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
            Your Stats
          </p>
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                icon: <Leaf className="w-4 h-4" style={{ color: "#006838" }} />,
                bg: "#E8F5EE",
                value: mealsRescued,
                label: "Meals Rescued",
                color: "#006838",
              },
              {
                icon: <span style={{ color: "#D97706", fontWeight: 900, fontSize: "0.95rem" }}>$</span>,
                bg: "#FEF3C7",
                value: `$${moneySaved}`,
                label: "Dollars Saved",
                color: "#8B6F47",
              },
              {
                icon: <Package className="w-4 h-4" style={{ color: "#006838" }} />,
                bg: "#E8F5EE",
                value: `${foodWaste} lb`,
                label: "Food Rescued",
                color: "#006838",
              },
              {
                icon: <Award className="w-4 h-4" style={{ color: "#006838" }} />,
                bg: "#E8F5EE",
                value: `${co2Saved} kg`,
                label: "CO₂ Avoided",
                color: "#006838",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl p-4 shadow-sm"
                style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.1)" }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                  style={{ backgroundColor: stat.bg }}
                >
                  {stat.icon}
                </div>
                <p style={{ fontSize: "1.6rem", fontWeight: 900, color: stat.color, lineHeight: 1.1 }}>
                  {stat.value}
                </p>
                <p style={{ fontSize: "0.7rem", color: "#7A6B5A", fontWeight: 600, marginTop: 3 }}>
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Membership / credits */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="rounded-2xl p-4 shadow-sm"
          style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.1)" }}
        >
          <div className="flex items-center justify-between">
            <div>
              <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1C2B1C" }}>
                {user.membership
                  ? user.membership.plan === "basic"
                    ? "Rescue Basic"
                    : "Rescue Premium"
                  : "Guest Account"}
              </p>
              <p style={{ fontSize: "0.75rem", color: "#7A6B5A", marginTop: 2 }}>
                {user.membership
                  ? `${user.creditsRemaining} credits remaining this month`
                  : "No membership — go to Profile to upgrade"}
              </p>
            </div>
            {user.membership ? (
              <div className="px-3 py-1 rounded-full" style={{ backgroundColor: "#E8F5EE" }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 700, color: "#006838" }}>Active</span>
              </div>
            ) : (
              <div className="px-3 py-1 rounded-full" style={{ backgroundColor: "#F5F1EB" }}>
                <span style={{ fontSize: "0.72rem", fontWeight: 600, color: "#7A6B5A" }}>Free</span>
              </div>
            )}
          </div>

          {/* Credit bar */}
          {user.membership && (
            <div className="mt-3">
              <div
                className="flex items-center justify-between mb-1"
                style={{ fontSize: "0.68rem", color: "#7A6B5A" }}
              >
                <span>{user.creditsRemaining} left</span>
                <span>{user.membership.creditsPerMonth} total/mo</span>
              </div>
              <div
                className="w-full h-2 rounded-full overflow-hidden"
                style={{ backgroundColor: "#EDE8E1" }}
              >
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${(user.creditsRemaining / user.membership.creditsPerMonth) * 100}%`,
                    backgroundColor: "#006838",
                  }}
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* No-show warning */}
        {user.noShowCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.22 }}
            className="rounded-xl p-3 flex items-start gap-2"
            style={{ backgroundColor: "#FEF3C7", border: "1px solid #FCD34D" }}
          >
            <Info className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#D97706" }} />
            <p style={{ fontSize: "0.75rem", color: "#92400E" }}>
              You have {user.noShowCount} no-show{user.noShowCount > 1 ? "s" : ""} on record.
              After 3 no-shows, your account may be suspended.
            </p>
          </motion.div>
        )}

        {/* Program-wide stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-2xl p-4 shadow-sm"
          style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.1)" }}
        >
          <div className="flex items-center gap-2 mb-3">
            <BarChart2 className="w-4 h-4" style={{ color: "#006838" }} />
            <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1C2B1C" }}>
              UCI EcoPlate Program
            </p>
          </div>
          <div className="space-y-3">
            {programStats.map((stat) => (
              <div
                key={stat.label}
                className="flex items-center justify-between"
                style={{ borderBottom: "1px solid #F0EBE3", paddingBottom: 10 }}
              >
                <p style={{ fontSize: "0.78rem", color: "#7A6B5A" }}>{stat.label}</p>
                <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#006838" }}>
                  {stat.value}
                </p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Empty state nudge */}
        {mealsRescued === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
            className="rounded-xl p-4 text-center"
            style={{ backgroundColor: "#E8F5EE", border: "1px solid rgba(0,104,56,0.2)" }}
          >
            <Leaf className="w-8 h-8 mx-auto mb-2" style={{ color: "#006838", opacity: 0.5 }} />
            <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#004D28" }}>
              Your impact starts with your first box
            </p>
            <p className="mt-1" style={{ fontSize: "0.78rem", color: "#006838" }}>
              Reserve a Rescue Box from the home screen to start tracking your stats.
            </p>
          </motion.div>
        )}
      </div>
    </div>
  );
}
