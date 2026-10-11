import MonthSwitcher from "./MonthSwitcher.jsx";
import ThemeToggle from "../ThemeToggle.jsx";

export default function PageHeader({ title, subtitle, month = true }) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        <h1 className="display-title text-5xl sm:text-7xl xl:text-8xl">{title}</h1>
        {subtitle && <p className="mt-2 text-xs text-muted">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        {month && <MonthSwitcher />}
        <ThemeToggle />
      </div>
    </header>
  );
}