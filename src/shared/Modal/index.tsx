import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import type { PropsWithChildren } from "react";
import styles from "./modal.module.css";

interface Props extends PropsWithChildren {
  open: boolean;
  onClose: () => void;
  title: string;
}

export function Modal({ open, onClose, title = "Modal", children }: Props) {
  const dialogRef = useRef(null);
  const lastFocusedRef = useRef(null);

  // Bloquear scroll del body cuando está abierto
  useEffect(() => {
    if (!open) return;
    const { overflow } = document.body.style;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = overflow; };
  }, [open]);

  // Guardar y restaurar foco
  useEffect(() => {
    if (open) {
      lastFocusedRef.current = document.activeElement;
      dialogRef.current?.focus();
    } else {
      lastFocusedRef.current?.focus?.();
    }
  }, [open]);

  // Cerrar con ESC + focus trap básico
  useEffect(() => {
    if (!open) return;

    const onKeyDown = (e) => {
      if (e.key === "Escape") onClose?.();

      if (e.key === "Tab") {
        const focusables = dialogRef.current
          ?.querySelectorAll('a,button,input,textarea,select,[tabindex]:not([tabindex="-1"])');
        if (!focusables || focusables.length === 0) return;

        const first = focusables[0];
        const last = focusables[focusables.length - 1];

        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault(); last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault(); first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      className={styles.overlay}
      aria-hidden="false"
      aria-modal="true"
      role="dialog"
      aria-labelledby="modal-title"
      onClick={onClose} // Cierra al hacer clic fuera
    >
      <div className={styles.backdrop} />
      <div
        ref={dialogRef}
        tabIndex={-1}
        className={styles.dialog}
        onClick={(e) => e.stopPropagation()} // Evita cerrar si clic dentro
      >
        <div className={styles.header}>
          <h2 id="modal-title" className={styles.title}>{title}</h2>
          <button
            onClick={onClose}
            aria-label="Cerrar"
            className={styles.closeButton}
          >
            ✕
          </button>
        </div>

        <div className={styles.body}>{children}</div>
      </div>
    </div>,
    document.body
  );
}
