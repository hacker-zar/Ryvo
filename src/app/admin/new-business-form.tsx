"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminCreateBusiness } from "@/lib/admin/actions";

const inputClasses =
  "rounded-sm border border-ink-line bg-ink-elevated px-3 py-2.5 text-sm text-bone placeholder:text-bone-muted/60 focus:outline-none focus:border-brass transition-colors disabled:opacity-50";

export default function NewBusinessForm({ disabled }: { disabled?: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState<"idle" | "submitting" | "error">(
    "idle"
  );
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    setStatus("submitting");
    setError("");
    const result = await adminCreateBusiness(formData);
    if (result.success && result.id) {
      router.push(`/admin/negocios/${result.id}`);
    } else {
      setStatus("error");
      setError(result.error ?? "No se pudo crear el negocio.");
    }
  }

  return (
    <form action={handleSubmit} className="mt-6 grid gap-4 max-w-lg">
      <div className="grid gap-1.5">
        <label htmlFor="name" className="text-xs text-bone-muted">
          Nombre del negocio
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          disabled={disabled}
          className={inputClasses}
          placeholder="Ej: Bella Vista Peluquería"
        />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="slug" className="text-xs text-bone-muted">
          Slug (URL) — opcional, se genera del nombre si lo dejás vacío
        </label>
        <input
          id="slug"
          name="slug"
          type="text"
          disabled={disabled}
          className={inputClasses}
          placeholder="bella-vista"
        />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="description" className="text-xs text-bone-muted">
          Descripción
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          disabled={disabled}
          className={inputClasses}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-1.5">
          <label htmlFor="primary_color" className="text-xs text-bone-muted">
            Color principal
          </label>
          <input
            id="primary_color"
            name="primary_color"
            type="color"
            defaultValue="#c9a15a"
            disabled={disabled}
            className="h-10 rounded-sm border border-ink-line bg-ink-elevated disabled:opacity-50"
          />
        </div>
        <div className="grid gap-1.5">
          <label htmlFor="secondary_color" className="text-xs text-bone-muted">
            Color secundario
          </label>
          <input
            id="secondary_color"
            name="secondary_color"
            type="color"
            defaultValue="#f5f5f5"
            disabled={disabled}
            className="h-10 rounded-sm border border-ink-line bg-ink-elevated disabled:opacity-50"
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="whatsapp" className="text-xs text-bone-muted">
          WhatsApp (con código de país, solo números)
        </label>
        <input
          id="whatsapp"
          name="whatsapp"
          type="text"
          disabled={disabled}
          className={inputClasses}
          placeholder="5493411234567"
        />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="instagram" className="text-xs text-bone-muted">
          Instagram (usuario, sin @)
        </label>
        <input
          id="instagram"
          name="instagram"
          type="text"
          disabled={disabled}
          className={inputClasses}
        />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="address" className="text-xs text-bone-muted">
          Dirección
        </label>
        <input
          id="address"
          name="address"
          type="text"
          disabled={disabled}
          className={inputClasses}
        />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="hero_image" className="text-xs text-bone-muted">
          URL de imagen de portada
        </label>
        <input
          id="hero_image"
          name="hero_image"
          type="text"
          disabled={disabled}
          className={inputClasses}
          placeholder="https://..."
        />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="logo" className="text-xs text-bone-muted">
          URL del logo
        </label>
        <input
          id="logo"
          name="logo"
          type="text"
          disabled={disabled}
          className={inputClasses}
          placeholder="https://..."
        />
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <button
        type="submit"
        disabled={disabled || status === "submitting"}
        className="section-eyebrow mt-2 rounded-sm bg-brass text-ink font-semibold text-xs px-6 py-3.5 hover:opacity-90 transition-opacity disabled:opacity-50 w-fit"
      >
        {status === "submitting" ? "Creando..." : "Crear negocio"}
      </button>
    </form>
  );
}
