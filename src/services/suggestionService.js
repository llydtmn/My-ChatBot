import { supabase } from "./supabaseClient";
import { SUGGESTIONS } from "../data/mockData";

const TABLE = "suggested_questions";
const COLUMNS = "id, question, sort_order, created_at";
export const MAX_QUESTION_LENGTH = 120;

function ensureSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured. Check your .env file.");
  }
}

function friendly(error) {
  const message = error?.message || String(error);
  if (/relation .* does not exist|schema cache|Could not find the table/i.test(message)) {
    return new Error("The database needs the upgrade. Run supabase_suggested_questions.sql in Supabase first.");
  }
  return new Error(message);
}

function clean(question) {
  const value = String(question ?? "").trim().replace(/\s+/g, " ");
  if (!value) throw new Error("Enter a question first.");
  if (value.length > MAX_QUESTION_LENGTH) {
    throw new Error(`Keep questions under ${MAX_QUESTION_LENGTH} characters.`);
  }
  return value;
}

/**
 * Public read used by the chat dropdown. Falls back to the built-in defaults
 * only when Supabase is unreachable or the table doesn't exist yet. An empty
 * table is respected (the admin removed everything on purpose).
 */
export async function loadSuggestions() {
  if (!supabase) return SUGGESTIONS;
  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select("id, question")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true });
    if (error) throw error;
    return (data ?? []).map((row) => row.question);
  } catch (error) {
    console.warn("Could not load suggested questions:", error?.message || error);
    return SUGGESTIONS;
  }
}

/** Calls onChange whenever the admin adds/edits/deletes a question. */
export function subscribeToSuggestions(onChange) {
  if (!supabase) return () => {};
  const channel = supabase
    .channel(`suggested-questions-${Math.random().toString(36).slice(2)}`)
    .on("postgres_changes", { event: "*", schema: "public", table: TABLE }, onChange)
    .subscribe();
  return () => {
    supabase.removeChannel(channel);
  };
}

export async function listSuggestionRows() {
  ensureSupabase();
  const { data, error } = await supabase
    .from(TABLE)
    .select(COLUMNS)
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) throw friendly(error);
  return data ?? [];
}

export async function addSuggestion(question, currentRows = []) {
  ensureSupabase();
  const value = clean(question);
  const nextOrder = currentRows.reduce((max, row) => Math.max(max, row.sort_order ?? 0), 0) + 1;

  const { data, error } = await supabase
    .from(TABLE)
    .insert({ question: value, sort_order: nextOrder })
    .select(COLUMNS)
    .single();
  if (error) throw friendly(error);
  return data;
}

export async function updateSuggestion(id, question) {
  ensureSupabase();
  const value = clean(question);
  const { data, error } = await supabase
    .from(TABLE)
    .update({ question: value })
    .eq("id", id)
    .select(COLUMNS);
  if (error) throw friendly(error);
  // Row-level security returns zero rows (no error) when you're not the admin.
  if (!data?.length) throw new Error("Not allowed. Sign in with the admin account.");
  return data[0];
}

export async function deleteSuggestion(id) {
  ensureSupabase();
  const { data, error } = await supabase.from(TABLE).delete().eq("id", id).select("id");
  if (error) throw friendly(error);
  if (!data?.length) throw new Error("Not allowed. Sign in with the admin account.");
}

// Swap the order of two rows so the admin can move a question up or down.
export async function swapOrder(a, b) {
  ensureSupabase();
  const [first, second] = await Promise.all([
    supabase.from(TABLE).update({ sort_order: b.sort_order }).eq("id", a.id).select("id"),
    supabase.from(TABLE).update({ sort_order: a.sort_order }).eq("id", b.id).select("id"),
  ]);
  const error = first.error || second.error;
  if (error) throw friendly(error);
  if (!first.data?.length || !second.data?.length) {
    throw new Error("Not allowed. Sign in with the admin account.");
  }
}
