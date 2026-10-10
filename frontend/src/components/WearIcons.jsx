const base = {
  viewBox: "0 0 24 24", width: 28, height: 28, fill: "none",
  stroke: "currentColor", strokeWidth: 1.6, strokeLinecap: "round", strokeLinejoin: "round",
};

export const CoolIcon = () => (
  <svg {...base}><path d="M12 2v20M4.2 7l15.6 10M4.2 17L19.8 7M9 3.5l3 2.5 3-2.5M9 20.5l3-2.5 3 2.5" /></svg>
);
export const SummerIcon = () => (
  <svg {...base}><path d="M3 12a9 9 0 0118 0z" /><path d="M12 12v8M9 20h6" /></svg>
);
export const DayIcon = () => (
  <svg {...base}><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
);
export const NightIcon = () => (
  <svg {...base}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /><path d="M17 4v3M15.5 5.5h3" /></svg>
);