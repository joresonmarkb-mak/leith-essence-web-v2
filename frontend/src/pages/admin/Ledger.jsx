import { useEffect, useRef, useState } from "react";
import { api } from "../../lib/api.js";
import { peso, pesoWhole } from "../../lib/format.js";
import PageHeader from "../../components/admin/PageHeader.jsx";
import { asList } from "../../components/admin/ui.js";

const select = "h-11 rounded-full border border-line bg-surface px-4 text-base outline-none focus:border-fg sm:text-sm";

function Stat({ label, value, note }) {
  return (
    <div className="min-w-0">
      <dt className="font-mono text-[11px] uppercase tracking-widest text-muted">{label}</dt>
      <dd className="mt-1 truncate text-lg font-bold tabular-nums">{value}</dd>
      {note && <p className="text-xs text-muted">{note}</p>}
    </div>
  );
}

export default function Ledger() {
  const [batchId, setBatchId] = useState("all");
  const [batches, setBatches] = useState([]);
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const seq = useRef(0);

  useEffect(() => {
    api("/batches").then((d) => setBatches(asList(d, "batches"))).catch(() => {});
  }, []);

  useEffect(() => {
    const my = ++seq.current;
    setData(null);
    api(`/ledger${batchId === "all" ? "" : `?batchId=${batchId}`}`)
      .then((d) => { if (my === seq.current) { setData(d); setError(""); } })
      .catch((e) => { if (my === seq.current) setError(e.message); });
  }, [batchId]);

  const t = data?.totals;

  return (
    <>
      <PageHeader title="Ledger" subtitle="Who holds the stock, who sold it, and who put money in" month={false} />

      <div className="mt-8">
        <select aria-label="Batch" className={select} value={batchId} onChange={(e) => setBatchId(e.target.value)}>
          <option value="all">All batches</option>
          {batches.map((b) => <option key={b.id} value={b.id}>{b.name}</option>)}
        </select>
      </div>

      {error && <p role="alert" className="mt-6 text-sm text-danger">{error}</p>}
      {!data && !error && <p className="mt-6 text-sm text-muted">Loading...</p>}

      {data && (
        <div className="mt-6 flex flex-col gap-5">
          <section aria-label="All owners together" className="rounded-2xl border border-line bg-surface p-4 sm:p-6">
            <h2 className="text-[11px] font-medium uppercase tracking-widest text-muted">All owners together</h2>
            <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-5">
              <Stat label="Stock value" value={pesoWhole(t.stockValueHeld)} />
              <Stat label="Pieces held" value={t.unitsOnHand} />
              <Stat label="Pieces sold" value={t.totalSales} />
              <Stat label="Contributed" value={peso(t.contributed)} />
              <Stat label="Drawn" value={peso(t.drawn)} />
            </dl>
          </section>

          <div className="grid gap-4 lg:grid-cols-3">
            {data.owners.map((o) => (
              <article key={o.id} className="flex flex-col rounded-2xl border border-line bg-surface p-5">
                <header className="flex items-center justify-between gap-3">
                  <h2 className="truncate text-lg font-bold uppercase">{o.name}</h2>
                  {o.isMe && <span className="rounded-full bg-accent px-3 py-0.5 text-[11px] font-medium text-accent-fg">You</span>}
                </header>

                <dl className="mt-5 grid grid-cols-2 gap-x-4 gap-y-5">
                  <Stat label="Stock on hand" value={pesoWhole(o.stockValueHeld)} note={`${o.unitsOnHand} pieces`} />
                  <Stat label="Total sales" value={pesoWhole(o.salesAmount)} note={`${o.totalSales} pieces · ${o.orders} ${o.orders === 1 ? "order" : "orders"}`} />
                  <Stat label="Contributed" value={peso(o.contributed)} />
                  <Stat label="Drawn" value={peso(o.drawn)} />
                </dl>

                <details className="mt-5 border-t border-line pt-3">
                  <summary className="min-h-[44px] cursor-pointer text-[11px] font-medium uppercase tracking-wider text-muted">
                    Stock held ({o.stock.length})
                  </summary>
                  {o.stock.length === 0 ? (
                    <p className="mt-2 text-sm text-muted">Holds no stock.</p>
                  ) : (
                    <div className="mt-2 overflow-x-auto">
                      <table className="w-full min-w-[420px] text-left text-xs">
                        <thead className="text-muted">
                          <tr>
                            <th className="pb-1.5 pr-2 font-normal">Perfume</th>
                            <th className="pb-1.5 pr-2 text-right font-normal">Got</th>
                            <th className="pb-1.5 pr-2 text-right font-normal">Sold</th>
                            <th className="pb-1.5 pr-2 text-right font-normal">Left</th>
                            <th className="pb-1.5 text-right font-normal">Value</th>
                          </tr>
                        </thead>
                        <tbody>
                          {o.stock.map((s) => (
                            <tr key={`${s.batchId}-${s.perfumeId}-${s.sizeMl}`} className="border-t border-line">
                              <td className="py-2 pr-2">{s.perfumeName} {s.sizeMl}ml<span className="block text-muted">{s.batchName}</span></td>
                              <td className="py-2 pr-2 text-right tabular-nums">{s.allocated}</td>
                              <td className="py-2 pr-2 text-right tabular-nums">{s.sold}</td>
                              <td className="py-2 pr-2 text-right tabular-nums">{s.remaining}</td>
                              <td className="py-2 text-right tabular-nums">{peso(s.value)}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </details>
              </article>
            ))}
          </div>
        </div>
      )}
    </>
  );
}