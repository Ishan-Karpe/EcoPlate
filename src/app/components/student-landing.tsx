import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Leaf,
  MapPin,
  Clock,
  Package,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Bell,
  X,
  QrCode,
  Navigation,
} from "lucide-react";
import { Drop, Reservation, formatTime, calculateCurrentPrice, getWindowState } from "./ecoplate-types";

interface StudentLandingProps {
  drops: Drop[];
  onSelectDrop: (drop: Drop) => void;
  onAdminAccess: () => void;
  activeReservation: Reservation | null;
  onPickedUp: () => void;
  onCancelReservation: () => void;
  onViewCode: () => void;
  waitlistedDropIds: Set<string>;
  onWaitlist: (dropId: string) => void;
}

export function StudentLanding({
  drops,
  onSelectDrop,
  onAdminAccess,
  activeReservation,
  onPickedUp,
  onCancelReservation,
  onViewCode,
  waitlistedDropIds,
  onWaitlist,
}: StudentLandingProps) {
  const activeDrops = drops.filter((d) => d.status === "active" && d.remainingBoxes > 0);
  const soldOutDrops = drops.filter((d) => d.status === "active" && d.remainingBoxes === 0);
  const upcomingDrops = drops.filter((d) => d.status === "upcoming");

  const reservedDrop = activeReservation
    ? drops.find((d) => d.id === activeReservation.dropId) ?? null
    : null;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F9F6F1" }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pt-12 pb-5 rounded-b-[2rem] shadow-sm"
        style={{ backgroundColor: "#006838" }}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
            >
              <Leaf className="w-5 h-5 text-white" />
            </div>
            <div>
              <span
                className="text-white tracking-tight"
                style={{ fontWeight: 800, fontSize: "1.2rem", letterSpacing: "-0.02em" }}
              >
                EcoPlate
              </span>
              <p className="text-white/60" style={{ fontSize: "0.65rem", lineHeight: 1 }}>
                Waste Less. Eat More.
              </p>
            </div>
          </div>
          <button
            onClick={onAdminAccess}
            className="text-white/60 px-3 py-1.5 rounded-full border border-white/20 active:bg-white/10"
            style={{ fontSize: "0.75rem" }}
          >
            Staff
          </button>
        </div>
      </motion.div>

      {/* Active Reservation Status Banner */}
      <AnimatePresence>
        {activeReservation && reservedDrop && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-4 mt-4 overflow-hidden"
          >
            <ReservationBanner
              reservation={activeReservation}
              drop={reservedDrop}
              onPickedUp={onPickedUp}
              onCancel={onCancelReservation}
              onViewCode={onViewCode}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Drop list */}
      <div className="flex-1 px-4 py-4 space-y-5 overflow-y-auto pb-10">
        {/* Available now */}
        {activeDrops.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <SectionHeader
              dot
              label={`Available Now (${activeDrops.length})`}
              color="#006838"
            />
            <div className="space-y-3 mt-3">
              {activeDrops.map((drop, i) => (
                <DropCard
                  key={drop.id}
                  drop={drop}
                  onSelect={() => onSelectDrop(drop)}
                  delay={0.15 + i * 0.07}
                  waitlisted={waitlistedDropIds.has(drop.id)}
                  onWaitlist={onWaitlist}
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
            transition={{ delay: 0.25 }}
          >
            <SectionHeader label={`Starting Soon (${upcomingDrops.length})`} color="#8B6F47" />
            <div className="space-y-3 mt-3">
              {upcomingDrops.map((drop, i) => (
                <DropCard
                  key={drop.id}
                  drop={drop}
                  onSelect={() => onSelectDrop(drop)}
                  delay={0.3 + i * 0.07}
                  upcoming
                  waitlisted={waitlistedDropIds.has(drop.id)}
                  onWaitlist={onWaitlist}
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
            transition={{ delay: 0.4 }}
          >
            <SectionHeader
              label={`Sold Out (${soldOutDrops.length})`}
              color="#7A6B5A"
              icon={<AlertCircle className="w-3.5 h-3.5" style={{ color: "#7A6B5A" }} />}
            />
            <div className="space-y-3 mt-3">
              {soldOutDrops.map((drop, i) => (
                <DropCard
                  key={drop.id}
                  drop={drop}
                  onSelect={() => onSelectDrop(drop)}
                  delay={0.45 + i * 0.07}
                  soldOut
                  waitlisted={waitlistedDropIds.has(drop.id)}
                  onWaitlist={onWaitlist}
                />
              ))}
            </div>
          </motion.div>
        )}

        {drops.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "#E8F5EE" }}
            >
              <Leaf className="w-8 h-8" style={{ color: "#006838" }} />
            </div>
            <p className="text-[1rem]" style={{ fontWeight: 600, color: "#1C2B1C" }}>
              No drops tonight
            </p>
            <p className="text-[0.875rem] mt-1" style={{ color: "#7A6B5A" }}>
              Check back tomorrow for fresh Rescue Boxes!
            </p>
          </motion.div>
        )}

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-center pt-1 pb-4"
        >
          <p style={{ fontSize: "0.75rem", color: "#7A6B5A" }}>
            No account needed to reserve. Just tap and go.
          </p>
        </motion.div>
      </div>
    </div>
  );
}

function SectionHeader({
  label,
  color,
  dot,
  icon,
}: {
  label: string;
  color: string;
  dot?: boolean;
  icon?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      {dot ? (
        <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: color }} />
      ) : icon ? (
        icon
      ) : (
        <Clock className="w-3.5 h-3.5" style={{ color }} />
      )}
      <span
        style={{
          fontSize: "0.75rem",
          fontWeight: 700,
          letterSpacing: "0.05em",
          textTransform: "uppercase",
          color,
        }}
      >
        {label}
      </span>
    </div>
  );
}

function ReservationBanner({
  reservation,
  drop,
  onPickedUp,
  onCancel,
  onViewCode,
}: {
  reservation: Reservation;
  drop: Drop;
  onPickedUp: () => void;
  onCancel: () => void;
  onViewCode: () => void;
}) {
  const [showCancel, setShowCancel] = useState(false);
  const [windowState, setWindowState] = useState(() =>
    getWindowState(drop.windowStart, drop.windowEnd)
  );

  // Re-check window state every minute
  useEffect(() => {
    const interval = setInterval(() => {
      setWindowState(getWindowState(drop.windowStart, drop.windowEnd));
    }, 60_000);
    return () => clearInterval(interval);
  }, [drop.windowStart, drop.windowEnd]);

  const isReady = windowState === "during";
  const isPast = windowState === "after";

  // Banner visual config per state
  const bannerBg = isReady ? "#005C30" : isPast ? "#4A3728" : "#006838";
  const statusLabel = isReady ? "Ready to Pick Up" : isPast ? "Window Ended" : "Reserved";
  const dotColor = isReady ? "#86efac" : isPast ? "#F59E0B" : "#86efac";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl overflow-hidden shadow-md relative"
      style={{ border: `1.5px solid ${bannerBg}` }}
    >
      {/* Banner top */}
      <div className="px-4 pt-3.5 pb-3" style={{ backgroundColor: bannerBg }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: dotColor,
                animation: isReady ? "pulse 1.5s infinite" : isPast ? "none" : "pulse 2s infinite",
              }}
            />
            <span className="text-white" style={{ fontSize: "0.8rem", fontWeight: 700 }}>
              {statusLabel}
            </span>
          </div>
          {/* Only show cancel X when pre-window */}
          {!isReady && !isPast && (
            <button
              onClick={() => setShowCancel(true)}
              className="text-white/50 active:text-white/80"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {isReady ? (
          <>
            <p className="text-white mt-1.5" style={{ fontSize: "0.9rem", fontWeight: 600 }}>
              Head to {drop.locationDetail}
            </p>
            <p className="text-white/70 mt-0.5" style={{ fontSize: "0.75rem" }}>
              Window closes at {formatTime(drop.windowEnd)} · Show your code at the counter
            </p>
          </>
        ) : isPast ? (
          <>
            <p className="text-white mt-1.5" style={{ fontSize: "0.9rem", fontWeight: 600 }}>
              Pickup window has ended
            </p>
            <p className="text-white/70 mt-0.5" style={{ fontSize: "0.75rem" }}>
              {drop.location} · {formatTime(drop.windowStart)} – {formatTime(drop.windowEnd)}
            </p>
          </>
        ) : (
          <>
            <p className="text-white mt-1.5" style={{ fontSize: "0.9rem", fontWeight: 600 }}>
              Your box at {drop.location} is reserved
            </p>
            <p className="text-white/70 mt-0.5" style={{ fontSize: "0.75rem" }}>
              Pickup opens at {formatTime(drop.windowStart)} · {drop.locationDetail}
            </p>
          </>
        )}
      </div>

      {/* Banner actions */}
      <div className="px-4 py-3 flex gap-2" style={{ backgroundColor: "#E8F5EE" }}>
        <button
          onClick={onViewCode}
          className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border active:scale-[0.97] transition-transform"
          style={{
            backgroundColor: "white",
            borderColor: "rgba(0,104,56,0.2)",
            color: "#006838",
            fontSize: "0.8rem",
            fontWeight: 600,
          }}
        >
          <QrCode className="w-3.5 h-3.5" />
          Show Code
        </button>

        {isReady ? (
          <button
            onClick={onPickedUp}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl active:scale-[0.97] transition-transform shadow-sm"
            style={{
              backgroundColor: "#006838",
              color: "white",
              fontSize: "0.8rem",
              fontWeight: 700,
            }}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            I Picked It Up
          </button>
        ) : isPast ? (
          <button
            onClick={onPickedUp}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl active:scale-[0.97] transition-transform"
            style={{
              backgroundColor: "#8B6F47",
              color: "white",
              fontSize: "0.8rem",
              fontWeight: 600,
            }}
          >
            <CheckCircle2 className="w-3.5 h-3.5" />
            Mark Picked Up
          </button>
        ) : (
          <button
            onClick={() => setShowCancel(true)}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border active:scale-[0.97] transition-transform"
            style={{
              backgroundColor: "white",
              borderColor: "rgba(192,57,43,0.2)",
              color: "#C0392B",
              fontSize: "0.8rem",
              fontWeight: 600,
            }}
          >
            <X className="w-3.5 h-3.5" />
            Cancel
          </button>
        )}
      </div>

      {/* Ready state: directions hint */}
      {isReady && (
        <div
          className="px-4 py-2 flex items-center gap-2"
          style={{ backgroundColor: "#D4EDDA", borderTop: "1px solid rgba(0,104,56,0.1)" }}
        >
          <Navigation className="w-3 h-3" style={{ color: "#006838" }} />
          <p style={{ fontSize: "0.72rem", color: "#004D28" }}>
            Window is open now — head over to pick up your Rescue Box!
          </p>
        </div>
      )}

      {/* Cancel confirm overlay */}
      <AnimatePresence>
        {showCancel && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 flex items-center justify-center z-50"
            style={{ backgroundColor: "rgba(249,246,241,0.95)" }}
          >
            <div className="mx-4 text-center p-6 rounded-2xl bg-white shadow-xl w-full">
              <div
                className="w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3"
                style={{ backgroundColor: "#FEF3C7" }}
              >
                <AlertCircle className="w-6 h-6" style={{ color: "#D97706" }} />
              </div>
              <p style={{ fontSize: "1rem", fontWeight: 700, color: "#1C2B1C" }}>
                Cancel reservation?
              </p>
              <p className="mt-1" style={{ fontSize: "0.8rem", color: "#7A6B5A" }}>
                Your box goes back to someone else.
                {reservation.paymentMethod === "card" && " Your card will be refunded."}
                {reservation.paymentMethod === "credit" && " Your credit will be returned."}
              </p>
              <div className="flex gap-2 mt-4">
                <button
                  onClick={() => setShowCancel(false)}
                  className="flex-1 py-2.5 rounded-xl"
                  style={{
                    backgroundColor: "#EDE8E1",
                    color: "#7A6B5A",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                  }}
                >
                  Keep it
                </button>
                <button
                  onClick={() => {
                    setShowCancel(false);
                    onCancel();
                  }}
                  className="flex-1 py-2.5 rounded-xl"
                  style={{
                    backgroundColor: "#C0392B",
                    color: "white",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

function DropCard({
  drop,
  onSelect,
  delay = 0,
  soldOut = false,
  upcoming = false,
  waitlisted,
  onWaitlist,
}: {
  drop: Drop;
  onSelect: () => void;
  delay?: number;
  soldOut?: boolean;
  upcoming?: boolean;
  waitlisted: boolean;
  onWaitlist: (dropId: string) => void;
}) {
  const urgency = !soldOut && !upcoming && drop.remainingBoxes > 0 && drop.remainingBoxes <= 5;
  const currentPrice = calculateCurrentPrice(drop);

  const handleWaitlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!waitlisted) {
      onWaitlist(drop.id);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay }}
      className={`rounded-2xl overflow-hidden shadow-sm ${soldOut ? "opacity-70" : ""}`}
      style={{
        backgroundColor: "white",
        border: "1px solid rgba(0,104,56,0.1)",
      }}
    >
      <button
        onClick={soldOut ? () => onSelect() : onSelect}
        className={`w-full text-left ${soldOut ? "active:scale-[0.985] transition-transform" : "active:scale-[0.985] transition-transform"}`}
      >
        <div className="flex items-stretch">
          {/* Food photo */}
          <div className="w-[90px] shrink-0 relative overflow-hidden" style={{ minHeight: 100 }}>
            <img
              src={drop.imageUrl}
              alt={drop.location}
              className="w-full h-full object-cover"
              style={{ filter: soldOut ? "grayscale(60%)" : "none" }}
            />
            {/* Status badge */}
            {urgency && (
              <div
                className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md"
                style={{
                  backgroundColor: "#F59E0B",
                  color: "white",
                  fontSize: "0.6rem",
                  fontWeight: 700,
                }}
              >
                {drop.remainingBoxes} left!
              </div>
            )}
            {soldOut && (
              <div
                className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md"
                style={{
                  backgroundColor: "rgba(0,0,0,0.55)",
                  color: "white",
                  fontSize: "0.6rem",
                  fontWeight: 700,
                }}
              >
                Sold out
              </div>
            )}
            {upcoming && (
              <div
                className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md"
                style={{
                  backgroundColor: "#8B6F47",
                  color: "white",
                  fontSize: "0.6rem",
                  fontWeight: 700,
                }}
              >
                Soon
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 p-3 min-w-0">
            <div className="flex items-start justify-between gap-1">
              <p
                className="truncate"
                style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1C2B1C" }}
              >
                {drop.location}
              </p>
              <ChevronRight className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#7A6B5A" }} />
            </div>

            <p
              className="mt-0.5 line-clamp-2"
              style={{ fontSize: "0.73rem", color: "#7A6B5A", lineHeight: 1.4 }}
            >
              {drop.description}
            </p>

            <div className="flex items-center gap-2.5 mt-2" style={{ fontSize: "0.68rem", color: "#7A6B5A" }}>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(drop.windowStart)}–{formatTime(drop.windowEnd)}
              </span>
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {drop.locationDetail}
              </span>
            </div>

            <div className="flex items-center justify-between mt-2">
              <div className="flex items-center gap-1" style={{ fontSize: "0.72rem" }}>
                <Package className="w-3 h-3" style={{ color: "#006838" }} />
                <span style={{ fontWeight: 600, color: "#1C2B1C" }}>
                  {soldOut
                    ? "0 left"
                    : upcoming
                    ? `${drop.totalBoxes} boxes`
                    : `${drop.remainingBoxes} of ${drop.totalBoxes} left`}
                </span>
              </div>
              <span
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 800,
                  color: soldOut ? "#7A6B5A" : "#006838",
                }}
              >
                ${currentPrice}
              </span>
            </div>
          </div>
        </div>
      </button>

      {/* Waitlist button for sold out — persists via external state */}
      {soldOut && (
        <div
          className="px-3 pb-3"
          style={{ borderTop: "1px solid rgba(0,104,56,0.08)" }}
        >
          <button
            onClick={handleWaitlistClick}
            disabled={waitlisted}
            className="w-full mt-2.5 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all active:scale-[0.97]"
            style={{
              backgroundColor: waitlisted ? "#E8F5EE" : "#8B6F47",
              color: waitlisted ? "#006838" : "white",
              fontSize: "0.8rem",
              fontWeight: 600,
              cursor: waitlisted ? "default" : "pointer",
            }}
          >
            {waitlisted ? (
              <>
                <CheckCircle2 className="w-3.5 h-3.5" />
                Already Waitlisted
              </>
            ) : (
              <>
                <Bell className="w-3.5 h-3.5" />
                Join Waitlist
              </>
            )}
          </button>
        </div>
      )}
    </motion.div>
  );
}