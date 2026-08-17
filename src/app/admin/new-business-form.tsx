"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { adminCreateBusiness } from "@/lib/admin/actions";
import ImageUploadField from "@/components/admin/ImageUploadField";
import { adminInputClasses } from "@/lib/ui-classes";

const inputClasses = `${adminInputClasses} disabled:opacity-50`;

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

      <ImageUploadField
        folder="new"
        label="Imagen de portada"
        name="hero_image"
      />

      <ImageUploadField folder="new" label="Logo" name="logo" />

      <div className="mt-4 pt-4 border-t border-ink-line grid gap-4">
        <div>
          <p className="section-eyebrow text-brass">Cuenta del propietario</p>
          <p className="text-xs text-bone-muted mt-1">
            Con este usuario y contraseña el dueño va a entrar directo a su
            panel.
          </p>
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="owner_name" className="text-xs text-bone-muted">
            Nombre del propietario
          </label>
          <input
            id="owner_name"
            name="owner_name"
            type="text"
            required
            disabled={disabled}
            className={inputClasses}
          />
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="username" className="text-xs text-bone-muted">
            Usuario
          </label>
          <input
            id="username"
            name="username"
            type="text"
            required
            disabled={disabled}
            className={inputClasses}
          />
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="password" className="text-xs text-bone-muted">
            Contraseña
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            minLength={8}
            placeholder="Mínimo 8 caracteres"
            disabled={disabled}
            className={inputClasses}
          />
        </div>
      </div>

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <button
        type="submit"
        disabled={disabled || status === "submitting"}
        className="section-eyebrow mt-2 rounded-sm bg-brass text-ink font-semibold text-xs px-6 py-3.5 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-ink focus-visible:ring-brass transition-opacity disabled:opacity-50 w-fit"
      >
        {status === "submitting" ? "Creando..." : "Crear negocio"}
      </button>
    </form>
  );
}
