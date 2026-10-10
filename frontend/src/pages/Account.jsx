import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { api } from "../lib/api.js";
import { peso, shortDate, orderNo } from "../lib/format.js";
import { useAuth } from "../context/AuthContext.jsx";

const panel = "rounded-2xl border border-line bg-surface p-5 sm:p-7";
const btn = "min-h-11 rounded-full border border-fg px-5 text-[11px] font-medium uppercase tracking-wider transition hover:bg-fg/5";
const btnPrimary = "min-h-11 rounded-full bg-accent px-5 text-[11px] font-medium uppercase tracking-wider text-accent-fg transition hover:opacity-85 disabled:opacity-60";
const CATEGORY_LABEL = { for_him: "For him", for_her: "For her", unisex: "Unisex" };

export default function Account() {
  const { logout } = useAuth();
  const navigate = useNavigate();
  const tab = useLocation().hash === "#orders" ? "orders" : "profile";
  const tabClass = (on) =>
    `block rounded-full px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider transition ${
      on ? "bg-accent text-accent-fg" : "text-muted hover:text-fg"
    }`;

  return (
    <div className="mx-auto max-w-[1120px] px-4 pb-16 pt-8 sm:px-6 md:grid md:grid-cols-[200px_minmax(0,1fr)] md:gap-10 md:pt-10">
      <nav aria-label="Account" className="mb-6 flex flex-wrap gap-1.5 md:mb-0 md:flex-col md:self-start">
        <Link to={{ hash: "#profile" }} aria-current={tab === "profile" ? "page" : undefined} className={tabClass(tab === "profile")}>Profile</Link>
        <Link to={{ hash: "#orders" }} aria-current={tab === "orders" ? "page" : undefined} className={tabClass(tab === "orders")}>My orders</Link>
        <button type="button" onClick={() => { logout(); navigate("/"); }} className={`${tabClass(false)} text-left md:mt-3`}>
          Sign out
        </button>
      </nav>
      <main className="min-w-0">{tab === "profile" ? <Profile /> : <Orders />}</main>
    </div>
  );
}

/* ---------------- Profile ---------------- */

function Field({ id, label, value, onChange, editing, readOnly, hint, ...rest }) {
  const locked = !editing || readOnly;
  return (
    <div className="flex min-w-0 flex-col gap-0.5">
      <label htmlFor={id} className="text-[11px] text-muted">{label}</label>
      <input
        id={id} value={value} onChange={onChange} readOnly={locked} tabIndex={readOnly ? -1 : undefined}
        className={`w-full min-w-0 py-2 text-base outline-none sm:text-[15px] ${
          locked ? "border-b border-transparent bg-transparent" : "border-b border-fg bg-bg px-2"
        }`}
        {...rest}
      />
      {hint && <span className="text-[11px] text-muted">{hint}</span>}
    </div>
  );
}

const Msg = ({ msg }) => (
  <p role="status" aria-live="polite" className={`mt-3 min-h-5 text-xs ${msg.type === "error" ? "text-danger" : msg.type === "ok" ? "text-success" : "text-muted"}`}>
    {msg.text}
  </p>
);

function Profile() {
  const { user, refreshUser } = useAuth();
  const initial = (u) => ({
    firstName: u.firstName ?? "", lastName: u.lastName ?? "", phone: u.phone ?? "",
    province: u.province ?? "", city: u.city ?? "", barangay: u.barangay ?? "", street: u.street ?? "",
  });
  const [form, setForm] = useState(() => initial(user));
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState({ type: "", text: "" });
  const set = (key) => (e) => setForm((f) => ({ ...f, [key]: e.target.value }));

  async function save(e) {
    e.preventDefault();
    setBusy(true);
    setMsg({ type: "", text: "" });
    try {
      await api("/auth/me", { method: "PATCH", body: form });
      await refreshUser();
      setEditing(false);
      setMsg({ type: "ok", text: "Changes saved." });
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  }
  function cancel() {
    setForm(initial(user));
    setEditing(false);
    setMsg({ type: "", text: "" });
  }

  const fieldProps = (key) => ({ id: key, value: form[key], onChange: set(key), editing });
  const initials = `${user.firstName?.[0] ?? ""}${user.lastName?.[0] ?? ""}`.toUpperCase();

  return (
    <section>
      <h1 className="display-title text-5xl sm:text-7xl lg:text-8xl">Profile</h1>
      <p className="mt-3 max-w-[46ch] text-xs text-muted">
        Your details and the address we ship to. Orders you place on the site are saved under this account.
      </p>

      <div className="mt-8 flex flex-col gap-5">
        <form onSubmit={save} className={panel} noValidate>
          <div className="flex flex-wrap items-center gap-4">
            <div aria-hidden="true" className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-accent text-lg font-bold text-accent-fg">{initials}</div>
            <div className="min-w-0 flex-1">
              <b className="block break-words text-xl">{user.firstName} {user.lastName}</b>
              <span className="break-words text-sm text-muted">{user.email}</span>
            </div>
            {!editing && <button type="button" onClick={() => { setMsg({ type: "", text: "" }); setEditing(true); }} className={btn}>Edit profile</button>}
          </div>

          <fieldset className="mt-7 min-w-0">
            <legend className="mb-3 text-[11px] uppercase tracking-widest text-muted">Personal information</legend>
            <div className="grid gap-x-7 gap-y-4 sm:grid-cols-2">
              <Field label="First name" autoComplete="given-name" {...fieldProps("firstName")} />
              <Field label="Last name" autoComplete="family-name" {...fieldProps("lastName")} />
              <Field id="email" label="Email" value={user.email} readOnly editing={editing} hint="Used to sign in. Contact us to change it." />
              <Field label="Phone number" autoComplete="tel" inputMode="tel" {...fieldProps("phone")} />
            </div>
          </fieldset>

          <fieldset className="mt-7 min-w-0">
            <legend className="mb-3 text-[11px] uppercase tracking-widest text-muted">Shipping address</legend>
            <div className="grid gap-x-7 gap-y-4 sm:grid-cols-2">
              <Field label="Province" {...fieldProps("province")} />
              <Field label="City / Municipality" {...fieldProps("city")} />
              <Field label="Barangay" {...fieldProps("barangay")} />
              <Field label="Street" {...fieldProps("street")} />
            </div>
          </fieldset>

          {editing && (
            <div className="mt-7 flex flex-wrap gap-3">
              <button disabled={busy} className={btnPrimary}>{busy ? "Saving..." : "Save changes"}</button>
              <button type="button" onClick={cancel} className={btn}>Cancel</button>
            </div>
          )}
          <Msg msg={msg} />
        </form>

        <PasswordForm />
      </div>
    </section>
  );
}

function PasswordForm() {
  const [f, setF] = useState({ current: "", next: "", confirm: "" });
  const [msg, setMsg] = useState({ type: "", text: "" });
  const [busy, setBusy] = useState(false);
  const set = (key) => (e) => setF((x) => ({ ...x, [key]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    if (f.next.length < 8) return setMsg({ type: "error", text: "Your new password needs at least 8 characters." });
    if (f.next !== f.confirm) return setMsg({ type: "error", text: "The new passwords don't match." });
    setBusy(true);
    setMsg({ type: "", text: "" });
    try {
      await api("/auth/change-password", { method: "POST", body: { currentPassword: f.current, newPassword: f.next } });
      setF({ current: "", next: "", confirm: "" });
      setMsg({ type: "ok", text: "Password updated." });
    } catch (err) {
      setMsg({ type: "error", text: err.message });
    } finally {
      setBusy(false);
    }
  }

  const input = "w-full border-b border-fg bg-bg px-2 py-2 text-base outline-none sm:text-[15px]";
  return (
    <form onSubmit={submit} className={panel} noValidate>
      <details>
        <summary className="flex min-h-8 cursor-pointer list-none items-center justify-between text-[11px] font-medium uppercase tracking-wider">
          Change password <span aria-hidden="true" className="text-lg font-normal">+</span>
        </summary>
        <div className="mt-5 grid gap-x-7 gap-y-4 sm:grid-cols-2">
          <label className="text-[11px] text-muted sm:col-span-2 sm:max-w-[calc(50%-14px)]">Current password
            <input type="password" autoComplete="current-password" value={f.current} onChange={set("current")} className={input} />
          </label>
          <label className="text-[11px] text-muted">New password
            <input type="password" autoComplete="new-password" value={f.next} onChange={set("next")} className={input} />
            <span className="mt-0.5 block">At least 8 characters.</span>
          </label>
          <label className="text-[11px] text-muted">Confirm new password
            <input type="password" autoComplete="new-password" value={f.confirm} onChange={set("confirm")} className={input} />
          </label>
        </div>
        <button disabled={busy} className={`${btnPrimary} mt-6`}>{busy ? "Updating..." : "Update password"}</button>
        <Msg msg={msg} />
      </details>
    </form>
  );
}

/* ---------------- My orders ---------------- */

const LABEL = { pending: "Pending", paid: "Paid", fulfilled: "Fulfilled", cancelled: "Cancelled" };
const PILL = {
  pending: "bg-warn-bg text-warn",
  paid: "bg-success-bg text-success",
  fulfilled: "bg-accent text-accent-fg",
  cancelled: "bg-danger-bg text-danger",
};

import { useEffect } from "react";

function Orders() {
  const [orders, setOrders] = useState(null);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [toggled, setToggled] = useState({});

  useEffect(() => {
    let ignore = false;
    api("/orders/mine")
      .then((o) => { if (!ignore) setOrders(o); })
      .catch((e) => { if (!ignore) setError(e.message); });
    return () => { ignore = true; };
  }, []);

  const defaultOpen = orders?.find((o) => o.status === "pending")?.id;
  const shown = orders?.filter((o) => filter === "all" || o.status === filter) ?? [];
  const count = (k) => (k === "all" ? orders?.length : orders?.filter((o) => o.status === k).length) ?? 0;

  return (
    <section>
      <h1 className="display-title text-5xl sm:text-7xl lg:text-8xl">My orders</h1>
      <p className="mt-3 max-w-[46ch] text-xs text-muted">
        Follow your payment and delivery. Open an order to see its items, receipt, and tracking number.
      </p>

      <div role="group" aria-label="Filter orders" className="mt-7 flex flex-wrap gap-2">
        {["all", "pending", "paid", "fulfilled", "cancelled"].map((k) => (
          <button
            key={k} type="button" aria-pressed={filter === k} onClick={() => setFilter(k)}
            className={`min-h-9 rounded-full border px-3.5 text-[11px] font-medium uppercase tracking-wide ${
              filter === k ? "border-fg text-fg" : "border-line text-muted"
            }`}
          >
            {k === "all" ? "All" : LABEL[k]}<em className="ml-1.5 not-italic text-muted">{count(k)}</em>
          </button>
        ))}
      </div>

      {error && <p role="alert" className="mt-6 text-sm text-danger">{error}</p>}
      {!error && !orders && <p className="mt-6 text-sm text-muted">Loading your orders...</p>}
      {orders && shown.length === 0 && (
        <div className={`${panel} mt-5 py-10 text-center text-muted`}>
          <b className="mb-1 block text-base text-fg">{orders.length ? "No orders here yet" : "You haven't ordered yet"}</b>
          {orders.length ? "Orders with this status will show up in this list." : <Link to="/shop" className="underline">Browse the perfumes</Link>}
        </div>
      )}

      <div className="mt-5 flex flex-col gap-3.5">
        {shown.map((o) => {
          const isOpen = toggled[o.id] ?? o.id === defaultOpen;
          return <OrderCard key={o.id} order={o} open={isOpen} onToggle={() => setToggled((t) => ({ ...t, [o.id]: !isOpen }))} />;
        })}
      </div>
    </section>
  );
}

function OrderCard({ order: o, open, onToggle }) {
  const names = o.items.map((i) => `${i.name} ${i.sizeMl}ml${i.quantity > 1 ? ` x${i.quantity}` : ""}`).join(", ");
  return (
    <article className="overflow-hidden rounded-2xl border border-line bg-surface">
      <button
        type="button" aria-expanded={open} aria-controls={`order-${o.id}`} onClick={onToggle}
        className="grid w-full grid-cols-1 gap-1.5 p-4 text-left sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-x-5 sm:px-6 sm:py-4"
      >
        <span className="font-mono text-xs tracking-wide">{orderNo(o.id)}<small className="ml-2.5 text-muted">{shortDate(o.createdAt)}</small></span>
        <span className="flex items-center justify-between gap-3 sm:row-span-2 sm:col-start-2 sm:row-start-1 sm:justify-end sm:gap-3.5">
          <span className="text-[17px] font-bold tabular-nums">{peso(o.total)}</span>
          <span className={`rounded-full px-3 py-0.5 text-[11px] font-medium ${PILL[o.status]}`}>{LABEL[o.status]}</span>
          <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" className={`text-muted transition-transform ${open ? "rotate-180" : ""}`}><path d="M6 9l6 6 6-6" /></svg>
        </span>
        <span className="break-words text-[13px] text-muted sm:col-start-1">{names}</span>
      </button>

      {open && (
        <div id={`order-${o.id}`} className="flex flex-col gap-6 border-t border-line p-4 sm:px-6 sm:pb-6 sm:pt-5">
          <Stepper order={o} />
          <ul>
            {o.items.map((i) => (
              <li key={i.id} className="flex items-center gap-4 border-b border-line py-3 first:pt-0">
                <div className="grid h-16 w-16 shrink-0 place-items-center rounded-xl border border-line bg-bg sm:h-[72px] sm:w-[72px]">
                  {i.imageUrl && <img src={i.imageUrl} alt="" className="max-h-[85%] max-w-[85%] object-contain" />}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[15px] font-bold uppercase">{i.name}</p>
                  {i.inspiredBy && <p className="font-serif text-[15px] italic text-muted">{i.inspiredBy}</p>}
                  <p className="text-xs text-muted">{CATEGORY_LABEL[i.category]} &middot; {i.sizeMl}ml &middot; Qty {i.quantity}</p>
                </div>
                <p className="shrink-0 text-sm tabular-nums">{peso(i.unitPrice * i.quantity)}</p>
              </li>
            ))}
          </ul>

          <div className="grid gap-5 md:grid-cols-3 md:gap-6">
            <Block title="Delivery">
              <p>{o.buyerName}</p>
              <p>{[o.street, o.barangay].filter(Boolean).join(", ")}</p>
              <p>{[o.city, o.province].filter(Boolean).join(", ")}</p>
              {o.trackingNumber && <p className="mt-2 font-mono text-xs">Tracking {o.trackingNumber}</p>}
            </Block>
            <Block title="Payment">
              <p>GCash</p>
              {o.paymentReference && <p className="font-mono text-xs">Ref {o.paymentReference}</p>}
              {o.receiptUrl && (
                <a href={o.receiptUrl} target="_blank" rel="noreferrer" className="mt-2 block w-24">
                  <img src={o.receiptUrl} alt="Your proof of payment" loading="lazy" className="h-16 w-24 rounded-lg border border-dashed border-muted object-cover" />
                </a>
              )}
            </Block>
            <Block title="Summary">
              <Sum label="Subtotal" value={peso(o.subtotal)} />
              <Sum label="Shipping" value={peso(o.shippingFee)} />
              {o.discount > 0 && <Sum label={`Voucher ${o.voucherCode ?? ""}`} value={`-${peso(o.discount)}`} />}
              <Sum label="Total" value={peso(o.total)} strong />
            </Block>
          </div>
        </div>
      )}
    </article>
  );
}

const Block = ({ title, children }) => (
  <div className="min-w-0 break-words text-[13px]">
    <h4 className="mb-2 font-mono text-[11px] font-normal uppercase tracking-widest text-muted">{title}</h4>
    {children}
  </div>
);
const Sum = ({ label, value, strong }) => (
  <div className={`flex justify-between gap-3 py-0.5 tabular-nums ${strong ? "mt-1.5 border-t border-line pt-2 text-[15px] font-bold" : ""}`}>
    <span>{label}</span><span>{value}</span>
  </div>
);

function Stepper({ order: o }) {
  if (o.status === "cancelled") {
    return (
      <p className="rounded-xl bg-danger-bg p-3 text-sm text-danger">
        This order was cancelled. If you already paid, message us with your GCash reference number and we'll sort it out.
      </p>
    );
  }
  const s = o.status;
  const steps = [
    { title: "Order placed", sub: shortDate(o.createdAt), state: "done" },
    { title: "Payment confirmed", sub: s === "pending" ? "Checking your receipt" : shortDate(o.paidAt), state: s === "pending" ? "current" : "done" },
    { title: "Fulfilled", sub: s === "fulfilled" ? shortDate(o.fulfilledAt) : s === "paid" ? "Preparing your order" : "Not yet", state: s === "fulfilled" ? "done" : s === "paid" ? "current" : "todo" },
  ];
  return (
    <>
      <ol className="grid grid-cols-3 gap-2">
        {steps.map((st, i) => (
          <li key={st.title} className="relative min-w-0 pt-7">
            <span className={`absolute left-0 top-1.5 z-10 h-3.5 w-3.5 rounded-full border-[1.5px] ${st.state === "todo" ? "border-muted bg-surface" : "border-fg bg-fg"} ${st.state === "current" ? "ring-2 ring-fg/25" : ""}`} />
            {i < steps.length - 1 && <span className={`absolute -right-2 left-3.5 top-[13px] h-[1.5px] ${st.state === "done" ? "bg-fg" : "bg-line"}`} />}
            <b className={`block text-xs ${st.state === "todo" ? "text-muted" : ""}`}>{st.title}</b>
            <span className="block break-words text-xs text-muted">{st.sub}</span>
          </li>
        ))}
      </ol>
      {s === "pending" && (
        <p className="rounded-xl bg-warn-bg p-3 text-[13px] text-warn">
          We're checking your GCash receipt. This page updates once the payment is confirmed.
        </p>
      )}
    </>
  );
}