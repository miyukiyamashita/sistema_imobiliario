import { useEffect, useRef } from "react";
import Button from "./Button";

function ConfirmModal({ open, title, description, children, confirmLabel = "Confirmar", cancelLabel = "Cancelar", destructive = false, loading = false, onConfirm, onCancel }) {
  const dialogRef = useRef(null);
  const cancelRef = useRef(null);
  const triggerRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    triggerRef.current = document.activeElement;
    cancelRef.current?.focus();
    const onKeyDown = (event) => {
      if (event.key === "Escape" && !loading) onCancel();
      if (event.key === "Tab" && dialogRef.current) {
        const focusable = dialogRef.current.querySelectorAll("button:not([disabled])");
        if (!focusable.length) return;
        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.body.classList.add("modal-open");
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.classList.remove("modal-open");
      triggerRef.current?.focus?.();
    };
  }, [open, loading, onCancel]);

  if (!open) return null;

  return (
    <div className="modal-backdrop" role="presentation">
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title" ref={dialogRef}>
        <div className={`modal-icon ${destructive ? "modal-icon-danger" : "modal-icon-info"}`} aria-hidden="true">{destructive ? "!" : "?"}</div>
        <h2 id="confirm-modal-title">{title}</h2>
        <p>{description}</p>
        {children}
        <div className="modal-actions">
          <Button ref={cancelRef} variant="ghost" onClick={onCancel} disabled={loading}>{cancelLabel}</Button>
          <Button variant={destructive ? "danger" : "primary"} onClick={onConfirm} loading={loading}>{confirmLabel}</Button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
