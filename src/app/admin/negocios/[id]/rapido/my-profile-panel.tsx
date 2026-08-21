"use client";

import { useEffect, useRef } from "react";
import { ProfessionalWithServices, Service } from "@/types/business";
import { adminUpdateProfessional } from "@/lib/admin/actions";
import { useEditorSelection } from "@/lib/admin/editor-selection-context";
import { useAsyncStatus } from "@/lib/useAsyncStatus";
import { adminInputClasses } from "@/lib/ui-classes";
import ImageUploadField from "@/components/admin/ImageUploadField";

// Clave estable de este panel en el registro de guardado global (ver
// EditorSelectionContext.setFormDirty/setFormSaveHandler) — mismo
// mecanismo que Página/Fotos/Apariencia en el editor completo.
const FORM_KEY = "perfil";

interface MyProfilePanelProps {
  businessId: string;
  professional: ProfessionalWithServices;
  services: Service[];
}

/**
 * "Mi perfil" del Editor rápido — calcado de informacion-panel.tsx (un
 * form, registrado en el guardado global, sin botón propio). Reutiliza
 * `adminUpdateProfessional` (la MISMA acción que ya usa
 * ProfessionalsManager en el editor completo) — la autorización server-
 * side ya garantiza que solo puede tocar su propio `professional.id`
 * (ver requireBusinessMember en authorize.ts), así que acá no hace falta
 * ninguna verificación extra, solo no mostrar lo que no debería poder
 * cambiar: sin checkboxes de "Activo" ni de servicios asignados (ver
 * comentarios abajo).
 */
export default function MyProfilePanel({
  businessId,
  professional,
  services,
}: MyProfilePanelProps) {
  const { refreshPreview, setFormDirty, setFormSaveHandler } = useEditorSelection();
  const { run, dirty, markDirty } = useAsyncStatus();
  const formRef = useRef<HTMLFormElement>(null);

  async function save(formData: FormData) {
    const result = await run(() =>
      adminUpdateProfessional(businessId, professional.id, formData)
    );
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

  const assignedNames =
    professional.service_ids.length > 0
      ? services
          .filter((s) => professional.service_ids.includes(s.id))
          .map((s) => s.name)
      : [];

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await save(formData);
      }}
      onChange={markDirty}
      className="grid gap-4 max-w-lg"
    >
      {/* No se expone como checkbox editable acá (a diferencia de
          ProfessionalsManager) — se manda igual, con el valor actual, para
          que guardar el perfil nunca te desactive a vos mismo por
          accidente (ver el comentario de adminUpdateProfessional). */}
      <input type="hidden" name="active" value={professional.active ? "on" : ""} />

      <ImageUploadField
        folder={businessId}
        label="Foto"
        name="photo"
        defaultValue={professional.photo}
        onChange={markDirty}
      />

      <div className="grid gap-1.5">
        <label className="text-xs text-bone-muted">Nombre</label>
        <input
          name="name"
          defaultValue={professional.name}
          required
          className={adminInputClasses}
        />
      </div>

      <div className="grid gap-1.5">
        <label className="text-xs text-bone-muted">Rol / especialidad</label>
        <input
          name="role"
          defaultValue={professional.role}
          placeholder="Ej: Barbero, Colorista"
          className={adminInputClasses}
        />
      </div>

      <div className="grid gap-1.5">
        <label className="text-xs text-bone-muted">Descripción</label>
        <textarea
          name="bio"
          defaultValue={professional.bio}
          rows={4}
          className={adminInputClasses}
        />
      </div>

      <div className="grid gap-1.5">
        <label className="text-xs text-bone-muted">Experiencia</label>
        <input
          name="experience"
          defaultValue={professional.experience}
          placeholder="Ej: 12 años de experiencia"
          className={adminInputClasses}
        />
      </div>

      {/* Solo lectura a propósito: asignar qué servicios realiza cada
          profesional es del dueño (editor completo) — permitir que se
          las autoasigne sería un agujero de seguridad real, no de UI. */}
      <div>
        <p className="text-xs text-bone-muted mb-1">Servicios que realizás</p>
        <p className="text-[11px] text-bone-muted/70">
          {assignedNames.length > 0
            ? assignedNames.join(" · ")
            : "Calificado para todos los servicios del negocio."}{" "}
          Lo asigna el dueño desde el editor completo.
        </p>
      </div>
    </form>
  );
}
