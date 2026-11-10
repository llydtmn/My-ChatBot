import { supabase } from "./supabaseClient";
import { IMAGE_MAP, SONGS } from "../data/mockData";

export const MEDIA_KINDS = [
  { id: "photo", label: "Photos" },
  { id: "video", label: "Videos" },
  { id: "music", label: "Music" },
  { id: "link", label: "Links" },
  { id: "file", label: "Files" },
];

// Only ever hand http(s) addresses to the page.
export function safeUrl(value) {
  try {
    const url = new URL(value, window.location.href);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : null;
  } catch {
    return null;
  }
}

// Photos and songs that ship with the site.
function builtInItems() {
  const photos = Object.entries(IMAGE_MAP).map(([key, photo]) => ({
    id: `builtin-photo-${key}`,
    kind: "photo",
    title: photo.caption,
    description: "",
    url: photo.src,
  }));
  const songs = SONGS.map((song, index) => ({
    id: `builtin-music-${index}`,
    kind: "music",
    title: song.label,
    description: "",
    url: song.src,
  }));
  return [...photos, ...songs];
}

/**
 * Everything shown on the Media page: what you add in the admin dashboard
 * (newest first) followed by the photos and songs built into the site.
 */
export async function loadMedia() {
  const builtIn = builtInItems();
  if (!supabase) return { items: builtIn, warning: "" };

  const { data, error } = await supabase
    .from("owner_info")
    .select("id, kind, title, url, content, created_at")
    .in("kind", MEDIA_KINDS.map((kind) => kind.id))
    .not("url", "is", null)
    .order("created_at", { ascending: false });

  if (error) {
    const oldTable = /column|schema cache/i.test(error.message || "");
    return {
      items: builtIn,
      warning: oldTable ? "" : "Couldn't load the newest items right now.",
    };
  }

  const added = (data ?? []).map((row) => ({
    id: row.id,
    kind: row.kind,
    title: row.title || "Untitled",
    description: row.content || "",
    url: row.url,
  }));
  return { items: [...added, ...builtIn], warning: "" };
}
