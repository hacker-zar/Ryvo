"use client";

import { useEffect, useRef } from "react";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  /** Qué pasa exactamente si confirma. Un `confirm()` nativo no puede
   *  decir esto con formato ni con énfasis, y las acciones destructivas
   *  son justo las que más lo necesitan. */
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  /** Pinta el botón principal como destructivo. */
  destructive?: boolean;
  pending?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Confirmación reutilizable para acciones destructivas (borrar un
 * servicio, un profesional, un local, un producto; ocultar una web
 * publicada).
 *
 * Reemplaza al `confirm()` nativo, que estaba en 7 lugares. El problema
 * del nativo no era estético: no puede explicar consecuencias con
 * jerarquía, se ve distinto en cada navegador, algunos móviles lo
 * bloquean, y no comparte nada con el diálogo propio que el editor YA
 * tenía para cambios sin guardar. Las acciones más peligrosas del panel
 * eran las únicas que no usaban el lenguaje visual del producto.
 *
 * Mismo esqueleto que UnsavedChangesDialog (overlay + hoja, anim-fade/
 * anim-slide-up, sheet-radius) — no una segunda forma de dialogar.
 */
export default function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = "Confirmar",
  cancelLabel = "Cancelar",
  destructive = true,
  pending = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const confirmRef = useRef<HTMLButtonElement>(null);

  // Escape cancela — un confirm() nativo ya lo hacía y perderlo sería un
  // retroceso. No se engancha si el diálogo está cerrado, para no dejar
  // un listener global escuchando de más.
  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape" && !pending) onCancel();
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open, pending, onCancel]);

  // El foco arranca en el botón de acción para que el diálogo sea
  // operable con teclado desde el primer momento.
  useEffect(() => {
    if (open) confirmRef.current?.focus();
  }, [open]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-dialog-title"
    >
      <button
        type="button"
        aria-label={cancelLabel}
        onClick={pending ? undefined : onCancel}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm anim-fade"
      />

      <div className="relative w-full sm:max-w-sm sm:mx-4 bg-ink border border-ink-line sheet-radius flex flex-col anim-slide-up px-5 py-6">
        <p
          className={`section-eyebrow ${destructive ? "text-danger" : "text-brass"}`}
        >
          {destructive ? "Acción irreversible" : "Confirmar"}
        </p>
        <h2
          id="confirm-dialog-title"
          className="section-title mt-2 text-lg text-bone"
        >
          {title}
        </h2>
        <p className="text-sm text-bone-muted mt-2 whitespace-pre-line">
          {description}
        </p>

        <div className="mt-6 flex flex-col gap-2">
          <button
            ref={confirmRef}
            type="button"
            onClick={onConfirm}
            disabled={pending}
            className={`section-eyebrow text-xs px-4 py-2.5 radius-sm font-semibold disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-ink transition-colors ${
              destructive
                ? "bg-danger text-ink hover:opacity-90 focus-visible:ring-danger/60"
                : "bg-brass text-ink hover:opacity-90 focus-visible:ring-brass/60"
            }`}
          >
            {pending ? "Un momento…" : confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={pending}
            className="section-eyebrow text-xs px-4 py-2.5 radius-sm text-bone-muted hover:text-bone disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-brass/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink transition-colors"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
