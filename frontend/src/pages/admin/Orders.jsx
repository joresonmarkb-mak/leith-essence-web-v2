import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { api } from "../../lib/api.js";
import { peso, shortDate, orderNo } from "../../lib/format.js";
import { monthLabel } from "../../lib/month.js";
import PageHeader from "../../components/admin/PageHeader.jsx";
import { useMonth } from "../../components/admin/MonthSwitcher.jsx";
import StatusPill from "../../components/StatusPill.jsx";
import OrderDialog from "../../components/admin/OrderDialog.jsx";

const PLATFORM = { website: "Website", facebook: "Facebook", instagram: "Instagram", tiktok: "TikTok", shopee: "Shopee", events: "Events" };
const select =
  "h-11 rounded-full border border-line bg-surface px-4 text-base outline-none focus:border-fg sm:text-sm";

export default function Orders() {
  const month = useMonth();
  const [params, setParams] = useSearchParams();
  const status = params.get("status") ?? "all";
  const platform = params.get("platform") ?? "all";
  const [q, setQ] = useState("");
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");
  const [openId, setOpenId] = useState(null);
  const seq = useRef(0);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value === "all") next.delete(key);
    else next.set(key, value);
    setParams(next, { replace: true });
  };

  const load = useCallback(() => {
    const my = ++seq.current;
    const qs = new URLSearchParams({ month });
    if (status !== "all") qs.set("status", status);
    if (platform !== "all") qs.set("platform", platform);
    return api(`/orders?${qs}`)
      .then((d) => { if (my === seq.current) { setOrders(d); setError(""); } })
      .catch((e) => { if (my === seq.current) setError(e.message); });
  }, [month, status, platform]);

  useEffect(() => { setOrders(null); load(); }, [load]);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    return (orders ?? []).filter((o) => !term || o.buyerName.toLowerCase().includes(term));
  }, [orders, q]);

  const subtitle = orders ? `${orders.length} ${orders.length === 1 ? "order" : "orders"} in ${monthLabel(month)}` : "All orders";

  return (
    <>
      <PageHeader title="Orders" subtitle={subtitle} />

      <div className="mt-8 flex flex-wrap gap-2">
        <input
          type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search buyer"
          aria-label="Search buyer" className={`${select} w-full sm:w-56`}
        />
        <select aria-label="Status" className={select} value={status} onChange={(e) => setFilter("status", e.target.value)}>
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="paid">Paid</option>
          <option value="fulfilled">Fulfilled</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select aria-label="Platform" className={select} value={platform} onChange={(e) => setFilter("platform", e.target.value)}>
          <option value="all">All platforms</option>
          {Object.entries(PLATFORM).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {error && <p role="alert" className="mt-6 text-sm text-danger">{error}</p>}
      {!orders && !error && <p className="mt-6 text-sm text-muted">Loading...</p>}

      {orders && (
        <section className="mt-6 rounded-2xl border border-line bg-surface p-4 sm:p-6">
          {shown.length === 0 ? (
            <p className="text-sm text-muted">No orders match.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-xs text-muted">
                  <tr>
                    {["Order", "Buyer", "Items", "From", "Total", "Status", ""].map((h, i) => (
                      <th key={i} className={`pb-2 pr-3 font-normal ${h === "Total" ? "text-right" : ""}`}>{h || <span className="sr-only">Controls</span>}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shown.map((o) => (
                    <tr key={o.id} className="border-t border-line align-top">
                      <td className="py-3 pr-3 font-mono text-xs">{orderNo(o.id)}<span className="block text-muted">{shortDate(o.createdAt)}</span></td>
                      <td className="py-3 pr-3">{o.buyerName}<span className="block max-w-[200px] truncate text-xs text-muted">{o.type === "pickup" ? "Pickup" : o.address}</span></td>
                      <td className="max-w-[240px] py-3 pr-3 text-muted">{o.items.map((i) => `${i.name} ${i.sizeMl}ml ×${i.quantity}`).join(", ")}</td>
                      <td className="py-3 pr-3">{PLATFORM[o.platform]}</td>
                      <td className="py-3 pr-3 text-right tabular-nums">{peso(o.total)}</td>
                      <td className="py-3 pr-3"><StatusPill status={o.status} /></td>
                      <td className="py-1">
                        <button
                          type="button" onClick={() => setOpenId(o.id)}
                          className="min-h-[44px] px-2 text-[11px] font-medium uppercase tracking-wider underline-offset-4 hover:underline"
                        >
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      <OrderDialog orderId={openId} onClose={() => setOpenId(null)} onChanged={load} />
    </>
  );
}