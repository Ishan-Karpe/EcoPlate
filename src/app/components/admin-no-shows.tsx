import { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ArrowLeft, UserX, AlertTriangle, RotateCcw, Gift, Shield, RefreshCw } from "lucide-react";
import type { NoShowEntry } from "../api";

interface AdminNoShowsProps {
  onBack: () => void;
  noShows: NoShowEntry[];
  loading: boolean;
  onMarkNoShow: (reservationId: string, boxStatus: "released" | "donated" | "disposed") => void;
}

export function AdminNoShows({ onBack, noShows, loading, onMarkNoShow }: AdminNoShowsProps) {
  const [pendingId, setPendingId] = useState<string | null>(null);

  const handleMark = async (
    reservationId: string,
    boxStatus: "released" | "donated" | "disposed"
  ) => {
    setPendingId(reservationId);
    await onMarkNoShow(reservationId, boxStatus);
    setPendingId(null);
  };

  const markedCount = noShows.filter((n) => n.alreadyMarked).length;
  const releasedCount = noShows.filter((n) => n.boxStatus === "released").length;
  const repeatCount = noShows.filter((n) => n.repeatOffender).length;

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

        {/* Summary stats */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-3 gap-2"
        >
          <div
            className="rounded-xl p-3 text-center shadow-sm"
            style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.1)" }}
          >
            <p style={{ fontSize: "1.25rem", fontWeight: 800, color: "#C0392B" }}>
              {loading ? "-" : noShows.length}
            </p>
            <p style={{ fontSize: "0.65rem", color: "#7A6B5A" }}>No-shows tonight</p>
          </div>
          <div
            className="rounded-xl p-3 text-center shadow-sm"
            style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.1)" }}
          >
            <p style={{ fontSize: "1.25rem", fontWeight: 800, color: "#006838" }}>
              {loading ? "-" : releasedCount}
            </p>
            <p style={{ fontSize: "0.65rem", color: "#7A6B5A" }}>Boxes released</p>
          </div>
          <div
            className="rounded-xl p-3 text-center shadow-sm"
            style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.1)" }}
          >
            <p style={{ fontSize: "1.25rem", fontWeight: 800, color: "#D97706" }}>
              {loading ? "-" : repeatCount}
            </p>
            <p style={{ fontSize: "0.65rem", color: "#7A6B5A" }}>Repeat offenders</p>
          </div>
        </motion.div>

        {/* List */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#7A6B5A", marginBottom: 8 }}>
            Tonight's No-shows
          </p>

          {/* Loading state */}
          {loading && (
            <div
              className="rounded-xl p-8 flex items-center justify-center gap-2"
              style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.1)" }}
            >
              <RefreshCw className="w-4 h-4 animate-spin" style={{ color: "#006838" }} />
              <p style={{ fontSize: "0.875rem", color: "#7A6B5A" }}>Loading no-shows…</p>
            </div>
          )}

          {/* Empty state */}
          {!loading && noShows.length === 0 && (
            <div
              className="rounded-xl p-8 text-center"
              style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.1)" }}
            >
              <UserX className="w-10 h-10 mx-auto mb-3" style={{ color: "rgba(0,104,56,0.25)" }} />
              <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "#4A6B4A" }}>
                No no-shows right now
              </p>
              <p className="mt-1" style={{ fontSize: "0.78rem", color: "#7A6B5A" }}>
                Reservations where the pickup window has ended and the box wasn't claimed will appear here.
              </p>
            </div>
          )}

          {/* Real entries */}
          {!loading && noShows.length > 0 && (
            <div className="space-y-3">
              <AnimatePresence>
                {noShows.map((noShow) => (
                  <motion.div
                    key={noShow.reservationId}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-xl p-3.5 shadow-sm"
                    style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.1)" }}
                  >
                    {/* Top row: code + repeat badge + time */}
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontWeight: 700,
                            fontSize: "0.9rem",
                            color: "#1C2B1C",
                            letterSpacing: "0.05em",
                          }}
                        >
                          {noShow.code}
                        </span>
                        {noShow.repeatOffender && (
                          <span
                            className="px-1.5 py-0.5 rounded-full flex items-center gap-0.5"
                            style={{
                              backgroundColor: "#FEE2E2",
                              color: "#C0392B",
                              fontSize: "0.6rem",
                              fontWeight: 600,
                            }}
                          >
                            <AlertTriangle className="w-2.5 h-2.5" />
                            Repeat
                          </span>
                        )}
                      </div>
                      <span style={{ fontSize: "0.75rem", color: "#7A6B5A" }}>{noShow.time}</span>
                    </div>

                    <p style={{ fontSize: "0.75rem", color: "#7A6B5A", marginBottom: 10 }}>
                      {noShow.location}
                    </p>

                    {/* Already marked - show status badge */}
                    {noShow.alreadyMarked && noShow.boxStatus && (
                      <span
                        className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full"
                        style={{
                          backgroundColor:
                            noShow.boxStatus === "released"
                              ? "#E8F5EE"
                              : noShow.boxStatus === "donated"
                              ? "#EFF6FF"
                              : "#F5F1EB",
                          color:
                            noShow.boxStatus === "released"
                              ? "#006838"
                              : noShow.boxStatus === "donated"
                              ? "#2563EB"
                              : "#7A6B5A",
                          fontSize: "0.7rem",
                          fontWeight: 500,
                        }}
                      >
                        {noShow.boxStatus === "released" && (
                          <><RotateCcw className="w-3 h-3" /> Released to app</>
                        )}
                        {noShow.boxStatus === "donated" && (
                          <><Gift className="w-3 h-3" /> Sent to donation</>
                        )}
                        {noShow.boxStatus === "disposed" && (
                          <><UserX className="w-3 h-3" /> Disposed</>
                        )}
                      </span>
                    )}

                    {/* Not yet marked - action buttons */}
                    {!noShow.alreadyMarked && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleMark(noShow.reservationId, "released")}
                          disabled={pendingId === noShow.reservationId}
                          className="flex-1 py-2 rounded-lg flex items-center justify-center gap-1 active:scale-[0.97] transition-all"
                          style={{
                            backgroundColor: "#E8F5EE",
                            color: "#006838",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            opacity: pendingId === noShow.reservationId ? 0.6 : 1,
                          }}
                        >
                          <RotateCcw className="w-3 h-3" />
                          Release
                        </button>
                        <button
                          onClick={() => handleMark(noShow.reservationId, "donated")}
                          disabled={pendingId === noShow.reservationId}
                          className="flex-1 py-2 rounded-lg flex items-center justify-center gap-1 active:scale-[0.97] transition-all"
                          style={{
                            backgroundColor: "#EFF6FF",
                            color: "#2563EB",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            opacity: pendingId === noShow.reservationId ? 0.6 : 1,
                          }}
                        >
                          <Gift className="w-3 h-3" />
                          Donate
                        </button>
                        <button
                          onClick={() => handleMark(noShow.reservationId, "disposed")}
                          disabled={pendingId === noShow.reservationId}
                          className="flex-1 py-2 rounded-lg flex items-center justify-center gap-1 active:scale-[0.97] transition-all"
                          style={{
                            backgroundColor: "#F5F1EB",
                            color: "#7A6B5A",
                            fontSize: "0.72rem",
                            fontWeight: 600,
                            opacity: pendingId === noShow.reservationId ? 0.6 : 1,
                          }}
                        >
                          <UserX className="w-3 h-3" />
                          Dispose
                        </button>
                      </div>
                    )}
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Box handling info */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
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