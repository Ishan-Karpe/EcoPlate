import { motion, AnimatePresence } from "motion/react";
import { useState, useRef, useCallback, useEffect } from "react";
import {
  ArrowLeft,
  Package,
  MapPin,
  Clock,
  DollarSign,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
  TrendingUp,
  AlertCircle,
  Camera,
  Sparkles,
  X,
  ImageIcon,
  RotateCcw,
  SwitchCamera,
} from "lucide-react";
import { LocationCap } from "./ecoplate-types";
import * as api from "../api";

interface AdminCreateDropProps {
  onBack: () => void;
  onSubmit: (drop: {
    location: "Brandywine" | "Anteatery";
    boxes: number;
    windowStart: string;
    windowEnd: string;
    priceMin: number;
    priceMax: number;
    description: string;
    locationDetail: string;
    photoDataUrl?: string;
  }) => void;
  locationCaps: LocationCap[];
}

const LOCATIONS: { value: "Brandywine" | "Anteatery"; detail: string }[] = [
  { value: "Brandywine", detail: "Side entrance, Window B" },
  { value: "Anteatery", detail: "Main lobby, counter 3" },
];

export function AdminCreateDrop({ onBack, onSubmit, locationCaps }: AdminCreateDropProps) {
  const [location, setLocation] = useState<"Brandywine" | "Anteatery">("Anteatery");
  const [boxes, setBoxes] = useState("30");
  const [windowStart, setWindowStart] = useState("18:00");
  const [windowEnd, setWindowEnd] = useState("23:00");
  const [priceMin, setPriceMin] = useState("3");
  const [priceMax, setPriceMax] = useState("5");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<{
    boxes?: string;
    time?: string;
    priceMin?: string;
    priceMax?: string;
  }>({});

  // Photo + AI state
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoBase64, setPhotoBase64] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiApplied, setAiApplied] = useState(false);
  const [aiError, setAiError] = useState<string | null>(null);
  const [aiTags, setAiTags] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Live camera state
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [facingMode, setFacingMode] = useState<"environment" | "user">("environment");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const currentCap = locationCaps.find((c) => c.location === location);
  const capLimit = currentCap?.currentCap ?? 30;
  const weeksAbove85 = currentCap?.consecutiveWeeksAbove85 ?? 0;
  const canIncrease = weeksAbove85 >= 2;
  const locationDetail = LOCATIONS.find((l) => l.value === location)?.detail ?? "";

  // --- Live camera helpers ---
  const stopCamera = useCallback(() => {
    const stream = streamRef.current;
    if (stream) {
      stream.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
  }, []);

  const startCamera = useCallback(async () => {
    setCameraError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode, width: { ideal: 1280 }, height: { ideal: 960 } },
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      streamRef.current = stream;
    } catch (err) {
      console.error("Camera access error:", err);
      setCameraError(
        err instanceof DOMException && err.name === "NotAllowedError"
          ? "Camera permission denied. Please allow camera access and try again."
          : "Could not access camera. Make sure no other app is using it."
      );
    }
  }, [facingMode]);

  // Start / stop the camera stream when the modal opens or facing mode changes
  useEffect(() => {
    if (cameraOpen) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [cameraOpen, facingMode, startCamera, stopCamera]);

  const handleCapture = useCallback(() => {
    const video = videoRef.current;
    if (!video || !video.videoWidth) return;
    const canvas = document.createElement("canvas");
    const MAX_DIM = 800;
    let w = video.videoWidth;
    let h = video.videoHeight;
    if (w > MAX_DIM || h > MAX_DIM) {
      if (w > h) { h = Math.round((h * MAX_DIM) / w); w = MAX_DIM; }
      else { w = Math.round((w * MAX_DIM) / h); h = MAX_DIM; }
    }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    ctx?.drawImage(video, 0, 0, w, h);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setPhotoPreview(dataUrl);
    setPhotoBase64(dataUrl);
    setAiApplied(false);
    setAiError(null);
    setAiTags([]);
    setCameraOpen(false);
  }, []);

  const handleFileSelect = useCallback((file: File) => {
    if (!file.type.startsWith("image/")) return;

    // Resize image to reduce base64 size for API
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const MAX_DIM = 800;
        let w = img.width;
        let h = img.height;
        if (w > MAX_DIM || h > MAX_DIM) {
          if (w > h) {
            h = Math.round((h * MAX_DIM) / w);
            w = MAX_DIM;
          } else {
            w = Math.round((w * MAX_DIM) / h);
            h = MAX_DIM;
          }
        }
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx?.drawImage(img, 0, 0, w, h);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setPhotoPreview(dataUrl);
        setPhotoBase64(dataUrl);
        setAiApplied(false);
        setAiError(null);
        setAiTags([]);
      };
      img.src = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }, []);

  const handleAnalyze = useCallback(async () => {
    if (!photoBase64) return;
    setAnalyzing(true);
    setAiError(null);
    setAiApplied(false);

    try {
      const result = await api.analyzeFoodPhoto(photoBase64);
      // Auto-fill fields with animation delay
      if (result.description) {
        setDescription(result.description);
      }
      if (result.suggestedBoxes) {
        const capped = Math.min(result.suggestedBoxes, capLimit);
        setBoxes(capped.toString());
      }
      if (result.suggestedPriceMin) {
        setPriceMin(result.suggestedPriceMin.toString());
      }
      if (result.suggestedPriceMax) {
        setPriceMax(result.suggestedPriceMax.toString());
      }
      if (result.tags && result.tags.length > 0) {
        setAiTags(result.tags);
      }
      setAiApplied(true);
      setErrors({});
    } catch (err) {
      console.error("AI analysis failed:", err);
      setAiError(err instanceof Error ? err.message : "Failed to analyze photo. Please try again.");
    } finally {
      setAnalyzing(false);
    }
  }, [photoBase64, capLimit]);

  const handleRemovePhoto = useCallback(() => {
    setPhotoPreview(null);
    setPhotoBase64(null);
    setAiApplied(false);
    setAiError(null);
    setAiTags([]);
  }, []);

  const validate = () => {
    const newErrors: typeof errors = {};

    const boxCount = parseInt(boxes);
    if (!boxes.trim() || isNaN(boxCount) || boxCount < 1) {
      newErrors.boxes = "Enter at least 1 box";
    } else if (!Number.isInteger(boxCount)) {
      newErrors.boxes = "Box count must be a whole number";
    } else if (boxCount > capLimit) {
      newErrors.boxes = `Maximum is ${capLimit} boxes for this location`;
    }

    if (!windowStart || !windowEnd) {
      newErrors.time = "Both start and end times are required";
    } else if (windowStart >= windowEnd) {
      newErrors.time = "End time must be after start time";
    }

    const min = parseFloat(priceMin);
    const max = parseFloat(priceMax);
    if (!priceMin.trim() || isNaN(min) || min < 1) {
      newErrors.priceMin = "Minimum price must be at least $1";
    } else if (min > 10) {
      newErrors.priceMin = "Maximum allowed price is $10";
    }
    if (!priceMax.trim() || isNaN(max) || max < 1) {
      newErrors.priceMax = "Maximum price must be at least $1";
    } else if (max > 10) {
      newErrors.priceMax = "Maximum allowed price is $10";
    } else if (!isNaN(min) && max < min) {
      newErrors.priceMax = "Max must be \u2265 min price";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate() || submitted) return;
    const boxCount = Math.min(parseInt(boxes) || 1, capLimit);
    setSubmitted(true);
    setTimeout(() => {
      onSubmit({
        location,
        boxes: boxCount,
        windowStart,
        windowEnd,
        priceMin: parseFloat(priceMin) || 3,
        priceMax: parseFloat(priceMax) || 5,
        description,
        locationDetail,
        photoDataUrl: photoPreview ?? undefined,
      });
    }, 1500);
  };

  if (submitted) {
    return (
      <div
        className="min-h-screen flex flex-col items-center justify-center px-5"
        style={{ backgroundColor: "#F9F6F1" }}
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="text-center"
        >
          <div
            className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ backgroundColor: "#E8F5EE" }}
          >
            <CheckCircle2 className="w-10 h-10" style={{ color: "#006838" }} />
          </div>
          <h2 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#1C2B1C" }}>
            Drop is live!
          </h2>
          <p className="mt-2" style={{ fontSize: "0.875rem", color: "#7A6B5A" }}>
            {Math.min(parseInt(boxes) || 1, capLimit)} Rescue Boxes at {location}
          </p>
          <p className="mt-1" style={{ fontSize: "0.8rem", color: "#7A6B5A" }}>
            Students can start reserving now
          </p>
        </motion.div>
      </div>
    );
  }

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
          Create Tonight's Drop
        </h1>
        <p className="mt-1" style={{ fontSize: "0.875rem", color: "#7A6B5A" }}>
          Set up Rescue Boxes for students
        </p>
      </div>

      <div className="flex-1 px-5 space-y-4 overflow-y-auto pb-4">
        {/* Cap status */}
        {currentCap && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl p-3 flex items-start gap-2"
            style={{
              backgroundColor: canIncrease ? "#E8F5EE" : "#FEF3C7",
              border: canIncrease ? "1px solid rgba(0,104,56,0.3)" : "1px solid #FCD34D",
            }}
          >
            {canIncrease ? (
              <ArrowUpRight className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#006838" }} />
            ) : (
              <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#D97706" }} />
            )}
            <div>
              <p
                style={{
                  fontSize: "0.8rem",
                  fontWeight: 600,
                  color: canIncrease ? "#004D28" : "#92400E",
                }}
              >
                {canIncrease
                  ? `Cap eligible for increase! Currently ${capLimit} boxes/day.`
                  : `Daily cap: ${capLimit} boxes/day for ${location}`}
              </p>
              <p style={{ fontSize: "0.7rem", color: canIncrease ? "#006838" : "#B45309" }}>
                {canIncrease
                  ? "Pickup rate above 85% for 2+ weeks. You can increase the cap by 10."
                  : `${weeksAbove85}/2 weeks above 85% needed to increase cap.`}
              </p>
            </div>
          </motion.div>
        )}

        {/* ─── Photo Capture + AI Auto-Fill ──────────────────────────────── */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.02 }}
          className="rounded-xl p-4 shadow-sm"
          style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.1)" }}
        >
          <label
            className="flex items-center gap-2 mb-3"
            style={{ fontSize: "0.8rem", color: "#7A6B5A" }}
          >
            <Camera className="w-3.5 h-3.5" />
            Photo &amp; AI Auto-Fill
            <span
              className="ml-auto px-2 py-0.5 rounded-full"
              style={{
                fontSize: "0.6rem",
                fontWeight: 700,
                backgroundColor: "#E8F5EE",
                color: "#006838",
                letterSpacing: "0.04em",
              }}
            >
              NEW
            </span>
          </label>

          {!photoPreview ? (
            <div className="space-y-2">
              <p style={{ fontSize: "0.75rem", color: "#7A6B5A", lineHeight: 1.5 }}>
                Snap a photo of tonight's food and let AI auto-fill the description, box count, and pricing.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setCameraOpen(true)}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl active:scale-[0.97] transition-transform"
                  style={{
                    backgroundColor: "#006838",
                    color: "white",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                  }}
                >
                  <Camera className="w-4 h-4" />
                  Take Photo
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center justify-center gap-2 py-3 rounded-xl active:scale-[0.97] transition-transform"
                  style={{
                    backgroundColor: "#F5F1EB",
                    color: "#4A3728",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                  }}
                >
                  <ImageIcon className="w-4 h-4" />
                  Upload
                </button>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileSelect(file);
                }}
              />
            </div>
          ) : (
            <div className="space-y-3">
              {/* Photo preview */}
              <div className="relative rounded-xl overflow-hidden" style={{ height: 180 }}>
                <img
                  src={photoPreview}
                  alt="Food photo"
                  className="w-full h-full object-cover"
                />
                <button
                  onClick={handleRemovePhoto}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ backgroundColor: "rgba(0,0,0,0.5)" }}
                >
                  <X className="w-3.5 h-3.5 text-white" />
                </button>
                {aiApplied && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute bottom-2 left-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg"
                    style={{ backgroundColor: "rgba(0,104,56,0.9)" }}
                  >
                    <CheckCircle2 className="w-3 h-3 text-white" />
                    <span style={{ fontSize: "0.68rem", color: "white", fontWeight: 600 }}>
                      AI analyzed
                    </span>
                  </motion.div>
                )}
              </div>

              {/* AI tags */}
              <AnimatePresence>
                {aiTags.length > 0 && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex flex-wrap gap-1.5"
                  >
                    {aiTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2.5 py-1 rounded-full"
                        style={{
                          fontSize: "0.68rem",
                          fontWeight: 600,
                          backgroundColor: "#E8F5EE",
                          color: "#006838",
                        }}
                      >
                        {tag}
                      </span>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Analyze button */}
              {!aiApplied && (
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="w-full py-3 rounded-xl flex items-center justify-center gap-2 active:scale-[0.97] transition-all"
                  style={{
                    background: analyzing
                      ? "linear-gradient(135deg, #5A9E78, #006838)"
                      : "linear-gradient(135deg, #006838, #004D28)",
                    color: "white",
                    fontSize: "0.875rem",
                    fontWeight: 700,
                    boxShadow: "0 4px 16px rgba(0,104,56,0.25)",
                    opacity: analyzing ? 0.85 : 1,
                  }}
                >
                  {analyzing ? (
                    <>
                      <svg className="animate-spin w-4 h-4" viewBox="0 0 24 24" fill="none">
                        <circle
                          className="opacity-25"
                          cx="12"
                          cy="12"
                          r="10"
                          stroke="currentColor"
                          strokeWidth="4"
                        />
                        <path
                          className="opacity-75"
                          fill="currentColor"
                          d="M4 12a8 8 0 018-8v8H4z"
                        />
                      </svg>
                      Analyzing food...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      Analyze &amp; Auto-Fill with AI
                    </>
                  )}
                </button>
              )}

              {/* Re-analyze button after applied */}
              {aiApplied && (
                <button
                  onClick={handleAnalyze}
                  disabled={analyzing}
                  className="w-full py-2.5 rounded-xl flex items-center justify-center gap-2 active:scale-[0.97] transition-all"
                  style={{
                    backgroundColor: "#F5F1EB",
                    color: "#7A6B5A",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                  }}
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  Re-analyze
                </button>
              )}

              {/* AI error */}
              <AnimatePresence>
                {aiError && (
                  <motion.div
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="flex items-start gap-2 p-3 rounded-xl"
                    style={{ backgroundColor: "#FEF2F2", border: "1px solid #FECACA" }}
                  >
                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#C0392B" }} />
                    <p style={{ fontSize: "0.75rem", color: "#C0392B", lineHeight: 1.4 }}>
                      {aiError}
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </motion.div>

        {/* Form fields */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="space-y-3"
        >
          {/* Location */}
          <div
            className="rounded-xl p-4 shadow-sm"
            style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.1)" }}
          >
            <label
              className="flex items-center gap-2 mb-2"
              style={{ fontSize: "0.8rem", color: "#7A6B5A" }}
            >
              <MapPin className="w-3.5 h-3.5" />
              Location
            </label>
            <div className="grid grid-cols-2 gap-2">
              {LOCATIONS.map((loc) => (
                <button
                  key={loc.value}
                  onClick={() => setLocation(loc.value)}
                  className="py-3 px-4 rounded-xl transition-all active:scale-[0.97]"
                  style={{
                    backgroundColor: location === loc.value ? "#006838" : "#F5F1EB",
                    color: location === loc.value ? "white" : "#4A3728",
                    fontSize: "0.875rem",
                    fontWeight: 600,
                  }}
                >
                  {loc.value}
                </button>
              ))}
            </div>
            <p className="mt-2" style={{ fontSize: "0.72rem", color: "#7A6B5A" }}>
              {locationDetail}
            </p>
          </div>

          {/* Number of boxes */}
          <div
            className="rounded-xl p-4 shadow-sm"
            style={{
              backgroundColor: "white",
              border: `1px solid ${errors.boxes ? "#FECACA" : "rgba(0,104,56,0.1)"}`,
            }}
          >
            <label
              className="flex items-center gap-2 mb-2"
              style={{ fontSize: "0.8rem", color: errors.boxes ? "#C0392B" : "#7A6B5A" }}
            >
              <Package className="w-3.5 h-3.5" />
              Number of Rescue Boxes
              {aiApplied && (
                <Sparkles className="w-3 h-3 ml-1" style={{ color: "#006838" }} />
              )}
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  const current = parseInt(boxes) || 1;
                  setBoxes(Math.max(1, current - 5).toString());
                  setErrors((e) => ({ ...e, boxes: undefined }));
                }}
                className="w-10 h-10 rounded-lg text-[1.25rem] active:scale-[0.9] transition-transform"
                style={{ backgroundColor: "#F5F1EB", color: "#4A3728" }}
              >
                -
              </button>
              <input
                type="number"
                value={boxes}
                onChange={(e) => {
                  const raw = e.target.value;
                  if (raw === "" || raw === "-") { setBoxes(""); return; }
                  const val = Math.max(0, Math.min(parseInt(raw) || 0, capLimit));
                  setBoxes(val.toString());
                  setErrors((err) => ({ ...err, boxes: undefined }));
                }}
                className="flex-1 text-center rounded-lg px-3 py-2.5 outline-none"
                style={{
                  backgroundColor: "#F5F1EB",
                  fontSize: "1.25rem",
                  fontWeight: 700,
                  color: "#1C2B1C",
                }}
              />
              <button
                onClick={() => {
                  const current = parseInt(boxes) || 0;
                  setBoxes(Math.min(capLimit, current + 5).toString());
                  setErrors((e) => ({ ...e, boxes: undefined }));
                }}
                className="w-10 h-10 rounded-lg text-[1.25rem] active:scale-[0.9] transition-transform"
                style={{ backgroundColor: "#F5F1EB", color: "#4A3728" }}
              >
                +
              </button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p style={{ fontSize: "0.7rem", color: "#7A6B5A" }}>
                Max: {capLimit} boxes/day
              </p>
              {parseInt(boxes) >= capLimit && (
                <p style={{ fontSize: "0.7rem", fontWeight: 500, color: "#D97706" }}>At cap</p>
              )}
            </div>
            {errors.boxes && (
              <div className="flex items-center gap-1.5 mt-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" style={{ color: "#C0392B" }} />
                <p style={{ fontSize: "0.72rem", color: "#C0392B" }}>{errors.boxes}</p>
              </div>
            )}
          </div>

          {/* Pickup window */}
          <div
            className="rounded-xl p-4 shadow-sm"
            style={{
              backgroundColor: "white",
              border: `1px solid ${errors.time ? "#FECACA" : "rgba(0,104,56,0.1)"}`,
            }}
          >
            <label
              className="flex items-center gap-2 mb-2"
              style={{ fontSize: "0.8rem", color: errors.time ? "#C0392B" : "#7A6B5A" }}
            >
              <Clock className="w-3.5 h-3.5" />
              Pickup Window
            </label>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={windowStart}
                onChange={(e) => {
                  setWindowStart(e.target.value);
                  setErrors((err) => ({ ...err, time: undefined }));
                }}
                className="flex-1 rounded-lg px-3 py-2.5 outline-none"
                style={{
                  backgroundColor: "#F5F1EB",
                  fontSize: "0.875rem",
                  color: "#1C2B1C",
                  border: errors.time ? "1px solid #FECACA" : "none",
                }}
              />
              <span style={{ color: "#7A6B5A" }}>to</span>
              <input
                type="time"
                value={windowEnd}
                onChange={(e) => {
                  setWindowEnd(e.target.value);
                  setErrors((err) => ({ ...err, time: undefined }));
                }}
                className="flex-1 rounded-lg px-3 py-2.5 outline-none"
                style={{
                  backgroundColor: "#F5F1EB",
                  fontSize: "0.875rem",
                  color: "#1C2B1C",
                  border: errors.time ? "1px solid #FECACA" : "none",
                }}
              />
            </div>
            {errors.time && (
              <div className="flex items-center gap-1.5 mt-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" style={{ color: "#C0392B" }} />
                <p style={{ fontSize: "0.72rem", color: "#C0392B" }}>{errors.time}</p>
              </div>
            )}
          </div>

          {/* Price */}
          <div
            className="rounded-xl p-4 shadow-sm"
            style={{
              backgroundColor: "white",
              border: `1px solid ${errors.priceMin || errors.priceMax ? "#FECACA" : "rgba(0,104,56,0.1)"}`,
            }}
          >
            <label
              className="flex items-center gap-2 mb-2"
              style={{ fontSize: "0.8rem", color: errors.priceMin || errors.priceMax ? "#C0392B" : "#7A6B5A" }}
            >
              <DollarSign className="w-3.5 h-3.5" />
              Price Range
              {aiApplied && (
                <Sparkles className="w-3 h-3 ml-1" style={{ color: "#006838" }} />
              )}
            </label>
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <p style={{ fontSize: "0.7rem", color: "#7A6B5A", marginBottom: 4 }}>Min ($)</p>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={priceMin}
                  onChange={(e) => {
                    setPriceMin(e.target.value);
                    setErrors((err) => ({ ...err, priceMin: undefined, priceMax: undefined }));
                  }}
                  className="w-full text-center rounded-lg px-3 py-2.5 outline-none"
                  style={{
                    backgroundColor: "#F5F1EB",
                    fontSize: "1.125rem",
                    fontWeight: 700,
                    color: "#1C2B1C",
                    border: errors.priceMin ? "1.5px solid #FECACA" : "none",
                  }}
                />
              </div>
              <span style={{ color: "#7A6B5A", paddingTop: 20 }}>&ndash;</span>
              <div className="flex-1">
                <p style={{ fontSize: "0.7rem", color: "#7A6B5A", marginBottom: 4 }}>Max ($)</p>
                <input
                  type="number"
                  min="1"
                  max="10"
                  value={priceMax}
                  onChange={(e) => {
                    setPriceMax(e.target.value);
                    setErrors((err) => ({ ...err, priceMax: undefined }));
                  }}
                  className="w-full text-center rounded-lg px-3 py-2.5 outline-none"
                  style={{
                    backgroundColor: "#F5F1EB",
                    fontSize: "1.125rem",
                    fontWeight: 700,
                    color: "#1C2B1C",
                    border: errors.priceMax ? "1.5px solid #FECACA" : "none",
                  }}
                />
              </div>
            </div>
            {(errors.priceMin || errors.priceMax) && (
              <div className="flex items-center gap-1.5 mt-2">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" style={{ color: "#C0392B" }} />
                <p style={{ fontSize: "0.72rem", color: "#C0392B" }}>
                  {errors.priceMin || errors.priceMax}
                </p>
              </div>
            )}
            <p className="mt-2" style={{ fontSize: "0.7rem", color: "#7A6B5A" }}>
              Dynamic pricing: low supply + high demand skews toward max.
            </p>
          </div>

          {/* Description */}
          <div
            className="rounded-xl p-4 shadow-sm"
            style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.1)" }}
          >
            <label
              className="flex items-center gap-2 mb-2"
              style={{ fontSize: "0.8rem", color: "#7A6B5A" }}
            >
              What's in tonight's box? (optional)
              {aiApplied && (
                <Sparkles className="w-3 h-3 ml-1" style={{ color: "#006838" }} />
              )}
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Pasta bar: penne arrabbiata, grilled chicken, roasted vegetables"
              rows={3}
              className="w-full rounded-lg px-3 py-2.5 outline-none resize-none"
              style={{ backgroundColor: "#F5F1EB", fontSize: "0.875rem", color: "#1C2B1C" }}
            />
          </div>

          {/* Forecast placeholder */}
          <div
            className="rounded-xl p-5 text-center"
            style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.1)" }}
          >
            <TrendingUp
              className="w-8 h-8 mx-auto mb-3"
              style={{ color: "#006838", opacity: 0.4 }}
            />
            <p style={{ fontSize: "0.875rem", fontWeight: 500, color: "#7A6B5A" }}>
              After 30+ days of data, Forecast v1 (ML-assisted) will be available.
            </p>
          </div>
        </motion.div>
      </div>

      {/* Submit */}
      <div className="px-5 pb-8 pt-4">
        <button
          onClick={handleSubmit}
          className="w-full py-4 rounded-2xl active:scale-[0.98] transition-transform"
          style={{
            backgroundColor: "#006838",
            color: "white",
            fontSize: "1.125rem",
            fontWeight: 700,
            boxShadow: "0 4px 20px rgba(0,104,56,0.3)",
          }}
        >
          Post Drop
        </button>
      </div>

      {/* Live Camera Modal */}
      <AnimatePresence>
        {cameraOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex flex-col"
            style={{ backgroundColor: "#000" }}
          >
            {/* Camera top bar */}
            <div
              className="flex items-center justify-between px-5 pt-12 pb-3"
              style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
            >
              <button
                onClick={() => setCameraOpen(false)}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
              >
                <X className="w-5 h-5 text-white" />
              </button>
              <span style={{ fontSize: "0.9rem", fontWeight: 700, color: "white" }}>
                Take Photo
              </span>
              <button
                onClick={() => {
                  stopCamera();
                  setFacingMode((prev) => (prev === "environment" ? "user" : "environment"));
                }}
                className="w-9 h-9 rounded-full flex items-center justify-center"
                style={{ backgroundColor: "rgba(255,255,255,0.15)" }}
              >
                <SwitchCamera className="w-4.5 h-4.5 text-white" />
              </button>
            </div>

            {/* Video feed */}
            <div className="flex-1 relative overflow-hidden flex items-center justify-center">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full h-full object-cover"
                style={{ transform: facingMode === "user" ? "scaleX(-1)" : "none" }}
              />

              {/* Viewfinder corners */}
              <div className="absolute inset-8 pointer-events-none" style={{ border: "2px solid rgba(255,255,255,0.25)", borderRadius: 20 }} />

              {/* Error overlay */}
              <AnimatePresence>
                {cameraError && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="absolute bottom-6 left-4 right-4 flex items-start gap-2.5 p-4 rounded-2xl"
                    style={{ backgroundColor: "rgba(192,57,43,0.92)" }}
                  >
                    <AlertCircle className="w-5 h-5 text-white shrink-0 mt-0.5" />
                    <div>
                      <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "white" }}>
                        Camera unavailable
                      </p>
                      <p style={{ fontSize: "0.72rem", color: "rgba(255,255,255,0.8)", marginTop: 2 }}>
                        {cameraError}
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Capture bar */}
            <div
              className="flex items-center justify-center py-8 px-5"
              style={{ backgroundColor: "rgba(0,0,0,0.6)" }}
            >
              <button
                onClick={handleCapture}
                className="active:scale-[0.9] transition-transform"
              >
                <div
                  className="w-[72px] h-[72px] rounded-full flex items-center justify-center"
                  style={{ border: "4px solid white" }}
                >
                  <div
                    className="w-[58px] h-[58px] rounded-full"
                    style={{ backgroundColor: "white" }}
                  />
                </div>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}