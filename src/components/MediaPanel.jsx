import { useEffect, useMemo, useRef, useState } from "react";
import PanelShell from "./PanelShell";
import Icon from "./icons";
import { MEDIA_KINDS, loadMedia, safeUrl } from "../services/mediaService";

function hostname(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return url;
  }
}

function Lightbox({ item, onClose }) {
  useEffect(() => {
    // Capture phase so Esc closes the photo first, not the whole page.
    const onKey = (e) => {
      if (e.key === "Escape") {
        e.stopPropagation();
        onClose();
      }
    };
    document.addEventListener("keydown", onKey, true);
    return () => document.removeEventListener("keydown", onKey, true);
  }, [onClose]);

  return (
    <div className="lightbox" role="dialog" aria-modal="true" aria-label={item.title} onClick={onClose}>
      <button className="menu-btn lightbox-close" onClick={onClose} aria-label="Close photo">
        <Icon name="close" />
      </button>
      <figure onClick={(e) => e.stopPropagation()}>
        <img src={item.href} alt={item.title} />
        <figcaption>
          {item.title}
          <a href={item.href} target="_blank" rel="noopener noreferrer">Open original</a>
        </figcaption>
      </figure>
    </div>
  );
}

export default function MediaPanel({ onClose, onMenu }) {
  const [items, setItems] = useState([]);
  const [warning, setWarning] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [lightbox, setLightbox] = useState(null);
  const rootRef = useRef(null);

  useEffect(() => {
    let alive = true;
    loadMedia()
      .then((result) => {
        if (!alive) return;
        setItems(result.items);
        setWarning(result.warning);
      })
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  // Drop anything without a safe address, then apply search.
  const usable = useMemo(
    () => items.map((item) => ({ ...item, href: safeUrl(item.url) })).filter((item) => item.href),
    [items]
  );

  const counts = useMemo(() => {
    const result = { all: usable.length };
    for (const kind of MEDIA_KINDS) result[kind.id] = usable.filter((i) => i.kind === kind.id).length;
    return result;
  }, [usable]);

  const matches = useMemo(() => {
    const needle = query.trim().toLowerCase();
    if (!needle) return usable;
    return usable.filter((i) => `${i.title} ${i.description}`.toLowerCase().includes(needle));
  }, [usable, query]);

  // Only one song or video plays at a time.
  const pauseOthers = (e) => {
    rootRef.current?.querySelectorAll("audio, video").forEach((el) => {
      if (el !== e.currentTarget) el.pause();
    });
  };

  const visibleKinds = MEDIA_KINDS.filter(
    (kind) => (filter === "all" || filter === kind.id) && matches.some((i) => i.kind === kind.id)
  );

  const renderItem = (item) => {
    switch (item.kind) {
      case "photo":
        return (
          <button key={item.id} className="media-photo" onClick={() => setLightbox(item)}>
            <img src={item.href} alt={item.title} loading="lazy" />
            <span>{item.title}</span>
          </button>
        );
      case "video":
        return (
          <div key={item.id} className="media-card media-video">
            <video controls preload="metadata" playsInline src={item.href} onPlay={pauseOthers} />
            <strong>{item.title}</strong>
            {item.description && <small>{item.description}</small>}
          </div>
        );
      case "music":
        return (
          <div key={item.id} className="media-card">
            <strong>{item.title}</strong>
            {item.description && <small>{item.description}</small>}
            <audio controls preload="none" src={item.href} onPlay={pauseOthers} />
          </div>
        );
      case "link":
        return (
          <a key={item.id} className="media-card media-link-card" href={item.href} target="_blank" rel="noopener noreferrer">
            <span>
              <strong>{item.title}</strong>
              <small>{item.description || hostname(item.href)}</small>
            </span>
            <Icon name="external" size={16} />
          </a>
        );
      default:
        return (
          <a key={item.id} className="media-card media-link-card" href={item.href} target="_blank" rel="noopener noreferrer" download>
            <span>
              <strong>{item.title}</strong>
              <small>{item.description || "Open or download"}</small>
            </span>
            <Icon name="external" size={16} />
          </a>
        );
    }
  };

  return (
    <PanelShell title="Media" subtitle="Photos, videos, music, links and files" onClose={onClose} onMenu={onMenu}>
      <div ref={rootRef}>
        <input
          className="media-search"
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search media…"
          aria-label="Search media"
        />

        <div className="media-filters" role="tablist" aria-label="Media type">
          {[{ id: "all", label: "All" }, ...MEDIA_KINDS].map((kind) => (
            <button
              key={kind.id}
              role="tab"
              aria-selected={filter === kind.id}
              className={`media-filter${filter === kind.id ? " active" : ""}`}
              onClick={() => setFilter(kind.id)}
            >
              {kind.label} <span>{counts[kind.id] ?? 0}</span>
            </button>
          ))}
        </div>

        {warning && <p className="media-note">{warning}</p>}
        {loading && <p className="media-note">Loading…</p>}
        {!loading && !visibleKinds.length && (
          <p className="media-empty">{query ? "Nothing matches your search." : "Nothing here yet."}</p>
        )}

        {visibleKinds.map((kind) => (
          <section key={kind.id} className="media-section">
            <h3>{kind.label}</h3>
            <div className={kind.id === "photo" ? "media-grid" : "media-stack"}>
              {matches.filter((i) => i.kind === kind.id).map(renderItem)}
            </div>
          </section>
        ))}
      </div>

      {lightbox && <Lightbox item={lightbox} onClose={() => setLightbox(null)} />}
    </PanelShell>
  );
}
