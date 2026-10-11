import { useSearchParams } from "react-router-dom";
import { currentMonth, monthLabel, shiftMonth } from "../../lib/month.js";

const VALID = /^\d{4}-(0[1-9]|1[0-2])$/;

export function useMonth() {
  const [params] = useSearchParams();
  const m = params.get("month") ?? "";
  return VALID.test(m) ? m : currentMonth();
}

export default function MonthSwitcher() {
  const [params, setParams] = useSearchParams();
  const month = useMonth();
  const now = currentMonth();

  const go = (delta) => {
    const next = new URLSearchParams(params);
    next.set("month", shiftMonth(month, delta));
    setParams(next, { replace: true });
  };

  const arrow = "grid h-10 w-10 place-items-center rounded-full text-base transition hover:bg-fg/5 disabled:opacity-30 disabled:hover:bg-transparent";
  return (
    <div className="inline-flex items-center rounded-full border border-line bg-surface text-xs text-muted">
      <button type="button" aria-label="Previous month" onClick={() => go(-1)} className={arrow}>&lsaquo;</button>
      <span className="px-1 text-center" aria-live="polite">Month of {monthLabel(month)}</span>
      <button type="button" aria-label="Next month" disabled={month >= now} onClick={() => go(1)} className={arrow}>&rsaquo;</button>
    </div>
  );
}