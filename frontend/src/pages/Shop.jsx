import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../lib/api.js";
import ProductCard from "../components/ProductCard.jsx";

const selectClass =
  "cursor-pointer bg-transparent text-base outline-none sm:text-[11px] sm:font-semibold sm:uppercase";

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const category = params.get("category") ?? "";
  const sort = params.get("sort") ?? "name";
  const [perfumes, setPerfumes] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    const qs = new URLSearchParams({ sort });
    if (category) qs.set("category", category);
    api(`/shop/perfumes?${qs}`)
      .then((data) => { if (!ignore) { setPerfumes(data); setError(""); } })
      .catch((err) => { if (!ignore) setError(err.message); });
    return () => { ignore = true; };
  }, [category, sort]);

  const update = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    setParams(next, { replace: true });
  };

  return (
    <div className="mx-auto max-w-[1440px] px-4 pb-16 pt-6 sm:px-[3.5%]">
      <div className="relative overflow-hidden bg-panel">
        <img src="/cover-all-perfume.png" alt="" className="h-48 w-full object-cover sm:h-64" />
        <p className="absolute right-3 top-3 text-right text-[10px] font-medium uppercase leading-tight text-white sm:right-5 sm:text-xs">
          Crafted for<br />presence.
        </p>
        {/* <p className="absolute inset-x-0 top-1/2 -translate-y-1/2 text-center text-[11px] uppercase tracking-[0.4em] text-white sm:text-sm">
          Extrait de parfum
        </p> */}
      </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-x-4 gap-y-3 sm:grid sm:grid-cols-[1fr_auto_1fr]">
        <label className="flex items-center gap-2 sm:justify-self-start">
            <span className="text-xs font-semibold uppercase sm:text-[11px]">Filter</span>
            <select value={category} onChange={(e) => update("category", e.target.value)} className={selectClass} aria-label="Filter by category">
            <option value="">All</option>
            <option value="for_him">For him</option>
            <option value="for_her">For her</option>
            <option value="unisex">Unisex</option>
            </select>
        </label>

        <h1 className="order-first w-full text-center text-sm font-semibold uppercase tracking-wide sm:order-none sm:w-auto sm:text-base">
            All perfumes
        </h1>

        <label className="flex items-center gap-2 sm:justify-self-end">
            <span className="text-xs font-semibold uppercase sm:text-[11px]">Sort</span>
            <select value={sort} onChange={(e) => update("sort", e.target.value === "name" ? "" : e.target.value)} className={selectClass} aria-label="Sort by">
            <option value="name">Name</option>
            <option value="newest">Newest</option>
            <option value="price_asc">Price: low to high</option>
            <option value="price_desc">Price: high to low</option>
            </select>
        </label>
        </div>

      <div className="mt-6 h-px bg-gradient-to-r from-transparent via-line to-transparent" />

      {error && <p role="alert" className="mt-10 text-center text-sm text-danger">{error}</p>}
      {!error && perfumes === null && <p className="mt-10 text-center text-sm text-muted">Loading perfumes...</p>}
      {!error && perfumes?.length === 0 && (
        <p className="mt-10 text-center text-sm text-muted">No perfumes match that filter right now.</p>
      )}
      {perfumes?.length > 0 && (
        <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:grid-cols-4">
          {perfumes.map((p) => <ProductCard key={p.id} perfume={p} />)}
        </div>
      )}
    </div>
  );
}