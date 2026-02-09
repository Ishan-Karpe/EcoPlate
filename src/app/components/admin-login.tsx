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
    // Demo: accept any 4-digit PIN
    if (pin.length === 4) {
      onLogin();
    } else {
      setError(true);
      setTimeout(() => setError(false), 2000);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="px-5 pt-12 pb-4">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-muted-foreground text-[0.875rem] mb-6"
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
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Leaf className="w-8 h-8 text-primary" />
          </div>
          <h1 className="text-[1.5rem] mb-1" style={{ fontWeight: 700 }}>
            EcoPlate Staff
          </h1>
          <p className="text-muted-foreground text-[0.875rem] mb-8">
            Enter your staff PIN to manage drops
          </p>

          <div className="space-y-4">
            <div className="flex justify-center gap-3">
              {[0, 1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-14 h-14 rounded-xl border-2 flex items-center justify-center text-[1.5rem] transition-colors ${
                    pin.length > i
                      ? "border-primary bg-primary/5 text-primary"
                      : error
                      ? "border-destructive"
                      : "border-border bg-card"
                  }`}
                  style={{ fontWeight: 700 }}
                >
                  {pin[i] ? "●" : ""}
                </div>
              ))}
            </div>

            {error && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-destructive text-[0.8rem]"
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

            {/* Visible number pad */}
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
                  className={`h-14 rounded-xl text-[1.25rem] transition-colors ${
                    num === null
                      ? "invisible"
                      : num === "del"
                      ? "bg-muted text-muted-foreground text-[0.875rem]"
                      : "bg-card border border-border hover:bg-accent active:bg-primary/10"
                  }`}
                  style={{ fontWeight: 500 }}
                  disabled={num === null}
                >
                  {num === "del" ? "⌫" : num}
                </button>
              ))}
            </div>

            <button
              onClick={handleSubmit}
              disabled={pin.length < 4}
              className="w-full bg-primary text-primary-foreground py-3.5 rounded-2xl text-[1rem] disabled:opacity-40 transition-opacity mt-4 active:scale-[0.98] transition-transform"
              style={{ fontWeight: 600 }}
            >
              Sign In
            </button>
          </div>

          <div className="flex items-center gap-2 justify-center mt-6">
            <ShieldCheck className="w-4 h-4 text-muted-foreground" />
            <span className="text-[0.75rem] text-muted-foreground">
              Demo: enter any 4 digits
            </span>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
