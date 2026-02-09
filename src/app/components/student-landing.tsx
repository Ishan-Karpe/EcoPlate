import { motion } from "motion/react";
import { Leaf, MapPin, Clock, Package, ChevronRight, AlertCircle } from "lucide-react";
import { Drop, formatTime } from "./ecoplate-types";

interface StudentLandingProps {
  drops: Drop[];
  onSelectDrop: (drop: Drop) => void;
  onAdminAccess: () => void;
}

export function StudentLanding({ drops, onSelectDrop, onAdminAccess }: StudentLandingProps) {
  const activeDrops = drops.filter((d) => d.status === "active" && d.remainingBoxes > 0);
  const soldOutDrops = drops.filter((d) => d.status === "active" && d.remainingBoxes === 0);
  const upcomingDrops = drops.filter((d) => d.status === "upcoming");

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-primary text-primary-foreground px-5 pt-12 pb-6 rounded-b-[2rem]"
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 bg-white/20 rounded-xl flex items-center justify-center">
              <Leaf className="w-5 h-5" />
            </div>
            <span className="text-[1.25rem] tracking-tight" style={{ fontWeight: 700 }}>
              EcoPlate
            </span>
          </div>
          <button
            onClick={onAdminAccess}
            className="text-white/60 text-[0.75rem] px-3 py-1 rounded-full border border-white/20"
          >
            Staff
          </button>
        </div>
        <p className="text-white/80 text-[0.875rem] mt-2">
          Freshly rescued meals. $3-$5 dinner. Right on campus.
        </p>
        <div className="flex items-center gap-4 mt-3 text-[0.75rem] text-white/60">
          <span>🌱 357 meals rescued</span>
          <span>&#183;</span>
          <span>&#11088; 4.3 avg rating</span>
        </div>
      </motion.div>

      {/* Drop list */}
      <div className="flex-1 px-5 py-5 space-y-5 overflow-y-auto pb-8">
        {/* Available now */}
        {activeDrops.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span
                className="text-[0.8rem] text-primary"
                style={{ fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}
              >
                Available now ({activeDrops.length})
              </span>
            </div>
            <div className="space-y-3">
              {activeDrops.map((drop, i) => (
                <DropCard
                  key={drop.id}
                  drop={drop}
                  onSelect={() => onSelectDrop(drop)}
                  delay={0.15 + i * 0.07}
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Upcoming */}
        {upcomingDrops.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-3.5 h-3.5 text-blue-500" />
              <span
                className="text-[0.8rem] text-blue-600"
                style={{ fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}
              >
                Starting soon ({upcomingDrops.length})
              </span>
            </div>
            <div className="space-y-3">
              {upcomingDrops.map((drop, i) => (
                <DropCard
                  key={drop.id}
                  drop={drop}
                  onSelect={() => onSelectDrop(drop)}
                  delay={0.35 + i * 0.07}
                  upcoming
                />
              ))}
            </div>
          </motion.div>
        )}

        {/* Sold out */}
        {soldOutDrops.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <div className="flex items-center gap-2 mb-3">
              <AlertCircle className="w-3.5 h-3.5 text-muted-foreground" />
              <span
                className="text-[0.8rem] text-muted-foreground"
                style={{ fontWeight: 600, letterSpacing: "0.04em", textTransform: "uppercase" }}
              >
                Sold out ({soldOutDrops.length})
              </span>
            </div>
            <div className="space-y-3">
              {soldOutDrops.map((drop, i) => (
                <DropCard
                  key={drop.id}
                  drop={drop}
                  onSelect={() => onSelectDrop(drop)}
                  delay={0.5 + i * 0.07}
                  soldOut
                />
              ))}
            </div>
          </motion.div>
        )}

        {drops.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div className="text-[3rem] mb-3">🌙</div>
            <p className="text-[1rem]" style={{ fontWeight: 600 }}>
              No drops tonight
            </p>
            <p className="text-[0.875rem] text-muted-foreground mt-1">
              Check back tomorrow for fresh Rescue Boxes!
            </p>
          </motion.div>
        )}

        {/* No-account reminder */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center pt-2 pb-4"
        >
          <p className="text-[0.75rem] text-muted-foreground">
            No account needed to reserve. Just tap and go.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function DropCard({
  drop,
  onSelect,
  delay = 0,
  soldOut = false,
  upcoming = false,
}: {
  drop: Drop;
  onSelect: () => void;
  delay?: number;
  soldOut?: boolean;
  upcoming?: boolean;
}) {
  const urgency = !soldOut && !upcoming && drop.remainingBoxes <= 5;

  return (
    <motion.button
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      onClick={onSelect}
      className={`w-full bg-card rounded-2xl border border-border shadow-sm overflow-hidden text-left active:scale-[0.98] transition-transform ${
        soldOut ? "opacity-60" : ""
      }`}
    >
      <div className="flex items-stretch">
        {/* Emoji banner */}
        <div
          className={`w-20 flex items-center justify-center shrink-0 ${
            soldOut
              ? "bg-gray-100"
              : upcoming
              ? "bg-blue-50"
              : "bg-gradient-to-b from-green-50 to-emerald-100"
          }`}
        >
          <span className="text-[2rem]">{drop.emoji}</span>
        </div>

        {/* Content */}
        <div className="flex-1 p-3.5 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-[0.9rem] truncate" style={{ fontWeight: 600 }}>
                  {drop.location}
                </p>
                {urgency && (
                  <span
                    className="bg-amber-100 text-amber-700 text-[0.6rem] px-1.5 py-0.5 rounded-full shrink-0"
                    style={{ fontWeight: 600 }}
                  >
                    {drop.remainingBoxes} left!
                  </span>
                )}
                {soldOut && (
                  <span
                    className="bg-gray-100 text-gray-500 text-[0.6rem] px-1.5 py-0.5 rounded-full shrink-0"
                    style={{ fontWeight: 600 }}
                  >
                    Sold out
                  </span>
                )}
                {upcoming && (
                  <span
                    className="bg-blue-100 text-blue-600 text-[0.6rem] px-1.5 py-0.5 rounded-full shrink-0"
                    style={{ fontWeight: 600 }}
                  >
                    Soon
                  </span>
                )}
              </div>
              <p className="text-[0.75rem] text-muted-foreground mt-0.5 line-clamp-1">
                {drop.description}
              </p>
            </div>
            <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
          </div>

          <div className="flex items-center gap-3 mt-2 text-[0.7rem] text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(drop.windowStart)}-{formatTime(drop.windowEnd)}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {drop.locationDetail}
            </span>
          </div>

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1.5">
              <Package className="w-3 h-3 text-primary" />
              <span className="text-[0.75rem]" style={{ fontWeight: 600 }}>
                {soldOut
                  ? "0 left"
                  : upcoming
                  ? `${drop.totalBoxes} boxes`
                  : `${drop.remainingBoxes} of ${drop.totalBoxes} left`}
              </span>
            </div>
            <span
              className="text-[0.8rem] text-primary"
              style={{ fontWeight: 700 }}
            >
              ${drop.priceMin}-${drop.priceMax}
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
