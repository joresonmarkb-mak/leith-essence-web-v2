import { useEffect, useState } from "react";
import Dialog from "./Dialog.jsx";
import ReceiptField from "./ReceiptField.jsx";
import { api } from "../../lib/api.js";
import { peso } from "../../lib/format.js";
import { useSubmit, Err, Actions } from "./BatchForms.jsx";
import { input, labelCls, btnGhost, asList } from "./ui.js";

const PLATFORMS = [["facebook", "Facebook"], ["instagram", "Instagram"], ["tiktok", "TikTok"], ["shopee", "Shopee"], ["events", "Events"]];
const PAYMENTS = [["gcash", "GCash"], ["qrph", "QR Ph"], ["cash", "Cash"], ["other", "Other"]];
const emptyItem = () => ({ perfumeId: "", sizeMl: "", quantity: "1", unitPrice: "" });

const initial = {
  buyerName: "", buyerPhone: "", buyerEmail: "",
  platform: "facebook", type: "shipping", paymentMethod: "gcash", paymentReference: "", receiptUrl: "",
  province: "", city: "", barangay: "", street: "",
  shippingFee: "", voucherCode: "", notes: "",
  status: "paid", ownerId: "", receivedBy: "", tracking: "",
};

function Section({ title, children }) {
  return (
    <fieldset className="flex flex-col gap-3 rounded-xl border border-line p-4">
      <legend className="px-1 text-[11px] font-medium uppercase tracking-widest text-muted">{title}</legend>
      {children}
    </fieldset>
  );
}

function AddOrderForm({ onClose, onSaved }) {
  const [f, setF] = useState(initial);
  const [items, setItems] = useState([emptyItem()]);
  const [perfumes, setPerfumes] = useState([]);
  const [owners, setOwners] = useState([]);
  const [loadError, setLoadError] = useState("");
  const set = (k, v) => setF((s) => ({ ...s, [k]: v }));

  useEffect(() => {
    Promise.all([api("/shop/perfumes"), api("/owners")])
      .then(([p, o]) => {
        setPerfumes(asList(p, "perfumes"));
        setOwners(asList(o, "owners"));
      })
      .catch((e) => setLoadError(e.message));
  }, []);

  const sizesFor = (perfumeId) =>
    perfumes.find((p) => String(p.id) === String(perfumeId))?.sizes.filter((s) => s.available) ?? [];

  const patchItem = (i, patch) => setItems((list) => list.map((it, j) => (j === i ? { ...it, ...patch } : it)));

  const pickPerfume = (i, perfumeId) => patchItem(i, { perfumeId, sizeMl: "", unitPrice: "" });
  const pickSize = (i, sizeMl) => {
    const size = sizesFor(items[i].perfumeId).find((s) => String(s.sizeMl) === sizeMl);
    patchItem(i, { sizeMl, unitPrice: size ? String(Number(size.price)) : "" });
  };

  const estimate = items.reduce((s, it) => s + (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0), 0);
  const needsOwner = f.status !== "pending";

  const { busy, error, submit } = useSubmit(async () => {
    const body = {
      buyerName: f.buyerName, buyerPhone: f.buyerPhone, buyerEmail: f.buyerEmail,
      platform: f.platform, type: f.type, paymentMethod: f.paymentMethod,
      paymentReference: f.paymentReference, receiptUrl: f.receiptUrl,
      voucherCode: f.voucherCode, notes: f.notes, status: f.status,
      items: items.map((it) => ({
        perfumeId: Number(it.perfumeId),
        sizeMl: Number(it.sizeMl),
        quantity: Number(it.quantity),
        ...(it.unitPrice !== "" ? { unitPrice: Number(it.unitPrice) } : {}),
      })),
    };
    if (f.type === "shipping") {
      Object.assign(body, { province: f.province, city: f.city, barangay: f.barangay, street: f.street });
      if (f.shippingFee !== "") body.shippingFee = Number(f.shippingFee);
    }
    if (needsOwner) {
      body.ownerId = Number(f.ownerId);
      if (f.receivedBy) body.receivedByOwnerId = Number(f.receivedBy);
    }
    if (f.status === "fulfilled" && f.tracking) body.trackingNumber = f.tracking;
    onSaved(await api("/orders", { method: "POST", body }));
  });

  if (loadError) return <p role="alert" className="text-sm text-danger">{loadError}</p>;

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Section title="Buyer">
        <label className={labelCls}>Name
          <input className={input} value={f.buyerName} onChange={(e) => set("buyerName", e.target.value)} required />
        </label>
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={labelCls}>Phone (optional)
            <input className={input} type="tel" inputMode="tel" value={f.buyerPhone} onChange={(e) => set("buyerPhone", e.target.value)} />
          </label>
          <label className={labelCls}>Email (optional)
            <input className={input} type="email" value={f.buyerEmail} onChange={(e) => set("buyerEmail", e.target.value)} />
          </label>
        </div>
      </Section>

      <Section title="Items">
        {perfumes.length === 0 && <p className="text-xs text-warn">No perfumes in stock were found.</p>}
        {items.map((it, i) => (
          <div key={i} className="flex flex-col gap-2 rounded-lg border border-line p-3">
            <select aria-label="Perfume" className={input} value={it.perfumeId} onChange={(e) => pickPerfume(i, e.target.value)} required>
              <option value="">Choose a perfume</option>
              {perfumes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
            <div className="grid grid-cols-3 gap-2">
              <select aria-label="Size" className={input} value={it.sizeMl} onChange={(e) => pickSize(i, e.target.value)} required disabled={!it.perfumeId}>
                <option value="">Size</option>
                {sizesFor(it.perfumeId).map((s) => <option key={s.sizeMl} value={s.sizeMl}>{s.sizeMl}ml</option>)}
              </select>
              <input aria-label="Quantity" className={input} type="number" inputMode="numeric" min="1" step="1" value={it.quantity} onChange={(e) => patchItem(i, { quantity: e.target.value })} required />
              <input aria-label="Unit price" className={input} type="number" inputMode="decimal" min="0" step="0.01" placeholder="Price" value={it.unitPrice} onChange={(e) => patchItem(i, { unitPrice: e.target.value })} />
            </div>
            {items.length > 1 && (
              <button type="button" onClick={() => setItems((l) => l.filter((_, j) => j !== i))} className="self-end text-xs text-muted underline">Remove</button>
            )}
          </div>
        ))}
        <div className="flex items-center justify-between">
          <button type="button" onClick={() => setItems((l) => [...l, emptyItem()])} className={btnGhost}>+ Add item</button>
          <p className="text-sm">Items: <b className="tabular-nums">{peso(estimate)}</b></p>
        </div>
        <p className="text-xs text-muted">You can change a unit price for a special deal. Shipping, voucher and the final total are worked out when you save.</p>
      </Section>

      <Section title="Sale">
        <div className="grid gap-3 sm:grid-cols-3">
          <label className={labelCls}>Sold on
            <select className={input} value={f.platform} onChange={(e) => set("platform", e.target.value)}>
              {PLATFORMS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
          <label className={labelCls}>Delivery
            <select className={input} value={f.type} onChange={(e) => set("type", e.target.value)}>
              <option value="shipping">Shipping</option>
              <option value="pickup">Pickup</option>
            </select>
          </label>
          <label className={labelCls}>Paid by
            <select className={input} value={f.paymentMethod} onChange={(e) => set("paymentMethod", e.target.value)}>
              {PAYMENTS.map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </label>
        </div>
        <label className={labelCls}>Payment reference no. (optional)
          <input className={input} value={f.paymentReference} onChange={(e) => set("paymentReference", e.target.value)} />
        </label>
        <ReceiptField value={f.receiptUrl} onChange={(v) => set("receiptUrl", v)} />
      </Section>

      {f.type === "shipping" && (
        <Section title="Shipping address">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className={labelCls}>Province<input className={input} value={f.province} onChange={(e) => set("province", e.target.value)} required /></label>
            <label className={labelCls}>City or municipality<input className={input} value={f.city} onChange={(e) => set("city", e.target.value)} required /></label>
            <label className={labelCls}>Barangay<input className={input} value={f.barangay} onChange={(e) => set("barangay", e.target.value)} required /></label>
            <label className={labelCls}>Street, house no.<input className={input} value={f.street} onChange={(e) => set("street", e.target.value)} required /></label>
            <label className={labelCls}>Shipping fee (₱, blank = standard)
              <input className={input} type="number" inputMode="decimal" min="0" step="0.01" value={f.shippingFee} onChange={(e) => set("shippingFee", e.target.value)} />
            </label>
          </div>
        </Section>
      )}

      <Section title="Status">
        <div className="grid gap-3 sm:grid-cols-2">
          <label className={labelCls}>Order status
            <select className={input} value={f.status} onChange={(e) => set("status", e.target.value)}>
              <option value="paid">Paid (confirm now)</option>
              <option value="pending">Pending (confirm later)</option>
              <option value="fulfilled">Paid and fulfilled</option>
            </select>
          </label>
          <label className={labelCls}>Voucher code (optional)
            <input className={`${input} font-mono uppercase`} value={f.voucherCode} onChange={(e) => set("voucherCode", e.target.value.toUpperCase())} />
          </label>
          {needsOwner && (
            <>
              <label className={labelCls}>Sold by (whose stock)
                <select className={input} value={f.ownerId} onChange={(e) => set("ownerId", e.target.value)} required>
                  <option value="">Choose an owner</option>
                  {owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </label>
              <label className={labelCls}>Money received by
                <select className={input} value={f.receivedBy} onChange={(e) => set("receivedBy", e.target.value)}>
                  <option value="">Same owner</option>
                  {owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
                </select>
              </label>
            </>
          )}
          {f.status === "fulfilled" && (
            <label className={labelCls}>Tracking number (optional)
              <input className={input} value={f.tracking} onChange={(e) => set("tracking", e.target.value)} />
            </label>
          )}
        </div>
        <label className={labelCls}>Notes (optional)
          <textarea className={`${input} h-20 py-2`} value={f.notes} onChange={(e) => set("notes", e.target.value)} />
        </label>
      </Section>

      <Err msg={error} />
      <Actions onClose={onClose} busy={busy} label="Save order" />
    </form>
  );
}

export function AddOrderDialog({ open, onClose, onSaved }) {
  return (
    <Dialog open={open} onClose={onClose} title="Add order" wide>
      <AddOrderForm onClose={onClose} onSaved={onSaved} />
    </Dialog>
  );
}