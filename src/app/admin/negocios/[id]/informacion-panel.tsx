"use client";

import { useEffect, useRef } from "react";
import { Business } from "@/types/business";
import { adminUpdateBusiness } from "@/lib/admin/actions";
import { useEditorSelection } from "@/lib/admin/editor-selection-context";
import { useAsyncStatus } from "@/lib/useAsyncStatus";
import { adminInputClasses } from "@/lib/ui-classes";
import SaveStatus from "@/components/ui/SaveStatus";

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
  const { target, refreshPreview, setDirty, setSaveHandler } =
    useEditorSelection();
  const { status, error, run, isPending, dirty, markDirty } = useAsyncStatus();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (target?.category !== "pagina" || !target.field) return;
    const id = FIELD_IDS[target.field];
    if (!id) return;
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: "smooth", block: "center" });
    if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement) {
      el.focus();
    }
  }, [target]);

  async function save(formData: FormData) {
    const result = await run(() => adminUpdateBusiness(business.id, formData));
    if (result.success) refreshPreview();
    return result.success;
  }

  // Reporta el `dirty` de este panel al contexto del editor, que es quien
  // decide si hace falta confirmar antes de cambiar de categoría — el
  // panel no sabe (ni necesita saber) de esa lógica.
  useEffect(() => {
    setDirty(dirty);
  }, [dirty, setDirty]);

  // Sin array de deps a propósito: registra de nuevo en cada render para
  // que el handler siempre cierre sobre el `save`/`formRef` actuales — el
  // diálogo de "cambios sin guardar" puede dispararse en cualquier
  // momento, no solo justo después de un cambio.
  useEffect(() => {
    setSaveHandler(async () => {
      if (!formRef.current) return false;
      return save(new FormData(formRef.current));
    });
    return () => setSaveHandler(null);
  });

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await save(formData);
      }}
      onChange={markDirty}
      className="grid gap-4 max-w-lg"
    >
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
          className={adminInputClasses}
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
          className={adminInputClasses}
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
          className={adminInputClasses}
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
          className={adminInputClasses}
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
          className={adminInputClasses}
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
          className={adminInputClasses}
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
          className={adminInputClasses}
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
          className={adminInputClasses}
        />
      </div>

      <SaveStatus status={status} error={error} />

      <button
        type="submit"
        disabled={isPending}
        className="section-eyebrow mt-2 rounded-sm bg-brass text-ink font-semibold text-xs px-6 py-3.5 hover:opacity-90 transition-opacity disabled:opacity-50 w-fit"
      >
        {isPending ? "Guardando..." : "Guardar cambios"}
      </button>
    </form>
  );
}
