const pesoFormat = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });
export const peso = (n) => pesoFormat.format(n ?? 0);

export const shortDate = (iso) =>
  new Date(iso).toLocaleDateString("en-PH", { timeZone: "Asia/Manila", year: "numeric", month: "short", day: "numeric" });
export const orderNo = (id) => `LE-${String(id).padStart(4, "0")}`;
export const pesoWhole = (n) =>
  new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 0 }).format(n ?? 0);

export const pesoShort = (n) => (Math.abs(n) >= 1000 ? `₱${Math.round(n / 100) / 10}k` : `₱${n}`);

export const shortDay = (yyyyMmDd) =>
  new Date(`${yyyyMmDd}T00:00:00+08:00`).toLocaleDateString("en-PH", { timeZone: "Asia/Manila", month: "short", day: "numeric" });

export const categoryLabel = (c) =>
  ({ for_him: "For Him", for_her: "For Her", unisex: "Unisex" }[c] ?? String(c ?? "").replace(/_/g, " "));

export const batchStatus = (s) => String(s ?? "").toLowerCase().replace(/[\s-]+/g, "_");
