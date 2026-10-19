import { peso } from "../lib/format.js";

const when = (d) =>
  new Date(d).toLocaleString("en-PH", { timeZone: "Asia/Manila", dateStyle: "medium", timeStyle: "short" });

const STATUS = { pending: "Pending", paid: "Paid", fulfilled: "Shipped", cancelled: "Cancelled" };

// same perfume + size can be split across batches; show it as one line
function mergeItems(items) {
  const map = new Map();
  for (const i of items) {
    const k = `${i.perfumeId ?? i.name}:${i.sizeMl}`;
    const cur = map.get(k);
    if (cur) cur.quantity += i.quantity;
    else map.set(k, { ...i });
  }
  return [...map.values()];
}

function Zigzag({ id, flip }) {
  return (
    <svg aria-hidden="true" height="8" width="100%" className={`block text-[#ecebe6] ${flip ? "rotate-180" : ""}`}>
      <defs>
        <pattern id={id} width="16" height="8" patternUnits="userSpaceOnUse">
          <path d="M0 8 L8 0 L16 8 Z" fill="currentColor" />
        </pattern>
      </defs>
      <rect width="100%" height="8" fill={`url(#${id})`} />
    </svg>
  );
}

const Dash = () => <div className="my-3 border-t border-dashed border-[#111]/40" />;

export default function Receipt({ order: o }) {
  const items = mergeItems(o.items ?? []);
  return (
    <div className="mx-auto w-full max-w-[380px] [filter:drop-shadow(0_2px_14px_rgba(0,0,0,0.25))]">
      <Zigzag id="rcp-top" />
      <div className="bg-[#ecebe6] px-5 pb-5 pt-4 font-mono text-xs leading-snug text-[#111] sm:px-7 sm:text-[13px]">
        <header className="text-center">
          <p className="text-2xl font-extrabold uppercase tracking-[0.14em]">Leith Essence</p>
          <p className="mt-2 text-[11px]">Urdaneta City, Pangasinan, Philippines</p>
          <p className="text-[11px]">leithessence@gmail.com</p>
        </header>

        <Dash />
        <div className="flex items-baseline justify-between gap-3">
          <span className="uppercase">Order</span>
          <span className="text-lg font-bold">#{o.id}</span>
        </div>
        <p className="mt-0.5 text-right text-[11px]">{when(o.createdAt)}</p>

        <Dash />
        <div className="grid grid-cols-[2.5rem_minmax(0,1fr)_auto] gap-x-2 text-[11px] font-bold uppercase">
          <span>Qty</span><span>Item</span><span className="text-right">Amount</span>
        </div>
        <div className="mt-1.5 grid grid-cols-[2.5rem_minmax(0,1fr)_auto] gap-x-2 gap-y-1">
          {items.map((i) => (
            <div key={`${i.perfumeId ?? i.name}:${i.sizeMl}`} className="contents">
              <span>{i.quantity} x</span>
              <span className="break-words uppercase">{i.name} {i.sizeMl}ml</span>
              <span className="text-right tabular-nums">{peso(i.unitPrice * i.quantity)}</span>
            </div>
          ))}
        </div>

        <Dash />
        <div className="space-y-1 tabular-nums">
          <div className="flex justify-between gap-3"><span>Subtotal</span><span>{peso(o.subtotal)}</span></div>
          <div className="flex justify-between gap-3"><span>Shipping</span><span>{peso(o.shippingFee)}</span></div>
          {o.discount > 0 && (
            <div className="flex justify-between gap-3">
              <span>Voucher {o.voucherCode ?? ""}</span><span>-{peso(o.discount)}</span>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-baseline justify-between gap-3 border-y border-[#111] py-2">
          <span className="text-lg font-extrabold uppercase">Total</span>
          <span className="text-xl font-extrabold tabular-nums">{peso(o.total)}</span>
        </div>

        <Dash />
        <div className="space-y-1 text-[11px] uppercase">
          <div className="flex justify-between gap-3"><span>Paid with</span><span>GCash</span></div>
          {o.paymentReference && (
            <div className="flex justify-between gap-3">
              <span>Ref</span><span className="break-all text-right">{o.paymentReference}</span>
            </div>
          )}
          <div className="flex justify-between gap-3">
            <span>Status</span><span className="font-bold">{STATUS[o.status] ?? o.status}</span>
          </div>
        </div>

        <Dash />
        <footer className="text-center text-[11px]">
          <p>Thank you for shopping with us.</p>
          <p className="mt-2 text-base font-extrabold tracking-widest">LEITH*</p>
        </footer>
      </div>
      <Zigzag id="rcp-bottom" flip />
    </div>
  );
}