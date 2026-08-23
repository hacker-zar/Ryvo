"use client";

import Icon from "@/components/ui/Icon";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { ProfessionalWithServices, Service } from "@/types/business";
import {
  adminCreateProfessional,
  adminDeleteProfessional,
  adminReorderProfessional,
  adminSetSingleSpecialistMode,
  adminUpdateProfessional,
} from "@/lib/admin/actions";
import { useEditorSelection } from "@/lib/admin/editor-selection-context";
import { useAsyncStatus } from "@/lib/useAsyncStatus";
import { adminInputClassesCompact } from "@/lib/ui-classes";
import SaveStatus from "@/components/ui/SaveStatus";
import EmptyState from "@/components/ui/EmptyState";
import ImageUploadField from "@/components/admin/ImageUploadField";

interface ProfessionalsManagerProps {
  businessId: string;
  professionals: ProfessionalWithServices[];
  services: Service[];
  singleSpecialistMode: boolean;
}

export default function ProfessionalsManager({
  businessId,
  professionals,
  services,
  singleSpecialistMode,
}: ProfessionalsManagerProps) {
  const router = useRouter();
  const { target, select, refreshPreview } = useEditorSelection();
  const [items, setItems] = useState(professionals);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [reorderingId, setReorderingId] = useState<string | null>(null);
  const [singleMode, setSingleMode] = useState(singleSpecialistMode);
  const [savingSingleMode, setSavingSingleMode] = useState(false);
  const [singleModeError, setSingleModeError] = useState("");
  const editingId =
    target?.category === "profesionales" ? target.itemId ?? null : null;

  const createStatus = useAsyncStatus();
  const updateStatus = useAsyncStatus();

  const activeCount = items.filter((p) => p.active).length;

  async function handleToggleSingleMode() {
    const next = !singleMode;
    setSingleMode(next);
    setSingleModeError("");
    setSavingSingleMode(true);
    const result = await adminSetSingleSpecialistMode(businessId, next);
    setSavingSingleMode(false);
    if (result.success) {
      router.refresh();
      refreshPreview();
    } else {
      setSingleMode(!next);
      setSingleModeError(result.error ?? "No se pudo guardar el cambio.");
    }
  }

  async function handleCreate(formData: FormData) {
    const result = await createStatus.run(() =>
      adminCreateProfessional(businessId, formData)
    );
    if (result.success) {
      router.refresh();
      refreshPreview();
    }
  }

  async function handleUpdate(professionalId: string, formData: FormData) {
    const result = await updateStatus.run(() =>
      adminUpdateProfessional(businessId, professionalId, formData)
    );
    if (result.success) {
      select({ category: "profesionales" });
      router.refresh();
      refreshPreview();
    }
  }

  async function handleDelete(professionalId: string) {
    if (!confirm("¿Borrar este profesional?")) return;
    setDeletingId(professionalId);
    const result = await adminDeleteProfessional(businessId, professionalId);
    setDeletingId(null);
    if (result.success) {
      setItems((prev) => prev.filter((p) => p.id !== professionalId));
      refreshPreview();
    }
  }

  async function handleReorder(professionalId: string, direction: "up" | "down") {
    setReorderingId(professionalId);
    const result = await adminReorderProfessional(businessId, professionalId, direction);
    setReorderingId(null);
    if (result.success) {
      router.refresh();
      refreshPreview();
    }
  }

  return (
    <div className="mt-6">
      <label className="flex items-start gap-3 mb-6 max-w-md cursor-pointer">
        <button
          type="button"
          role="switch"
          aria-checked={singleMode}
          disabled={savingSingleMode}
          onClick={handleToggleSingleMode}
          className={`relative w-9 h-5 rounded-full transition-colors shrink-0 mt-0.5 disabled:opacity-50 ${
            singleMode ? "bg-brass" : "bg-ink-line"
          }`}
        >
          <span
            className={`absolute top-0.5 h-4 w-4 rounded-full bg-ink transition-transform ${
              singleMode ? "translate-x-[18px]" : "translate-x-0.5"
            }`}
          />
        </button>
        <span className="text-sm text-bone-muted">
          Este negocio tiene un solo especialista — cambia cómo se muestra
          la sección Profesionales en la web (foto grande y presentación
          personal en vez de grilla de equipo). No afecta a quién puede
          elegir el cliente al reservar.
        </span>
      </label>

      {singleModeError ? (
        <p className="text-xs text-red-400 mb-4 max-w-md">{singleModeError}</p>
      ) : null}

      {singleMode && activeCount >= 2 ? (
        <p className="text-xs text-amber-400/90 mb-6 max-w-md">
          La web muestra solo a {items.find((p) => p.active)?.name} pero el
          turno sigue dejando elegir entre los {activeCount} profesionales
          activos.
        </p>
      ) : null}

      <div className="divide-y divide-ink-line border-t border-b border-ink-line">
        {items.length === 0 ? (
          <EmptyState
            title="Todavía no hay profesionales cargados."
            hint="Se muestran en la web pública y, si hay 2 o más, tus clientes pueden elegir con quién reservar."
          />
        ) : (
          items.map((professional, index) =>
            editingId === professional.id ? (
              <form
                key={professional.id}
                action={(fd) => handleUpdate(professional.id, fd)}
                className="py-4 grid gap-3"
              >
                <ImageUploadField
                  folder={businessId}
                  label="Foto"
                  name="photo"
                  defaultValue={professional.photo}
                />
                <input
                  name="name"
                  defaultValue={professional.name}
                  required
                  className={adminInputClassesCompact}
                  placeholder="Nombre"
                />
                <input
                  name="role"
                  defaultValue={professional.role}
                  className={adminInputClassesCompact}
                  placeholder="Rol / especialidad (ej: Estilista, Barbero, Colorista)"
                />
                <textarea
                  name="bio"
                  defaultValue={professional.bio}
                  rows={2}
                  className={adminInputClassesCompact}
                  placeholder="Breve trayectoria/especialidad"
                />
                <input
                  name="experience"
                  defaultValue={professional.experience}
                  className={adminInputClassesCompact}
                  placeholder="Experiencia (opcional, ej: 12 años)"
                />

                {services.length > 0 ? (
                  <fieldset className="grid gap-2">
                    {/* Marca que este form SÍ incluye el checklist de
                        servicios — permite a adminUpdateProfessional
                        distinguir "no se tocaron las asignaciones" (este
                        input ausente, ej. el form de "Mi perfil" del
                        Editor rápido, que no muestra este bloque) de "se
                        destildaron todas a propósito" (este input
                        presente, service_ids vacío). */}
                    <input type="hidden" name="service_ids_present" value="1" />
                    <legend className="text-xs text-bone-muted mb-1">
                      Servicios que realiza
                    </legend>
                    <p className="text-[11px] text-bone-muted/70">
                      Si no marcás ninguno, se lo considera disponible para todos.
                    </p>
                    {services.map((service) => (
                      <label
                        key={service.id}
                        className="flex items-center gap-2 text-xs text-bone-muted"
                      >
                        <input
                          type="checkbox"
                          name="service_ids"
                          value={service.id}
                          defaultChecked={professional.service_ids.includes(service.id)}
                        />
                        {service.name}
                      </label>
                    ))}
                  </fieldset>
                ) : null}

                <label className="flex items-center gap-2 text-xs text-bone-muted">
                  <input
                    name="active"
                    type="checkbox"
                    defaultChecked={professional.active}
                  />
                  Activo
                </label>
                <SaveStatus status={updateStatus.status} error={updateStatus.error} />
                <div className="flex gap-3">
                  <button
                    type="submit"
                    disabled={updateStatus.isPending}
                    className="section-eyebrow text-xs px-4 py-2 radius-sm bg-brass text-ink font-semibold w-fit disabled:opacity-50"
                  >
                    {updateStatus.isPending ? "Guardando..." : "Guardar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => select({ category: "profesionales" })}
                    className="section-eyebrow text-xs px-4 py-2 radius-sm border border-ink-line text-bone-muted w-fit"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <div
                key={professional.id}
                className="py-4 flex items-start justify-between gap-4"
              >
                <div className="flex items-start gap-2">
                  <div className="flex flex-col gap-0.5 mt-0.5">
                    <button
                      type="button"
                      disabled={index === 0 || reorderingId === professional.id}
                      onClick={() => handleReorder(professional.id, "up")}
                      aria-label="Subir"
                      className="text-bone-muted hover:text-brass disabled:opacity-30 transition-colors text-[10px] leading-none"
                    >
                <Icon name="chevron" size={16} rotate={180} />
              </button>
                    <button
                      type="button"
                      disabled={index === items.length - 1 || reorderingId === professional.id}
                      onClick={() => handleReorder(professional.id, "down")}
                      aria-label="Bajar"
                      className="text-bone-muted hover:text-brass disabled:opacity-30 transition-colors text-[10px] leading-none"
                    >
                <Icon name="chevron" size={16} />
              </button>
                  </div>
                  <div>
                    <p className="text-bone font-medium">
                      {professional.name}
                      {!professional.active ? (
                        <span className="ml-2 text-xs text-bone-muted">
                          (inactivo)
                        </span>
                      ) : null}
                    </p>
                    {professional.role ? (
                      <p className="text-xs text-bone-muted mt-1">
                        {professional.role}
                      </p>
                    ) : null}
                    {professional.bio ? (
                      <p className="text-sm text-bone-muted mt-1">
                        {professional.bio}
                      </p>
                    ) : null}
                    {professional.service_ids.length > 0 ? (
                      <p className="text-[11px] text-bone-muted/70 mt-1">
                        {professional.service_ids
                          .map((id) => services.find((s) => s.id === id)?.name)
                          .filter(Boolean)
                          .join(" · ")}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex gap-3 shrink-0">
                  <button
                    onClick={() =>
                      select({
                        category: "profesionales",
                        itemId: professional.id,
                      })
                    }
                    className="text-xs text-bone-muted hover:text-brass transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    disabled={deletingId === professional.id}
                    onClick={() => handleDelete(professional.id)}
                    className="text-xs text-bone-muted hover:text-red-400 transition-colors disabled:opacity-50"
                  >
                    {deletingId === professional.id ? "Borrando..." : "Borrar"}
                  </button>
                </div>
              </div>
            )
          )
        )}
      </div>

      <form action={handleCreate} className="mt-6 grid gap-3 max-w-md">
        <p className="section-eyebrow text-bone-muted">Agregar profesional</p>
        <ImageUploadField folder={businessId} label="Foto" name="photo" />
        <input
          name="name"
          required
          className={adminInputClassesCompact}
          placeholder="Nombre"
        />
        <input
          name="role"
          className={adminInputClassesCompact}
          placeholder="Rol / especialidad (ej: Estilista, Barbero, Colorista)"
        />
        <textarea
          name="bio"
          rows={2}
          className={adminInputClassesCompact}
          placeholder="Breve trayectoria/especialidad"
        />
        <input
          name="experience"
          className={adminInputClassesCompact}
          placeholder="Experiencia (opcional, ej: 12 años)"
        />
        {services.length > 0 ? (
          <fieldset className="grid gap-2">
            <legend className="text-xs text-bone-muted mb-1">
              Servicios que realiza
            </legend>
            <p className="text-[11px] text-bone-muted/70">
              Si no marcás ninguno, se lo considera disponible para todos.
            </p>
            {services.map((service) => (
              <label
                key={service.id}
                className="flex items-center gap-2 text-xs text-bone-muted"
              >
                <input type="checkbox" name="service_ids" value={service.id} />
                {service.name}
              </label>
            ))}
          </fieldset>
        ) : null}
        <label className="flex items-center gap-2 text-xs text-bone-muted">
          <input name="active" type="checkbox" defaultChecked />
          Activo
        </label>
        <SaveStatus status={createStatus.status} error={createStatus.error} />
        <button
          type="submit"
          disabled={createStatus.isPending}
          className="section-eyebrow text-xs px-4 py-2.5 radius-sm border border-ink-line text-bone hover:border-brass transition-colors w-fit disabled:opacity-50"
        >
          {createStatus.isPending ? "Agregando..." : "+ Agregar"}
        </button>
      </form>
    </div>
  );
}
