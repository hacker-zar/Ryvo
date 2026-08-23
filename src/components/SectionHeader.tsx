import { TemplateLayoutId } from "@/types/business";
import Reveal from "@/components/Reveal";

interface SectionHeaderProps {
  /** Etiqueta corta de 12px sobre el título. Nunca se escala. */
  eyebrow: string;
  title: string;
  primaryColor: string;
  /** Editorial y Bold piden títulos de mayor impacto en todas las
   *  secciones — se resuelve acá, una vez, en vez de repetir el
   *  condicional en cada sección. */
  layout?: TemplateLayoutId;
  className?: string;
  /** Puente con la preview del editor: click en el encabezado abre la
   *  categoría correspondiente (ver preview-pane.tsx). Solo Galería lo
   *  usa hoy, pero es del encabezado, no de la galería. */
  editableCategory?: string;
  editableField?: string;
}

/**
 * Encabezado único de todas las secciones públicas.
 *
 * Antes cada sección resolvía su encabezado por su cuenta y no coincidían:
 * Galería/Reseñas/Contacto/Profesionales usaban eyebrow + título grande,
 * mientras que Servicios se anunciaba SOLO con la eyebrow de 12px — y en
 * Noir/Studio esa misma eyebrow se estiraba a `text-3xl`, es decir un
 * label de 12px a 30px conservando `letter-spacing: 0.2em`, que a ese
 * tamaño abre el título hasta que deja de leerse como una unidad.
 *
 * Regla que este componente hace cumplir: `.section-eyebrow` nunca supera
 * los 12px. El tamaño lo aporta el `<h2>`, que es lo que corresponde.
 */
export default function SectionHeader({
  eyebrow,
  title,
  primaryColor,
  layout,
  className,
  editableCategory,
  editableField,
}: SectionHeaderProps) {
  const bigTitle = layout === "editorial" || layout === "bold";

  return (
    <Reveal className={className}>
      <div
        data-editable-category={editableCategory}
        data-editable-field={editableField}
      >
        <p className="section-eyebrow" style={{ color: primaryColor }}>
          {eyebrow}
        </p>
        <h2
          className={`display-title mt-2 text-bone ${
            bigTitle ? "text-4xl md:text-6xl" : "text-3xl md:text-5xl"
          }`}
        >
          {title}
        </h2>
      </div>
    </Reveal>
  );
}
