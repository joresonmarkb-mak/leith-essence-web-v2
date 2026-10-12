import { useEffect, useState } from "react";
import Dialog from "./Dialog.jsx";
import ReceiptField from "./ReceiptField.jsx";
import { api } from "../../lib/api.js";
import { useSubmit, Err, Actions } from "./BatchForms.jsx";
import { input, labelCls, todayManila, asList } from "./ui.js";

export const CATEGORIES = [
  ["supply_purchased", "Supplies"],
  ["shipping", "Shipping"],
  ["marketing", "Marketing"],
  ["owner_contribution", "Owner contribution"],
  ["owner_draw", "Owner draw"],
  ["other", "Other"],
];
const DIRECTION = {
  supply_purchased: "out", shipping: "out", marketing: "out",
  owner_contribution: "in", owner_draw: "out", other: null,
};
const NEEDS_OWNER = ["owner_contribution", "owner_draw"];

function CashflowForm({ entry, onClose, onSaved }) {
  const [category, setCategory] = useState(entry?.category ?? "supply_purchased");
  const [type, setType] = useState(entry?.type ?? "out");
  const [description, setDescription] = useState(entry?.description ?? "");
  const [amount, setAmount] = useState(entry ? String(entry.amount) : "");
  const [date, setDate] = useState(entry?.date ?? todayManila());
  const [ownerId, setOwnerId] = useState(entry?.ownerId ? String(entry.ownerId) : "");
  const [batchId, setBatchId] = useState(entry?.batchId ? String(entry.batchId) : "");
  const [receiptUrl, setReceiptUrl] = useState(entry?.receiptUrl ?? "");
  const [owners, setOwners] = useState([]);
  const [batches, setBatches] = useState([]);

  useEffect(() => {
    api("/owners").then((d) => setOwners(asList(d, "owners"))).catch(() => {});
    api("/batches").then((d) => setBatches(asList(d, "batches"))).catch(() => {});
  }, []);

  const needsOwner = NEEDS_OWNER.includes(category);
  const direction = DIRECTION[category];

  const { busy, error, submit } = useSubmit(async () => {
    const common = {
      description,
      amount: Number(amount),
      date,
      ownerId: ownerId ? Number(ownerId) : null,
      batchId: batchId ? Number(batchId) : null,
      receiptUrl: receiptUrl || null,
    };
    if (entry) {
      await api(`/cashflow/${entry.id}`, { method: "PATCH", body: common });
    } else {
      await api("/cashflow", {
        method: "POST",
        body: { ...common, category, ...(category === "other" ? { type } : {}) },
      });
    }
    onSaved();
  });

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      {entry ? (
        <p className="text-sm text-muted">
          {CATEGORIES.find(([k]) => k === category)?.[1] ?? category} · cash {entry.type}. The category can't change after saving.
        </p>
      ) : (
        <>
          <label className={labelCls}>Category
            <select className={input} value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
            </select>
          </label>
          {category === "other" ? (
            <label className={labelCls}>Money
              <select className={input} value={type} onChange={(e) => setType(e.target.value)}>
                <option value="out">Cash out (money spent)</option>
                <option value="in">Cash in (money received)</option>
              </select>
            </label>
          ) : (
            <p className="-mt-2 text-xs text-muted">This is always cash {direction}.</p>
          )}
        </>
      )}

      <label className={labelCls}>Description
        <input className={input} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Packaging tape" required />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className={labelCls}>Amount (₱)
          <input className={input} type="number" inputMode="decimal" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
        </label>
        <label className={labelCls}>Date
          <input type="date" className={input} value={date} onChange={(e) => setDate(e.target.value)} required />
        </label>
        <label className={labelCls}>{needsOwner ? "Owner" : "Owner (optional)"}
          <select className={input} value={ownerId} onChange={(e) => setOwnerId(e.target.value)} required={needsOwner}>
            <option value="">{needsOwner ? "Choose an owner" : "Not set"}</option>
            {owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
        </label>
        <label className={labelCls}>Batch (optional)
          <select className={input} value={batchId} onChange={(e) => setBatchId(e.target.value)}>
            <option value="">Not set</option>
            {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </label>
      </div>

      <ReceiptField value={receiptUrl} onChange={setReceiptUrl} />
      <Err msg={error} />
      <Actions onClose={onClose} busy={busy} label={entry ? "Save" : "Add entry"} />
    </form>
  );
}

export function CashflowFormDialog({ open, onClose, entry, onSaved }) {
  return (
    <Dialog open={open} onClose={onClose} title={entry ? "Edit entry" : "Add entry"}>
      <CashflowForm entry={entry} onClose={onClose} onSaved={onSaved} />
    </Dialog>
  );
}