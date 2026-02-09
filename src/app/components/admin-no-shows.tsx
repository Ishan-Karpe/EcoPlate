import { motion } from "motion/react";
import { ArrowLeft, UserX, AlertTriangle, RotateCcw, Gift, Shield } from "lucide-react";

interface NoShowEntry {
  code: string;
  location: string;
  time: string;
  repeatOffender: boolean;
  boxStatus: "released" | "donated" | "disposed";
}

interface AdminNoShowsProps {
  onBack: () => void;
}

const MOCK_NO_SHOWS: NoShowEntry[] = [
  {
    code: "HK4M8R",
    location: "North Dining Hall",
    time: "9:15 PM",
    repeatOffender: true,
    boxStatus: "released",
  },
  {
    code: "W9P3TN",
    location: "South Dining Hall",
    time: "9:45 PM",
    repeatOffender: false,
    boxStatus: "donated",
  },
  {
    code: "Q5L7VB",
    location: "North Dining Hall",
    time: "10:02 PM",
    repeatOffender: false,
    boxStatus: "released",
  },
  {
    code: "M2X6KD",
    location: "Student Center Cafe",
    time: "8:35 PM",
    repeatOffender: true,
    boxStatus: "disposed",
  },
];

export function AdminNoShows({ onBack }: AdminNoShowsProps) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-5 pt-12 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-muted-foreground text-[0.875rem] mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </button>
        <h1 className="text-[1.5rem]" style={{ fontWeight: 700 }}>
          No-show Management
        </h1>
        <p className="text-muted-foreground text-[0.875rem] mt-1">
          Track unclaimed reservations and apply policies
        </p>
      </div>

      <div className="flex-1 px-5 py-4 space-y-4 overflow-y-auto pb-8">
        {/* Policy overview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-secondary rounded-xl p-4 space-y-3"
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4 text-primary" />
            <span className="text-[0.8rem] text-secondary-foreground" style={{ fontWeight: 600 }}>
              No-show Policy
            </span>
          </div>
          <div className="space-y-2 text-[0.75rem] text-muted-foreground">
            <div className="flex items-start gap-2">
              <span className="text-primary mt-0.5">1.</span>
              <p>Reservation held until pickup window ends</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary mt-0.5">2.</span>
              <p>If not picked up: marked as no-show</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary mt-0.5">3.</span>
              <p>Repeat no-shows (3+): lose early access privileges</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary mt-0.5">4.</span>
              <p>Credit returned only if cancelled before window starts</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-primary mt-0.5">5.</span>
              <p>Unclaimed boxes: released back to app OR directed to campus donation/disposal</p>
            </div>
          </div>
        </motion.div>

        {/* Tonight's no-shows summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-2"
        >
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <p className="text-[1.25rem] text-red-500" style={{ fontWeight: 800 }}>
              {MOCK_NO_SHOWS.length}
            </p>
            <p className="text-[0.65rem] text-muted-foreground">No-shows tonight</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <p className="text-[1.25rem] text-green-600" style={{ fontWeight: 800 }}>
              {MOCK_NO_SHOWS.filter((n) => n.boxStatus === "released").length}
            </p>
            <p className="text-[0.65rem] text-muted-foreground">Boxes released</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-3 text-center">
            <p className="text-[1.25rem] text-amber-600" style={{ fontWeight: 800 }}>
              {MOCK_NO_SHOWS.filter((n) => n.repeatOffender).length}
            </p>
            <p className="text-[0.65rem] text-muted-foreground">Repeat offenders</p>
          </div>
        </motion.div>

        {/* No-show list */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <p className="text-[0.8rem] text-muted-foreground mb-2" style={{ fontWeight: 600 }}>
            Tonight's No-shows
          </p>
          <div className="space-y-2">
            {MOCK_NO_SHOWS.map((noShow) => (
              <div
                key={noShow.code}
                className="bg-card rounded-xl border border-border p-3.5"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      className="text-[0.875rem] tracking-wider"
                      style={{ fontFamily: "'Inter', monospace", fontWeight: 600 }}
                    >
                      {noShow.code}
                    </span>
                    {noShow.repeatOffender && (
                      <span
                        className="bg-red-100 text-red-600 text-[0.6rem] px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                        style={{ fontWeight: 600 }}
                      >
                        <AlertTriangle className="w-2.5 h-2.5" />
                        Repeat
                      </span>
                    )}
                  </div>
                  <span className="text-[0.75rem] text-muted-foreground">{noShow.time}</span>
                </div>
                <p className="text-[0.75rem] text-muted-foreground mb-2">{noShow.location}</p>
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[0.7rem] px-2 py-0.5 rounded-full flex items-center gap-1 ${
                      noShow.boxStatus === "released"
                        ? "bg-green-100 text-green-700"
                        : noShow.boxStatus === "donated"
                        ? "bg-blue-100 text-blue-700"
                        : "bg-gray-100 text-gray-600"
                    }`}
                    style={{ fontWeight: 500 }}
                  >
                    {noShow.boxStatus === "released" && (
                      <>
                        <RotateCcw className="w-3 h-3" /> Released to app
                      </>
                    )}
                    {noShow.boxStatus === "donated" && (
                      <>
                        <Gift className="w-3 h-3" /> Sent to donation
                      </>
                    )}
                    {noShow.boxStatus === "disposed" && (
                      <>
                        <UserX className="w-3 h-3" /> Disposed
                      </>
                    )}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Box reallocation summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="bg-green-50 border border-green-200 rounded-xl p-4"
        >
          <p className="text-[0.8rem] text-green-800 mb-2" style={{ fontWeight: 600 }}>
            Unclaimed Box Handling
          </p>
          <p className="text-[0.75rem] text-green-700">
            Unclaimed boxes during remaining window time are automatically released back to the app
            for other students. After the window closes, remaining boxes are redirected to
            campus-approved donation channels or responsible disposal.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
