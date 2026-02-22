import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
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
  Search,
  Star,
  Timer,
  Footprints,
} from "lucide-react";
import { Drop, Reservation, formatTime, calculateCurrentPrice, getWindowState } from "./ecoplate-types";
import { EcoplateLogo } from "./ecoplate-logo";

// Demo data for card extras
const CARD_EXTRAS: Record<string, { rating: number; walkMin: number; tags: string[]; closingSoon?: boolean }> = {
  "drop-1": { rating: 4.5, walkMin: 4, tags: ["High Protein"] },
  "drop-2": { rating: 4.2, walkMin: 6, tags: ["Gluten-Free"] },
  "drop-3": { rating: 4.7, walkMin: 6, tags: ["Vegetarian"], closingSoon: true },
  "drop-4": { rating: 4.3, walkMin: 4, tags: ["High Protein"] },
};

const FILTERS = ["All", "Vegetarian", "Gluten-Free", "High Protein"] as const;

// Location colors for visual differentiation
const LOCATION_COLORS: Record<string, string> = {
  Brandywine: "#8B6F47",
  Anteatery: "#006838",
};

interface StudentLandingProps {
  drops: Drop[];
  dropsLoading?: boolean;
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
  dropsLoading = false,
  onSelectDrop,
  onAdminAccess,
  activeReservation,
  onPickedUp,
  onCancelReservation,
  onViewCode,
  waitlistedDropIds,
  onWaitlist,
}: StudentLandingProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<string>("All");

  const filteredDrops = useMemo(() => {
    let result = drops;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (d) =>
          d.description.toLowerCase().includes(q) ||
          d.location.toLowerCase().includes(q) ||
          d.locationDetail.toLowerCase().includes(q)
      );
    }
    if (activeFilter !== "All") {
      result = result.filter((d) => {
        const extras = CARD_EXTRAS[d.id];
        return extras?.tags.includes(activeFilter);
      });
    }
    return result;
  }, [drops, searchQuery, activeFilter]);

  const activeDrops = filteredDrops.filter((d) => d.status === "active" && d.remainingBoxes > 0);
  const soldOutDrops = filteredDrops.filter((d) => d.status === "active" && d.remainingBoxes === 0);
  const upcomingDrops = filteredDrops.filter((d) => d.status === "upcoming");

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
            <EcoplateLogo
              iconSize={34}
              label="EcoPlate"
              subLabel="Waste Less. Eat More."
              textColor="white"
              subTextColor="rgba(255,255,255,0.6)"
              fontSize="1.2rem"
            />
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

      {/* Badge under header */}
      <div className="px-4 pt-3 pb-1">
        <div
          className="flex items-center justify-center gap-1.5 py-1.5 px-3 rounded-full mx-auto w-fit"
          style={{ backgroundColor: "#E8F5EE", border: "1px solid rgba(0,104,56,0.15)" }}
        >
          <CheckCircle2 className="w-3 h-3" style={{ color: "#006838" }} />
          <span style={{ fontSize: "0.68rem", fontWeight: 600, color: "#006838" }}>
            No account needed to reserve. Just tap and go.
          </span>
        </div>
      </div>

      {/* Search */}
      <div className="px-4 pt-3">
        <div
          className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl"
          style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.12)", boxShadow: "0 1px 4px rgba(0,0,0,0.04)" }}
        >
          <Search className="w-4 h-4 shrink-0" style={{ color: "#7A6B5A" }} />
          <input
            type="text"
            placeholder="Search meals, locations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent outline-none"
            style={{ fontSize: "0.85rem", color: "#1C2B1C" }}
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery("")}>
              <X className="w-3.5 h-3.5" style={{ color: "#7A6B5A" }} />
            </button>
          )}
        </div>
      </div>

      {/* Filter bar */}
      <div className="px-4 pt-3 pb-1 flex gap-2 overflow-x-auto no-scrollbar">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setActiveFilter(f)}
            className="shrink-0 px-3 py-1.5 rounded-full transition-all"
            style={{
              backgroundColor: activeFilter === f ? "#006838" : "white",
              color: activeFilter === f ? "white" : "#7A6B5A",
              fontSize: "0.72rem",
              fontWeight: 600,
              border: `1px solid ${activeFilter === f ? "#006838" : "rgba(0,104,56,0.12)"}`,
            }}
          >
            {f}
          </button>
        ))}
      </div>

      {/* Active Reservation Status Banner */}
      <AnimatePresence>
        {activeReservation && reservedDrop && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mx-4 mt-3 overflow-hidden"
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
      <div className="flex-1 px-4 py-3 space-y-5 overflow-y-auto pb-28">
        {/* Skeleton loading */}
        {dropsLoading && (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl overflow-hidden animate-pulse"
                style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.08)" }}
              >
                <div className="flex">
                  <div className="w-[90px] h-[110px] shrink-0" style={{ backgroundColor: "#EDE8E1" }} />
                  <div className="flex-1 p-3 space-y-2">
                    <div className="h-4 rounded" style={{ backgroundColor: "#EDE8E1", width: "60%" }} />
                    <div className="h-3 rounded" style={{ backgroundColor: "#F0EBE3", width: "90%" }} />
                    <div className="h-3 rounded" style={{ backgroundColor: "#F0EBE3", width: "70%" }} />
                    <div className="flex gap-2">
                      <div className="h-3 rounded" style={{ backgroundColor: "#EDE8E1", width: "40%" }} />
                      <div className="h-3 rounded" style={{ backgroundColor: "#EDE8E1", width: "30%" }} />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Available now */}
        {!dropsLoading && activeDrops.length > 0 && (
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
        {!dropsLoading && upcomingDrops.length > 0 && (
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
        {!dropsLoading && soldOutDrops.length > 0 && (
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

        {!dropsLoading && filteredDrops.length === 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <div
              className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
              style={{ backgroundColor: "#E8F5EE" }}
            >
              <Search className="w-8 h-8" style={{ color: "#006838" }} />
            </div>
            <p className="text-[1rem]" style={{ fontWeight: 600, color: "#1C2B1C" }}>
              {searchQuery || activeFilter !== "All" ? "No matches found" : "No drops tonight"}
            </p>
            <p className="text-[0.875rem] mt-1" style={{ color: "#7A6B5A" }}>
              {searchQuery || activeFilter !== "All"
                ? "Try a different search or filter"
                : "Check back tomorrow for fresh Rescue Boxes!"}
            </p>
          </motion.div>
        )}
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

  useEffect(() => {
    const interval = setInterval(() => {
      setWindowState(getWindowState(drop.windowStart, drop.windowEnd));
    }, 60_000);
    return () => clearInterval(interval);
  }, [drop.windowStart, drop.windowEnd]);

  const isPickedUp = reservation.status === "picked_up";
  const isReady = !isPickedUp && windowState === "during";
  const isPast = !isPickedUp && windowState === "after";

  const bannerBg = isPickedUp
    ? "#004D28"
    : isReady
    ? "#005C30"
    : isPast
    ? "#4A3728"
    : "#006838";
  const statusLabel = isPickedUp
    ? "Pickup Complete"
    : isReady
    ? "Ready to Pick Up"
    : isPast
    ? "Window Ended"
    : "Reserved";
  const dotColor = isPickedUp ? "#86efac" : isReady ? "#86efac" : isPast ? "#F59E0B" : "#86efac";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl overflow-hidden shadow-md relative"
      style={{ border: `1.5px solid ${bannerBg}` }}
    >
      <div className="px-4 pt-3.5 pb-3" style={{ backgroundColor: bannerBg }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-2 h-2 rounded-full"
              style={{
                backgroundColor: dotColor,
                animation: isPickedUp ? "none" : isReady ? "pulse 1.5s infinite" : isPast ? "none" : "pulse 2s infinite",
              }}
            />
            <span className="text-white" style={{ fontSize: "0.8rem", fontWeight: 700 }}>
              {statusLabel}
            </span>
          </div>
          {!isReady && !isPast && !isPickedUp && (
            <button
              onClick={() => setShowCancel(true)}
              className="text-white/50 active:text-white/80"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {isPickedUp ? (
          <>
            <p className="text-white mt-1.5" style={{ fontSize: "0.9rem", fontWeight: 600 }}>
              Your meal has been picked up!
            </p>
            <p className="text-white/70 mt-0.5" style={{ fontSize: "0.75rem" }}>
              {drop.location} &middot; Tell us how it was
            </p>
          </>
        ) : isReady ? (
          <>
            <p className="text-white mt-1.5" style={{ fontSize: "0.9rem", fontWeight: 600 }}>
              Head to {drop.locationDetail}
            </p>
            <p className="text-white/70 mt-0.5" style={{ fontSize: "0.75rem" }}>
              Window closes at {formatTime(drop.windowEnd)} &middot; Show your code at the counter
            </p>
          </>
        ) : isPast ? (
          <>
            <p className="text-white mt-1.5" style={{ fontSize: "0.9rem", fontWeight: 600 }}>
              Pickup window has ended
            </p>
            <p className="text-white/70 mt-0.5" style={{ fontSize: "0.75rem" }}>
              {drop.location} &middot; {formatTime(drop.windowStart)}&ndash;{formatTime(drop.windowEnd)}
            </p>
          </>
        ) : (
          <>
            <p className="text-white mt-1.5" style={{ fontSize: "0.9rem", fontWeight: 600 }}>
              Your box at {drop.location} is reserved
            </p>
            <p className="text-white/70 mt-0.5" style={{ fontSize: "0.75rem" }}>
              Pickup opens at {formatTime(drop.windowStart)} &middot; {drop.locationDetail}
            </p>
          </>
        )}
      </div>

      <div className="px-4 py-3 flex gap-2" style={{ backgroundColor: "#E8F5EE" }}>
        {isPickedUp ? (
          <button
            onClick={onPickedUp}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl active:scale-[0.97] transition-transform shadow-sm"
            style={{
              backgroundColor: "#006838",
              color: "white",
              fontSize: "0.875rem",
              fontWeight: 700,
            }}
          >
            <CheckCircle2 className="w-4 h-4" />
            Rate Your Meal
          </button>
        ) : isReady ? (
          <button
            onClick={onViewCode}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl border active:scale-[0.97] transition-transform shadow-sm"
            style={{
              backgroundColor: "#006838",
              borderColor: "transparent",
              color: "white",
              fontSize: "0.8rem",
              fontWeight: 700,
            }}
          >
            <QrCode className="w-3.5 h-3.5" />
            Show Pickup Code
          </button>
        ) : isPast ? (
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
        ) : (
          <>
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
          </>
        )}
      </div>

      {isReady && (
        <div
          className="px-4 py-2 flex items-center gap-2"
          style={{ backgroundColor: "#D4EDDA", borderTop: "1px solid rgba(0,104,56,0.1)" }}
        >
          <Navigation className="w-3 h-3" style={{ color: "#006838" }} />
          <p style={{ fontSize: "0.72rem", color: "#004D28" }}>
            Window open &mdash; show your code to staff at the counter to complete pickup.
          </p>
        </div>
      )}

      {isPickedUp && (
        <div
          className="px-4 py-2 flex items-center gap-2"
          style={{ backgroundColor: "#D4EDDA", borderTop: "1px solid rgba(0,104,56,0.1)" }}
        >
          <CheckCircle2 className="w-3 h-3" style={{ color: "#006838" }} />
          <p style={{ fontSize: "0.72rem", color: "#004D28" }}>
            Verified by dining staff &middot; Share your experience below
          </p>
        </div>
      )}

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

function CountdownChip({ windowEnd }: { windowEnd: string }) {
  const [text, setText] = useState("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const [endH, endM] = windowEnd.split(":").map(Number);
      const endMinutes = endH * 60 + endM;
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const diff = endMinutes - nowMinutes;
      if (diff <= 0) {
        setText("Closed");
      } else if (diff >= 60) {
        const h = Math.floor(diff / 60);
        const m = diff % 60;
        setText(`Closes in ${h}h ${m}min`);
      } else {
        setText(`Closes in ${diff}min`);
      }
    };
    update();
    const interval = setInterval(update, 60_000);
    return () => clearInterval(interval);
  }, [windowEnd]);

  if (!text) return null;
  const isClosed = text === "Closed";

  return (
    <span
      className="flex items-center gap-1 px-1.5 py-0.5 rounded-md shrink-0"
      style={{
        backgroundColor: isClosed ? "rgba(0,0,0,0.55)" : "#F59E0B",
        color: "white",
        fontSize: "0.58rem",
        fontWeight: 700,
        whiteSpace: "nowrap",
      }}
    >
      <Timer className="w-2.5 h-2.5" />
      {text}
    </span>
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
  const extras = CARD_EXTRAS[drop.id] || { rating: 4.0, walkMin: 5, tags: [] };
  const locationColor = LOCATION_COLORS[drop.location] || "#006838";

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
        borderLeft: `3px solid ${locationColor}`,
      }}
    >
      <button
        onClick={onSelect}
        className="w-full text-left active:scale-[0.985] transition-transform"
      >
        <div className="flex items-stretch">
          {/* Food photo */}
          <div className="w-[90px] shrink-0 relative overflow-hidden" style={{ minHeight: 110 }}>
            <img
              src={drop.imageUrl}
              alt={drop.location}
              className="w-full h-full object-cover"
              style={{ filter: soldOut ? "grayscale(60%)" : "none" }}
            />
            {/* Closing soon badge */}
            {extras.closingSoon && !soldOut && !upcoming && (
              <div
                className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded-md"
                style={{
                  backgroundColor: "#DC2626",
                  color: "white",
                  fontSize: "0.58rem",
                  fontWeight: 700,
                }}
              >
                Closing Soon
              </div>
            )}
            {/* Urgency badge */}
            {urgency && !extras.closingSoon && (
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
          <div className="flex-1 p-3 min-w-0 flex flex-col">
            <div className="flex items-start justify-between gap-1">
              <div className="flex items-center gap-1.5 min-w-0">
                <p
                  className="truncate"
                  style={{ fontSize: "0.9rem", fontWeight: 700, color: "#1C2B1C" }}
                >
                  {drop.location}
                </p>
                {/* Location tag */}
                <span
                  className="px-1.5 py-0.5 rounded-full shrink-0"
                  style={{
                    backgroundColor: locationColor + "18",
                    color: locationColor,
                    fontSize: "0.55rem",
                    fontWeight: 700,
                  }}
                >
                  {drop.location === "Brandywine" ? "BW" : "ANT"}
                </span>
              </div>
              <ChevronRight className="w-4 h-4 shrink-0 mt-0.5" style={{ color: "#7A6B5A" }} />
            </div>

            <p
              className="mt-0.5 line-clamp-2"
              style={{ fontSize: "0.73rem", color: "#7A6B5A", lineHeight: 1.4 }}
            >
              {drop.description}
            </p>

            {/* Star + Distance + Countdown row */}
            <div className="flex items-center gap-2 mt-1.5 flex-wrap" style={{ fontSize: "0.65rem" }}>
              <span className="flex items-center gap-0.5" style={{ color: "#D97706" }}>
                <Star className="w-3 h-3" fill="#D97706" />
                <span style={{ fontWeight: 700 }}>{extras.rating}</span>
              </span>
              <span className="flex items-center gap-0.5" style={{ color: "#7A6B5A" }}>
                <Footprints className="w-3 h-3" />
                {extras.walkMin} min walk
              </span>
              {!soldOut && !upcoming && <CountdownChip windowEnd={drop.windowEnd} />}
            </div>

            {/* Time + location */}
            <div className="flex items-center gap-2.5 mt-1.5" style={{ fontSize: "0.68rem", color: "#7A6B5A" }}>
              <span className="flex items-center gap-1 whitespace-nowrap">
                <Clock className="w-3 h-3" />
                <span style={{ whiteSpace: "nowrap" }}>
                  {formatTime(drop.windowStart)}&ndash;{formatTime(drop.windowEnd)}
                </span>
              </span>
              <span className="flex items-center gap-1 truncate">
                <MapPin className="w-3 h-3 shrink-0" />
                <span className="truncate">{drop.locationDetail}</span>
              </span>
            </div>

            {/* Bottom row: stock + price */}
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
                className="px-2 py-0.5 rounded-lg"
                style={{
                  fontSize: "0.85rem",
                  fontWeight: 800,
                  color: soldOut ? "#7A6B5A" : "#006838",
                  backgroundColor: soldOut ? "transparent" : "#E8F5EE",
                }}
              >
                ${currentPrice}
              </span>
            </div>
          </div>
        </div>
      </button>

      {/* Waitlist button for sold out */}
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
