import { goto } from "$app/navigation";
import { toast } from "svelte-sonner";
import * as api from "$lib/api";
import { signUp } from "$lib/auth";
import { markFirstOrderPlaced } from "$lib/auth";
import { DEFAULT_USER } from "$lib/constants";
import type { Drop, Reservation, UserState } from "$lib/types";

let drops = $state<Drop[]>([]);
let dropsLoading = $state(true);
let selectedDrop = $state<Drop | null>(null);
let reservation = $state<Reservation | null>(null);
let user = $state<UserState>(DEFAULT_USER);
let waitlistedDropIds = $state<Set<string>>(new Set());

export const appStore = {
  get drops() {
    return drops;
  },
  get dropsLoading() {
    return dropsLoading;
  },
  get selectedDrop() {
    return selectedDrop;
  },
  get reservation() {
    return reservation;
  },
  get user() {
    return user;
  },
  get waitlistedDropIds() {
    return waitlistedDropIds;
  },
  async loadDrops() {
    dropsLoading = true;
    try {
      drops = await api.getDrops();
    } catch (e) {
      toast.error((e as Error).message || "Failed to load drops");
    } finally {
      dropsLoading = false;
    }
  },
  async loadUser(userId: string) {
    try {
      user = await api.getUser(userId);
    } catch {
      user = { ...DEFAULT_USER };
    }
  },
  async loadReservation(userId: string) {
    try {
      const reservations = await api.getReservations(userId);
      reservation = reservations.find((r) => r.status === "reserved") ?? null;
    } catch {
      reservation = null;
    }
  },
  async handleSelectDrop(drop: Drop) {
    selectedDrop = drop;
    await goto(`/drop/${drop.id}`);
  },
  async handleReserve(drop: Drop) {
    selectedDrop = drop;
    await goto(`/drop/${drop.id}/reserve`);
  },
  async handleConfirmReservation(payload: {
    dropId: string;
    userId: string;
    paymentMethod: "card" | "credit" | "pay_at_pickup";
    cardLast4?: string;
  }) {
    try {
      const data = await api.createReservation(payload);
      reservation = data.reservation;
      selectedDrop = data.drop;
      markFirstOrderPlaced();
      await this.loadDrops();
      await this.loadUser(payload.userId);
      await goto(`/drop/${payload.dropId}/pickup`);
      toast.success("Reservation confirmed", {
        description: "Staff will verify your order shortly.",
      });
    } catch (e) {
      toast.error((e as Error).message || "Failed to reserve");
      throw e;
    }
  },
  async handleCancelReservation(userId: string) {
    if (!reservation) return;
    try {
      reservation = await api.cancelReservation(reservation.id);
      await this.loadDrops();
      await this.loadUser(userId);
      await this.loadReservation(userId);
      toast.success("Reservation cancelled");
      await goto("/");
    } catch (e) {
      toast.error((e as Error).message || "Failed to cancel reservation");
    }
  },
  async handlePickedUp() {
    await goto("/rating");
  },
  async handleRate(rating: number, userId: string, isGuest = false) {
    if (!reservation) return;
    const pickupsBefore = user.totalPickups;
    try {
      await api.submitRating(reservation.id, rating, userId);
      reservation = null;
      await this.loadUser(userId);
      await this.loadDrops();
      toast.success("Thanks for the rating");
      if (isGuest && pickupsBefore >= 4) {
        await goto("/post-order-signup");
      } else {
        await goto("/");
      }
    } catch (e) {
      toast.error((e as Error).message || "Failed to submit rating");
    }
  },
  async handleSkipRating(isGuest = false) {
    const pickupsBefore = user.totalPickups;
    reservation = null;
    // totalPickups was already incremented server-side by /redeem
    if (isGuest && pickupsBefore >= 4) {
      await goto("/post-order-signup");
    } else {
      await goto("/");
    }
  },
  async handleWaitlist(dropId: string, userId: string) {
    try {
      await api.joinWaitlist(dropId, userId);
      waitlistedDropIds = new Set([...waitlistedDropIds, dropId]);
      toast.success("Added to waitlist");
    } catch (e) {
      toast.error((e as Error).message || "Failed to join waitlist");
    }
  },
  async handleUpdatePlan(
    userId: string,
    membership: UserState["membership"],
    creditsRemaining: number
  ) {
    try {
      user = await api.updateUser(userId, { membership, creditsRemaining });
      toast.success("Plan updated");
      await goto("/");
    } catch (e) {
      toast.error((e as Error).message || "Failed to update plan");
    }
  },
  async handleViewCode(dropId: string) {
    await goto(`/drop/${dropId}/pickup`);
  },
  async handlePostOrderSignUp(email: string, password: string, name: string) {
    const result = await signUp(email, password, name);
    if ("error" in result) {
      toast.error(result.error);
      return { success: false as const };
    }
    toast.success("Account created");
    await goto("/");
    return { success: true as const, userId: result.userId };
  },
};
