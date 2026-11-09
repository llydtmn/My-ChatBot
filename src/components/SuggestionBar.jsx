import { useEffect, useRef, useState } from "react";
import { SUGGESTIONS } from "../data/mockData";

export default function SuggestionBar({ visible, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    if (!visible) setIsOpen(false);
  }, [visible]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (!dropdownRef.current?.contains(event.target)) {
        setIsOpen(false);
      }
    };

    const handleKeyDown = (event) => {
      if (event.key === "Escape") setIsOpen(false);
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  if (!visible) return null;

  const handleSelect = (question) => {
    setIsOpen(false);
    onSelect(question);
  };

  return (
    <div className="suggestions" id="suggestions-bar" ref={dropdownRef}>
      <button
        type="button"
        className={`suggestions-toggle${isOpen ? " is-open" : ""}`}
        onClick={() => setIsOpen((open) => !open)}
        aria-expanded={isOpen}
        aria-controls="suggestions-menu"
      >
        <span>Suggested questions</span>
        <i className="fas fa-chevron-down" aria-hidden="true" />
      </button>

      {isOpen && (
        <div
          className="suggestions-menu"
          id="suggestions-menu"
          role="group"
          aria-label="Suggested questions"
        >
          {SUGGESTIONS.map((question) => (
            <button
              key={question}
              type="button"
              className="suggestion-btn"
              onClick={() => handleSelect(question)}
            >
              {question}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}