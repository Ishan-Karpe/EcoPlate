import { motion } from "motion/react";
import { useState } from "react";
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
} from "lucide-react";
import { LocationCap } from "./ecoplate-types";

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

  const currentCap = locationCaps.find((c) => c.location === location);
  const capLimit = currentCap?.currentCap ?? 30;
  const weeksAbove85 = currentCap?.consecutiveWeeksAbove85 ?? 0;
  const canIncrease = weeksAbove85 >= 2;
  const locationDetail = LOCATIONS.find((l) => l.value === location)?.detail ?? "";

  const validate = () => {
    const newErrors: typeof errors = {};

    const boxCount = parseInt(boxes);
    if (isNaN(boxCount) || boxCount < 1) {
      newErrors.boxes = "Enter at least 1 box";
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
    if (isNaN(min) || min < 1) {
      newErrors.priceMin = "Minimum price must be at least $1";
    }
    if (isNaN(max) || max < 1) {
      newErrors.priceMax = "Maximum price must be at least $1";
    } else if (!isNaN(min) && max < min) {
      newErrors.priceMax = "Max must be ≥ min price";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = () => {
    if (!validate()) return;
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
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  setBoxes((prev) => Math.max(1, parseInt(prev) - 5).toString());
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
                  const val = Math.min(parseInt(e.target.value) || 0, capLimit);
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
                  setBoxes((prev) => Math.min(capLimit, parseInt(prev) + 5).toString());
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
              <span style={{ color: "#7A6B5A", paddingTop: 20 }}>–</span>
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
              className="block mb-2"
              style={{ fontSize: "0.8rem", color: "#7A6B5A" }}
            >
              What's in tonight's box? (optional)
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
    </div>
  );
}