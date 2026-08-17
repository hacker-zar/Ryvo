"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { adminUploadImage } from "@/lib/admin/actions";
import { adminUpdateGallery } from "@/lib/admin/gallery-actions";

interface GalleryUploadFieldProps {
  businessId: string;
  initialImages: string[];
  /** Se llama después de cada guardado exitoso (agregar o quitar una
   *  foto) — el editor lo usa para refrescar la preview en vivo. */
  onSaved?: () => void;
}

export default function GalleryUploadField({
  businessId,
  initialImages,
  onSaved,
}: GalleryUploadFieldProps) {
  const [images, setImages] = useState(initialImages);
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">(
    "idle"
  );
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function persist(next: string[]) {
    const result = await adminUpdateGallery(businessId, next);
    if (!result.success) {
      setStatus("error");
      setError(result.error ?? "No se pudo guardar la galería.");
    } else {
      onSaved?.();
    }
  }

  async function handleFilesChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    if (files.length === 0) return;

    setStatus("uploading");
    setError("");

    const uploadedUrls: string[] = [];
    for (const file of files) {
      const formData = new FormData();
      formData.append("file", file);
      const result = await adminUploadImage(businessId, formData);
      if (result.success && result.url) {
        uploadedUrls.push(result.url);
      } else {
        setStatus("error");
        setError(result.error ?? "No se pudo subir una de las imágenes.");
      }
    }

    if (uploadedUrls.length > 0) {
      const next = [...images, ...uploadedUrls];
      setImages(next);
      await persist(next);
    }

    setStatus((s) => {
      if (s === "error") return s;
      if (uploadedUrls.length > 0) {
        window.setTimeout(() => setStatus((s2) => (s2 === "success" ? "idle" : s2)), 1500);
        return "success";
      }
      return "idle";
    });
    if (inputRef.current) inputRef.current.value = "";
  }

  async function handleRemove(url: string) {
    const next = images.filter((img) => img !== url);
    setImages(next);
    await persist(next);
  }

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
        {images.map((url) => (
          <div
            key={url}
            className="relative aspect-square rounded-sm overflow-hidden border border-ink-line bg-ink-elevated group"
          >
            <Image src={url} alt="" fill sizes="(min-width: 640px) 25vw, 33vw" className="object-cover" />
            <button
              type="button"
              onClick={() => handleRemove(url)}
              aria-label="Quitar foto"
              className="absolute top-1 right-1 h-6 w-6 rounded-full bg-black/70 text-bone text-xs flex items-center justify-center opacity-0 group-hover:opacity-100 focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-brass transition-opacity"
            >
              ✕
            </button>
          </div>
        ))}

        <label className="aspect-square rounded-sm border border-dashed border-ink-line flex items-center justify-center text-bone-muted text-[11px] text-center cursor-pointer hover:border-brass focus-within:ring-2 focus-within:ring-brass/60 focus-within:ring-offset-2 focus-within:ring-offset-ink transition-colors">
          {status === "uploading"
            ? "Subiendo..."
            : status === "success"
              ? "✓ Agregado"
              : "+ Agregar"}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={handleFilesChange}
            disabled={status === "uploading"}
            className="hidden"
          />
        </label>
      </div>

      {status === "error" ? (
        <p className="text-xs text-red-400 mt-2">{error}</p>
      ) : null}
    </div>
  );
}
