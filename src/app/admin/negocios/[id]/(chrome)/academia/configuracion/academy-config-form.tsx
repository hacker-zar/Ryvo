"use client";

import { useRouter } from "next/navigation";
import { Academy } from "@/types/business";
import { adminCreateAcademy, adminSetAcademyEnabled, adminUpdateAcademy } from "@/lib/admin/actions";
import { useAsyncStatus } from "@/lib/useAsyncStatus";
import { adminInputClasses } from "@/lib/ui-classes";
import SaveStatus from "@/components/ui/SaveStatus";
import ImageUploadField from "@/components/admin/ImageUploadField";

interface AcademyConfigFormProps {
  businessId: string;
  academy: Academy | null;
}

const ACTIVITY_TYPE_SUGGESTIONS = [
  "Fútbol",
  "Básquet",
  "Tenis",
  "Danza",
  "Natación",
  "Artes marciales",
  "Otro",
];

/**
 * Un solo form para "activar" (academy === null, crea la fila con
 * enabled=true) y para editar una ya activada — mismos campos, mismo
 * botón, sin un paso de "activar" separado del de completar datos (pedido
 * explícito: rápido de configurar).
 */
export default function AcademyConfigForm({ businessId, academy }: AcademyConfigFormProps) {
  const router = useRouter();
  const { status, error, run, isPending } = useAsyncStatus();
  const enabledStatus = useAsyncStatus();

  async function handleSubmit(formData: FormData) {
    const action = academy ? adminUpdateAcademy : adminCreateAcademy;
    const result = await run(() => action(businessId, formData));
    if (result.success) router.refresh();
  }

  async function handleToggleEnabled() {
    if (!academy) return;
    await enabledStatus.run(() => adminSetAcademyEnabled(businessId, !academy.enabled));
    router.refresh();
  }

  return (
    <div className="grid gap-6">
      {academy ? (
        <div className="flex items-center justify-between max-w-lg radius-sm border border-ink-line p-4">
          <div>
            <p className="text-sm text-bone font-medium">
              {academy.enabled ? "Academia activa" : "Academia desactivada"}
            </p>
            <p className="text-xs text-bone-muted mt-0.5">
              {academy.enabled
                ? "Visible en tu sitio público (si la sección está habilitada en el orden de secciones)."
                : "No se muestra en tu sitio público."}
            </p>
          </div>
          <button
            type="button"
            onClick={handleToggleEnabled}
            disabled={enabledStatus.isPending}
            className="section-eyebrow text-xs px-4 py-2.5 radius-sm border border-ink-line text-bone hover:border-brass transition-colors disabled:opacity-50 shrink-0"
          >
            {academy.enabled ? "Desactivar" : "Activar"}
          </button>
        </div>
      ) : null}

      <form action={handleSubmit} className="grid gap-3.5 max-w-lg">
        <div className="grid gap-1.5">
          <label htmlFor="academy_name" className="text-xs text-bone-muted">
            Nombre de la academia
          </label>
          <input
            id="academy_name"
            name="name"
            required
            defaultValue={academy?.name}
            className={adminInputClasses}
            placeholder="Ej: Academia Barbers Rosario"
          />
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="academy_activity_type" className="text-xs text-bone-muted">
            Tipo de academia / actividad
          </label>
          <input
            id="academy_activity_type"
            name="activity_type"
            list="academy_activity_type_suggestions"
            defaultValue={academy?.activity_type}
            className={adminInputClasses}
            placeholder="Ej: Fútbol, Danza, Barbería..."
          />
          <datalist id="academy_activity_type_suggestions">
            {ACTIVITY_TYPE_SUGGESTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="academy_headline" className="text-xs text-bone-muted">
            Título principal
          </label>
          <input
            id="academy_headline"
            name="headline"
            defaultValue={academy?.headline}
            className={adminInputClasses}
            placeholder="Ej: Formá parte del equipo"
          />
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="academy_description" className="text-xs text-bone-muted">
            Descripción
          </label>
          <textarea
            id="academy_description"
            name="description"
            rows={3}
            defaultValue={academy?.description}
            className={adminInputClasses}
          />
        </div>

        <ImageUploadField
          folder={businessId}
          label="Imagen principal"
          name="image"
          defaultValue={academy?.image}
        />
        <ImageUploadField
          folder={businessId}
          label="Logo (opcional)"
          name="logo"
          defaultValue={academy?.logo}
        />

        <div className="grid gap-1.5">
          <label htmlFor="academy_cta_text" className="text-xs text-bone-muted">
            Texto del botón principal
          </label>
          <input
            id="academy_cta_text"
            name="cta_text"
            defaultValue={academy?.cta_text || "Quiero inscribirme"}
            className={adminInputClasses}
          />
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="academy_contact_phone" className="text-xs text-bone-muted">
            WhatsApp / teléfono de contacto
          </label>
          <input
            id="academy_contact_phone"
            name="contact_phone"
            defaultValue={academy?.contact_phone}
            className={adminInputClasses}
            placeholder="Vacío = usa el WhatsApp del negocio"
          />
        </div>

        <SaveStatus status={status} error={error} />
        <button
          type="submit"
          disabled={isPending}
          className="section-eyebrow text-xs px-5 py-3 radius-sm bg-brass text-ink font-semibold hover:opacity-90 transition-opacity disabled:opacity-50 w-fit"
        >
          {isPending ? "Guardando..." : academy ? "Guardar cambios" : "Activar Academia"}
        </button>
      </form>
    </div>
  );
}
