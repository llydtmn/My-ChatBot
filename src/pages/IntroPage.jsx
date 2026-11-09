import { useRef } from "react";

// Hidden shortcut to the admin dashboard: tap "Llyd-Bot" 5 times in a row,
// with no more than 2 seconds between taps. Nothing about it is visible.
const SECRET_TAPS = 5;
const MAX_GAP_MS = 2000;

const secretStyle = {
  userSelect: "none",
  WebkitUserSelect: "none",
  WebkitTapHighlightColor: "transparent",
  touchAction: "manipulation",
};

export default function IntroPage({ hidden, onEnter }) {
  const taps = useRef({ count: 0, last: 0 });

  const handleSecretTap = () => {
    const now = Date.now();
    const t = taps.current;
    t.count = now - t.last > MAX_GAP_MS ? 1 : t.count + 1;
    t.last = now;

    if (t.count >= SECRET_TAPS) {
      t.count = 0;
      window.location.hash = "#/admin";
    }
  };

  return (
    <div id="intro-screen" className={hidden ? "hidden" : ""}>
      <div className="intro-grain"></div>
      <div className="intro-content">
        <div className="intro-badge">Personal AI Companion</div>
        <h1 className="intro-name">Lloyd<br /><em>Bot</em></h1>
        <div className="intro-divider"></div>
        <p className="intro-desc">
          Meet <strong onClick={handleSecretTap} style={secretStyle}>Llyd-Bot</strong> — an intelligent assistant built to answer anything about John Lloyd. His skills, experience, personality, and how to reach him. All in one conversation.
        </p>
        <button className="intro-enter-btn" onClick={onEnter}>
          <i className="fas fa-arrow-right"></i>
        </button>
      </div>
      <div className="intro-footer">lloyd.design &nbsp;·&nbsp; bsit student &nbsp;·&nbsp; open to work</div>
    </div>
  );
}
