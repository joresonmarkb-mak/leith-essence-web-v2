import { useEffect, useState } from "react";
import { api } from "../lib/api"; // change to `import api from` if yours is a default export

export default function ReviewButton({ perfumeId, perfumeName }) {
  const [open, setOpen] = useState(false);
  const [existing, setExisting] = useState(null);
  const [canReview, setCanReview] = useState(true);
  const [rating, setRating] = useState(0);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  

  useEffect(() => {
    let live = true;
    api(`/reviews/perfume/${perfumeId}/mine`)
      .then((m) => {
        if (!live) return;
        setCanReview(m.canReview);
        setExisting(m.review);
        setRating(m.review?.rating ?? 0);
        setBody(m.review?.body ?? "");
      })
      .catch(() => {});
    return () => { live = false; };
  }, [perfumeId]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!rating) return setError("Please choose a star rating.");
    setSaving(true);
    try {
      const saved = await api(`/reviews/perfume/${perfumeId}`, { method: "PUT", body: { rating, body } });
      setExisting(saved);
      setOpen(false);
    } catch (err) {
      setError(err.message || "Could not save your review.");
    } finally {
      setSaving(false);
    }
  }

  if (!canReview) return null;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="min-h-11 border border-line px-4 text-xs font-semibold uppercase tracking-wide hover:bg-panel"
      >
        {existing ? "Edit your review" : "Write a review"}
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 sm:items-center sm:p-4"
          onMouseDown={(e) => e.target === e.currentTarget && setOpen(false)}
        >
          <form
            onSubmit={submit}
            role="dialog"
            aria-modal="true"
            aria-label={`Review ${perfumeName}`}
            className="max-h-[90dvh] w-full max-w-md space-y-4 overflow-y-auto border border-line bg-bg p-5 text-fg"
          >
            <div>
              <p className="text-xs uppercase tracking-wide text-muted">Your review</p>
              <h3 className="text-lg font-extrabold">{perfumeName}</h3>
            </div>

            <div className="flex" role="radiogroup" aria-label="Your rating">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  type="button"
                  role="radio"
                  aria-checked={rating === n}
                  aria-label={`${n} star${n > 1 ? "s" : ""}`}
                  onClick={() => setRating(n)}
                  className={`h-11 w-11 text-3xl leading-none ${n <= rating ? "text-accent" : "text-line hover:text-muted"}`}
                >
                  ★
                </button>
              ))}
            </div>

            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              maxLength={1000}
              rows={4}
              placeholder="How does it smell? How long does it last?"
              className="w-full border border-line bg-surface p-3 text-base text-fg placeholder:text-muted"
            />

            {error && <p className="text-sm text-danger">{error}</p>}

            <div className="flex gap-2">
              <button
                disabled={saving}
                className="min-h-11 flex-1 bg-accent px-5 text-sm font-semibold uppercase text-accent-fg disabled:opacity-50"
              >
                {saving ? "Saving…" : existing ? "Update review" : "Submit review"}
              </button>
              <button type="button" onClick={() => setOpen(false)} className="min-h-11 border border-line px-5 text-sm">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </>
  );
}