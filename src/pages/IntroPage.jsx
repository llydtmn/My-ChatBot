import { useEffect } from "react";
import Icon from "../components/icons";
import useSecretAdminTap from "../hooks/useSecretAdminTap";

const TOPICS = [
  { icon: "about", label: "Skills & experience" },
  { icon: "media", label: "Photos & music" },
  { icon: "contact", label: "How to reach him" },
];

// Full-screen welcome. Entering the chat is one-way: once `hidden`, the only
// way back here is to reload the page.
export default function IntroPage({ hidden, onEnter }) {
  const handleSecretTap = useSecretAdminTap();

  // Enter works from anywhere on this screen.
  useEffect(() => {
    if (hidden) return;
    const onKey = (e) => {
      if (e.key === "Enter") onEnter();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [hidden, onEnter]);

  return (
    <div id="intro-screen" className={hidden ? "hidden" : ""} aria-hidden={hidden}>
      <div className="intro-grain" />

      <div className="intro-content">
        <div className="intro-orb" aria-hidden="true">
          <span className="intro-ring" />
          <span className="intro-core" />
        </div>

        <p className="intro-badge">Personal AI companion</p>

        <h1 className="intro-name">
          whatThe<em>Llyd</em>
        </h1>

        <p className="intro-desc">
          Meet{" "}
          <strong onClick={handleSecretTap} className="intro-secret">
            whatTheLlyd
          </strong>
          , an assistant built to answer anything about Lloyd, in one conversation.
        </p>

        <ul className="intro-topics" aria-label="What you can ask about">
          {TOPICS.map((t) => (
            <li key={t.label}>
              <Icon name={t.icon} size={15} />
              <span>{t.label}</span>
            </li>
          ))}
        </ul>

        <button className="intro-enter-btn" onClick={onEnter}>
          <span>Start chatting</span>
          <Icon name="arrowRight" size={16} />
        </button>
      </div>

      <p className="intro-footer">lloyd.design · bsit student · open to work</p>
    </div>
  );
}
