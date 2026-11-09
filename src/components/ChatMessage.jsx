import { Fragment } from "react";

// Same line-breaking rules as the original site, rendered as React nodes (no innerHTML).
function renderBulletText(text) {
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
        {line}
      </Fragment>
    );
  });
}

const systemStyle = { borderLeft: "2px solid #4ade80", color: "#4ade80", opacity: 0.85 };

export default function ChatMessage({ role, text, isSystem, isError }) {
  const isUser = role === "user";
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: isUser ? "flex-end" : "flex-start", gap: "3px" }}>
      <div className="msg-label">{isUser ? "you" : "llyd-bot"}</div>
      <div className={`msg ${role}${isError ? " error" : ""}`} style={isSystem ? systemStyle : undefined}>
        {text.includes("•") ? renderBulletText(text) : text}
      </div>
    </div>
  );
}
