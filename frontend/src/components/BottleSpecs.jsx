const IMAGE = "/specs/bottle.png";

// x / y = where the dot sits on the photo, in % from the left / top.
// side = which side the label is on (desktop). Tweak these numbers to move a dot.
const CALLOUTS = [
  { label: "Magnetic cap", side: "left", x: 32, y: 22 },
  { label: "Pressurized atomizer", side: "left", x: 33, y: 36 },
  { label: "Slick bottle", side: "left", x: 26, y: 60 },
  { label: "New box", side: "right", x: 79, y: 73 },
];

const fade =
  "block w-fit sm:bg-gradient-to-r sm:from-fg sm:from-55% sm:to-muted sm:bg-clip-text sm:text-transparent";

/* Desktop: dot + line + label */
function Callout({ label, side, x, y }) {
  const left = side === "left";
  const style = left ? { top: `${y}%`, right: `${100 - x}%` } : { top: `${y}%`, left: `${x}%` };
  const dot = <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-white" />;
  const line = <span className="h-px w-6 shrink-0 bg-white/90" />;
  const text = (
    <span
      className={`max-w-[6.25rem] text-[10px] uppercase leading-tight tracking-wide text-white [text-shadow:0_1px_3px_rgba(0,0,0,0.7)] xl:text-[11px] ${
        left ? "text-right" : "text-left"
      }`}
    >
      {label}
    </span>
  );
  return (
    <div style={style} className="absolute flex -translate-y-1/2 items-center gap-1.5">
      {left ? <>{text}{line}{dot}</> : <>{dot}{line}{text}</>}
    </div>
  );
}

/* Phone / tablet: a small numbered dot */
function Marker({ n, x, y }) {
  return (
    <span
      style={{ top: `${y}%`, left: `${x}%` }}
      className="absolute grid h-4 w-4 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-[10px] font-bold leading-none text-black shadow sm:h-5 sm:w-5"
    >
      {n}
    </span>
  );
}

export default function BottleSpecs() {
  return (
    <section aria-labelledby="specs-title" className="mx-auto max-w-[1200px] px-4 py-12 sm:px-8 sm:py-20">
      <div className="grid grid-cols-[40fr_60fr] overflow-hidden bg-surface lg:grid-cols-2">
        {/* Text */}
        <div className="flex min-w-0 flex-col justify-center p-3 sm:p-8 lg:p-14">
          <h2
            id="specs-title"
            className="text-[length:clamp(1.1rem,5.6vw,1.9rem)] font-extrabold uppercase leading-[0.95] tracking-tighter sm:text-[length:clamp(1.5rem,4.2vw,2.75rem)] lg:text-[length:clamp(2rem,4.6vw,3.75rem)]"
          >
            <span className={fade}>Built to feel</span>
            <span className={fade}>as good as it</span>
            <span className="block">smells</span>
          </h2>
          <p className="mt-4 hidden font-mono text-xs uppercase tracking-wider text-muted sm:block lg:mt-6">
            The details that come with every bottle.
          </p>
        </div>

        {/* Photo */}
        <div className="relative aspect-[4/3] min-w-0 bg-panel">
          <img
            src={IMAGE}
            alt="A Leith Essence perfume bottle next to its box"
            className="absolute inset-0 h-full w-full object-cover"
          />
          {/* below 1024px: numbered dots */}
          <div className="pointer-events-none absolute inset-0 lg:hidden">
            {CALLOUTS.map((c, i) => <Marker key={c.label} n={i + 1} x={c.x} y={c.y} />)}
          </div>
          {/* 1024px and up: full labels */}
          <div className="pointer-events-none absolute inset-0 hidden lg:block">
            {CALLOUTS.map((c) => <Callout key={c.label} {...c} />)}
          </div>
        </div>
      </div>

      {/* below 1024px: the key for the numbered dots */}
      <div className="lg:hidden">
        <p className="mt-4 font-mono text-[11px] uppercase tracking-wider text-muted sm:hidden">
          The details that come with every bottle.
        </p>
        <ul className="mt-4 grid grid-cols-2 gap-x-4 gap-y-3 font-mono text-[11px] uppercase sm:grid-cols-4 sm:text-xs">
          {CALLOUTS.map((c, i) => (
            <li key={c.label} className="flex items-center gap-2">
              <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-fg text-[10px] font-bold text-bg">
                {i + 1}
              </span>
              {c.label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}