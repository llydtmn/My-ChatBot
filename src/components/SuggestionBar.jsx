import { SUGGESTIONS } from "../data/mockData";

export default function SuggestionBar({ visible, onSelect }) {
  return (
    <div className="suggestions" id="suggestions-bar">
      {visible &&
        SUGGESTIONS.map((q) => (
          <button key={q} className="suggestion-btn" onClick={() => onSelect(q)}>
            {q}
          </button>
        ))}
    </div>
  );
}
