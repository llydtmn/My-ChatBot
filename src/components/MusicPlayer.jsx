import { SONGS } from "../data/mockData";

const buttonStyle = {
  background: "none", border: "1px solid var(--border)", color: "var(--text-dim)",
  width: "28px", height: "28px", borderRadius: "2px", cursor: "pointer",
  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", flexShrink: 0,
};

export default function MusicPlayer({ songIndex, isPlaying, onToggle }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "3px" }}>
      <div className="msg-label">llyd-bot</div>
      <div className="msg bot" style={{ padding: "10px 12px", display: "flex", alignItems: "center", gap: "10px" }}>
        <button style={buttonStyle} onClick={onToggle}>
          <i className={`fas ${isPlaying ? "fa-pause" : "fa-play"}`}></i>
        </button>
        <span style={{ fontSize: "11px", letterSpacing: "0.08em", color: "var(--text-dim)" }}>
          {SONGS[songIndex].label}
        </span>
      </div>
    </div>
  );
}
