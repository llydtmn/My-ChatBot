import { useEffect, useRef, useState } from "react";

export default function ChatInput({ disabled, onSend }) {
  const [value, setValue] = useState("");
  const inputRef = useRef(null);
  const wasDisabled = useRef(false);

  useEffect(() => {
    const el = inputRef.current;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 120) + "px";
  }, [value]);

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
      <div className="input-wrapper">
        <textarea
          id="chat-input"
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message Llyd-Bot…"
          rows={1}
          maxLength={500}
        />
        <button id="chat-send" aria-label="Send" disabled={disabled} onClick={submit}>
          <i className="fas fa-arrow-up"></i>
        </button>
      </div>
    </div>
  );
}