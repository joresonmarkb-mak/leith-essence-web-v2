import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { api } from "../../lib/api.js";
import { shortDate, batchStatus } from "../../lib/format.js";
import PageHeader from "../../components/admin/PageHeader.jsx";
import BatchStatusPill from "../../components/admin/BatchStatusPill.jsx";
import { BatchFormDialog } from "../../components/admin/BatchForms.jsx";
import { btn } from "../../components/admin/ui.js";

const TABS = [["all", "All"], ["active", "Active"], ["sold_out", "Sold out"], ["closed", "Closed"]];

export default function Batches() {
  const navigate = useNavigate();
  const [batches, setBatches] = useState(null);
  const [error, setError] = useState("");
  const [tab, setTab] = useState("all");
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    api("/batches")
      .then((d) => setBatches(Array.isArray(d) ? d : d.batches ?? []))
      .catch((e) => setError(e.message));
  }, []);

  const shown = (batches ?? []).filter((b) => tab === "all" || batchStatus(b.status) === tab);

  return (
    <>
      <PageHeader title="Batches" subtitle="Every production run, with its costs and sales" month={false} />

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
        <button type="button" onClick={() => setCreating(true)} className={btn}>+ New batch</button>
      </div>

      {error && <p role="alert" className="mt-8 text-sm text-danger">{error}</p>}
      {!batches && !error && <p className="mt-8 text-sm text-muted">Loading...</p>}
      {batches && shown.length === 0 && <p className="mt-8 text-sm text-muted">No batches here yet.</p>}

      <ul className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {shown.map((b) => {
          const pct = b.produced ? Math.round((b.sold / b.produced) * 100) : 0;
          return (
            <li key={b.id}>
              <Link to={`/admin/batches/${b.id}`} className="block rounded-2xl border border-line bg-surface p-5 transition hover:border-fg">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="truncate text-lg font-bold uppercase">{b.name}</h2>
                    <p className="mt-0.5 text-xs text-muted">{b.batchDate ? shortDate(b.batchDate) : ""}</p>
                  </div>
                  <BatchStatusPill status={b.status} />
                </div>
                <dl className="mt-5 grid grid-cols-3 gap-2 text-sm">
                  <div><dt className="text-xs text-muted">Made</dt><dd className="tabular-nums">{b.produced}</dd></div>
                  <div><dt className="text-xs text-muted">Sold</dt><dd className="tabular-nums">{b.sold}</dd></div>
                  <div><dt className="text-xs text-muted">Left</dt><dd className="tabular-nums">{b.produced - b.sold}</dd></div>
                </dl>
                <div className="mt-4 h-1.5 rounded-full bg-line" role="presentation">
                  <div className="h-full rounded-full bg-fg" style={{ width: `${pct}%` }} />
                </div>
              </Link>
            </li>
          );
        })}
      </ul>

      <BatchFormDialog
        open={creating}
        onClose={() => setCreating(false)}
        onSaved={(saved) => navigate(`/admin/batches/${saved.id}`)}
      />
    </>
  );
}