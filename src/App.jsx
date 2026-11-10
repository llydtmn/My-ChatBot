import { useEffect, useRef, useState } from "react";
import BackgroundEffects from "./components/BackgroundEffects";
import IntroPage from "./pages/IntroPage";
import ChatPage from "./pages/ChatPage";
import AdminPage from "./pages/AdminPage";
import Sidebar from "./components/Sidebar";
import useMediaQuery from "./hooks/useMediaQuery";
import MediaPanel from "./components/MediaPanel";
import { AboutPanel, ContactPanel, PrivacyPanel } from "./components/InfoPanels";
import { trackVisit } from "./services/deviceService";
import { listConversations } from "./services/chatHistoryService";

const isAdminHash = () => window.location.hash === "#/admin";

const SIDEBAR_KEY = "llyd-sidebar-collapsed";
const readCollapsed = () => {
  try {
    return localStorage.getItem(SIDEBAR_KEY) === "1";
  } catch {
    return false;
  }
};

export default function App() {
  // The intro shows on every page load. Entering the chat is one-way: there is
  // no way back to the intro except reloading the page.
  const [introHidden, setIntroHidden] = useState(false);
  const shellRef = useRef(null);
  const [showAdmin, setShowAdmin] = useState(isAdminHash);
  const [resetSignal, setResetSignal] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false); // phone/tablet drawer
  const [collapsed, setCollapsed] = useState(readCollapsed); // desktop docked sidebar
  const isDesktop = useMediaQuery("(min-width: 900px)");
  const [panel, setPanel] = useState(null); // "media" | "about" | "contact" | "privacy" | null
  const [chats, setChats] = useState([]);

  // Count this device once per browser session.
  useEffect(() => {
    trackVisit();
  }, []);

  // Keep the app out of reach (focus, screen readers) until the intro is dismissed.
  useEffect(() => {
    const el = shellRef.current;
    if (!el) return;
    if (introHidden) el.removeAttribute("inert");
    else el.setAttribute("inert", "");
  }, [introHidden]);

  // The dashboard lives at /#/admin (works on Vercel with no extra config).
  useEffect(() => {
    const onHashChange = () => setShowAdmin(isAdminHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Recent chats for the sidebar: on load, and again whenever a new chat starts.
  useEffect(() => {
    let alive = true;
    listConversations().then((list) => alive && setChats(list));
    return () => {
      alive = false;
    };
  }, [resetSignal]);

  const sidebarOpen = isDesktop ? !collapsed : menuOpen;
  const docked = !showAdmin && isDesktop && !collapsed;

  const openSidebar = () => {
    if (isDesktop) updateCollapsed(false);
    else setMenuOpen(true);
  };
  const closeSidebar = () => {
    if (isDesktop) updateCollapsed(true);
    else setMenuOpen(false);
  };
  function updateCollapsed(value) {
    setCollapsed(value);
    try {
      localStorage.setItem(SIDEBAR_KEY, value ? "1" : "0");
    } catch {
      /* private mode: just don't remember it */
    }
  }

  // On desktop the page shifts over to make room for the docked sidebar.
  useEffect(() => {
    document.body.classList.toggle("sidebar-docked", docked);
    return () => document.body.classList.remove("sidebar-docked");
  }, [docked]);

  // Esc closes the drawer first, then any open page.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key !== "Escape") return;
      if (!isDesktop && menuOpen) setMenuOpen(false);
      else if (panel) setPanel(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isDesktop, menuOpen, panel]);

  const handleSelect = (id) => {
    if (!isDesktop) setMenuOpen(false); // the docked sidebar stays put
    setPanel(id === "chat" ? null : id);
  };

  const enterChat = () => setIntroHidden(true);

  const handleNewChat = () => {
    if (!isDesktop) setMenuOpen(false);
    setPanel(null);
    setResetSignal((n) => n + 1);
  };

  if (showAdmin) return <AdminPage />;

  const panelProps = { onClose: () => setPanel(null), onMenu: openSidebar };

  return (
    <>
      <BackgroundEffects />
      <IntroPage hidden={introHidden} onEnter={enterChat} />

      <div ref={shellRef} className={`app-shell${introHidden ? "" : " locked"}`}>
        <ChatPage
          showMenu={!sidebarOpen}
          onMenu={openSidebar}
          active={panel || "chat"}
          onNavigate={handleSelect}
          resetSignal={resetSignal}
        />

        {panel === "media" && <MediaPanel {...panelProps} />}
        {panel === "about" && <AboutPanel {...panelProps} />}
        {panel === "contact" && <ContactPanel {...panelProps} />}
        {panel === "privacy" && <PrivacyPanel {...panelProps} />}

        <Sidebar
          open={sidebarOpen}
          modal={!isDesktop}
          active={panel}
          chats={chats}
          onSelect={handleSelect}
          onNewChat={handleNewChat}
          onClose={closeSidebar}
        />
      </div>
    </>
  );
}
