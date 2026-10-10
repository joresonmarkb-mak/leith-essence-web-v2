import { useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext.jsx";
import { useCart } from "../context/CartContext.jsx";
import Logo from "../components/Logo.jsx";
import ThemeToggle from "../components/ThemeToggle.jsx";
import { CartIcon, UserIcon, MenuIcon, CloseIcon } from "../components/Icons.jsx";

const linkClass = "text-xs font-medium uppercase tracking-wide transition hover:opacity-60 md:text-[11px]";
const COLLECTIONS = [
  ["For him", "for_him"],
  ["For her", "for_her"],
  ["Unisex", "unisex"],
];

export default function Navbar() {
  const { user } = useAuth();
  const { count } = useCart();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-surface">
      <div className="mx-auto grid h-14 max-w-[1440px] grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6">
        <div>
            <button
            type="button"
            className="-m-2 p-2 md:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
            aria-expanded={open}
            onClick={() => setOpen((o) => !o)}
            >
            {open ? <CloseIcon /> : <MenuIcon />}
            </button>
          <nav className="hidden items-center gap-6 md:flex" aria-label="Main">
            <Link to="/shop" className={linkClass}>Shop now</Link>
            <div className="group relative">
              <Link to="/shop" className={linkClass}>Collections</Link>
              <div className="invisible absolute left-0 top-full z-10 pt-3 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                <div className="min-w-36 rounded-lg border border-line bg-surface py-2 shadow-sm">
                  {COLLECTIONS.map(([label, value]) => (
                    <Link key={value} to={`/shop?category=${value}`} className="block px-4 py-2 text-[11px] uppercase hover:bg-bg">
                      {label}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
            <Link to="/quiz" className={linkClass}>Take our fragrance quiz</Link>
            <Link to="/about" className={linkClass}>About us</Link>
          </nav>
        </div>

        <Logo />

            <div className="flex items-center justify-end gap-3 sm:gap-4">
                <ThemeToggle />
                <Link to="/cart" aria-label={`Shopping bag, ${count} items`} className="relative -m-2 p-2">
                    <CartIcon />
                    {count > 0 && (
                    <span className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-accent px-1 text-[10px] font-semibold text-accent-fg">
                        {count}
                    </span>
                    )}
                </Link>
                <Link to={user ? "/account" : "/login"} aria-label={user ? "My account" : "Log in"} className="-m-2 p-2">
                    <UserIcon />
                </Link>
        </div>
      </div>

      {open && (
        <nav className="border-t border-line px-4 py-3 md:hidden" aria-label="Mobile">
          <div className="flex flex-col gap-4 py-2">
            <Link to="/shop" onClick={close} className={linkClass}>Shop now</Link>
            {COLLECTIONS.map(([label, value]) => (
              <Link key={value} to={`/shop?category=${value}`} onClick={close} className={`${linkClass} pl-4 text-muted`}>
                {label}
              </Link>
            ))}
            <Link to="/quiz" onClick={close} className={linkClass}>Take our fragrance quiz</Link>
            <Link to="/about" onClick={close} className={linkClass}>About us</Link>
          </div>
        </nav>
      )}
    </header>
  );
}