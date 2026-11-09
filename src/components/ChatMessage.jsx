import { Fragment } from "react";

// Only files from your own Supabase Storage are embedded. Other URLs stay plain links.
const SUPABASE_URL = (import.meta.env.VITE_SUPABASE_URL || "").trim().replace(/\/$/, "");
const STORAGE_PREFIX = SUPABASE_URL ? `${SUPABASE_URL}/storage/v1/object/public/` : null;

const URL_RE = /https?:\/\/[^\s<>"]+/g;
const IMAGE_RE = /\.(jpe?g|png|gif|webp|avif)$/i;
const AUDIO_RE = /\.(mp3|wav|ogg|m4a|aac)$/i;
const VIDEO_RE = /\.(mp4|webm|mov|m4v)$/i;

const mediaStyle = { display: "block", marginTop: "6px", maxWidth: "100%" };

function splitTrailing(raw) {
  const match = raw.match(/[.,!?;:)\]]+$/);
  return match ? [raw.slice(0, -match[0].length), match[0]] : [raw, ""];
}

function renderUrl(url, key) {
  const embeddable = STORAGE_PREFIX && url.startsWith(STORAGE_PREFIX);
  if (embeddable && IMAGE_RE.test(url)) {
    return (
      <img key={key} className="msg-image" style={mediaStyle} src={url} alt="" loading="lazy"
        onClick={() => window.open(url, "_blank", "noopener")} />
    );
  }
  if (embeddable && AUDIO_RE.test(url)) {
    return <audio key={key} style={{ ...mediaStyle, width: "100%" }} src={url} controls preload="none" />;
  }
  if (embeddable && VIDEO_RE.test(url)) {
    return <video key={key} style={mediaStyle} src={url} controls preload="metadata" playsInline />;
  }
  return (
    <a key={key} href={url} target="_blank" rel="noopener noreferrer"
      style={{ color: "inherit", textDecoration: "underline", wordBreak: "break-all" }}>
      {url}
    </a>
  );
}

// Turns URLs in the bot's text into links or inline media (React nodes, no innerHTML).
function renderRich(text, keyPrefix = "t") {
  const nodes = [];
  let last = 0;
  let i = 0;
  for (const match of text.matchAll(URL_RE)) {
    const [url, trailing] = splitTrailing(match[0]);
    if (match.index > last) nodes.push(text.slice(last, match.index));
    nodes.push(renderUrl(url, `${keyPrefix}-${i++}`));
    if (trailing) nodes.push(trailing);
    last = match.index + match[0].length;
  }
  if (last < text.length) nodes.push(text.slice(last));
  return nodes;
}

// Same line-breaking rules as the original site, rendered as React nodes (no innerHTML).
function renderBulletText(text, rich) {
  const lines = text
    .replace(/•/g, "\n•")
    .replace(/([^•\n])(\s+(?:He|She|And|But|Also|His|Her|They|John|The)\s)/g, "$1\n\n$2")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);

  return lines.map((line, i) => {
    const isBullet = line.startsWith("•");
    const prevIsBullet = (lines[i - 1] || "").startsWith("•");
    const extraBreak = isBullet !== prevIsBullet;
    return (
      <Fragment key={i}>
        {i > 0 && <br />}
        {extraBreak && <br />}
        {rich ? renderRich(line, `l${i}`) : line}
      </Fragment>
    );
  });
}

const systemStyle = { borderLeft: "2px solid #4ade80", color: "#4ade80", opacity: 0.85 };

export default function ChatMessage({ role, text, isSystem, isError }) {
  const isUser = role === "user";
  const rich = !isUser && !isError && !isSystem;

  let body;
  if (text.includes("•")) body = renderBulletText(text, rich);
  else body = rich ? renderRich(text) : text;

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start", gap: "3px" }}>
      <div className="msg-label">{isUser ? "you" : "llyd-bot"}</div>
      <div className={`msg ${role}${isError ? " error" : ""}`} style={isSystem ? systemStyle : undefined}>
        {body}
      </div>
    </div>
  );
}
