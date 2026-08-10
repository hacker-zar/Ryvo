"use client";

import { useState } from "react";
import { Business } from "@/types/business";
import { adminUpdateBusiness } from "@/lib/admin/actions";

const inputClasses =
  "rounded-sm border border-ink-line bg-ink-elevated px-3 py-2.5 text-sm text-bone placeholder:text-bone-muted/60 focus:outline-none focus:border-brass transition-colors";

export default function BusinessEditForm({ business }: { business: Business }) {
  const [status, setStatus] = useState<"idle" | "submitting" | "saved" | "error">(
    "idle"
  );
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    setStatus("submitting");
    setError("");
    const result = await adminUpdateBusiness(business.id, formData);
    if (result.success) {
      setStatus("saved");
    } else {
      setStatus("error");
      setError(result.error ?? "No se pudo guardar.");
    }
  }

  return (
    <form action={handleSubmit} className="grid gap-4 max-w-lg">
      <div className="grid gap-1.5">
        <label htmlFor="name" className="text-xs text-bone-muted">
          Nombre
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={business.name}
          className={inputClasses}
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
          defaultValue={business.description}
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
            defaultValue={business.primary_color}
            className="h-10 rounded-sm border border-ink-line bg-ink-elevated"
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
            defaultValue={business.secondary_color}
            className="h-10 rounded-sm border border-ink-line bg-ink-elevated"
          />
        </div>
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="whatsapp" className="text-xs text-bone-muted">
          WhatsApp
        </label>
        <input
          id="whatsapp"
          name="whatsapp"
          type="text"
          defaultValue={business.whatsapp}
          className={inputClasses}
        />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="instagram" className="text-xs text-bone-muted">
          Instagram
        </label>
        <input
          id="instagram"
          name="instagram"
          type="text"
          defaultValue={business.instagram}
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
          defaultValue={business.address}
          className={inputClasses}
        />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="phone" className="text-xs text-bone-muted">
          Teléfono
        </label>
        <input
          id="phone"
          name="phone"
          type="text"
          defaultValue={business.phone}
          className={inputClasses}
        />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="email" className="text-xs text-bone-muted">
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          defaultValue={business.email}
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
          defaultValue={business.hero_image}
          className={inputClasses}
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
          defaultValue={business.logo}
          className={inputClasses}
        />
      </div>

      {status === "error" ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : null}
      {status === "saved" ? (
        <p className="text-sm" style={{ color: business.primary_color }}>
          Guardado.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="section-eyebrow mt-2 rounded-sm bg-brass text-ink font-semibold text-xs px-6 py-3.5 hover:opacity-90 transition-opacity disabled:opacity-50 w-fit"
      >
        {status === "submitting" ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
