import { motion } from "motion/react";
import { useState } from "react";
import {
  ArrowLeft,
  Package,
  MapPin,
  Clock,
  DollarSign,
  Sparkles,
  CheckCircle2,
  AlertTriangle,
  ArrowUpRight,
} from "lucide-react";
import { LocationCap } from "./ecoplate-types";

interface AdminCreateDropProps {
  onBack: () => void;
  onSubmit: (drop: {
    location: string;
    boxes: number;
    windowStart: string;
    windowEnd: string;
    price: string;
    description: string;
  }) => void;
  locationCaps: LocationCap[];
}

export function AdminCreateDrop({ onBack, onSubmit, locationCaps }: AdminCreateDropProps) {
  const [location, setLocation] = useState("North Dining Hall");
  const [boxes, setBoxes] = useState("30");
  const [windowStart, setWindowStart] = useState("20:30");
  const [windowEnd, setWindowEnd] = useState("22:00");
  const [price, setPrice] = useState("3-5");
  const [description, setDescription] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const currentCap = locationCaps.find((c) => c.location === location);
  const capLimit = currentCap?.currentCap ?? 30;
  const weeksAbove85 = currentCap?.consecutiveWeeksAbove85 ?? 0;
  const canIncrease = weeksAbove85 >= 2;

  // EcoPlate Forecast v0 suggestion
  const forecastSuggestion = Math.min(capLimit, Math.round(capLimit * 0.85 + 2));
  const forecastNote = `Based on this week's avg pickup rate (85%), we suggest ${forecastSuggestion} boxes for ${location}.`;

  const handleSubmit = () => {
    const boxCount = Math.min(parseInt(boxes) || 1, capLimit);
    setSubmitted(true);
    setTimeout(() => {
      onSubmit({
        location,
        boxes: boxCount,
        windowStart,
        windowEnd,
        price,
        description,
      });
    }, 1500);
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-[1.375rem] mb-2" style={{ fontWeight: 700 }}>
            Drop is live!
          </h2>
          <p className="text-muted-foreground text-[0.875rem]">
            {Math.min(parseInt(boxes) || 1, capLimit)} Rescue Boxes at {location}
          </p>
          <p className="text-muted-foreground text-[0.8rem] mt-1">
            Students can start reserving now
          </p>
        </motion.div>
      </div>
    );
  }

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
          Create Tonight's Drop
        </h1>
        <p className="text-muted-foreground text-[0.875rem] mt-1">
          Set up Rescue Boxes for students
        </p>
      </div>

      <div className="flex-1 px-5 py-4 space-y-4 overflow-y-auto">
        {/* Forecast suggestion */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4"
        >
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-blue-600" />
            <span className="text-[0.8rem] text-blue-800" style={{ fontWeight: 600 }}>
              EcoPlate Forecast v0
            </span>
          </div>
          <p className="text-[0.8rem] text-blue-700 mb-2">{forecastNote}</p>
          <button
            onClick={() => setBoxes(forecastSuggestion.toString())}
            className="bg-blue-600 text-white text-[0.75rem] px-3 py-1.5 rounded-lg active:scale-[0.98] transition-transform"
            style={{ fontWeight: 600 }}
          >
            Use suggestion: {forecastSuggestion} boxes
          </button>
        </motion.div>

        {/* Cap status */}
        {currentCap && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className={`rounded-xl p-3 flex items-start gap-2 ${
              canIncrease
                ? "bg-green-50 border border-green-200"
                : "bg-amber-50 border border-amber-200"
            }`}
          >
            {canIncrease ? (
              <ArrowUpRight className="w-4 h-4 text-green-600 mt-0.5 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
            )}
            <div>
              <p
                className={`text-[0.8rem] ${canIncrease ? "text-green-800" : "text-amber-800"}`}
                style={{ fontWeight: 600 }}
              >
                {canIncrease
                  ? `Cap eligible for increase! Currently ${capLimit} boxes/day.`
                  : `Daily cap: ${capLimit} boxes/day for ${location}`}
              </p>
              <p className={`text-[0.7rem] ${canIncrease ? "text-green-600" : "text-amber-600"}`}>
                {canIncrease
                  ? "Pickup rate has been above 85% for 2+ weeks. You can increase the cap by 10."
                  : `${weeksAbove85}/2 consecutive weeks above 85% needed to increase cap.`}
              </p>
            </div>
          </motion.div>
        )}

        {/* Form fields */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          {/* Location */}
          <div className="bg-card rounded-xl border border-border p-4">
            <label className="flex items-center gap-2 text-[0.8rem] text-muted-foreground mb-2">
              <MapPin className="w-3.5 h-3.5" />
              Location
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full bg-input-background rounded-lg px-3 py-2.5 text-[0.875rem] border-none outline-none"
            >
              {locationCaps.map((cap) => (
                <option key={cap.location} value={cap.location}>
                  {cap.location} (cap: {cap.currentCap})
                </option>
              ))}
            </select>
          </div>

          {/* Number of boxes */}
          <div className="bg-card rounded-xl border border-border p-4">
            <label className="flex items-center gap-2 text-[0.8rem] text-muted-foreground mb-2">
              <Package className="w-3.5 h-3.5" />
              Number of Rescue Boxes
            </label>
            <div className="flex items-center gap-3">
              <button
                onClick={() =>
                  setBoxes((prev) => Math.max(1, parseInt(prev) - 5).toString())
                }
                className="w-10 h-10 bg-muted rounded-lg text-[1.25rem]"
              >
                -
              </button>
              <input
                type="number"
                value={boxes}
                onChange={(e) => {
                  const val = Math.min(parseInt(e.target.value) || 0, capLimit);
                  setBoxes(val.toString());
                }}
                className="flex-1 text-center bg-input-background rounded-lg px-3 py-2.5 text-[1.25rem] border-none outline-none"
                style={{ fontWeight: 700 }}
              />
              <button
                onClick={() =>
                  setBoxes((prev) => Math.min(capLimit, parseInt(prev) + 5).toString())
                }
                className="w-10 h-10 bg-muted rounded-lg text-[1.25rem]"
              >
                +
              </button>
            </div>
            <div className="flex items-center justify-between mt-2">
              <p className="text-[0.7rem] text-muted-foreground">
                Max: {capLimit} boxes/day for this location
              </p>
              {parseInt(boxes) >= capLimit && (
                <p className="text-[0.7rem] text-amber-600" style={{ fontWeight: 500 }}>
                  At cap limit
                </p>
              )}
            </div>
          </div>

          {/* Pickup window */}
          <div className="bg-card rounded-xl border border-border p-4">
            <label className="flex items-center gap-2 text-[0.8rem] text-muted-foreground mb-2">
              <Clock className="w-3.5 h-3.5" />
              Pickup Window (90 min)
            </label>
            <div className="flex items-center gap-2">
              <input
                type="time"
                value={windowStart}
                onChange={(e) => setWindowStart(e.target.value)}
                className="flex-1 bg-input-background rounded-lg px-3 py-2.5 text-[0.875rem] border-none outline-none"
              />
              <span className="text-muted-foreground">to</span>
              <input
                type="time"
                value={windowEnd}
                onChange={(e) => setWindowEnd(e.target.value)}
                className="flex-1 bg-input-background rounded-lg px-3 py-2.5 text-[0.875rem] border-none outline-none"
              />
            </div>
          </div>

          {/* Price */}
          <div className="bg-card rounded-xl border border-border p-4">
            <label className="flex items-center gap-2 text-[0.8rem] text-muted-foreground mb-2">
              <DollarSign className="w-3.5 h-3.5" />
              Price Range
            </label>
            <select
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full bg-input-background rounded-lg px-3 py-2.5 text-[0.875rem] border-none outline-none"
            >
              <option value="3-5">$3 - $5 (recommended)</option>
              <option value="2-4">$2 - $4</option>
              <option value="4-6">$4 - $6</option>
            </select>
          </div>

          {/* Description */}
          <div className="bg-card rounded-xl border border-border p-4">
            <label className="text-[0.8rem] text-muted-foreground mb-2 block">
              What's in tonight's box? (optional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="e.g., Pasta bar leftovers, grilled chicken, roasted veggies"
              rows={3}
              className="w-full bg-input-background rounded-lg px-3 py-2.5 text-[0.875rem] border-none outline-none resize-none"
            />
          </div>
        </motion.div>
      </div>

      {/* Submit */}
      <div className="px-5 pb-8 pt-4">
        <button
          onClick={handleSubmit}
          className="w-full bg-primary text-primary-foreground py-4 rounded-2xl text-[1.125rem] shadow-lg shadow-primary/25 active:scale-[0.98] transition-transform"
          style={{ fontWeight: 700 }}
        >
          Post Drop
        </button>
      </div>
    </div>
  );
}
