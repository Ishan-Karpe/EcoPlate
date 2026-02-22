import { motion } from "motion/react";
import { useState } from "react";
import { Leaf, ArrowLeft, ShieldCheck } from "lucide-react";

interface AdminLoginProps {
  onLogin: () => void;
  onBack: () => void;
}

export function AdminLogin({ onLogin, onBack }: AdminLoginProps) {
  const [pin, setPin] = useState("");
  const [error, setError] = useState(false);

  const handleSubmit = () => {
    if (pin.length === 4) {
      onLogin();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F9F6F1" }}>
      <div className="px-5 pt-12 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 mb-6"
          style={{ color: "#7A6B5A", fontSize: "0.875rem" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Back to student view
        </button>
      </div>

      <div className="flex-1 px-5 flex flex-col items-center justify-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-sm text-center"
        >
          <div
            className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "#E8F5EE" }}
          >
            <Leaf className="w-8 h-8" style={{ color: "#006838" }} />
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1C2B1C" }}>
            EcoPlate Staff
          </h1>
          <p className="mt-1 mb-8" style={{ fontSize: "0.875rem", color: "#7A6B5A" }}>
            Enter your staff PIN to manage drops
          </p>

          <div className="space-y-4">
            <div className="flex justify-center gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="w-14 h-14 rounded-xl border-2 flex items-center justify-center transition-colors"
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    borderColor: pin.length > i ? "#006838" : error ? "#C0392B" : "rgba(0,104,56,0.2)",
                    backgroundColor: pin.length > i ? "#E8F5EE" : "white",
                    color: "#006838",
                  }}
                >
                  {pin[i] ? "●" : ""}
                </div>
              ))}
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ fontSize: "0.8rem", color: "#C0392B" }}
              >
                Please enter a 4-digit PIN
              </motion.p>
            )}

            <input
              type="tel"
              maxLength={4}
              value={pin}
              onChange={(e) => {
                const val = e.target.value.replace(/\D/g, "").slice(0, 4);
                setPin(val);
              }}
              className="opacity-0 absolute w-0 h-0"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />

            {/* Number pad */}
            <div className="grid grid-cols-3 gap-2 max-w-[16rem] mx-auto mt-4">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, "del"].map((num, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (num === "del") {
                      setPin((p) => p.slice(0, -1));
                    } else if (num !== null && pin.length < 4) {
                      setPin((p) => p + num);
                    }
                  }}
                  className="h-14 rounded-xl transition-colors active:scale-[0.93]"
                  style={{
                    fontSize: num === "del" ? "0.875rem" : "1.25rem",
                    fontWeight: 500,
                    visibility: num === null ? "hidden" : "visible",
                    backgroundColor: num === "del" ? "#EDE8E1" : "white",
                    color: num === "del" ? "#7A6B5A" : "#1C2B1C",
                    border: "1px solid rgba(0,104,56,0.1)",
                  }}
                  disabled={num === null}
                >
                  {num === "del" ? "⌫" : num}
                </button>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={pin.length < 4}
              className="w-full py-3.5 rounded-2xl mt-4 active:scale-[0.98] transition-transform"
              style={{
                backgroundColor: pin.length < 4 ? "#EDE8E1" : "#006838",
                color: pin.length < 4 ? "#7A6B5A" : "white",
                fontSize: "1rem",
                fontWeight: 700,
                cursor: pin.length < 4 ? "default" : "pointer",
                boxShadow: pin.length >= 4 ? "0 4px 20px rgba(0,104,56,0.3)" : "none",
              }}
            >
              Sign In
            </button>
          </div>

          <div className="flex items-center gap-2 justify-center mt-6">
            <ShieldCheck className="w-4 h-4" style={{ color: "#7A6B5A" }} />
            <span style={{ fontSize: "0.75rem", color: "#7A6B5A" }}>
              Demo: enter any 4 digits
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}