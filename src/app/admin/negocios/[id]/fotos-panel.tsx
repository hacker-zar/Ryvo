"use client";

import { useState } from "react";
import { adminUpdateBusiness } from "@/lib/admin/actions";
import { useEditorSelection } from "@/lib/admin/editor-selection-context";
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
  const [status, setStatus] = useState<"idle" | "submitting" | "saved" | "error">(
    "idle"
  );
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    setStatus("submitting");
    setError("");
    const result = await adminUpdateBusiness(businessId, formData);
    if (result.success) {
      setStatus("saved");
      refreshPreview();
    } else {
      setStatus("error");
      setError(result.error ?? "No se pudo guardar.");
    }
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

        {status === "error" ? (
          <p className="text-sm text-red-400">{error}</p>
        ) : null}
        {status === "saved" ? (
          <p className="text-sm text-brass">Guardado.</p>
        ) : null}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="section-eyebrow rounded-sm bg-brass text-ink font-semibold text-xs px-6 py-3.5 hover:opacity-90 transition-opacity disabled:opacity-50 w-fit"
        >
          {status === "submitting" ? "Guardando..." : "Guardar fotos"}
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
