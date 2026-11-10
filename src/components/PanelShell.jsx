import Icon from "./icons";

// Full-screen page used by Media, About, Contact and Privacy.
export default function PanelShell({ title, subtitle, onClose, onMenu, children }) {
  return (
    <div className="panel-overlay" role="dialog" aria-modal="true" aria-label={title}>
      <div className="panel-card">
        <header className="panel-header">
          <button className="menu-btn" onClick={onClose} aria-label="Back to chat">
            <Icon name="back" />
          </button>
          <div className="panel-title">
            <h2>{title}</h2>
            {subtitle && <p>{subtitle}</p>}
          </div>
          <button className="menu-btn menu-open-btn" onClick={onMenu} aria-label="Open menu" aria-haspopup="true">
            <Icon name="menu" />
          </button>
        </header>
        <div className="panel-body">{children}</div>
      </div>
    </div>
  );
}
