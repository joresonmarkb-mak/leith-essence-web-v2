const LABEL = { pending: "Pending", paid: "Paid", fulfilled: "Fulfilled", cancelled: "Cancelled" };
const STYLE = {
  pending: "bg-warn-bg text-warn",
  paid: "bg-success-bg text-success",
  fulfilled: "bg-accent text-accent-fg",
  cancelled: "bg-danger-bg text-danger",
};

export default function StatusPill({ status }) {
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-3 py-0.5 text-[11px] font-medium ${STYLE[status]}`}>
      {LABEL[status] ?? status}
    </span>
  );
}