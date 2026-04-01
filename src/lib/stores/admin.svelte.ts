import { goto } from "$app/navigation";
import { toast } from "svelte-sonner";
import * as api from "$lib/api";
import { signIn, signOut } from "$lib/auth";
import { getBrowserSupabase } from "$lib/supabase";
import { DEFAULT_STATS } from "$lib/constants";
import type { AdminStats, Drop } from "$lib/types";

let stats = $state<AdminStats>(DEFAULT_STATS);
let editingDrop = $state<Drop | null>(null);
let noShows = $state<api.NoShowEntry[]>([]);
let noShowsLoading = $state(false);
let recentRedemptions = $state<{ code: string; time: string; location: string }[]>([]);

export const adminStore = {
  get stats() {
    return stats;
  },
  get editingDrop() {
    return editingDrop;
  },
  get noShows() {
    return noShows;
  },
  get noShowsLoading() {
    return noShowsLoading;
  },
  get recentRedemptions() {
    return recentRedemptions;
  },
  async loadStats() {
    try {
      stats = await api.getAdminStats();
    } catch (e) {
      toast.error((e as Error).message || "Failed to load stats");
    }
  },
  async handleAdminLogin(email: string, password: string) {
    const result = await signIn(email, password);
    if ("error" in result) {
      toast.error(result.error);
      return false;
    }

    const sb = getBrowserSupabase();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if ((user?.user_metadata?.role as string | undefined) !== "admin") {
      await signOut();
      toast.error("Admin access required");
      return false;
    }

    await goto("/admin");
    return true;
  },
  async handleDropSubmit(
    payload: {
      location: string;
      locationDetail: string;
      boxes: number;
      windowStart: string;
      windowEnd: string;
      priceMin: number;
      priceMax: number;
      description: string;
      imageUrl: string;
      dailyCap: number;
      consecutiveWeeksAbove85: number;
    },
    options?: { redirectDelayMs?: number }
  ) {
    try {
      await api.createDrop(payload);
      toast.success("Drop created");
      await this.loadStats();
      const delay = Math.max(0, options?.redirectDelayMs ?? 0);
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
      await goto("/admin");
      return true;
    } catch (e) {
      toast.error((e as Error).message || "Failed to create drop");
      return false;
    }
  },
  async handleRedeemCode(code: string) {
    try {
      const result = await api.redeemCode(code);
      if (!result.valid) {
        toast.error(result.reason ?? "Invalid code");
        return result;
      }

      recentRedemptions = [
        {
          code,
          time: new Date().toLocaleTimeString(),
          location: result.location ?? "Unknown",
        },
        ...recentRedemptions,
      ].slice(0, 10);

      toast.success("Code redeemed");
      await this.loadStats();
      return result;
    } catch (e) {
      toast.error((e as Error).message || "Failed to redeem code");
      return { valid: false, reason: (e as Error).message };
    }
  },
  async loadNoShows() {
    noShowsLoading = true;
    try {
      noShows = await api.getNoShows();
    } catch (e) {
      toast.error((e as Error).message || "Failed to load no-shows");
    } finally {
      noShowsLoading = false;
    }
  },
  async handleMarkNoShow(reservationId: string, boxStatus: "released" | "donated" | "disposed") {
    try {
      await api.markNoShow(reservationId, boxStatus);
      await this.loadNoShows();
      toast.success("No-show updated");
    } catch (e) {
      toast.error((e as Error).message || "Failed to mark no-show");
    }
  },
  handleEditDrop(drop: Drop) {
    editingDrop = drop;
  },
  async handleSaveDropEdits(dropId: string, updates: Partial<Drop>) {
    try {
      const updated = await api.updateDrop(dropId, updates);
      editingDrop = updated;
      toast.success("Drop updated");
    } catch (e) {
      toast.error((e as Error).message || "Failed to save drop edits");
    }
  },
  async handleDeleteDrop(dropId: string) {
    try {
      await api.deleteDrop(dropId);
      toast.success("Drop deleted");
      await this.loadStats();
    } catch (e) {
      toast.error((e as Error).message || "Failed to delete drop");
    }
  },
  async handleAdminLogout() {
    await signOut();
    await goto("/admin/login");
  },
};
