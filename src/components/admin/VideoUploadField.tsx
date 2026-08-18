"use client";

import { useRef, useState } from "react";
import { adminUploadVideo } from "@/lib/admin/actions";

const MAX_VIDEO_BYTES = 15 * 1024 * 1024; // 15 MB — igual al límite server-side en actions.ts

interface VideoUploadFieldProps {
  folder: string;
  label: string;
  name: string;
  defaultValue?: string;
  onChange?: () => void;
}

/**
 * Mismo esqueleto que ImageUploadField (hidden input + estado
 * idle/uploading/success/error + callback onChange), con dos
 * diferencias: preview con <video controls> (los controles son solo
 * para que el admin revise el clip acá — nunca en el sitio público), y
 * un chequeo de tamaño ANTES de subir (los videos son mucho más
 * pesados que las imágenes, amerita el aviso inmediato sin esperar el
 * round-trip al servidor).
 */
export default function VideoUploadField({
  folder,
  label,
  name,
  defaultValue,
  onChange,
}: VideoUploadFieldProps) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">(
    "idle"
  );
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > MAX_VIDEO_BYTES) {
      setStatus("error");
      setError("El video no puede pesar más de 15 MB.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setStatus("uploading");
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    const result = await adminUploadVideo(folder, formData);

    if (result.success && result.url) {
      setUrl(result.url);
      onChange?.();
      setStatus("success");
      window.setTimeout(() => setStatus((s) => (s === "success" ? "idle" : s)), 1500);
    } else {
      setStatus("error");
      setError(result.error ?? "No se pudo subir el video.");
    }

    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="grid gap-1.5">
      <label className="text-xs text-bone-muted">{label}</label>

      {/* El valor real que viaja con el form al guardar el negocio. */}
      <input type="hidden" name={name} value={url} />

      {url ? (
        <video
          key={url}
          src={url}
          controls
          muted
          className="w-full max-w-xs rounded-sm border border-ink-line bg-ink-elevated"
        />
      ) : null}

      <div className="flex items-center gap-3">
        <label className="section-eyebrow text-[11px] px-3 py-2 rounded-sm border border-ink-line text-bone hover:border-brass focus-within:ring-2 focus-within:ring-brass/60 focus-within:ring-offset-2 focus-within:ring-offset-ink transition-colors cursor-pointer">
          {status === "uploading"
            ? "Subiendo..."
            : status === "success"
              ? "✓ Subido"
              : url
                ? "Cambiar video"
                : "Subir video"}
          <input
            ref={inputRef}
            type="file"
            accept="video/mp4,video/webm"
            onChange={handleFileChange}
            disabled={status === "uploading"}
            className="hidden"
          />
        </label>

        {url ? (
          <button
            type="button"
            onClick={() => {
              setUrl("");
              onChange?.();
            }}
            className="text-xs text-bone-muted hover:text-red-400 transition-colors"
          >
            Quitar
          </button>
        ) : null}
      </div>

      <p className="text-[11px] text-bone-muted/70">
        MP4 o WEBM, hasta 15MB — recomendado 10-20 segundos, sin audio.
      </p>

      {status === "error" ? (
        <p className="text-xs text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
