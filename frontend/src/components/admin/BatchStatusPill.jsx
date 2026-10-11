import { batchStatus } from "../../lib/format.js";

const LABEL = { active: "Active", sold_out: "Sold out", closed: "Closed" };
const STYLE = {
  active: "bg-success-bg text-success",
  sold_out: "bg-warn-bg text-warn",
  closed: "bg-line text-muted",
};

export default function BatchStatusPill({ status }) {
  const s = batchStatus(status);
  return (
    <span className={`inline-block whitespace-nowrap rounded-full px-3 py-0.5 text-[11px] font-medium ${STYLE[s] ?? "bg-line text-muted"}`}>
      {LABEL[s] ?? status}
    </span>
  );
}