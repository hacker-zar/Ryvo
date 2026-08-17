"use client";

import { adminUpdateBusiness } from "@/lib/admin/actions";
import { useEditorSelection } from "@/lib/admin/editor-selection-context";
import { useAsyncStatus } from "@/lib/useAsyncStatus";
import SaveStatus from "@/components/ui/SaveStatus";
import ImageUploadField from "@/components/admin/ImageUploadField";
import GalleryUploadField from "@/components/admin/GalleryUploadField";

interface FotosPanelProps {
  businessId: string;
  logo: string;
  heroImage: string;
  gallery: string[];
}

export default function FotosPanel({
  businessId,
  logo,
  heroImage,
  gallery,
}: FotosPanelProps) {
  const { refreshPreview } = useEditorSelection();
  const { status, error, run, isPending } = useAsyncStatus();

  async function handleSubmit(formData: FormData) {
    const result = await run(() => adminUpdateBusiness(businessId, formData));
    if (result.success) refreshPreview();
  }

  return (
    <div className="grid gap-8 max-w-lg">
      <form action={handleSubmit} className="grid gap-4">
        <ImageUploadField
          folder={businessId}
          label="Logo"
          name="logo"
          defaultValue={logo}
        />
        <ImageUploadField
          folder={businessId}
          label="Imagen de portada"
          name="hero_image"
          defaultValue={heroImage}
        />

        <SaveStatus status={status} error={error} />

        <button
          type="submit"
          disabled={isPending}
          className="section-eyebrow rounded-sm bg-brass text-ink font-semibold text-xs px-6 py-3.5 hover:opacity-90 transition-opacity disabled:opacity-50 w-fit"
        >
          {isPending ? "Guardando..." : "Guardar fotos"}
        </button>
      </form>

      <div>
        <p className="section-eyebrow text-bone-muted mb-3">Galería</p>
        <GalleryUploadField
          businessId={businessId}
          initialImages={gallery}
          onSaved={refreshPreview}
        />
      </div>
    </div>
  );
}
