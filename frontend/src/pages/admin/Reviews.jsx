import { useCallback, useEffect, useState } from "react";
import { api } from "../../lib/api";

const fmt = (d) =>
  new Date(d).toLocaleString("en-PH", { dateStyle: "medium", timeStyle: "short", timeZone: "Asia/Manila" });

function Stars({ value }) {
  return (
    <span aria-hidden="true">
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= Math.round(value) ? "text-accent" : "text-line"}>★</span>
      ))}
    </span>
  );
}

export default function AdminReviews() {
  const [summary, setSummary] = useState([]);
  const [rows, setRows] = useState([]);
  const [perfumeId, setPerfumeId] = useState("");
  const [rating, setRating] = useState("");
  const [status, setStatus] = useState("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);

  const loadSummary = useCallback(async () => {
    try { setSummary(await api("/reviews/admin/summary")); } catch { /* keep old */ }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    const p = new URLSearchParams();
    if (perfumeId) p.set("perfumeId", perfumeId);
    if (rating) p.set("rating", rating);
    if (status) p.set("status", status);
    if (q.trim()) p.set("q", q.trim());
    try { setRows(await api(`/reviews/admin?${p}`)); } finally { setLoading(false); }
  }, [perfumeId, rating, status, q]);

  useEffect(() => { loadSummary(); }, [loadSummary]);
  useEffect(() => {
    const t = setTimeout(load, 250);
    return () => clearTimeout(t);
  }, [load]);

  async function toggle(r) {
    await api(`/reviews/admin/${r.id}`, { method: "PATCH", body: { isHidden: !r.isHidden } });
    setRows((x) => x.map((i) => (i.id === r.id ? { ...i, isHidden: !r.isHidden } : i)));
    loadSummary();
  }
  async function remove(r) {
    if (!confirm("Delete this review permanently?")) return;
    await api(`/reviews/admin/${r.id}`, { method: "DELETE" });
    setRows((x) => x.filter((i) => i.id !== r.id));
    loadSummary();
  }

  const field = "min-h-11 border border-line bg-bg px-3 text-base text-fg";
  const selected = summary.find((s) => String(s.id) === String(perfumeId));

  return (
    <div>
      <h1 className="text-2xl font-extrabold">Reviews</h1>
      <p className="mt-1 text-sm text-muted">Hidden reviews don't show on the product page or count toward the average.</p>

      {/* Average rating per perfume */}
      <h2 className="mt-6 text-sm font-semibold uppercase tracking-wide">Ratings by perfume</h2>
      <div className="mt-3 grid grid-cols-2 gap-2 md:grid-cols-3 xl:grid-cols-4">
        {summary.map((s) => {
          const active = String(s.id) === String(perfumeId);
          return (
            <button
              key={s.id}
              type="button"
              onClick={() => setPerfumeId(active ? "" : String(s.id))}
              aria-pressed={active}
              className={`min-h-11 border p-3 text-left transition-colors ${
                active ? "border-accent bg-panel" : "border-line bg-surface hover:bg-panel"
              }`}
            >
              <p className="truncate text-sm font-semibold">{s.name}</p>
              {s.count ? (
                <>
                  <p className="mt-1 flex items-baseline gap-2">
                    <span className="text-2xl font-extrabold leading-none">{s.average.toFixed(1)}</span>
                    <Stars value={s.average} />
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {s.count} review{s.count === 1 ? "" : "s"}
                    {s.hidden ? ` · ${s.hidden} hidden` : ""}
                  </p>
                </>
              ) : (
                <p className="mt-2 text-xs text-muted">
                  No reviews yet{s.hidden ? ` · ${s.hidden} hidden` : ""}
                </p>
              )}
            </button>
          );
        })}
      </div>

      {/* Filters */}
      <div className="mt-8 flex flex-wrap items-center gap-2">
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search perfume, email, text…"
          className={`${field} min-w-0 flex-1 basis-56`}
        />
        <select value={rating} onChange={(e) => setRating(e.target.value)} className={field}>
          <option value="">All ratings</option>
          {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} stars</option>)}
        </select>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className={field}>
          <option value="">All</option>
          <option value="visible">Visible</option>
          <option value="hidden">Hidden</option>
        </select>
        {selected && (
          <button onClick={() => setPerfumeId("")} className="min-h-11 border border-line px-3 text-sm">
            {selected.name} ✕
          </button>
        )}
      </div>

      {/* Reviews */}
      <ul className="mt-6 space-y-3">
        {rows.map((r) => (
          <li key={r.id} className={`border border-line bg-surface p-4 ${r.isHidden ? "opacity-60" : ""}`}>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Stars value={r.rating} />
              <span className="text-sm font-semibold">{r.perfumeName}</span>
              {r.isHidden && (
                <span className="border border-line px-1.5 text-[10px] uppercase text-muted">Hidden</span>
              )}
            </div>
            <p className="mt-1 text-xs text-muted">
              {r.firstName} {r.lastName} · {r.email} · {fmt(r.createdAt)}
            </p>
            {r.body && <p className="mt-2 whitespace-pre-line text-sm">{r.body}</p>}
            <div className="mt-3 flex gap-2">
              <button onClick={() => toggle(r)} className="min-h-11 border border-line px-4 text-sm">
                {r.isHidden ? "Show" : "Hide"}
              </button>
              <button onClick={() => remove(r)} className="min-h-11 border border-line px-4 text-sm text-danger">
                Delete
              </button>
            </div>
          </li>
        ))}
        {!loading && !rows.length && <li className="text-sm text-muted">No reviews found.</li>}
      </ul>
    </div>
  );
}