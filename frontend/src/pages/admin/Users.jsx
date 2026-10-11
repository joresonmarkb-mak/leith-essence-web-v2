import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api.js";
import { useAuth } from "../../context/AuthContext.jsx";
import { peso, shortDate, orderNo } from "../../lib/format.js";
import { monthLabel } from "../../lib/month.js";
import PageHeader from "../../components/admin/PageHeader.jsx";
import { useMonth } from "../../components/admin/MonthSwitcher.jsx";
import StatusPill from "../../components/StatusPill.jsx";
import Dialog from "../../components/admin/Dialog.jsx";
import { btnGhost, btnDanger } from "../../components/admin/ui.js";

function inMonth(iso, month) {
  const parts = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Manila", year: "numeric", month: "2-digit" }).formatToParts(new Date(iso));
  const get = (t) => parts.find((p) => p.type === t).value;
  return `${get("year")}-${get("month")}` === month;
}

function RolePill({ role }) {
  return (
    <span className={`inline-block rounded-full px-3 py-0.5 text-[11px] font-medium capitalize ${role === "admin" ? "bg-accent text-accent-fg" : "bg-line text-muted"}`}>
      {role}
    </span>
  );
}

function UserDetail({ userId, onChanged }) {
  const { user: me } = useAuth();
  const [u, setU] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(
    () => api(`/users/${userId}`).then(setU).catch((e) => setError(e.message)),
    [userId]
  );
  useEffect(() => { load(); }, [load]);

  const change = async (body, question) => {
    if (!window.confirm(question)) return;
    setBusy(true);
    setError("");
    try {
      await api(`/users/${userId}`, { method: "PATCH", body });
      await load();
      onChanged();
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  };

  if (!u) return error ? <p role="alert" className="text-sm text-danger">{error}</p> : <p className="text-sm text-muted">Loading...</p>;

  const address = [u.street, u.barangay, u.city, u.province].filter(Boolean).join(", ") || "Not provided";
  const rows = [
    ["Name", `${u.firstName} ${u.lastName}`],
    ["Email", u.email],
    ["Phone", u.phone || "Not provided"],
    ["Address", address],
    ["Role", <RolePill key="r" role={u.role} />],
    ["Account", u.isActive ? "Active" : "Deactivated"],
    ["Joined", shortDate(u.createdAt)],
    ["Orders", u.orders],
    ["Total spent", peso(u.totalSpent)],
  ];
  const isMe = me?.id === u.id;

  return (
    <>
      <dl className="flex flex-col">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-4 border-t border-line py-2.5 text-sm">
            <dt className="shrink-0 text-xs text-muted">{k}</dt>
            <dd className="min-w-0 break-words text-right">{v}</dd>
          </div>
        ))}
      </dl>

      {u.recentOrders.length > 0 && (
        <div className="mt-4">
          <p className="text-[11px] font-medium uppercase tracking-widest text-muted">Recent orders</p>
          <ul className="mt-2 flex flex-col">
            {u.recentOrders.map((o) => (
              <li key={o.id} className="flex items-center justify-between gap-3 border-t border-line py-2.5 text-sm">
                <span className="font-mono text-xs">{orderNo(o.id)} <span className="text-muted">{shortDate(o.createdAt)}</span></span>
                <span className="flex items-center gap-3"><span className="tabular-nums">{peso(o.total)}</span><StatusPill status={o.status} /></span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {error && <p role="alert" className="mt-4 text-sm text-danger">{error}</p>}

      {!isMe && (
        <div className="mt-5 flex flex-wrap gap-2">
          <button
            type="button" disabled={busy} className={btnGhost}
            onClick={() => change(
              { role: u.role === "admin" ? "customer" : "admin" },
              u.role === "admin" ? `Remove admin access from ${u.firstName}?` : `Make ${u.firstName} an admin? They will see all finances.`
            )}
          >
            {u.role === "admin" ? "Make customer" : "Make admin"}
          </button>
          <button
            type="button" disabled={busy} className={u.isActive ? btnDanger : btnGhost}
            onClick={() => change(
              { isActive: !u.isActive },
              u.isActive ? `Deactivate ${u.firstName}'s account? They will be signed out.` : `Reactivate ${u.firstName}'s account?`
            )}
          >
            {u.isActive ? "Deactivate" : "Activate"}
          </button>
        </div>
      )}
    </>
  );
}

export default function Users() {
  const month = useMonth();
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [selectedId, setSelectedId] = useState(null);

  const load = useCallback(() => api("/users").then(setData).catch((e) => setError(e.message)), []);
  useEffect(() => { load(); }, [load]);

  const shown = useMemo(() => {
    const term = q.trim().toLowerCase();
    const list = data?.users ?? [];
    if (!term) return list;
    return list.filter((u) => `${u.firstName} ${u.lastName} ${u.email}`.toLowerCase().includes(term));
  }, [data, q]);

  const joined = data ? data.users.filter((u) => inMonth(u.createdAt, month)).length : 0;
  const subtitle = data ? `Total users: ${data.total} · ${joined} joined in ${monthLabel(month)}` : "Total users";

  return (
    <>
      <PageHeader title="Users" subtitle={subtitle} />

      {error && <p role="alert" className="mt-8 text-sm text-danger">{error}</p>}
      {!data && !error && <p className="mt-8 text-sm text-muted">Loading...</p>}

      {data && (
        <section className="mt-8 rounded-2xl border border-line bg-surface p-4 sm:p-6">
          <label className="block">
            <span className="sr-only">Search users</span>
            <input
              type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search name or email"
              className="h-11 w-full rounded-full border border-line bg-bg px-5 text-base outline-none focus:border-fg sm:max-w-xs sm:text-sm"
            />
          </label>

          {shown.length === 0 ? (
            <p className="mt-6 text-sm text-muted">No users match.</p>
          ) : (
            <div className="mt-4 overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="text-xs text-muted">
                  <tr>
                    {["Last name", "First name", "Email address", "Role", "Controls"].map((h) => (
                      <th key={h} className="pb-2 pr-4 font-normal uppercase tracking-wider">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {shown.map((u) => (
                    <tr key={u.id} className={`border-t border-line ${u.isActive ? "" : "opacity-60"}`}>
                      <td className="py-3 pr-4 font-medium">{u.lastName}</td>
                      <td className="py-3 pr-4">{u.firstName}</td>
                      <td className="py-3 pr-4 text-muted">{u.email}</td>
                      <td className="py-3 pr-4"><RolePill role={u.role} />{!u.isActive && <span className="ml-2 text-xs text-warn">Deactivated</span>}</td>
                      <td className="py-3">
                        <button
                          type="button" onClick={() => setSelectedId(u.id)}
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

      <Dialog open={selectedId !== null} onClose={() => setSelectedId(null)} title="User details">
        {selectedId !== null && <UserDetail userId={selectedId} onChanged={load} />}
      </Dialog>
    </>
  );
}