import { useEffect, useRef, useState } from "react";
import Icon from "./icons";

// `toolbar` is an optional slot for the chips on the left of the send button.
export default function ChatInput({ disabled, onSend, toolbar }) {
  const [value, setValue] = useState("");
  const inputRef = useRef(null);
  const wasDisabled = useRef(false);

  useEffect(() => {
    const el = inputRef.current;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 160) + "px";
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
    <div className="composer">
      <div className="composer-row">
        <span className="composer-spark" aria-hidden="true">
          <Icon name="sparkle" size={20} />
        </span>
        <textarea
          id="chat-input"
          ref={inputRef}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me anything…"
          aria-label="Message whatTheLlyd"
          rows={1}
          maxLength={500}
        />
      </div>
      <div className="composer-tools">
        <div className="composer-chips">{toolbar}</div>
        <button id="chat-send" aria-label="Send" disabled={disabled} onClick={submit}>
          <Icon name="send" size={16} />
        </button>
      </div>
    </div>
  );
}
