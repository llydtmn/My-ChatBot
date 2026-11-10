import { useEffect, useRef } from "react";
import Icon from "./icons";
import useSecretAdminTap from "../hooks/useSecretAdminTap";

// "chat" is the main screen (the New Chat button); the rest open as pages.
export const MENU_ITEMS = [
  { id: "media", label: "Media", hint: "Photos, videos, music, links and files", icon: "media" },
  { id: "about", label: "About", hint: "About this system", icon: "about" },
  { id: "contact", label: "Contact", hint: "How to reach Lloyd", icon: "contact" },
  { id: "privacy", label: "Privacy", hint: "What is stored, and why", icon: "privacy" },
];

// modal = phone/tablet drawer (X button, dimmed page).
// not modal = desktop docked sidebar (arrow button, page shifts over).
export default function Sidebar({ open, active, modal, chats = [], onSelect, onNewChat, onClose }) {
  const closeRef = useRef(null);
  const lastFocus = useRef(null);
  const handleSecretTap = useSecretAdminTap();

  // Drawer only: move focus into the menu when it opens and back out when it closes.
  useEffect(() => {
    if (!modal) return;
    if (open) {
      lastFocus.current = document.activeElement;
      closeRef.current?.focus();
    } else if (lastFocus.current) {
      lastFocus.current.focus?.();
      lastFocus.current = null;
    }
  }, [open, modal]);

  return (
    <>
      <div className={`sidebar-scrim${open ? " open" : ""}`} onClick={onClose} aria-hidden="true" />
      <nav className={`sidebar${open ? " open" : ""}`} aria-label="Main menu" aria-hidden={!open}>
        <div className="sidebar-head">
          <div className="sidebar-brand">
            <span className="brand-orb" aria-hidden="true" />
            <strong onClick={handleSecretTap}>whatTheLlyd</strong>
          </div>
          <button
            ref={closeRef}
            className="menu-btn sidebar-close"
            onClick={onClose}
            aria-label={modal ? "Close menu" : "Hide sidebar"}
            title={modal ? "Close menu" : "Hide sidebar"}
          >
            <Icon name={modal ? "close" : "chevronLeft"} />
          </button>
        </div>

        <button className="sidebar-new" onClick={onNewChat}>
          <Icon name="newChat" size={18} />
          <span>New Chat</span>
        </button>

        <div className="sidebar-scroll">
          <p className="sidebar-label">Features</p>
          <ul className="sidebar-list">
            {MENU_ITEMS.map((item) => (
              <li key={item.id}>
                <button
                  className={`sidebar-item${active === item.id ? " active" : ""}`}
                  onClick={() => onSelect(item.id)}
                  aria-current={active === item.id ? "page" : undefined}
                  title={item.hint}
                >
                  <Icon name={item.icon} size={17} />
                  <span>{item.label}</span>
                </button>
              </li>
            ))}
          </ul>

          {chats.length > 0 && (
            <>
              <p className="sidebar-label">Your chats</p>
              <ul className="sidebar-list sidebar-chats">
                {chats.map((chat) => (
                  <li key={chat.id} title={chat.title}>
                    {chat.title}
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>

        <p className="sidebar-foot">lloyd.design · bsit student · open to work</p>
      </nav>
    </>
  );
}
