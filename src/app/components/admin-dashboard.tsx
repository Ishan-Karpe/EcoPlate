import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Package,
  CheckCircle2,
  TrendingUp,
  Star,
  Plus,
  ScanLine,
  ArrowLeft,
  Leaf,
  UserX,
  AlertTriangle,
  ArrowUpRight,
  BarChart2,
  TrendingDown,
} from "lucide-react";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { AdminStats, Drop, formatTime } from "./ecoplate-types";
import { EcoplateLogo } from "./ecoplate-logo";

interface AdminDashboardProps {
  stats: AdminStats;
  activeDrops: Drop[];
  onCreateDrop: () => void;
  onRedeem: () => void;
  onNoShows: () => void;
  onLogout: () => void;
}

type TabKey = "overview" | "analytics" | "forecast";

export function AdminDashboard({
  stats,
  activeDrops,
  onCreateDrop,
  onRedeem,
  onNoShows,
  onLogout,
}: AdminDashboardProps) {
  const [activeTab, setActiveTab] = useState<TabKey>("overview");
  const [chartView, setChartView] = useState<"bar" | "area">("area");

  const tabs: { key: TabKey; label: string }[] = [
    { key: "overview", label: "Overview" },
    { key: "analytics", label: "Analytics" },
    { key: "forecast", label: "Forecast" },
  ];

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F9F6F1" }}>
      {/* Header */}
      <div
        className="px-5 pt-12 pb-5 rounded-b-[2rem] shadow-sm"
        style={{ backgroundColor: "#006838" }}
      >
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <EcoplateLogo
              iconSize={34}
              label="EcoPlate Staff"
              subLabel="Admin Dashboard"
              textColor="white"
              subTextColor="rgba(255,255,255,0.6)"
              fontSize="1.125rem"
            />
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1 text-white/70 px-3 py-1.5 rounded-full border border-white/20 active:bg-white/10"
            style={{ fontSize: "0.8rem" }}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Exit
          </button>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2">
          <QuickAction icon={<Plus className="w-4 h-4" />} label="New Drop" onClick={onCreateDrop} />
          <QuickAction icon={<ScanLine className="w-4 h-4" />} label="Redeem" onClick={onRedeem} />
          <QuickAction icon={<UserX className="w-4 h-4" />} label="No-shows" onClick={onNoShows} />
        </div>
      </div>

      {/* Tabs */}
      <div className="px-4 pt-4">
        <div
          className="flex rounded-2xl p-1"
          style={{ backgroundColor: "#EDE8E1" }}
        >
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className="flex-1 py-2 rounded-xl transition-all"
              style={{
                backgroundColor: activeTab === tab.key ? "white" : "transparent",
                color: activeTab === tab.key ? "#006838" : "#7A6B5A",
                fontSize: "0.8rem",
                fontWeight: 700,
                boxShadow: activeTab === tab.key ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="flex-1 px-4 py-4 space-y-4 overflow-y-auto pb-10"
        >
          {activeTab === "overview" && (
            <OverviewTab stats={stats} activeDrops={activeDrops} />
          )}
          {activeTab === "analytics" && (
            <AnalyticsTab
              stats={stats}
              chartView={chartView}
              setChartView={setChartView}
            />
          )}
          {activeTab === "forecast" && <ForecastTab />}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function QuickAction({
  icon,
  label,
  onClick,
}: {
  icon: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex-1 rounded-xl py-3 flex items-center justify-center gap-1.5 active:scale-[0.96] transition-transform"
      style={{ backgroundColor: "rgba(255,255,255,0.18)" }}
    >
      <span className="text-white">{icon}</span>
      <span className="text-white" style={{ fontSize: "0.78rem", fontWeight: 600 }}>
        {label}
      </span>
    </button>
  );
}

function OverviewTab({
  stats,
  activeDrops,
}: {
  stats: AdminStats;
  activeDrops: Drop[];
}) {
  return (
    <>
      {/* Active drops */}
      {activeDrops.filter((d) => d.status === "active" || d.status === "upcoming").length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
          <p style={{ fontSize: "0.78rem", fontWeight: 600, color: "#7A6B5A", marginBottom: 8 }}>
            Active Tonight
          </p>
          <div className="space-y-2">
            {activeDrops
              .filter((d) => d.status === "active" || d.status === "upcoming")
              .map((drop) => (
                <div
                  key={drop.id}
                  className="rounded-xl overflow-hidden flex items-stretch shadow-sm"
                  style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.1)" }}
                >
                  <div className="w-16 h-16 shrink-0 overflow-hidden">
                    <img src={drop.imageUrl} alt={drop.location} className="w-full h-full object-cover" />
                  </div>
                  <div className="flex-1 px-3 py-2 flex items-center justify-between min-w-0">
                    <div className="min-w-0">
                      <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1C2B1C" }} className="truncate">
                        {drop.location}
                      </p>
                      <p style={{ fontSize: "0.7rem", color: "#7A6B5A" }}>
                        {formatTime(drop.windowStart)}–{formatTime(drop.windowEnd)}
                      </p>
                    </div>
                    <div className="text-right ml-2 shrink-0">
                      <p style={{ fontSize: "0.9rem", fontWeight: 800, color: "#006838" }}>
                        {drop.remainingBoxes}/{drop.totalBoxes}
                      </p>
                      <p style={{ fontSize: "0.65rem", color: "#7A6B5A" }}>remaining</p>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </motion.div>
      )}

      {/* Stats Grid */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.05 }}
        className="grid grid-cols-3 gap-2"
      >
        <StatCard icon={<Package className="w-3.5 h-3.5" style={{ color: "#006838" }} />} label="Posted" value={stats.totalBoxesPosted} />
        <StatCard icon={<CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#006838" }} />} label="Picked Up" value={stats.totalBoxesPickedUp} />
        <StatCard icon={<TrendingUp className="w-3.5 h-3.5" style={{ color: "#006838" }} />} label="Pickup Rate" value={`${stats.pickupRate}%`} />
        <StatCard icon={<UserX className="w-3.5 h-3.5" style={{ color: "#C0392B" }} />} label="No-show" value={`${stats.noShowRate}%`} />
        <StatCard icon={<Star className="w-3.5 h-3.5" style={{ color: "#F59E0B" }} />} label="Rating" value={stats.avgRating} />
        <StatCard icon={<Leaf className="w-3.5 h-3.5" style={{ color: "#006838" }} />} label="Drops" value={stats.totalDrops} />
      </motion.div>

      {/* Location caps */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl p-4 shadow-sm"
        style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.1)" }}
      >
        <div className="flex items-center gap-2 mb-3">
          <AlertTriangle className="w-4 h-4" style={{ color: "#D97706" }} />
          <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#1C2B1C" }}>
            Daily Caps by Location
          </span>
        </div>
        <div className="space-y-2">
          {stats.locationCaps.map((cap) => (
            <div
              key={cap.location}
              className="flex items-center justify-between py-1.5"
              style={{ borderBottom: "1px solid rgba(0,104,56,0.08)" }}
            >
              <div>
                <p style={{ fontSize: "0.8rem", fontWeight: 500, color: "#1C2B1C" }}>
                  {cap.location}
                </p>
                <p style={{ fontSize: "0.65rem" }}>
                  {cap.consecutiveWeeksAbove85 >= 2 ? (
                    <span className="flex items-center gap-0.5" style={{ color: "#006838" }}>
                      <ArrowUpRight className="w-3 h-3" />
                      Eligible for +10 increase
                    </span>
                  ) : (
                    <span style={{ color: "#7A6B5A" }}>
                      {cap.consecutiveWeeksAbove85}/2 weeks above 85%
                    </span>
                  )}
                </p>
              </div>
              <div className="text-right">
                <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#006838" }}>
                  {cap.currentCap}
                </p>
                <p style={{ fontSize: "0.6rem", color: "#7A6B5A" }}>boxes/day</p>
              </div>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Impact */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-xl p-4"
        style={{
          background: "linear-gradient(135deg, #E8F5EE 0%, #F0EBE3 100%)",
          border: "1px solid rgba(0,104,56,0.2)",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Leaf className="w-4 h-4" style={{ color: "#006838" }} />
          <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#004D28" }}>
            Environmental Impact (Pilot)
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { value: stats.totalBoxesPickedUp, label: "meals rescued" },
            { value: `~${Math.round(stats.totalBoxesPickedUp * 1.5)}`, label: "lbs diverted" },
            {
              value: `~${Math.round(stats.totalBoxesPickedUp * 1.5 * 0.68)}`,
              label: "kg CO2 saved",
            },
          ].map((item, i) => (
            <div key={i}>
              <p style={{ fontSize: "1.25rem", fontWeight: 800, color: "#006838" }}>
                {item.value}
              </p>
              <p style={{ fontSize: "0.65rem", color: "#4A6B4A" }}>{item.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </>
  );
}

function AnalyticsTab({
  stats,
  chartView,
  setChartView,
}: {
  stats: AdminStats;
  chartView: "bar" | "area";
  setChartView: (v: "bar" | "area") => void;
}) {
  // hoveredDay lives here so chart interactions don't re-render parent
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);
  const selectedDay = hoveredDay ? stats.recentDrops.find((d) => d.date === hoveredDay) : null;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div
          className="rounded-xl p-3 shadow-lg"
          style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.15)" }}
        >
          <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#1C2B1C" }}>{label}</p>
          {payload.map((p: any, i: number) => (
            <p key={i} style={{ fontSize: "0.72rem", color: p.color }}>
              {p.name}: {p.value}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <>
      {/* Key metrics */}
      <div className="grid grid-cols-2 gap-3">
        <div
          className="rounded-xl p-4 shadow-sm"
          style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.1)" }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-4 h-4" style={{ color: "#006838" }} />
            <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#7A6B5A" }}>Pickup Rate</span>
          </div>
          <p style={{ fontSize: "1.75rem", fontWeight: 900, color: "#006838" }}>
            {stats.pickupRate}%
          </p>
          <div className="mt-2 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: "#EDE8E1" }}>
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${stats.pickupRate}%` }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="h-full rounded-full"
              style={{ backgroundColor: "#006838" }}
            />
          </div>
        </div>
        <div
          className="rounded-xl p-4 shadow-sm"
          style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.1)" }}
        >
          <div className="flex items-center gap-1.5 mb-1">
            <Star className="w-4 h-4" style={{ color: "#F59E0B" }} />
            <span style={{ fontSize: "0.7rem", fontWeight: 600, color: "#7A6B5A" }}>Avg Rating</span>
          </div>
          <p style={{ fontSize: "1.75rem", fontWeight: 900, color: "#1C2B1C" }}>
            {stats.avgRating}
          </p>
          <div className="flex gap-0.5 mt-2">
            {[1, 2, 3, 4, 5].map((s) => (
              <div
                key={s}
                className="h-1.5 flex-1 rounded-full"
                style={{ backgroundColor: s <= Math.round(stats.avgRating) ? "#F59E0B" : "#EDE8E1" }}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Weekly chart */}
      <div
        className="rounded-xl p-4 shadow-sm"
        style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.1)" }}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-4 h-4" style={{ color: "#006838" }} />
            <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1C2B1C" }}>
              This Week
            </span>
          </div>
          <div
            className="flex rounded-lg p-0.5"
            style={{ backgroundColor: "#F5F1EB" }}
          >
            {(["area", "bar"] as const).map((v) => (
              <button
                key={v}
                onClick={() => setChartView(v)}
                className="px-2.5 py-1 rounded-md transition-all"
                style={{
                  backgroundColor: chartView === v ? "white" : "transparent",
                  color: chartView === v ? "#006838" : "#7A6B5A",
                  fontSize: "0.7rem",
                  fontWeight: 600,
                  boxShadow: chartView === v ? "0 1px 4px rgba(0,0,0,0.08)" : "none",
                }}
              >
                {v === "area" ? "Trend" : "Bar"}
              </button>
            ))}
          </div>
        </div>

        {/* Selected day detail — always reserves height to prevent chart jumping */}
        <div
          style={{
            height: 52,
            marginBottom: 8,
            opacity: selectedDay ? 1 : 0,
            transition: "opacity 0.18s ease",
            pointerEvents: selectedDay ? "auto" : "none",
          }}
        >
          <div
            className="flex gap-3 p-2 rounded-xl h-full"
            style={{ backgroundColor: "#E8F5EE" }}
          >
            <div className="text-center">
              <p style={{ fontSize: "0.65rem", color: "#7A6B5A" }}>Posted</p>
              <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1C2B1C" }}>
                {selectedDay?.posted ?? "—"}
              </p>
            </div>
            <div className="text-center">
              <p style={{ fontSize: "0.65rem", color: "#7A6B5A" }}>Picked Up</p>
              <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#006838" }}>
                {selectedDay?.pickedUp ?? "—"}
              </p>
            </div>
            <div className="text-center">
              <p style={{ fontSize: "0.65rem", color: "#7A6B5A" }}>No-shows</p>
              <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#C0392B" }}>
                {selectedDay?.noShows ?? "—"}
              </p>
            </div>
            <div className="text-center">
              <p style={{ fontSize: "0.65rem", color: "#7A6B5A" }}>Rate</p>
              <p style={{ fontSize: "0.9rem", fontWeight: 700, color: "#006838" }}>
                {selectedDay
                  ? `${Math.round((selectedDay.pickedUp / selectedDay.posted) * 100)}%`
                  : "—"}
              </p>
            </div>
          </div>
        </div>

        <div style={{ height: 160 }}>
          <ResponsiveContainer width="100%" height="100%">
            {chartView === "area" ? (
              <AreaChart
                data={stats.recentDrops}
                onMouseMove={(e) => {
                  if (e.activePayload) setHoveredDay(e.activePayload[0]?.payload?.date);
                }}
                onMouseLeave={() => setHoveredDay(null)}
              >
                <defs>
                  <linearGradient id="greenGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#006838" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#006838" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="goldGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8B6F47" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#8B6F47" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,104,56,0.06)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#7A6B5A" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="posted"
                  name="Posted"
                  stroke="#8B6F47"
                  strokeWidth={2}
                  fill="url(#goldGrad)"
                  dot={{ r: 3, fill: "#8B6F47" }}
                />
                <Area
                  type="monotone"
                  dataKey="pickedUp"
                  name="Picked Up"
                  stroke="#006838"
                  strokeWidth={2.5}
                  fill="url(#greenGrad)"
                  dot={{ r: 3, fill: "#006838" }}
                />
              </AreaChart>
            ) : (
              <BarChart
                data={stats.recentDrops}
                onMouseMove={(e) => {
                  if (e.activePayload) setHoveredDay(e.activePayload[0]?.payload?.date);
                }}
                onMouseLeave={() => setHoveredDay(null)}
                barCategoryGap="30%"
              >
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(0,104,56,0.06)" />
                <XAxis
                  dataKey="date"
                  tick={{ fontSize: 11, fill: "#7A6B5A" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis hide />
                <Tooltip content={<CustomTooltip />} />
                <Bar dataKey="posted" name="Posted" radius={[4, 4, 0, 0]}>
                  {stats.recentDrops.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.date === hoveredDay ? "#8B6F47" : "rgba(139,111,71,0.25)"}
                    />
                  ))}
                </Bar>
                <Bar dataKey="pickedUp" name="Picked Up" radius={[4, 4, 0, 0]}>
                  {stats.recentDrops.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.date === hoveredDay ? "#006838" : "rgba(0,104,56,0.5)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        <div className="flex items-center gap-4 mt-3 pt-3" style={{ borderTop: "1px solid rgba(0,104,56,0.08)" }}>
          <LegendDot color="#006838" label="Picked up" />
          <LegendDot color="#8B6F47" label="Posted" />
          <LegendDot color="#C0392B" label="No-shows" dot />
        </div>
      </div>

      {/* Location comparison */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="rounded-xl p-4 shadow-sm"
        style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.1)" }}
      >
        <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#1C2B1C", marginBottom: 12 }}>
          By Location
        </p>
        {stats.locationCaps.map((cap, i) => {
          const rate = 78 + i * 7; // demo rates per location
          return (
            <div key={cap.location} className="mb-3">
              <div className="flex items-center justify-between mb-1">
                <span style={{ fontSize: "0.8rem", fontWeight: 500, color: "#4A3728" }}>
                  {cap.location}
                </span>
                <span style={{ fontSize: "0.78rem", fontWeight: 700, color: "#006838" }}>
                  {rate}%
                </span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#EDE8E1" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${rate}%` }}
                  transition={{ duration: 0.8, delay: 0.2 + i * 0.1, ease: "easeOut" }}
                  className="h-full rounded-full"
                  style={{
                    background: `linear-gradient(to right, #006838, ${i % 2 === 0 ? "#009958" : "#8B6F47"})`,
                  }}
                />
              </div>
            </div>
          );
        })}
      </motion.div>

      {/* Food diverted */}
      <motion.div
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="rounded-xl p-4"
        style={{
          background: "linear-gradient(135deg, #E8F5EE 0%, #F0EBE3 100%)",
          border: "1px solid rgba(0,104,56,0.2)",
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Leaf className="w-4 h-4" style={{ color: "#006838" }} />
          <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#004D28" }}>
            Food Rescue Impact
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { value: stats.totalBoxesPickedUp, label: "meals rescued" },
            { value: `~${Math.round(stats.totalBoxesPickedUp * 1.5)} lbs`, label: "food diverted" },
            {
              value: `~${Math.round(stats.totalBoxesPickedUp * 1.5 * 0.68)} kg`,
              label: "CO2 prevented",
            },
          ].map((item, i) => (
            <div key={i}>
              <p style={{ fontSize: "1.1rem", fontWeight: 800, color: "#006838" }}>
                {item.value}
              </p>
              <p style={{ fontSize: "0.65rem", color: "#4A6B4A" }}>{item.label}</p>
            </div>
          ))}
        </div>
      </motion.div>
    </>
  );
}

function ForecastTab() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex flex-col items-center justify-center py-20 px-4 text-center"
    >
      <div
        className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-5"
        style={{ backgroundColor: "#E8F5EE" }}
      >
        <TrendingUp className="w-8 h-8" style={{ color: "#006838", opacity: 0.6 }} />
      </div>
      <p
        style={{
          fontSize: "0.9375rem",
          fontWeight: 500,
          color: "#7A6B5A",
          lineHeight: 1.6,
          maxWidth: 280,
        }}
      >
        After 30+ days of data, Forecast v1 (ML-assisted) will be available.
      </p>
    </motion.div>
  );
}

function StatCard({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string | number;
}) {
  return (
    <div
      className="rounded-xl p-3 shadow-sm"
      style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.1)" }}
    >
      <div className="flex items-center gap-1.5 mb-1">
        {icon}
        <span style={{ fontSize: "0.6rem", fontWeight: 500, color: "#7A6B5A" }}>{label}</span>
      </div>
      <p style={{ fontSize: "1.375rem", fontWeight: 800, color: "#1C2B1C" }}>{value}</p>
    </div>
  );
}

function LegendDot({
  color,
  label,
  dot,
}: {
  color: string;
  label: string;
  dot?: boolean;
}) {
  return (
    <div className="flex items-center gap-1.5">
      {dot ? (
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: color }} />
      ) : (
        <div className="w-3 h-2 rounded-sm" style={{ backgroundColor: color }} />
      )}
      <span style={{ fontSize: "0.7rem", color: "#7A6B5A" }}>{label}</span>
    </div>
  );
}