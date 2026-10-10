import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto flex max-w-[1440px] flex-col items-center justify-between gap-3 px-4 py-6 text-[11px] uppercase tracking-wide text-muted sm:flex-row sm:px-6">
        <span>&copy; {new Date().getFullYear()} Leith Essence</span>
        <nav className="flex gap-6" aria-label="Footer">
          <Link to="/shop" className="hover:text-fg">Shop</Link>
          <Link to="/quiz" className="hover:text-fg">Quiz</Link>
          <Link to="/about" className="hover:text-fg">About us</Link>
        </nav>
      </div>
    </footer>
  );
}