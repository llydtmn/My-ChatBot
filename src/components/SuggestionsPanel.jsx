import { useEffect, useState } from "react";
import {
  MAX_QUESTION_LENGTH,
  addSuggestion,
  deleteSuggestion,
  listSuggestionRows,
  swapOrder,
  updateSuggestion,
} from "../services/suggestionService";

export default function SuggestionsPanel() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [newQuestion, setNewQuestion] = useState("");
  const [saving, setSaving] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [editText, setEditText] = useState("");

  const flash = (message) => {
    setNotice(message);
    setTimeout(() => setNotice(""), 2500);
  };

  useEffect(() => {
    let alive = true;
    listSuggestionRows()
      .then((data) => alive && setRows(data))
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const row = await addSuggestion(newQuestion, rows);
      setRows((prev) => [...prev, row]);
      setNewQuestion("");
      flash("Added");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleUpdate = async (row) => {
    setError("");
    try {
      const updated = await updateSuggestion(row.id, editText);
      setRows((prev) => prev.map((x) => (x.id === row.id ? updated : x)));
      setEditingId(null);
      flash("Updated");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (row) => {
    if (!window.confirm("Delete this question? It will disappear from the chat dropdown.")) return;
    setError("");
    try {
      await deleteSuggestion(row.id);
      setRows((prev) => prev.filter((x) => x.id !== row.id));
      flash("Deleted");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleMove = async (index, direction) => {
    const other = rows[index + direction];
    const row = rows[index];
    if (!other) return;
    setError("");
    try {
      // If two rows ever share a sort_order, give them distinct values first.
      const a = { ...row };
      const b = { ...other };
      if (a.sort_order === b.sort_order) a.sort_order = b.sort_order + direction * -1;
      await swapOrder(a, b);
      const next = [...rows];
      next[index] = { ...other, sort_order: a.sort_order };
      next[index + direction] = { ...row, sort_order: b.sort_order };
      setRows(next);
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <>
      <form className="admin-card" onSubmit={handleAdd}>
        <label htmlFor="new-suggestion">
          Add a suggested question
        </label>
        <input
          id="new-suggestion"
          value={newQuestion}
          onChange={(e) => setNewQuestion(e.target.value)}
          maxLength={MAX_QUESTION_LENGTH}
          placeholder="e.g. What projects has he built?"
        />
        <div className="admin-row">
          <span className="admin-muted">{newQuestion.length} / {MAX_QUESTION_LENGTH}</span>
          <button className="admin-btn primary" disabled={saving || !newQuestion.trim()}>
            {saving ? "Saving…" : "Add question"}
          </button>
        </div>
      </form>

      {error && <p className="admin-error" role="alert">{error}</p>}
      {notice && <p className="admin-notice" role="status">{notice}</p>}

      <section aria-label="Suggested questions">
        <div className="admin-row admin-list-head">
          <h2>Suggested questions ({rows.length})</h2>
          <span className="admin-muted">Shown in the chat dropdown, in this order</span>
        </div>

        {loading && <p className="admin-muted">Loading…</p>}
        {!loading && !rows.length && !error && (
          <p className="admin-empty">No questions yet. Visitors will see an empty dropdown until you add some.</p>
        )}

        <ul className="admin-list">
          {rows.map((row, index) => {
            const editing = editingId === row.id;
            return (
              <li key={row.id} className="admin-item">
                {editing ? (
                  <>
                    <input
                      value={editText}
                      onChange={(e) => setEditText(e.target.value)}
                      maxLength={MAX_QUESTION_LENGTH}
                      aria-label="Question"
                      autoFocus
                    />
                    <div className="admin-actions">
                      <button className="admin-btn primary" onClick={() => handleUpdate(row)} disabled={!editText.trim()}>
                        Save changes
                      </button>
                      <button className="admin-btn" onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="admin-content">{row.question}</p>
                    <div className="admin-actions">
                      <button className="admin-btn" onClick={() => handleMove(index, -1)} disabled={index === 0} aria-label="Move up">↑</button>
                      <button className="admin-btn" onClick={() => handleMove(index, 1)} disabled={index === rows.length - 1} aria-label="Move down">↓</button>
                      <button className="admin-btn" onClick={() => { setEditingId(row.id); setEditText(row.question); }}>Edit</button>
                      <button className="admin-btn danger" onClick={() => handleDelete(row)}>Delete</button>
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </section>
    </>
  );
}
