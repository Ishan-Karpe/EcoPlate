import { motion } from "motion/react";
import { useState } from "react";
import { Star, Leaf, Heart } from "lucide-react";

interface PostRatingProps {
  onRate: (rating: number) => void;
  onSkip: () => void;
}

export function PostRating({ onRate, onSkip }: PostRatingProps) {
  const [selectedRating, setSelectedRating] = useState<number | null>(null);
  const [submitted, setSubmitted] = useState(false);

  const labels = ["", "Not great", "Okay", "Good", "Great", "Amazing!"];

  const handleRate = (rating: number) => {
    setSelectedRating(rating);
    setSubmitted(true);
    setTimeout(() => onRate(rating), 1200);
  };

  if (submitted && selectedRating) {
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
            <Heart className="w-10 h-10" style={{ color: "#006838" }} fill="#006838" />
          </div>
          <h2 style={{ fontSize: "1.375rem", fontWeight: 700, color: "#1C2B1C" }}>
            Thanks for the feedback!
          </h2>
          <p className="mt-2" style={{ fontSize: "0.875rem", color: "#7A6B5A" }}>
            You rated your Rescue Box {selectedRating}/5
          </p>
          <div className="flex justify-center gap-1 mt-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className="w-6 h-6"
                style={{ color: star <= selectedRating ? "#F59E0B" : "#E5E7EB" }}
                fill={star <= selectedRating ? "#F59E0B" : "none"}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ backgroundColor: "#F9F6F1" }}>
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pt-14 pb-4 text-center"
      >
        <div
          className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
          style={{ backgroundColor: "#E8F5EE" }}
        >
          <Leaf className="w-8 h-8" style={{ color: "#006838" }} />
        </div>
        <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#1C2B1C" }}>
          How was your Rescue Box?
        </h1>
        <p className="mt-1" style={{ fontSize: "0.875rem", color: "#7A6B5A" }}>
          Quick tap helps us make it better
        </p>
      </motion.div>

      <div className="flex-1 flex flex-col items-center justify-center px-5">
        {/* Star Rating */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="rounded-2xl p-8 w-full max-w-sm text-center shadow-sm"
          style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.1)" }}
        >
          <div className="flex justify-center gap-3 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <motion.button
                key={star}
                whileHover={{ scale: 1.2 }}
                whileTap={{ scale: 0.85 }}
                onClick={() => handleRate(star)}
                className="p-1"
              >
                <Star
                  className="w-10 h-10 transition-colors"
                  style={{
                    color: selectedRating && star <= selectedRating ? "#F59E0B" : "#E5E7EB",
                  }}
                  fill={selectedRating && star <= selectedRating ? "#F59E0B" : "none"}
                />
              </motion.button>
            ))}
          </div>
          {selectedRating && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              style={{ fontSize: "0.875rem", fontWeight: 500, color: "#006838" }}
            >
              {labels[selectedRating]}
            </motion.p>
          )}
        </motion.div>

        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={onSkip}
          className="mt-6"
          style={{ fontSize: "0.875rem", color: "#7A6B5A" }}
        >
          Skip for now
        </motion.button>
      </div>

      {/* Impact note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="px-5 pb-24"
      >
        <div className="rounded-xl p-3.5" style={{ backgroundColor: "#E8F5EE" }}>
          <div className="flex items-start gap-2">
            <Leaf className="w-4 h-4 mt-0.5 shrink-0" style={{ color: "#006838" }} />
            <p style={{ fontSize: "0.8rem", color: "#004D28" }}>
              You just saved approximately 1 lb of food from going to waste. That's roughly 1.5 kg
              of CO2 prevented. Every box counts.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}