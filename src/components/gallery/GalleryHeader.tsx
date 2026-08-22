import { Business } from "@/types/business";
import Reveal from "@/components/Reveal";

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
      <Reveal>
        <div data-editable-category="apariencia" data-editable-field="galeria">
          <p className="section-eyebrow" style={{ color: primaryColor }}>
            Trabajos
          </p>
          <h2 className="display-title mt-2 text-3xl md:text-5xl text-bone">Galería</h2>
        </div>
      </Reveal>
    </div>
  );
}
