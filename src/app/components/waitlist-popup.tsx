import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  CheckCircle2,
  ChevronRight,
  ChevronDown,
  Mail,
  User,
  Sparkles,
  ArrowRight,
  Bell,
  Tag,
  Clock,
  X,
  Phone,
  Share2,
  Copy,
  CalendarPlus,
  QrCode,
  ShoppingBag,
  Timer,
  Shield as ShieldIcon,
} from "lucide-react";
import { projectId, publicAnonKey } from "/utils/supabase/info";
import { EcoplateLogo, EcoplateLogo_Icon } from "./ecoplate-logo";

const BASE = `https://${projectId}.supabase.co/functions/v1/make-server-b2407c0b`;

async function fetchWaitlistCount(): Promise<number> {
  try {
    const res = await fetch(`${BASE}/waitlist-count`, {
      headers: { Authorization: `Bearer ${publicAnonKey}` },
    });
    const data = await res.json();
    return typeof data.count === "number" ? data.count : 0;
  } catch {
    return 0;
  }
}

async function submitWaitlist(
  email: string,
  name: string,
  phone?: string
): Promise<{ success?: boolean; alreadyRegistered?: boolean; position?: number; count?: number; error?: string }> {
  const res = await fetch(`${BASE}/waitlist-signup`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${publicAnonKey}`,
    },
    body: JSON.stringify({ email, name, phone: phone || undefined }),
  });
  return res.json();
}

interface WaitlistPopupProps {
  onStaffAccess: () => void;
  onClose: () => void;
}

type Step = "hero" | "form" | "success";

const PERKS = [
  {
    icon: <Clock className="w-4 h-4" style={{ color: "#006838" }} />,
    label: "Priority access to tonight's boxes before general release",
  },
  {
    icon: <Bell className="w-4 h-4" style={{ color: "#006838" }} />,
    label: "Instant alerts when a new drop goes live",
  },
  {
    icon: <Tag className="w-4 h-4" style={{ color: "#006838" }} />,
    label: "Lock in founding member pricing - first 200 only",
  },
];

const HOW_IT_WORKS = [
  {
    icon: <QrCode className="w-5 h-5" style={{ color: "#006838" }} />,
    title: "Scan QR",
    desc: "Find the QR code at your dining hall",
  },
  {
    icon: <ShoppingBag className="w-5 h-5" style={{ color: "#006838" }} />,
    title: "Reserve in App",
    desc: "Pick your box in 30 seconds",
  },
  {
    icon: <Timer className="w-5 h-5" style={{ color: "#006838" }} />,
    title: "Pick Up in 90 min",
    desc: "Grab your meal before it closes",
  },
];

const FAQ_ITEMS = [
  {
    q: "What is a Rescue Box?",
    a: "A Rescue Box is a to-go container of freshly prepared dining hall food that would otherwise go to waste at the end of the night. Each box is a chef's-choice meal with an entr\u00e9e, sides, and sometimes dessert.",
  },
  {
    q: "How much does it cost?",
    a: "Rescue Boxes cost $3\u2013$5 each, depending on demand and supply. Membership plans start at $15/mo for 7 credits. Founding members lock in special introductory rates.",
  },
  {
    q: "Is it safe?",
    a: "Absolutely. All food follows UCI dining hall safety standards. Boxes are prepared, sealed, and temperature-held by dining staff. You pick up directly from the dining hall counter.",
  },
  {
    q: "When does it launch?",
    a: "EcoPlate launches Fall 2026 at UC Irvine, starting with Brandywine and Anteatery. Join the waitlist for early access and founding member pricing.",
  },
];

export function WaitlistPopup({ onStaffAccess, onClose }: WaitlistPopupProps) {
  const [step, setStep] = useState<Step>("hero");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [position, setPosition] = useState<number | null>(null);
  const [liveCount, setLiveCount] = useState<number>(0);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Lock body scroll while popup is open
  useEffect(() => {
    const prevBody = document.body.style.overflow;
    const prevHtml = document.documentElement.style.overflow;
    document.body.style.overflow = "hidden";
    document.documentElement.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prevBody;
      document.documentElement.style.overflow = prevHtml;
    };
  }, []);

  useEffect(() => {
    fetchWaitlistCount().then(setLiveCount);
    pollRef.current = setInterval(() => {
      fetchWaitlistCount().then(setLiveCount);
    }, 30_000);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const handleJoin = async () => {
    setError("");
    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();

    if (!trimmedName) {
      setError("Please enter your first name.");
      return;
    }
    if (trimmedName.length > 100) {
      setError("Name is too long.");
      return;
    }
    if (!trimmedEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (trimmedPhone && !/^[\d\s()+-]{7,20}$/.test(trimmedPhone)) {
      setError("Please enter a valid phone number, or leave it blank.");
      return;
    }

    setLoading(true);
    try {
      const data = await submitWaitlist(trimmedEmail, trimmedName, trimmedPhone || undefined);
      if (data.error) {
        setError("Something went wrong. Please try again.");
        return;
      }
      const pos = data.position ?? data.count ?? liveCount + 1;
      setPosition(pos);
      setLiveCount(data.count ?? pos);
      setStep("success");
    } catch {
      setError("Network error. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  };

  const referralLink = `ecoplate.app/r/${name.trim().toLowerCase().replace(/\s+/g, "") || "invite"}${position ? position : ""}`;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(`https://${referralLink}`).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = () => {
    const text = `I just claimed my spot on EcoPlate - rescued meals at UCI for $3-5! Join me: https://${referralLink}`;
    if (navigator.share) {
      navigator.share({ title: "EcoPlate", text }).catch(() => {});
    } else {
      navigator.clipboard.writeText(text).catch(() => {});
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleAddToCalendar = () => {
    const start = "20260914T090000";
    const end = "20260914T100000";
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=EcoPlate+Launch+at+UCI&dates=${start}/${end}&details=EcoPlate+launches+at+Brandywine+and+Anteatery!+Check+ecoplate.app+for+your+first+Rescue+Box.&location=UC+Irvine`;
    window.open(url, "_blank");
  };

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end justify-center"
      style={{ backgroundColor: "rgba(10,28,10,0.65)", backdropFilter: "blur(6px)" }}
    >
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 260, damping: 32 }}
        className="w-full max-w-md relative flex flex-col"
        style={{
          backgroundColor: "#F9F6F1",
          borderRadius: "2rem 2rem 0 0",
          maxHeight: "92dvh",
          overflowY: "auto",
        }}
      >
        {/* Pill handle + subtle close */}
        <div className="flex items-center justify-between pt-3 pb-1 px-5">
          <div className="w-5" />
          <div
            className="w-10 h-1 rounded-full"
            style={{ backgroundColor: "rgba(0,104,56,0.2)" }}
          />
          <button
            onClick={onClose}
            aria-label="Close"
            className="w-5 h-5 flex items-center justify-center rounded-full transition-opacity"
            style={{ opacity: 0.18 }}
          >
            <X className="w-3 h-3" style={{ color: "#7A6B5A" }} />
          </button>
        </div>

        <AnimatePresence mode="wait">
          {/* ── HERO ─────────────────────────────────────────────────────────── */}
          {step === "hero" && (
            <motion.div
              key="hero"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col px-6 pb-10"
            >
              {/* Logo + badge */}
              <div className="flex flex-col gap-3 mt-2 mb-4">
                <div className="flex items-center justify-between">
                  <EcoplateLogo
                    iconSize={34}
                    label="EcoPlate"
                    textColor="#1C2B1C"
                    fontSize="1rem"
                  />
                  <span
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-full shrink-0"
                    style={{
                      backgroundColor: "#006838",
                      color: "white",
                      fontSize: "0.72rem",
                      fontWeight: 700,
                      boxShadow: "0 2px 8px rgba(0,104,56,0.3)",
                    }}
                  >
                    <Sparkles className="w-3 h-3" />
                    Launching Fall 2026 at UCI
                  </span>
                </div>
              </div>

              {/* Hero image strip */}
              <div
                className="w-full rounded-2xl mb-3 overflow-hidden"
                style={{ height: 160, backgroundColor: "#006838", position: "relative" }}
              >
                <img
                  src="https://images.unsplash.com/photo-1504674900247-0877df9cc836?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"
                  alt="Fresh campus food"
                  className="w-full h-full object-cover opacity-60"
                />
                <div
                  className="absolute inset-0 flex flex-col justify-end p-4"
                  style={{
                    background:
                      "linear-gradient(to top, rgba(0,40,20,0.85) 0%, transparent 60%)",
                  }}
                >
                  <p
                    className="text-white"
                    style={{ fontSize: "1.375rem", fontWeight: 800, lineHeight: 1.2 }}
                  >
                    Rescue tonight's meals.
                    <br />
                    Beat food waste at UCI.
                  </p>
                </div>
              </div>

              {/* One-liner */}
              <p className="text-center mb-4" style={{ fontSize: "0.85rem", color: "#4A3728", fontWeight: 500 }}>
                Freshly rescued meals - reserved in 30 seconds
              </p>

              {/* Price transparency */}
              <div
                className="flex items-center justify-center gap-2 mb-5 px-3 py-2 rounded-xl"
                style={{ backgroundColor: "#FEF3C7", border: "1px solid #FCD34D" }}
              >
                <Tag className="w-3.5 h-3.5" style={{ color: "#92400E" }} />
                <p style={{ fontSize: "0.78rem", fontWeight: 700, color: "#92400E" }}>
                  Rescue Boxes from $3&ndash;5 each
                </p>
              </div>

              {/* Perks */}
              <div className="space-y-3 mb-5">
                {PERKS.map((perk, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: -16 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.05 + i * 0.07 }}
                    className="flex items-start gap-3 p-3.5 rounded-xl shadow-sm"
                    style={{
                      backgroundColor: "white",
                      border: "1px solid rgba(0,104,56,0.1)",
                    }}
                  >
                    <div
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5"
                      style={{ backgroundColor: "#E8F5EE" }}
                    >
                      {perk.icon}
                    </div>
                    <p style={{ fontSize: "0.825rem", color: "#2D3A2D", lineHeight: 1.45 }}>
                      {perk.label}
                    </p>
                  </motion.div>
                ))}
              </div>

              {/* How it works */}
              <div className="mb-5">
                <p
                  className="mb-3"
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    color: "#7A6B5A",
                  }}
                >
                  How it works in 3 steps
                </p>
                <div className="grid grid-cols-3 gap-2">
                  {HOW_IT_WORKS.map((s, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.15 + i * 0.08 }}
                      className="flex flex-col items-center text-center p-3 rounded-xl"
                      style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.1)" }}
                    >
                      <div
                        className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
                        style={{ backgroundColor: "#E8F5EE" }}
                      >
                        {s.icon}
                      </div>
                      <p style={{ fontSize: "0.75rem", fontWeight: 700, color: "#1C2B1C" }}>
                        {s.title}
                      </p>
                      <p style={{ fontSize: "0.65rem", color: "#7A6B5A", marginTop: 2 }}>
                        {s.desc}
                      </p>
                    </motion.div>
                  ))}
                </div>
              </div>

              {/* Live count nudge */}
              <div
                className="flex items-center gap-2 mb-5 px-3.5 py-2.5 rounded-xl"
                style={{
                  backgroundColor: "#E8F5EE",
                  border: "1px solid rgba(0,104,56,0.15)",
                }}
              >
                <div className="flex -space-x-2 shrink-0">
                  {["#7FB89A", "#5A9E78", "#3D7D58"].map((bg, i) => (
                    <div
                      key={i}
                      className="w-6 h-6 rounded-full border-2 border-white flex items-center justify-center"
                      style={{
                        backgroundColor: bg,
                        fontSize: "0.5rem",
                        color: "white",
                        fontWeight: 700,
                      }}
                    >
                      {["ZP", "AM", "KL"][i]}
                    </div>
                  ))}
                </div>
                <p style={{ fontSize: "0.775rem", color: "#006838", fontWeight: 500 }}>
                  <strong>
                    {liveCount > 0 ? `${liveCount}` : "-"} student
                    {liveCount !== 1 ? "s" : ""}
                  </strong>{" "}
                  {liveCount > 0 ? "already on the waitlist" : "on the waitlist - be first"}
                </p>
              </div>

              {/* CTA */}
              <button
                onClick={() => {
                  setStep("form");
                  setTimeout(() => nameRef.current?.focus(), 150);
                }}
                className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                style={{
                  backgroundColor: "#006838",
                  color: "white",
                  fontSize: "1.0625rem",
                  fontWeight: 700,
                  boxShadow: "0 6px 24px rgba(0,104,56,0.35)",
                }}
              >
                Claim Your Spot - It's Free
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* No download badge */}
              <p className="text-center mt-3" style={{ fontSize: "0.7rem", color: "#7A6B5A" }}>
                No download needed - works in your browser
              </p>

              {/* FAQ */}
              <div className="mt-6 mb-4">
                <p
                  className="mb-3"
                  style={{
                    fontSize: "0.72rem",
                    fontWeight: 700,
                    letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    color: "#7A6B5A",
                  }}
                >
                  Frequently Asked Questions
                </p>
                <div className="space-y-2">
                  {FAQ_ITEMS.map((faq, i) => (
                    <div
                      key={i}
                      className="rounded-xl overflow-hidden"
                      style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.1)" }}
                    >
                      <button
                        onClick={() => setOpenFaq(openFaq === i ? null : i)}
                        className="w-full flex items-center justify-between p-3 text-left"
                      >
                        <span style={{ fontSize: "0.8rem", fontWeight: 600, color: "#1C2B1C" }}>
                          {faq.q}
                        </span>
                        <ChevronDown
                          className="w-4 h-4 shrink-0 transition-transform"
                          style={{
                            color: "#7A6B5A",
                            transform: openFaq === i ? "rotate(180deg)" : "rotate(0deg)",
                          }}
                        />
                      </button>
                      <AnimatePresence>
                        {openFaq === i && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: "auto", opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="overflow-hidden"
                          >
                            <p
                              className="px-3 pb-3"
                              style={{ fontSize: "0.75rem", color: "#7A6B5A", lineHeight: 1.5 }}
                            >
                              {faq.a}
                            </p>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </div>

              {/* Staff button */}
              <button
                onClick={onStaffAccess}
                className="w-full mt-2 py-3 rounded-xl flex items-center justify-center gap-2"
                style={{
                  backgroundColor: "transparent",
                  border: "1.5px solid #8B6F47",
                  color: "#8B6F47",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                }}
              >
                <ShieldIcon className="w-3.5 h-3.5" />
                Dining Hall Staff Portal
              </button>

              {/* Footer links */}
              <div className="flex items-center justify-center gap-4 mt-4 mb-2">
                <button style={{ fontSize: "0.68rem", color: "#B0A898" }}>Terms of Service</button>
                <span style={{ color: "#D5CFC7" }}>|</span>
                <button style={{ fontSize: "0.68rem", color: "#B0A898" }}>Privacy Policy</button>
              </div>
            </motion.div>
          )}

          {/* ── FORM ─────────────────────────────────────────────────────────── */}
          {step === "form" && (
            <motion.div
              key="form"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -30 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col px-6 pb-10"
            >
              <div className="mt-4 mb-6">
                <button
                  onClick={() => setStep("hero")}
                  className="flex items-center gap-1 mb-4"
                  style={{ fontSize: "0.8rem", color: "#8B6F47" }}
                >
                  <ChevronRight className="w-3.5 h-3.5 rotate-180" />
                  Back
                </button>
                <h2 style={{ fontSize: "1.375rem", fontWeight: 800, color: "#1C2B1C" }}>
                  Claim your spot
                </h2>
                <p className="mt-1" style={{ fontSize: "0.875rem", color: "#7A6B5A" }}>
                  We'll notify you the moment EcoPlate goes live at Brandywine and Anteatery.
                </p>
              </div>

              {/* Live count mini badge */}
              {liveCount > 0 && (
                <div
                  className="flex items-center gap-1.5 mb-4 px-3 py-2 rounded-xl self-start"
                  style={{ backgroundColor: "#E8F5EE" }}
                >
                  <div
                    className="w-1.5 h-1.5 rounded-full"
                    style={{ backgroundColor: "#006838" }}
                  />
                  <p style={{ fontSize: "0.72rem", color: "#006838", fontWeight: 600 }}>
                    {liveCount} student{liveCount !== 1 ? "s" : ""} ahead of you - join now
                  </p>
                </div>
              )}

              {/* Inputs */}
              <div className="space-y-3 mb-2">
                <div
                  className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
                  style={{
                    backgroundColor: "white",
                    border: "1.5px solid rgba(0,104,56,0.18)",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                  }}
                >
                  <User className="w-4 h-4 shrink-0" style={{ color: "#8B6F47" }} />
                  <input
                    ref={nameRef}
                    type="text"
                    placeholder="First name"
                    value={name}
                    maxLength={100}
                    onChange={(e) => {
                      setName(e.target.value);
                      setError("");
                    }}
                    className="flex-1 bg-transparent outline-none"
                    style={{ fontSize: "0.9375rem", color: "#1C2B1C" }}
                    onKeyDown={(e) =>
                      e.key === "Enter" && document.getElementById("ep-email")?.focus()
                    }
                  />
                </div>

                <div>
                  <div
                    className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
                    style={{
                      backgroundColor: "white",
                      border: "1.5px solid rgba(0,104,56,0.18)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    }}
                  >
                    <Mail className="w-4 h-4 shrink-0" style={{ color: "#8B6F47" }} />
                    <input
                      id="ep-email"
                      type="email"
                      placeholder="your@email.com"
                      value={email}
                      maxLength={254}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setError("");
                      }}
                      className="flex-1 bg-transparent outline-none"
                      style={{ fontSize: "0.9375rem", color: "#1C2B1C" }}
                      onKeyDown={(e) => e.key === "Enter" && handleJoin()}
                      inputMode="email"
                      autoComplete="email"
                    />
                  </div>
                  <p className="mt-1.5 px-1" style={{ fontSize: "0.68rem", color: "#7A6B5A" }}>
                    We'll send a confirmation to your inbox right away
                  </p>
                </div>

                {/* Phone (optional) */}
                <div>
                  <div
                    className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
                    style={{
                      backgroundColor: "white",
                      border: "1.5px solid rgba(0,104,56,0.12)",
                      boxShadow: "0 2px 8px rgba(0,0,0,0.04)",
                    }}
                  >
                    <Phone className="w-4 h-4 shrink-0" style={{ color: "#8B6F47" }} />
                    <input
                      type="tel"
                      placeholder="(optional) Phone number"
                      value={phone}
                      maxLength={20}
                      onChange={(e) => setPhone(e.target.value)}
                      className="flex-1 bg-transparent outline-none"
                      style={{ fontSize: "0.9375rem", color: "#1C2B1C" }}
                      inputMode="tel"
                      autoComplete="tel"
                    />
                  </div>
                  <p className="mt-1.5 px-1" style={{ fontSize: "0.68rem", color: "#7A6B5A" }}>
                    Get a text when drops go live
                  </p>
                </div>
              </div>

              {/* Error */}
              <AnimatePresence>
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    className="mb-3 px-1"
                    style={{ fontSize: "0.8rem", color: "#C0392B" }}
                  >
                    {error}
                  </motion.p>
                )}
              </AnimatePresence>

              {/* Submit */}
              <button
                onClick={handleJoin}
                disabled={loading}
                className="w-full py-4 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-all mt-2"
                style={{
                  backgroundColor: loading ? "#5A9E78" : "#006838",
                  color: "white",
                  fontSize: "1.0625rem",
                  fontWeight: 700,
                  boxShadow: "0 6px 24px rgba(0,104,56,0.3)",
                  opacity: loading ? 0.85 : 1,
                }}
              >
                {loading ? (
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
                    Reserving your spot...
                  </>
                ) : (
                  <>
                    Get Priority Access
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <p className="text-center mt-3" style={{ fontSize: "0.72rem", color: "#B0A898" }}>
                No spam, ever. Unsubscribe any time.
              </p>

              {/* Staff button */}
              <button
                onClick={onStaffAccess}
                className="w-full mt-4 py-3 rounded-xl flex items-center justify-center gap-2"
                style={{
                  backgroundColor: "transparent",
                  border: "1.5px solid #8B6F47",
                  color: "#8B6F47",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                }}
              >
                <ShieldIcon className="w-3.5 h-3.5" />
                Dining Hall Staff Portal
              </button>
            </motion.div>
          )}

          {/* ── SUCCESS ──────────────────────────────────────────────────────── */}
          {step === "success" && (
            <motion.div
              key="success"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 240, damping: 22 }}
              className="flex flex-col items-center px-6 pb-10 pt-4"
            >
              {/* Close button */}
              <div className="w-full flex justify-end mb-2">
                <button
                  onClick={onClose}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-colors"
                  style={{ backgroundColor: "rgba(0,104,56,0.08)" }}
                  aria-label="Close and explore the app"
                >
                  <X className="w-4 h-4" style={{ color: "#7A6B5A" }} />
                </button>
              </div>

              {/* Checkmark */}
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 18, delay: 0.1 }}
                className="w-20 h-20 rounded-full flex items-center justify-center mb-4"
                style={{ backgroundColor: "#E8F5EE" }}
              >
                <CheckCircle2 className="w-10 h-10" style={{ color: "#006838" }} />
              </motion.div>

              <h2
                style={{
                  fontSize: "1.5rem",
                  fontWeight: 800,
                  color: "#1C2B1C",
                  textAlign: "center",
                }}
              >
                You're on the list!
              </h2>
              <p
                className="mt-2 text-center"
                style={{ fontSize: "0.9rem", color: "#7A6B5A", maxWidth: 300 }}
              >
                Hey {name.split(" ")[0]}, you're confirmed. We'll email{" "}
                <span style={{ color: "#006838", fontWeight: 600 }}>{email}</span> the moment
                EcoPlate launches at UCI.
              </p>

              {/* Queue position */}
              {position !== null && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.25 }}
                  className="mt-5 w-full rounded-2xl p-4 flex items-center gap-4"
                  style={{
                    backgroundColor: "white",
                    border: "1px solid rgba(0,104,56,0.12)",
                  }}
                >
                  <div
                    className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
                    style={{ backgroundColor: "#E8F5EE" }}
                  >
                    <span
                      style={{ fontSize: "1.0625rem", fontWeight: 800, color: "#006838" }}
                    >
                      #{position}
                    </span>
                  </div>
                  <div>
                    <p style={{ fontSize: "0.8rem", fontWeight: 700, color: "#1C2B1C" }}>
                      Your position in the queue
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "#7A6B5A" }}>
                      Earlier signups get first access and founding member pricing
                    </p>
                  </div>
                </motion.div>
              )}

              {/* Share with a friend */}
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                onClick={handleShare}
                className="w-full mt-5 py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                style={{
                  backgroundColor: "#006838",
                  color: "white",
                  fontSize: "0.9375rem",
                  fontWeight: 700,
                  boxShadow: "0 4px 16px rgba(0,104,56,0.25)",
                }}
              >
                <Share2 className="w-4 h-4" />
                Share with a friend - you both skip the line
              </motion.button>

              {/* Copyable referral link */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.35 }}
                className="w-full mt-3 flex items-center rounded-xl overflow-hidden"
                style={{ backgroundColor: "white", border: "1px solid rgba(0,104,56,0.12)" }}
              >
                <div
                  className="flex-1 px-3 py-2.5 truncate"
                  style={{ fontSize: "0.72rem", color: "#7A6B5A" }}
                >
                  https://{referralLink}
                </div>
                <button
                  onClick={handleCopyLink}
                  className="px-3 py-2.5 shrink-0 flex items-center gap-1"
                  style={{
                    backgroundColor: "#E8F5EE",
                    color: "#006838",
                    fontSize: "0.72rem",
                    fontWeight: 600,
                  }}
                >
                  {copied ? (
                    <>
                      <CheckCircle2 className="w-3 h-3" /> Copied
                    </>
                  ) : (
                    <>
                      <Copy className="w-3 h-3" /> Copy
                    </>
                  )}
                </button>
              </motion.div>

              {/* Explore the app */}
              <motion.button
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                onClick={onClose}
                className="w-full mt-3 py-3.5 rounded-2xl flex items-center justify-center gap-2 active:scale-[0.98] transition-transform"
                style={{
                  backgroundColor: "white",
                  color: "#006838",
                  fontSize: "0.9375rem",
                  fontWeight: 700,
                  border: "2px solid #006838",
                }}
              >
                Explore the App
                <ArrowRight className="w-4 h-4" />
              </motion.button>

              {/* What happens next */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.45 }}
                className="mt-5 w-full rounded-2xl p-4 space-y-2.5"
                style={{ backgroundColor: "#F0EBE3" }}
              >
                <p
                  style={{
                    fontSize: "0.75rem",
                    fontWeight: 700,
                    color: "#4A3728",
                    marginBottom: 4,
                  }}
                >
                  What happens next
                </p>
                {[
                  "We'll confirm your spot via email",
                  "We're launching at Brandywine and Anteatery this fall",
                  "You'll get 48h early access before public launch",
                ].map((s, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div
                      className="w-4 h-4 rounded-full flex items-center justify-center mt-0.5 shrink-0"
                      style={{ backgroundColor: "#006838" }}
                    >
                      <span style={{ fontSize: "0.5rem", fontWeight: 800, color: "white" }}>
                        {i + 1}
                      </span>
                    </div>
                    <p style={{ fontSize: "0.78rem", color: "#7A6B5A" }}>{s}</p>
                  </div>
                ))}
              </motion.div>

              {/* Expected launch + Add to Calendar */}
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="w-full mt-4 flex flex-col items-center gap-3"
              >
                <p style={{ fontSize: "0.82rem", fontWeight: 700, color: "#006838" }}>
                  Expected launch: September 2026
                </p>
                <button
                  onClick={handleAddToCalendar}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl active:scale-[0.98] transition-transform"
                  style={{
                    border: "1.5px solid #006838",
                    color: "#006838",
                    fontSize: "0.8rem",
                    fontWeight: 600,
                    backgroundColor: "transparent",
                  }}
                >
                  <CalendarPlus className="w-4 h-4" />
                  Add to Calendar
                </button>
              </motion.div>

              {/* No commitment */}
              <p className="text-center mt-4" style={{ fontSize: "0.72rem", color: "#B0A898" }}>
                No commitment. Unsubscribe any time.
              </p>

              {/* Staff access */}
              <button
                onClick={onStaffAccess}
                className="w-full mt-3 py-3 rounded-xl flex items-center justify-center gap-2"
                style={{
                  backgroundColor: "transparent",
                  border: "1.5px solid #8B6F47",
                  color: "#8B6F47",
                  fontSize: "0.8rem",
                  fontWeight: 600,
                }}
              >
                <ShieldIcon className="w-3.5 h-3.5" />
                Dining Hall Staff Portal
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}