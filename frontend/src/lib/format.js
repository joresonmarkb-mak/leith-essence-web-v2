const pesoFormat = new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP" });
export const peso = (n) => pesoFormat.format(n ?? 0);

export const shortDate = (iso) =>
  new Date(iso).toLocaleDateString("en-PH", { timeZone: "Asia/Manila", year: "numeric", month: "short", day: "numeric" });
export const orderNo = (id) => `LE-${String(id).padStart(4, "0")}`;