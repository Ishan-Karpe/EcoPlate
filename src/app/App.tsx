import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import { TrendingUp, User, Home, ClipboardList } from "lucide-react";
import { StudentLanding } from "./components/student-landing";
import { DropDetail } from "./components/drop-detail";
import { ReserveConfirm } from "./components/reserve-confirm";
import { PickupCode } from "./components/pickup-code";
import { PostRating } from "./components/post-rating";
import { AccountPrompt } from "./components/account-prompt";
import { StudentInsights } from "./components/student-insights";
import { StudentSettings } from "./components/student-settings";
import { AdminLogin } from "./components/admin-login";
import { AdminDashboard } from "./components/admin-dashboard";
import { AdminCreateDrop } from "./components/admin-create-drop";
import { AdminRedeem } from "./components/admin-redeem";
import { AdminNoShows } from "./components/admin-no-shows";
import { WaitlistPopup } from "./components/waitlist-popup";
import { Onboarding } from "./components/onboarding";
import { OrderHistory } from "./components/order-history";
import {
  Screen,
  Drop,
  Reservation,
  UserState,
  calculateCurrentPrice,
  MOCK_DROPS,
  MOCK_STATS,
  MOCK_USER,
} from "./components/ecoplate-types";
import * as api from "./api";
import { toast, Toaster } from "sonner";

// ─── Food image pool (keyword -> URL) ─────────────────────────────────────────

const FOOD_IMAGE_POOL = [
  {
    keywords: ["pasta", "penne", "spaghetti", "lasagna", "noodle", "fettuccine", "italian"],
    url: "https://images.unsplash.com/photo-1758705206993-f141bbe56193?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
  },
  {
    keywords: ["stir", "teriyaki", "wok", "fried rice", "asian", "noodles", "soy", "szechuan"],
    url: "https://images.unsplash.com/photo-1679279726937-122c49626802?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
  },
  {
    keywords: ["sandwich", "deli", "turkey", "wrap", "sub", "panini", "avocado"],
    url: "https://images.unsplash.com/photo-1585238341805-eb6fde8854bd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
  },
  {
    keywords: ["bbq", "pulled", "pork", "cornbread", "brisket", "ribs", "barbecue", "smoky"],
    url: "https://images.unsplash.com/photo-1624900043496-eefdb73dadf6?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
  },
  {
    keywords: ["pizza", "margherita", "pepperoni", "mozzarella", "flatbread"],
    url: "https://images.unsplash.com/photo-1650315776778-9a767370950f?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
  },
  {
    keywords: ["soup", "stew", "broth", "chowder", "bisque", "chili"],
    url: "https://images.unsplash.com/photo-1756201408993-3b0f802d2677?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
  },
  {
    keywords: ["salad", "green", "vegetarian", "vegan", "lettuce", "kale", "arugula"],
    url: "https://images.unsplash.com/photo-1610903122389-3674aafb17a5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
  },
  {
    keywords: ["chicken", "grilled", "roasted", "poultry", "wings"],
    url: "https://images.unsplash.com/photo-1564636242997-77953084df48?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
  },
  {
    keywords: ["rice", "bowl", "grain", "quinoa", "burrito", "taco", "mexican"],
    url: "https://images.unsplash.com/photo-1679279726937-122c49626802?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
  },
];

const LOCATION_FALLBACK_IMAGES: Record<string, string> = {
  Brandywine:
    "https://images.unsplash.com/photo-1732187582879-3ca83139c1b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
  Anteatery:
    "https://images.unsplash.com/photo-1758705206993-f141bbe56193?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
};

function pickDropImage(description: string, location: string): string {
  const lower = description.toLowerCase();
  for (const entry of FOOD_IMAGE_POOL) {
    if (entry.keywords.some((k) => lower.includes(k))) return entry.url;
  }
  return LOCATION_FALLBACK_IMAGES[location] ?? LOCATION_FALLBACK_IMAGES["Anteatery"];
}

const ADMIN_SCREENS: Screen[] = [
  "admin-login",
  "admin-dashboard",
  "admin-create-drop",
  "admin-redeem",
  "admin-no-shows",
];

// ─── App ──────────────────────────────────────────────────────────────────────

export default function App() {
  // Session ID - persisted in localStorage so same user across refreshes
  const sessionId = useRef<string>(api.getOrCreateSessionId());

  // ── Core state ────────────────────────────────────────────────────────────
  const [screen, setScreen] = useState<Screen>("landing");
  const [drops, setDrops] = useState<Drop[]>(MOCK_DROPS); // seeded instantly, replaced by server
  const [dropsLoading, setDropsLoading] = useState(true);
  const [selectedDrop, setSelectedDrop] = useState<Drop | null>(null);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [user, setUser] = useState<UserState>(MOCK_USER);
  const [stats, setStats] = useState(MOCK_STATS);
  const [waitlistedDropIds, setWaitlistedDropIds] = useState<Set<string>>(new Set());
  // Waitlist popup - shown to all students; hidden only when staff bypass
  const [showWaitlist, setShowWaitlist] = useState(true);

  // No-shows (loaded when admin navigates to that screen)
  const [noShows, setNoShows] = useState<api.NoShowEntry[]>([]);
  const [noShowsLoading, setNoShowsLoading] = useState(false);

  // Redemption history (still tracked locally for the redeem screen counter)
  const [recentRedemptions, setRecentRedemptions] = useState<
    { code: string; time: string; location: string }[]
  >([]);

  // ── Bootstrap ──────────────────────────────────────────────────────────────
  useEffect(() => {
    // Load drops from server
    api
      .getDrops()
      .then((serverDrops) => {
        setDrops(serverDrops.length > 0 ? serverDrops : MOCK_DROPS);
      })
      .catch((err) => {
        console.error("Failed to load drops:", err);
        toast.error("Could not load drops", { description: "Showing cached data." });
        setDrops(MOCK_DROPS);
      })
      .finally(() => setDropsLoading(false));

    // Load user state from server
    api
      .getUser(sessionId.current)
      .then((serverUser) => setUser(serverUser))
      .catch((err) => console.error("Failed to load user state:", err));

    // Load any active reservation for this session
    api
      .getReservations(sessionId.current)
      .then((allRes) => {
        const active = allRes.find((r) => r.status === "reserved");
        if (active) setReservation(active);
      })
      .catch((err) => console.error("Failed to load reservations:", err));
  }, []);

  // Re-sync stats whenever we enter admin dashboard
  useEffect(() => {
    if (screen === "admin-dashboard") {
      api
        .getAdminStats()
        .then((s) => setStats(s))
        .catch((err) => console.error("Failed to load admin stats:", err));
    }
    if (screen === "admin-no-shows") {
      setNoShowsLoading(true);
      api
        .getNoShows()
        .then((ns) => setNoShows(ns))
        .catch((err) => console.error("Failed to load no-shows:", err))
        .finally(() => setNoShowsLoading(false));
    }
  }, [screen]);

  // ── Student handlers ───────────────────────────────────────────────────────

  const handleWaitlist = useCallback(
    async (dropId: string) => {
      setWaitlistedDropIds((prev) => {
        const next = new Set(prev);
        next.add(dropId);
        return next;
      });
      toast.success("You're on the waitlist!", {
        description: "We'll notify you if a box opens up.",
      });
      try {
        await api.joinWaitlist(dropId, sessionId.current);
      } catch (err) {
        console.error("Failed to save waitlist entry:", err);
      }
    },
    []
  );

  const handleSelectDrop = useCallback((drop: Drop) => {
    setSelectedDrop(drop);
    setScreen("drop-detail");
  }, []);

  const handleReserve = useCallback(() => {
    if (selectedDrop && selectedDrop.remainingBoxes <= 0) {
      toast.error("Just sold out!", {
        description: "Someone grabbed the last box. Join the waitlist instead.",
      });
      return;
    }
    setScreen("reserve-confirm");
  }, [selectedDrop]);

  const handleConfirmReservation = useCallback(
    async (paymentMethod: "card" | "credit" | "pay_at_pickup", cardLast4?: string) => {
      if (!selectedDrop) return;

      // Optimistic local update so UI responds immediately
      const optimisticPrice = calculateCurrentPrice(selectedDrop);
      const optimisticRes: Reservation = {
        id: `res-optimistic-${Date.now()}`,
        dropId: selectedDrop.id,
        dropLocation: selectedDrop.location,
        dropLocationDetail: selectedDrop.locationDetail,
        dropWindowStart: selectedDrop.windowStart,
        dropWindowEnd: selectedDrop.windowEnd,
        dropImageUrl: selectedDrop.imageUrl,
        pickupCode: "------",
        status: "reserved",
        createdAt: new Date().toISOString(),
        paymentMethod,
        currentPrice: optimisticPrice,
      };
      setReservation(optimisticRes);
      setScreen("pickup-code");

      try {
        const { reservation: serverRes, drop: updatedDrop } = await api.createReservation({
          dropId: selectedDrop.id,
          sessionId: sessionId.current,
          paymentMethod,
          cardLast4,
        });

        setReservation(serverRes);
        setDrops((prev) => prev.map((d) => (d.id === updatedDrop.id ? updatedDrop : d)));
        setSelectedDrop(updatedDrop);

        // Sync user state after credit/card changes
        const updatedUser = await api.getUser(sessionId.current);
        setUser(updatedUser);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : String(err);
        console.error("Failed to confirm reservation:", msg);
        if (msg.includes("sold out")) {
          toast.error("Just sold out!", { description: "Someone grabbed the last box." });
        } else {
          toast.error("Reservation failed", { description: msg });
        }
        setReservation(null);
        setScreen("reserve-confirm");
      }
    },
    [selectedDrop]
  );

  const handleCancelReservation = useCallback(async () => {
    if (!reservation || !selectedDrop) return;

    // Optimistic update
    setDrops((prev) =>
      prev.map((d) =>
        d.id === selectedDrop.id
          ? { ...d, remainingBoxes: d.remainingBoxes + 1, reservedBoxes: Math.max(0, d.reservedBoxes - 1) }
          : d
      )
    );
    setReservation(null);
    setScreen("landing");
    toast.success("Reservation cancelled", {
      description: "Your box has been released for someone else.",
    });

    try {
      await api.cancelReservation(reservation.id);
      // Re-sync user (credit may have been returned)
      const updatedUser = await api.getUser(sessionId.current);
      setUser(updatedUser);
      // Re-sync drops
      const serverDrops = await api.getDrops();
      if (serverDrops.length > 0) setDrops(serverDrops);
    } catch (err) {
      console.error("Failed to cancel reservation on server:", err);
    }
  }, [reservation, selectedDrop]);

  const handlePickedUp = useCallback(() => {
    if (reservation && reservation.status !== "picked_up") {
      setReservation((prev) => (prev ? { ...prev, status: "picked_up" } : null));
    }
    setScreen("post-rating");
  }, [reservation]);

  const handleRate = useCallback(
    async (rating: number) => {
      setUser((prev) => ({ ...prev, totalPickups: prev.totalPickups + 1 }));

      try {
        if (reservation) {
          await api.submitRating(reservation.id, rating, sessionId.current);
          const updatedUser = await api.getUser(sessionId.current);
          setUser(updatedUser);
        }
      } catch (err) {
        console.error("Failed to submit rating:", err);
      }

      setTimeout(() => {
        if (!user.hasAccount) {
          setScreen("account-prompt");
        } else {
          setReservation(null);
          setScreen("landing");
        }
      }, 1200);
    },
    [reservation, user.hasAccount]
  );

  const handleSkipRating = useCallback(() => {
    setUser((prev) => ({ ...prev, totalPickups: prev.totalPickups + 1 }));
    if (!user.hasAccount) {
      setScreen("account-prompt");
    } else {
      setReservation(null);
      setScreen("landing");
    }
  }, [user.hasAccount]);

  const handleSignUp = useCallback(
    async (plan: "none" | "basic" | "premium", name: string, email: string) => {
      const updates: Partial<UserState> = { hasAccount: true, isFirstTime: false };
      if (plan === "basic") {
        updates.membership = { plan: "basic", monthlyPrice: 15, creditsPerMonth: 7, earlyAccess: false, monthsUnderUsed: 0 };
        updates.creditsRemaining = 7;
      } else if (plan === "premium") {
        updates.membership = { plan: "premium", monthlyPrice: 30, creditsPerMonth: 15, earlyAccess: true, monthsUnderUsed: 0 };
        updates.creditsRemaining = 15;
      }
      setUser((prev) => ({ ...prev, ...updates }));

      toast.success(
        plan === "none" ? `Welcome${name ? `, ${name}` : ""}!` : `${plan === "basic" ? "Rescue Basic" : "Rescue Premium"} activated!`,
        {
          description:
            plan === "none"
              ? "You'll get drop notifications and impact tracking."
              : `You now have ${plan === "basic" ? 7 : 15} Rescue Credits this month.`,
        }
      );
      setReservation(null);
      setScreen("landing");

      try {
        await api.updateUser(sessionId.current, updates);
      } catch (err) {
        console.error("Failed to save account to server:", err);
      }
    },
    []
  );

  const handleUpdatePlan = useCallback(async (plan: "none" | "basic" | "premium") => {
    const updates: Partial<UserState> = {};
    if (plan === "none") {
      updates.membership = null;
    } else if (plan === "basic") {
      updates.membership = { plan: "basic", monthlyPrice: 15, creditsPerMonth: 7, earlyAccess: false, monthsUnderUsed: 0 };
      updates.creditsRemaining = 7;
    } else {
      updates.membership = { plan: "premium", monthlyPrice: 30, creditsPerMonth: 15, earlyAccess: true, monthsUnderUsed: 0 };
      updates.creditsRemaining = 15;
    }
    setUser((prev) => ({ ...prev, ...updates }));
    toast.success(
      plan === "none" ? "Plan cancelled" : `${plan === "basic" ? "Rescue Basic" : "Rescue Premium"} activated!`,
      {
        description:
          plan !== "none"
            ? `${plan === "basic" ? 7 : 15} credits added to your account this month.`
            : undefined,
      }
    );
    try {
      await api.updateUser(sessionId.current, updates);
    } catch (err) {
      console.error("Failed to update plan on server:", err);
    }
  }, []);

  const handleCreateAccountFromSettings = useCallback(
    async (plan: "none" | "basic" | "premium", name: string, email: string) => {
      const updates: Partial<UserState> = { hasAccount: true, isFirstTime: false };
      if (plan === "basic") {
        updates.membership = { plan: "basic", monthlyPrice: 15, creditsPerMonth: 7, earlyAccess: false, monthsUnderUsed: 0 };
        updates.creditsRemaining = 7;
      } else if (plan === "premium") {
        updates.membership = { plan: "premium", monthlyPrice: 30, creditsPerMonth: 15, earlyAccess: true, monthsUnderUsed: 0 };
        updates.creditsRemaining = 15;
      }
      setUser((prev) => ({ ...prev, ...updates }));
      toast.success(
        plan === "none" ? `Welcome${name ? `, ${name}` : ""}!` : `${plan === "basic" ? "Rescue Basic" : "Rescue Premium"} activated!`,
        {
          description:
            plan === "none"
              ? "Account created. You can now track your impact."
              : `${plan === "basic" ? 7 : 15} Rescue Credits added to your account.`,
        }
      );
      try {
        await api.updateUser(sessionId.current, updates);
      } catch (err) {
        console.error("Failed to save account:", err);
      }
    },
    []
  );

  const handleDismissAccount = useCallback(() => {
    setUser((prev) => ({ ...prev, isFirstTime: false }));
    setReservation(null);
    setScreen("landing");
    api.updateUser(sessionId.current, { isFirstTime: false }).catch(console.error);
  }, []);

  const handleViewCode = useCallback(() => {
    setScreen("pickup-code");
  }, []);

  // ── Admin handlers ─────────────────────────────────────────────────────────

  const handleAdminLogin = useCallback(() => {
    setScreen("admin-dashboard");
  }, []);

  const handleDropSubmit = useCallback(
    async (drop: {
      location: "Brandywine" | "Anteatery";
      boxes: number;
      windowStart: string;
      windowEnd: string;
      priceMin: number;
      priceMax: number;
      description: string;
      locationDetail: string;
      photoDataUrl?: string;
    }) => {
      // Use the staff-captured photo if available, otherwise fall back to stock images
      const imageUrl = drop.photoDataUrl || pickDropImage(drop.description, drop.location);
      const locationCap = stats.locationCaps.find((c) => c.location === drop.location);

      try {
        const newDrop = await api.createDrop({
          ...drop,
          imageUrl,
          dailyCap: locationCap?.currentCap ?? 30,
          consecutiveWeeksAbove85: locationCap?.consecutiveWeeksAbove85 ?? 0,
        });
        setDrops((prev) => [newDrop, ...prev]);
        setStats((prev) => ({
          ...prev,
          totalDrops: prev.totalDrops + 1,
          totalBoxesPosted: prev.totalBoxesPosted + drop.boxes,
        }));
        toast.success("Drop created!", { description: `${drop.boxes} boxes posted at ${drop.location}.` });
        setTimeout(() => setScreen("admin-dashboard"), 1500);
      } catch (err) {
        console.error("Failed to create drop:", err);
        toast.error("Failed to create drop", { description: String(err) });
      }
    },
    [stats.locationCaps]
  );

  const handleRedeemCode = useCallback(async (code: string): Promise<api.RedeemResult> => {
    try {
      const result = await api.redeemCode(code);
      if (result.valid) {
        // Mark local reservation as picked up if it matches
        if (reservation && reservation.pickupCode === code.toUpperCase().trim()) {
          setReservation((prev) => (prev ? { ...prev, status: "picked_up" } : null));
        }
        setRecentRedemptions((prev) => [
          {
            code: code.toUpperCase().trim(),
            time: new Date().toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true }),
            location: result.location ?? "",
          },
          ...prev,
        ]);
        // Refresh stats
        api.getAdminStats().then(setStats).catch(console.error);
      }
      return result;
    } catch (err) {
      console.error("Failed to redeem code:", err);
      return { valid: false, reason: "Server error. Please try again." };
    }
  }, [reservation]);

  const handleMarkNoShow = useCallback(
    async (reservationId: string, boxStatus: "released" | "donated" | "disposed") => {
      try {
        await api.markNoShow(reservationId, boxStatus);
        setNoShows((prev) =>
          prev.map((ns) =>
            ns.reservationId === reservationId
              ? { ...ns, alreadyMarked: true, boxStatus }
              : ns
          )
        );
        toast.success("Marked as no-show", { description: `Box disposition: ${boxStatus}.` });
        api.getAdminStats().then(setStats).catch(console.error);
      } catch (err) {
        console.error("Failed to mark no-show:", err);
        toast.error("Failed to mark no-show", { description: String(err) });
      }
    },
    []
  );

  const handleAdminLogout = useCallback(() => {
    setScreen("landing");
  }, []);

  // ── Bottom nav ─────────────────────────────────────────────────────────────

  const showBottomNav = !ADMIN_SCREENS.includes(screen) && screen !== "onboarding";

  const handleNavTab = (tab: Screen) => setScreen(tab);

  const navTabs: { id: Screen; label: string; icon: React.ReactNode }[] = [
    { id: "landing", label: "Home", icon: <Home className="w-5 h-5" /> },
    { id: "student-insights", label: "Impact", icon: <TrendingUp className="w-5 h-5" /> },
  ];

  // ── Render ─────────────────────────────────────────────────────────────────

  const renderScreen = () => {
    switch (screen) {
      case "landing":
        return (
          <StudentLanding
            drops={drops}
            dropsLoading={dropsLoading}
            onSelectDrop={handleSelectDrop}
            onAdminAccess={() => setScreen("admin-login")}
            activeReservation={reservation}
            onPickedUp={handlePickedUp}
            onCancelReservation={handleCancelReservation}
            onViewCode={handleViewCode}
            waitlistedDropIds={waitlistedDropIds}
            onWaitlist={handleWaitlist}
            hasAccount={user.hasAccount}
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
        return <AccountPrompt onSignUp={handleSignUp} onDismiss={handleDismissAccount} />;
      case "student-insights":
        return <StudentInsights user={user} />;
      case "student-settings":
        return (
          <StudentSettings
            user={user}
            onCreateAccount={handleCreateAccountFromSettings}
            onUpdatePlan={handleUpdatePlan}
            onAdminAccess={() => setScreen("admin-login")}
          />
        );
      case "order-history":
        return (
          <OrderHistory
            sessionId={sessionId.current}
            activeReservation={reservation}
            onViewActivePickup={() => {
              if (reservation && selectedDrop) setScreen("pickup-code");
            }}
          />
        );
      case "admin-login":
        return <AdminLogin onLogin={handleAdminLogin} onBack={() => setScreen("landing")} />;
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
            onRedeem={handleRedeemCode}
            recentRedemptions={recentRedemptions}
          />
        );
      case "admin-no-shows":
        return (
          <AdminNoShows
            onBack={() => setScreen("admin-dashboard")}
            noShows={noShows}
            loading={noShowsLoading}
            onMarkNoShow={handleMarkNoShow}
          />
        );
      case "onboarding":
        // Skip onboarding if user already has an account
        if (user.hasAccount) {
          setTimeout(() => setScreen("landing"), 0);
          return null;
        }
        return (
          <Onboarding
            onComplete={(plan) => {
              if (plan !== "none") {
                handleUpdatePlan(plan);
              }
              setScreen("landing");
            }}
            onSkip={() => setScreen("landing")}
          />
        );
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

      {/* Bottom nav - stable, never unmounts */}
      {showBottomNav && (
        <div
          className="absolute bottom-0 left-0 right-0 z-50"
          style={{
            backgroundColor: "white",
            borderTop: "1px solid rgba(0,104,56,0.1)",
            boxShadow: "0 -4px 24px rgba(0,0,0,0.08)",
          }}
        >
          <div className="flex items-center">
            {navTabs.map((tab) => {
              const isActive = screen === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleNavTab(tab.id)}
                  className="flex-1 flex flex-col items-center py-3 gap-1 relative transition-colors active:bg-green-50"
                >
                  <span style={{ color: isActive ? "#006838" : "#7A6B5A", transition: "color 0.15s" }}>
                    {tab.icon}
                  </span>
                  <span
                    style={{
                      fontSize: "0.62rem",
                      fontWeight: isActive ? 700 : 500,
                      color: isActive ? "#006838" : "#7A6B5A",
                      letterSpacing: "0.02em",
                    }}
                  >
                    {tab.label}
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="nav-bar"
                      className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
                      style={{ backgroundColor: "#006838" }}
                    />
                  )}
                </button>
              );
            })}
            <button
              onClick={() => handleNavTab("order-history")}
              className="flex-1 flex flex-col items-center py-3 gap-1 relative transition-colors active:bg-green-50"
            >
              <span style={{ color: screen === "order-history" ? "#006838" : "#7A6B5A", transition: "color 0.15s" }}>
                <ClipboardList className="w-5 h-5" />
              </span>
              <span
                style={{
                  fontSize: "0.62rem",
                  fontWeight: screen === "order-history" ? 700 : 500,
                  color: screen === "order-history" ? "#006838" : "#7A6B5A",
                  letterSpacing: "0.02em",
                }}
              >
                Orders
              </span>
              {screen === "order-history" && (
                <motion.div
                  layoutId="nav-bar"
                  className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
                  style={{ backgroundColor: "#006838" }}
                />
              )}
              {/* Active dot when there's a pending reservation */}
              {reservation && screen !== "order-history" && (
                <div
                  className="absolute top-2 right-1/2 translate-x-3 w-1.5 h-1.5 rounded-full"
                  style={{ backgroundColor: "#006838" }}
                />
              )}
            </button>
            <button
              onClick={() => handleNavTab("student-settings")}
              className="flex-1 flex flex-col items-center py-3 gap-1 relative transition-colors active:bg-green-50"
            >
              <span style={{ color: screen === "student-settings" ? "#006838" : "#7A6B5A", transition: "color 0.15s" }}>
                <User className="w-5 h-5" />
              </span>
              <span
                style={{
                  fontSize: "0.62rem",
                  fontWeight: screen === "student-settings" ? 700 : 500,
                  color: screen === "student-settings" ? "#006838" : "#7A6B5A",
                  letterSpacing: "0.02em",
                }}
              >
                Profile
              </span>
              {screen === "student-settings" && (
                <motion.div
                  layoutId="nav-bar"
                  className="absolute bottom-0 left-4 right-4 h-0.5 rounded-full"
                  style={{ backgroundColor: "#006838" }}
                />
              )}
            </button>
          </div>
          <div style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
        </div>
      )}

      <Toaster
        position="top-center"
        richColors
        toastOptions={{ style: { fontFamily: "inherit" } }}
      />

      {/* Priority waitlist popup - blocks student access until launch */}
      <AnimatePresence>
        {showWaitlist && !ADMIN_SCREENS.includes(screen) && (
          <WaitlistPopup
            onStaffAccess={() => {
              setShowWaitlist(false);
              setScreen("admin-login");
            }}
            onClose={() => setShowWaitlist(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
