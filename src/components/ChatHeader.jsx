export default function ChatHeader({ onBack }) {
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
          <strong>Llyd-Bot</strong>
          <span>
            <span className="status-dot"></span>Active · Ask about Lloyd
          </span>
        </div>
      </div>
      <div className="header-label">AI</div>
    </div>
  );
}