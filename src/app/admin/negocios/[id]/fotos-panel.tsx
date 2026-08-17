"use client";

import { useEffect, useRef } from "react";
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
  favicon: string;
}

export default function FotosPanel({
  businessId,
  logo,
  heroImage,
  gallery,
  favicon,
}: FotosPanelProps) {
  const { refreshPreview, setDirty, setSaveHandler } = useEditorSelection();
  const { status, error, run, isPending, dirty, markDirty } = useAsyncStatus();
  const formRef = useRef<HTMLFormElement>(null);

  async function save(formData: FormData) {
    const result = await run(() => adminUpdateBusiness(businessId, formData));
    if (result.success) refreshPreview();
    return result.success;
  }

  useEffect(() => {
    setDirty(dirty);
  }, [dirty, setDirty]);

  useEffect(() => {
    setSaveHandler(async () => {
      if (!formRef.current) return false;
      return save(new FormData(formRef.current));
    });
    return () => setSaveHandler(null);
  });

  return (
    <div className="grid gap-8 max-w-lg">
      <form
        ref={formRef}
        action={async (formData) => {
          await save(formData);
        }}
        onChange={markDirty}
        className="grid gap-4"
      >
        <ImageUploadField
          folder={businessId}
          label="Logo"
          name="logo"
          defaultValue={logo}
          onChange={markDirty}
        />
        <ImageUploadField
          folder={businessId}
          label="Imagen de portada"
          name="hero_image"
          defaultValue={heroImage}
          onChange={markDirty}
        />

        <div className="grid gap-1.5">
          <ImageUploadField
            folder={businessId}
            label="Favicon"
            name="favicon"
            defaultValue={favicon}
            onChange={markDirty}
          />
          <p className="text-[11px] text-bone-muted/70">
            PNG o SVG cuadrado — recomendado 512×512px, mínimo 32×32px. Si no
            subís uno, se usa tu logo en la pestaña del navegador.
          </p>
        </div>

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
