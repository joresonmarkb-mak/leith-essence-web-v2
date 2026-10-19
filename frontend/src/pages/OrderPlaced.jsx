import { Link, Navigate, useLocation } from "react-router-dom";
import Receipt from "../components/Receipt.jsx";

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

      <div className="my-10">
        <Receipt order={order} />
      </div>

      <Link to="/shop" className="inline-block bg-accent px-8 py-3.5 text-[11px] font-semibold uppercase text-accent-fg">
        Continue shopping
      </Link>
    </div>
  );
}