import { useEffect, useRef, useState } from "react";
import { api } from "../../lib/api.js";
import { input, labelCls, btn, btnGhost, asList } from "./ui.js";

const fmt = (d) =>
  new Date(d).toLocaleString("en-PH", { timeZone: "Asia/Manila", dateStyle: "medium", timeStyle: "short" });

const PRESETS = {
  arrived: {
    label: "New perfumes arrived",
    subject: "New perfumes have arrived",
    message:
      "Fresh arrivals have just landed at Leith Essence.\n\nDiscover our newest scents and find the one that feels like you.",
  },
  stocks: {
    label: "New stocks are in",
    subject: "New stocks are in",
    message:
      "We've restocked! Your favorite scents are available again.\n\nPieces are limited, so grab yours before they're gone.",
  },
  custom: { label: "Write my own", subject: "", message: "" },
};

const AUDIENCES = [
  ["all", "Everyone (users and subscribers)"],
  ["subscribers", "Subscribers only"],
  ["users", "Users only"],
];

export default function AnnounceButton() {
  const ref = useRef(null);
  const timer = useRef(null);
  const [perfumes, setPerfumes] = useState([]);
  const [perfumeId, setPerfumeId] = useState("");
  const [preset, setPreset] = useState("arrived");
  const [subject, setSubject] = useState(PRESETS.arrived.subject);
  const [message, setMessage] = useState(PRESETS.arrived.message);
  const [who, setWho] = useState("all");
  const [preview, setPreview] = useState(null);
  const [job, setJob] = useState(null);
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const [info, setInfo] = useState("");
  const [error, setError] = useState("");

  useEffect(() => () => clearInterval(timer.current), []);

  async function loadJob() {
    try {
      const list = await api("/announcements");
      const latest = Array.isArray(list) ? list[0] : null;
      setJob(latest ?? null);
      if (latest && latest.status !== "sending") clearInterval(timer.current);
      return latest;
    } catch {
      return null;
    }
  }

  function poll() {
    clearInterval(timer.current);
    timer.current = setInterval(loadJob, 3000);
  }
    function refreshPreview(pid) {
    return api(`/announcements/preview${pid ? `?perfumeId=${pid}` : ""}`)
        .then(setPreview)
        .catch((e) => setError(e.message));
    }
  async function open() {
    setError("");
    setInfo("");
    setConfirm(false);
    ref.current?.showModal();
    try {
      setPerfumes(asList(await api("/perfumes")));
    } catch (e) {
      setError(e.message || "Could not load perfumes.");
    }
    refreshPreview(perfumeId);
    const latest = await loadJob();
    if (latest?.status === "sending") poll();
  }

  useEffect(() => {
    if (!ref.current?.open) return;
    api(`/announcements/preview${perfumeId ? `?perfumeId=${perfumeId}` : ""}`)
      .then(setPreview)
      .catch((e) => setError(e.message));
  }, [perfumeId]);

  function pickPreset(key) {
    setPreset(key);
    setConfirm(false);
    if (key !== "custom") {
      setSubject(PRESETS[key].subject);
      setMessage(PRESETS[key].message);
    }
  }

  const counts = preview
    ? { all: preview.total, subscribers: preview.subscribers, users: preview.users }
    : null;
  const count = counts ? counts[who] : 0;
  const canSend = Boolean((subject.trim() || perfumeId) && (message.trim() || perfumeId));
  const sending = job?.status === "sending";

  async function send(testOnly) {
    setError("");
    setInfo("");
    if (!testOnly && !confirm) return setConfirm(true);
    setBusy(true);
    try {
      const res = await api("/announcements/send", {
        method: "POST",
        body: {
          perfumeId: perfumeId ? Number(perfumeId) : null,
          subject,
          message,
          audience: who,
          testOnly,
          force: Boolean(perfumeId && preview?.alreadySentAt),
        },
      });
      if (testOnly) {
        setInfo(`Test email sent to ${res.to}. Check your inbox (and spam).`);
      } else {
        setInfo(`Sending to ${res.total} ${res.total === 1 ? "person" : "people"}. You can close this window.`);
        await loadJob();
        poll();
      }
    } catch (e) {
      setError(e.message || "Something went wrong.");
    } finally {
      setBusy(false);
      setConfirm(false);
    }
  }

  return (
    <>
      <button type="button" onClick={open} className={btn}>Send announcement</button>

      <dialog
        ref={ref}
        onClose={() => setConfirm(false)}
        onClick={(e) => e.target === ref.current && ref.current.close()}
        className="m-auto max-h-[90dvh] w-[calc(100%-2rem)] max-w-md overflow-y-auto border border-line bg-surface p-0 text-inherit backdrop:bg-black/50"
      >
        <div className="space-y-4 p-5">
          <h2 className="text-lg font-semibold">Send an announcement</h2>

          <fieldset>
            <legend className={labelCls}>Send to</legend>
            <div className="mt-1 space-y-1">
              {AUDIENCES.map(([key, label]) => (
                <label key={key} className="flex min-h-11 cursor-pointer items-center gap-3 text-sm">
                  <input
                    type="radio"
                    name="ann-who"
                    value={key}
                    checked={who === key}
                    onChange={() => { setWho(key); setConfirm(false); }}
                    className="h-4 w-4"
                  />
                  <span>{label}{counts ? ` (${counts[key]})` : ""}</span>
                </label>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="ann-preset" className={labelCls}>Message type</label>
            <select id="ann-preset" value={preset} onChange={(e) => pickPreset(e.target.value)} className={input}>
              {Object.entries(PRESETS).map(([key, p]) => (
                <option key={key} value={key}>{p.label}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="ann-perfume" className={labelCls}>Perfume (optional)</label>
            <select
              id="ann-perfume"
              value={perfumeId}
              onChange={(e) => { setPerfumeId(e.target.value); setConfirm(false); }}
              className={input}
            >
              <option value="">No perfume (message only)</option>
              {perfumes.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <p className="mt-1 text-xs opacity-70">If you pick one, its photo and name are added to the email.</p>
          </div>

          <div>
            <label htmlFor="ann-subject" className={labelCls}>Subject</label>
            <input
              id="ann-subject"
              type="text"
              maxLength={120}
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder={perfumeId ? "Leave blank for: New scent: <perfume name>" : "Email subject"}
              className={input}
            />
          </div>

          <div>
            <label htmlFor="ann-msg" className={labelCls}>Message</label>
            <textarea
              id="ann-msg"
              rows={5}
              maxLength={600}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className={input}
            />
          </div>

          {preview && (
            <p className="text-sm">
              This goes to <strong>{count}</strong> {count === 1 ? "person" : "people"}. Anyone who unsubscribed is skipped.
            </p>
          )}
          {perfumeId && preview?.alreadySentAt && (
            <p className="text-sm text-amber-600">
              This perfume was already announced on {fmt(preview.alreadySentAt)}. Sending again will email people again.
            </p>
          )}

          {job && (
            <p role="status" className="text-sm opacity-80">
              Last send ({job.subject}):{" "}
              {job.status === "sending"
                ? `sending… ${job.sent + job.failed} of ${job.total}`
                : job.status === "done"
                ? `done, ${job.sent} sent, ${job.failed} failed`
                : `stopped, ${job.sent} sent, ${job.failed} failed`}
            </p>
          )}

          {info && <p role="status" className="text-sm">{info}</p>}
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <button type="button" className={btnGhost} onClick={() => ref.current.close()}>Close</button>
            <button type="button" className={btnGhost} disabled={!canSend || busy} onClick={() => send(true)}>
              Send test to me
            </button>
            <button
              type="button"
              className={btn}
              disabled={!canSend || busy || sending || count === 0}
              onClick={() => send(false)}
            >
              {busy ? "Please wait…" : confirm ? `Yes, send to ${count}` : "Send"}
            </button>
          </div>
        </div>
      </dialog>
    </>
  );
}