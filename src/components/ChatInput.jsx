import { useEffect, useRef, useState } from "react";

export default function ChatInput({ disabled, onSend }) {
  const [value, setValue] = useState("");
  const inputRef = useRef(null);
  const wasDisabled = useRef(false);

  // Auto-grow up to 80px, like the original.
  useEffect(() => {
    const el = inputRef.current;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 80) + "px";
  }, [value]);

  // Return focus to the input once a reply finishes.
  useEffect(() => {
    if (wasDisabled.current && !disabled) inputRef.current.focus();
    wasDisabled.current = disabled;
  }, [disabled]);

  const submit = () => {
    if (onSend(value)) setValue("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <div className="chat-input-bar">
      <textarea
        id="chat-input"
        ref={inputRef}
        value={value}
        onChange={(e) => setValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your question…"
        rows={1}
        maxLength={500}
      />
      <button id="chat-send" aria-label="Send" disabled={disabled} onClick={submit}>
        <i className="fas fa-paper-plane"></i>
      </button>
    </div>
  );
}
