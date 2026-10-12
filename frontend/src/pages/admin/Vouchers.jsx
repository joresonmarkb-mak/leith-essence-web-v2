import { useCallback, useEffect, useState } from "react";
import { api } from "../../lib/api.js";
import { pesoWhole } from "../../lib/format.js";
import PageHeader from "../../components/admin/PageHeader.jsx";
import { VoucherFormDialog } from "../../components/admin/VoucherForm.jsx";
import { btn, btnLink, asList } from "../../components/admin/ui.js";

const STATUS = {
  active: ["Active", "bg-success-bg text-success"],
  scheduled: ["Scheduled", "bg-warn-bg text-warn"],
  inactive: ["Inactive", "bg-line text-muted"],
  expired: ["Expired", "bg-danger-bg text-danger"],
  used_up: ["Used up", "bg-warn-bg text-warn"],
};
const TABS = [["all", "All"], ...Object.entries(STATUS).map(([k, [label]]) => [k, label])];

const day = (d) =>
  new Date(`${d}T00:00:00+08:00`).toLocaleDateString("en-PH", { timeZone: "Asia/Manila", month: "short", day: "numeric", year: "numeric" });

function validity(v) {
  if (v.startsAt && v.expiresAt) return `${day(v.startsAt)} – ${day(v.expiresAt)}`;
  if (v.startsAt) return `From ${day(v.startsAt)}`;
  if (v.expiresAt) return `Until ${day(v.expiresAt)}`;
  return "No expiry";
}

export default function Vouchers() {
  const [list, setList] = useState(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [tab, setTab] = useState("all");
  const [form, setForm] = useState(null); // {} = new, { voucher } = edit
  const [copied, setCopied] = useState(null);

  const load = useCallback(
    () => api("/vouchers").then((d) => setList(asList(d, "vouchers"))).catch((e) => setError(e.message)),
    []
  );
  useEffect(() => { load(); }, [load]);

  const run = async (fn) => {
    setActionError("");
    try {
      await fn();
      await load();
    } catch (e) {
      setActionError(e.message);
    }
  };

  const copy = async (code) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(code);
      setTimeout(() => setCopied(null), 1500);
    } catch {
      /* clipboard not available */
    }
  };

  const shown = (list ?? []).filter((v) => tab === "all" || v.status === tab);

  return (
    <>
      <PageHeader title="Vouchers" subtitle="Promo codes customers can use at checkout" month={false} />

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter by status">
          {TABS.map(([key, label]) => (
            <button
              key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)}
              className={`min-h-[44px] rounded-full border px-4 text-[11px] font-medium uppercase tracking-wider transition ${
                tab === key ? "border-accent bg-accent text-accent-fg" : "border-line text-muted hover:text-fg"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <button type="button" onClick={() => setForm({})} className={btn}>+ New voucher</button>
      </div>

      {error && <p role="alert" className="mt-6 text-sm text-danger">{error}</p>}
      {actionError && <p role="alert" className="mt-6 text-sm text-danger">{actionError}</p>}
      {!list && !error && <p className="mt-6 text-sm text-muted">Loading...</p>}
      {list && shown.length === 0 && <p className="mt-6 text-sm text-muted">No vouchers here yet.</p>}

      <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((v) => {
          const [label, cls] = STATUS[v.status] ?? [v.status, "bg-line text-muted"];
          return (
            <li key={v.id} className={`flex flex-col rounded-2xl border border-line bg-surface ${v.status === "active" ? "" : "opacity-80"}`}>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-4xl font-bold tabular-nums">
                    {v.discountType === "percent" ? `${v.discountValue}%` : pesoWhole(v.discountValue)}
                    <span className="ml-1.5 text-xs font-medium uppercase tracking-widest text-muted">off</span>
                  </p>
                  <span className={`rounded-full px-3 py-0.5 text-[11px] font-medium ${cls}`}>{label}</span>
                </div>
                <p className="mt-3 truncate text-sm font-bold uppercase">{v.title}</p>
                {v.description && <p className="mt-1 text-xs text-muted">{v.description}</p>}
              </div>

              <div className="relative border-t border-dashed border-line px-5 py-4">
                <div className="flex items-center justify-between gap-3">
                  <code className="rounded-lg border border-dashed border-fg/40 px-3 py-1.5 font-mono text-sm tracking-widest">{v.code}</code>
                  <button type="button" onClick={() => copy(v.code)} className="min-h-[44px] px-2 text-[11px] font-medium uppercase tracking-wider text-muted hover:text-fg">
                    {copied === v.code ? "Copied" : "Copy"}
                  </button>
                </div>
                <dl className="mt-3 grid grid-cols-2 gap-y-1 text-xs">
                  <dt className="text-muted">Min. spend</dt><dd className="text-right tabular-nums">{v.minSpend > 0 ? pesoWhole(v.minSpend) : "None"}</dd>
                  <dt className="text-muted">Used</dt><dd className="text-right tabular-nums">{v.usedCount}{v.maxUses ? ` / ${v.maxUses}` : ""}</dd>
                  <dt className="text-muted">Valid</dt><dd className="text-right">{validity(v)}</dd>
                </dl>
              </div>

              <div className="mt-auto flex flex-wrap justify-between border-t border-line px-3 py-1">
                <button type="button" className={btnLink} onClick={() => setForm({ voucher: v })}>Edit</button>
                <button type="button" className={btnLink} onClick={() => run(() => api(`/vouchers/${v.id}`, { method: "PATCH", body: { isActive: !v.isActive } }))}>
                  {v.isActive ? "Deactivate" : "Activate"}
                </button>
                <button
                  type="button" className={btnLink}
                  onClick={() => window.confirm(`Delete ${v.code}?`) && run(() => api(`/vouchers/${v.id}`, { method: "DELETE" }))}
                >
                  Delete
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <VoucherFormDialog
        open={!!form} onClose={() => setForm(null)} voucher={form?.voucher}
        onSaved={() => { setForm(null); load(); }}
      />
    </>
  );
}