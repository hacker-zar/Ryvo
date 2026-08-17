"use client";

interface UnsavedChangesDialogProps {
  open: boolean;
  /** Si el panel activo no registró un `setSaveHandler`, no ofrecemos
   *  "Guardar y continuar" — no hay nada que ejecutar y quedaría un botón
   *  que no responde. Solo pasa en pantallas que aún no adoptaron el
   *  patrón dirty; ahí igual se puede descartar o cancelar. */
  canSave: boolean;
  status: "idle" | "saving" | "error";
  onSaveAndContinue: () => void;
  onDiscard: () => void;
  onCancel: () => void;
}

/**
 * Confirmación reutilizable para no perder cambios sin guardar al navegar
 * dentro del editor (cambiar de categoría, click en la preview, pasos del
 * onboarding). La orquesta EditorSelectionContext — este componente no
 * sabe qué se está guardando, solo dispara las tres acciones que le pasan.
 * Mismo lenguaje visual que BookingModal/Lightbox (overlay + card,
 * fadeIn/slideUp).
 */
export default function UnsavedChangesDialog({
  open,
  canSave,
  status,
  onSaveAndContinue,
  onDiscard,
  onCancel,
}: UnsavedChangesDialogProps) {
  if (!open) return null;

  const saving = status === "saving";

  return (
    <div
      className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="unsaved-changes-title"
    >
      <button
        type="button"
        aria-label="Cancelar"
        onClick={saving ? undefined : onCancel}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
      />

      <div className="relative w-full sm:max-w-sm sm:mx-4 bg-ink border border-ink-line sm:rounded-sm flex flex-col animate-[slideUp_0.25s_ease-out] rounded-t-2xl sm:rounded-t-sm px-5 py-6">
        <p className="section-eyebrow text-brass">Atención</p>
        <h2
          id="unsaved-changes-title"
          className="section-title mt-2 text-lg text-bone"
        >
          Tenés cambios sin guardar
        </h2>
        <p className="text-sm text-bone-muted mt-2">
          Si continuás sin guardar, vas a perder lo que modificaste.
        </p>

        {status === "error" ? (
          <p className="text-sm text-red-400 mt-3">
            No se pudo guardar. Probá de nuevo.
          </p>
        ) : null}

        <div className="mt-6 flex flex-col gap-2">
          {canSave ? (
            <button
              type="button"
              onClick={onSaveAndContinue}
              disabled={saving}
              className="section-eyebrow text-xs px-4 py-2.5 rounded-sm bg-brass text-ink hover:opacity-90 disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-brass/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink transition-colors"
            >
              {saving ? "Guardando..." : "Guardar y continuar"}
            </button>
          ) : null}
          <button
            type="button"
            onClick={onDiscard}
            disabled={saving}
            className="section-eyebrow text-xs px-4 py-2.5 rounded-sm border border-ink-line text-bone hover:border-red-400 hover:text-red-400 disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-brass/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink transition-colors"
          >
            Descartar cambios
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={saving}
            className="section-eyebrow text-xs px-4 py-2.5 rounded-sm text-bone-muted hover:text-bone disabled:opacity-60 focus-visible:ring-2 focus-visible:ring-brass/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink transition-colors"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
}
