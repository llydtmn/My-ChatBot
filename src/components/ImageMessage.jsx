export default function ImageMessage({ src, caption = "" }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "3px" }}>
      <div className="msg-label">whatTheLlyd</div>
      <div className="msg bot" style={{ padding: "8px" }}>
        <img className="msg-image" src={src} alt={caption} onClick={() => window.open(src, "_blank")} />
        {caption && (
          <div style={{ fontSize: "11px", color: "var(--text-dim)", marginTop: "6px" }}>{caption}</div>
        )}
      </div>
    </div>
  );
}
