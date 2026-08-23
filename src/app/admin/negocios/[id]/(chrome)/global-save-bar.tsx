"use client";

import { useEditorSelection } from "@/lib/admin/editor-selection-context";
import Icon, { IconName } from "@/components/ui/Icon";

/**
 * Único punto de guardado visible del editor — reemplaza los botones
 * "Guardar" que antes tenía cada formulario de configuración (Página,
 * Fotos, Apariencia). Llama siempre a `saveChanges()` del contexto, la
 * misma función que ejecuta el atajo Ctrl+S/Cmd+S (ver
 * EditorSelectionContext) y "Guardar y continuar" del diálogo de
 * cambios sin guardar — no hay una segunda implementación acá.
 *
 * Las listas CRUD (Servicios/Profesionales/Productos/Locales) NO pasan
 * por acá: sus acciones son inmediatas por ítem, fuera del guardado
 * global (ver plan — decisión explícita, no un olvido).
 */
export default function GlobalSaveBar() {
  const { isDirty, saveStatus, saveError, saveChanges } = useEditorSelection();

  const saving = saveStatus === "saving";
  const showError = saveStatus === "error";

  let label: string;
  let icon: IconName | null;
  if (saving) {
    label = "Guardando…";
    icon = null;
  } else if (showError) {
    label = "Error al guardar";
    icon = "alert";
  } else if (isDirty) {
    label = "Cambios sin guardar";
    icon = "alert";
  } else {
    label = "Todos los cambios guardados";
    icon = "check";
  }

  let statusColor: string;
  if (showError) {
    statusColor = "text-danger";
  } else if (isDirty && !saving) {
    statusColor = "text-brass";
  } else {
    statusColor = "text-ok";
  }

  return (
    <div className="sticky top-0 z-30 mb-6 flex items-center justify-between gap-4 radius-sm border border-ink-line bg-ink/95 backdrop-blur px-4 py-3">
      <div>
        <p className={`text-xs font-medium flex items-center gap-1.5 ${statusColor}`}>
          {icon ? <Icon name={icon} size={16} className="shrink-0" /> : null}
          {label}
        </p>
        {showError ? (
          <p className="text-[11px] text-bone-muted mt-0.5">{saveError}</p>
        ) : null}
      </div>
      <button
        type="button"
        disabled={saving || (!isDirty && !showError)}
        onClick={() => saveChanges()}
        className="section-eyebrow shrink-0 text-xs px-5 py-2.5 radius-sm bg-brass text-ink font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
      >
        {saving ? "Guardando…" : showError ? "Reintentar" : "Guardar cambios"}
      </button>
    </div>
  );
}
