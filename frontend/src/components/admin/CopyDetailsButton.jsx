import { useState } from "react";
import { btnGhost } from "./ui.js";

// Name, then the address as Street, Barangay, City, Province, then the phone number
const detailsText = (o) => {
  const address = [o.street, o.barangay, o.city, o.province]
    .map((s) => s?.trim())
    .filter(Boolean)
    .join(", ");
  return [o.buyerName, address, o.buyerPhone].filter(Boolean).join("\n");
};

async function copy(text) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      // fallback for browsers that block the clipboard API
      const ta = document.createElement("textarea");
      ta.value = text;
      ta.style.position = "fixed";
      ta.style.opacity = "0";
      document.body.appendChild(ta);
      ta.select();
      const ok = document.execCommand("copy");
      ta.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

export default function CopyDetailsButton({ order }) {
  const [state, setState] = useState("idle"); // idle | copied | failed

  async function onClick() {
    const ok = await copy(detailsText(order));
    setState(ok ? "copied" : "failed");
    setTimeout(() => setState("idle"), 2000);
  }

  return (
    <>
      <button type="button" onClick={onClick} className={btnGhost}>
        {state === "copied" ? "Copied ✓" : state === "failed" ? "Copy failed" : "Copy client details"}
      </button>
      <span role="status" aria-live="polite" className="sr-only">
        {state === "copied" ? "Client details copied" : ""}
      </span>
    </>
  );
}