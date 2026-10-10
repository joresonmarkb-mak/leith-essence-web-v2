import { useState } from "react";
import ThemeToggle from "./ThemeToggle.jsx";

export default function AuthShell({ title, children }) {
  const [hideLogo, setHideLogo] = useState(false);
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="fixed right-4 top-4"><ThemeToggle /></div>
      <div className="w-full max-w-[420px] rounded-3xl bg-surface p-8 sm:p-10">
        {!hideLogo && (
          <img src="/monogram.png" alt="Leith Essence" onError={() => setHideLogo(true)} className="mx-auto h-14 object-contain" />
        )}
        <h1 className="mt-3 text-center text-sm font-semibold">{title}</h1>
        <div className="my-6 h-px bg-gradient-to-r from-transparent via-line to-transparent" />
        {children}
      </div>
    </main>
  );
}

export const fieldClass =
  "mt-1 h-12 w-full rounded-md border border-line bg-surface px-3 text-base outline-none transition focus:border-fg sm:h-11 sm:text-sm";
export const primaryButton =
  "h-11 w-full bg-accent text-sm font-semibold uppercase tracking-wide text-accent-fg transition hover:opacity-85 disabled:opacity-60";