import { useEffect, useRef } from "react";

export default function Dialog({ open, onClose, title, children, wide = false }) {
  const ref = useRef(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => e.target === ref.current && onClose()}
      className={`m-auto max-h-[92dvh] overflow-y-auto rounded-2xl border border-line bg-surface p-0 text-fg backdrop:bg-black/50 ${
        wide ? "w-[min(94vw,40rem)]" : "w-[min(94vw,28rem)]"
      }`}
    >
      {open && (
        <div className="p-5 sm:p-6">
          <div className="mb-5 flex items-start justify-between gap-4">
            <h2 className="text-lg font-bold uppercase">{title}</h2>
            <button type="button" aria-label="Close" onClick={onClose} className="-m-2 p-2 text-xl leading-none text-muted hover:text-fg">&times;</button>
          </div>
          {children}
        </div>
      )}
    </dialog>
  );
}