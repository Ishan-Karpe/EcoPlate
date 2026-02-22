import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  AlertTriangle,
  ScanLine,
  Keyboard,
  Camera,
  CameraOff,
  FlipHorizontal,
} from "lucide-react";
import jsQR from "jsqr";
import type { RedeemResult } from "../api";

interface Redemption {
  code: string;
  time: string;
  location: string;
}

interface AdminRedeemProps {
  onBack: () => void;
  onRedeem: (code: string) => Promise<RedeemResult>;
  recentRedemptions: Redemption[];
}

type InputMode = "code" | "qr";
type ResultState = "success" | "expired" | "invalid" | null;
type CameraState = "idle" | "requesting" | "active" | "denied" | "error";

// Parse ECOPLATE QR format: "ECOPLATE:<CODE>:<LOCATION>"
function parseEcoPlateQR(raw: string): string | null {
  const parts = raw.trim().split(":");
  if (parts[0] === "ECOPLATE" && parts[1] && parts[1].length === 6) {
    return parts[1].toUpperCase();
  }
  // Fallback: treat as bare 6-char code
  const bare = raw.trim().toUpperCase();
  if (/^[A-Z0-9]{6}$/.test(bare)) return bare;
  return null;
}

export function AdminRedeem({
  onBack,
  onRedeem,
  recentRedemptions,
}: AdminRedeemProps) {
  const [mode, setMode] = useState<InputMode>("qr");
  const [code, setCode] = useState("");
  const [result, setResult] = useState<ResultState>(null);
  const [redeemedCode, setRedeemedCode] = useState("");

  // Camera state
  const [cameraState, setCameraState] = useState<CameraState>("idle");
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const [detectedCode, setDetectedCode] = useState<string | null>(null);
  const [scannerActive, setScannerActive] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const resultLockRef = useRef(false); // prevent duplicate triggers

  // ── Camera lifecycle ──────────────────────────────────────────────

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    if (videoRef.current) videoRef.current.srcObject = null;
    setScannerActive(false);
    setCameraState("idle");
    resultLockRef.current = false;
    setDetectedCode(null);
  }, []);

  const startCamera = useCallback(async (facing: "environment" | "user" = "environment") => {
    stopCamera();
    setCameraState("requesting");
    setResult(null);
    resultLockRef.current = false;

    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          facingMode: { ideal: facing },
          width: { ideal: 1280 },
          height: { ideal: 720 },
        },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setCameraState("active");
      setScannerActive(true);
    } catch (err: unknown) {
      const error = err as { name?: string };
      if (error.name === "NotAllowedError" || error.name === "PermissionDeniedError") {
        setCameraState("denied");
      } else {
        setCameraState("error");
      }
    }
  }, [stopCamera]);

  // Flip camera
  const flipCamera = () => {
    const next = facingMode === "environment" ? "user" : "environment";
    setFacingMode(next);
    startCamera(next);
  };

  // Stop camera when switching away from QR mode or unmounting
  useEffect(() => {
    if (mode !== "qr") stopCamera();
  }, [mode, stopCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  // ── QR scan loop ──────────────────────────────────────────────────

  const handleCheck = useCallback(async (inputCode: string) => {
    const upper = inputCode.toUpperCase().trim();
    if (!upper || upper.length < 6) return;

    const result = await onRedeem(upper);

    if (result.valid) {
      setResult("success");
      setRedeemedCode(upper);
      setTimeout(() => {
        setResult(null);
        setCode("");
        resultLockRef.current = false;
        setDetectedCode(null);
      }, 3500);
    } else if (result.reason === "Already redeemed" || result.reason === "Code expired or cancelled") {
      setResult("expired");
      setTimeout(() => {
        setResult(null);
        resultLockRef.current = false;
        setDetectedCode(null);
      }, 4000);
    } else {
      setResult("invalid");
      setTimeout(() => {
        setResult(null);
        resultLockRef.current = false;
        setDetectedCode(null);
      }, 3000);
    }
  }, [onRedeem]);

  useEffect(() => {
    if (!scannerActive) return;

    const scan = () => {
      const video = videoRef.current;
      const canvas = canvasRef.current;
      if (!video || !canvas || video.readyState < 2) {
        rafRef.current = requestAnimationFrame(scan);
        return;
      }

      const ctx = canvas.getContext("2d", { willReadFrequently: true });
      if (!ctx) { rafRef.current = requestAnimationFrame(scan); return; }

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const qr = jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });

      if (qr && !resultLockRef.current) {
        const parsed = parseEcoPlateQR(qr.data);
        if (parsed) {
          resultLockRef.current = true;
          setDetectedCode(parsed);
          setScannerActive(false); // pause scanning
          handleCheck(parsed);
          return;
        }
      }

      rafRef.current = requestAnimationFrame(scan);
    };

    rafRef.current = requestAnimationFrame(scan);
    return () => cancelAnimationFrame(rafRef.current);
  }, [scannerActive, handleCheck]);

  const totalToday = recentRedemptions.length;

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F9F6F1" }}>
      {/* Header */}
      <div
        className="px-5 pt-12 pb-5 rounded-b-[2rem] shadow-sm"
        style={{ backgroundColor: "#006838" }}
      >
        <button
          onClick={() => { stopCamera(); onBack(); }}
          className="flex items-center gap-1 mb-4 text-white/70 active:text-white"
          style={{ fontSize: "0.875rem" }}
        >
          <ArrowLeft className="w-4 h-4" />
          Dashboard
        </button>
        <h1 className="text-white" style={{ fontSize: "1.375rem", fontWeight: 800 }}>
          Redeem Pickup
        </h1>
        <p className="text-white/70 mt-1" style={{ fontSize: "0.875rem" }}>
          Scan QR or enter pickup code
        </p>
        {recentRedemptions.length > 0 && (
          <div
            className="mt-3 inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full"
            style={{ backgroundColor: "rgba(255,255,255,0.18)" }}
          >
            <CheckCircle2 className="w-3.5 h-3.5 text-white" />
            <span className="text-white" style={{ fontSize: "0.78rem", fontWeight: 600 }}>
              {totalToday} picked up today
            </span>
          </div>
        )}
      </div>

      <div className="flex-1 px-4 py-5 space-y-4 overflow-y-auto pb-10">
        {/* Mode selector */}
        <div className="flex rounded-2xl p-1" style={{ backgroundColor: "#EDE8E1" }}>
          <button
            onClick={() => { setMode("qr"); setResult(null); setCode(""); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all"
            style={{
              backgroundColor: mode === "qr" ? "white" : "transparent",
              color: mode === "qr" ? "#006838" : "#7A6B5A",
              fontSize: "0.875rem",
              fontWeight: 700,
              boxShadow: mode === "qr" ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
            }}
          >
            <ScanLine className="w-4 h-4" />
            Scan QR
          </button>
          <button
            onClick={() => { setMode("code"); setResult(null); }}
            className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl transition-all"
            style={{
              backgroundColor: mode === "code" ? "white" : "transparent",
              color: mode === "code" ? "#006838" : "#7A6B5A",
              fontSize: "0.875rem",
              fontWeight: 700,
              boxShadow: mode === "code" ? "0 2px 8px rgba(0,0,0,0.08)" : "none",
            }}
          >
            <Keyboard className="w-4 h-4" />
            Enter Code
          </button>
        </div>

        {/* ── QR Camera mode ── */}
        {mode === "qr" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl overflow-hidden shadow-sm"
            style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.1)" }}
          >
            {/* Viewfinder */}
            <div
              className="relative flex items-center justify-center overflow-hidden"
              style={{ height: 280, backgroundColor: "#0F1A0F" }}
            >
              {/* Live video */}
              <video
                ref={videoRef}
                className="absolute inset-0 w-full h-full object-cover"
                playsInline
                muted
                style={{ display: cameraState === "active" ? "block" : "none" }}
              />
              {/* Hidden canvas for frame capture */}
              <canvas ref={canvasRef} className="hidden" />

              {/* Idle state */}
              {cameraState === "idle" && (
                <div className="text-center px-6">
                  <Camera className="w-14 h-14 mx-auto mb-3" style={{ color: "rgba(255,255,255,0.25)" }} />
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem", fontWeight: 600 }}>
                    Camera is off
                  </p>
                  <p className="mt-1" style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.75rem" }}>
                    Tap "Start Camera" below to activate
                  </p>
                </div>
              )}

              {/* Requesting permission */}
              {cameraState === "requesting" && (
                <div className="text-center">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
                    className="w-10 h-10 rounded-full border-2 border-t-transparent mx-auto mb-3"
                    style={{ borderColor: "rgba(134,239,172,0.6)", borderTopColor: "transparent" }}
                  />
                  <p style={{ color: "rgba(255,255,255,0.6)", fontSize: "0.875rem" }}>
                    Requesting camera access…
                  </p>
                </div>
              )}

              {/* Permission denied */}
              {cameraState === "denied" && (
                <div className="text-center px-6">
                  <CameraOff className="w-12 h-12 mx-auto mb-3" style={{ color: "#f87171" }} />
                  <p style={{ color: "#fca5a5", fontSize: "0.875rem", fontWeight: 600 }}>
                    Camera access denied
                  </p>
                  <p className="mt-1" style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem" }}>
                    Allow camera permission in your browser settings, then try again.
                  </p>
                </div>
              )}

              {/* Error */}
              {cameraState === "error" && (
                <div className="text-center px-6">
                  <CameraOff className="w-12 h-12 mx-auto mb-3" style={{ color: "#fbbf24" }} />
                  <p style={{ color: "#fde68a", fontSize: "0.875rem", fontWeight: 600 }}>
                    Camera unavailable
                  </p>
                  <p className="mt-1" style={{ color: "rgba(255,255,255,0.4)", fontSize: "0.72rem" }}>
                    No camera found or it's in use by another app.
                  </p>
                </div>
              )}

              {/* Active: scan frame overlay */}
              {cameraState === "active" && (
                <>
                  {/* Corner brackets */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="relative w-52 h-52">
                      {/* TL */}
                      <div className="absolute top-0 left-0 w-9 h-9"
                        style={{ borderTop: "3px solid #86efac", borderLeft: "3px solid #86efac", borderRadius: "4px 0 0 0" }} />
                      {/* TR */}
                      <div className="absolute top-0 right-0 w-9 h-9"
                        style={{ borderTop: "3px solid #86efac", borderRight: "3px solid #86efac", borderRadius: "0 4px 0 0" }} />
                      {/* BL */}
                      <div className="absolute bottom-0 left-0 w-9 h-9"
                        style={{ borderBottom: "3px solid #86efac", borderLeft: "3px solid #86efac", borderRadius: "0 0 0 4px" }} />
                      {/* BR */}
                      <div className="absolute bottom-0 right-0 w-9 h-9"
                        style={{ borderBottom: "3px solid #86efac", borderRight: "3px solid #86efac", borderRadius: "0 0 4px 0" }} />

                      {/* Scan line */}
                      {scannerActive && (
                        <motion.div
                          initial={{ top: "4px" }}
                          animate={{ top: "calc(100% - 4px)" }}
                          transition={{ duration: 1.6, ease: "linear", repeat: Infinity, repeatType: "reverse" }}
                          className="absolute left-1 right-1 h-0.5"
                          style={{ backgroundColor: "#86efac", boxShadow: "0 0 10px 2px rgba(134,239,172,0.6)" }}
                        />
                      )}

                      {/* Detected flash */}
                      {detectedCode && (
                        <motion.div
                          initial={{ opacity: 0, scale: 0.9 }}
                          animate={{ opacity: 1, scale: 1 }}
                          className="absolute inset-0 flex items-center justify-center rounded-lg"
                          style={{ backgroundColor: "rgba(0,104,56,0.55)" }}
                        >
                          <CheckCircle2 className="w-16 h-16" style={{ color: "#86efac" }} />
                        </motion.div>
                      )}
                    </div>
                  </div>

                  {/* Status label */}
                  <div
                    className="absolute bottom-3 left-0 right-0 text-center"
                  >
                    <span
                      className="px-3 py-1 rounded-full"
                      style={{
                        backgroundColor: "rgba(0,0,0,0.5)",
                        color: detectedCode ? "#86efac" : "rgba(255,255,255,0.7)",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      {detectedCode
                        ? `Detected: ${detectedCode}`
                        : "Point at student's QR code"}
                    </span>
                  </div>

                  {/* Flip camera */}
                  <button
                    onClick={flipCamera}
                    className="absolute top-3 right-3 p-2 rounded-full"
                    style={{ backgroundColor: "rgba(0,0,0,0.45)" }}
                    title="Flip camera"
                  >
                    <FlipHorizontal className="w-4 h-4 text-white" />
                  </button>
                </>
              )}
            </div>

            {/* Camera controls */}
            <div className="p-4 space-y-2">
              {cameraState === "idle" || cameraState === "denied" || cameraState === "error" ? (
                <button
                  onClick={() => startCamera(facingMode)}
                  className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                  style={{ backgroundColor: "#006838", color: "white", fontSize: "1rem", fontWeight: 700 }}
                >
                  <Camera className="w-4 h-4" />
                  Start Camera
                </button>
              ) : cameraState === "requesting" ? (
                <button
                  disabled
                  className="w-full py-3.5 rounded-xl"
                  style={{ backgroundColor: "#EDE8E1", color: "#7A6B5A", fontSize: "1rem", fontWeight: 600 }}
                >
                  Waiting for permission…
                </button>
              ) : (
                <button
                  onClick={stopCamera}
                  className="w-full py-3.5 rounded-xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
                  style={{ backgroundColor: "#EDE8E1", color: "#7A6B5A", fontSize: "1rem", fontWeight: 600 }}
                >
                  <CameraOff className="w-4 h-4" />
                  Stop Camera
                </button>
              )}
              <p className="text-center" style={{ fontSize: "0.72rem", color: "#7A6B5A" }}>
                {cameraState === "active"
                  ? "Scanning automatically - hold steady over the QR code"
                  : "Camera access is required for QR scanning"}
              </p>
            </div>
          </motion.div>
        )}

        {/* ── Code entry mode ── */}
        {mode === "code" && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-2xl p-6 shadow-sm"
            style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.1)" }}
          >
            <p className="text-center mb-4" style={{ fontSize: "0.8rem", fontWeight: 600, color: "#7A6B5A" }}>
              Enter student's 6-digit code
            </p>
            <input
              type="text"
              value={code}
              onChange={(e) => {
                setCode(e.target.value.toUpperCase().slice(0, 6));
                setResult(null);
              }}
              placeholder="XXXXXX"
              maxLength={6}
              autoFocus
              className="w-full text-center rounded-xl px-4 py-4 outline-none"
              style={{
                backgroundColor: "#F5F1EB",
                fontSize: "2rem",
                fontWeight: 900,
                letterSpacing: "0.2em",
                fontFamily: "monospace",
                color: "#006838",
              }}
              onKeyDown={(e) => { if (e.key === "Enter") handleCheck(code); }}
            />
            <button
              onClick={() => handleCheck(code)}
              disabled={code.length < 6}
              className="w-full mt-4 py-3.5 rounded-xl transition-all active:scale-[0.98]"
              style={{
                backgroundColor: code.length < 6 ? "#EDE8E1" : "#006838",
                color: code.length < 6 ? "#7A6B5A" : "white",
                fontSize: "1rem",
                fontWeight: 700,
                cursor: code.length < 6 ? "default" : "pointer",
              }}
            >
              Verify & Redeem
            </button>
          </motion.div>
        )}

        {/* ── Result feedback ── */}
        <AnimatePresence>
          {result === "success" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-xl p-4 flex items-center gap-3"
              style={{ backgroundColor: "#E8F5EE", border: "1px solid rgba(0,104,56,0.3)" }}
            >
              <CheckCircle2 className="w-8 h-8 shrink-0" style={{ color: "#006838" }} />
              <div>
                <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#004D28" }}>
                  Pickup confirmed!
                </p>
                <p style={{ fontSize: "0.8rem", color: "#006838" }}>
                  Code{" "}
                  <span style={{ fontFamily: "monospace", fontWeight: 700 }}>{redeemedCode}</span>{" "}
                  verified. Hand the box to the student.
                </p>
              </div>
            </motion.div>
          )}

          {result === "expired" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-xl p-4 flex items-center gap-3"
              style={{ backgroundColor: "#FEF3C7", border: "1px solid #FCD34D" }}
            >
              <Clock className="w-8 h-8 shrink-0" style={{ color: "#D97706" }} />
              <div>
                <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#92400E" }}>
                  Code expired
                </p>
                <p style={{ fontSize: "0.8rem", color: "#B45309" }}>
                  This pickup window has ended or the reservation was cancelled.
                </p>
              </div>
            </motion.div>
          )}

          {result === "invalid" && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="rounded-xl p-4 flex items-center gap-3"
              style={{ backgroundColor: "#FEE2E2", border: "1px solid #FECACA" }}
            >
              <XCircle className="w-8 h-8 shrink-0" style={{ color: "#C0392B" }} />
              <div>
                <p style={{ fontSize: "0.875rem", fontWeight: 700, color: "#7F1D1D" }}>
                  Code not found
                </p>
                <p style={{ fontSize: "0.8rem", color: "#991B1B" }}>
                  No active reservation matches this code. Check for typos.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Support fallback */}
        {(result === "expired" || result === "invalid") && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="rounded-xl p-3 flex items-start gap-2"
            style={{ backgroundColor: "#F5F1EB" }}
          >
            <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#8B6F47" }} />
            <p style={{ fontSize: "0.75rem", color: "#7A6B5A" }}>
              <strong>Support fallback:</strong> If the student insists they have a valid reservation,
              check the dashboard for their reservation details or contact EcoPlate support.
            </p>
          </motion.div>
        )}

        {/* Today's redemptions */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p style={{ fontSize: "0.8rem", fontWeight: 600, color: "#7A6B5A" }}>Pickups today</p>
            {recentRedemptions.length > 0 && (
              <span
                className="px-2 py-0.5 rounded-full"
                style={{ backgroundColor: "#E8F5EE", color: "#006838", fontSize: "0.7rem", fontWeight: 700 }}
              >
                {recentRedemptions.length} confirmed
              </span>
            )}
          </div>

          {recentRedemptions.length === 0 ? (
            <div
              className="rounded-xl p-6 text-center"
              style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.1)" }}
            >
              <ScanLine className="w-8 h-8 mx-auto mb-2" style={{ color: "rgba(0,104,56,0.25)" }} />
              <p style={{ fontSize: "0.875rem", color: "#7A6B5A" }}>No pickups yet today</p>
              <p className="mt-1" style={{ fontSize: "0.78rem", color: "#7A6B5A" }}>
                Confirmed pickups will appear here. Resets at midnight.
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              <AnimatePresence>
                {recentRedemptions.map((entry, i) => (
                  <motion.div
                    key={`${entry.code}-${i}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.05 }}
                    className="rounded-xl px-4 py-3 flex items-center justify-between shadow-sm"
                    style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.1)" }}
                  >
                    <div>
                      <span
                        style={{
                          fontFamily: "monospace",
                          fontWeight: 700,
                          fontSize: "0.9375rem",
                          color: "#006838",
                          letterSpacing: "0.05em",
                        }}
                      >
                        {entry.code}
                      </span>
                      {entry.location && (
                        <p style={{ fontSize: "0.7rem", color: "#7A6B5A" }}>{entry.location}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" style={{ color: "#006838" }} />
                      <span style={{ fontSize: "0.75rem", color: "#7A6B5A" }}>{entry.time}</span>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}