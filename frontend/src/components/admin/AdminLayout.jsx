import { useState } from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import Logo from "../Logo.jsx";
import { MenuIcon, CloseIcon } from "../Icons.jsx";

const NAV = [
  ["Dashboard", "/admin"],
  ["Batches", "/admin/batches"],
  ["Perfumes", "/admin/perfumes"],
  ["Ledger", "/admin/ledger"],
  ["Cashflow", "/admin/cashflow"],
  ["Orders", "/admin/orders"],
  ["Users", "/admin/users"],
  ["Vouchers", "/admin/vouchers"],
];

function SideNav({ onNavigate }) {
  const { search } = useLocation();
  const { logout } = useAuth();
  const navigate = useNavigate();
  const link = ({ isActive }) =>
    `block rounded-full px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider transition ${
      isActive ? "bg-accent text-accent-fg" : "text-muted hover:text-fg"
    }`;
  return (
    <nav aria-label="Admin" className="flex flex-col gap-1">
      {NAV.map(([label, to]) => (
        <NavLink key={to} to={{ pathname: to, search }} end={to === "/admin"} onClick={onNavigate} className={link}>
          {label}
        </NavLink>
      ))}
      <div className="mt-4 border-t border-line pt-4">
        <Link to="/" onClick={onNavigate} className="block px-4 py-2.5 text-[11px] font-medium uppercase tracking-wider text-muted hover:text-fg">View shop</Link>
        <button
          type="button"
          onClick={() => { logout(); navigate("/"); }}
          className="block w-full px-4 py-2.5 text-left text-[11px] font-medium uppercase tracking-wider text-muted hover:text-fg"
        >
          Sign out
        </button>
      </div>
    </nav>
  );
}

export default function AdminLayout() {
  const [open, setOpen] = useState(false);
  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[230px_minmax(0,1fr)]">
      <aside className="hidden border-r border-line bg-surface p-5 lg:block">
        <div className="sticky top-6">
          <div className="mb-8 px-4"><Logo /></div>
          <SideNav />
        </div>
      </aside>

      <div className="lg:hidden">
        <div className="flex h-14 items-center justify-between border-b border-line bg-surface px-4">
          <button type="button" aria-label={open ? "Close menu" : "Open menu"} aria-expanded={open} onClick={() => setOpen((o) => !o)} className="-m-2 p-2">
            {open ? <CloseIcon /> : <MenuIcon />}
          </button>
          <Logo />
          <span className="w-[18px]" />
        </div>
        {open && (
          <div className="border-b border-line bg-surface p-4">
            <SideNav onNavigate={() => setOpen(false)} />
          </div>
        )}
      </div>

      <main className="min-w-0 px-4 pb-16 pt-6 sm:px-8 lg:pt-10">
        <Outlet />
      </main>
    </div>
  );
}