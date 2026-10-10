import { Link } from "react-router-dom";

export default function Logo({ className = "" }) {
  return (
    <Link
      to="/"
      aria-label="Leith Essence, home"
      className={`inline-block text-center text-[11px] font-medium uppercase leading-[1.15] tracking-[0.35em] text-fg sm:text-xs ${className}`}
    >
      <span className="block pl-[0.35em]">Leith</span>
      <span className="block pl-[0.35em]">Essence</span>
    </Link>
  );
}