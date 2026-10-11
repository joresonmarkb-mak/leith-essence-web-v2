import { useLocation } from "react-router-dom";
import PageHeader from "./PageHeader.jsx";

export default function ComingSoon() {
  const name = useLocation().pathname.split("/").filter(Boolean).pop() ?? "";
  return (
    <>
      <PageHeader title={name} />
      <p className="mt-8 text-sm text-muted">This page is built in a later step.</p>
    </>
  );
}