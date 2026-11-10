import { supabase } from "./supabaseClient";

function friendly(error) {
  const message = error?.message || String(error);
  if (/bot_monitoring|bot_events|schema cache|does not exist/i.test(message)) {
    return new Error("Monitoring isn't set up yet. Run supabase_monitoring.sql in Supabase first.");
  }
  return new Error(message);
}

/** Summary numbers + chart buckets for the last `hours` hours. */
export async function getMonitoring(hours) {
  if (!supabase) throw new Error("Supabase is not configured. Check your .env file.");
  const { data, error } = await supabase.rpc("bot_monitoring", { range_hours: hours });
  if (error) throw friendly(error);
  return data;
}

/** Newest problems first (errors, blocked and invalid requests). */
export async function getRecentIssues(limit = 15) {
  if (!supabase) throw new Error("Supabase is not configured. Check your .env file.");
  const { data, error } = await supabase
    .from("bot_events")
    .select("id, created_at, status, http_status, latency_ms, model, error")
    .neq("status", "ok")
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw friendly(error);
  return data ?? [];
}

/** Zero the token counts on every logged request. Requests, errors and visitors are kept. */
export async function resetTokens() {
  if (!supabase) throw new Error("Supabase is not configured. Check your .env file.");
  const { error } = await supabase.rpc("reset_bot_tokens");
  if (error) {
    if (/reset_bot_tokens|schema cache|could not find the function/i.test(error.message || "")) {
      throw new Error("Reset isn't set up yet. Run supabase_reset_tokens.sql in Supabase first.");
    }
    throw new Error(error.message || String(error));
  }
}