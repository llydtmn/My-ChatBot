import { useCallback, useEffect, useState } from "react";
import { getMonitoring, getRecentIssues, resetTokens } from "../services/monitoringService";

// Tune these to your own limits.
const TOKENS_PER_DAY_WARNING = 200000;
const ERROR_RATE_WARNING = 0.3; // 30% of the last hour's requests failing
const MIN_REQUESTS_FOR_RATE = 5; // ignore the rate until there are enough requests
const BLOCKED_PER_HOUR_WARNING = 30;
const REFRESH_MS = 60 * 1000;
// Token count auto-resets every 2 minutes while this dashboard is open.
const AUTO_RESET_MS = 2 * 60 * 1000;
const LAST_RESET_KEY = "llyd-tokens-last-reset";

const RANGES = [
  { hours: 24, label: "24 hours" },
  { hours: 168, label: "7 days" },
  { hours: 720, label: "30 days" },
];

const STATUS_LABELS = {
  ok: "Replied",
  groq_busy: "AI busy (429)",
  groq_error: "AI error",
  connection_error: "Couldn't reach AI",
  not_configured: "Not configured",
  rate_limited_burst: "Blocked: too fast",
  rate_limited_hourly: "Blocked: too many messages",
  invalid_request: "Invalid request",
};

const number = (n) => Number(n ?? 0).toLocaleString();

function ago(iso) {
  if (!iso) return "never";
  const seconds = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)} min ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)} h ago`;
  return `${Math.floor(seconds / 86400)} d ago`;
}

function bucketLabel(iso, unit) {
  const date = new Date(iso);
  return unit === "hour"
    ? date.toLocaleString([], { month: "short", day: "numeric", hour: "numeric" })
    : date.toLocaleDateString([], { month: "short", day: "numeric" });
}

function getAlerts(data) {
  if (!data) return [];
  const alerts = [];
  const { totals, last_hour: hour, tokens_today: tokensToday } = data;

  if (totals.errors > 0 && totals.ok === 0) {
    alerts.push({
      level: "bad",
      text: "Every AI call in this period failed. The bot may be down.",
    });
  }
  if (hour.requests >= MIN_REQUESTS_FOR_RATE && hour.errors / hour.requests >= ERROR_RATE_WARNING) {
    alerts.push({
      level: "bad",
      text: `${hour.errors} of the last hour's ${hour.requests} requests failed. Check the Worker logs and your Groq usage.`,
    });
  }
  if (hour.blocked >= BLOCKED_PER_HOUR_WARNING) {
    alerts.push({
      level: "warn",
      text: `${hour.blocked} requests were blocked by rate limits in the last hour. Someone may be hammering the bot.`,
    });
  }
  if (tokensToday >= TOKENS_PER_DAY_WARNING) {
    alerts.push({
      level: "warn",
      text: `${number(tokensToday)} tokens used today (warning at ${number(TOKENS_PER_DAY_WARNING)}).`,
    });
  }
  return alerts;
}

export default function MonitoringPanel() {
  const [hours, setHours] = useState(24);
  const [data, setData] = useState(null);
  const [issues, setIssues] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [updatedAt, setUpdatedAt] = useState(null);

  const load = useCallback(async () => {
    try {
      const [summary, recent] = await Promise.all([getMonitoring(hours), getRecentIssues()]);
      setData(summary);
      setIssues(recent);
      setError("");
      setUpdatedAt(new Date());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [hours]);

  useEffect(() => {
    setLoading(true);
    load();
    const timer = setInterval(load, REFRESH_MS);
    return () => clearInterval(timer);
  }, [load]);

  // Auto-reset the token count every 2 minutes (checked every 15s, survives page reloads).
  useEffect(() => {
    const tick = async () => {
      let last = 0;
      try { last = Number(localStorage.getItem(LAST_RESET_KEY)) || 0; } catch { /* ignore */ }
      if (!last) {
        try { localStorage.setItem(LAST_RESET_KEY, String(Date.now())); } catch { /* ignore */ }
        return;
      }
      if (Date.now() - last < AUTO_RESET_MS) return;
      try {
        await resetTokens();
        try { localStorage.setItem(LAST_RESET_KEY, String(Date.now())); } catch { /* ignore */ }
        await load();
      } catch (err) {
        setError(err.message);
      }
    };
    tick();
    const timer = setInterval(tick, 15 * 1000);
    return () => clearInterval(timer);
  }, [load]);

  const handleResetTokens = async () => {
    const ok = window.confirm(
      "Reset the token count to 0?\n\nThis clears tokens for ALL time, not just the range you are viewing. Requests, errors and visitors are kept."
    );
    if (!ok) return;
    setError("");
    try {
      await resetTokens();
      try { localStorage.setItem(LAST_RESET_KEY, String(Date.now())); } catch { /* ignore */ }
      await load();
    } catch (err) {
      setError(err.message);
    }
  };

  const totals = data?.totals;
  const alerts = getAlerts(data);
  const buckets = data?.buckets ?? [];
  const peak = Math.max(1, ...buckets.map((b) => b.ok + b.errors + b.blocked));
  const successRate = totals?.requests
    ? Math.round((totals.ok / Math.max(1, totals.ok + totals.errors)) * 100)
    : null;

  const stats = totals
    ? [
        ["Requests", number(totals.requests)],
        ["Replied", number(totals.ok)],
        ["Errors", number(totals.errors)],
        ["Blocked", number(totals.blocked)],
        ["Visitors", number(totals.visitors)],
        ["Tokens used", number(totals.tokens)],
        ["Avg reply time", totals.avg_latency_ms ? `${(totals.avg_latency_ms / 1000).toFixed(1)}s` : "—"],
        ["Slowest 5%", totals.p95_latency_ms ? `${(totals.p95_latency_ms / 1000).toFixed(1)}s` : "—"],
      ]
    : [];

  return (
    <>
      <div className="admin-row">
        <div className="admin-tabs" role="tablist" aria-label="Time range">
          {RANGES.map((range) => (
            <button
              key={range.hours}
              type="button"
              role="tab"
              aria-selected={hours === range.hours}
              className={`admin-tab${hours === range.hours ? " active" : ""}`}
              onClick={() => setHours(range.hours)}
            >
              {range.label}
            </button>
          ))}
        </div>
        <div className="admin-actions">
          <span className="admin-muted">
            {updatedAt ? `Updated ${updatedAt.toLocaleTimeString()} · tokens auto-reset every 2 min` : ""}
          </span>
          <button className="admin-btn" onClick={load}>Refresh</button>
          <button className="admin-btn danger" onClick={handleResetTokens}>Reset tokens</button>
        </div>
      </div>

      {error && <p className="admin-error" role="alert">{error}</p>}
      {loading && !data && <p className="admin-muted">Loading…</p>}

      {data && (
        <>
          <div className={`mon-health ${alerts.some((a) => a.level === "bad") ? "bad" : alerts.length ? "warn" : "good"}`} role="status">
            <strong>
              {alerts.some((a) => a.level === "bad")
                ? "Needs attention"
                : alerts.length
                ? "Watch this"
                : totals.requests
                ? "All good"
                : "No data yet"}
            </strong>
            <span>
              Last successful reply: {ago(totals.last_success_at)}
              {totals.last_error_at ? ` · last error: ${ago(totals.last_error_at)}` : ""}
              {successRate !== null ? ` · ${successRate}% of AI calls succeeded` : ""}
            </span>
          </div>

          {alerts.map((alert) => (
            <p key={alert.text} className={`mon-alert ${alert.level}`} role="alert">{alert.text}</p>
          ))}

          {!totals.requests && (
            <p className="admin-empty">
              Nothing recorded in this period. If you've chatted with the bot and still see this,
              check that the Worker has the SUPABASE_URL and SUPABASE_SERVICE_KEY secrets.
            </p>
          )}

          {totals.requests > 0 && (
            <>
              <div className="admin-stats">
                {stats.map(([label, value]) => (
                  <div className="admin-stat" key={label}>
                    <strong>{value}</strong>
                    <span>{label}</span>
                  </div>
                ))}
              </div>

              <section className="admin-card" aria-label="Requests over time">
                <div className="admin-row">
                  <h2>Requests per {data.unit}</h2>
                  <span className="mon-legend">
                    <i className="ok" /> replied <i className="errors" /> errors <i className="blocked" /> blocked
                  </span>
                </div>
                <div className="mon-chart" role="img" aria-label="Bar chart of requests over time">
                  {buckets.map((bucket) => {
                    const total = bucket.ok + bucket.errors + bucket.blocked;
                    return (
                      <div
                        className="mon-bar"
                        key={bucket.t}
                        title={`${bucketLabel(bucket.t, data.unit)}: ${bucket.ok} replied, ${bucket.errors} errors, ${bucket.blocked} blocked`}
                      >
                        <div className="mon-stack" style={{ height: `${(total / peak) * 100}%` }}>
                          <span className="blocked" style={{ flex: bucket.blocked }} />
                          <span className="errors" style={{ flex: bucket.errors }} />
                          <span className="ok" style={{ flex: bucket.ok }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
                <div className="admin-row admin-muted">
                  <span>{bucketLabel(buckets[0]?.t, data.unit)}</span>
                  <span>{bucketLabel(buckets[buckets.length - 1]?.t, data.unit)}</span>
                </div>
              </section>

              <section className="admin-card" aria-label="Outcomes">
                <h2>Outcomes</h2>
                <ul className="mon-statuses">
                  {Object.entries(data.statuses)
                    .sort((a, b) => b[1] - a[1])
                    .map(([status, count]) => (
                      <li key={status}>
                        <span>{STATUS_LABELS[status] || status}</span>
                        <strong>{number(count)}</strong>
                      </li>
                    ))}
                </ul>
              </section>
            </>
          )}

          <section aria-label="Recent problems">
            <div className="admin-row admin-list-head">
              <h2>Recent problems</h2>
              <span className="admin-muted">Last {issues.length || 0} that weren't a normal reply</span>
            </div>
            {!issues.length && <p className="admin-empty">No problems recorded. Nice.</p>}
            <ul className="admin-list">
              {issues.map((issue) => (
                <li key={issue.id} className="admin-item">
                  <p className="admin-content">
                    <strong>{STATUS_LABELS[issue.status] || issue.status}</strong>
                    {issue.http_status ? ` · ${issue.http_status}` : ""}
                    {issue.error ? ` · ${issue.error}` : ""}
                  </p>
                  <span className="admin-muted">
                    {new Date(issue.created_at).toLocaleString()} ({ago(issue.created_at)})
                    {issue.model ? ` · ${issue.model}` : ""}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}
    </>
  );
}