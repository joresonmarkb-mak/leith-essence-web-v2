import { useCallback, useEffect, useRef, useState } from "react";

// same base your api.js uses
const BASE = import.meta.env.VITE_API_URL ?? "/api";

const SHOW_AFTER_MS = 1200;        // only show the screen if the server is slower than this
const RETRY_MS = 3000;
const GIVE_UP_MS = 120_000;        // after 2 minutes, offer "Try again" / "Continue anyway"
const STALE_MS = 10 * 60 * 1000;   // re-check when the tab returns after this long

const MESSAGES = [
  "Warming up the notes",
  "Blending top, heart and base",
  "Letting the scent settle",
  "Almost ready to spritz",
];

const CSS = `
.le-fill { transform: translateY(104px); }
@keyframes le-fill { from { transform: translateY(146px); } to { transform: translateY(74px); } }
@keyframes le-wave { to { transform: translateX(-30px); } }
@keyframes le-mist {
  0%   { opacity: 0; transform: translate(0, 0) scale(.5); }
  15%  { opacity: .9; }
  100% { opacity: 0; transform: translate(var(--dx), var(--dy)) scale(1.5); }
}
@keyframes le-in { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: none; } }
@keyframes le-slide { from { transform: translateX(-100%); } to { transform: translateX(300%); } }
@keyframes le-blink { 0%, 80%, 100% { opacity: .2; } 40% { opacity: 1; } }

.le-fill.le-a  { animation: le-fill 5s ease-in-out infinite alternate; }
.le-wave.le-a  { animation: le-wave 1.6s linear infinite; }
.le-mist       { transform-box: fill-box; transform-origin: center; }
.le-mist.le-a  { animation: le-mist 2.2s ease-out infinite; }
.le-msg        { animation: le-in .5s ease both; }
.le-slide.le-a { animation: le-slide 1.6s ease-in-out infinite; }
.le-dot.le-a   { animation: le-blink 1.2s infinite; }

@media (prefers-reduced-motion: reduce) {
  .le-a, .le-msg { animation: none !important; }
}
`;

function Bottle() {
  const mist = [
    { dx: "30px", dy: "-18px", delay: "0s" },
    { dx: "26px", dy: "-6px", delay: ".35s" },
    { dx: "34px", dy: "-28px", delay: ".7s" },
    { dx: "22px", dy: "-24px", delay: "1.05s" },
    { dx: "36px", dy: "-12px", delay: "1.4s" },
  ];
  return (
    <svg
      viewBox="0 0 140 170"
      className="h-40 w-auto sm:h-48"
      aria-hidden="true"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <defs>
        <clipPath id="le-body">
          <rect x="30" y="62" width="60" height="84" rx="8" />
        </clipPath>
      </defs>

      {/* liquid: rises and falls, with a gently moving wave on top */}
      <g clipPath="url(#le-body)" stroke="none">
        <g className="le-fill le-a">
          <path
            className="le-wave le-a"
            fill="currentColor"
            fillOpacity="0.85"
            d="M0 0 q7.5 -6 15 0 t15 0 t15 0 t15 0 t15 0 t15 0 t15 0 t15 0 t15 0 t15 0 V100 H0 Z"
          />
        </g>
      </g>

      {/* bottle */}
      <rect x="30" y="62" width="60" height="84" rx="8" />
      <path d="M50 62v-12h20v12" />
      <rect x="46" y="38" width="28" height="12" rx="2" />
      <path d="M60 38v-8h6" />
      <path d="M38 72v50" strokeOpacity="0.45" />

      {/* mist from the nozzle */}
      {mist.map((m, i) => (
        <circle
          key={i}
          cx="68"
          cy="30"
          r="1.8"
          fill="currentColor"
          stroke="none"
          className="le-mist le-a"
          style={{ "--dx": m.dx, "--dy": m.dy, animationDelay: m.delay }}
        />
      ))}
    </svg>
  );
}

export default function WakeUp() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [failed, setFailed] = useState(false);
  const [preview, setPreview] = useState(false);
  const [msg, setMsg] = useState(0);
  const [waited, setWaited] = useState(0);
  const run = useRef(0);          // which check is current (older ones stop)
  const shown = useRef(false);
  const lastOk = useRef(0);

  const show = () => { shown.current = true; setLeaving(false); setVisible(true); };
  const hide = () => {
    setLeaving(true);
    setTimeout(() => { shown.current = false; setVisible(false); setLeaving(false); }, 450);
  };

  const check = useCallback(async () => {
    const id = ++run.current;
    const started = Date.now();
    setFailed(false);
    const timer = setTimeout(() => { if (run.current === id) show(); }, SHOW_AFTER_MS);

    while (run.current === id) {
      try {
        const ctrl = new AbortController();
        const t = setTimeout(() => ctrl.abort(), 25_000);
        const res = await fetch(`${BASE}/health`, { signal: ctrl.signal, cache: "no-store" });
        clearTimeout(t);
        if (res.ok) break;
      } catch { /* server still waking up: try again */ }

      if (Date.now() - started > GIVE_UP_MS) {
        clearTimeout(timer);
        if (run.current === id) { show(); setFailed(true); }
        return;
      }
      await new Promise((r) => setTimeout(r, RETRY_MS));
    }

    clearTimeout(timer);
    if (run.current !== id) return;
    lastOk.current = Date.now();
    if (shown.current) hide();
  }, []);

  // check once when the site opens; ?wake=1 shows the screen so you can preview it
  useEffect(() => {
    if (new URLSearchParams(window.location.search).get("wake") === "1") {
      setPreview(true);
      show();
      return;
    }
    check();
    return () => { run.current++; };
  }, [check]);

  // check again when someone returns to the tab after a long break
  useEffect(() => {
    const onVisible = () => {
      if (document.visibilityState === "visible" && lastOk.current && Date.now() - lastOk.current > STALE_MS) check();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [check]);

  // rotate the messages while waiting
  useEffect(() => {
    if (!visible || failed) return;
    setMsg(0);
    setWaited(0);
    const t = setInterval(() => {
      setMsg((m) => (m + 1) % MESSAGES.length);
      setWaited((w) => w + 3.2);
    }, 3200);
    return () => clearInterval(t);
  }, [visible, failed]);

  if (!visible) return null;

  const closable = failed || preview;
  const btn = "min-h-11 border border-line px-5 text-xs font-semibold uppercase tracking-wide";

  return (
    <div
      role="status"
      aria-live="polite"
      aria-busy={!failed}
      className={`fixed inset-0 z-[100] flex flex-col items-center justify-center gap-8 bg-bg px-6 text-center text-fg transition-opacity duration-500 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
    >
      <style>{CSS}</style>

      <Bottle />

      <div className="max-w-xs">
        <p className="text-xl font-extrabold uppercase tracking-[0.3em] sm:text-2xl">Leith Essence</p>

        {failed ? (
          <p className="mt-3 font-mono text-[11px] leading-relaxed text-muted sm:text-xs">
            We're having trouble reaching the server. Check your connection and try again.
          </p>
        ) : (
          <>
            <p key={msg} className="le-msg mt-3 font-mono text-[11px] uppercase tracking-wider text-muted sm:text-xs">
              {MESSAGES[msg]}
              <span aria-hidden="true">
                {[0, 1, 2].map((i) => (
                  <span key={i} className="le-dot le-a" style={{ animationDelay: `${i * 0.2}s` }}>.</span>
                ))}
              </span>
            </p>
            {waited >= 25 && (
              <p className="mt-4 font-mono text-[11px] leading-relaxed text-muted">
                The first visit after a quiet spell takes a little longer. Thank you for waiting.
              </p>
            )}
          </>
        )}
      </div>

      {!failed && (
        <div className="relative h-px w-40 overflow-hidden bg-line" aria-hidden="true">
          <div className="le-slide le-a absolute inset-y-0 w-1/3 bg-fg" />
        </div>
      )}

      {closable && (
        <div className="flex flex-wrap justify-center gap-2">
          {failed && (
            <button type="button" onClick={check} className={`${btn} bg-accent text-accent-fg`}>
              Try again
            </button>
          )}
          <button type="button" onClick={hide} className={btn}>
            {failed ? "Continue anyway" : "Close preview"}
          </button>
        </div>
      )}
    </div>
  );
}