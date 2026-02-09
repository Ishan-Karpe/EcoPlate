import { motion } from "motion/react";
import { useState } from "react";
import { ArrowLeft, CheckCircle2, XCircle, Search, Clock, AlertTriangle } from "lucide-react";

interface AdminRedeemProps {
  onBack: () => void;
  validCodes: string[];
  expiredCodes: string[];
  onRedeem: (code: string) => void;
  recentRedemptions: { code: string; time: string }[];
}

export function AdminRedeem({
  onBack,
  validCodes,
  expiredCodes,
  onRedeem,
  recentRedemptions,
}: AdminRedeemProps) {
  const [code, setCode] = useState("");
  const [result, setResult] = useState<"success" | "expired" | "invalid" | null>(null);
  const [redeemedCode, setRedeemedCode] = useState("");

  const handleCheck = () => {
    const upperCode = code.toUpperCase().trim();
    if (validCodes.includes(upperCode)) {
      setResult("success");
      setRedeemedCode(upperCode);
      onRedeem(upperCode);
      setTimeout(() => {
        setResult(null);
        setCode("");
      }, 3000);
    } else if (expiredCodes.includes(upperCode)) {
      setResult("expired");
      setTimeout(() => setResult(null), 3000);
    } else {
      setResult("invalid");
      setTimeout(() => setResult(null), 2500);
    }
  };

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
          Redeem Pickup
        </h1>
        <p className="text-muted-foreground text-[0.875rem] mt-1">
          Enter or scan the student's 6-digit code
        </p>
      </div>

      <div className="flex-1 px-5 py-6 flex flex-col items-center">
        {/* Code input */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm"
        >
          <div className="bg-card rounded-2xl border border-border p-6 text-center space-y-4">
            <div className="w-14 h-14 bg-accent rounded-xl flex items-center justify-center mx-auto">
              <Search className="w-7 h-7 text-primary" />
            </div>

            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase().slice(0, 6));
                setResult(null);
              }}
              placeholder="XXXXXX"
              maxLength={6}
              className="w-full text-center text-[2rem] tracking-[0.2em] bg-input-background rounded-xl px-4 py-4 border-none outline-none placeholder:text-gray-300"
              style={{ fontWeight: 700, fontFamily: "'Inter', monospace" }}
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCheck();
              }}
            />

            <button
              onClick={handleCheck}
              disabled={code.length < 6}
              className="w-full bg-primary text-primary-foreground py-3.5 rounded-xl text-[1rem] disabled:opacity-40 transition-opacity active:scale-[0.98] transition-transform"
              style={{ fontWeight: 600 }}
            >
              Verify & Redeem
            </button>
          </div>

          {/* Result feedback */}
          {result === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 bg-green-50 border border-green-200 rounded-xl p-4 flex items-center gap-3"
            >
              <CheckCircle2 className="w-8 h-8 text-green-600 shrink-0" />
              <div>
                <p className="text-[0.875rem] text-green-800" style={{ fontWeight: 600 }}>
                  Pickup confirmed!
                </p>
                <p className="text-[0.8rem] text-green-600">
                  Code {redeemedCode} verified. Hand the box to the student.
                </p>
              </div>
            </motion.div>
          )}

          {result === "expired" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center gap-3"
            >
              <Clock className="w-8 h-8 text-amber-500 shrink-0" />
              <div>
                <p className="text-[0.875rem] text-amber-800" style={{ fontWeight: 600 }}>
                  Code expired
                </p>
                <p className="text-[0.8rem] text-amber-600">
                  This code's pickup window has ended or the reservation was cancelled. Please
                  ask the student to make a new reservation.
                </p>
              </div>
            </motion.div>
          )}

          {result === "invalid" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3"
            >
              <XCircle className="w-8 h-8 text-red-500 shrink-0" />
              <div>
                <p className="text-[0.875rem] text-red-800" style={{ fontWeight: 600 }}>
                  Code not found
                </p>
                <p className="text-[0.8rem] text-red-600">
                  This code doesn't match any active reservation. Check for typos and try again.
                </p>
              </div>
            </motion.div>
          )}

          {/* Support fallback */}
          {(result === "expired" || result === "invalid") && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="mt-3 bg-secondary rounded-xl p-3 flex items-start gap-2"
            >
              <AlertTriangle className="w-4 h-4 text-primary mt-0.5 shrink-0" />
              <p className="text-[0.75rem] text-muted-foreground">
                <strong>Support fallback:</strong> If the student insists they have a valid
                reservation, check the admin dashboard for their reservation details or contact
                EcoPlate support.
              </p>
            </motion.div>
          )}
        </motion.div>

        {/* Recent redemptions */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-sm mt-8"
        >
          <p className="text-[0.8rem] text-muted-foreground mb-3" style={{ fontWeight: 600 }}>
            Recent pickups tonight
          </p>
          <div className="space-y-2">
            {recentRedemptions.length > 0 ? (
              recentRedemptions.map((entry) => (
                <div
                  key={entry.code}
                  className="bg-card rounded-lg border border-border px-4 py-3 flex items-center justify-between"
                >
                  <span
                    className="text-[0.875rem] tracking-wide"
                    style={{ fontFamily: "'Inter', monospace", fontWeight: 500 }}
                  >
                    {entry.code}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                    <span className="text-[0.75rem] text-muted-foreground">{entry.time}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-[0.8rem] text-muted-foreground py-4">
                No pickups tonight yet
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
