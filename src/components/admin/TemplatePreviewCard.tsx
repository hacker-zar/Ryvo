import { Template } from "@/types/business";
import { resolvePalette } from "@/lib/palette-presets";
import { LAYOUT_BLUEPRINTS, TEMPLATE_LAYOUT_STYLE_TAGS } from "@/lib/templates/blueprints";

interface TemplatePreviewCardProps {
  template: Template;
  badge?: "oficial" | "propia";
  selected?: boolean;
  onUse?: () => void;
  onDuplicate?: () => void;
  onDelete?: () => void;
  duplicating?: boolean;
  deleting?: boolean;
}

/**
 * Mini-mockup visual de una plantilla: hero, tipografía, colores,
 * servicios y galería — construido con los tokens/fuente REALES de esa
 * plantilla (paleta vía palette-presets.ts + fuente vía LAYOUT_BLUEPRINTS)
 * pero con contenido de relleno, no los componentes públicos completos
 * (evita depender de datos de un negocio real solo para previsualizar un
 * diseño). Usado en el picker de creación de página y en "Cambiar
 * plantilla"/"Guardar como nueva" del editor.
 */
export default function TemplatePreviewCard({
  template,
  badge,
  selected,
  onUse,
  onDuplicate,
  onDelete,
  duplicating,
  deleting,
}: TemplatePreviewCardProps) {
  const palette = resolvePalette(template.palette_id);
  const blueprint = LAYOUT_BLUEPRINTS[template.layout];
  const headingFont = blueprint ? `var(${blueprint.headingFont.cssVar})` : undefined;

  const bg = palette?.background ?? "#1a1815";
  const surface = palette?.surface ?? "#242019";
  const text = palette?.text ?? "#f7f4ee";
  const accent = palette?.accent ?? "#c9a15a";
  const border = palette?.border ?? "#3a342c";

  return (
    <div
      className={`border radius-sm overflow-hidden flex flex-col ${
        selected ? "border-brass" : "border-ink-line"
      }`}
    >
      <div className="relative" style={{ background: bg }}>
        {badge ? (
          <span
            className={`absolute top-2 left-2 z-10 section-eyebrow text-[9px] px-2 py-0.5 radius-sm ${
              badge === "oficial" ? "bg-brass text-ink" : "bg-bone text-ink"
            }`}
          >
            {badge === "oficial" ? "RYVO" : "PROPIA"}
          </span>
        ) : null}

        <div className="h-16 flex items-center justify-center px-3" style={{ background: surface }}>
          <span
            className="text-sm tracking-wide truncate"
            style={{ fontFamily: headingFont, color: text }}
          >
            {template.name}
          </span>
        </div>
        <div className="p-3 space-y-2">
          <div className="h-1.5 w-10 rounded-full" style={{ background: accent }} />
          <div className="flex gap-1">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-8 flex-1 radius-sm" style={{ background: surface }} />
            ))}
          </div>
          <div className="grid grid-cols-3 gap-1">
            <div className="aspect-square radius-sm col-span-2" style={{ background: border }} />
            <div className="aspect-square radius-sm" style={{ background: border }} />
          </div>
        </div>
        <div className="h-3" style={{ background: surface }} />
      </div>

      <div className="p-3 flex-1 flex flex-col">
        <p className="text-sm text-bone font-medium">{template.name}</p>
        {template.description ? (
          <p className="mt-1 text-xs text-bone-muted line-clamp-2">{template.description}</p>
        ) : null}
        {template.is_official ? (
          <p className="mt-1 text-[10px] text-bone-muted/70">
            {TEMPLATE_LAYOUT_STYLE_TAGS[template.layout]}
          </p>
        ) : null}

        <div className="mt-3 flex flex-wrap gap-2">
          {onUse ? (
            <button
              type="button"
              onClick={onUse}
              disabled={selected}
              className="section-eyebrow text-[10px] px-3 py-2 btn-radius font-semibold bg-brass text-ink hover:opacity-90 transition-opacity disabled:opacity-60 flex-1"
            >
              {selected ? "Plantilla actual" : "Usar plantilla"}
            </button>
          ) : null}
          {onDuplicate ? (
            <button
              type="button"
              onClick={onDuplicate}
              disabled={duplicating}
              className="section-eyebrow text-[10px] px-3 py-2 btn-radius border border-ink-line text-bone hover:border-brass transition-colors disabled:opacity-50"
            >
              {duplicating ? "..." : "Duplicar"}
            </button>
          ) : null}
          {onDelete ? (
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              className="section-eyebrow text-[10px] px-3 py-2 btn-radius border border-ink-line text-bone-muted hover:border-red-400 hover:text-red-400 transition-colors disabled:opacity-50"
            >
              {deleting ? "..." : "Eliminar"}
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
