import { Business } from "@/types/business";
import SectionHeader from "@/components/SectionHeader";

interface GalleryHeaderProps {
  primaryColor: Business["primary_color"];
}

/**
 * Eyebrow + título "Galería", compartido por las 4 variantes nuevas
 * (Movimiento/Filmstrip/Masonry/Showcase) — EditorialGallery mantiene el
 * suyo inline porque además envuelve el mosaico Noir/Studio en el mismo
 * `<div>` de max-width, un detalle que las variantes nuevas no
 * necesitan. `data-editable-*` es lo que permite hacer click en el
 * título desde la preview del editor y saltar a la categoría "apariencia"
 * → campo "galeria" (ver preview-pane.tsx) — se mantiene igual sin
 * importar la variante elegida.
 */
export default function GalleryHeader({ primaryColor }: GalleryHeaderProps) {
  return (
    <div className="mx-auto max-w-5xl px-4">
      {/* Sin `layout`: estas 4 variantes son su propio diseño, consistente
          sin importar la plantilla del negocio (ver Gallery.tsx). */}
      <SectionHeader
        eyebrow="Trabajos"
        title="Galería"
        primaryColor={primaryColor}
        editableCategory="apariencia"
        editableField="galeria"
      />
    </div>
  );
}
