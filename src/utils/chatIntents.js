import { IMAGE_MAP } from "../data/mockData";

export const DEV_TRIGGER_PATTERNS = [
  /@llyd/i, /developer\s*mode/i, /dev\s*mode/i,
  /\badd\s+(this\s+)?(info|information)\b/i,
  /\bupdate\s+(this\s+)?(info|information)\b/i,
  /\bedit\s+(this\s+)?(info|information)\b/i,
  /\badd\s+to\s+(the\s+)?(system|bot|info)\b/i,
  /\bupdate\s+the\s+(system|bot|info)\b/i,
];

export const isDevTrigger = (msg) => DEV_TRIGGER_PATTERNS.some((p) => p.test(msg));

const pickRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Returns an { src, caption } image, or null if the message isn't asking for a photo.
export function getImageForMessage(msg) {
  if (!/photo|picture|pic|image|look like|face|selfie|show.*lloyd/i.test(msg)) return null;

  if (/grad(uation)?/i.test(msg)) return IMAGE_MAP.graduation;
  if (/\bid\b|formal/i.test(msg)) return IMAGE_MAP.id;
  if (/friend|classmate|college.?mate|bro|barkada|group/i.test(msg))
    return pickRandom([IMAGE_MAP.mates, IMAGE_MAP.bro]);
  if (/party|night|fun|vibes/i.test(msg)) return IMAGE_MAP.party;
  if (/memor|travel|trip|ride|adventure/i.test(msg))
    return pickRandom([IMAGE_MAP.memories, IMAGE_MAP.rides]);
  return pickRandom([IMAGE_MAP.profile, IMAGE_MAP.casual1, IMAGE_MAP.casual2]);
}

// Returns { type: "play", index }, { type: "list" }, or null.
export function getMusicIntent(msg) {
  if (/rainbow|gatton/i.test(msg) || /comfort song|comfort/i.test(msg)) return { type: "play", index: 0 };
  if (/japanese denim|daniel caesar/i.test(msg) || /favorite song|favorite/i.test(msg)) return { type: "play", index: 1 };
  if (/music|song|playlist|play|listen|what.*listen/i.test(msg)) return { type: "list" };
  return null;
}
