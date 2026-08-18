"use client";

import { Template } from "@/types/business";
import TemplatePreviewCard from "./TemplatePreviewCard";

interface TemplatePickerProps {
  officialTemplates: Template[];
  /** Solo tiene sentido en el editor (un negocio ya existente) — vacío en
   *  /registro, donde el negocio todavía no existe. */
  businessTemplates?: Template[];
  currentTemplateId?: string | null;
  onSelect: (templateId: string | null) => void;
  /** Solo se pasa desde el editor — el picker de /registro no ofrece
   *  duplicar (no hay negocio todavía al que asociar la copia). */
  onDuplicate?: (templateId: string) => void;
  /** Solo se pasa desde el editor, y solo aplica a "Mis plantillas" (las
   *  oficiales nunca se pueden borrar — TemplatePreviewCard ya no
   *  muestra el botón para is_official=true independientemente de esto). */
  onDelete?: (template: Template) => void;
  duplicatingId?: string | null;
  deletingId?: string | null;
  /** "Página en blanco" no tiene sentido al cambiar la plantilla de una
   *  página que ya está publicada con contenido real — el editor la
   *  desactiva; /registro la deja disponible. */
  allowBlank?: boolean;
}

/**
 * Grid de plantillas — "PLANTILLAS RYVO" (oficiales) y, si corresponde,
 * "MIS PLANTILLAS" (propias del negocio), visualmente diferenciadas por
 * el badge de TemplatePreviewCard. Mismo componente para el picker de
 * creación de página (/registro, admin/new-business-form) y para
 * "Cambiar plantilla" en el editor — solo cambian las props que recibe.
 */
export default function TemplatePicker({
  officialTemplates,
  businessTemplates = [],
  currentTemplateId = null,
  onSelect,
  onDuplicate,
  onDelete,
  duplicatingId = null,
  deletingId = null,
  allowBlank = true,
}: TemplatePickerProps) {
  return (
    <div className="grid gap-8">
      <div>
        <p className="section-eyebrow text-brass mb-3">Plantillas RYVO</p>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {officialTemplates.map((t) => (
            <TemplatePreviewCard
              key={t.id}
              template={t}
              badge="oficial"
              selected={currentTemplateId === t.id}
              onUse={() => onSelect(t.id)}
              onDuplicate={onDuplicate ? () => onDuplicate(t.id) : undefined}
              duplicating={duplicatingId === t.id}
            />
          ))}
        </div>
      </div>

      {businessTemplates.length > 0 ? (
        <div>
          <p className="section-eyebrow text-bone-muted mb-3">Mis plantillas</p>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {businessTemplates.map((t) => (
              <TemplatePreviewCard
                key={t.id}
                template={t}
                badge="propia"
                selected={currentTemplateId === t.id}
                onUse={() => onSelect(t.id)}
                onDuplicate={onDuplicate ? () => onDuplicate(t.id) : undefined}
                onDelete={onDelete ? () => onDelete(t) : undefined}
                duplicating={duplicatingId === t.id}
                deleting={deletingId === t.id}
              />
            ))}
          </div>
        </div>
      ) : null}

      {allowBlank ? (
        <button
          type="button"
          onClick={() => onSelect(null)}
          className={`text-left border rounded-sm p-4 flex items-center justify-between gap-4 transition-colors ${
            currentTemplateId === null
              ? "border-brass"
              : "border-ink-line hover:border-bone-muted"
          }`}
        >
          <div>
            <p className="text-sm text-bone font-medium">Página en blanco</p>
            <p className="text-xs text-bone-muted mt-1">
              Sin plantilla — el diseño base de RYVO, totalmente personalizable.
            </p>
          </div>
          <span className="section-eyebrow text-[10px] text-bone-muted shrink-0">
            {currentTemplateId === null ? "En uso" : "Elegir"}
          </span>
        </button>
      ) : null}
    </div>
  );
}
