"use client";

import { useEffect, useRef } from "react";
import { Business } from "@/types/business";
import { adminUpdateBusiness } from "@/lib/admin/actions";
import { useEditorSelection } from "@/lib/admin/editor-selection-context";
import { useAsyncStatus } from "@/lib/useAsyncStatus";
import { adminInputClasses } from "@/lib/ui-classes";

// Clave estable de este panel en el registro de guardado global (ver
// EditorSelectionContext.setFormDirty/setFormSaveHandler) — no tiene
// botón "Guardar" propio, se guarda desde GlobalSaveBar/Ctrl+S.
const FORM_KEY = "pagina";

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
    | "hero_kicker"
    | "hero_headline"
  >;
}

// Relaciona el campo del formulario con el `data-editable-field` que usa
// el sitio público — así, al llegar una selección desde la preview (click
// en la biografía, en el WhatsApp, etc.), sabemos a qué input enfocar.
const FIELD_IDS: Record<string, string> = {
  nombre: "field-name",
  bio: "field-description",
  // Click en la línea de arriba o en el título de la portada, desde la
  // preview → enfoca su input (ver Hero.tsx).
  portada_kicker: "field-hero-kicker",
  portada_titulo: "field-hero-headline",
  direccion: "field-address",
  whatsapp: "field-whatsapp",
  instagram: "field-instagram",
  telefono: "field-phone",
  email: "field-email",
};

export default function InformacionPanel({ business }: InformacionPanelProps) {
  const { target, refreshPreview, setFormDirty, setFormSaveHandler } =
    useEditorSelection();
  const { run, dirty, markDirty } = useAsyncStatus();
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

  // Reporta el `dirty` de este panel al registro global de guardado (ver
  // GlobalSaveBar) bajo su propia clave — el panel no sabe (ni necesita
  // saber) que existen otros formularios sucios al mismo tiempo.
  useEffect(() => {
    setFormDirty(FORM_KEY, dirty);
  }, [dirty, setFormDirty]);

  // Sin array de deps a propósito: registra de nuevo en cada render para
  // que el handler siempre cierre sobre el `save`/`formRef` actuales — el
  // guardado global (botón/Ctrl+S/diálogo de cambios sin guardar) puede
  // dispararse en cualquier momento, no solo justo después de un cambio.
  useEffect(() => {
    setFormSaveHandler(FORM_KEY, async () => {
      if (!formRef.current) return false;
      return save(new FormData(formRef.current));
    });
    return () => setFormSaveHandler(FORM_KEY, null);
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

      {/* Apertura del hero.
          Hasta acá todos los sitios de RYVO abrían con la misma frase y
          con el nombre del negocio como título — que ya está en el menú
          justo arriba. Los dos campos van vacíos por defecto y en ese
          caso se muestra exactamente el texto de siempre, así que ningún
          negocio existente cambia hasta que alguien escriba acá. */}
      <div className="border-t border-ink-line pt-4 mt-1">
        <p className="section-eyebrow text-bone-muted mb-1">Portada</p>
        <p className="text-[11px] text-bone-muted/70 mb-3 max-w-sm">
          Lo primero que lee alguien que entra. Si lo dejás vacío, usamos
          el nombre de tu negocio.
        </p>
        <div className="grid gap-4">
          <div className="grid gap-1.5">
            <label htmlFor="field-hero-kicker" className="text-xs text-bone-muted">
              Línea de arriba
            </label>
            <input
              id="field-hero-kicker"
              name="hero_kicker"
              type="text"
              maxLength={60}
              placeholder="Reservá tu turno online"
              defaultValue={business.hero_kicker ?? ""}
              className={adminInputClasses}
            />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="field-hero-headline" className="text-xs text-bone-muted">
              Título principal
            </label>
            <input
              id="field-hero-headline"
              name="hero_headline"
              type="text"
              maxLength={80}
              placeholder={business.name}
              defaultValue={business.hero_headline ?? ""}
              className={adminInputClasses}
            />
            <p className="text-[11px] text-bone-muted/70">
              Ej: &quot;Corte clásico, sin apuro&quot; · &quot;Desde 1994 en Villa Crespo&quot;
            </p>
          </div>
        </div>
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

    </form>
  );
}
