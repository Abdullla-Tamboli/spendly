import { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

export default function Modal({ title, open, onClose, children, footer, busy = false }) {
  const titleId = useId();
  const dialog = useRef(null);
  const close = useRef(onClose);
  const locked = useRef(busy);
  useEffect(() => { close.current = onClose; locked.current = busy; }, [onClose, busy]);
  useEffect(() => {
    if (!open) return;
    const previous = document.activeElement;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    dialog.current?.focus();
    const keydown = (event) => {
      if (event.key === 'Escape' && !locked.current) close.current();
      if (event.key !== 'Tab') return;
      const focusable = [...dialog.current.querySelectorAll('button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), a[href]')];
      const first = focusable[0], last = focusable[focusable.length - 1];
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === dialog.current)) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && (document.activeElement === last || document.activeElement === dialog.current)) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', keydown);
    return () => { document.body.style.overflow = overflow; document.removeEventListener('keydown', keydown); previous?.focus(); };
  }, [open]);
  if (!open) return null;
  return <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center bg-slate-950/40 sm:p-6" onMouseDown={(e) => { if (e.target === e.currentTarget && !busy) onClose(); }}>
    <section role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex={-1} ref={dialog} className="bg-white rounded-t-2xl sm:rounded-card shadow-xl w-full max-w-xl max-h-[92dvh] flex flex-col outline-none">
      <header className="flex items-center justify-between gap-4 px-6 py-5 border-b border-border">
        <h2 id={titleId} className="text-lg font-semibold tracking-tight">{title}</h2>
        <button type="button" disabled={busy} onClick={onClose} className="icon-button shrink-0" aria-label="Close dialog"><X size={20} /></button>
      </header>
      <div className="overflow-y-auto p-6">{children}</div>
      {footer && <footer className="p-5 border-t border-border flex justify-end gap-3">{footer}</footer>}
    </section>
  </div>;
}
