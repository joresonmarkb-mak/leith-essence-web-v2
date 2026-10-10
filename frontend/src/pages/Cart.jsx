import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { peso } from "../lib/format.js";
import { useCart } from "../context/CartContext.jsx";
import QtyStepper from "../components/QtyStepper.jsx";

const CATEGORY_LABEL = { for_him: "For him", for_her: "For her", unisex: "Unisex" };
const floz = (ml) => (ml * 0.033814).toFixed(2);

export default function Cart() {
  const { setCount } = useCart();
  const navigate = useNavigate();
  const [cart, setCart] = useState(null);
  const [error, setError] = useState("");
  const [unchecked, setUnchecked] = useState(() => new Set());
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let ignore = false;
    api("/cart")
      .then((c) => { if (!ignore) { setCart(c); setCount(c.count); } })
      .catch((e) => { if (!ignore) setError(e.message); });
    return () => { ignore = true; };
  }, [setCount]);

  async function run(id, request) {
    setBusyId(id);
    setError("");
    try {
      const c = await request();
      setCart(c);
      setCount(c.count);
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }
  const setQty = (item, quantity) => run(item.id, () => api(`/cart/${item.id}`, { method: "PATCH", body: { quantity } }));
  const remove = (item) => run(item.id, () => api(`/cart/${item.id}`, { method: "DELETE" }));
  const toggle = (id) =>
    setUnchecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });

  if (!cart) {
    return error
      ? <p role="alert" className="p-10 text-center text-danger">{error}</p>
      : <p className="p-10 text-center text-muted">Loading your bag...</p>;
  }

  const checked = cart.items.filter((i) => i.inStock && !unchecked.has(i.id));
  const subtotal = checked.reduce((s, i) => s + Number(i.lineTotal), 0);

  return (
    <div className="mx-auto max-w-2xl px-4 pb-0 pt-8 sm:px-6">
      <h1 className="text-xl font-semibold">Shopping Bag ({cart.count})</h1>
      {error && <p role="alert" className="mt-3 text-sm text-danger">{error}</p>}

      {cart.items.length === 0 ? (
        <div className="py-20 text-center">
          <p className="text-muted">Your shopping bag is empty.</p>
          <Link to="/shop" className="mt-6 inline-block bg-accent px-6 py-3 text-[11px] font-semibold uppercase text-accent-fg">
            Shop now
          </Link>
        </div>
      ) : (
        <>
          <ul className="mt-4 divide-y divide-line border-t border-line">
            {cart.items.map((item) => (
              <li key={item.id} className="flex gap-3 py-5 sm:gap-4">
                <input
                  type="checkbox" aria-label={`Select ${item.name} ${item.sizeMl}ml`}
                  disabled={!item.inStock} checked={item.inStock && !unchecked.has(item.id)}
                  onChange={() => toggle(item.id)} className="mt-2 h-5 w-5 shrink-0 accent-accent"
                />
                <Link to={`/perfume/${item.perfumeId}`} className="flex h-28 w-20 shrink-0 items-center justify-center bg-surface sm:h-32 sm:w-24">
                  {item.imageUrl && <img src={item.imageUrl} alt="" className="max-h-full max-w-full object-contain" />}
                </Link>
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <p className="text-sm font-semibold uppercase">
                      {item.name} <span className="ml-1 text-[10px] font-normal normal-case">{CATEGORY_LABEL[item.category]}</span>
                    </p>
                    <p className="shrink-0 text-sm">{peso(Number(item.lineTotal))}</p>
                  </div>
                  {item.inspiredBy && (
                    <p className="mt-0.5 font-serif text-xs italic text-muted">Inspired: {item.inspiredBy}</p>
                  )}
                  <p className="mt-0.5 text-xs text-muted">Size: {item.sizeMl}ml | {floz(item.sizeMl)} fl oz.</p>
                  {item.inStock ? (
                    <div className="mt-3 flex items-center gap-4">
                      <QtyStepper value={item.quantity} max={item.available} disabled={busyId === item.id} onChange={(q) => setQty(item, q)} />
                      <button type="button" onClick={() => remove(item)} disabled={busyId === item.id}
                        className="min-h-11 text-[11px] uppercase text-muted underline hover:text-fg">Remove</button>
                    </div>
                  ) : (
                    <div className="mt-3 flex items-center gap-4">
                      <p className="text-xs text-danger">
                        {item.available > 0 ? `Only ${item.available} left. Lower the quantity.` : "Out of stock"}
                      </p>
                      {item.available > 0 && (
                        <QtyStepper value={item.quantity} max={item.available} onChange={(q) => setQty(item, q)} />
                      )}
                      <button type="button" onClick={() => remove(item)}
                        className="min-h-11 text-[11px] uppercase text-muted underline hover:text-fg">Remove</button>
                    </div>
                  )}
                </div>
              </li>
            ))}
          </ul>

          <div className="sticky bottom-0 -mx-4 border-t border-line bg-bg px-4 py-4 sm:-mx-6 sm:px-6">
            <div className="flex items-baseline justify-between">
              <span className="text-lg">Subtotal:</span>
              <span className="text-xl">{peso(subtotal)}</span>
            </div>
            <p className="mb-3 text-right text-[11px] text-muted">Shipping calculated at checkout</p>
            <button
              type="button" disabled={checked.length === 0}
              onClick={() => navigate("/checkout", { state: { cartItemIds: checked.map((i) => i.id) } })}
              className="h-12 w-full bg-accent text-[11px] font-semibold uppercase tracking-wide text-accent-fg transition hover:opacity-85 disabled:opacity-40"
            >
              Continue to checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
}