import { useEffect, useState } from "react";
import Dialog from "./Dialog.jsx";
import StatusPill from "../StatusPill.jsx";
import { api } from "../../lib/api.js";
import { peso, orderNo } from "../../lib/format.js";
import { input, labelCls, btn, btnGhost, btnDanger, asList } from "./ui.js";

const PLATFORM = { website: "Website", facebook: "Facebook", instagram: "Instagram", tiktok: "TikTok", shopee: "Shopee", events: "Events" };
const PAYMENT = { gcash: "GCash", qrph: "QR Ph", cash: "Cash", other: "Other" };

const when = (iso) =>
  iso ? new Date(iso).toLocaleString("en-PH", { timeZone: "Asia/Manila", dateStyle: "medium", timeStyle: "short" }) : null;

function Row({ k, children }) {
  return (
    <div className="flex items-baseline justify-between gap-4 border-t border-line py-2.5 text-sm">
      <dt className="shrink-0 text-xs text-muted">{k}</dt>
      <dd className="min-w-0 break-words text-right">{children}</dd>
    </div>
  );
}

function OrderDetail({ orderId, onChanged, onClose }) {
  const [o, setO] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState(null); // "pay" | "ship"
  const [owners, setOwners] = useState([]);
  const [ownerId, setOwnerId] = useState("");
  const [receivedBy, setReceivedBy] = useState("");
  const [tracking, setTracking] = useState("");

  useEffect(() => {
    api(`/orders/${orderId}`).then(setO).catch((e) => setError(e.message));
  }, [orderId]);

  useEffect(() => {
    if (mode === "pay" && owners.length === 0) {
      api("/owners").then((d) => setOwners(asList(d, "owners"))).catch(() => {});
    }
  }, [mode, owners.length]);

  const act = async (body) => {
    setBusy(true);
    setError("");
    try {
      const updated = await api(`/orders/${orderId}/status`, { method: "PATCH", body });
      setO(updated);
      setMode(null);
      onChanged();
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  };

  if (!o) return error ? <p role="alert" className="text-sm text-danger">{error}</p> : <p className="text-sm text-muted">Loading...</p>;

  const address = [o.street, o.barangay, o.city, o.province].filter(Boolean).join(", ");
  const canPay = o.status === "pending";
  const canShip = o.status === "paid";
  const canCancel = o.status === "pending" || o.status === "paid";

  return (
    <>
      <div className="flex flex-wrap items-center gap-3">
        <span className="font-mono text-sm">{orderNo(o.id)}</span>
        <StatusPill status={o.status} />
        <span className="text-xs text-muted">{PLATFORM[o.platform]} · {o.type === "pickup" ? "Pickup" : "Shipping"}</span>
      </div>

      <dl className="mt-4 flex flex-col">
        <Row k="Buyer">{o.buyerName}</Row>
        {o.buyerPhone && <Row k="Phone">{o.buyerPhone}</Row>}
        {o.buyerEmail && <Row k="Email">{o.buyerEmail}</Row>}
        {address && <Row k="Address">{address}</Row>}
        {o.notes && <Row k="Notes">{o.notes}</Row>}
        <Row k="Placed">{when(o.createdAt)}</Row>
        {o.paidAt && <Row k="Paid">{when(o.paidAt)}</Row>}
        {o.fulfilledAt && <Row k="Fulfilled">{when(o.fulfilledAt)}</Row>}
        {o.trackingNumber && <Row k="Tracking number">{o.trackingNumber}</Row>}
      </dl>

      <p className="mt-5 text-[11px] font-medium uppercase tracking-widest text-muted">Items</p>
      <ul className="mt-2 flex flex-col">
        {o.items.map((it) => (
          <li key={it.id} className="flex items-center gap-3 border-t border-line py-3">
            <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-line bg-bg">
              {it.imageUrl && <img src={it.imageUrl} alt="" className="max-h-[85%] max-w-[85%] object-contain" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold uppercase">{it.name} <span className="font-normal text-muted">{it.sizeMl}ml</span></p>
              <p className="text-xs text-muted tabular-nums">{it.quantity} × {peso(it.unitPrice)}</p>
              {(it.ownerName || it.batchName) && (
                <p className="text-xs text-muted">{[it.batchName, it.ownerName].filter(Boolean).join(" · ")}</p>
              )}
            </div>
            <p className="shrink-0 text-sm tabular-nums">{peso(it.quantity * it.unitPrice)}</p>
          </li>
        ))}
      </ul>

      <dl className="mt-1 flex flex-col">
        <Row k="Subtotal"><span className="tabular-nums">{peso(o.subtotal)}</span></Row>
        <Row k="Shipping"><span className="tabular-nums">{peso(o.shippingFee)}</span></Row>
        {o.discount > 0 && <Row k={`Discount${o.voucherCode ? ` (${o.voucherCode})` : ""}`}><span className="tabular-nums">−{peso(o.discount)}</span></Row>}
        <div className="flex items-baseline justify-between border-t border-line py-3 text-base font-bold">
          <dt>Total</dt><dd className="tabular-nums">{peso(o.total)}</dd>
        </div>
      </dl>

      <p className="mt-3 text-[11px] font-medium uppercase tracking-widest text-muted">Payment</p>
      <dl className="mt-2 flex flex-col">
        <Row k="Method">{PAYMENT[o.paymentMethod] ?? o.paymentMethod ?? "Not set"}</Row>
        {o.paymentReference && <Row k="Reference no.">{o.paymentReference}</Row>}
      </dl>
      {o.receiptUrl && (
        <a href={o.receiptUrl} target="_blank" rel="noreferrer" className="mt-3 block rounded-xl border border-line bg-bg p-2">
          <img src={o.receiptUrl} alt="Proof of payment" className="mx-auto max-h-64 object-contain" />
          <span className="mt-2 block text-center text-xs text-muted underline">Open receipt</span>
        </a>
      )}

      {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}

      {mode === "pay" && (
        <form
          className="mt-5 flex flex-col gap-3 rounded-xl border border-line p-4"
          onSubmit={(e) => {
            e.preventDefault();
            act({ status: "paid", ownerId: Number(ownerId), receivedByOwnerId: receivedBy ? Number(receivedBy) : undefined });
          }}
        >
          <label className={labelCls}>Sold by (whose stock is used)
            <select className={input} value={ownerId} onChange={(e) => setOwnerId(e.target.value)} required>
              <option value="">Choose an owner</option>
              {owners.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </label>
          <label className={labelCls}>Payment received by
            <select className={input} value={receivedBy} onChange={(e) => setReceivedBy(e.target.value)}>
              <option value="">Same owner</option>
              {owners.map((w) => <option key={w.id} value={w.id}>{w.name}</option>)}
            </select>
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" className={btnGhost} onClick={() => setMode(null)}>Back</button>
            <button type="submit" disabled={busy} className={btn}>{busy ? "Saving..." : "Confirm payment"}</button>
          </div>
        </form>
      )}

      {mode === "ship" && (
        <form
          className="mt-5 flex flex-col gap-3 rounded-xl border border-line p-4"
          onSubmit={(e) => {
            e.preventDefault();
            act({ status: "fulfilled", trackingNumber: tracking || undefined });
          }}
        >
          <label className={labelCls}>Tracking number (optional)
            <input className={input} value={tracking} onChange={(e) => setTracking(e.target.value)} />
          </label>
          <div className="flex justify-end gap-2">
            <button type="button" className={btnGhost} onClick={() => setMode(null)}>Back</button>
            <button type="submit" disabled={busy} className={btn}>{busy ? "Saving..." : "Mark fulfilled"}</button>
          </div>
        </form>
      )}

      {!mode && (canPay || canShip || canCancel) && (
        <div className="mt-5 flex flex-wrap gap-2">
          {canPay && <button type="button" className={btn} onClick={() => setMode("pay")}>Confirm payment</button>}
          {canShip && <button type="button" className={btn} onClick={() => setMode("ship")}>Mark fulfilled</button>}
          {canCancel && (
            <button
              type="button" disabled={busy} className={btnDanger}
              onClick={() =>
                window.confirm(`Cancel ${orderNo(o.id)}? The pieces go back to stock and any voucher use is given back.`) &&
                act({ status: "cancelled" })
              }
            >
              Cancel order
            </button>
          )}
        </div>
      )}
      <div className="mt-4 flex justify-end">
        <button type="button" className={btnGhost} onClick={onClose}>Close</button>
      </div>
    </>
  );
}

export default function OrderDialog({ orderId, onClose, onChanged }) {
  return (
    <Dialog open={orderId !== null} onClose={onClose} title="Order details" wide>
      {orderId !== null && <OrderDetail orderId={orderId} onChanged={onChanged} onClose={onClose} />}
    </Dialog>
  );
}