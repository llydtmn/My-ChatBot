import { useCallback, useEffect, useState } from "react";
import { deleteDevice, getDeviceId, listDevices, renameDevice } from "../services/deviceService";

const DAY_MS = 24 * 60 * 60 * 1000;
const TYPE_LABEL = { mobile: "Mobile", tablet: "Tablet", desktop: "Desktop" };

function timeAgo(iso) {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

const fullDate = (iso) =>
  new Date(iso).toLocaleString(undefined, { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });

export default function DevicesPanel() {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [labelDraft, setLabelDraft] = useState("");
  const thisDevice = getDeviceId();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setDevices(await listDevices());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const handleRename = async (device) => {
    setError("");
    try {
      const label = await renameDevice(device.device_id, labelDraft);
      setDevices((prev) => prev.map((d) => (d.device_id === device.device_id ? { ...d, label } : d)));
      setEditingId(null);
    } catch (err) {
      setError(err.message);
    }
  };

  const handleDelete = async (device) => {
    const message =
      "Remove this device from the list? If it opens the site again, it will show up as a new device.";
    if (!window.confirm(message)) return;
    setError("");
    try {
      await deleteDevice(device.device_id);
      setDevices((prev) => prev.filter((d) => d.device_id !== device.device_id));
    } catch (err) {
      setError(err.message);
    }
  };

  const now = Date.now();
  const stats = [
    { value: devices.length, label: "Devices total" },
    { value: devices.filter((d) => now - new Date(d.last_seen).getTime() < DAY_MS).length, label: "Active in 24 hours" },
    { value: devices.filter((d) => now - new Date(d.last_seen).getTime() < 7 * DAY_MS).length, label: "Active in 7 days" },
    { value: devices.filter((d) => d.installed).length, label: "Installed as app" },
  ];
  const byType = ["mobile", "tablet", "desktop"]
    .map((type) => [type, devices.filter((d) => d.device_type === type).length])
    .filter(([, count]) => count > 0)
    .map(([type, count]) => `${count} ${TYPE_LABEL[type].toLowerCase()}`)
    .join(" · ");

  return (
    <>
      <div className="admin-stats">
        {stats.map((stat) => (
          <div key={stat.label} className="admin-stat">
            <strong>{stat.value}</strong>
            <span>{stat.label}</span>
          </div>
        ))}
      </div>

      <div className="admin-row">
        <span className="admin-muted">{byType || "No devices yet"}</span>
        <button className="admin-btn" onClick={load} disabled={loading}>
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {error && <p className="admin-error" role="alert">{error}</p>}
      {!loading && !error && !devices.length && (
        <p className="admin-empty">No devices yet. They appear here after someone opens your site.</p>
      )}

      <ul className="admin-list">
        {devices.map((device) => {
          const editing = editingId === device.device_id;
          const isThis = device.device_id === thisDevice;
          return (
            <li key={device.device_id} className="admin-item">
              {editing ? (
                <>
                  <input
                    value={labelDraft}
                    onChange={(e) => setLabelDraft(e.target.value)}
                    maxLength={60}
                    aria-label="Device name"
                    placeholder="e.g. John's phone"
                    autoFocus
                  />
                  <div className="admin-actions">
                    <button className="admin-btn primary" onClick={() => handleRename(device)}>Save name</button>
                    <button className="admin-btn" onClick={() => setEditingId(null)}>Cancel</button>
                  </div>
                </>
              ) : (
                <>
                  <div className="admin-row">
                    <h3 className="admin-item-title">{device.label || "Unnamed device"}</h3>
                    <div className="admin-actions">
                      {isThis && <span className="admin-tag">This device</span>}
                      {device.installed && <span className="admin-tag">Installed app</span>}
                    </div>
                  </div>
                  <p className="admin-content">
                    {[TYPE_LABEL[device.device_type], device.os, device.browser].filter(Boolean).join(" · ")}
                  </p>
                  <p className="admin-muted">
                    Last seen {timeAgo(device.last_seen)} · {device.visit_count} visit{device.visit_count === 1 ? "" : "s"} · First seen {fullDate(device.first_seen)}
                  </p>
                  <div className="admin-actions">
                    <button
                      className="admin-btn"
                      onClick={() => {
                        setEditingId(device.device_id);
                        setLabelDraft(device.label || "");
                      }}
                    >
                      Rename
                    </button>
                    <button className="admin-btn danger" onClick={() => handleDelete(device)}>Remove</button>
                  </div>
                </>
              )}
            </li>
          );
        })}
      </ul>

      <p className="admin-muted">
        A device is one browser on one phone or computer. Clearing site data or using a private window
        counts as a new device. No IP addresses are stored.
      </p>
    </>
  );
}
