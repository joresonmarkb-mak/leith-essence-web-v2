import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../lib/api.js";
import { peso, shortDay } from "../../lib/format.js";
import { monthLabel } from "../../lib/month.js";
import PageHeader from "../../components/admin/PageHeader.jsx";
import { useMonth } from "../../components/admin/MonthSwitcher.jsx";
import { CashflowFormDialog, CATEGORIES } from "../../components/admin/CashflowForm.jsx";
import { btn, btnLink, asList } from "../../components/admin/ui.js";

const CAT = Object.fromEntries([...CATEGORIES, ["sale", "Sale"]]);
const select = "h-11 rounded-full border border-line bg-surface px-4 text-base outline-none focus:border-fg sm:text-sm";
const signed = (n) => `${n < 0 ? "−" : ""}${peso(Math.abs(n))}`;

function Tile({ label, value, tone }) {
  return (
    <div className="min-w-0 rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <p className="font-mono text-[11px] uppercase tracking-widest text-muted">{label}</p>
      <p className={`mt-2 truncate text-xl font-bold tabular-nums sm:text-3xl ${tone ?? ""}`}>{value}</p>
    </div>
  );
}

export default function Cashflow() {
  const month = useMonth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [cat, setCat] = useState("all");
  const [owner, setOwner] = useState("all");
  const [batch, setBatch] = useState("all");
  const [owners, setOwners] = useState([]);
  const [batches, setBatches] = useState([]);
  const [form, setForm] = useState(null); // {} = new, { entry } = edit
  const seq = useRef(0);

  useEffect(() => {
    api("/owners").then((d) => setOwners(asList(d, "owners"))).catch(() => {});
    api("/batches").then((d) => setBatches(asList(d, "batches"))).catch(() => {});
  }, []);

  const load = useCallback(() => {
    const my = ++seq.current;
    const qs = new URLSearchParams({ month });
    if (cat !== "all") qs.set("category", cat);
    if (owner !== "all") qs.set("ownerId", owner);
    if (batch !== "all") qs.set("batchId", batch);
    return api(`/cashflow?${qs}`)
      .then((d) => { if (my === seq.current) { setData(d); setError(""); } })
      .catch((e) => { if (my === seq.current) setError(e.message); });
  }, [month, cat, owner, batch]);

  useEffect(() => { setData(null); load(); }, [load]);

  const remove = async (e) => {
    if (!window.confirm(`Delete "${e.description}"?`)) return;
    setActionError("");
    try {
      await api(`/cashflow/${e.id}`, { method: "DELETE" });
      await load();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const s = data?.summary;

  return (
    <>
      <PageHeader title="Cashflow" subtitle={`Money in and out, ${monthLabel(month)}`} />

      <div className="mt-8 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          <select aria-label="Category" className={select} value={cat} onChange={(e) => setCat(e.target.value)}>
            <option value="all">All categories</option>
            {Object.entries(CAT).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <select aria-label="Owner" className={select} value={owner} onChange={(e) => setOwner(e.target.value)}>
            <option value="all">All owners</option>
            {owners.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
          </select>
          <select aria-label="Batch" className={select} value={batch} onChange={(e) => setBatch(e.target.value)}>
            <option value="all">All batches</option>
            {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
          </select>
        </div>
        <button type="button" onClick={() => setForm({})} className={btn}>+ Add entry</button>
      </div>

      {error && <p role="alert" className="mt-6 text-sm text-danger">{error}</p>}
      {actionError && <p role="alert" className="mt-6 text-sm text-danger">{actionError}</p>}
      {!data && !error && <p className="mt-6 text-sm text-muted">Loading...</p>}

      {data && (
        <>
          <section aria-label="Totals" className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Tile label="Cash in" value={`+${peso(s.cashIn)}`} tone="text-success" />
            <Tile label="Cash out" value={`−${peso(s.cashOut)}`} />
            <Tile label="Net" value={signed(s.net)} />
          </section>

          <section className="mt-5 rounded-2xl border border-line bg-surface p-4 sm:p-6">
            {data.entries.length === 0 ? (
              <p className="text-sm text-muted">No entries for these filters.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left text-sm">
                  <thead className="text-xs text-muted">
                    <tr>
                      <th className="pb-2 pr-3 font-normal">Date</th>
                      <th className="pb-2 pr-3 font-normal">Description</th>
                      <th className="pb-2 pr-3 font-normal">Category</th>
                      <th className="pb-2 pr-3 text-right font-normal">Amount</th>
                      <th className="pb-2 pr-3 font-normal">Receipt</th>
                      <th className="pb-2 font-normal"><span className="sr-only">Controls</span></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.entries.map((e) => (
                      <tr key={e.id} className="border-t border-line align-top">
                        <td className="whitespace-nowrap py-3 pr-3 text-xs">{shortDay(e.date)}</td>
                        <td className="py-3 pr-3">
                          {e.description}
                          <span className="block text-xs text-muted">{[e.ownerName, e.batchName].filter(Boolean).join(" · ")}</span>
                        </td>
                        <td className="py-3 pr-3 text-muted">{CAT[e.category] ?? e.category}</td>
                        <td className={`whitespace-nowrap py-3 pr-3 text-right tabular-nums ${e.type === "in" ? "text-success" : ""}`}>
                          {e.type === "in" ? "+" : "−"}{peso(e.amount)}
                        </td>
                        <td className="py-3 pr-3">
                          {e.receiptUrl
                            ? <a href={e.receiptUrl} target="_blank" rel="noreferrer" className="text-xs underline">View</a>
                            : <span className="text-xs text-muted">None</span>}
                        </td>
                        <td className="whitespace-nowrap py-1 text-right">
                          {e.editable ? (
                            <>
                              <button type="button" className={btnLink} onClick={() => setForm({ entry: e })}>Edit</button>
                              <button type="button" className={btnLink} onClick={() => remove(e)}>Delete</button>
                            </>
                          ) : (
                            <span className="text-[11px] text-muted">{e.orderId ? "From an order" : "From a batch"}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      <CashflowFormDialog
        open={!!form} onClose={() => setForm(null)} entry={form?.entry}
        onSaved={() => { setForm(null); load(); }}
      />
    </>
  );
}