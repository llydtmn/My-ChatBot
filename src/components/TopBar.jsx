import Icon from "./icons";
import avatar from "../assets/images/ID_Pic.webp";

const LINKS = [
  { id: "chat", label: "Chat" },
  { id: "media", label: "Media" },
  { id: "about", label: "About" },
  { id: "contact", label: "Contact" },
];

export default function TopBar({ showMenu, onMenu, active, onSelect }) {
  return (
    <header className="topbar">
      <div className="topbar-left">
        {showMenu && (
          <button className="menu-btn" onClick={onMenu} aria-label="Open menu" aria-haspopup="true">
            <Icon name="menu" />
          </button>
        )}
        <div className="model-pill">
          <Icon name="sliders" size={14} />
          <span>whatTheLlyd</span>
          <span className="status-dot" aria-hidden="true" />
        </div>
      </div>

      <nav className="topbar-nav" aria-label="Sections">
        {LINKS.map((l) => (
          <button
            key={l.id}
            className={`topbar-link${active === l.id ? " active" : ""}`}
            onClick={() => onSelect(l.id)}
            aria-current={active === l.id ? "page" : undefined}
          >
            {l.label}
          </button>
        ))}
        <img className="topbar-avatar" src={avatar} alt="Lloyd" />
      </nav>
    </header>
  );
}
