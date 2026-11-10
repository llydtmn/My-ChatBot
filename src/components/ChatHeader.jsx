import Icon from "./icons";

export default function ChatHeader({ onBack, onMenu }) {
  return (
    <div className="chat-header">
      <button className="back-btn" onClick={onBack} title="Back">
        <i className="fas fa-arrow-left"></i>
      </button>
      <div className="header-info">
        <div className="header-avatar">
          <i className="fas fa-robot"></i>
        </div>
        <div className="header-text">
          <strong>whatTheLlyd</strong>
          <span>
            <span className="status-dot"></span>Active · Ask about Lloyd
          </span>
        </div>
      </div>
      <div className="header-label">AI</div>
      <button className="menu-btn menu-open-btn" onClick={onMenu} aria-label="Open menu" aria-haspopup="true">
        <Icon name="menu" />
      </button>
    </div>
  );
}