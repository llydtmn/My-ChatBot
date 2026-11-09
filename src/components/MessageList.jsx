import { useEffect, useRef } from "react";
import ChatMessage from "./ChatMessage";
import ImageMessage from "./ImageMessage";
import MusicPlayer from "./MusicPlayer";
import TypingIndicator from "./TypingIndicator";

export default function MessageList({ messages, isTyping, music }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const el = containerRef.current;
    el.scrollTop = el.scrollHeight;
  }, [messages, isTyping]);

  return (
    <div id="chat-messages" ref={containerRef}>
      {messages.map((m) => {
        if (m.type === "image") return <ImageMessage key={m.id} src={m.src} caption={m.caption} />;
        if (m.type === "music")
          return <MusicPlayer key={m.id} songIndex={m.songIndex} isPlaying={music.isPlaying} onToggle={music.toggle} />;
        return <ChatMessage key={m.id} role={m.role} text={m.text} isSystem={m.isSystem} isError={m.isError} />;
      })}
      {isTyping && <TypingIndicator />}
    </div>
  );
}
