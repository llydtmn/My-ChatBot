import { supabase } from "./supabaseClient";
import { addInfo } from "./adminService";

const LABELS = { link: "Link", photo: "Photo", video: "Video", music: "Music", file: "File" };

// One line per entry, e.g.  Photo: "Graduation day" | Me in my toga | URL: https://...
function formatEntry(row) {
  if (!row.kind || row.kind === "text") return row.content;
  const parts = [`${LABELS[row.kind] || "Item"}: "${row.title || "Untitled"}"`];
  if (row.content) parts.push(row.content);
  if (row.url) parts.push(`URL: ${row.url}`);
  return parts.join(" | ");
}

/**
 * Loads what you saved in the admin dashboard. It is public-read, so every
 * visitor's chat gets it. If anything fails, chat still works without it.
 * Returns an array of strings to preserve the existing chatService contract.
 */
export async function loadExtraInfo() {
  if (!supabase) return [];

  let { data, error } = await supabase
    .from("owner_info")
    .select("kind, title, url, content")
    .order("created_at", { ascending: true });

  if (error) {
    // Older table without the media columns: fall back to plain text entries.
    ({ data, error } = await supabase
      .from("owner_info")
      .select("content")
      .order("created_at", { ascending: true }));
  }

  if (error) {
    console.warn("Could not load owner info:", error.message);
    return [];
  }
  return (data ?? []).map(formatEntry).filter(Boolean);
}

// Kept so existing imports keep working. Only the admin account can save.
export async function addExtraInfo(content) {
  return addInfo({ kind: "text", description: content });
}

export async function getExtraInfoBlock() {
  const items = await loadExtraInfo();
  if (!items.length) return "";

  return (
    "\n\n=== ADDITIONAL INFO (added by John Lloyd) ===\n" +
    "Entries labeled Link, Photo, Video, Music or File have a URL. When a visitor asks to see, " +
    "hear or open one, put its exact URL on its own line. Copy URLs exactly. " +
    "Never invent, shorten or change a URL.\n" +
    items.map((value, index) => `${index + 1}. ${value}`).join("\n") +
    "\n=== END ADDITIONAL INFO ==="
  );
}
