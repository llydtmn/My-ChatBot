import { useEffect, useRef } from "react";
import TopBar from "../components/TopBar";
import MessageList from "../components/MessageList";
import SuggestionBar from "../components/SuggestionBar";
import ChatInput from "../components/ChatInput";
import useChat from "../hooks/useChat";
import useMusic from "../hooks/useMusic";

export default function ChatPage({ showMenu, onMenu, active, onNavigate, resetSignal = 0 }) {
  const music = useMusic();

  const {
    messages,
    isTyping,
    isLoading,
    showSuggestions,
    sendMessage,
    storageError,
    reset,
  } = useChat({
    playSong: music.loadSong,
  });

  // Clear the conversation (and stop any song) when the user starts a new chat.
  const lastReset = useRef(resetSignal);
  useEffect(() => {
    if (resetSignal === lastReset.current) return;
    lastReset.current = resetSignal;
    reset();
    music.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

  // The greeting message lives in the hero until the person says something.
  const started = messages.some((m) => m.id !== 0);
  const visibleMessages = messages.filter((m) => m.id !== 0);

  return (
    <div id="workspace">
      <TopBar showMenu={showMenu} onMenu={onMenu} active={active} onSelect={onNavigate} />

      {storageError && (
        <div className="storage-alert" role="status">
          {storageError}
        </div>
      )}

      <main className={`stage${started ? " has-messages" : ""}`}>
        {started ? (
          <MessageList messages={visibleMessages} isTyping={isTyping} music={music} />
        ) : (
          <section className="hero">
            <span className="hero-orb" aria-hidden="true" />
            <p className="hero-kicker">Welcome</p>
            <h1 className="hero-title">Ask me anything about Lloyd's Fucking Life!</h1>
          </section>
        )}
      </main>

      <div className="dock">
        <ChatInput
          disabled={isLoading}
          onSend={sendMessage}
          toolbar={<SuggestionBar visible={showSuggestions} onSelect={sendMessage} />}
        />
      </div>
    </div>
  );
}
