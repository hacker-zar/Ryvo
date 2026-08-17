"use client";

import { useEffect, useState } from "react";
import { Business } from "@/types/business";
import { adminUpdateBusiness } from "@/lib/admin/actions";
import { useEditorSelection } from "@/lib/admin/editor-selection-context";

const inputClasses =
  "rounded-sm border border-ink-line bg-ink-elevated px-3 py-2.5 text-sm text-bone placeholder:text-bone-muted/60 focus:outline-none focus:border-brass transition-colors";

interface InformacionPanelProps {
  business: Pick<
    Business,
    | "id"
    | "name"
    | "description"
    | "address"
    | "city"
    | "whatsapp"
    | "instagram"
    | "phone"
    | "email"
  >;
}

// Relaciona el campo del formulario con el `data-editable-field` que usa
// el sitio público — así, al llegar una selección desde la preview (click
// en la biografía, en el WhatsApp, etc.), sabemos a qué input enfocar.
const FIELD_IDS: Record<string, string> = {
  nombre: "field-name",
  bio: "field-description",
  direccion: "field-address",
  whatsapp: "field-whatsapp",
  instagram: "field-instagram",
  telefono: "field-phone",
  email: "field-email",
};

export default function InformacionPanel({ business }: InformacionPanelProps) {
  const { target, refreshPreview } = useEditorSelection();
  const [status, setStatus] = useState<"idle" | "submitting" | "saved" | "error">(
    "idle"
  );
  const [error, setError] = useState("");

  useEffect(() => {
    if (target?.category !== "informacion" || !target.field) return;
    const id = FIELD_IDS[target.field];
    if (!id) return;
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      el.focus();
    }
  }, [target]);

  async function handleSubmit(formData: FormData) {
    setStatus("submitting");
    setError("");
    const result = await adminUpdateBusiness(business.id, formData);
    if (result.success) {
      setStatus("saved");
      refreshPreview();
    } else {
      setStatus("error");
      setError(result.error ?? "No se pudo guardar.");
    }
  }

  return (
    <form action={handleSubmit} className="grid gap-4 max-w-lg">
      <div className="grid gap-1.5">
        <label htmlFor="field-name" className="text-xs text-bone-muted">
          Nombre
        </label>
        <input
          id="field-name"
          name="name"
          type="text"
          required
          defaultValue={business.name}
          className={inputClasses}
        />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="field-description" className="text-xs text-bone-muted">
          Biografía / descripción
        </label>
        <textarea
          id="field-description"
          name="description"
          rows={4}
          defaultValue={business.description}
          className={inputClasses}
        />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="field-address" className="text-xs text-bone-muted">
          Dirección
        </label>
        <input
          id="field-address"
          name="address"
          type="text"
          defaultValue={business.address}
          className={inputClasses}
        />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="field-city" className="text-xs text-bone-muted">
          Ciudad
        </label>
        <input
          id="field-city"
          name="city"
          type="text"
          defaultValue={business.city}
          className={inputClasses}
        />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="field-whatsapp" className="text-xs text-bone-muted">
          WhatsApp
        </label>
        <input
          id="field-whatsapp"
          name="whatsapp"
          type="text"
          defaultValue={business.whatsapp}
          className={inputClasses}
        />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="field-instagram" className="text-xs text-bone-muted">
          Instagram
        </label>
        <input
          id="field-instagram"
          name="instagram"
          type="text"
          defaultValue={business.instagram}
          className={inputClasses}
        />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="field-phone" className="text-xs text-bone-muted">
          Teléfono
        </label>
        <input
          id="field-phone"
          name="phone"
          type="text"
          defaultValue={business.phone}
          className={inputClasses}
        />
      </div>

      <div className="grid gap-1.5">
        <label htmlFor="field-email" className="text-xs text-bone-muted">
          Email
        </label>
        <input
          id="field-email"
          name="email"
          type="email"
          defaultValue={business.email}
          className={inputClasses}
        />
      </div>

      {status === "error" ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : null}
      {status === "saved" ? (
        <p className="text-sm text-brass">Guardado.</p>
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
