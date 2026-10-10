import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate, useParams } from "react-router-dom";
import { api } from "../lib/api.js";
import { peso } from "../lib/format.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import ProductCard from "../components/ProductCard.jsx";
import QtyStepper from "../components/QtyStepper.jsx";
import { CoolIcon, SummerIcon, DayIcon, NightIcon } from "../components/WearIcons.jsx";

const CATEGORY_LABEL = { for_him: "For him", for_her: "For her", unisex: "Unisex" };
const WEAR = [
  ["cool", "Cool", CoolIcon],
  ["summer", "Summer", SummerIcon],
  ["day", "Day", DayIcon],
  ["night", "Night", NightIcon],
];

const Section = ({ title, children }) => (
  <details open className="group border-t border-line py-4">
    <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-semibold uppercase tracking-wide">
      {title}
      <span aria-hidden="true" className="transition group-open:rotate-180">⌃</span>
    </summary>
    <div className="mt-4">{children}</div>
  </details>
);

// key={id} resets everything when you open another perfume from "You may also like"
export default function PerfumeDetail() {
  const { id } = useParams();
  return <Detail key={id} id={id} />;
}

function Detail({ id }) {
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [perfume, setPerfume] = useState(null);
  const [error, setError] = useState("");
  const [sizeMl, setSizeMl] = useState(null);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState({ type: "", text: "" });

  useEffect(() => {
    let ignore = false;
    api(`/shop/perfumes/${id}`)
      .then((p) => {
        if (ignore) return;
        setPerfume(p);
        setSizeMl(p.sizes[0]?.sizeMl ?? null);
      })
      .catch((e) => { if (!ignore) setError(e.message); });
    return () => { ignore = true; };
  }, [id]);

  if (error) return <p role="alert" className="p-10 text-center text-danger">{error}</p>;
  if (!perfume) return <p className="p-10 text-center text-muted">Loading...</p>;

  const sizes = perfume.sizes.map((s) => ({ ...s, price: Number(s.price) }));
  const size = sizes.find((s) => s.sizeMl === sizeMl);
  const max = size?.available ?? 1;

  function pickSize(ml) {
    setSizeMl(ml);
    const available = sizes.find((s) => s.sizeMl === ml).available;
    setQty((q) => Math.min(q, available));
    setStatus({ type: "", text: "" });
  }

  async function add(goToBag) {
    if (!user) return navigate("/login", { state: { from: location } });
    setBusy(true);
    setStatus({ type: "", text: "" });
    try {
      await addItem(perfume.id, sizeMl, qty);
      if (goToBag) return navigate("/cart");
      setStatus({ type: "ok", text: `Added ${qty} x ${perfume.name} ${sizeMl}ml to your bag.` });
    } catch (e) {
      setStatus({ type: "error", text: e.message });
    } finally {
      setBusy(false);
    }
  }

  const wears = new Set(perfume.whenToWear ?? []);

  return (
    <div className="mx-auto max-w-[1200px] px-4 pb-16 pt-6 sm:px-6">
      <Link to="/shop" className="text-[11px] font-medium uppercase tracking-wide text-muted hover:text-fg">
        &larr; All perfumes
      </Link>

      <div className="mt-4 grid gap-8 md:grid-cols-2 md:gap-12">
        <div className="flex items-center justify-center bg-surface p-6 md:p-10">
          {perfume.imageUrl ? (
            <img src={perfume.imageUrl} alt={perfume.name} className="max-h-[420px] w-full object-contain" />
          ) : (
            <span className="py-24 text-sm uppercase text-muted">No photo yet</span>
          )}
        </div>

        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold uppercase leading-none tracking-tight sm:text-4xl">{perfume.name}</h1>
              <p className="mt-2 font-serif text-base italic text-muted">
                {perfume.inspiredBy ? `Character of ${perfume.inspiredBy}` : ""}
                <span className="ml-2 font-sans text-[10px] font-semibold not-italic uppercase text-fg">
                  {CATEGORY_LABEL[perfume.category]}
                </span>
              </p>
            </div>
            {size && <p className="text-2xl sm:text-3xl">{peso(size.price)}</p>}
          </div>

          {perfume.soldOut ? (
            <p className="mt-8 border border-line p-4 text-center text-sm uppercase text-muted">Sold out for now</p>
          ) : (
            <>
              <fieldset className="mt-6">
                <legend className="sr-only">Choose a size</legend>
                <div className="flex flex-wrap gap-3">
                  {sizes.map((s) => (
                    <label
                      key={s.sizeMl}
                      className={`flex min-h-11 cursor-pointer items-center gap-2 border px-4 text-xs transition ${
                        s.sizeMl === sizeMl ? "border-fg" : "border-line hover:border-muted"
                      }`}
                    >
                      <input
                        type="radio" name="size" checked={s.sizeMl === sizeMl}
                        onChange={() => pickSize(s.sizeMl)} className="accent-accent"
                      />
                      {s.sizeMl}ml / {peso(s.price)}
                    </label>
                  ))}
                </div>
              </fieldset>

              <div className="mt-4 flex items-stretch gap-3">
                <QtyStepper value={qty} onChange={setQty} max={max} disabled={busy} />
                <button
                  type="button" disabled={busy} onClick={() => add(true)}
                  className="min-h-11 flex-1 border border-fg/60 text-[11px] font-medium uppercase transition hover:bg-fg/5 disabled:opacity-50"
                >
                  Buy
                </button>
                <button
                  type="button" disabled={busy} onClick={() => add(false)} aria-label="Add to bag"
                  className="min-h-11 w-12 bg-accent text-xl leading-none text-accent-fg transition hover:opacity-80 disabled:opacity-50"
                >
                  +
                </button>
              </div>
              <p className="mt-1 text-[11px] text-muted">{max} left in {size?.sizeMl}ml</p>
              <p
                role="status"
                className={`mt-2 min-h-5 text-sm ${status.type === "error" ? "text-danger" : "text-success"}`}
              >
                {status.text}
              </p>
            </>
          )}

          <div className="mt-6">
            {perfume.description && (
              <Section title="Details">
                <p className="text-sm leading-relaxed">{perfume.description}</p>
              </Section>
            )}
            <Section title="Key notes">
              <ul className="grid grid-cols-3 gap-3">
                {perfume.notes.map((n) => (
                  <li key={n.id} className="text-center">
                    {n.imageUrl ? (
                      <img src={n.imageUrl} alt={n.name} loading="lazy" className="aspect-square w-full object-cover shadow-sm" />
                    ) : (
                      <div className="flex aspect-square w-full items-center justify-center bg-panel p-1 text-[10px] uppercase text-muted">
                        {n.name}
                      </div>
                    )}
                    <p className="mt-1 text-[11px] leading-tight text-muted">{n.name}</p>
                  </li>
                ))}
              </ul>
            </Section>
            <Section title="When to wear">
              <ul className="flex gap-6">
                {WEAR.map(([key, label, Icon]) => (
                  <li
                    key={key}
                    className={`flex flex-col items-center gap-1 text-[11px] ${wears.has(key) ? "text-fg" : "text-muted opacity-40"}`}
                    aria-label={`${label}${wears.has(key) ? ", recommended" : ""}`}
                  >
                    <Icon />
                    {label}
                  </li>
                ))}
              </ul>
            </Section>
          </div>
        </div>
      </div>

      {perfume.related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-sm font-semibold uppercase tracking-wide">You may also like</h2>
          <div className="mb-8 mt-3 h-px bg-gradient-to-r from-transparent via-line to-transparent" />
          <div className="grid grid-cols-2 gap-x-4 gap-y-10 lg:grid-cols-4">
            {perfume.related.map((p) => <ProductCard key={p.id} perfume={p} />)}
          </div>
        </section>
      )}
    </div>
  );
}