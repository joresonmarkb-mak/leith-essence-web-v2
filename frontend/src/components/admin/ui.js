export const input =
  "h-11 w-full rounded-lg border border-line bg-bg px-3 text-base outline-none focus:border-fg sm:text-sm";
export const labelCls = "flex flex-col gap-1.5 text-xs text-muted";
export const btn =
  "inline-flex min-h-[44px] items-center justify-center rounded-full bg-accent px-5 text-[11px] font-medium uppercase tracking-wider text-accent-fg transition hover:opacity-85 disabled:opacity-40";
export const btnGhost =
  "inline-flex min-h-[44px] items-center justify-center rounded-full border border-line px-5 text-[11px] font-medium uppercase tracking-wider transition hover:border-fg disabled:opacity-40";
export const btnDanger =
  "inline-flex min-h-[44px] items-center justify-center rounded-full border border-danger px-5 text-[11px] font-medium uppercase tracking-wider text-danger transition hover:bg-danger-bg disabled:opacity-40";
export const btnLink =
  "min-h-[44px] px-2 text-[11px] font-medium uppercase tracking-wider text-muted underline-offset-4 hover:text-fg hover:underline disabled:opacity-40";

export const manilaDate = (iso) => new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
export const todayManila = () => manilaDate(new Date());
export const asList = (d, key) => (Array.isArray(d) ? d : d?.[key] ?? []);