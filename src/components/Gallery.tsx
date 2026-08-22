import { Business, GalleryLayoutId } from "@/types/business";
import EditorialGallery from "@/components/gallery/EditorialGallery";
import MarqueeGallery from "@/components/gallery/MarqueeGallery";
import FilmstripGallery from "@/components/gallery/FilmstripGallery";
import MasonryGallery from "@/components/gallery/MasonryGallery";
import ShowcaseGallery from "@/components/gallery/ShowcaseGallery";

interface GalleryProps {
  images: NonNullable<Business["gallery"]>;
  businessName: string;
  primaryColor: Business["primary_color"];
  /** Plantilla del negocio — solo la usa EditorialGallery (sus 3
   *  tratamientos Noir/Studio/mosaico); las otras 4 variantes son su
   *  propio diseño, consistente sin importar la plantilla. */
  layout?: Business["template_layout"];
  /** Estilo de galería elegido por el negocio (ver GalleryLayoutId) —
   *  `undefined`/cualquier valor no reconocido cae en "editorial", el
   *  mismo comportamiento de siempre. Todas las variantes reciben este
   *  MISMO array de `images` — ninguna guarda ni duplica fotos propias. */
  galleryLayout?: GalleryLayoutId | null;
}

/**
 * Punto único de entrada de la galería pública — dispatcher puro (sin
 * estado propio) hacia una de 5 variantes, todas alimentadas por el
 * mismo array de fotos (business.gallery). Agregar una variante nueva es
 * agregar un caso acá, no un sistema de galería aparte.
 */
export default function Gallery({
  images,
  businessName,
  primaryColor,
  layout,
  galleryLayout,
}: GalleryProps) {
  if (!images || images.length === 0) return null;

  switch (galleryLayout) {
    case "movimiento":
      return <MarqueeGallery images={images} businessName={businessName} primaryColor={primaryColor} />;
    case "filmstrip":
      return <FilmstripGallery images={images} businessName={businessName} primaryColor={primaryColor} />;
    case "masonry":
      return <MasonryGallery images={images} businessName={businessName} primaryColor={primaryColor} />;
    case "showcase":
      return <ShowcaseGallery images={images} businessName={businessName} primaryColor={primaryColor} />;
    case "editorial":
    default:
      return (
        <EditorialGallery
          images={images}
          businessName={businessName}
          primaryColor={primaryColor}
          layout={layout ?? undefined}
        />
      );
  }
}
