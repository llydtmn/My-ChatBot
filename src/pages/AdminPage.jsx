import { useEffect, useState } from "react";
import {
  addInfo,
  deleteInfo,
  getAdminSession,
  listInfo,
  onAdminAuthChange,
  signInAdmin,
  signOutAdmin,
  updateInfo,
} from "../services/adminService";
import DevicesPanel from "../components/DevicesPanel";
import "../styles/admin.css";

const MAX_LENGTH = 2000;

const KIND_OPTIONS = [
  { id: "text", label: "Note" },
  { id: "link", label: "Link" },
  { id: "photo", label: "Photo" },
  { id: "video", label: "Video" },
  { id: "music", label: "Music" },
  { id: "file", label: "File" },
];
const KIND_LABEL = Object.fromEntries(KIND_OPTIONS.map((k) => [k.id, k.label]));
const ACCEPT = { photo: "image/*", video: "video/*", music: "audio/*", file: undefined };

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });

const entryLength = (item) =>
  (item.content?.length || 0) + (item.title?.length || 0) + (item.url?.length || 0);

function LoginForm({ onError, error }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    onError("");
    try {
      await signInAdmin(email.trim(), password);
    } catch (err) {
      onError(err.message || "Could not sign in.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form className="admin-card admin-login" onSubmit={submit}>
      <h1>Sign in</h1>
      <p className="admin-muted">Use the admin account from your Supabase project.</p>
      <label>
        Email
        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required />
      </label>
      <label>
        Password
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" required />
      </label>
      {error && <p className="admin-error" role="alert">{error}</p>}
      <button className="admin-btn primary" disabled={busy}>{busy ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}

function Preview({ item }) {
  if (!item.url) return null;
  const uploaded = Boolean(item.storage_path);

  if (item.kind === "photo") {
    return <img className="admin-preview" src={item.url} alt={item.title || ""} loading="lazy" />;
  }
  if (item.kind === "music" && uploaded) {
    return <audio className="admin-preview" src={item.url} controls preload="none" />;
  }
  if (item.kind === "video" && uploaded) {
    return <video className="admin-preview" src={item.url} controls preload="metadata" playsInline />;
  }
  return (
    <a className="admin-link" href={item.url} target="_blank" rel="noopener noreferrer">
      {item.kind === "file" ? "Open file" : item.url}
    </a>
  );
}

function Dashboard({ session, error, setError }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState("");
  const [view, setView] = useState("info");

  // Add form
  const [kind, setKind] = useState("text");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [fileKey, setFileKey] = useState(0);
  const [saving, setSaving] = useState(false);

  // Edit state
  const [editingId, setEditingId] = useState(null);
  const [edit, setEdit] = useState({ title: "", url: "", description: "" });

  useEffect(() => {
    let alive = true;
    listInfo()
      .then((rows) => alive && setItems(rows))
      .catch((err) => alive && setError(err.message))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [setError]);

  const flash = (message) => {
    setNotice(message);
    setTimeout(() => setNotice(""), 2500);
  };

  const resetForm = () => {
    setTitle("");
    setUrl("");
    setDescription("");
    setFile(null);
    setFileKey((k) => k + 1);
  };

  const chooseKind = (next) => {
    setKind(next);
    setError("");
    resetForm();
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      const row = await addInfo({ kind, title, url, description, file });
      setItems((prev) => [...prev, row]);
      resetForm();
      flash("Saved");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const startEdit = (item) => {
    setEditingId(item.id);
    setEdit({ title: item.title || "", url: item.url || "", description: item.content || "" });
  };

  const handleUpdate = async (item) => {
    setError("");
    try {
      const row = await updateInfo(item, edit);
      setItems((prev) => prev.map((x) => (x.id === item.id ? row : x)));
      setEditingId(null);
      flash("Updated");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (item) => {
    if (!window.confirm("Delete this entry? The bot will stop using it.")) return;
    setError("");
    try {
      await deleteInfo(item);
      setItems((prev) => prev.filter((x) => x.id !== item.id));
      flash("Deleted");
    } catch (err) {
      setError(err.message);
    }
  };

  const totalChars = items.reduce((sum, item) => sum + entryLength(item), 0);
  const isMedia = kind !== "text" && kind !== "link";
  const canSubmit =
    kind === "text" ? description.trim() : title.trim() && (kind === "link" ? url.trim() : file || url.trim());

  return (
    <>
      <header className="admin-header">
        <div>
          <h1>Llyd-Bot info</h1>
          <p className="admin-muted">{session.user.email}</p>
        </div>
        <div className="admin-actions">
          <a className="admin-btn" href="#/">View site</a>
          <button className="admin-btn" onClick={() => signOutAdmin()}>Sign out</button>
        </div>
      </header>

      <div className="admin-tabs" role="tablist" aria-label="Dashboard section">
        {[["info", "Bot info"], ["devices", "Devices"]].map(([id, label]) => (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={view === id}
            className={`admin-tab${view === id ? " active" : ""}`}
            onClick={() => setView(id)}
          >
            {label}
          </button>
        ))}
      </div>

      {view === "devices" ? (
        <DevicesPanel />
      ) : (
        <>

      <form className="admin-card" onSubmit={handleAdd}>
        <div className="admin-tabs" role="tablist" aria-label="Entry type">
          {KIND_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              role="tab"
              aria-selected={kind === option.id}
              className={`admin-tab${kind === option.id ? " active" : ""}`}
              onClick={() => chooseKind(option.id)}
            >
              {option.label}
            </button>
          ))}
        </div>

        {kind !== "text" && (
          <label>
            Title
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={120}
              placeholder={kind === "link" ? "My portfolio website" : "Graduation day"}
            />
          </label>
        )}

        {kind === "link" && (
          <label>
            Website address
            <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://alky.lovestoblog.com" inputMode="url" />
          </label>
        )}

        {isMedia && (
          <>
            <label>
              Upload {kind === "file" ? "a file" : `a ${kind === "music" ? "song" : kind}`} (up to 50 MB)
              <input
                key={fileKey}
                type="file"
                accept={ACCEPT[kind]}
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
            </label>
            <label>
              Or paste a link instead{kind === "video" ? " (YouTube works for big videos)" : ""}
              <input value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://" inputMode="url" disabled={Boolean(file)} />
            </label>
          </>
        )}

        <label htmlFor="new-desc">
          {kind === "text" ? "Add something the bot should know" : "Describe it so the bot can talk about it"}
        </label>
        <textarea
          id="new-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={MAX_LENGTH}
          rows={kind === "text" ? 4 : 3}
          placeholder={
            kind === "text"
              ? "e.g. My favorite food is sinigang. I graduated in 2024."
              : "e.g. Taken with my college friends after the ceremony."
          }
        />
        <div className="admin-row">
          <span className="admin-muted">{description.length} / {MAX_LENGTH}</span>
          <button className="admin-btn primary" disabled={saving || !canSubmit}>
            {saving ? (file ? "Uploading…" : "Saving…") : "Save entry"}
          </button>
        </div>
      </form>

      {error && <p className="admin-error" role="alert">{error}</p>}
      {notice && <p className="admin-notice" role="status">{notice}</p>}

      <section aria-label="Saved entries">
        <div className="admin-row admin-list-head">
          <h2>Saved entries ({items.length})</h2>
          <span className="admin-muted">{totalChars.toLocaleString()} characters sent with every chat</span>
        </div>

        {loading && <p className="admin-muted">Loading…</p>}
        {!loading && !items.length && (
          <p className="admin-empty">Nothing saved yet. Add your first entry above.</p>
        )}

        <ul className="admin-list">
          {items.map((item) => {
            const itemKind = item.kind || "text";
            const editing = editingId === item.id;
            return (
              <li key={item.id} className="admin-item">
                <div className="admin-row">
                  <span className="admin-tag">{KIND_LABEL[itemKind]}</span>
                  <span className="admin-muted">{formatDate(item.created_at)}</span>
                </div>

                {editing ? (
                  <>
                    {itemKind !== "text" && (
                      <input
                        value={edit.title}
                        onChange={(e) => setEdit({ ...edit, title: e.target.value })}
                        maxLength={120}
                        aria-label="Title"
                        placeholder="Title"
                      />
                    )}
                    {itemKind !== "text" && !item.storage_path && (
                      <input
                        value={edit.url}
                        onChange={(e) => setEdit({ ...edit, url: e.target.value })}
                        aria-label="Link"
                        placeholder="https://"
                      />
                    )}
                    <textarea
                      value={edit.description}
                      onChange={(e) => setEdit({ ...edit, description: e.target.value })}
                      maxLength={MAX_LENGTH}
                      rows={3}
                      aria-label="Description"
                    />
                    <div className="admin-actions">
                      <button className="admin-btn primary" onClick={() => handleUpdate(item)}>Save changes</button>
                      <button className="admin-btn" onClick={() => setEditingId(null)}>Cancel</button>
                    </div>
                  </>
                ) : (
                  <>
                    {item.title && <h3 className="admin-item-title">{item.title}</h3>}
                    {item.content && <p className="admin-content">{item.content}</p>}
                    <Preview item={item} />
                    <div className="admin-actions">
                      <button className="admin-btn" onClick={() => startEdit(item)}>Edit</button>
                      <button className="admin-btn danger" onClick={() => handleDelete(item)}>Delete</button>
                    </div>
                  </>
                )}
              </li>
            );
          })}
        </ul>
      </section>
        </>
      )}
    </>
  );
}

export default function AdminPage() {
  const [session, setSession] = useState(null);
  const [checking, setChecking] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let unsubscribe = () => {};
    getAdminSession()
      .then(setSession)
      .catch((err) => setError(err.message))
      .finally(() => setChecking(false));

    try {
      unsubscribe = onAdminAuthChange(setSession);
    } catch (err) {
      setError(err.message);
    }
    return unsubscribe;
  }, []);

  return (
    <main className="admin-page">
      <div className="admin-wrap">
        {checking ? (
          <p className="admin-muted">Loading…</p>
        ) : session ? (
          <Dashboard session={session} error={error} setError={setError} />
        ) : (
          <LoginForm error={error} onError={setError} />
        )}
      </div>
    </main>
  );
}
