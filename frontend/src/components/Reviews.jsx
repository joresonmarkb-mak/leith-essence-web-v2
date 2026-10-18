import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api";                // change to `import api from` if yours is a default export
import { useAuth } from "../context/AuthContext"; // adjust the path if yours differs

const fmt = (d) =>
  new Date(d).toLocaleDateString("en-PH", { year: "numeric", month: "short", day: "numeric", timeZone: "Asia/Manila" });

function Stars({ value, size = "text-base" }) {
  return (
    <span className={`${size} tracking-tight`} role="img" aria-label={`${value} out of 5 stars`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= Math.round(value) ? "text-accent" : "text-line"}>★</span>
      ))}
    </span>
  );
}

function StarPicker({ value, onChange }) {
  return (
    <div className="flex" role="radiogroup" aria-label="Your rating">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} star${n > 1 ? "s" : ""}`}
          onClick={() => onChange(n)}
          className={`h-11 w-11 text-3xl leading-none transition-colors ${n <= value ? "text-accent" : "text-line hover:text-muted"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

export default function Reviews({ perfumeId }) {
  const { user } = useAuth();
  const [data, setData] = useState({ summary: { count: 0, average: 0, counts: {} }, reviews: [] });
  const [mine, setMine] = useState(null);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [shown, setShown] = useState(5);

  const load = useCallback(async () => {
    try {
      setData(await api(`/reviews/perfume/${perfumeId}`));
      if (user) {
        const m = await api(`/reviews/perfume/${perfumeId}/mine`);
        setMine(m);
        setRating(m.review?.rating ?? 0);
        setBody(m.review?.body ?? "");
      } else setMine(null);
    } catch { /* section stays empty */ }
  }, [perfumeId, user]);

  useEffect(() => { load(); }, [load]);

  async function submit(e) {
    e.preventDefault();
    setError(""); setSaved(false);
    if (!rating) return setError("Please choose a star rating.");
    setSaving(true);
    try {
      await api(`/reviews/perfume/${perfumeId}`, { method: "PUT", body: { rating, body } });
      setSaved(true);
      await load();
    } catch (err) {
      setError(err.message || "Could not save your review.");
    } finally { setSaving(false); }
  }

  async function remove() {
    if (!confirm("Delete your review?")) return;
    await api(`/reviews/perfume/${perfumeId}/mine`, { method: "DELETE" });
    setRating(0); setBody(""); load();
  }

  const { summary, reviews } = data;

  return (
    <section aria-labelledby="reviews-title" className="mt-12 border-t border-line pt-10">
      <h2 id="reviews-title" className="text-xl font-extrabold uppercase tracking-tight sm:text-2xl">Reviews</h2>

      {/* Summary */}
      <div className="mt-5 flex flex-col gap-6 sm:flex-row sm:items-center">
        <div className="flex items-center gap-3">
          <span className="text-5xl font-extrabold leading-none">{summary.count ? summary.average.toFixed(1) : "–"}</span>
          <div>
            <Stars value={summary.average} size="text-xl" />
            <p className="text-xs text-muted">{summary.count} review{summary.count === 1 ? "" : "s"}</p>
          </div>
        </div>
        {summary.count > 0 && (
          <div className="flex-1 space-y-1 sm:max-w-xs">
            {[5, 4, 3, 2, 1].map((n) => (
              <div key={n} className="flex items-center gap-2 text-xs">
                <span className="w-3 text-muted">{n}</span>
                <div className="h-1.5 flex-1 bg-line">
                  <div className="h-full bg-accent" style={{ width: `${((summary.counts[n] || 0) / summary.count) * 100}%` }} />
                </div>
                <span className="w-5 text-right text-muted">{summary.counts[n] || 0}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Write a review */}
      <div className="mt-8 border border-line bg-surface p-4 sm:p-5">
        {!user ? (
          <p className="text-sm text-muted">
            <Link to="/login" className="font-semibold text-fg underline">Log in</Link> to write a review. Only customers who received this perfume can review it.
          </p>
        ) : mine && !mine.canReview ? (
          <p className="text-sm text-muted">Only customers who have received this perfume can write a review.</p>
        ) : mine ? (
          <form onSubmit={submit} className="space-y-3">
            <p className="text-sm font-semibold">{mine.review ? "Edit your review" : "Write your review"}</p>
            <StarPicker value={rating} onChange={setRating} />
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={1000}
              rows={4}
              placeholder="How does it smell? How long does it last?"
              className="w-full border border-line bg-bg p-3 text-base text-fg placeholder:text-muted"
            />
            {error && <p className="text-sm text-danger">{error}</p>}
            {saved && <p className="text-sm text-muted">Thanks! Your review is saved.</p>}
            <div className="flex flex-wrap gap-2">
              <button disabled={saving} className="min-h-11 bg-accent px-5 text-sm font-semibold uppercase text-accent-fg disabled:opacity-50">
                {saving ? "Saving…" : mine.review ? "Update review" : "Submit review"}
              </button>
              {mine.review && (
                <button type="button" onClick={remove} className="min-h-11 border border-line px-5 text-sm">Delete</button>
              )}
            </div>
          </form>
        ) : null}
      </div>

      {/* List */}
      <ul className="mt-8 divide-y divide-line">
        {reviews.slice(0, shown).map((r) => (
          <li key={r.id} className="py-5">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
              <Stars value={r.rating} />
              <span className="text-sm font-semibold">{r.name}</span>
              <span className="border border-line px-1.5 py-0.5 text-[10px] uppercase tracking-wide text-muted">Verified buyer</span>
              <span className="text-xs text-muted">{fmt(r.createdAt)}</span>
            </div>
            {r.body && <p className="mt-2 whitespace-pre-line text-sm leading-relaxed">{r.body}</p>}
          </li>
        ))}
        {!reviews.length && <li className="py-5 text-sm text-muted">No reviews yet.</li>}
      </ul>
      {reviews.length > shown && (
        <button onClick={() => setShown((s) => s + 5)} className="mt-2 min-h-11 border border-line px-5 text-sm">Show more</button>
      )}
    </section>
  );
}