import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Leaf, TrendingUp, User } from "lucide-react";
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

// Keyword → food image URL map for auto drop image selection
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
  Brandywine: "https://images.unsplash.com/photo-1732187582879-3ca83139c1b8?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
  Anteatery: "https://images.unsplash.com/photo-1758705206993-f141bbe56193?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800",
};

function pickDropImage(description: string, location: string): string {
  const lower = description.toLowerCase();
  for (const entry of FOOD_IMAGE_POOL) {
    if (entry.keywords.some((k) => lower.includes(k))) {
      return entry.url;
    }
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

export default function App() {
  const [screen, setScreen] = useState<Screen>("landing");
  const [drops, setDrops] = useState<Drop[]>(MOCK_DROPS);
  const [selectedDrop, setSelectedDrop] = useState<Drop | null>(null);
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [user, setUser] = useState<UserState>(MOCK_USER);
  const [validCodes, setValidCodes] = useState<string[]>([]);
  const [expiredCodes, setExpiredCodes] = useState<string[]>([]);
  const [recentRedemptions, setRecentRedemptions] = useState<Redemption[]>([]);
  const [stats, setStats] = useState(MOCK_STATS);
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

      if (paymentMethod === "card" && cardLast4 && !user.hasCardSaved) {
        setUser((prev) => ({ ...prev, hasCardSaved: true, cardLast4: cardLast4 }));
      }
      if (paymentMethod === "credit") {
        setUser((prev) => ({
          ...prev,
          creditsRemaining: Math.max(0, prev.creditsRemaining - 1),
        }));
      }

      setStats((prev) => ({ ...prev, totalReservations: prev.totalReservations + 1 }));
      setScreen("pickup-code");
    },
    [selectedDrop, user.hasCardSaved]
  );

  const handleCancelReservation = useCallback(() => {
    if (!reservation || !selectedDrop) return;

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

    setValidCodes((prev) => prev.filter((c) => c !== reservation.pickupCode));
    setExpiredCodes((prev) => [...prev, reservation.pickupCode]);

    if (reservation.paymentMethod === "credit") {
      setUser((prev) => ({ ...prev, creditsRemaining: prev.creditsRemaining + 1 }));
    }

    setReservation(null);
    toast.success("Reservation cancelled", {
      description: "Your box has been released for someone else.",
    });
    setScreen("landing");
  }, [reservation, selectedDrop]);

  const handlePickedUp = useCallback(() => {
    if (reservation && reservation.status !== "picked_up") {
      setReservation((prev) => (prev ? { ...prev, status: "picked_up" } : null));
    }
    setScreen("post-rating");
  }, [reservation]);

  const handleRate = useCallback(
    (rating: number) => {
      if (reservation) {
        setReservation((prev) => (prev ? { ...prev, rating } : null));
      }
      setUser((prev) => ({ ...prev, totalPickups: prev.totalPickups + 1 }));
      setStats((prev) => ({
        ...prev,
        totalBoxesPickedUp: prev.totalBoxesPickedUp + 1,
        avgRating:
          Math.round(
            ((prev.avgRating * prev.totalBoxesPickedUp + rating) /
              (prev.totalBoxesPickedUp + 1)) *
              10
          ) / 10,
      }));
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
    (plan: "none" | "basic" | "premium", name: string, email: string) => {
      setUser((prev) => {
        const updated: UserState = { ...prev, hasAccount: true, isFirstTime: false };
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
          ? `Welcome${name ? `, ${name}` : ""}!`
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

  // Update plan without screen change (used from settings screen)
  const handleUpdatePlan = useCallback((plan: "none" | "basic" | "premium") => {
    setUser((prev) => {
      const updated = { ...prev };
      if (plan === "none") {
        updated.membership = null;
      } else if (plan === "basic") {
        updated.membership = {
          plan: "basic",
          monthlyPrice: 15,
          creditsPerMonth: 7,
          earlyAccess: false,
          monthsUnderUsed: 0,
        };
        updated.creditsRemaining = 7;
      } else {
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
        ? "Plan cancelled"
        : `${plan === "basic" ? "Rescue Basic" : "Rescue Premium"} activated!`,
      {
        description:
          plan !== "none"
            ? `${plan === "basic" ? 7 : 15} credits added to your account this month.`
            : undefined,
      }
    );
  }, []);

  // Create account from settings screen (no screen change)
  const handleCreateAccountFromSettings = useCallback(
    (plan: "none" | "basic" | "premium", name: string, email: string) => {
      setUser((prev) => {
        const updated: UserState = { ...prev, hasAccount: true, isFirstTime: false };
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
          ? `Welcome${name ? `, ${name}` : ""}!`
          : `${plan === "basic" ? "Rescue Basic" : "Rescue Premium"} activated!`,
        {
          description:
            plan === "none"
              ? "Account created. You can now track your impact."
              : `${plan === "basic" ? 7 : 15} Rescue Credits added to your account.`,
        }
      );
    },
    []
  );

  const handleDismissAccount = useCallback(() => {
    setUser((prev) => ({ ...prev, isFirstTime: false }));
    setReservation(null);
    setScreen("landing");
  }, []);

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
        imageUrl: pickDropImage(drop.description, drop.location),
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
      const upperCode = code.toUpperCase().trim();

      // If this code belongs to the current student reservation, mark it as picked up
      if (reservation && reservation.pickupCode === upperCode) {
        setReservation((prev) => (prev ? { ...prev, status: "picked_up" } : null));
      }

      const drop = drops.find((d) =>
        reservation?.pickupCode === upperCode ? d.id === reservation.dropId : false
      );

      setValidCodes((prev) => prev.filter((c) => c !== upperCode));
      setRecentRedemptions((prev) => [
        {
          code: upperCode,
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

  // --- BOTTOM NAV ---

  const showBottomNav = !ADMIN_SCREENS.includes(screen);

  const handleNavTab = (tab: Screen) => {
    setScreen(tab);
  };

  const navTabs: {
    id: Screen;
    label: string;
    icon: React.ReactNode;
  }[] = [
    {
      id: "landing",
      label: "Home",
      icon: <Leaf className="w-5 h-5" />,
    },
    {
      id: "student-insights",
      label: "Insights",
      icon: <TrendingUp className="w-5 h-5" />,
    },
    {
      id: "student-settings",
      label: "Profile",
      icon: <User className="w-5 h-5" />,
    },
  ];

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
          <AccountPrompt onSignUp={handleSignUp} onDismiss={handleDismissAccount} />
        );
      case "student-insights":
        return <StudentInsights user={user} />;
      case "student-settings":
        return (
          <StudentSettings
            user={user}
            onCreateAccount={handleCreateAccountFromSettings}
            onUpdatePlan={handleUpdatePlan}
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

      {/* Bottom navigation — always visible on student screens */}
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
                  <span
                    style={{
                      color: isActive ? "#006838" : "#7A6B5A",
                      transition: "color 0.15s",
                    }}
                  >
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
          </div>
          {/* Safe area spacer */}
          <div style={{ height: "env(safe-area-inset-bottom, 0px)" }} />
        </div>
      )}

      <Toaster
        position="top-center"
        richColors
        toastOptions={{ style: { fontFamily: "inherit" } }}
      />
    </div>
  );
}