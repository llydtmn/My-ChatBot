import { useRef, useState } from "react";
import BackgroundEffects from "./components/BackgroundEffects";
import IntroPage from "./pages/IntroPage";
import ChatPage from "./pages/ChatPage";

export default function App() {
  const [introHidden, setIntroHidden] = useState(false);
  const [chatVisible, setChatVisible] = useState(false);
  const timer = useRef(null);

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

  return (
    <>
      <BackgroundEffects />
      <IntroPage hidden={introHidden} onEnter={enterChat} />
      <ChatPage visible={chatVisible} onBack={goBack} />
    </>
  );
}
