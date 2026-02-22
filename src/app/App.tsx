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
  calculateCurrentPrice,
  MOCK_DROPS,
  MOCK_STATS,
  MOCK_USER,
} from "./components/ecoplate-types";
import { toast, Toaster } from "sonner";

interface Redemption {
  code: string;
  time: string;
  location: string;
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [drops, setDrops] = useState<Drop[]>(MOCK_DROPS);
  const [selectedDrop, setSelectedDrop] = useState<Drop | null>(null);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [user, setUser] = useState<UserState>(MOCK_USER);
  const [validCodes, setValidCodes] = useState<string[]>([]);
  const [expiredCodes, setExpiredCodes] = useState<string[]>([]);
  // Redemptions start EMPTY - no mock data. Resets daily.
  const [recentRedemptions, setRecentRedemptions] = useState<Redemption[]>([]);
  const [stats, setStats] = useState(MOCK_STATS);
  // Waitlist state persists across navigation (App-level, not component-level)
  const [waitlistedDropIds, setWaitlistedDropIds] = useState<Set<string>>(new Set());

  // --- STUDENT FLOW ---

  const handleWaitlist = useCallback((dropId: string) => {
    setWaitlistedDropIds((prev) => {
      const next = new Set(prev);
      next.add(dropId);
      return next;
    });
    toast.success("You're on the waitlist!", {
      description: "We'll notify you if a box opens up.",
    });
  }, []);

  const handleSelectDrop = useCallback((drop: Drop) => {
    setSelectedDrop(drop);
    setScreen("drop-detail");
  }, []);

  const handleReserve = useCallback(() => {
    // Inventory gate: if boxes ran out since loading, switch to sold-out
    if (selectedDrop && selectedDrop.remainingBoxes <= 0) {
      toast.error("Just sold out!", {
        description: "Someone grabbed the last box. Join the waitlist instead.",
      });
      return;
    }
    setScreen("reserve-confirm");
  }, [selectedDrop]);

  const handleConfirmReservation = useCallback(
    (paymentMethod: "card" | "credit" | "pay_at_pickup", cardLast4?: string) => {
      if (!selectedDrop) return;

      const code = generatePickupCode();
      const currentPrice = calculateCurrentPrice(selectedDrop);

      const newReservation: Reservation = {
        id: `res-${Date.now()}`,
        dropId: selectedDrop.id,
        dropLocation: selectedDrop.location,
        dropLocationDetail: selectedDrop.locationDetail,
        dropWindowStart: selectedDrop.windowStart,
        dropWindowEnd: selectedDrop.windowEnd,
        dropImageUrl: selectedDrop.imageUrl,
        pickupCode: code,
        status: "reserved",
        createdAt: new Date().toISOString(),
        paymentMethod,
        currentPrice,
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

      // Save card if first time
      if (paymentMethod === "card" && cardLast4 && !user.hasCardSaved) {
        setUser((prev) => ({
          ...prev,
          hasCardSaved: true,
          cardLast4: cardLast4,
        }));
      }

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
    [selectedDrop, user.hasCardSaved]
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

  // Called from home screen status banner: "I Picked Up My Box"
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
      setStats((prev) => ({
        ...prev,
        totalBoxesPickedUp: prev.totalBoxesPickedUp + 1,
        avgRating:
          Math.round(((prev.avgRating * prev.totalBoxesPickedUp + rating) / (prev.totalBoxesPickedUp + 1)) * 10) / 10,
      }));
      // After first pickup + no account → show account prompt
      setTimeout(() => {
        if (!user.hasAccount) {
          setScreen("account-prompt");
        } else {
          // Clear reservation and return home
          setReservation(null);
          setScreen("landing");
        }
      }, 1200);
    },
    [reservation, user.hasAccount]
  );

  const handleSkipRating = useCallback(() => {
    setUser((prev) => ({
      ...prev,
      totalPickups: prev.totalPickups + 1,
    }));
    if (!user.hasAccount) {
      setScreen("account-prompt");
    } else {
      setReservation(null);
      setScreen("landing");
    }
  }, [user.hasAccount]);

  const handleSignUp = useCallback(
    (plan: "none" | "basic" | "premium", name: string, email: string) => {
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
        plan === "none"
          ? `Welcome, ${name}!`
          : `${plan === "basic" ? "Rescue Basic" : "Rescue Premium"} activated!`,
        {
          description:
            plan === "none"
              ? "You'll get drop notifications and impact tracking."
              : `You now have ${plan === "basic" ? 7 : 15} Rescue Credits this month.`,
        }
      );
      setReservation(null);
      setScreen("landing");
    },
    []
  );

  const handleDismissAccount = useCallback(() => {
    setUser((prev) => ({ ...prev, isFirstTime: false }));
    setReservation(null);
    setScreen("landing");
  }, []);

  // Navigate back to pickup code screen from home banner
  const handleViewCode = useCallback(() => {
    setScreen("pickup-code");
  }, []);

  // --- ADMIN FLOW ---

  const handleAdminLogin = useCallback(() => {
    setScreen("admin-dashboard");
  }, []);

  const handleDropSubmit = useCallback(
    (drop: {
      location: "Brandywine" | "Anteatery";
      boxes: number;
      windowStart: string;
      windowEnd: string;
      priceMin: number;
      priceMax: number;
      description: string;
      locationDetail: string;
    }) => {
      const LOCATION_IMAGES = {
        Brandywine:
          "https://images.unsplash.com/photo-1732187582879-3ca83139c1b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
        Anteatery:
          "https://images.unsplash.com/photo-1758705206993-f141bbe56193?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
      };

      const newDrop: Drop = {
        id: `drop-${Date.now()}`,
        location: drop.location,
        locationDetail: drop.locationDetail,
        date: new Date().toISOString().split("T")[0],
        windowStart: drop.windowStart,
        windowEnd: drop.windowEnd,
        totalBoxes: drop.boxes,
        remainingBoxes: drop.boxes,
        reservedBoxes: 0,
        priceMin: drop.priceMin,
        priceMax: drop.priceMax,
        status: "active",
        description:
          drop.description ||
          "Tonight's Rescue Box: freshly prepared and packed by dining staff.",
        imageUrl: LOCATION_IMAGES[drop.location],
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

  const handleRedeemCode = useCallback(
    (code: string) => {
      // Find which drop this code belongs to (via validCodes and current drops)
      const drop = drops.find((d) =>
        reservation?.pickupCode === code ? d.id === reservation.dropId : false
      );

      setValidCodes((prev) => prev.filter((c) => c !== code));
      setRecentRedemptions((prev) => [
        {
          code,
          time: new Date().toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          }),
          location: drop?.location ?? reservation?.dropLocation ?? "",
        },
        ...prev,
      ]);
      setStats((prev) => ({
        ...prev,
        totalBoxesPickedUp: prev.totalBoxesPickedUp + 1,
        pickupRate: Math.round(
          ((prev.totalBoxesPickedUp + 1) / prev.totalBoxesPosted) * 100
        ),
      }));
    },
    [drops, reservation]
  );

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
            activeReservation={reservation}
            onPickedUp={handlePickedUp}
            onCancelReservation={handleCancelReservation}
            onViewCode={handleViewCode}
            waitlistedDropIds={waitlistedDropIds}
            onWaitlist={handleWaitlist}
          />
        );
      case "drop-detail":
        return selectedDrop ? (
          <DropDetail
            drop={selectedDrop}
            onReserve={handleReserve}
            onBack={() => setScreen("landing")}
            waitlistedDropIds={waitlistedDropIds}
            onWaitlist={handleWaitlist}
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
            onBackToHome={() => setScreen("landing")}
          />
        ) : null;
      case "post-rating":
        return <PostRating onRate={handleRate} onSkip={handleSkipRating} />;
      case "account-prompt":
        return (
          <AccountPrompt
            onSignUp={handleSignUp}
            onDismiss={handleDismissAccount}
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
    <div
      className="w-full min-h-screen max-w-md mx-auto relative overflow-hidden shadow-2xl"
      style={{ backgroundColor: "#F9F6F1" }}
    >
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
      <Toaster
        position="top-center"
        richColors
        toastOptions={{
          style: {
            fontFamily: "inherit",
          },
        }}
      />
    </div>
  );
}