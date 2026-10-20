// ✏️ Edit these. Add or remove entries as you like.
const LINKS = [
  {
    key: "facebook",
    label: "Facebook",
    name: "Leith Essence",
    note: "Follow our page for new scents and restocks.",
    href: "https://www.facebook.com/profile.php?id=61575592087463", // ← put your real page link
  },
  {
    key: "instagram",
    label: "Instagram",
    name: "@leithessence.ph",
    note: "See the bottles up close.",
    href: "https://www.instagram.com/leithessence.ph/",
  },
  {
    key: "location",
    label: "Location",
    name: "Mangatarem, Pangasinan",
    note: "Philippines. Tap to open the map.",
    href: "https://www.google.com/maps/search/?api=1&query=Mangatarem+Pangasinan",
  },
];

const ICON = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round",
  strokeLinejoin: "round",
  viewBox: "0 0 48 48",
  "aria-hidden": true,
  className: "h-9 w-9 shrink-0 sm:h-11 sm:w-11",
};

const ICONS = {
  facebook: (
    <svg {...ICON}>
      <path d="M30 43V26h6l1.2-7H30v-4.5c0-2 1-3.5 3.6-3.5H37V5.3C36.2 5.2 34.6 5 32.8 5 28 5 25 8 25 13v6h-6v7h6v17Z" />
    </svg>
  ),
  instagram: (
    <svg {...ICON}>
      <rect x="6" y="6" width="36" height="36" rx="10" />
      <circle cx="24" cy="24" r="8.5" />
      <circle cx="34.5" cy="13.5" r="1.3" fill="currentColor" />
    </svg>
  ),
  location: (
    <svg {...ICON}>
      <path d="M24 43s13-11.5 13-22a13 13 0 1 0-26 0c0 10.5 13 22 13 22Z" />
      <circle cx="24" cy="21" r="4.5" />
    </svg>
  ),
};

export default function FindUs() {
  return (
    <section aria-labelledby="findus-title" className="mx-auto max-w-[1200px] px-4 py-10 sm:px-8 sm:py-24">
      <header className="mb-10 text-center sm:mb-14">
         <h2 className="display-title mt-12 text-balance text-center text-3xl sm:mt-14 sm:text-5xl">
          FIND US
        </h2>
        <p className="mt-2 font-mono text-[10px] uppercase tracking-wider sm:text-[11px]">
          Follow along, say hello, or come see us.
        </p>
      </header>

      <ul className="grid gap-px border border-line bg-line sm:grid-cols-3">
        {LINKS.map((l) => (
          <li key={l.key} className="bg-bg">
            <a
              href={l.href}
              target="_blank"
              rel="noopener noreferrer"
              className="group flex h-full min-h-11 items-center gap-4 p-5 transition-colors hover:bg-surface sm:flex-col sm:items-start sm:justify-between sm:gap-10 sm:p-7"
            >
              {ICONS[l.key]}

              <div className="min-w-0 flex-1 sm:w-full sm:flex-none">
                <p className="font-mono text-[10px] uppercase tracking-wider text-muted sm:text-[11px]">{l.label}</p>
                <p className="mt-1 break-words text-base font-bold uppercase tracking-wide sm:text-lg">{l.name}</p>
                <p className="mt-1 font-mono text-[11px] leading-snug text-muted sm:text-xs">{l.note}</p>
              </div>

              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="h-5 w-5 shrink-0 text-muted transition-transform group-hover:translate-x-1 group-hover:text-fg sm:self-end"
              >
                <path d="M5 12h14M13 6l6 6-6 6" />
              </svg>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}