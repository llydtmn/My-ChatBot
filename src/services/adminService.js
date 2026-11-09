import { supabase } from "./supabaseClient";

const BUCKET = "owner-media";
export const MAX_FILE_BYTES = 50 * 1024 * 1024;
export const KINDS = ["text", "link", "photo", "video", "music", "file"];
const COLUMNS = "id, kind, title, url, storage_path, content, created_at";
const MIME_PREFIX = { photo: "image/", video: "video/", music: "audio/" };

function ensureSupabase() {
  if (!supabase) {
    throw new Error("Supabase is not configured. Check your .env file.");
  }
}

// Turn raw Supabase errors into messages that say what to do.
function friendly(error) {
  const message = error?.message || String(error);
  if (/bucket not found/i.test(message)) {
    return new Error("Uploads aren't set up yet. Run supabase_media_upgrade.sql in Supabase first.");
  }
  if (/schema cache|column .* does not exist|violates check constraint/i.test(message)) {
    return new Error("The database needs the upgrade. Run supabase_media_upgrade.sql in Supabase first.");
  }
  return new Error(message);
}

// Visitors get anonymous sessions for chat history; only a real account is an admin.
export async function getAdminSession() {
  ensureSupabase();
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  const session = data.session;
  return session && !session.user.is_anonymous ? session : null;
}

export function onAdminAuthChange(callback) {
  ensureSupabase();
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session && !session.user.is_anonymous ? session : null);
  });
  return () => data.subscription.unsubscribe();
}

export async function signInAdmin(email, password) {
  ensureSupabase();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) throw error;
}

export async function signOutAdmin() {
  ensureSupabase();
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

export async function listInfo() {
  ensureSupabase();
  const { data, error } = await supabase
    .from("owner_info")
    .select(COLUMNS)
    .order("created_at", { ascending: true });
  if (error) throw friendly(error);
  return data ?? [];
}

function normalizeUrl(value) {
  let url = value.trim();
  if (/^[a-z][a-z0-9+.-]*:/i.test(url) && !/^https?:\/\//i.test(url)) {
    throw new Error("Links must start with http:// or https://");
  }
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  try {
    new URL(url);
  } catch {
    throw new Error("That link doesn't look right. Check the URL.");
  }
  return url;
}

function validateFields({ kind, title, description, url, hasFile }) {
  if (!KINDS.includes(kind)) throw new Error("Unknown entry type.");
  if (description.length > 2000) throw new Error("Keep descriptions under 2,000 characters.");
  if (title.length > 120) throw new Error("Keep titles under 120 characters.");

  if (kind === "text") {
    if (!description) throw new Error("Enter some information first.");
    return;
  }
  if (!title) throw new Error("Add a title.");
  if (kind === "link" && !url) throw new Error("Add the link's URL.");
  if (kind !== "link" && !hasFile && !url) throw new Error("Choose a file or paste a link.");
}

async function uploadFile(kind, file) {
  if (file.size > MAX_FILE_BYTES) throw new Error("Files can be up to 50 MB. For big videos, paste a YouTube link instead.");
  const prefix = MIME_PREFIX[kind];
  if (prefix && !file.type.startsWith(prefix)) {
    throw new Error(`That file isn't a ${kind === "music" ? "music/audio" : kind} file.`);
  }

  const ext = (file.name.split(".").pop() || "bin").toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 8) || "bin";
  // Short names keep URLs short, so the bot copies them exactly.
  const path = `${kind}/${crypto.randomUUID().slice(0, 8)}.${ext}`;

  const { error } = await supabase.storage.from(BUCKET).upload(path, file, {
    contentType: file.type || "application/octet-stream",
    cacheControl: "31536000",
    upsert: false,
  });
  if (error) throw friendly(error);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return { path, url: data.publicUrl };
}

export async function addInfo({ kind = "text", title = "", url = "", description = "", file = null }) {
  ensureSupabase();
  const clean = { kind, title: title.trim(), description: description.trim(), url: url.trim() };
  validateFields({ ...clean, hasFile: Boolean(file) });

  let storagePath = null;
  let finalUrl = null;

  if (file && kind !== "text" && kind !== "link") {
    const uploaded = await uploadFile(kind, file);
    storagePath = uploaded.path;
    finalUrl = uploaded.url;
  } else if (clean.url) {
    finalUrl = normalizeUrl(clean.url);
  }

  const { data, error } = await supabase
    .from("owner_info")
    .insert({
      kind,
      title: clean.title || null,
      url: finalUrl,
      storage_path: storagePath,
      content: clean.description,
    })
    .select(COLUMNS)
    .single();

  if (error) {
    if (storagePath) await supabase.storage.from(BUCKET).remove([storagePath]);
    throw friendly(error);
  }
  return data;
}

// Edits text, title, link URL and description. To replace an uploaded file, delete and re-add.
export async function updateInfo(item, { title = "", url = "", description = "" }) {
  ensureSupabase();
  const clean = { kind: item.kind, title: title.trim(), description: description.trim(), url: url.trim() };
  validateFields({ ...clean, hasFile: Boolean(item.storage_path) });

  const patch = { title: clean.title || null, content: clean.description };
  if (!item.storage_path && item.kind !== "text") patch.url = normalizeUrl(clean.url);

  const { data, error } = await supabase
    .from("owner_info")
    .update(patch)
    .eq("id", item.id)
    .select(COLUMNS);
  if (error) throw friendly(error);
  // Row-level security returns zero rows (no error) when you're not the admin.
  if (!data?.length) throw new Error("Not allowed. Sign in with the admin account.");
  return data[0];
}

export async function deleteInfo(item) {
  ensureSupabase();
  const { data, error } = await supabase
    .from("owner_info")
    .delete()
    .eq("id", item.id)
    .select("id");
  if (error) throw friendly(error);
  if (!data?.length) throw new Error("Not allowed. Sign in with the admin account.");

  if (item.storage_path) {
    const { error: removeError } = await supabase.storage.from(BUCKET).remove([item.storage_path]);
    if (removeError) console.warn("Entry deleted, but the file could not be removed:", removeError.message);
  }
}
