import { browser } from "$app/environment";
import { getBrowserSupabase } from "$lib/supabase";

export async function load({ data }: { data: App.PageData }) {
  if (browser) {
    getBrowserSupabase();
  }

  return {
    session: data.session,
  };
}
