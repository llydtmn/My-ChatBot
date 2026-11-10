import { useEffect, useRef, useState } from "react";
import Icon from "./icons";
import { SUGGESTIONS } from "../data/mockData";
import { loadSuggestions, subscribeToSuggestions } from "../services/suggestionService";

export default function SuggestionBar({ visible, onSelect }) {
  const [isOpen, setIsOpen] = useState(false);
  const [questions, setQuestions] = useState(SUGGESTIONS);
  const dropdownRef = useRef(null);

  // Load from Supabase and stay in sync when the admin edits the list.
  useEffect(() => {
    let alive = true;
    const refresh = () =>
      loadSuggestions().then((list) => alive && setQuestions(list));
    refresh();
    const unsubscribe = subscribeToSuggestions(refresh);
    // Also refresh when the dropdown is shown again (covers missed realtime events).
    return () => {
      alive = false;
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (visible) loadSuggestions().then(setQuestions);
  }, [visible]);

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

  if (!visible || !questions.length) return null;

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
        <Icon name="sliders" size={14} />
        <span>Suggested questions</span>
        <Icon name="chevronDown" size={14} />
      </button>

      {isOpen && (
        <div
          className="suggestions-menu"
          id="suggestions-menu"
          role="group"
          aria-label="Suggested questions"
        >
          {questions.map((question) => (
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