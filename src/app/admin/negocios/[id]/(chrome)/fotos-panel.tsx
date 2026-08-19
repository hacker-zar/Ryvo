"use client";

import { useEffect, useRef, useState } from "react";
import { HeroVideoPosition } from "@/types/business";
import { adminUpdateBusiness } from "@/lib/admin/actions";
import { useEditorSelection } from "@/lib/admin/editor-selection-context";
import { useAsyncStatus } from "@/lib/useAsyncStatus";
import ImageUploadField from "@/components/admin/ImageUploadField";
import GalleryUploadField from "@/components/admin/GalleryUploadField";
import AboutImagePicker from "@/components/admin/AboutImagePicker";
import VideoUploadField from "@/components/admin/VideoUploadField";

// Clave estable de este panel en el registro de guardado global (ver
// EditorSelectionContext.setFormDirty/setFormSaveHandler) — comparte la
// categoría "Apariencia" con AppearanceForm, que se registra bajo su
// propia clave distinta, así ninguno de los dos pisa al otro.
const FORM_KEY = "fotos";

interface FotosPanelProps {
  businessId: string;
  logo: string;
  heroImage: string;
  gallery: string[];
  aboutImage: string;
  favicon: string;
  heroVideo: string;
  heroVideoEnabled: boolean;
  heroVideoPosition: HeroVideoPosition;
}

const VIDEO_POSITION_OPTIONS: { value: HeroVideoPosition; label: string }[] = [
  { value: "center", label: "Centro" },
  { value: "top", label: "Arriba" },
  { value: "bottom", label: "Abajo" },
];

export default function FotosPanel({
  businessId,
  logo,
  heroImage,
  gallery,
  aboutImage,
  favicon,
  heroVideo,
  heroVideoEnabled,
  heroVideoPosition,
}: FotosPanelProps) {
  const { refreshPreview, setFormDirty, setFormSaveHandler } = useEditorSelection();
  const { run, dirty, markDirty } = useAsyncStatus();
  const formRef = useRef<HTMLFormElement>(null);
  // GalleryUploadField maneja su propia lista internamente (se guarda al
  // instante, sin pasar por el form de arriba) — este estado la sigue en
  // vivo para que AboutImagePicker, más abajo, siempre pueda elegir entre
  // las fotos actuales, no las que había al abrir el panel.
  const [galleryImages, setGalleryImages] = useState(gallery);

  async function save(formData: FormData) {
    const result = await run(() => adminUpdateBusiness(businessId, formData));
    if (result.success) refreshPreview();
    return result.success;
  }

  useEffect(() => {
    setFormDirty(FORM_KEY, dirty);
  }, [dirty, setFormDirty]);

  useEffect(() => {
    setFormSaveHandler(FORM_KEY, async () => {
      if (!formRef.current) return false;
      return save(new FormData(formRef.current));
    });
    return () => setFormSaveHandler(FORM_KEY, null);
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

        {/* Video en bucle: usa la portada de arriba como imagen de
            respaldo — no hay un campo de fallback separado. Por eso
            queda deshabilitado hasta que haya una portada cargada. */}
        <div
          className="grid gap-3 rounded-sm border border-ink-line p-4"
          data-editable-category="apariencia"
          data-editable-field="hero_video"
        >
          <label className="flex items-center gap-2 text-xs text-bone-muted">
            <input
              name="hero_video_enabled"
              type="checkbox"
              defaultChecked={heroVideoEnabled}
              disabled={!heroImage}
            />
            Usar video en bucle en el hero
          </label>
          {!heroImage ? (
            <p className="text-[11px] text-amber-400/90">
              Subí una imagen de portada primero — se usa como respaldo si
              el video no llega a cargar.
            </p>
          ) : null}

          <VideoUploadField
            folder={businessId}
            label="Video"
            name="hero_video"
            defaultValue={heroVideo}
            onChange={markDirty}
          />

          <div className="grid gap-1.5">
            <label htmlFor="hero_video_position" className="text-xs text-bone-muted">
              Posición
            </label>
            <select
              id="hero_video_position"
              name="hero_video_position"
              defaultValue={heroVideoPosition}
              className="h-9 rounded-sm border border-ink-line bg-ink-elevated px-2 text-sm text-bone"
            >
              {VIDEO_POSITION_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        </div>

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

      </form>

      <div>
        <p className="section-eyebrow text-bone-muted mb-3">Galería</p>
        <GalleryUploadField
          businessId={businessId}
          initialImages={gallery}
          onSaved={refreshPreview}
          onImagesChange={setGalleryImages}
        />
      </div>

      <AboutImagePicker
        businessId={businessId}
        gallery={galleryImages}
        initialValue={aboutImage}
        onSaved={refreshPreview}
      />
    </div>
  );
}
