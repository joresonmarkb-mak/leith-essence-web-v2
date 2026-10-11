import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { api } from "../../lib/api.js";
import { peso, pesoWhole, pesoShort, shortDay, shortDate, orderNo } from "../../lib/format.js";
import { monthLabel } from "../../lib/month.js";
import PageHeader from "../../components/admin/PageHeader.jsx";
import { useMonth } from "../../components/admin/MonthSwitcher.jsx";
import StatusPill from "../../components/StatusPill.jsx";

const PLATFORM = { website: "Website", facebook: "Facebook", instagram: "Instagram", tiktok: "TikTok", shopee: "Shopee", events: "Events" };
const panel = "rounded-2xl border border-line bg-surface p-4 sm:p-6";
const panelTitle = "text-[11px] font-medium uppercase tracking-widest text-muted";

function Change({ value }) {
  if (value == null) return <p className="mt-1 text-xs text-muted">No sales last month</p>;
  const up = value > 0;
  const down = value < 0;
  return (
    <p className={`mt-1 text-xs ${up ? "text-success" : down ? "text-danger" : "text-muted"}`}>
      <span aria-hidden="true">{up ? "▲" : down ? "▼" : "•"}</span>{" "}
      <span className="sr-only">{up ? "Up " : down ? "Down " : ""}</span>
      {Math.abs(value)}% vs last month
    </p>
  );
}

function Stat({ label, value, change, note }) {
  return (
    <div className="min-w-0 rounded-2xl border border-line bg-surface p-4 sm:p-5">
      <p className="font-mono text-[11px] uppercase tracking-widest text-muted">{label}</p>
      <p className="mt-2 truncate text-xl font-bold tabular-nums sm:text-3xl">{value}</p>
      {change !== undefined && <Change value={change} />}
      {note && <p className="mt-1 text-xs text-muted">{note}</p>}
    </div>
  );
}

function ChartTip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-line bg-surface px-3 py-2 text-xs shadow-sm">
      <p className="font-medium">{shortDay(d.date)}</p>
      <p className="tabular-nums">{peso(d.revenue)}</p>
      <p className="text-muted">{d.units} {d.units === 1 ? "piece" : "pieces"}</p>
    </div>
  );
}

export default function Dashboard() {
  const month = useMonth();
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let ignore = false;
    api(`/dashboard?month=${month}`)
      .then((d) => { if (!ignore) { setResult(d); setError(""); } })
      .catch((e) => { if (!ignore) setError(e.message); });
    return () => { ignore = true; };
  }, [month]);

  const data = result?.month === month ? result : null;

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Sales, profit, and stock across all batches" />

      {error && <p role="alert" className="mt-8 text-sm text-danger">{error}</p>}
      {!data && !error && <p className="mt-8 text-sm text-muted">Loading...</p>}

      {data && (
        <div className="mt-8 flex flex-col gap-5">
          {data.cards.pendingOrders > 0 && (
            <Link to="/admin/orders?status=pending" className="flex items-center justify-between gap-3 rounded-2xl bg-warn-bg px-5 py-3 text-sm text-warn">
              <span>
                <b>{data.cards.pendingOrders}</b> {data.cards.pendingOrders === 1 ? "order is" : "orders are"} waiting for payment confirmation
              </span>
              <span className="shrink-0 text-xs font-medium uppercase">Review &rarr;</span>
            </Link>
          )}

          <section aria-label="Key numbers" className="grid grid-cols-2 gap-3 lg:grid-cols-3">
            <Stat label="Revenue" value={pesoWhole(data.cards.revenue.value)} change={data.cards.revenue.change} />
            <Stat label="Profit" value={pesoWhole(data.cards.profit.value)} change={data.cards.profit.change} note="After cost of pieces sold" />
            <Stat label="Perfumes sold" value={data.cards.perfumesSold.value} change={data.cards.perfumesSold.change} />
            <Stat label="Stock value" value={pesoWhole(data.cards.stockValue)} note="At cost, right now" />
            <Stat label="Total stocks" value={data.cards.totalStocks} note="Pieces on hand, right now" />
            <Stat label="Users" value={data.cards.users.total} note={`${data.cards.users.newThisMonth} new this month`} />
          </section>

          <section className={panel} aria-labelledby="sales-title">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="sales-title" className={panelTitle}>Sales, {monthLabel(month)}</h2>
              <p className="text-sm tabular-nums">{peso(data.cards.revenue.value)}</p>
            </div>
            <div role="img" aria-label={`Line chart of daily sales for ${monthLabel(month)}`} className="mt-4 h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.salesByDay} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                  <CartesianGrid vertical={false} stroke="var(--line)" />
                  <XAxis
                    dataKey="date" tickFormatter={(d) => String(Number(d.slice(8)))} interval="preserveStartEnd" minTickGap={14}
                    tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={{ stroke: "var(--line)" }} tickLine={false}
                  />
                  <YAxis tickFormatter={pesoShort} width={52} tick={{ fill: "var(--muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<ChartTip />} cursor={{ stroke: "var(--muted)", strokeDasharray: "3 3" }} />
                  <Line
                    type="linear" dataKey="revenue" stroke="var(--fg)" strokeWidth={2} dot={false}
                    activeDot={{ r: 5, fill: "var(--fg)", stroke: "var(--surface)", strokeWidth: 2 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
            {data.cards.orders.value === 0 && <p className="mt-2 text-center text-xs text-muted">No sales this month yet.</p>}

            <details className="mt-4">
              <summary className="cursor-pointer text-[11px] font-medium uppercase tracking-wider text-muted">View as table</summary>
              <div className="mt-3 max-h-64 overflow-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-muted"><tr><th className="py-1.5 font-normal">Day</th><th className="py-1.5 text-right font-normal">Sales</th><th className="py-1.5 text-right font-normal">Pieces</th></tr></thead>
                  <tbody>
                    {data.salesByDay.filter((d) => d.revenue > 0).map((d) => (
                      <tr key={d.date} className="border-t border-line">
                        <td className="py-1.5">{shortDay(d.date)}</td>
                        <td className="py-1.5 text-right tabular-nums">{peso(d.revenue)}</td>
                        <td className="py-1.5 text-right tabular-nums">{d.units}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </details>
          </section>

          <div className="grid gap-5 lg:grid-cols-2">
            <section className={panel} aria-labelledby="platform-title">
              <h2 id="platform-title" className={panelTitle}>Sales by platform</h2>
              <ul className="mt-4 flex flex-col gap-4">
                {data.salesByPlatform.map((p) => (
                  <li key={p.platform}>
                    <div className="flex items-baseline justify-between gap-3 text-sm">
                      <span>{PLATFORM[p.platform]}</span>
                      <span className="tabular-nums">
                        {peso(p.revenue)} <span className="text-xs text-muted">&middot; {p.orders} {p.orders === 1 ? "order" : "orders"}</span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 rounded-full bg-line" role="presentation">
                      <div className="h-full rounded-full bg-fg" style={{ width: `${p.share}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </section>

            <section className={panel} aria-labelledby="best-title">
              <h2 id="best-title" className={panelTitle}>Best-selling perfumes</h2>
              {data.bestSelling.length === 0 ? (
                <p className="mt-4 text-sm text-muted">Nothing sold this month yet.</p>
              ) : (
                <ol className="mt-4 flex flex-col">
                  {data.bestSelling.map((p, i) => (
                    <li key={p.id} className="flex items-center gap-3 border-t border-line py-3 first:border-t-0 first:pt-0">
                      <span className="w-4 font-mono text-xs text-muted">{i + 1}</span>
                      <div className="grid h-12 w-12 shrink-0 place-items-center rounded-lg border border-line bg-bg">
                        {p.imageUrl && <img src={p.imageUrl} alt="" className="max-h-[85%] max-w-[85%] object-contain" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-bold uppercase">{p.name}</p>
                        <p className="text-xs text-muted">{p.units} {p.units === 1 ? "piece" : "pieces"} sold</p>
                      </div>
                      <p className="shrink-0 text-sm tabular-nums">{peso(p.revenue)}</p>
                    </li>
                  ))}
                </ol>
              )}
            </section>
          </div>

          <section className={panel} aria-labelledby="recent-title">
            <div className="flex items-baseline justify-between">
              <h2 id="recent-title" className={panelTitle}>Recent orders</h2>
              <Link to="/admin/orders" className="text-[11px] font-medium uppercase tracking-wider text-muted hover:text-fg">View all &rarr;</Link>
            </div>
            {data.recentOrders.length === 0 ? (
              <p className="mt-4 text-sm text-muted">No orders this month yet.</p>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full min-w-[640px] text-left text-sm">
                  <thead className="text-xs text-muted">
                    <tr>
                      {["Order", "Buyer", "Items", "From", "Total", "Status"].map((h) => (
                        <th key={h} className={`pb-2 font-normal ${h === "Total" ? "text-right" : ""}`}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data.recentOrders.map((o) => (
                      <tr key={o.id} className="border-t border-line align-top">
                        <td className="py-3 pr-3 font-mono text-xs">{orderNo(o.id)}<span className="block text-muted">{shortDate(o.createdAt)}</span></td>
                        <td className="py-3 pr-3">{o.buyerName}</td>
                        <td className="max-w-[220px] py-3 pr-3 text-muted">{o.items}</td>
                        <td className="py-3 pr-3">{PLATFORM[o.platform]}</td>
                        <td className="py-3 pr-3 text-right tabular-nums">{peso(o.total)}</td>
                        <td className="py-3"><StatusPill status={o.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      )}
    </>
  );
}