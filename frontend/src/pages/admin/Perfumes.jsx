import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api.js";
import { peso, categoryLabel } from "../../lib/format.js";
import PageHeader from "../../components/admin/PageHeader.jsx";
import { ItemEditDialog } from "../../components/admin/BatchForms.jsx";
import { PerfumeFormDialog } from "../../components/admin/PerfumeForms.jsx";
import { btn, btnLink, asList } from "../../components/admin/ui.js";

const select =
  "h-11 rounded-full border border-line bg-surface px-4 text-base outline-none focus:border-fg sm:text-sm";
const STATUS = {
  active: ["Active", "bg-success-bg text-success"],
  sold_out: ["Sold out", "bg-warn-bg text-warn"],
  deactivated: ["Deactivated", "bg-line text-muted"],
};
const itemStatus = (it) => (!it.isActive ? "deactivated" : it.remaining <= 0 ? "sold_out" : "active");

function Photo({ src }) {
  return (
    <div className="grid aspect-square place-items-center rounded-xl border border-line bg-bg">
      {src && <img src={src} alt="" className="max-h-[85%] max-w-[85%] object-contain" />}
    </div>
  );
}

/* ---------- Stock in batches (the mockup grid) ---------- */

function StockTab() {
  const [items, setItems] = useState(null);
  const [batches, setBatches] = useState([]);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [cat, setCat] = useState("all");
  const [batch, setBatch] = useState("all");
  const [status, setStatus] = useState("all");
  const [editing, setEditing] = useState(null);

  const load = useCallback(async () => {
    try {
      const list = asList(await api("/batches"), "batches");
      const details = await Promise.all(list.map((b) => api(`/batches/${b.id}`)));
      setBatches(list);
      setItems(details.flatMap((d) => d.items.map((it) => ({ ...it, batchId: d.id, batchName: d.name }))));
    } catch (e) {
      setError(e.message);
    }
  }, []);
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

  const shown = useMemo(
    () =>
      (items ?? []).filter(
        (it) =>
          (cat === "all" || it.category === cat) &&
          (batch === "all" || String(it.batchId) === batch) &&
          (status === "all" || itemStatus(it) === status)
      ),
    [items, cat, batch, status]
  );

  return (
    <>
      <div className="mt-6 flex flex-wrap gap-2">
        <select aria-label="Category" className={select} value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="all">All categories</option>
          <option value="for_him">For him</option>
          <option value="for_her">For her</option>
          <option value="unisex">Unisex</option>
        </select>
        <select aria-label="Batch" className={select} value={batch} onChange={(e) => setBatch(e.target.value)}>
          <option value="all">All batches</option>
          {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
        <select aria-label="Status" className={select} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All statuses</option>
          <option value="active">Active</option>
          <option value="sold_out">Sold out</option>
          <option value="deactivated">Deactivated</option>
        </select>
      </div>

      {error && <p role="alert" className="mt-6 text-sm text-danger">{error}</p>}
      {actionError && <p role="alert" className="mt-6 text-sm text-danger">{actionError}</p>}
      {!items && !error && <p className="mt-6 text-sm text-muted">Loading...</p>}
      {items && shown.length === 0 && <p className="mt-6 text-sm text-muted">Nothing here yet.</p>}

      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {shown.map((it) => {
          const [label, cls] = STATUS[itemStatus(it)];
          return (
            <li key={it.id} className={`flex flex-col rounded-2xl border border-line bg-surface p-3 sm:p-4 ${it.isActive ? "" : "opacity-75"}`}>
              <span className={`mb-2 self-start rounded-full px-3 py-0.5 text-[10px] font-medium uppercase tracking-wider ${cls}`}>{label}</span>
              <Photo src={it.imageUrl} />
              <p className="mt-3 truncate text-sm font-bold uppercase">{it.name} <span className="font-normal text-muted">{it.sizeMl}ml</span></p>
              <p className="truncate text-[11px] uppercase text-muted">{categoryLabel(it.category)} | {it.inspiredBy}</p>
              <p className="mt-2 text-xs">PRICE: <span className="tabular-nums">{peso(it.sellingPrice)}</span></p>
              <p className="text-xs text-muted tabular-nums">{it.quantityProduced} made | {it.sold} sold</p>
              <p className="mt-1 truncate text-[11px] text-muted">{it.batchName}</p>
              <div className="mt-auto flex flex-wrap justify-between border-t border-line pt-2">
                <button type="button" className={btnLink} onClick={() => setEditing(it)}>Edit</button>
                <button
                  type="button" className={btnLink}
                  onClick={() => run(() => api(`/batches/${it.batchId}/items/${it.id}`, { method: "PATCH", body: { isActive: !it.isActive } }))}
                >
                  {it.isActive ? "Deactivate" : "Activate"}
                </button>
                <button
                  type="button" className={btnLink}
                  onClick={() =>
                    window.confirm(`Remove ${it.name} ${it.sizeMl}ml from ${it.batchName}?`) &&
                    run(() => api(`/batches/${it.batchId}/items/${it.id}`, { method: "DELETE" }))
                  }
                >
                  Delete
                </button>
              </div>
            </li>
          );
        })}
      </ul>

      <ItemEditDialog
        open={!!editing} onClose={() => setEditing(null)} batchId={editing?.batchId} item={editing}
        onSaved={() => { setEditing(null); load(); }}
      />
    </>
  );
}

/* ---------- Catalog: the perfumes themselves ---------- */

function CatalogTab() {
  const [list, setList] = useState(null);
  const [error, setError] = useState("");
  const [actionError, setActionError] = useState("");
  const [form, setForm] = useState(null); // { perfume? }

  const load = useCallback(
    () => api("/perfumes").then((d) => setList(asList(d, "perfumes"))).catch((e) => setError(e.message)),
    []
  );
  useEffect(() => { load(); }, [load]);

  const remove = async (p) => {
    if (!window.confirm(`Delete ${p.name}?`)) return;
    setActionError("");
    try {
      await api(`/perfumes/${p.id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setActionError(e.message);
    }
  };

  return (
    <>
      <div className="mt-6 flex justify-end">
        <button type="button" onClick={() => setForm({})} className={btn}>+ New perfume</button>
      </div>

      {error && <p role="alert" className="mt-6 text-sm text-danger">{error}</p>}
      {actionError && <p role="alert" className="mt-6 text-sm text-danger">{actionError}</p>}
      {!list && !error && <p className="mt-6 text-sm text-muted">Loading...</p>}

      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {(list ?? []).map((p) => (
          <li key={p.id} className="flex flex-col rounded-2xl border border-line bg-surface p-3 sm:p-4">
            <Photo src={p.imageUrl} />
            <p className="mt-3 truncate text-sm font-bold uppercase">{p.name}</p>
            <p className="truncate text-[11px] uppercase text-muted">{categoryLabel(p.category)} | {p.inspiredBy}</p>
            <p className="mt-2 text-xs capitalize text-muted">{p.intensity}</p>
            <p className="text-xs text-muted">{p.notes.map((n) => n.name).join(" · ")}</p>
            <div className="mt-auto flex justify-between border-t border-line pt-2">
              <button type="button" className={btnLink} onClick={() => setForm({ perfume: p })}>Edit</button>
              <button type="button" className={btnLink} onClick={() => remove(p)}>Delete</button>
            </div>
          </li>
        ))}
      </ul>

      <PerfumeFormDialog
        open={!!form} onClose={() => setForm(null)} perfume={form?.perfume}
        onSaved={() => { setForm(null); load(); }}
      />
    </>
  );
}

export default function Perfumes() {
  const [tab, setTab] = useState("stock");
  const tabCls = (k) =>
    `min-h-[44px] rounded-full border px-4 text-[11px] font-medium uppercase tracking-wider transition ${
      tab === k ? "border-accent bg-accent text-accent-fg" : "border-line text-muted hover:text-fg"
    }`;

  return (
    <>
      <PageHeader title="Perfumes" subtitle="All perfume stocks in all batches" month={false} />
      <div className="mt-8 flex gap-2" role="tablist">
        <button type="button" role="tab" aria-selected={tab === "stock"} className={tabCls("stock")} onClick={() => setTab("stock")}>Stock in batches</button>
        <button type="button" role="tab" aria-selected={tab === "catalog"} className={tabCls("catalog")} onClick={() => setTab("catalog")}>Catalog</button>
      </div>
      {tab === "stock" ? <StockTab /> : <CatalogTab />}
    </>
  );
}