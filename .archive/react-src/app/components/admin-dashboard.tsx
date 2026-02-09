import { motion } from "motion/react";
import {
  Package,
  CheckCircle2,
  TrendingUp,
  Star,
  Plus,
  ScanLine,
  ArrowLeft,
  Leaf,
  BarChart3,
  UserX,
  Bookmark,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";
import { AdminStats, Drop, formatTime } from "./ecoplate-types";

interface AdminDashboardProps {
  stats: AdminStats;
  activeDrops: Drop[];
  onCreateDrop: () => void;
  onRedeem: () => void;
  onNoShows: () => void;
  onLogout: () => void;
}

export function AdminDashboard({
  stats,
  activeDrops,
  onCreateDrop,
  onRedeem,
  onNoShows,
  onLogout,
}: AdminDashboardProps) {
  const maxPosted = Math.max(...stats.recentDrops.map((d) => d.posted));

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-5 pt-12 pb-6 rounded-b-[2rem]">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Leaf className="w-5 h-5" />
            </div>
            <span className="text-[1.125rem]" style={{ fontWeight: 700 }}>
              EcoPlate Staff
            </span>
          </div>
          <button
            onClick={onLogout}
            className="flex items-center gap-1 text-white/70 text-[0.8rem] px-3 py-1.5 rounded-full border border-white/20"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Exit
          </button>
        </div>

        {/* Quick actions */}
        <div className="flex gap-2 mt-2">
          <button
            onClick={onCreateDrop}
            className="flex-1 bg-white/20 backdrop-blur rounded-xl py-3 flex items-center justify-center gap-1.5 active:bg-white/30 transition-colors"
          >
            <Plus className="w-4 h-4" />
            <span className="text-[0.8rem]" style={{ fontWeight: 600 }}>
              New Drop
            </span>
          </button>
          <button
            onClick={onRedeem}
            className="flex-1 bg-white/20 backdrop-blur rounded-xl py-3 flex items-center justify-center gap-1.5 active:bg-white/30 transition-colors"
          >
            <ScanLine className="w-4 h-4" />
            <span className="text-[0.8rem]" style={{ fontWeight: 600 }}>
              Redeem
            </span>
          </button>
          <button
            onClick={onNoShows}
            className="flex-1 bg-white/20 backdrop-blur rounded-xl py-3 flex items-center justify-center gap-1.5 active:bg-white/30 transition-colors"
          >
            <UserX className="w-4 h-4" />
            <span className="text-[0.8rem]" style={{ fontWeight: 600 }}>
              No-shows
            </span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="px-5 py-5 space-y-4 flex-1 overflow-y-auto pb-8">
        {/* Active drops */}
        {activeDrops.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <p className="text-[0.8rem] text-muted-foreground mb-2" style={{ fontWeight: 600 }}>
              Active Drops Tonight
            </p>
            <div className="space-y-2">
              {activeDrops
                .filter((d) => d.status === "active" || d.status === "upcoming")
                .map((drop) => (
                  <div
                    key={drop.id}
                    className="bg-card rounded-xl border border-border p-3 flex items-center gap-3"
                  >
                    <div className="w-10 h-10 bg-accent rounded-lg flex items-center justify-center text-[1.25rem]">
                      {drop.emoji}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[0.8rem] truncate" style={{ fontWeight: 600 }}>
                        {drop.location}
                      </p>
                      <p className="text-[0.7rem] text-muted-foreground">
                        {formatTime(drop.windowStart)}-{formatTime(drop.windowEnd)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-[0.875rem] text-primary" style={{ fontWeight: 700 }}>
                        {drop.remainingBoxes}/{drop.totalBoxes}
                      </p>
                      <p className="text-[0.65rem] text-muted-foreground">remaining</p>
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
          <div className="bg-card rounded-xl border border-border p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Package className="w-3.5 h-3.5 text-primary" />
              <span className="text-[0.6rem] text-muted-foreground" style={{ fontWeight: 500 }}>
                Posted
              </span>
            </div>
            <p className="text-[1.375rem] text-foreground" style={{ fontWeight: 800 }}>
              {stats.totalBoxesPosted}
            </p>
          </div>

          <div className="bg-card rounded-xl border border-border p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <CheckCircle2 className="w-3.5 h-3.5 text-primary" />
              <span className="text-[0.6rem] text-muted-foreground" style={{ fontWeight: 500 }}>
                Picked Up
              </span>
            </div>
            <p className="text-[1.375rem] text-foreground" style={{ fontWeight: 800 }}>
              {stats.totalBoxesPickedUp}
            </p>
          </div>

          <div className="bg-card rounded-xl border border-border p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Bookmark className="w-3.5 h-3.5 text-blue-500" />
              <span className="text-[0.6rem] text-muted-foreground" style={{ fontWeight: 500 }}>
                Reserved
              </span>
            </div>
            <p className="text-[1.375rem] text-foreground" style={{ fontWeight: 800 }}>
              {stats.totalReservations}
            </p>
          </div>

          <div className="bg-card rounded-xl border border-border p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-3.5 h-3.5 text-primary" />
              <span className="text-[0.6rem] text-muted-foreground" style={{ fontWeight: 500 }}>
                Pickup Rate
              </span>
            </div>
            <p className="text-[1.375rem] text-foreground" style={{ fontWeight: 800 }}>
              {stats.pickupRate}%
            </p>
          </div>

          <div className="bg-card rounded-xl border border-border p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <UserX className="w-3.5 h-3.5 text-red-400" />
              <span className="text-[0.6rem] text-muted-foreground" style={{ fontWeight: 500 }}>
                No-show
              </span>
            </div>
            <p className="text-[1.375rem] text-foreground" style={{ fontWeight: 800 }}>
              {stats.noShowRate}%
            </p>
          </div>

          <div className="bg-card rounded-xl border border-border p-3">
            <div className="flex items-center gap-1.5 mb-1">
              <Star className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-[0.6rem] text-muted-foreground" style={{ fontWeight: 500 }}>
                Rating
              </span>
            </div>
            <p className="text-[1.375rem] text-foreground" style={{ fontWeight: 800 }}>
              {stats.avgRating}
            </p>
          </div>
        </motion.div>

        {/* Location Caps */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-xl border border-border p-4"
        >
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-amber-500" />
            <span className="text-[0.8rem]" style={{ fontWeight: 600 }}>
              Daily Caps by Location
            </span>
          </div>
          <div className="space-y-2">
            {stats.locationCaps.map((cap) => (
              <div
                key={cap.location}
                className="flex items-center justify-between py-1.5 border-b border-border last:border-0"
              >
                <div>
                  <p className="text-[0.8rem]" style={{ fontWeight: 500 }}>
                    {cap.location}
                  </p>
                  <p className="text-[0.65rem] text-muted-foreground">
                    {cap.consecutiveWeeksAbove85 >= 2 ? (
                      <span className="text-green-600 flex items-center gap-0.5">
                        <ArrowUpRight className="w-3 h-3" />
                        Eligible for +10 increase
                      </span>
                    ) : (
                      `${cap.consecutiveWeeksAbove85}/2 weeks above 85%`
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[0.9rem] text-primary" style={{ fontWeight: 700 }}>
                    {cap.currentCap}
                  </p>
                  <p className="text-[0.6rem] text-muted-foreground">boxes/day</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Weekly Chart */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card rounded-xl border border-border p-4"
        >
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-4 h-4 text-primary" />
            <span className="text-[0.875rem]" style={{ fontWeight: 600 }}>
              This Week
            </span>
          </div>

          <div className="flex items-end gap-2 h-32">
            {stats.recentDrops.map((day, i) => (
              <div key={day.date} className="flex-1 flex flex-col items-center gap-1">
                <div className="w-full flex flex-col items-center gap-0.5 flex-1 justify-end">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${(day.posted / maxPosted) * 100}%` }}
                    transition={{ delay: 0.2 + i * 0.05, duration: 0.5 }}
                    className="w-full bg-primary/15 rounded-t-md min-h-[4px] relative"
                  >
                    <motion.div
                      initial={{ height: 0 }}
                      animate={{ height: `${(day.pickedUp / day.posted) * 100}%` }}
                      transition={{ delay: 0.4 + i * 0.05, duration: 0.5 }}
                      className="w-full bg-primary rounded-t-md absolute bottom-0"
                    />
                  </motion.div>
                </div>
                {day.noShows > 3 && (
                  <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
                )}
                <span className="text-[0.65rem] text-muted-foreground">{day.date}</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border">
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-primary/15 rounded-sm" />
              <span className="text-[0.7rem] text-muted-foreground">Posted</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 bg-primary rounded-sm" />
              <span className="text-[0.7rem] text-muted-foreground">Picked up</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 bg-red-400 rounded-full" />
              <span className="text-[0.7rem] text-muted-foreground">High no-shows</span>
            </div>
          </div>
        </motion.div>

        {/* Impact */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200 p-4"
        >
          <p className="text-[0.8rem] text-green-800 mb-3" style={{ fontWeight: 600 }}>
            Environmental Impact (Pilot)
          </p>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div>
              <p className="text-[1.25rem] text-green-700" style={{ fontWeight: 800 }}>
                {stats.totalBoxesPickedUp}
              </p>
              <p className="text-[0.65rem] text-green-600">meals rescued</p>
            </div>
            <div>
              <p className="text-[1.25rem] text-green-700" style={{ fontWeight: 800 }}>
                ~{Math.round(stats.totalBoxesPickedUp * 1.5)}
              </p>
              <p className="text-[0.65rem] text-green-600">lbs diverted</p>
            </div>
            <div>
              <p className="text-[1.25rem] text-green-700" style={{ fontWeight: 800 }}>
                ~{Math.round(stats.totalBoxesPickedUp * 1.5 * 0.68)}
              </p>
              <p className="text-[0.65rem] text-green-600">kg CO2 saved</p>
            </div>
          </div>
        </motion.div>

        {/* Forecast */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-200 p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[0.875rem]">🔮</span>
            <span className="text-[0.8rem] text-blue-800" style={{ fontWeight: 600 }}>
              EcoPlate Forecast v0
            </span>
          </div>
          <p className="text-[0.8rem] text-blue-700">
            Based on {stats.totalDrops} drops, tomorrow's suggested count is{" "}
            <strong>{Math.round(stats.totalBoxesPickedUp / stats.totalDrops + 2)} boxes</strong>{" "}
            per location. Forecast improves as we collect more data.
          </p>
          <p className="text-[0.65rem] text-blue-500 mt-2">
            After 60+ days of data, Forecast v1 (ML-assisted) will be available.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
