const PAPER = "#ecebe6";
const INK = "#111111";
const MUTED = "#6b6b66";
const SHOP_EMAIL = "leithessence@gmail.com";

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
const money = (n) =>
  "₱" + Number(n).toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const when = (d) =>
  new Date(d).toLocaleString("en-PH", { timeZone: "Asia/Manila", dateStyle: "medium", timeStyle: "short" });

function mergeItems(items) {
  const map = new Map();
  for (const i of items) {
    const k = `${i.perfumeId}:${i.sizeMl}`;
    const cur = map.get(k);
    if (cur) cur.quantity += i.quantity;
    else map.set(k, { ...i });
  }
  return [...map.values()];
}

function copyFor(kind, previousStatus, id) {
  if (kind === "paid")
    return {
      subject: `Payment confirmed – Order #${id} | Leith Essence`,
      stamp: "PAID",
      headline: "Payment confirmed",
      message:
        "Thank you! We've confirmed your GCash payment and we're now preparing your order. We'll ship it to you soon. You can follow it anytime under My orders on our website.",
    };
  if (previousStatus === "pending")
    return {
      subject: `We couldn't confirm your payment – Order #${id}`,
      stamp: "NOT CONFIRMED",
      headline: "Payment not confirmed",
      message: `We couldn't confirm your GCash payment, so this order was cancelled. If you did pay, reply to this email with your GCash reference number and a screenshot of your receipt, and we'll sort it out right away.`,
    };
  return {
    subject: `Your order #${id} was cancelled | Leith Essence`,
    stamp: "CANCELLED",
    headline: "Order cancelled",
    message: "Your order was cancelled. If you have questions or need a refund, reply to this email and we'll help you.",
  };
}

export function orderEmail(order, kind, previousStatus) {
  const c = copyFor(kind, previousStatus, order.id);
  const items = mergeItems(order.items ?? []);
  const dash = `<div style="border-top:1px dashed #8a8a85;margin:14px 0;font-size:0;line-height:0">&nbsp;</div>`;

  const rows = items
    .map(
      (i) => `<tr>
        <td style="padding:3px 0;vertical-align:top;width:40px">${i.quantity} x</td>
        <td style="padding:3px 8px;vertical-align:top;text-transform:uppercase">${esc(i.name)} ${i.sizeMl}ml</td>
        <td style="padding:3px 0;vertical-align:top;text-align:right;white-space:nowrap">${money(i.unitPrice * i.quantity)}</td>
      </tr>`
    )
    .join("");

  const line = (label, value) =>
    `<tr><td style="padding:2px 0">${label}</td><td style="padding:2px 0;text-align:right">${value}</td></tr>`;

  const address = [order.street, order.barangay, order.city, order.province].filter(Boolean).map(esc).join(", ");

  const html = `<!doctype html>
<html><body style="margin:0;padding:24px 12px;background:#1a1a1a">
<div style="max-width:420px;margin:0 auto">
  <div style="background:${PAPER};color:${INK};padding:26px 24px;font-family:'Courier New',Courier,monospace;font-size:13px;line-height:1.45;border-top:3px double #8a8a85;border-bottom:3px double #8a8a85">

    <div style="text-align:center">
      <div style="font-size:24px;font-weight:bold;letter-spacing:3px;text-transform:uppercase">Leith Essence</div>
      <div style="font-size:11px;margin-top:6px">Urdaneta City, Pangasinan, Philippines</div>
      <div style="font-size:11px">${SHOP_EMAIL}</div>
    </div>

    ${dash}
    <div style="text-align:center">
      <div style="display:inline-block;border:2px solid ${INK};padding:4px 12px;font-size:14px;font-weight:bold;letter-spacing:2px">${c.stamp}</div>
      <div style="font-size:15px;font-weight:bold;margin-top:10px;text-transform:uppercase">${c.headline}</div>
    </div>

    ${dash}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px">
      <tr><td>ORDER</td><td style="text-align:right;font-size:17px;font-weight:bold">#${order.id}</td></tr>
      <tr><td colspan="2" style="text-align:right;font-size:11px">${when(order.createdAt)}</td></tr>
    </table>

    ${dash}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px">
      <tr style="font-size:11px;font-weight:bold">
        <td style="padding-bottom:4px">QTY</td><td style="padding:0 8px 4px">ITEM</td><td style="padding-bottom:4px;text-align:right">AMOUNT</td>
      </tr>
      ${rows}
    </table>

    ${dash}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:13px">
      ${line("Subtotal", money(order.subtotal))}
      ${line("Shipping", money(order.shippingFee))}
      ${order.discount > 0 ? line(`Voucher ${esc(order.voucherCode ?? "")}`, "-" + money(order.discount)) : ""}
    </table>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:10px;border-top:1px solid ${INK};border-bottom:1px solid ${INK}">
      <tr>
        <td style="padding:8px 0;font-size:18px;font-weight:bold">TOTAL</td>
        <td style="padding:8px 0;text-align:right;font-size:20px;font-weight:bold">${money(order.total)}</td>
      </tr>
    </table>

    ${dash}
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="font-size:11px">
      ${line("PAID WITH", "GCASH")}
      ${order.paymentReference ? line("REF", esc(order.paymentReference)) : ""}
    </table>

    ${address ? `${dash}<div style="font-size:11px"><div style="font-weight:bold">DELIVER TO</div><div>${esc(order.buyerName)}</div><div>${address}</div></div>` : ""}

    ${dash}
    <div style="font-size:12px">${esc(c.message)}</div>

    ${dash}
    <div style="text-align:center;font-size:11px;color:${MUTED}">Thank you for shopping with us.</div>
    <div style="text-align:center;font-size:17px;font-weight:bold;letter-spacing:3px;margin-top:8px">LEITH*</div>
  </div>
  <div style="text-align:center;font-family:Arial,sans-serif;font-size:11px;color:#888;margin-top:14px">
    Questions? Reply to this email or write to ${SHOP_EMAIL}
  </div>
</div>
</body></html>`;

  const text = [
    `LEITH ESSENCE – ${c.headline.toUpperCase()}`,
    `Order #${order.id} · ${when(order.createdAt)}`,
    "",
    ...items.map((i) => `${i.quantity} x ${i.name} ${i.sizeMl}ml   ${money(i.unitPrice * i.quantity)}`),
    "",
    `Subtotal: ${money(order.subtotal)}`,
    `Shipping: ${money(order.shippingFee)}`,
    ...(order.discount > 0 ? [`Voucher: -${money(order.discount)}`] : []),
    `TOTAL: ${money(order.total)}`,
    order.paymentReference ? `GCash ref: ${order.paymentReference}` : "",
    "",
    c.message,
  ].join("\n");

  return { subject: c.subject, html, text };
}