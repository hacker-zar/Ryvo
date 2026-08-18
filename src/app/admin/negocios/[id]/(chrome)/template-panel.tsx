"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Template, TemplateLayoutId } from "@/types/business";
import { TEMPLATE_LAYOUT_LABELS } from "@/lib/templates/blueprints";
import {
  adminApplyTemplate,
  adminClearTemplate,
  adminCreateTemplate,
  adminDeleteTemplate,
  adminDuplicateTemplate,
  adminGetTemplateUsageCount,
} from "@/lib/admin/actions";
import { useEditorSelection } from "@/lib/admin/editor-selection-context";
import TemplatePicker from "@/components/admin/TemplatePicker";
import { adminInputClasses } from "@/lib/ui-classes";

interface TemplatePanelProps {
  businessId: string;
  templateId: string | null;
  templateLayout: TemplateLayoutId | null;
  officialTemplates: Template[];
  businessTemplates: Template[];
}

type Mode = "closed" | "changing" | "creating";

const buttonPrimary =
  "section-eyebrow text-xs px-4 py-2.5 btn-radius font-semibold bg-brass text-ink hover:opacity-90 transition-opacity disabled:opacity-50";
const buttonSecondary =
  "section-eyebrow text-xs px-4 py-2.5 btn-radius border border-ink-line text-bone hover:border-brass transition-colors disabled:opacity-50";

/**
 * Sección "Plantilla", última categoría del editor (ver CATEGORIES en
 * category-panel.tsx) — deliberadamente al final, debajo de todo lo
 * demás, sin mover ni tocar el resto del editor. Cada acción persiste al
 * instante (mismo criterio que SectionsManager/toggle de especialista
 * único): no hay un borrador que proteger con el patrón dirty.
 */
export default function TemplatePanel({
  businessId,
  templateId,
  templateLayout,
  officialTemplates,
  businessTemplates,
}: TemplatePanelProps) {
  const router = useRouter();
  const { refreshPreview } = useEditorSelection();
  const [mode, setMode] = useState<Mode>("closed");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [duplicatingId, setDuplicatingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");

  const currentTemplate =
    [...officialTemplates, ...businessTemplates].find((t) => t.id === templateId) ?? null;
  // Si la plantilla de origen se borró (template_id quedó en null vía
  // `on delete set null`) pero template_layout sobrevive (ya copiado),
  // igual mostramos qué diseño tiene la página — nunca "Ninguna" mientras
  // siga habiendo un layout aplicado.
  const currentName =
    currentTemplate?.name ??
    (templateLayout ? TEMPLATE_LAYOUT_LABELS[templateLayout] : "Ninguna (diseño base)");

  function closeAndRefresh() {
    setMode("closed");
    router.refresh();
    refreshPreview();
  }

  async function handleApply(id: string | null) {
    setError("");
    setBusy(true);
    const result = id === null
      ? await adminClearTemplate(businessId)
      : await adminApplyTemplate(businessId, id);
    setBusy(false);
    if (result.success) {
      closeAndRefresh();
    } else {
      setError(result.error ?? "No se pudo aplicar la plantilla.");
    }
  }

  async function handleDuplicate(id: string) {
    setError("");
    setDuplicatingId(id);
    const result = await adminDuplicateTemplate(businessId, id);
    setDuplicatingId(null);
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error ?? "No se pudo duplicar la plantilla.");
    }
  }

  async function handleDelete(template: Template) {
    setError("");
    const count = await adminGetTemplateUsageCount(businessId, template.id);
    const warning =
      count > 0
        ? `${count} página${count === 1 ? "" : "s"} usa${count === 1 ? "" : "n"} esta plantilla ahora mismo — van a seguir funcionando con su diseño actual, solo se borra la plantilla en sí. `
        : "";
    const confirmed = window.confirm(
      `${warning}¿Eliminar "${template.name}"? Esta acción no se puede deshacer.`
    );
    if (!confirmed) return;

    setDeletingId(template.id);
    const result = await adminDeleteTemplate(businessId, template.id);
    setDeletingId(null);
    if (result.success) {
      router.refresh();
    } else {
      setError(result.error ?? "No se pudo eliminar la plantilla.");
    }
  }

  async function handleCreate() {
    if (!newName.trim()) return;
    setError("");
    setBusy(true);
    const formData = new FormData();
    formData.set("name", newName.trim());
    formData.set("description", newDescription.trim());
    const result = await adminCreateTemplate(businessId, formData);
    setBusy(false);
    if (result.success) {
      setNewName("");
      setNewDescription("");
      closeAndRefresh();
    } else {
      setError(result.error ?? "No se pudo guardar la plantilla.");
    }
  }

  return (
    <div className="mt-2">
      <p className="section-eyebrow text-bone-muted mb-1">Plantilla actual</p>
      <p className="text-lg text-bone font-medium">{currentName}</p>

      {error ? <p className="text-xs text-red-400 mt-3">{error}</p> : null}

      {mode === "closed" ? (
        <div className="mt-4 flex flex-wrap gap-2">
          <button type="button" onClick={() => setMode("changing")} className={buttonPrimary}>
            Cambiar plantilla
          </button>
          <button type="button" onClick={() => setMode("creating")} className={buttonSecondary}>
            Guardar como nueva
          </button>
          <button
            type="button"
            disabled={!templateId || busy}
            onClick={() => templateId && handleDuplicate(templateId)}
            className={buttonSecondary}
          >
            {duplicatingId === templateId ? "Duplicando..." : "Duplicar plantilla"}
          </button>
        </div>
      ) : null}

      {mode === "changing" ? (
        <div className="mt-6">
          <div className="flex items-center justify-between mb-4">
            <p className="text-xs text-bone-muted max-w-sm">
              Cambiar de plantilla actualiza el diseño de tu página (layout,
              paleta, tipografía, orden de secciones) — tu contenido
              (servicios, profesionales, fotos, reservas) no se toca.
            </p>
            <button
              type="button"
              onClick={() => setMode("closed")}
              className="text-xs text-bone-muted hover:text-bone shrink-0 ml-4"
            >
              Cancelar
            </button>
          </div>
          <TemplatePicker
            officialTemplates={officialTemplates}
            businessTemplates={businessTemplates}
            currentTemplateId={templateId}
            onSelect={handleApply}
            onDuplicate={handleDuplicate}
            onDelete={handleDelete}
            duplicatingId={duplicatingId}
            deletingId={deletingId}
          />
          {busy ? <p className="text-xs text-bone-muted mt-3">Aplicando…</p> : null}
        </div>
      ) : null}

      {mode === "creating" ? (
        <div className="mt-6 max-w-sm grid gap-3">
          <div className="grid gap-1.5">
            <label htmlFor="template_name" className="text-xs text-bone-muted">
              Nombre
            </label>
            <input
              id="template_name"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              autoFocus
              placeholder="Ej: Mi estilo"
              className={adminInputClasses}
            />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="template_description" className="text-xs text-bone-muted">
              Descripción (opcional)
            </label>
            <textarea
              id="template_description"
              value={newDescription}
              onChange={(e) => setNewDescription(e.target.value)}
              rows={2}
              className={adminInputClasses}
            />
          </div>
          <p className="text-[11px] text-bone-muted/70">
            Guarda el diseño ACTUAL de tu página (layout, paleta, tipografía,
            estilo de botón, animación y orden de secciones) como una
            plantilla propia nueva — aparece al instante en &quot;Mis
            plantillas&quot;.
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={!newName.trim() || busy}
              onClick={handleCreate}
              className={buttonPrimary}
            >
              {busy ? "Guardando..." : "Guardar plantilla"}
            </button>
            <button type="button" onClick={() => setMode("closed")} className={buttonSecondary}>
              Cancelar
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
