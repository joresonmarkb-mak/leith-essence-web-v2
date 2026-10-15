import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api.js";
import PageHeader from "../../components/admin/PageHeader.jsx";
import { input, btn, btnGhost, btnDanger } from "../../components/admin/ui.js";
import AnnounceButton from "../../components/admin/AnnounceButton.jsx";

const fmt = (d) =>
  new Date(d).toLocaleDateString("en-PH", {
    timeZone: "Asia/Manila",
    year: "numeric",
    month: "short",
    day: "numeric",
  });

// Stops spreadsheet apps from running an email that starts with = + - @ as a formula
const csvCell = (v) => {
  let s = String(v ?? "");
  if (/^[=+\-@]/.test(s)) s = "'" + s;
  return `"${s.replace(/"/g, '""')}"`;
};

export default function Subscribers() {
  const [rows, setRows] = useState(null);
  const [error, setError] = useState("");
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState("all"); // all | active | inactive
  const [busyId, setBusyId] = useState(null);
  const [note, setNote] = useState("");

  async function load() {
    try {
      setError("");
      const data = await api("/subscribers");
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setError(e.message || "Could not load subscribers.");
      setRows([]);
    }
  }
  useEffect(() => { load(); }, []);

  const shown = useMemo(() => {
    const s = q.trim().toLowerCase();
    return (rows ?? []).filter(
      (r) =>
        (filter === "all" || (filter === "active") === r.isActive) &&
        (!s || r.email.includes(s))
    );
  }, [rows, q, filter]);

  const activeCount = (rows ?? []).filter((r) => r.isActive).length;

  async function toggle(r) {
    setBusyId(r.id);
    try {
      const upd = await api(`/subscribers/${r.id}`, { method: "PATCH", body: { isActive: !r.isActive } });
      setRows((list) => list.map((x) => (x.id === r.id ? upd : x)));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  async function remove(r) {
    if (!window.confirm(`Delete ${r.email}? This can't be undone.`)) return;
    setBusyId(r.id);
    try {
      await api(`/subscribers/${r.id}`, { method: "DELETE" });
      setRows((list) => list.filter((x) => x.id !== r.id));
    } catch (e) {
      setError(e.message);
    } finally {
      setBusyId(null);
    }
  }

  function exportCsv() {
    const lines = ["email,status,subscribed_on"].concat(
      shown.map((r) => [csvCell(r.email), r.isActive ? "active" : "unsubscribed", fmt(r.createdAt)].join(","))
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  async function copyEmails() {
    const list = shown.filter((r) => r.isActive).map((r) => r.email).join(", ");
    try {
      await navigator.clipboard.writeText(list);
      setNote("Active emails in this view copied.");
    } catch {
      setNote("Copy failed. Use Export CSV instead.");
    }
    setTimeout(() => setNote(""), 3000);
  }

  return (
    <div>
      <div className="mb-4 flex justify-end"><AnnounceButton /></div>
      <PageHeader
        title="Subscribers"
        subtitle={rows ? `${rows.length} total · ${activeCount} active` : "Loading…"}
      />

      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <input
          type="search"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search email"
          aria-label="Search email"
          className={`${input} sm:max-w-xs`}
        />
        <select value={filter} onChange={(e) => setFilter(e.target.value)} aria-label="Filter" className={`${input} sm:w-44`}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="inactive">Unsubscribed</option>
        </select>
        <div className="flex gap-2 sm:ml-auto">
          <button type="button" onClick={copyEmails} className={btnGhost}>Copy emails</button>
          <button type="button" onClick={exportCsv} className={btn} disabled={!shown.length}>Export CSV</button>
        </div>
      </div>

      {note && <p role="status" className="mb-3 text-sm">{note}</p>}
      {error && <p role="alert" className="mb-3 text-sm text-red-600">{error}</p>}

      {rows && shown.length === 0 && !error && (
        <p className="py-10 text-center text-sm opacity-70">
          {rows.length ? "No subscribers match." : "No subscribers yet."}
        </p>
      )}

      {/* Phone: cards */}
      <ul className="space-y-2 md:hidden">
        {shown.map((r) => (
          <li key={r.id} className="border border-line p-3">
            <p className="break-all font-medium">{r.email}</p>
            <p className="mt-1 text-xs opacity-70">
              {fmt(r.createdAt)} · {r.isActive ? "Active" : "Unsubscribed"}
            </p>
            <div className="mt-3 flex gap-2">
              <button type="button" disabled={busyId === r.id} onClick={() => toggle(r)} className={btnGhost}>
                {r.isActive ? "Unsubscribe" : "Resubscribe"}
              </button>
              <button type="button" disabled={busyId === r.id} onClick={() => remove(r)} className={btnDanger}>
                Delete
              </button>
            </div>
          </li>
        ))}
      </ul>

      {/* Desktop: table */}
      {shown.length > 0 && (
        <table className="hidden w-full text-left text-sm md:table">
          <thead>
            <tr className="border-b border-line text-xs uppercase tracking-wider opacity-70">
              <th className="py-2 pr-4 font-medium">Email</th>
              <th className="py-2 pr-4 font-medium">Subscribed</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {shown.map((r) => (
              <tr key={r.id} className="border-b border-line">
                <td className="py-2 pr-4 break-all">{r.email}</td>
                <td className="py-2 pr-4 whitespace-nowrap">{fmt(r.createdAt)}</td>
                <td className="py-2 pr-4">{r.isActive ? "Active" : "Unsubscribed"}</td>
                <td className="py-2">
                  <div className="flex justify-end gap-2">
                    <button type="button" disabled={busyId === r.id} onClick={() => toggle(r)} className={btnGhost}>
                      {r.isActive ? "Unsubscribe" : "Resubscribe"}
                    </button>
                    <button type="button" disabled={busyId === r.id} onClick={() => remove(r)} className={btnDanger}>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}