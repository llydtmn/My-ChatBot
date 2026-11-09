import { supabase } from "./supabaseClient";

const ID_KEY = "llyd_device_id";
const SESSION_KEY = "llyd_visit_logged";
let started = false;

// A random ID kept in this browser. No IP address, name or account is stored.
export function getDeviceId() {
  try {
    let id = localStorage.getItem(ID_KEY);
    if (!id) {
      id = crypto.randomUUID();
      localStorage.setItem(ID_KEY, id);
    }
    return id;
  } catch {
    return null; // storage blocked (e.g. some private modes): skip tracking
  }
}

function describeDevice() {
  const ua = navigator.userAgent || "";

  let os = "Other";
  if (/Windows/i.test(ua)) os = "Windows";
  else if (/Android/i.test(ua)) os = "Android";
  else if (/iPhone|iPad|iPod/i.test(ua)) os = "iOS";
  else if (/CrOS/i.test(ua)) os = "ChromeOS";
  else if (/Macintosh|Mac OS X/i.test(ua)) os = navigator.maxTouchPoints > 1 ? "iPadOS" : "macOS";
  else if (/Linux/i.test(ua)) os = "Linux";

  let browser = "Other";
  if (/Edg\//i.test(ua)) browser = "Edge";
  else if (/OPR\/|Opera/i.test(ua)) browser = "Opera";
  else if (/SamsungBrowser/i.test(ua)) browser = "Samsung Internet";
  else if (/Firefox\/|FxiOS/i.test(ua)) browser = "Firefox";
  else if (/Chrome\/|CriOS/i.test(ua)) browser = "Chrome";
  else if (/Safari\//i.test(ua)) browser = "Safari";

  let deviceType = "desktop";
  if (/iPad|Tablet/i.test(ua) || os === "iPadOS" || (os === "Android" && !/Mobile/i.test(ua))) {
    deviceType = "tablet";
  } else if (/Mobi|iPhone|Android/i.test(ua)) {
    deviceType = "mobile";
  }

  return { os, browser, deviceType };
}

// Reports one visit per browser session, so refreshing the page doesn't inflate the count.
export async function trackVisit() {
  if (!supabase || started) return;
  started = true;

  try {
    if (sessionStorage.getItem(SESSION_KEY)) return;
    const deviceId = getDeviceId();
    if (!deviceId) return;

    const { os, browser, deviceType } = describeDevice();
    const installed =
      window.matchMedia?.("(display-mode: standalone)").matches || navigator.standalone === true;

    const { error } = await supabase.rpc("record_visit", {
      p_device_id: deviceId,
      p_device_type: deviceType,
      p_os: os,
      p_browser: browser,
      p_installed: Boolean(installed),
    });

    if (error) console.warn("Could not record visit:", error.message);
    else sessionStorage.setItem(SESSION_KEY, "1");
  } catch (error) {
    console.warn("Could not record visit:", error);
  }
}

// ---- Admin only (row-level security blocks everyone else) ----

function ensureSupabase() {
  if (!supabase) throw new Error("Supabase is not configured. Check your .env file.");
}

function friendly(error) {
  const message = error?.message || String(error);
  if (/relation .*devices.* does not exist|schema cache/i.test(message)) {
    return new Error("Device tracking isn't set up yet. Run supabase_devices.sql in Supabase first.");
  }
  return new Error(message);
}

export async function listDevices() {
  ensureSupabase();
  const { data, error } = await supabase
    .from("devices")
    .select("device_id, label, device_type, os, browser, installed, first_seen, last_seen, visit_count")
    .order("last_seen", { ascending: false })
    .limit(500);
  if (error) throw friendly(error);
  return data ?? [];
}

export async function renameDevice(deviceId, label) {
  ensureSupabase();
  const clean = label.trim().slice(0, 60);
  const { data, error } = await supabase
    .from("devices")
    .update({ label: clean || null })
    .eq("device_id", deviceId)
    .select("device_id, label");
  if (error) throw friendly(error);
  if (!data?.length) throw new Error("Not allowed. Sign in with the admin account.");
  return data[0].label;
}

export async function deleteDevice(deviceId) {
  ensureSupabase();
  const { data, error } = await supabase
    .from("devices")
    .delete()
    .eq("device_id", deviceId)
    .select("device_id");
  if (error) throw friendly(error);
  if (!data?.length) throw new Error("Not allowed. Sign in with the admin account.");
}
