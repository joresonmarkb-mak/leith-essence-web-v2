import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { peso } from "../lib/format.js";
import { GCASH } from "../lib/config.js";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";

const field = "w-full border-0 border-b border-line bg-transparent py-3 text-base outline-none transition focus:border-fg sm:text-sm";
const label = "block text-xs text-muted";
const CATEGORY_LABEL = { for_him: "For him", for_her: "For her", unisex: "Unisex" };

export default function Checkout() {
  const { user } = useAuth();
  const { setCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();

  const [items, setItems] = useState(null);
  const [loadError, setLoadError] = useState("");
  const [totals, setTotals] = useState(null);
  const [form, setForm] = useState(() => ({
    firstName: user?.firstName ?? "", lastName: user?.lastName ?? "",
    phone: user?.phone ?? "", email: user?.email ?? "",
    province: user?.province ?? "", city: user?.city ?? "",
    barangay: user?.barangay ?? "", street: user?.street ?? "",
  }));
  const [promo, setPromo] = useState("");
  const [appliedCode, setAppliedCode] = useState("");
  const [promoMsg, setPromoMsg] = useState({ type: "", text: "" });
  const [reference, setReference] = useState("");
  const [receiptUrl, setReceiptUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  // Which bag items are being bought
  useEffect(() => {
    let ignore = false;
    api("/cart")
      .then((cart) => {
        if (ignore) return;
        const ids = location.state?.cartItemIds;
        setItems(cart.items.filter((i) => i.inStock && (!ids || ids.includes(i.id))));
      })
      .catch((e) => { if (!ignore) setLoadError(e.message); });
    return () => { ignore = true; };
  }, [location.state]);

  const payloadItems = useMemo(
    () => items?.map((i) => ({ perfumeId: i.perfumeId, sizeMl: i.sizeMl, quantity: i.quantity })),
    [items]
  );

  const preview = useCallback(
    (code) => api("/orders/preview", { method: "POST", body: { items: payloadItems, voucherCode: code || undefined } }),
    [payloadItems]
  );

  useEffect(() => {
    if (!payloadItems?.length) return;
    let ignore = false;
    preview("")
      .then((t) => { if (!ignore) setTotals(t); })
      .catch((e) => { if (!ignore) setLoadError(e.message); });
    return () => { ignore = true; };
  }, [payloadItems, preview]);

  async function applyPromo() {
    const code = promo.trim();
    if (!code) return;
    setPromoMsg({ type: "", text: "" });
    try {
      const t = await preview(code);
      setTotals(t);
      setAppliedCode(code);
      setPromoMsg({ type: "ok", text: `${t.voucher?.code ?? code.toUpperCase()} applied.` });
    } catch (e) {
      setPromoMsg({ type: "error", text: e.message });
    }
  }

  async function removePromo() {
    try {
      setTotals(await preview(""));
      setAppliedCode("");
      setPromo("");
      setPromoMsg({ type: "", text: "" });
    } catch (e) {
      setPromoMsg({ type: "error", text: e.message });
    }
  }

  async function onFile(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploadError("");
    if (file.size > 5 * 1024 * 1024) return setUploadError("That image is over 5 MB.");
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await api("/uploads?type=receipt", { method: "POST", formData: fd });
      setReceiptUrl(r.url);
    } catch (err) {
      setUploadError(err.message);
    } finally {
      setUploading(false);
    }
  }

  async function onSubmit(e) {
    e.preventDefault();
    setError("");
    if (!receiptUrl) return setError("Upload your proof of payment first.");
    setBusy(true);
    try {
      const order = await api("/orders/checkout", {
        method: "POST",
        body: {
          ...form,
          items: payloadItems,
          voucherCode: appliedCode || undefined,
          paymentReference: reference.trim(),
          receiptUrl,
        },
      });
      const cart = await api("/cart").catch(() => null);
      if (cart) setCount(cart.count);
      navigate("/order-placed", { replace: true, state: { order } });
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  }

  if (loadError) {
    return (
      <div className="p-10 text-center">
        <p role="alert" className="text-danger">{loadError}</p>
        <Link to="/cart" className="mt-4 inline-block underline">Back to your bag</Link>
      </div>
    );
  }
  if (!items) return <p className="p-10 text-center text-muted">Loading...</p>;
  if (items.length === 0) {
    return (
      <div className="p-10 text-center">
        <p className="text-muted">There's nothing to check out.</p>
        <Link to="/cart" className="mt-4 inline-block underline">Back to your bag</Link>
      </div>
    );
  }

  const textFields = (rows) =>
    rows.map(([key, text, type, auto]) => (
      <label key={key} className={label}>
        {text}
        <input type={type ?? "text"} required autoComplete={auto} value={form[key]} onChange={set(key)} className={field} />
      </label>
    ));

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-[1100px] px-4 pb-16 pt-8 sm:px-6">
      <h1 className="text-4xl font-bold uppercase tracking-tight sm:text-6xl">Checkout</h1>

      <div className="mt-8 grid gap-x-16 gap-y-10 lg:grid-cols-2">
        {/* Information */}
        <section className="lg:col-start-1 lg:row-start-1">
          <h2 className="text-sm font-semibold uppercase tracking-wide">Information</h2>
          <h3 className="mt-5 text-xs font-medium">Personal information</h3>
          <div className="mt-2 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {textFields([
              ["firstName", "First name", "text", "given-name"],
              ["lastName", "Last name", "text", "family-name"],
              ["phone", "Phone number", "tel", "tel"],
              ["email", "Email", "email", "email"],
            ])}
          </div>
          <h3 className="mt-8 text-xs font-medium">Shipping information</h3>
          <div className="mt-2 grid gap-x-6 gap-y-3 sm:grid-cols-2">
            {textFields([
              ["province", "Province", "text", "address-level1"],
              ["city", "City / Municipality", "text", "address-level2"],
              ["barangay", "Barangay", "text"],
              ["street", "Street", "text", "street-address"],
            ])}
          </div>
        </section>

        {/* Order summary */}
        <aside className="lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
          <h2 className="text-lg font-medium">Shopping Bag ({items.reduce((s, i) => s + i.quantity, 0)})</h2>
          <ul className="mt-3 divide-y divide-line border-y border-line">
            {items.map((i) => (
              <li key={i.id} className="flex gap-3 py-4">
                <div className="flex h-20 w-16 shrink-0 items-center justify-center bg-surface">
                  {i.imageUrl && <img src={i.imageUrl} alt="" className="max-h-full max-w-full object-contain" />}
                </div>
                <div className="min-w-0 flex-1 text-xs">
                  <div className="flex justify-between gap-2">
                    <p className="font-semibold uppercase">
                      {i.name} <span className="ml-1 font-normal normal-case">{CATEGORY_LABEL[i.category]}</span>
                    </p>
                    <p className="shrink-0 text-sm">{peso(Number(i.lineTotal))}</p>
                  </div>
                  {i.inspiredBy && <p className="mt-0.5 font-serif italic text-muted">Inspired: {i.inspiredBy}</p>}
                  <p className="mt-0.5 text-muted">Size: {i.sizeMl}ml</p>
                  <p className="mt-0.5 text-muted">Quantity: {i.quantity}</p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-5">
            <label className={label} htmlFor="promo">Promo code</label>
            <div className="flex items-end gap-3">
              <input
                id="promo" value={promo} onChange={(e) => setPromo(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyPromo(); } }}
                disabled={Boolean(appliedCode)} autoCapitalize="characters" className={field}
              />
              {appliedCode ? (
                <button type="button" onClick={removePromo} className="h-11 shrink-0 border border-line px-5 text-[11px] font-medium uppercase">Remove</button>
              ) : (
                <button type="button" onClick={applyPromo} className="h-11 shrink-0 bg-accent px-5 text-[11px] font-medium uppercase text-accent-fg">Apply</button>
              )}
            </div>
            <p role="status" className={`mt-1 min-h-5 text-xs ${promoMsg.type === "error" ? "text-danger" : "text-success"}`}>{promoMsg.text}</p>
          </div>

          <dl className="mt-3 space-y-3 text-sm">
            <div className="flex justify-between border-b border-line pb-3"><dt>Subtotal</dt><dd>{peso(totals?.subtotal)}</dd></div>
            <div className="flex justify-between border-b border-line pb-3"><dt>Shipping</dt><dd>{peso(totals?.shipping)}</dd></div>
            <div className="flex justify-between border-b border-line pb-3"><dt>Discount</dt><dd>{totals?.discount ? "-" : ""}{peso(totals?.discount)}</dd></div>
            <div className="flex justify-between text-lg"><dt>Total:</dt><dd>{peso(totals?.total)}</dd></div>
          </dl>
        </aside>

        {/* Payment */}
        <section className="lg:col-start-1 lg:row-start-2">
          <h2 className="text-sm font-semibold uppercase tracking-wide">Payment</h2>
          <p className="mt-3 flex items-center gap-2 text-xs font-medium uppercase">
            <input type="radio" checked readOnly className="accent-accent" aria-label="GCash" /> GCash
          </p>

          <div className="mt-5 flex flex-col items-center">
            <p className="text-sm">Send <strong>{peso(totals?.total)}</strong> to {GCASH.name}</p>
            <p className="text-xs text-muted">{GCASH.number}</p>
            <img src={GCASH.qrImage} alt="GCash QR code" className="mt-3 w-full max-w-[240px]" />
          </div>

          <h3 className="mt-8 text-sm font-medium">Proof of payment</h3>
          <p className="text-xs text-muted">Upload a screenshot and enter the reference / transaction number.</p>

          <label
            className={`mt-3 flex min-h-40 cursor-pointer flex-col items-center justify-center gap-2 border border-dashed p-4 text-center text-[11px] uppercase text-muted transition hover:border-fg ${
              receiptUrl ? "border-success" : "border-muted"
            }`}
          >
            <input type="file" accept="image/jpeg,image/png,image/webp" onChange={onFile} className="sr-only" />
            {uploading ? (
              "Uploading..."
            ) : receiptUrl ? (
              <>
                <img src={receiptUrl} alt="Your proof of payment" className="max-h-32 object-contain" />
                <span className="text-success">Uploaded. Tap to replace.</span>
              </>
            ) : (
              "Tap to upload proof of payment"
            )}
          </label>
          {uploadError && <p role="alert" className="mt-1 text-xs text-danger">{uploadError}</p>}

          <label className={`${label} mt-5`}>
            GCash reference number
            <input required inputMode="numeric" value={reference} onChange={(e) => setReference(e.target.value)} className={field} />
          </label>

          {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}
          <button
            disabled={busy || uploading || !totals}
            className="mt-6 h-14 w-full bg-accent text-[11px] font-semibold uppercase tracking-wide text-accent-fg transition hover:opacity-85 disabled:opacity-50"
          >
            {busy ? "Placing your order..." : "Pay and place order"}
          </button>
        </section>
      </div>
    </form>
  );
}