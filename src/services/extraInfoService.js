import { getCurrentUser, supabase } from "./supabaseClient";

function ensureSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured. Check your .env file.");
  }
}

/**
 * Loads developer-provided information belonging to the current user.
 * Returns an array of strings to preserve the existing chatService contract.
 */
export async function loadExtraInfo() {
  ensureSupabase();
  await getCurrentUser();

  const { data, error } = await supabase
    .from("developer_info")
    .select("id, content, created_at")
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []).map((item) => item.content);
}

export async function addExtraInfo(content) {
  ensureSupabase();
  const user = await getCurrentUser();
  const cleanContent = String(content ?? "").trim();

  if (!cleanContent) {
    throw new Error("Please enter information before saving.");
  }

  const { data, error } = await supabase
    .from("developer_info")
    .insert({
      user_id: user.id,
      content: cleanContent,
    })
    .select("id, content, created_at")
    .single();

  if (error) throw error;
  return data;
}

export async function getExtraInfoBlock() {
  const items = await loadExtraInfo();
  if (!items.length) return "";

  return (
    "\n\n=== ADDITIONAL INFO (added by developer) ===\n" +
    items.map((value, index) => `${index + 1}. ${value}`).join("\n") +
    "\n=== END ADDITIONAL INFO ==="
  );
}
