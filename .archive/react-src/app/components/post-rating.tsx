import { motion } from "motion/react";
import { useState } from "react";
import { Star, PartyPopper } from "lucide-react";

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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200 }}
          className="text-center"
        >
          <div className="w-20 h-20 bg-accent rounded-full flex items-center justify-center mx-auto mb-4">
            <PartyPopper className="w-10 h-10 text-primary" />
          </div>
          <h2 className="text-[1.375rem] mb-2" style={{ fontWeight: 700 }}>
            Thanks for the feedback!
          </h2>
          <p className="text-muted-foreground text-[0.875rem]">
            You rated your Rescue Box {selectedRating}/5
          </p>
          <div className="flex justify-center gap-1 mt-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <Star
                key={star}
                className={`w-6 h-6 ${
                  star <= selectedRating
                    ? "text-amber-400 fill-amber-400"
                    : "text-gray-200"
                }`}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pt-14 pb-4 text-center"
      >
        <div className="text-[3rem] mb-2">🎉</div>
        <h1 className="text-[1.5rem]" style={{ fontWeight: 700 }}>
          How was your Rescue Box?
        </h1>
        <p className="text-muted-foreground text-[0.875rem] mt-1">
          Quick tap helps us make it better
        </p>
      </motion.div>

      <div className="flex-1 flex flex-col items-center justify-center px-5">
        {/* Star Rating */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-2xl border border-border p-8 w-full max-w-sm text-center"
        >
          <div className="flex justify-center gap-3 mb-4">
            {[1, 2, 3, 4, 5].map((star) => (
              <motion.button
                key={star}
                whileHover={{ scale: 1.15 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => handleRate(star)}
                className="p-1"
              >
                <Star
                  className={`w-10 h-10 transition-colors ${
                    selectedRating && star <= selectedRating
                      ? "text-amber-400 fill-amber-400"
                      : "text-gray-200 hover:text-amber-300"
                  }`}
                />
              </motion.button>
            ))}
          </div>
          {selectedRating && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-[0.875rem] text-primary"
              style={{ fontWeight: 500 }}
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
          className="mt-6 text-muted-foreground text-[0.875rem]"
        >
          Skip for now
        </motion.button>
      </div>

      {/* Impact note */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="px-5 pb-8 text-center"
      >
        <div className="bg-accent rounded-xl p-3">
          <p className="text-[0.8rem] text-accent-foreground">
            🌍 You just saved ~1 lb of food from going to waste. That's 1.5 kg of CO2 prevented.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
