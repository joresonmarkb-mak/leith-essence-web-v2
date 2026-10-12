import { useState } from "react";
import Dialog from "./Dialog.jsx";
import { api } from "../../lib/api.js";
import { peso } from "../../lib/format.js";
import { useSubmit, Err, Actions } from "./BatchForms.jsx";
import { input, labelCls } from "./ui.js";

function VoucherForm({ voucher, onClose, onSaved }) {
  const [code, setCode] = useState(voucher?.code ?? "");
  const [title, setTitle] = useState(voucher?.title ?? "");
  const [description, setDescription] = useState(voucher?.description ?? "");
  const [type, setType] = useState(voucher?.discountType ?? "percent");
  const [value, setValue] = useState(voucher ? String(voucher.discountValue) : "");
  const [minSpend, setMinSpend] = useState(voucher ? String(voucher.minSpend) : "0");
  const [maxUses, setMaxUses] = useState(voucher?.maxUses ? String(voucher.maxUses) : "");
  const [startsAt, setStartsAt] = useState(voucher?.startsAt ?? "");
  const [expiresAt, setExpiresAt] = useState(voucher?.expiresAt ?? "");

  const summary = value
    ? `${type === "percent" ? `${value}% off` : `${peso(Number(value))} off`}${
        Number(minSpend) > 0 ? ` on orders of ${peso(Number(minSpend))} or more` : ""
      }`
    : "";

  const { busy, error, submit } = useSubmit(async () => {
    const body = {
      title,
      description,
      discountType: type,
      discountValue: Number(value),
      minSpend: Number(minSpend || 0),
      maxUses: maxUses === "" ? null : Number(maxUses),
      startsAt: startsAt || null,
      expiresAt: expiresAt || null,
    };
    if (voucher) await api(`/vouchers/${voucher.id}`, { method: "PATCH", body });
    else await api("/vouchers", { method: "POST", body: { code: code.trim().toUpperCase(), ...body } });
    onSaved();
  });

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <label className={labelCls}>Code {voucher && "(can't be changed)"}
        <input
          className={`${input} font-mono uppercase`} value={code} disabled={!!voucher}
          onChange={(e) => setCode(e.target.value.toUpperCase().replace(/[^A-Z0-9_-]/g, ""))}
          minLength={3} maxLength={30} placeholder="WELCOME10" required
        />
      </label>
      <label className={labelCls}>Title
        <input className={input} value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Welcome discount" required />
      </label>
      <label className={labelCls}>Description (optional)
        <textarea className={`${input} h-20 py-2`} value={description} onChange={(e) => setDescription(e.target.value)} />
      </label>

      <div className="grid grid-cols-2 gap-3">
        <label className={labelCls}>Discount type
          <select className={input} value={type} onChange={(e) => setType(e.target.value)}>
            <option value="percent">Percent (%)</option>
            <option value="fixed">Fixed amount (₱)</option>
          </select>
        </label>
        <label className={labelCls}>{type === "percent" ? "Percent off" : "Pesos off"}
          <input
            className={input} type="number" inputMode="decimal" min="0.01" step="0.01"
            max={type === "percent" ? 100 : undefined} value={value} onChange={(e) => setValue(e.target.value)} required
          />
        </label>
        <label className={labelCls}>Minimum spend (₱)
          <input className={input} type="number" inputMode="decimal" min="0" step="0.01" value={minSpend} onChange={(e) => setMinSpend(e.target.value)} />
        </label>
        <label className={labelCls}>Max uses (blank = unlimited)
          <input className={input} type="number" inputMode="numeric" min="1" step="1" value={maxUses} onChange={(e) => setMaxUses(e.target.value)} />
        </label>
        <label className={labelCls}>Starts (optional)
          <input type="date" className={input} value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        </label>
        <label className={labelCls}>Ends (optional)
          <input type="date" className={input} min={startsAt || undefined} value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} />
        </label>
      </div>

      {summary && <p className="text-sm text-muted">Customers get <b className="text-fg">{summary}</b>.</p>}
      <Err msg={error} />
      <Actions onClose={onClose} busy={busy} label={voucher ? "Save" : "Create voucher"} />
    </form>
  );
}

export function VoucherFormDialog({ open, onClose, voucher, onSaved }) {
  return (
    <Dialog open={open} onClose={onClose} title={voucher ? "Edit voucher" : "New voucher"}>
      <VoucherForm voucher={voucher} onClose={onClose} onSaved={onSaved} />
    </Dialog>
  );
}