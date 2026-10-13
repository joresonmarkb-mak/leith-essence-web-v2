import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { api } from "../lib/api.js";
import { pesoWhole, categoryLabel } from "../lib/format.js";
import { TOP_CHOICES } from "../lib/config.js";

const STAGGER = ["md:mt-24", "md:mt-12", "md:mt-0"];

// Match the config list to real perfumes. If none match, show the first three perfumes instead.
function pick(perfumes) {
  const byName = new Map(perfumes.map((p) => [p.name.trim().toLowerCase(), p]));
  const chosen = TOP_CHOICES
    .map((c) => ({ ...c, perfume: byName.get(c.name.trim().toLowerCase()) }))
    .filter((c) => c.perfume);
  if (chosen.length) return chosen.slice(0, 3);
  return perfumes.slice(0, 3).map((perfume) => ({ name: perfume.name, perfume }));
}

function Card({ item, index }) {
  const p = item.perfume;
  const price = pesoWhole(Number(p.fromPrice));
  const soldOut = p.piecesLeft === 0;
  const photo = item.image ?? p.imageUrl;
  const titleColor = item.tone === "light" ? "text-[#f2f2f2]" : "text-[#111]";

  return (
    <li className={`w-[72vw] max-w-[22rem] shrink-0 snap-center md:w-auto md:max-w-none ${STAGGER[index] ?? ""}`}>
      <p className="mb-2 font-mono text-[10px] uppercase tracking-widest">{categoryLabel(p.category)}</p>

      <Link
        to={`/perfume/${p.id}`}
        aria-label={`${p.name}, from ${price}`}
        className="@container relative block aspect-[3/4] overflow-hidden bg-line"
      >
        {photo && (
          <img
            src={photo} alt="" loading="lazy"
            className={`absolute inset-0 h-full w-full ${item.image ? "object-cover" : "object-contain p-[12%]"}`}
          />
        )}
        {!item.bakedText && (
          <>
            <span
              className={`absolute left-[6cqw] right-[6cqw] top-[5cqw] text-[length:16cqw] font-extrabold uppercase leading-[0.88] tracking-tighter ${titleColor}`}
            >
              {p.name}
            </span>
            {item.tags?.length > 0 && (
              <span className="absolute inset-x-[6cqw] bottom-[4cqw] flex justify-between gap-2 font-mono text-[length:max(10px,3.2cqw)] uppercase tracking-wider text-[#e8e8e8] [text-shadow:0_1px_2px_rgb(0_0_0/0.6)]">
                {item.tags.slice(0, 3).map((t) => <span key={t}>{t}</span>)}
              </span>
            )}
          </>
        )}
      </Link>

      <div className="mt-1 flex items-center justify-between">
        {soldOut ? (
          <span className="text-[11px] font-medium uppercase tracking-wider text-muted">Sold out</span>
        ) : (
          <Link
            to={`/perfume/${p.id}`}
            className="inline-flex min-h-[44px] items-center text-[11px] font-medium uppercase tracking-wider underline underline-offset-4"
          >
            Buy now
          </Link>
        )}
        <span className="text-lg font-medium tabular-nums">{price}</span>
      </div>
    </li>
  );
}

export default function TopChoices() {
  const [items, setItems] = useState(null);

  useEffect(() => {
    api("/shop/perfumes")
      .then((list) => setItems(pick(Array.isArray(list) ? list : list.perfumes ?? [])))
      .catch(() => setItems([]));
  }, []);

  if (!items || items.length === 0) return null;

  return (
    <section aria-labelledby="top-choices-title" className="mx-auto max-w-[1200px] px-4 pb-20 pt-16 sm:px-8 sm:pt-24">
      <h2
        id="top-choices-title"
        className="display-title text-center text-[length:clamp(2.75rem,11.5vw,9.5rem)] uppercase leading-none"
      >
        Top choices
      </h2>

      <ul className="mt-10 flex snap-x snap-mandatory items-start gap-4 overflow-x-auto pb-2 [scrollbar-width:none] md:mt-14 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible [&::-webkit-scrollbar]:hidden">
        {items.map((item, i) => <Card key={item.perfume.id} item={item} index={i} />)}
      </ul>

      <div className="mt-14 flex justify-center">
        <Link to="/shop" className="group inline-flex min-h-[44px] items-center gap-3 text-[11px] font-medium uppercase tracking-wider">
          Shop more
          <span className="grid h-8 w-8 place-items-center rounded-full border border-fg transition group-hover:bg-accent group-hover:text-accent-fg" aria-hidden="true">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12h16M14 6l6 6-6 6" />
            </svg>
          </span>
        </Link>
      </div>
    </section>
  );
}