import { Link, Navigate, useLocation } from "react-router-dom";
import { peso } from "../lib/format.js";

export default function OrderPlaced() {
  const order = useLocation().state?.order;
  if (!order) return <Navigate to="/shop" replace />;

  return (
    <div className="mx-auto max-w-xl px-4 py-14 text-center sm:px-6">
      <h1 className="text-2xl font-semibold">Thank you! Order #{order.id} is placed.</h1>
      <p className="mt-3 text-sm text-muted">
        We're checking your GCash payment (ref. {order.paymentReference}). Your order stays <strong className="text-fg">pending</strong> until
        it's confirmed, then we'll ship it to you.
      </p>
      <ul className="mt-8 divide-y divide-line border-y border-line text-left text-sm">
        {order.items.map((i) => (
          <li key={i.id} className="flex justify-between gap-3 py-3">
            <span>{i.name} {i.sizeMl}ml x {i.quantity}</span>
            <span>{peso(i.unitPrice * i.quantity)}</span>
          </li>
        ))}
        <li className="flex justify-between py-3"><span>Shipping</span><span>{peso(order.shippingFee)}</span></li>
        {order.discount > 0 && <li className="flex justify-between py-3"><span>Discount</span><span>-{peso(order.discount)}</span></li>}
        <li className="flex justify-between py-3 text-base font-semibold"><span>Total</span><span>{peso(order.total)}</span></li>
      </ul>
      <Link to="/shop" className="mt-8 inline-block bg-accent px-8 py-3.5 text-[11px] font-semibold uppercase text-accent-fg">
        Continue shopping
      </Link>
    </div>
  );
}