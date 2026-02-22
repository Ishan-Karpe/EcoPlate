import { motion } from "motion/react";
import {
  ArrowLeft,
  MapPin,
  Clock,
  Package,
  ChevronRight,
  ShieldCheck,
  Bell,
  CheckCircle2,
  Zap,
} from "lucide-react";
import { Drop, formatTime, calculateCurrentPrice } from "./ecoplate-types";

interface DropDetailProps {
  drop: Drop;
  onReserve: () => void;
  onBack: () => void;
  waitlistedDropIds: Set<string>;
  onWaitlist: (dropId: string) => void;
}

export function DropDetail({ drop, onReserve, onBack, waitlistedDropIds, onWaitlist }: DropDetailProps) {
  const soldOut = drop.remainingBoxes === 0;
  const upcoming = drop.status === "upcoming";
  const urgency = !soldOut && !upcoming && drop.remainingBoxes <= 5;
  const currentPrice = calculateCurrentPrice(drop);
  const waitlisted = waitlistedDropIds.has(drop.id);

  const fillPct = drop.totalBoxes > 0 ? (drop.reservedBoxes / drop.totalBoxes) * 100 : 0;

  // Dynamic pricing label
  const supplyRatio = drop.totalBoxes > 0 ? drop.remainingBoxes / drop.totalBoxes : 1;
  const priceTrend =
    supplyRatio > 0.5
      ? "High supply — lowest price"
      : supplyRatio < 0.2
      ? "Low supply — at max price"
      : "Moderate supply";

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F9F6F1" }}>
      {/* Back button */}
      <div className="px-5 pt-12 pb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 active:opacity-70"
          style={{ color: "#7A6B5A", fontSize: "0.875rem" }}
        >
          <ArrowLeft className="w-4 h-4" />
          All drops
        </button>
      </div>

      {/* Hero food photo */}
      <div className="mx-4 mt-2 rounded-2xl overflow-hidden relative shadow-md" style={{ height: 220 }}>
        <img
          src={drop.imageUrl}
          alt={drop.description}
          className="w-full h-full object-cover"
          style={{ filter: soldOut ? "grayscale(50%)" : "none" }}
        />
        {/* Gradient overlay */}
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(to top, rgba(0,0,0,0.5) 0%, transparent 55%)",
          }}
        />
        {/* Location name on photo */}
        <div className="absolute bottom-3 left-4 right-4 flex items-end justify-between">
          <div>
            <p
              className="text-white"
              style={{ fontSize: "1.25rem", fontWeight: 800, textShadow: "0 1px 4px rgba(0,0,0,0.4)" }}
            >
              {drop.location}
            </p>
          </div>
          <div>
            {urgency && (
              <span
                className="px-2.5 py-1 rounded-full"
                style={{ backgroundColor: "#F59E0B", color: "white", fontSize: "0.7rem", fontWeight: 700 }}
              >
                Only {drop.remainingBoxes} left!
              </span>
            )}
            {soldOut && (
              <span
                className="px-2.5 py-1 rounded-full"
                style={{ backgroundColor: "rgba(0,0,0,0.6)", color: "white", fontSize: "0.7rem", fontWeight: 700 }}
              >
                Sold out
              </span>
            )}
            {upcoming && (
              <span
                className="px-2.5 py-1 rounded-full"
                style={{ backgroundColor: "#8B6F47", color: "white", fontSize: "0.7rem", fontWeight: 700 }}
              >
                Starting soon
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="flex-1 px-4 py-4 space-y-3 overflow-y-auto pb-4">
        {/* Main info card */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl p-5 space-y-4 shadow-sm"
          style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.1)" }}
        >
          <div>
            <h2 style={{ fontSize: "1.125rem", fontWeight: 700, color: "#1C2B1C" }}>
              Tonight's Rescue Box
            </h2>
            <p
              className="mt-1.5"
              style={{ fontSize: "0.875rem", color: "#7A6B5A", lineHeight: 1.6 }}
            >
              {drop.description}
            </p>
            <p
              className="mt-2 italic"
              style={{ fontSize: "0.75rem", color: "#7A6B5A" }}
            >
              Contents vary nightly. Check ingredients at pickup.
            </p>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-2.5">
            <div
              className="flex items-start gap-2 rounded-xl p-3"
              style={{ backgroundColor: "#F5F1EB" }}
            >
              <MapPin className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#006838" }} />
              <div>
                <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#1C2B1C" }}>Pickup spot</p>
                <p style={{ fontSize: "0.7rem", color: "#7A6B5A" }}>{drop.locationDetail}</p>
              </div>
            </div>
            <div
              className="flex items-start gap-2 rounded-xl p-3"
              style={{ backgroundColor: "#F5F1EB" }}
            >
              <Clock className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#006838" }} />
              <div>
                <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "#1C2B1C" }}>Window (90 min)</p>
                <p style={{ fontSize: "0.7rem", color: "#7A6B5A" }}>
                  {formatTime(drop.windowStart)}–{formatTime(drop.windowEnd)}
                </p>
              </div>
            </div>
          </div>

          {/* Boxes + price */}
          <div
            className="flex items-center justify-between rounded-xl p-3"
            style={{ backgroundColor: "#E8F5EE" }}
          >
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4" style={{ color: "#006838" }} />
              <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "#1C2B1C" }}>
                {soldOut
                  ? `${drop.totalBoxes} boxes (all claimed)`
                  : upcoming
                  ? `${drop.totalBoxes} boxes available`
                  : `${drop.remainingBoxes} of ${drop.totalBoxes} boxes left`}
              </span>
            </div>
            <div
              className="px-3 py-1 rounded-full"
              style={{ backgroundColor: soldOut ? "#7A6B5A" : "#006838" }}
            >
              <span style={{ color: "white", fontWeight: 800, fontSize: "0.9rem" }}>
                ${currentPrice}
              </span>
            </div>
          </div>

          {/* Dynamic pricing context */}
          {!soldOut && (
            <div className="flex items-center gap-2">
              <Zap className="w-3.5 h-3.5 shrink-0" style={{ color: "#8B6F47" }} />
              <p style={{ fontSize: "0.72rem", color: "#7A6B5A" }}>
                <span style={{ fontWeight: 600 }}>Dynamic pricing: </span>
                {priceTrend} · Range $3–$5
              </p>
            </div>
          )}

          {/* Demand bar */}
          {!soldOut && (
            <div>
              <div className="flex items-center justify-between mb-1.5" style={{ fontSize: "0.7rem", color: "#7A6B5A" }}>
                <span>{drop.reservedBoxes} reserved</span>
                <span>{drop.remainingBoxes} available</span>
              </div>
              <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: "#EDE8E1" }}>
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${fillPct}%` }}
                  transition={{ duration: 0.7, delay: 0.2 }}
                  className="h-full rounded-full"
                  style={{ backgroundColor: soldOut ? "#7A6B5A" : urgency ? "#F59E0B" : "#006838" }}
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Sold out waitlist */}
        {soldOut && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            <div
              className="rounded-xl p-4 text-center"
              style={{ backgroundColor: "#FEF3C7", border: "1px solid #FCD34D" }}
            >
              <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#92400E" }}>
                All boxes have been claimed
              </p>
              <p className="mt-1" style={{ fontSize: "0.8rem", color: "#B45309" }}>
                Boxes may open up if someone cancels. Join the waitlist!
              </p>
            </div>
            <button
              onClick={() => !waitlisted && onWaitlist(drop.id)}
              disabled={waitlisted}
              className="w-full py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              style={{
                backgroundColor: waitlisted ? "#E8F5EE" : "#8B6F47",
                color: waitlisted ? "#006838" : "white",
                fontWeight: 600,
                fontSize: "1rem",
                cursor: waitlisted ? "default" : "pointer",
              }}
            >
              {waitlisted ? (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Already Waitlisted
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  Join Waitlist
                </>
              )}
            </button>
            {!waitlisted && (
              <p className="text-center" style={{ fontSize: "0.7rem", color: "#7A6B5A" }}>
                We'll notify you if a box opens up
              </p>
            )}
          </motion.div>
        )}

        {/* Trust signal */}
        <div className="flex items-center gap-2 justify-center py-1">
          <ShieldCheck className="w-4 h-4" style={{ color: "#006838" }} />
          <span style={{ fontSize: "0.75rem", color: "#7A6B5A" }}>
            Food handled by campus dining staff
          </span>
        </div>
      </div>

      {/* Reserve button — shown for any non-sold-out drop */}
      {!soldOut && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="px-4 pb-8 pt-3"
        >
          <button
            onClick={onReserve}
            className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
            style={{
              backgroundColor: "#006838",
              color: "white",
              fontSize: "1.125rem",
              fontWeight: 700,
              boxShadow: "0 4px 20px rgba(0,104,56,0.3)",
            }}
          >
            Reserve My Box
            <ChevronRight className="w-5 h-5" />
          </button>
          <p className="text-center mt-2" style={{ fontSize: "0.75rem", color: "#7A6B5A" }}>
            No account needed. Reserve in seconds.
          </p>
        </motion.div>
      )}
    </div>
  );
}