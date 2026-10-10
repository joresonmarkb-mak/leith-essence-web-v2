export default function QtyStepper({ value, onChange, min = 1, max = 99, disabled = false }) {
  const btn = "h-11 w-11 text-lg transition hover:bg-fg/5 disabled:opacity-30 disabled:hover:bg-transparent";
  return (
    <div className="inline-flex items-center border border-line">
      <button type="button" aria-label="Decrease quantity" disabled={disabled || value <= min} onClick={() => onChange(value - 1)} className={btn}>-</button>
      <span className="w-8 text-center text-sm" aria-live="polite">{value}</span>
      <button type="button" aria-label="Increase quantity" disabled={disabled || value >= max} onClick={() => onChange(value + 1)} className={btn}>+</button>
    </div>
  );
}