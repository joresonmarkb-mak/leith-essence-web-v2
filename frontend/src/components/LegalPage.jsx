import { useEffect } from "react";
import { Link } from "react-router-dom";
import { LEGAL } from "../lib/legal.js";

const PAGES = [
  ["Privacy Policy", "/privacy"],
  ["Terms and Conditions", "/terms"],
  ["Cookie Policy", "/cookies"],
];

export default function LegalPage({ title, intro, sections }) {
  useEffect(() => {
    document.title = `${title} | ${LEGAL.brand}`;
  }, [title]);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-8 sm:py-20">
      <p className="font-mono text-[11px] uppercase tracking-wider text-muted">
        Last updated: {LEGAL.updated}
      </p>
      <h1 className="mt-3 text-[length:clamp(2rem,6vw,3.5rem)] font-extrabold uppercase leading-[0.95] tracking-tight">
        {title}
      </h1>
      {intro && <p className="mt-6 text-sm leading-relaxed sm:text-base">{intro}</p>}

      <nav aria-label="On this page" className="mt-8 border-y border-line py-4">
        <p className="font-mono text-[11px] uppercase tracking-wider text-muted">On this page</p>
        <ol className="mt-3 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          {sections.map((s, i) => (
            <li key={s.id}>
              <a href={`#${s.id}`} className="inline-flex min-h-9 items-center hover:underline">
                {i + 1}. {s.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      <div className="mt-10 space-y-10">
        {sections.map((s, i) => (
          <section key={s.id} id={s.id} className="scroll-mt-20">
            <h2 className="text-lg font-bold uppercase tracking-tight sm:text-xl">
              {i + 1}. {s.title}
            </h2>
            <div className="mt-3 space-y-3 text-sm leading-relaxed sm:text-[15px]">
              {s.body.map((b, j) =>
                typeof b === "string" ? (
                  <p key={j}>{b}</p>
                ) : (
                  <ul key={j} className="list-disc space-y-1.5 pl-5">
                    {b.list.map((li) => <li key={li}>{li}</li>)}
                  </ul>
                )
              )}
            </div>
          </section>
        ))}
      </div>

      <div className="mt-14 flex flex-wrap gap-x-6 gap-y-1 border-t border-line pt-6 text-xs">
        {PAGES.filter(([label]) => label !== title).map(([label, to]) => (
          <Link key={to} to={to} className="inline-flex min-h-11 items-center underline">{label}</Link>
        ))}
      </div>
    </main>
  );
}