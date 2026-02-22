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
    location: "Anteatery",
    time: "9:15 PM",
    repeatOffender: true,
    boxStatus: "released",
  },
  {
    code: "W9P3TN",
    location: "Brandywine",
    time: "9:45 PM",
    repeatOffender: false,
    boxStatus: "donated",
  },
  {
    code: "Q5L7VB",
    location: "Anteatery",
    time: "10:02 PM",
    repeatOffender: false,
    boxStatus: "released",
  },
];

export function AdminNoShows({ onBack }: AdminNoShowsProps) {
  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F9F6F1" }}>
      <div className="px-5 pt-12 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 mb-4"
          style={{ color: "#7A6B5A", fontSize: "0.875rem" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </button>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1C2B1C" }}>
          No-show Management
        </h1>
        <p className="mt-1" style={{ fontSize: "0.875rem", color: "#7A6B5A" }}>
          Track unclaimed reservations and apply policies
        </p>
      </div>

      <div className="flex-1 px-5 space-y-4 overflow-y-auto pb-8">
        {/* Policy overview */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl p-4 space-y-3"
          style={{ backgroundColor: "#F0EBE3" }}
        >
          <div className="flex items-center gap-2">
            <Shield className="w-4 h-4" style={{ color: "#8B6F47" }} />
            <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#4A3728" }}>
              No-show Policy
            </span>
          </div>
          <div className="space-y-2" style={{ fontSize: "0.75rem", color: "#7A6B5A" }}>
            {[
              "Reservation held until pickup window ends",
              "If not picked up: marked as no-show",
              "Repeat no-shows (3+): lose early access privileges",
              "Credit returned only if cancelled before window starts",
              "Unclaimed boxes: released to app or directed to donation/disposal",
            ].map((rule, i) => (
              <div key={i} className="flex items-start gap-2">
                <span style={{ color: "#006838", marginTop: 1 }}>{i + 1}.</span>
                <p>{rule}</p>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Summary */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-2"
        >
          <div className="rounded-xl p-3 text-center shadow-sm" style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.1)" }}>
            <p style={{ fontSize: "1.25rem", fontWeight: 800, color: "#C0392B" }}>{MOCK_NO_SHOWS.length}</p>
            <p style={{ fontSize: "0.65rem", color: "#7A6B5A" }}>No-shows tonight</p>
          </div>
          <div className="rounded-xl p-3 text-center shadow-sm" style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.1)" }}>
            <p style={{ fontSize: "1.25rem", fontWeight: 800, color: "#006838" }}>
              {MOCK_NO_SHOWS.filter((n) => n.boxStatus === "released").length}
            </p>
            <p style={{ fontSize: "0.65rem", color: "#7A6B5A" }}>Boxes released</p>
          </div>
          <div className="rounded-xl p-3 text-center shadow-sm" style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.1)" }}>
            <p style={{ fontSize: "1.25rem", fontWeight: 800, color: "#D97706" }}>
              {MOCK_NO_SHOWS.filter((n) => n.repeatOffender).length}
            </p>
            <p style={{ fontSize: "0.65rem", color: "#7A6B5A" }}>Repeat offenders</p>
          </div>
        </motion.div>

        {/* List */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#7A6B5A", marginBottom: 8 }}>
            Tonight's No-shows
          </p>
          <div className="space-y-2">
            {MOCK_NO_SHOWS.map((noShow) => (
              <div
                key={noShow.code}
                className="rounded-xl p-3.5 shadow-sm"
                style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.1)" }}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span
                      style={{ fontFamily: "monospace", fontWeight: 700, fontSize: "0.9rem", color: "#1C2B1C", letterSpacing: "0.05em" }}
                    >
                      {noShow.code}
                    </span>
                    {noShow.repeatOffender && (
                      <span
                        className="px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                        style={{ backgroundColor: "#FEE2E2", color: "#C0392B", fontSize: "0.6rem", fontWeight: 600 }}
                      >
                        <AlertTriangle className="w-2.5 h-2.5" />
                        Repeat
                      </span>
                    )}
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "#7A6B5A" }}>{noShow.time}</span>
                </div>
                <p style={{ fontSize: "0.75rem", color: "#7A6B5A", marginBottom: 8 }}>{noShow.location}</p>
                <span
                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                  style={{
                    backgroundColor: noShow.boxStatus === "released" ? "#E8F5EE" : noShow.boxStatus === "donated" ? "#EFF6FF" : "#F5F1EB",
                    color: noShow.boxStatus === "released" ? "#006838" : noShow.boxStatus === "donated" ? "#2563EB" : "#7A6B5A",
                    fontSize: "0.7rem",
                    fontWeight: 500,
                  }}
                >
                  {noShow.boxStatus === "released" && <><RotateCcw className="w-3 h-3" /> Released to app</>}
                  {noShow.boxStatus === "donated" && <><Gift className="w-3 h-3" /> Sent to donation</>}
                  {noShow.boxStatus === "disposed" && <><UserX className="w-3 h-3" /> Disposed</>}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Box handling */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="rounded-xl p-4"
          style={{ backgroundColor: "#E8F5EE", border: "1px solid rgba(0,104,56,0.2)" }}
        >
          <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#004D28", marginBottom: 6 }}>
            Unclaimed Box Handling
          </p>
          <p style={{ fontSize: "0.75rem", color: "#006838" }}>
            Unclaimed boxes during remaining window time are released back to the app for other
            students. After the window closes, remaining boxes are redirected to campus-approved
            donation channels or responsible disposal.
          </p>
        </motion.div>
      </div>
    </div>
  );
}