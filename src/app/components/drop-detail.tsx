import { motion } from "motion/react";
import { ArrowLeft, MapPin, Clock, Package, ChevronRight, ShieldCheck, Bell } from "lucide-react";
import { Drop, formatTime } from "./ecoplate-types";

interface DropDetailProps {
  drop: Drop;
  onReserve: () => void;
  onJoinWaitlist: () => void;
  onBack: () => void;
}

export function DropDetail({ drop, onReserve, onJoinWaitlist, onBack }: DropDetailProps) {
  const soldOut = drop.remainingBoxes === 0;
  const upcoming = drop.status === "upcoming";
  const urgency = !soldOut && !upcoming && drop.remainingBoxes <= 5;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="px-5 pt-12 pb-2">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-muted-foreground text-[0.875rem] mb-3"
        >
          <ArrowLeft className="w-4 h-4" />
          All drops
        </button>
      </div>

      <div className="flex-1 px-5 py-2 space-y-4 overflow-y-auto pb-4">
        {/* Hero banner */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className={`h-40 rounded-2xl relative flex items-center justify-center ${
            soldOut
              ? "bg-gray-100"
              : upcoming
              ? "bg-gradient-to-br from-blue-50 to-indigo-100"
              : "bg-gradient-to-br from-green-50 to-emerald-100"
          }`}
        >
          <div className="text-center">
            <div className="text-[3rem] mb-1">{drop.emoji}</div>
            <p
              className={`text-[0.8rem] ${
                soldOut ? "text-gray-500" : upcoming ? "text-blue-700" : "text-emerald-700"
              }`}
              style={{ fontWeight: 500 }}
            >
              {soldOut
                ? "All boxes claimed"
                : upcoming
                ? "Pickup starts soon"
                : "Packed fresh tonight"}
            </p>
          </div>

          {urgency && (
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute top-3 right-3 bg-amber-500 text-white text-[0.7rem] px-2.5 py-1 rounded-full"
              style={{ fontWeight: 600 }}
            >
              Only {drop.remainingBoxes} left!
            </motion.div>
          )}
          {soldOut && (
            <div
              className="absolute top-3 right-3 bg-gray-500 text-white text-[0.7rem] px-2.5 py-1 rounded-full"
              style={{ fontWeight: 600 }}
            >
              Sold out
            </div>
          )}
          {upcoming && (
            <div
              className="absolute top-3 right-3 bg-blue-500 text-white text-[0.7rem] px-2.5 py-1 rounded-full"
              style={{ fontWeight: 600 }}
            >
              Starting soon
            </div>
          )}
        </motion.div>

        {/* Location + details */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-2xl border border-border p-5 space-y-4"
        >
          <div>
            <h2 className="text-[1.25rem]" style={{ fontWeight: 700 }}>
              {drop.location}
            </h2>
            <p className="text-[0.875rem] text-muted-foreground mt-1 leading-relaxed">
              {drop.description}
            </p>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-start gap-2.5 bg-secondary rounded-xl p-3">
              <MapPin className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-[0.8rem]" style={{ fontWeight: 600 }}>
                  Pickup location
                </p>
                <p className="text-[0.7rem] text-muted-foreground">{drop.locationDetail}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 bg-secondary rounded-xl p-3">
              <Clock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <div>
                <p className="text-[0.8rem]" style={{ fontWeight: 600 }}>
                  Pickup window
                </p>
                <p className="text-[0.7rem] text-muted-foreground">
                  {formatTime(drop.windowStart)}-{formatTime(drop.windowEnd)}
                </p>
              </div>
            </div>
          </div>

          {/* Boxes + price bar */}
          <div className="flex items-center justify-between bg-accent/50 rounded-xl p-3">
            <div className="flex items-center gap-2">
              <Package className="w-4 h-4 text-primary" />
              <span className="text-[0.875rem]" style={{ fontWeight: 600 }}>
                {soldOut
                  ? `${drop.totalBoxes} boxes (all claimed)`
                  : upcoming
                  ? `${drop.totalBoxes} boxes available at drop`
                  : `${drop.remainingBoxes} of ${drop.totalBoxes} boxes left`}
              </span>
            </div>
            <div
              className="bg-primary/10 text-primary px-3 py-1 rounded-full text-[0.875rem]"
              style={{ fontWeight: 700 }}
            >
              ${drop.priceMin}-${drop.priceMax}
            </div>
          </div>

          {/* Progress bar */}
          {!upcoming && (
            <div>
              <div className="flex items-center justify-between text-[0.7rem] text-muted-foreground mb-1">
                <span>{drop.reservedBoxes} reserved</span>
                <span>{drop.remainingBoxes} available</span>
              </div>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{
                    width: `${(drop.reservedBoxes / drop.totalBoxes) * 100}%`,
                  }}
                  transition={{ duration: 0.6, delay: 0.2 }}
                  className={`h-full rounded-full ${soldOut ? "bg-gray-400" : "bg-primary"}`}
                />
              </div>
            </div>
          )}
        </motion.div>

        {/* Sold out: waitlist + next drop */}
        {soldOut && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="space-y-3"
          >
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 text-center">
              <p className="text-[0.875rem] text-amber-800" style={{ fontWeight: 600 }}>
                All boxes have been claimed
              </p>
              <p className="text-[0.8rem] text-amber-700 mt-1">
                Boxes may open up if someone cancels. Get notified!
              </p>
            </div>
            <button
              onClick={onJoinWaitlist}
              className="w-full bg-amber-500 text-white py-3.5 rounded-2xl text-[1rem] flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
              style={{ fontWeight: 600 }}
            >
              <Bell className="w-4 h-4" />
              Join Waitlist
            </button>
            <p className="text-center text-[0.7rem] text-muted-foreground">
              We'll notify you if a box opens up
            </p>
          </motion.div>
        )}

        {/* Upcoming notice */}
        {upcoming && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-blue-50 border border-blue-200 rounded-xl p-4 text-center"
          >
            <p className="text-[0.875rem] text-blue-800" style={{ fontWeight: 600 }}>
              Drop opens at {formatTime(drop.windowStart)}
            </p>
            <p className="text-[0.8rem] text-blue-700 mt-1">
              Reservations will be available when the pickup window starts.
            </p>
          </motion.div>
        )}

        {/* Trust signal */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-2 justify-center py-1"
        >
          <ShieldCheck className="w-4 h-4 text-primary" />
          <span className="text-[0.75rem] text-muted-foreground">
            Food handled by campus dining staff
          </span>
        </motion.div>
      </div>

      {/* Reserve button (only for active, available drops) */}
      {!soldOut && !upcoming && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="px-5 pb-8 pt-3"
        >
          <button
            onClick={onReserve}
            className="w-full bg-primary text-primary-foreground py-4 rounded-2xl text-[1.125rem] flex items-center justify-center gap-2 shadow-lg shadow-primary/25 active:scale-[0.98] transition-transform"
            style={{ fontWeight: 700 }}
          >
            Reserve My Box
            <ChevronRight className="w-5 h-5" />
          </button>
          <p className="text-center text-[0.75rem] text-muted-foreground mt-2">
            No account needed. Reserve in one tap.
          </p>
        </motion.div>
      )}

      {/* Upcoming: Reserve button disabled */}
      {upcoming && (
        <div className="px-5 pb-8 pt-3">
          <button
            disabled
            className="w-full bg-blue-200 text-blue-500 py-4 rounded-2xl text-[1rem] cursor-not-allowed"
            style={{ fontWeight: 600 }}
          >
            Reservations open at {formatTime(drop.windowStart)}
          </button>
        </div>
      )}
    </div>
  );
}
