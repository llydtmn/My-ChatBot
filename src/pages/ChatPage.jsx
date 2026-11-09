import { useEffect, useRef } from "react";
import ChatHeader from "../components/ChatHeader";
import MessageList from "../components/MessageList";
import SuggestionBar from "../components/SuggestionBar";
import ChatInput from "../components/ChatInput";
import useChat from "../hooks/useChat";
import useMusic from "../hooks/useMusic";

export default function ChatPage({ visible, onBack, resetSignal = 0 }) {
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

  // Clear the conversation (and stop any song) each time the user returns to the intro.
  const lastReset = useRef(resetSignal);
  useEffect(() => {
    if (resetSignal === lastReset.current) return;
    lastReset.current = resetSignal;
    reset();
    music.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [resetSignal]);

  return (
    <div id="chat-screen" className={visible ? "visible" : ""}>
      <div className="chat-card">
        <ChatHeader onBack={onBack} />

        {storageError && (
          <div
            role="status"
            style={{
              margin: "8px 16px",
              padding: "10px 12px",
              borderRadius: 8,
              background: "rgba(220, 80, 80, 0.12)",
              color: "inherit",
              fontSize: 13,
            }}
          >
            {storageError}
          </div>
        )}

        <MessageList messages={messages} isTyping={isTyping} music={music} />
        <SuggestionBar visible={showSuggestions} onSelect={sendMessage} />
        <ChatInput disabled={isLoading} onSend={sendMessage} />
      </div>
    </div>
  );
}
