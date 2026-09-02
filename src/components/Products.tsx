import { Business, CatalogLayoutId, Product } from "@/types/business";
import CatalogList from "@/components/catalog/CatalogList";
import CatalogGrid from "@/components/catalog/CatalogGrid";
import CatalogFeatured from "@/components/catalog/CatalogFeatured";

interface ProductsProps {
  products: Product[];
  primaryColor: Business["primary_color"];
  /** Estilo de catálogo elegido por el negocio (ver CatalogLayoutId) —
   *  cualquier valor no reconocido cae en "lista". Ningún renderer de
   *  acá abajo recibe ni consulta `template_layout` — el catálogo ya no
   *  depende de la plantilla, solo de esta preferencia del negocio. */
  catalogLayout?: CatalogLayoutId;
}

/**
 * Punto único de entrada del catálogo público — dispatcher puro (sin
 * estado propio), conceptualmente igual a Gallery.tsx: decide SOLO cuál
 * de las variantes renderizar, nunca cómo se ve cada una (eso vive en
 * cada componente de components/catalog/*, autocontenido igual que cada
 * variante de galería).
 */
export default function Products({ products, primaryColor, catalogLayout }: ProductsProps) {
  if (products.length === 0) return null;

  switch (catalogLayout) {
    case "grilla":
      return <CatalogGrid products={products} primaryColor={primaryColor} />;
    case "destacados":
      return <CatalogFeatured products={products} primaryColor={primaryColor} />;
    case "lista":
    default:
      return <CatalogList products={products} primaryColor={primaryColor} />;
  }
}
