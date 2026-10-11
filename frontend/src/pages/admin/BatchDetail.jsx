import { useCallback, useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { api } from "../../lib/api.js";
import { peso, pesoWhole, shortDate, categoryLabel } from "../../lib/format.js";
import PageHeader from "../../components/admin/PageHeader.jsx";
import BatchStatusPill from "../../components/admin/BatchStatusPill.jsx";
import { BatchFormDialog, ItemFormDialog, ItemEditDialog, ExpenseFormDialog } from "../../components/admin/BatchForms.jsx";
import { btn, btnGhost, btnDanger, btnLink } from "../../components/admin/ui.js";

const panel = "rounded-2xl border border-line bg-surface p-4 sm:p-6";
const panelTitle = "text-[11px] font-medium uppercase tracking-widest text-muted";

function Stat({ label, value, note }) {
  return (
    <div className="min-w-0 rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <p className="font-mono text-[11px] uppercase tracking-widest text-muted">{label}</p>
      <p className="mt-2 truncate text-xl font-bold tabular-nums sm:text-3xl">{value}</p>
      {note && <p className="mt-1 text-xs text-muted">{note}</p>}
    </div>
  );
}

export default function BatchDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [b, setB] = useState(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [dlg, setDlg] = useState(null); // { kind, data }

  const load = useCallback(
    () => api(`/batches/${id}`).then(setB).catch((e) => setError(e.message)),
    [id]
  );
  useEffect(() => { setB(null); load(); }, [load]);

  const run = async (fn) => {
    setActionError("");
    try {
      await fn();
      await load();
    } catch (e) {
      setActionError(e.message);
    }
  };
  const closeDlg = () => setDlg(null);
  const saved = () => { closeDlg(); load(); };

  if (error) return <p role="alert" className="text-sm text-danger">{error}</p>;
  if (!b) return <p className="text-sm text-muted">Loading...</p>;

  const s = b.stats;
  const isClosed = b.status === "closed";

  const toggleClosed = () =>
    run(() => api(`/batches/${id}`, { method: "PATCH", body: { status: isClosed ? "active" : "closed" } }));

  const deleteBatch = async () => {
    if (!window.confirm(`Delete ${b.name}? Its perfumes and expenses are deleted too.`)) return;
    setActionError("");
    try {
      await api(`/batches/${id}`, { method: "DELETE" });
      navigate("/admin/batches");
    } catch (e) {
      setActionError(e.message);
    }
  };

  const toggleItem = (it) =>
    run(() => api(`/batches/${id}/items/${it.id}`, { method: "PATCH", body: { isActive: !it.isActive } }));

  const removeItem = (it) =>
    window.confirm(`Remove ${it.name} ${it.sizeMl}ml from this batch?`) &&
    run(() => api(`/batches/${id}/items/${it.id}`, { method: "DELETE" }));

  const removeExpense = (e) =>
    window.confirm(`Delete "${e.description}"? Its cashflow entry is removed too.`) &&
    run(() => api(`/batches/${id}/expenses/${e.id}`, { method: "DELETE" }));

  return (
    <>
      <Link to="/admin/batches" className="text-[11px] font-medium uppercase tracking-wider text-muted hover:text-fg">&larr; All batches</Link>
      <div className="mt-3">
        <PageHeader title={b.name} subtitle={b.batchDate ? `Made ${shortDate(b.batchDate)}` : ""} month={false} />
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <BatchStatusPill status={b.status} />
        {b.notes && <p className="text-sm text-muted">{b.notes}</p>}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => setDlg({ kind: "edit" })} className={btnGhost}>Edit</button>
        <button type="button" onClick={toggleClosed} className={btnGhost}>{isClosed ? "Reopen batch" : "Close batch"}</button>
        <button type="button" onClick={deleteBatch} className={btnDanger}>Delete</button>
      </div>
      {actionError && <p role="alert" className="mt-4 text-sm text-danger">{actionError}</p>}

      <div className="mt-8 flex flex-col gap-5">
        <section aria-label="Batch numbers" className="grid grid-cols-2 gap-3 lg:grid-cols-3">
          <Stat label="Total expenses" value={pesoWhole(s.totalExpenses)} />
          <Stat label="Revenue" value={pesoWhole(s.revenue)} />
          <Stat label="Profit" value={pesoWhole(s.profit)} note="After cost of pieces sold" />
          <Stat label="Net position" value={pesoWhole(s.netPosition)} note={s.netPosition < 0 ? "Not yet paid back" : "Costs recovered"} />
          <Stat label="Pieces sold" value={`${s.unitsSold} / ${s.unitsProduced}`} note={`${s.unitsRemaining} left`} />
          <Stat label="Inventory value" value={pesoWhole(s.inventoryValue)} note={`Cost per piece ${peso(s.costPerPiece)}`} />
        </section>

        <section className={panel} aria-labelledby="perfumes-title">
          <div className="flex items-center justify-between gap-3">
            <h2 id="perfumes-title" className={panelTitle}>Perfumes in this batch</h2>
            <button type="button" onClick={() => setDlg({ kind: "item" })} className={btn}>+ Add perfume</button>
          </div>
          {b.items.length === 0 && <p className="mt-4 text-sm text-muted">No perfumes added yet.</p>}
          <ul className="mt-4 grid gap-4 sm:grid-cols-2">
            {b.items.map((it) => (
              <li key={it.id} className={`rounded-xl border border-line p-4 ${it.isActive ? "" : "opacity-70"}`}>
                <div className="flex gap-3">
                  <div className="grid h-20 w-20 shrink-0 place-items-center rounded-lg border border-line bg-bg">
                    {it.imageUrl && <img src={it.imageUrl} alt="" className="max-h-[85%] max-w-[85%] object-contain" />}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold uppercase">{it.name} <span className="font-normal text-muted">{it.sizeMl}ml</span></p>
                    <p className="truncate text-xs text-muted">{categoryLabel(it.category)} | {it.inspiredBy}</p>
                    {!it.isActive && <p className="mt-1 text-xs text-warn">Deactivated (hidden from the shop)</p>}
                  </div>
                </div>
                <dl className="mt-4 grid grid-cols-3 gap-2 text-xs">
                  <div><dt className="text-muted">Made</dt><dd className="tabular-nums">{it.quantityProduced}</dd></div>
                  <div><dt className="text-muted">Sold</dt><dd className="tabular-nums">{it.sold}</dd></div>
                  <div><dt className="text-muted">Left</dt><dd className="tabular-nums">{it.remaining}</dd></div>
                  <div><dt className="text-muted">Cost</dt><dd className="tabular-nums">{peso(it.costPerPiece)}</dd></div>
                  <div><dt className="text-muted">Price</dt><dd className="tabular-nums">{peso(it.sellingPrice)}</dd></div>
                  <div><dt className="text-muted">Revenue</dt><dd className="tabular-nums">{pesoWhole(it.revenue)}</dd></div>
                </dl>
                <div className="mt-3 flex flex-wrap gap-x-3 gap-y-1 border-t border-line pt-3 text-xs text-muted">
                  {it.allocations.map((a) => (
                    <span key={a.ownerId}>{a.ownerName}: <span className="tabular-nums text-fg">{a.quantity}</span></span>
                  ))}
                </div>
                <div className="mt-2 flex flex-wrap gap-x-1">
                  <button type="button" className={btnLink} onClick={() => setDlg({ kind: "itemEdit", data: it })}>Edit price</button>
                  <button type="button" className={btnLink} onClick={() => toggleItem(it)}>{it.isActive ? "Deactivate" : "Activate"}</button>
                  <button type="button" className={btnLink} onClick={() => removeItem(it)}>Remove</button>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className={panel} aria-labelledby="materials-title">
          <div className="flex items-center justify-between gap-3">
            <h2 id="materials-title" className={panelTitle}>Materials and expenses</h2>
            <button type="button" onClick={() => setDlg({ kind: "expense" })} className={btn}>+ Add expense</button>
          </div>
          {b.expenses.length === 0 ? (
            <p className="mt-4 text-sm text-muted">No expenses recorded.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-xs text-muted">
                  <tr>
                    <th className="pb-2 font-normal">Item</th>
                    <th className="pb-2 text-right font-normal">Qty</th>
                    <th className="pb-2 text-right font-normal">Unit price</th>
                    <th className="pb-2 text-right font-normal">Total</th>
                    <th className="pb-2 pl-4 font-normal">Receipt</th>
                    <th className="pb-2 font-normal"><span className="sr-only">Controls</span></th>
                  </tr>
                </thead>
                <tbody>
                  {b.expenses.map((e) => (
                    <tr key={e.id} className="border-t border-line">
                      <td className="py-3">{e.description}<span className="block text-xs capitalize text-muted">{e.type}</span></td>
                      <td className="py-3 text-right tabular-nums">{e.quantity}</td>
                      <td className="py-3 text-right tabular-nums">{peso(e.unitPrice)}</td>
                      <td className="py-3 text-right tabular-nums">{peso(e.totalCost)}</td>
                      <td className="py-3 pl-4">
                        {e.receiptUrl
                          ? <a href={e.receiptUrl} target="_blank" rel="noreferrer" className="text-xs underline">View</a>
                          : <span className="text-xs text-muted">None</span>}
                      </td>
                      <td className="whitespace-nowrap py-3 text-right">
                        <button type="button" className={btnLink} onClick={() => setDlg({ kind: "expense", data: e })}>Edit</button>
                        <button type="button" className={btnLink} onClick={() => removeExpense(e)}>Delete</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t border-line font-bold">
                    <td className="py-3" colSpan={3}>Total</td>
                    <td className="py-3 text-right tabular-nums">{peso(s.totalExpenses)}</td>
                    <td colSpan={2} />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </section>
      </div>

      <BatchFormDialog open={dlg?.kind === "edit"} onClose={closeDlg} batch={b} onSaved={saved} />
      <ItemFormDialog open={dlg?.kind === "item"} onClose={closeDlg} batchId={id} onSaved={saved} />
      <ItemEditDialog open={dlg?.kind === "itemEdit"} onClose={closeDlg} batchId={id} item={dlg?.data} onSaved={saved} />
      <ExpenseFormDialog open={dlg?.kind === "expense"} onClose={closeDlg} batchId={id} expense={dlg?.data} onSaved={saved} />
    </>
  );
}