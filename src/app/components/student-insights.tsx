import { useState } from "react";
import { motion } from "motion/react";
import { Leaf, TrendingUp, Package, BarChart2, Share2, Trophy, Target } from "lucide-react";
import { UserState } from "./ecoplate-types";

interface StudentInsightsProps {
  user: UserState;
}

// Demo state values
const DEMO = {
  mealsRescued: 5,
  dollarsSaved: 22,
  foodRescued: 4.2,
  co2Avoided: 1.9,
  boxesThisWeek: 3,
  potentialSavings: 24,
};

const MILESTONES = {
  meals: [5, 10, 25, 50, 100],
  savings: [10, 25, 50, 100, 250],
  food: [5, 10, 25, 50],
  boxes: [3, 5, 7, 10],
};

function getNextMilestone(value: number, milestones: number[]): number {
  for (const m of milestones) {
    if (value < m) return m;
  }
  return milestones[milestones.length - 1] * 2;
}

export function StudentInsights({ user }: StudentInsightsProps) {
  const [shareMsg, setShareMsg] = useState(false);

  // Use demo values for a believable pilot state
  const mealsRescued = user.totalPickups > 0 ? user.totalPickups : DEMO.mealsRescued;
  const moneySaved = mealsRescued > 0 ? mealsRescued * 4.4 : DEMO.dollarsSaved;
  const foodWaste = mealsRescued > 0 ? (mealsRescued * 0.84).toFixed(1) : DEMO.foodRescued.toFixed(1);

  const handleShare = () => {
    const text = `I rescued ${mealsRescued} meals with EcoPlate at UCI! Join me in fighting food waste.`;
    if (navigator.share) {
      navigator.share({ title: "EcoPlate Impact", text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).catch(() => {});
      setShareMsg(true);
      setTimeout(() => setShareMsg(false), 2000);
    }
  };

  const programStats = [
    { label: "Total meals rescued (all users)", value: "62 meals rescued" },
    { label: "Active dining locations", value: "2" },
    { label: "Avg. student saving per box", value: "~$8" },
    { label: "Weeks until launch", value: "6" },
  ];

  const stats = [
    {
      icon: <Leaf className="w-4 h-4" style={{ color: "#006838" }} />,
      bg: "#E8F5EE",
      value: mealsRescued,
      label: "Meals Rescued",
      color: "#006838",
      milestone: getNextMilestone(mealsRescued, MILESTONES.meals),
      progress: mealsRescued,
    },
    {
      icon: <Package className="w-4 h-4" style={{ color: "#006838" }} />,
      bg: "#E8F5EE",
      value: `${foodWaste} lb`,
      label: "Food Rescued",
      color: "#006838",
      milestone: getNextMilestone(parseFloat(String(foodWaste)), MILESTONES.food),
      progress: parseFloat(String(foodWaste)),
    },
    {
      icon: <Target className="w-4 h-4" style={{ color: "#006838" }} />,
      bg: "#E8F5EE",
      value: DEMO.boxesThisWeek,
      label: "Boxes This Week",
      color: "#006838",
      milestone: getNextMilestone(DEMO.boxesThisWeek, MILESTONES.boxes),
      progress: DEMO.boxesThisWeek,
    },
    {
      icon: <TrendingUp className="w-4 h-4" style={{ color: "#8B6F47" }} />,
      bg: "#FEF3C7",
      value: `$${DEMO.potentialSavings}`,
      label: "Potential Savings This Month",
      color: "#8B6F47",
      milestone: getNextMilestone(DEMO.potentialSavings, MILESTONES.savings),
      progress: DEMO.potentialSavings,
      lighter: true,
    },
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
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2.5">
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
          <button
            onClick={handleShare}
            className="w-9 h-9 rounded-xl flex items-center justify-center active:scale-95 transition-transform"
            style={{ backgroundColor: "rgba(255,255,255,0.18)" }}
          >
            <Share2 className="w-4 h-4 text-white" />
          </button>
        </div>
        <p className="text-white/70 mt-1" style={{ fontSize: "0.8rem" }}>
          Your contribution to reducing food waste at UCI
        </p>
        {shareMsg && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-white/90 mt-1"
            style={{ fontSize: "0.7rem" }}
          >
            Copied to clipboard!
          </motion.p>
        )}
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
            {stats.map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl p-4 shadow-sm"
                style={{
                  backgroundColor: stat.lighter ? "#FFFCF5" : "white",
                  border: `1px solid ${stat.lighter ? "rgba(139,111,71,0.12)" : "rgba(0,104,56,0.1)"}`,
                }}
              >
                <div
                  className="w-8 h-8 rounded-lg flex items-center justify-center mb-2"
                  style={{ backgroundColor: stat.bg }}
                >
                  {stat.icon}
                </div>
                <p style={{ fontSize: "1.5rem", fontWeight: 900, color: stat.color, lineHeight: 1.1 }}>
                  {stat.value}
                </p>
                <p style={{ fontSize: "0.68rem", color: "#7A6B5A", fontWeight: 600, marginTop: 3 }}>
                  {stat.label}
                </p>
                {/* Progress bar */}
                <div className="mt-2">
                  <div
                    className="flex items-center justify-between mb-0.5"
                    style={{ fontSize: "0.58rem", color: "#B0A898" }}
                  >
                    <span>{stat.progress}</span>
                    <span>{stat.milestone}</span>
                  </div>
                  <div
                    className="w-full h-1.5 rounded-full overflow-hidden"
                    style={{ backgroundColor: "#EDE8E1" }}
                  >
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${Math.min(100, (stat.progress / stat.milestone) * 100)}%` }}
                      transition={{ duration: 0.8, delay: 0.3 }}
                      className="h-full rounded-full"
                      style={{ backgroundColor: stat.color }}
                    />
                  </div>
                </div>
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
                    ? "Rescue Member"
                    : "Rescue Premium"
                  : "Free Explorer Account"}
              </p>
              <p style={{ fontSize: "0.75rem", color: "#7A6B5A", marginTop: 2 }}>
                {user.membership
                  ? `${user.creditsRemaining} credits remaining this month`
                  : "Upgrade for credits and early access"}
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
          <p className="mt-3" style={{ fontSize: "0.62rem", color: "#B0A898", fontStyle: "italic" }}>
            Based on EcoPlate internal projections
          </p>
        </motion.div>

        {/* This Week's Top Rescuer */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="rounded-2xl p-4 shadow-sm"
          style={{ backgroundColor: "#FEF3C7", border: "1px solid #FCD34D" }}
        >
          <div className="flex items-center gap-3">
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
              style={{ backgroundColor: "#F59E0B" }}
            >
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <div>
              <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#92400E" }}>
                This Week's Top Rescuer
              </p>
              <p style={{ fontSize: "0.72rem", color: "#B45309" }}>
                Alex M. rescued 7 boxes this week! Can you beat them?
              </p>
            </div>
          </div>
        </motion.div>

        {/* Empty state nudge */}
        {user.totalPickups === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.35 }}
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
