import { json } from "@sveltejs/kit";
import { set } from "$lib/kv";
import { getAdminSupabase } from "$lib/supabase-server";
import { defaultUserState } from "$lib/server/helpers";

export async function POST({ request }: { request: Request }) {
  try {
    const { email, password, name } = await request.json();

    if (!email || typeof email !== "string" || !email.includes("@")) {
      return json({ error: "Valid email is required" }, { status: 400 });
    }
    if (!password || typeof password !== "string" || password.length < 6) {
      return json({ error: "Password must be at least 6 characters" }, { status: 400 });
    }
    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return json({ error: "Name is required" }, { status: 400 });
    }

    const supabase = getAdminSupabase();
    const { data, error } = await supabase.auth.admin.createUser({
      email: email.trim().toLowerCase(),
      password,
      user_metadata: { name: name.trim() },
      email_confirm: true,
    });

    if (error) {
      console.log("Signup error:", error.message);
      return json({ error: error.message }, { status: 400 });
    }

    const userId = data.user.id;

    await set(`user:${userId}`, {
      ...defaultUserState(),
      hasAccount: true,
      isFirstTime: false,
      name: name.trim(),
      email: email.trim().toLowerCase(),
    });

    console.log("User created successfully:", userId);
    return json({ userId, email: data.user.email });
  } catch (e) {
    console.log("Error in signup:", e);
    return json({ error: `Signup failed: ${e}` }, { status: 500 });
  }
}
