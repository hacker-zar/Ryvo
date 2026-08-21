"use client";

import GalleryUploadField from "@/components/admin/GalleryUploadField";
import { useEditorSelection } from "@/lib/admin/editor-selection-context";

interface QuickGalleryPanelProps {
  businessId: string;
  gallery: string[];
}

/**
 * Wrapper de una línea sobre GalleryUploadField (el mismo componente que
 * ya usa FotosPanel en el editor completo) — la galería es un recurso
 * compartido del negocio (confirmado antes de construir esto), así que
 * no hay nada que filtrar ni restringir acá, solo el mismo componente de
 * subida de siempre.
 */
export default function QuickGalleryPanel({
  businessId,
  gallery,
}: QuickGalleryPanelProps) {
  const { refreshPreview } = useEditorSelection();

  return (
    <div className="mt-2">
      <p className="text-xs text-bone-muted mb-4 max-w-sm">
        Fotos del negocio — se suben y se quitan al instante, sin un
        botón de guardar aparte.
      </p>
      <GalleryUploadField
        businessId={businessId}
        initialImages={gallery}
        onSaved={refreshPreview}
      />
    </div>
  );
}
