import { useEffect, useRef, useState } from "react";
import BackgroundEffects from "./components/BackgroundEffects";
import IntroPage from "./pages/IntroPage";
import ChatPage from "./pages/ChatPage";
import AdminPage from "./pages/AdminPage";

const isAdminHash = () => window.location.hash === "#/admin";

export default function App() {
  const [introHidden, setIntroHidden] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const [showAdmin, setShowAdmin] = useState(isAdminHash);
  const timer = useRef(null);

  // The dashboard lives at /#/admin (works on Vercel with no extra config).
  useEffect(() => {
    const onHashChange = () => setShowAdmin(isAdminHash());
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  // Same transition timing as the original site.
  const later = (fn, ms) => {
    clearTimeout(timer.current);
    timer.current = setTimeout(fn, ms);
  };

  const enterChat = () => {
    setIntroHidden(true);
    later(() => setChatVisible(true), 200);
  };

  const goBack = () => {
    setChatVisible(false);
    later(() => setIntroHidden(false), 300);
  };

  if (showAdmin) return <AdminPage />;

  return (
    <>
      <BackgroundEffects />
      <IntroPage hidden={introHidden} onEnter={enterChat} />
      <ChatPage visible={chatVisible} onBack={goBack} />
    </>
  );
}
