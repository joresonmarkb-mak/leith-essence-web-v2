const base = {
  viewBox: "0 0 24 24", width: 18, height: 18, fill: "none",
  stroke: "currentColor", strokeWidth: 1.8, strokeLinecap: "round", strokeLinejoin: "round",
};

export const CartIcon = () => (
  <svg {...base}><path d="M3 4h2l2.4 11h10.2l2-8H6.2" /><circle cx="9" cy="19.5" r="1.3" /><circle cx="17" cy="19.5" r="1.3" /></svg>
);
export const UserIcon = () => (
  <svg {...base}><circle cx="12" cy="8" r="4" /><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" /></svg>
);
export const ArrowCircle = () => (
  <svg {...base} width={16} height={16}><circle cx="12" cy="12" r="9" /><path d="M8 12h8M13 8l4 4-4 4" /></svg>
);
export const MenuIcon = () => (
  <svg {...base}><path d="M4 7h16M4 12h16M4 17h16" /></svg>
);
export const CloseIcon = () => (
  <svg {...base}><path d="M6 6l12 12M18 6L6 18" /></svg>
);