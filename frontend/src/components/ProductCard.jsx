import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import { peso } from "../lib/format.js";

const CATEGORY_LABEL = { for_him: "For him", for_her: "For her", unisex: "Unisex" };

export default function ProductCard({ perfume }) {
  const { user } = useAuth();
  const { addItem } = useCart();
  const navigate = useNavigate();
  const [status, setStatus] = useState("");

  const sizes = perfume.sizes.map((s) => ({ ...s, price: Number(s.price) }));
  const cheapest = sizes.reduce((a, b) => (b.price < a.price ? b : a), sizes[0]);
  const detail = `/perfume/${perfume.id}`;

  async function quickAdd() {
    if (!user) return navigate("/login", { state: { from: { pathname: "/shop" } } });
    try {
      await addItem(perfume.id, cheapest.sizeMl);
      setStatus(`Added ${cheapest.sizeMl}ml to your bag`);
    } catch (err) {
      setStatus(err.message);
    }
    setTimeout(() => setStatus(""), 3000);
  }

  return (
    <article className="flex min-w-0 flex-col">
      <Link to={detail} className="block border-b border-line pb-1 text-center">
        <h3 className="text-sm font-bold uppercase leading-tight tracking-tight sm:text-lg">{perfume.name}</h3>
        <span className="mt-0.5 block text-right text-[10px] font-semibold uppercase">
          {CATEGORY_LABEL[perfume.category]}
        </span>
      </Link>

      <Link to={detail} className="my-3 flex h-48 items-center justify-center sm:my-4 sm:h-56">
        {perfume.imageUrl ? (
          <img src={perfume.imageUrl} alt={perfume.name} loading="lazy" className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="text-xs uppercase text-muted">No photo yet</span>
        )}
      </Link>

      <div className="flex items-baseline justify-between gap-2 border-b border-line pb-1 font-serif text-xs italic text-muted">
        <span className="min-w-0 truncate">{perfume.inspiredBy ? `Character of ${perfume.inspiredBy}` : ""}</span>
        <span className="shrink-0 text-[10px]">{perfume.piecesLeft} pcs left</span>
      </div>

      <div className="flex items-baseline justify-between gap-2 py-1.5">
        <span className="font-serif text-base italic">{sizes.length > 1 ? "From" : "Only for"}</span>
        <span className="text-lg sm:text-xl">{peso(Number(perfume.fromPrice))}</span>
      </div>

      <div className="flex">
        <Link to={detail} className="flex-1 border border-fg/60 py-3 text-center text-[11px] font-medium uppercase transition hover:bg-fg/5">
          Buy
        </Link>
        <button
          type="button"
          onClick={quickAdd}
          aria-label={`Add ${perfume.name} ${cheapest.sizeMl}ml to bag`}
          className="w-12 bg-accent text-xl leading-none text-accent-fg transition hover:opacity-80"
        >
          +
        </button>
      </div>
      <p role="status" className="mt-1 min-h-4 text-[11px] text-muted">{status}</p>
    </article>
  );
}