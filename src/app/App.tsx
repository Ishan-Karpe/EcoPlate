import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { StudentLanding } from "./components/student-landing";
import { DropDetail } from "./components/drop-detail";
import { ReserveConfirm } from "./components/reserve-confirm";
import { PickupCode } from "./components/pickup-code";
import { PostRating } from "./components/post-rating";
import { AccountPrompt } from "./components/account-prompt";
import { AdminLogin } from "./components/admin-login";
import { AdminDashboard } from "./components/admin-dashboard";
import { AdminCreateDrop } from "./components/admin-create-drop";
import { AdminRedeem } from "./components/admin-redeem";
import { AdminNoShows } from "./components/admin-no-shows";
import {
  Screen,
  Drop,
  Reservation,
  UserState,
  generatePickupCode,
  MOCK_DROPS,
  MOCK_STATS,
  MOCK_USER,
} from "./components/ecoplate-types";
import { toast, Toaster } from "sonner";

export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [drops, setDrops] = useState<Drop[]>(MOCK_DROPS);
  const [selectedDrop, setSelectedDrop] = useState<Drop | null>(null);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [user, setUser] = useState<UserState>(MOCK_USER);
  const [validCodes, setValidCodes] = useState<string[]>([]);
  const [expiredCodes, setExpiredCodes] = useState<string[]>(["EXP123", "OLD456"]);
  const [recentRedemptions, setRecentRedemptions] = useState<{ code: string; time: string }[]>([
    { code: "XK7M2P", time: "8:15 PM" },
    { code: "B4N9QR", time: "8:27 PM" },
    { code: "T5W8JL", time: "8:39 PM" },
  ]);
  const [stats, setStats] = useState(MOCK_STATS);

  // --- STUDENT FLOW ---

  const handleSelectDrop = useCallback((drop: Drop) => {
    setSelectedDrop(drop);
    setScreen("drop-detail");
  }, []);

  const handleReserve = useCallback(() => {
    setScreen("reserve-confirm");
  }, []);

  const handleJoinWaitlist = useCallback(() => {
    toast.success("You're on the waitlist!", {
      description: "We'll notify you if a box opens up at this location.",
    });
    setScreen("landing");
  }, []);

  const handleConfirmReservation = useCallback(
    (paymentMethod: "card" | "credit" | "pay_at_pickup") => {
      if (!selectedDrop) return;

      const code = generatePickupCode();
      const newReservation: Reservation = {
        id: `res-${Date.now()}`,
        dropId: selectedDrop.id,
        pickupCode: code,
        status: "reserved",
        createdAt: new Date().toISOString(),
        paymentMethod,
      };
      setReservation(newReservation);
      setValidCodes((prev) => [...prev, code]);

      // Decrement remaining boxes
      setDrops((prev) =>
        prev.map((d) =>
          d.id === selectedDrop.id
            ? {
                ...d,
                remainingBoxes: Math.max(0, d.remainingBoxes - 1),
                reservedBoxes: d.reservedBoxes + 1,
              }
            : d
        )
      );
      setSelectedDrop((prev) =>
        prev
          ? {
              ...prev,
              remainingBoxes: Math.max(0, prev.remainingBoxes - 1),
              reservedBoxes: prev.reservedBoxes + 1,
            }
          : null
      );

      // Use credit if applicable
      if (paymentMethod === "credit") {
        setUser((prev) => ({
          ...prev,
          creditsRemaining: Math.max(0, prev.creditsRemaining - 1),
        }));
      }

      setStats((prev) => ({
        ...prev,
        totalReservations: prev.totalReservations + 1,
      }));

      setScreen("pickup-code");
    },
    [selectedDrop]
  );

  const handleCancelReservation = useCallback(() => {
    if (!reservation || !selectedDrop) return;

    // Release box back to inventory
    setDrops((prev) =>
      prev.map((d) =>
        d.id === selectedDrop.id
          ? {
              ...d,
              remainingBoxes: d.remainingBoxes + 1,
              reservedBoxes: Math.max(0, d.reservedBoxes - 1),
            }
          : d
      )
    );

    // Remove code from valid codes, add to expired
    setValidCodes((prev) => prev.filter((c) => c !== reservation.pickupCode));
    setExpiredCodes((prev) => [...prev, reservation.pickupCode]);

    // Return credit if used
    if (reservation.paymentMethod === "credit") {
      setUser((prev) => ({
        ...prev,
        creditsRemaining: prev.creditsRemaining + 1,
      }));
    }

    setReservation(null);
    toast.success("Reservation cancelled", {
      description: "Your box has been released for someone else.",
    });
    setScreen("landing");
  }, [reservation, selectedDrop]);

  const handlePickedUp = useCallback(() => {
    if (reservation) {
      setReservation((prev) => (prev ? { ...prev, status: "picked_up" } : null));
    }
    setScreen("post-rating");
  }, [reservation]);

  const handleRate = useCallback(
    (rating: number) => {
      if (reservation) {
        setReservation((prev) => (prev ? { ...prev, rating } : null));
      }
      setUser((prev) => ({
        ...prev,
        totalPickups: prev.totalPickups + 1,
      }));
      setTimeout(() => setScreen("account-prompt"), 1200);
    },
    [reservation]
  );

  const handleSkipRating = useCallback(() => {
    setUser((prev) => ({
      ...prev,
      totalPickups: prev.totalPickups + 1,
    }));
    setScreen("account-prompt");
  }, []);

  const handleSignUp = useCallback((plan: "none" | "basic" | "premium") => {
    setUser((prev) => {
      const updated: UserState = {
        ...prev,
        hasAccount: true,
        isFirstTime: false,
      };
      if (plan === "basic") {
        updated.membership = {
          plan: "basic",
          monthlyPrice: 15,
          creditsPerMonth: 7,
          earlyAccess: false,
          monthsUnderUsed: 0,
        };
        updated.creditsRemaining = 7;
      } else if (plan === "premium") {
        updated.membership = {
          plan: "premium",
          monthlyPrice: 30,
          creditsPerMonth: 15,
          earlyAccess: true,
          monthsUnderUsed: 0,
        };
        updated.creditsRemaining = 15;
      }
      return updated;
    });
    toast.success(
      plan === "none" ? "Account created!" : `${plan === "basic" ? "Basic" : "Premium"} plan activated!`,
      {
        description:
          plan === "none"
            ? "You'll get drop notifications and impact tracking."
            : `You now have ${plan === "basic" ? 7 : 15} Rescue Credits this month.`,
      }
    );
    setScreen("landing");
  }, []);

  const handleDismissAccount = useCallback(() => {
    setUser((prev) => ({ ...prev, isFirstTime: false }));
    setScreen("landing");
  }, []);

  // --- ADMIN FLOW ---

  const handleAdminLogin = useCallback(() => {
    setScreen("admin-dashboard");
  }, []);

  const handleDropSubmit = useCallback(
    (drop: {
      location: string;
      boxes: number;
      windowStart: string;
      windowEnd: string;
      price: string;
      description: string;
    }) => {
      const [priceMin, priceMax] = drop.price.split("-").map(Number);
      const emojis = ["🍝", "🍜", "🥪", "🍖", "🥗", "🍛", "🌮"];
      const newDrop: Drop = {
        id: `drop-${Date.now()}`,
        location: drop.location,
        locationDetail: "Pickup window",
        date: new Date().toISOString().split("T")[0],
        windowStart: drop.windowStart,
        windowEnd: drop.windowEnd,
        totalBoxes: drop.boxes,
        remainingBoxes: drop.boxes,
        reservedBoxes: 0,
        priceMin,
        priceMax,
        status: "active",
        description:
          drop.description ||
          "Tonight's Rescue Box: freshly prepared and packed by dining staff.",
        emoji: emojis[Math.floor(Math.random() * emojis.length)],
        dailyCap:
          stats.locationCaps.find((c) => c.location === drop.location)?.currentCap ?? 30,
        consecutiveWeeksAbove85:
          stats.locationCaps.find((c) => c.location === drop.location)
            ?.consecutiveWeeksAbove85 ?? 0,
      };

      setDrops((prev) => [newDrop, ...prev]);
      setStats((prev) => ({
        ...prev,
        totalDrops: prev.totalDrops + 1,
        totalBoxesPosted: prev.totalBoxesPosted + drop.boxes,
      }));
      setTimeout(() => setScreen("admin-dashboard"), 1500);
    },
    [stats.locationCaps]
  );

  const handleRedeemCode = useCallback((code: string) => {
    setValidCodes((prev) => prev.filter((c) => c !== code));
    setRecentRedemptions((prev) => [
      {
        code,
        time: new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        }),
      },
      ...prev,
    ]);
    setStats((prev) => ({
      ...prev,
      totalBoxesPickedUp: prev.totalBoxesPickedUp + 1,
      pickupRate: Math.round(((prev.totalBoxesPickedUp + 1) / prev.totalBoxesPosted) * 100),
    }));
  }, []);

  const handleAdminLogout = useCallback(() => {
    setScreen("landing");
  }, []);

  // --- RENDER ---

  const renderScreen = () => {
    switch (screen) {
      case "landing":
        return (
          <StudentLanding
            drops={drops}
            onSelectDrop={handleSelectDrop}
            onAdminAccess={() => setScreen("admin-login")}
          />
        );
      case "drop-detail":
        return selectedDrop ? (
          <DropDetail
            drop={selectedDrop}
            onReserve={handleReserve}
            onJoinWaitlist={handleJoinWaitlist}
            onBack={() => setScreen("landing")}
          />
        ) : null;
      case "reserve-confirm":
        return selectedDrop ? (
          <ReserveConfirm
            drop={selectedDrop}
            user={user}
            onConfirm={handleConfirmReservation}
            onBack={() => setScreen("drop-detail")}
          />
        ) : null;
      case "pickup-code":
        return reservation && selectedDrop ? (
          <PickupCode
            drop={selectedDrop}
            reservation={reservation}
            onPickedUp={handlePickedUp}
            onCancel={handleCancelReservation}
          />
        ) : null;
      case "post-rating":
        return <PostRating onRate={handleRate} onSkip={handleSkipRating} />;
      case "account-prompt":
        return (
          <AccountPrompt
            onSignUp={handleSignUp}
            onDismiss={handleDismissAccount}
            isFirstPickup={user.totalPickups <= 1}
          />
        );
      case "admin-login":
        return (
          <AdminLogin onLogin={handleAdminLogin} onBack={() => setScreen("landing")} />
        );
      case "admin-dashboard":
        return (
          <AdminDashboard
            stats={stats}
            activeDrops={drops}
            onCreateDrop={() => setScreen("admin-create-drop")}
            onRedeem={() => setScreen("admin-redeem")}
            onNoShows={() => setScreen("admin-no-shows")}
            onLogout={handleAdminLogout}
          />
        );
      case "admin-create-drop":
        return (
          <AdminCreateDrop
            onBack={() => setScreen("admin-dashboard")}
            onSubmit={handleDropSubmit}
            locationCaps={stats.locationCaps}
          />
        );
      case "admin-redeem":
        return (
          <AdminRedeem
            onBack={() => setScreen("admin-dashboard")}
            validCodes={validCodes}
            expiredCodes={expiredCodes}
            onRedeem={handleRedeemCode}
            recentRedemptions={recentRedemptions}
          />
        );
      case "admin-no-shows":
        return <AdminNoShows onBack={() => setScreen("admin-dashboard")} />;
      default:
        return null;
    }
  };

  return (
    <div className="w-full min-h-screen max-w-md mx-auto bg-background relative overflow-hidden shadow-2xl">
      <AnimatePresence mode="wait">
        <motion.div
          key={screen}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="w-full min-h-screen"
        >
          {renderScreen()}
        </motion.div>
      </AnimatePresence>
      <Toaster position="top-center" richColors />
    </div>
  );
}
