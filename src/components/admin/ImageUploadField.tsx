"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { adminUploadImage } from "@/lib/admin/actions";

interface ImageUploadFieldProps {
  /** Carpeta dentro del bucket para organizar los archivos (normalmente el
   *  id del negocio, o "new" mientras se está creando uno). */
  folder: string;
  label: string;
  /** Valor actual (URL existente, si la hay) para el campo hidden del form
   *  y para mostrar el preview inicial. */
  name: string;
  defaultValue?: string;
  /** El valor real (el hidden input) cambia por `setUrl`, no por un evento
   *  nativo del navegador — el `onChange` delegado a nivel de `<form>` que
   *  usa el resto de los campos no lo detecta. Este callback es el aviso
   *  explícito para que el panel contenedor pueda marcar `dirty`. */
  onChange?: () => void;
}

export default function ImageUploadField({
  folder,
  label,
  name,
  defaultValue,
  onChange,
}: ImageUploadFieldProps) {
  const [url, setUrl] = useState(defaultValue ?? "");
  const [status, setStatus] = useState<"idle" | "uploading" | "success" | "error">(
    "idle"
  );
  const [error, setError] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setStatus("uploading");
    setError("");

    const formData = new FormData();
    formData.append("file", file);

    const result = await adminUploadImage(folder, formData);

    if (result.success && result.url) {
      setUrl(result.url);
      onChange?.();
      setStatus("success");
      // Flash breve de confirmación — no queda pegado indefinidamente.
      window.setTimeout(() => setStatus((s) => (s === "success" ? "idle" : s)), 1500);
    } else {
      setStatus("error");
      setError(result.error ?? "No se pudo subir la imagen.");
    }

    // Permite volver a elegir el mismo archivo si hace falta reintentar.
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="grid gap-1.5">
      <label className="text-xs text-bone-muted">{label}</label>

      {/* El valor real que viaja con el form al guardar el negocio. */}
      <input type="hidden" name={name} value={url} />

      <div className="flex items-center gap-3">
        {url ? (
          <div className="relative h-14 w-14 shrink-0 radius-sm overflow-hidden border border-ink-line bg-ink-elevated">
            <Image src={url} alt="" fill sizes="56px" className="object-cover" />
          </div>
        ) : (
          <div className="h-14 w-14 shrink-0 radius-sm border border-dashed border-ink-line flex items-center justify-center text-bone-muted text-[10px] text-center px-1">
            Sin imagen
          </div>
        )}

        <label className="section-eyebrow text-[11px] px-3 py-2 radius-sm border border-ink-line text-bone hover:border-brass focus-within:ring-2 focus-within:ring-brass/60 focus-within:ring-offset-2 focus-within:ring-offset-ink transition-colors cursor-pointer">
          {status === "uploading"
            ? "Subiendo..."
            : status === "success"
              ? "Subida"
              : url
                ? "Cambiar"
                : "Subir imagen"}
          <input
            ref={inputRef}
            type="file"
            accept="image/*"
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

      {status === "error" ? (
        <p className="text-xs text-red-400">{error}</p>
      ) : null}
    </div>
  );
}
