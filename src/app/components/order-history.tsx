import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Clock,
  MapPin,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Package,
  ChevronRight,
  Star,
  QrCode,
  RefreshCw,
} from "lucide-react";
import { EcoplateLogo } from "./ecoplate-logo";
import type { Reservation } from "./ecoplate-types";
import * as api from "../api";

interface OrderHistoryProps {
  sessionId: string;
  activeReservation: Reservation | null;
  onViewActivePickup: () => void;
}

type FilterTab = "all" | "active" | "completed" | "cancelled";

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; bg: string; icon: React.ReactNode }
> = {
  reserved: {
    label: "Active",
    color: "#006838",
    bg: "#E8F5EE",
    icon: <Clock className="w-3.5 h-3.5" />,
  },
  picked_up: {
    label: "Picked Up",
    color: "#006838",
    bg: "#E8F5EE",
    icon: <CheckCircle2 className="w-3.5 h-3.5" />,
  },
  cancelled: {
    label: "Cancelled",
    color: "#92400E",
    bg: "#FEF3C7",
    icon: <XCircle className="w-3.5 h-3.5" />,
  },
  no_show: {
    label: "No-Show",
    color: "#DC2626",
    bg: "#FEE2E2",
    icon: <AlertTriangle className="w-3.5 h-3.5" />,
  },
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;

  return d.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: d.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function formatTime(time: string): string {
  const [h, m] = time.split(":").map(Number);
  const ampm = h >= 12 ? "PM" : "AM";
  const hour = h % 12 || 12;
  return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`;
}

export function OrderHistory({
  sessionId,
  activeReservation,
  onViewActivePickup,
}: OrderHistoryProps) {
  const [orders, setOrders] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<FilterTab>("all");
  const [refreshing, setRefreshing] = useState(false);
  const mountedRef = useRef(true);

  const loadOrders = async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const res = await api.getReservations(sessionId);
      if (mountedRef.current) {
        setOrders(
          res.sort(
            (a, b) =>
              new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
          )
        );
      }
    } catch (err) {
      console.error("Failed to load order history:", err);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  useEffect(() => {
    mountedRef.current = true;
    loadOrders();
    return () => {
      mountedRef.current = false;
    };
  }, [sessionId]);

  const filtered = orders.filter((o) => {
    if (filter === "all") return true;
    if (filter === "active") return o.status === "reserved";
    if (filter === "completed") return o.status === "picked_up";
    if (filter === "cancelled")
      return o.status === "cancelled" || o.status === "no_show";
    return true;
  });

  const totalSpent = orders
    .filter((o) => o.status === "picked_up")
    .reduce((sum, o) => sum + (o.currentPrice ?? 0), 0);
  const totalPickups = orders.filter((o) => o.status === "picked_up").length;

  const FILTERS: { id: FilterTab; label: string }[] = [
    { id: "all", label: "All" },
    { id: "active", label: "Active" },
    { id: "completed", label: "Completed" },
    { id: "cancelled", label: "Cancelled" },
  ];

  return (
    <div
      className="flex flex-col min-h-screen"
      style={{ backgroundColor: "#F9F6F1" }}
    >
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="px-5 pt-12 pb-5"
        style={{
          background: "linear-gradient(135deg, #006838 0%, #004D2A 100%)",
        }}
      >
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-2.5">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ backgroundColor: "rgba(255,255,255,0.18)" }}
            >
              <Package className="w-5 h-5 text-white" />
            </div>
            <span
              className="text-white"
              style={{ fontWeight: 800, fontSize: "1.2rem" }}
            >
              Order History
            </span>
          </div>
          <button
            onClick={() => loadOrders(true)}
            className="p-2 rounded-xl active:scale-95 transition-transform"
            style={{ backgroundColor: "rgba(255,255,255,0.12)" }}
          >
            <RefreshCw
              className={`w-4 h-4 text-white ${refreshing ? "animate-spin" : ""}`}
            />
          </button>
        </div>
        <p
          className="text-white/70 mt-1"
          style={{ fontSize: "0.8rem" }}
        >
          Your past and current Rescue Box reservations
        </p>
      </motion.div>

      {/* Summary strip */}
      {totalPickups > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="mx-4 -mt-3 rounded-2xl p-3.5 flex items-center justify-around shadow-sm"
          style={{
            backgroundColor: "white",
            border: "1px solid rgba(0,104,56,0.1)",
          }}
        >
          <div className="text-center">
            <p
              style={{
                fontSize: "1.1rem",
                fontWeight: 800,
                color: "#006838",
              }}
            >
              {totalPickups}
            </p>
            <p style={{ fontSize: "0.65rem", color: "#7A6B5A", fontWeight: 500 }}>
              Pickups
            </p>
          </div>
          <div
            className="w-px h-8"
            style={{ backgroundColor: "rgba(0,104,56,0.1)" }}
          />
          <div className="text-center">
            <p
              style={{
                fontSize: "1.1rem",
                fontWeight: 800,
                color: "#006838",
              }}
            >
              ${totalSpent.toFixed(0)}
            </p>
            <p style={{ fontSize: "0.65rem", color: "#7A6B5A", fontWeight: 500 }}>
              Total Saved
            </p>
          </div>
          <div
            className="w-px h-8"
            style={{ backgroundColor: "rgba(0,104,56,0.1)" }}
          />
          <div className="text-center">
            <p
              style={{
                fontSize: "1.1rem",
                fontWeight: 800,
                color: "#006838",
              }}
            >
              {orders.length}
            </p>
            <p style={{ fontSize: "0.65rem", color: "#7A6B5A", fontWeight: 500 }}>
              Total Orders
            </p>
          </div>
        </motion.div>
      )}

      {/* Active reservation banner */}
      {activeReservation && activeReservation.status === "reserved" && (
        <motion.button
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          onClick={onViewActivePickup}
          className="mx-4 mt-3 rounded-2xl p-3.5 flex items-center gap-3 active:scale-[0.99] transition-transform"
          style={{
            backgroundColor: "#E8F5EE",
            border: "2px solid #006838",
          }}
        >
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{ backgroundColor: "#006838" }}
          >
            <QrCode className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p
              style={{
                fontSize: "0.85rem",
                fontWeight: 700,
                color: "#006838",
              }}
            >
              Active Pickup
            </p>
            <p style={{ fontSize: "0.72rem", color: "#5A9E78" }}>
              {activeReservation.dropLocation} &middot; Code:{" "}
              {activeReservation.pickupCode}
            </p>
          </div>
          <ChevronRight
            className="w-5 h-5 shrink-0"
            style={{ color: "#006838" }}
          />
        </motion.button>
      )}

      {/* Filter tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex gap-2 px-4 mt-4 mb-3"
      >
        {FILTERS.map((f) => (
          <button
            key={f.id}
            onClick={() => setFilter(f.id)}
            className="px-3.5 py-1.5 rounded-full transition-all"
            style={{
              backgroundColor:
                filter === f.id ? "#006838" : "white",
              color: filter === f.id ? "white" : "#7A6B5A",
              fontSize: "0.73rem",
              fontWeight: 600,
              border: `1px solid ${filter === f.id ? "#006838" : "rgba(0,104,56,0.12)"}`,
            }}
          >
            {f.label}
          </button>
        ))}
      </motion.div>

      {/* Orders list */}
      <div className="flex-1 px-4 pb-28 overflow-y-auto">
        {loading ? (
          <div className="space-y-3 mt-1">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="rounded-2xl p-4 animate-pulse"
                style={{ backgroundColor: "white" }}
              >
                <div className="flex gap-3">
                  <div
                    className="w-16 h-16 rounded-xl"
                    style={{ backgroundColor: "#EDE8E1" }}
                  />
                  <div className="flex-1 space-y-2">
                    <div
                      className="h-4 w-3/4 rounded"
                      style={{ backgroundColor: "#EDE8E1" }}
                    />
                    <div
                      className="h-3 w-1/2 rounded"
                      style={{ backgroundColor: "#EDE8E1" }}
                    />
                    <div
                      className="h-3 w-1/3 rounded"
                      style={{ backgroundColor: "#EDE8E1" }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center py-16 text-center"
          >
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
              style={{ backgroundColor: "#EDE8E1" }}
            >
              <Package className="w-7 h-7" style={{ color: "#B0A898" }} />
            </div>
            <p
              style={{
                fontSize: "0.95rem",
                fontWeight: 700,
                color: "#1C2B1C",
                marginBottom: 4,
              }}
            >
              {filter === "all"
                ? "No orders yet"
                : `No ${filter} orders`}
            </p>
            <p style={{ fontSize: "0.78rem", color: "#7A6B5A" }}>
              {filter === "all"
                ? "Reserve a Rescue Box from the Home tab to get started."
                : "Try switching to a different filter."}
            </p>
          </motion.div>
        ) : (
          <AnimatePresence mode="popLayout">
            <div className="space-y-3">
              {filtered.map((order, idx) => {
                const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.reserved;
                return (
                  <motion.div
                    key={order.id}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    transition={{ delay: idx * 0.04 }}
                    className="rounded-2xl p-4 shadow-sm"
                    style={{
                      backgroundColor: "white",
                      border: `1px solid ${order.status === "reserved" ? "#006838" : "rgba(0,104,56,0.08)"}`,
                    }}
                  >
                    <div className="flex gap-3">
                      {/* Image */}
                      <div
                        className="w-16 h-16 rounded-xl bg-cover bg-center shrink-0"
                        style={{
                          backgroundImage: order.dropImageUrl
                            ? `url(${order.dropImageUrl})`
                            : undefined,
                          backgroundColor: order.dropImageUrl
                            ? undefined
                            : "#EDE8E1",
                        }}
                      />

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className="truncate"
                            style={{
                              fontSize: "0.88rem",
                              fontWeight: 700,
                              color: "#1C2B1C",
                            }}
                          >
                            {order.dropLocation}
                          </p>
                          {/* Status badge */}
                          <span
                            className="flex items-center gap-1 px-2 py-0.5 rounded-full shrink-0"
                            style={{
                              backgroundColor: cfg.bg,
                              color: cfg.color,
                              fontSize: "0.6rem",
                              fontWeight: 700,
                            }}
                          >
                            {cfg.icon}
                            {cfg.label}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 mt-1">
                          <MapPin
                            className="w-3 h-3 shrink-0"
                            style={{ color: "#B0A898" }}
                          />
                          <p
                            className="truncate"
                            style={{
                              fontSize: "0.72rem",
                              color: "#7A6B5A",
                            }}
                          >
                            {order.dropLocationDetail}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 mt-1.5">
                          <div className="flex items-center gap-1">
                            <Clock
                              className="w-3 h-3 shrink-0"
                              style={{ color: "#B0A898" }}
                            />
                            <span
                              style={{
                                fontSize: "0.68rem",
                                color: "#7A6B5A",
                              }}
                            >
                              {formatTime(order.dropWindowStart)} &ndash;{" "}
                              {formatTime(order.dropWindowEnd)}
                            </span>
                          </div>
                          <span
                            style={{
                              fontSize: "0.68rem",
                              color: "#B0A898",
                            }}
                          >
                            {formatDate(order.createdAt)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Bottom row: price + rating + code */}
                    <div
                      className="flex items-center justify-between mt-3 pt-2.5"
                      style={{ borderTop: "1px solid rgba(0,104,56,0.06)" }}
                    >
                      <div className="flex items-center gap-3">
                        <span
                          style={{
                            fontSize: "0.82rem",
                            fontWeight: 800,
                            color: "#006838",
                          }}
                        >
                          ${(order.currentPrice ?? 0).toFixed(2)}
                        </span>
                        <span
                          className="px-1.5 py-0.5 rounded-md"
                          style={{
                            fontSize: "0.6rem",
                            fontWeight: 600,
                            backgroundColor: "#F5F1EB",
                            color: "#7A6B5A",
                          }}
                        >
                          {order.paymentMethod === "credit"
                            ? "Credit"
                            : order.paymentMethod === "card"
                              ? "Card"
                              : "Pay at Pickup"}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {order.rating && (
                          <div className="flex items-center gap-0.5">
                            <Star
                              className="w-3 h-3"
                              style={{ color: "#F59E0B", fill: "#F59E0B" }}
                            />
                            <span
                              style={{
                                fontSize: "0.68rem",
                                fontWeight: 600,
                                color: "#7A6B5A",
                              }}
                            >
                              {order.rating}
                            </span>
                          </div>
                        )}
                        {order.status === "reserved" && (
                          <span
                            className="font-mono"
                            style={{
                              fontSize: "0.72rem",
                              fontWeight: 700,
                              color: "#006838",
                              letterSpacing: "0.1em",
                            }}
                          >
                            {order.pickupCode}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
}
