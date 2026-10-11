import { useEffect, useState } from "react";
import Dialog from "./Dialog.jsx";
import { api } from "../../lib/api.js";
import { uploadFile } from "../../lib/upload.js";
import { peso } from "../../lib/format.js";
import { input, labelCls, btn, btnGhost, manilaDate, todayManila, asList } from "./ui.js";

export function useSubmit(fn) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await fn();
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };
  return { busy, error, submit };
}

export const Err = ({ msg }) => (msg ? <p role="alert" className="text-sm text-danger">{msg}</p> : null);

export function Actions({ onClose, busy, label }) {
  return (
    <div className="mt-2 flex justify-end gap-2">
      <button type="button" onClick={onClose} className={btnGhost}>Cancel</button>
      <button type="submit" disabled={busy} className={btn}>{busy ? "Saving..." : label}</button>
    </div>
  );
}

/* ---------- New / edit batch ---------- */

function BatchForm({ batch, onClose, onSaved }) {
  const [name, setName] = useState(batch?.name ?? "");
  const [date, setDate] = useState(batch?.batchDate ? manilaDate(batch.batchDate) : todayManila());
  const [notes, setNotes] = useState(batch?.notes ?? "");
  const { busy, error, submit } = useSubmit(async () => {
    const body = { name, batchDate: date, notes };
    const saved = batch
      ? await api(`/batches/${batch.id}`, { method: "PATCH", body })
      : await api("/batches", { method: "POST", body });
    onSaved(saved);
  });

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label className={labelCls}>Batch name
        <input className={input} value={name} onChange={(e) => setName(e.target.value)} placeholder="Batch 2" required />
      </label>
      <label className={labelCls}>Batch date
        <input type="date" className={input} value={date} onChange={(e) => setDate(e.target.value)} required />
      </label>
      <label className={labelCls}>Notes (optional)
        <textarea className={`${input} h-24 py-2`} value={notes} onChange={(e) => setNotes(e.target.value)} />
      </label>
      <Err msg={error} />
      <Actions onClose={onClose} busy={busy} label={batch ? "Save" : "Create batch"} />
    </form>
  );
}

export function BatchFormDialog({ open, onClose, batch, onSaved }) {
  return (
    <Dialog open={open} onClose={onClose} title={batch ? "Edit batch" : "New batch"}>
      <BatchForm batch={batch} onClose={onClose} onSaved={onSaved} />
    </Dialog>
  );
}

/* ---------- Add a perfume to a batch ---------- */

function ItemForm({ batchId, onClose, onSaved }) {
  const [perfumes, setPerfumes] = useState([]);
  const [owners, setOwners] = useState([]);
  const [loadError, setLoadError] = useState("");
  const [perfumeId, setPerfumeId] = useState("");
  const [sizeMl, setSizeMl] = useState("");
  const [qty, setQty] = useState("");
  const [cost, setCost] = useState("");
  const [price, setPrice] = useState("");
  const [split, setSplit] = useState({});
  const [hint, setHint] = useState("");

  useEffect(() => {
    Promise.all([api("/perfumes"), api("/owners")])
      .then(([p, o]) => {
        setPerfumes(asList(p, "perfumes"));
        setOwners(asList(o, "owners"));
      })
      .catch((e) => setLoadError(e.message));
  }, []);

  useEffect(() => {
    if (!perfumeId || !Number(sizeMl)) return setHint("");
    let ignore = false;
    api(`/batches/items/latest?perfumeId=${perfumeId}&sizeMl=${Number(sizeMl)}`)
      .then((d) => {
        if (ignore) return;
        if (!d) return setHint("");
        setCost(String(d.costPerPiece));
        setPrice(String(d.sellingPrice));
        setHint(`Cost and price filled in from ${d.batchName}`);
      })
      .catch(() => {});
    return () => { ignore = true; };
  }, [perfumeId, sizeMl]);

  const total = Number(qty) || 0;
  const assigned = owners.reduce((s, o) => s + (Number(split[o.id]) || 0), 0);

  const splitEvenly = () => {
    if (!owners.length || !total) return;
    const base = Math.floor(total / owners.length);
    const rem = total % owners.length;
    setSplit(Object.fromEntries(owners.map((o, i) => [o.id, String(base + (i < rem ? 1 : 0))])));
  };

  const { busy, error, submit } = useSubmit(async () => {
    await api(`/batches/${batchId}/items`, {
      method: "POST",
      body: {
        perfumeId: Number(perfumeId),
        sizeMl: Number(sizeMl),
        quantityProduced: Number(qty),
        costPerPiece: Number(cost),
        sellingPrice: Number(price),
        allocations: owners.map((o) => ({ ownerId: o.id, quantity: Number(split[o.id]) || 0 })),
      },
    });
    onSaved();
  });

  if (loadError) return <p role="alert" className="text-sm text-danger">{loadError}</p>;

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label className={labelCls}>Perfume
        <select className={input} value={perfumeId} onChange={(e) => setPerfumeId(e.target.value)} required>
          <option value="">Choose a perfume</option>
          {perfumes.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className={labelCls}>Size (ml)
          <input className={input} type="number" inputMode="numeric" min="1" value={sizeMl} onChange={(e) => setSizeMl(e.target.value)} required />
        </label>
        <label className={labelCls}>How many made
          <input className={input} type="number" inputMode="numeric" min="1" step="1" value={qty} onChange={(e) => setQty(e.target.value)} required />
        </label>
        <label className={labelCls}>Cost per piece (₱)
          <input className={input} type="number" inputMode="decimal" min="0" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} required />
        </label>
        <label className={labelCls}>Selling price (₱)
          <input className={input} type="number" inputMode="decimal" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
        </label>
      </div>
      {hint && <p className="-mt-2 text-xs text-muted">{hint}</p>}

      <fieldset className="rounded-xl border border-line p-4">
        <legend className="px-1 text-xs text-muted">Pieces kept by each owner</legend>
        <div className="grid grid-cols-3 gap-3">
          {owners.map((o) => (
            <label key={o.id} className={labelCls}>{o.name}
              <input
                className={input} type="number" inputMode="numeric" min="0" step="1"
                value={split[o.id] ?? ""} onChange={(e) => setSplit({ ...split, [o.id]: e.target.value })}
              />
            </label>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-between text-xs">
          <span className={assigned === total && total > 0 ? "text-success" : "text-muted"}>Assigned {assigned} of {total}</span>
          <button type="button" onClick={splitEvenly} className="underline underline-offset-4">Split evenly</button>
        </div>
      </fieldset>

      <Err msg={error} />
      <Actions onClose={onClose} busy={busy} label="Add to batch" />
    </form>
  );
}

export function ItemFormDialog({ open, onClose, batchId, onSaved }) {
  return (
    <Dialog open={open} onClose={onClose} title="Add perfume" wide>
      <ItemForm batchId={batchId} onClose={onClose} onSaved={onSaved} />
    </Dialog>
  );
}

/* ---------- Edit cost and price of a batch perfume ---------- */

function ItemEditForm({ batchId, item, onClose, onSaved }) {
  const [cost, setCost] = useState(String(item.costPerPiece));
  const [price, setPrice] = useState(String(item.sellingPrice));
  const { busy, error, submit } = useSubmit(async () => {
    await api(`/batches/${batchId}/items/${item.id}`, {
      method: "PATCH",
      body: { costPerPiece: Number(cost), sellingPrice: Number(price) },
    });
    onSaved();
  });
  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <p className="text-sm text-muted">{item.name} {item.sizeMl}ml. The quantity and owner split can't change once made.</p>
      <label className={labelCls}>Cost per piece (₱)
        <input className={input} type="number" inputMode="decimal" min="0" step="0.01" value={cost} onChange={(e) => setCost(e.target.value)} required />
      </label>
      <label className={labelCls}>Selling price (₱)
        <input className={input} type="number" inputMode="decimal" min="0" step="0.01" value={price} onChange={(e) => setPrice(e.target.value)} required />
      </label>
      <Err msg={error} />
      <Actions onClose={onClose} busy={busy} label="Save" />
    </form>
  );
}

export function ItemEditDialog({ open, onClose, batchId, item, onSaved }) {
  return (
    <Dialog open={open} onClose={onClose} title="Edit price">
      {item && <ItemEditForm batchId={batchId} item={item} onClose={onClose} onSaved={onSaved} />}
    </Dialog>
  );
}

/* ---------- Expense: new / edit, with receipt ---------- */

function ExpenseForm({ batchId, expense, onClose, onSaved }) {
  const [type, setType] = useState(expense?.type ?? "material");
  const [description, setDescription] = useState(expense?.description ?? "");
  const [quantity, setQuantity] = useState(expense ? String(expense.quantity) : "");
  const [unitPrice, setUnitPrice] = useState(expense ? String(expense.unitPrice) : "");
  const [receiptUrl, setReceiptUrl] = useState(expense?.receiptUrl ?? "");
  const [date, setDate] = useState(todayManila());
  const [paidBy, setPaidBy] = useState("");
  const [owners, setOwners] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  useEffect(() => {
    if (!expense) api("/owners").then((o) => setOwners(asList(o, "owners"))).catch(() => {});
  }, [expense]);

  const total = (Number(quantity) || 0) * (Number(unitPrice) || 0);

  const onFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError("");
    try {
      setReceiptUrl(await uploadFile(file, "receipt"));
    } catch (err) {
      setUploadError(err.message);
    }
    setUploading(false);
    e.target.value = "";
  };

  const { busy, error, submit } = useSubmit(async () => {
    const body = {
      type,
      description,
      quantity: Number(quantity),
      unitPrice: Number(unitPrice),
      receiptUrl: receiptUrl || null,
    };
    if (expense) {
      await api(`/batches/${batchId}/expenses/${expense.id}`, { method: "PUT", body });
    } else {
      await api(`/batches/${batchId}/expenses`, {
        method: "POST",
        body: { ...body, date, paidByOwnerId: paidBy ? Number(paidBy) : null },
      });
    }
    onSaved();
  });

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label className={labelCls}>Type
        <select className={input} value={type} onChange={(e) => setType(e.target.value)}>
          <option value="material">Material (oils, bottles, boxes...)</option>
          <option value="other">Other</option>
        </select>
      </label>
      <label className={labelCls}>Description
        <input className={input} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Oils" required />
      </label>
      <div className="grid grid-cols-2 gap-3">
        <label className={labelCls}>Quantity
          <input className={input} type="number" inputMode="decimal" min="0" step="any" value={quantity} onChange={(e) => setQuantity(e.target.value)} required />
        </label>
        <label className={labelCls}>Price per unit (₱)
          <input className={input} type="number" inputMode="decimal" min="0" step="0.01" value={unitPrice} onChange={(e) => setUnitPrice(e.target.value)} required />
        </label>
      </div>
      <p className="-mt-1 text-sm">Total: <b className="tabular-nums">{peso(total)}</b></p>

      {!expense && (
        <div className="grid grid-cols-2 gap-3">
          <label className={labelCls}>Date paid
            <input type="date" className={input} value={date} onChange={(e) => setDate(e.target.value)} />
          </label>
          <label className={labelCls}>Paid by
            <select className={input} value={paidBy} onChange={(e) => setPaidBy(e.target.value)}>
              <option value="">Not set</option>
              {owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </select>
          </label>
        </div>
      )}

      <div className="text-xs text-muted">
        Receipt
        <div className="mt-1.5 flex flex-wrap items-center gap-3">
          <label className={`${btnGhost} cursor-pointer`}>
            {uploading ? "Uploading..." : receiptUrl ? "Replace" : "Upload photo"}
            <input type="file" accept="image/*" onChange={onFile} className="sr-only" disabled={uploading} />
          </label>
          {receiptUrl && (
            <>
              <a href={receiptUrl} target="_blank" rel="noreferrer" className="text-fg underline">View receipt</a>
              <button type="button" onClick={() => setReceiptUrl("")} className="underline">Remove</button>
            </>
          )}
        </div>
        {uploadError && <p role="alert" className="mt-2 text-sm text-danger">{uploadError}</p>}
      </div>

      <Err msg={error} />
      <Actions onClose={onClose} busy={busy || uploading} label={expense ? "Save" : "Add expense"} />
    </form>
  );
}

export function ExpenseFormDialog({ open, onClose, batchId, expense, onSaved }) {
  return (
    <Dialog open={open} onClose={onClose} title={expense ? "Edit expense" : "Add expense"}>
      <ExpenseForm batchId={batchId} expense={expense} onClose={onClose} onSaved={onSaved} />
    </Dialog>
  );
}

