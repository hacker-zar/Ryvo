"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Professional } from "@/types/business";
import {
  adminCreateProfessional,
  adminDeleteProfessional,
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
  professionals: Professional[];
}

export default function ProfessionalsManager({
  businessId,
  professionals,
}: ProfessionalsManagerProps) {
  const router = useRouter();
  const { target, select, refreshPreview } = useEditorSelection();
  const [items, setItems] = useState(professionals);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const editingId =
    target?.category === "profesionales" ? target.itemId ?? null : null;

  const createStatus = useAsyncStatus();
  const updateStatus = useAsyncStatus();

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

  return (
    <div className="mt-6">
      <div className="divide-y divide-ink-line border-t border-b border-ink-line">
        {items.length === 0 ? (
          <EmptyState
            title="Todavía no hay profesionales cargados."
            hint="Se muestran en la web pública como señal de confianza — es opcional."
          />
        ) : (
          items.map((professional) =>
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
                  placeholder="Rol (ej: Estilista, Barbero, Colorista)"
                />
                <textarea
                  name="bio"
                  defaultValue={professional.bio}
                  rows={2}
                  className={adminInputClassesCompact}
                  placeholder="Breve trayectoria/especialidad"
                />
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
                    className="section-eyebrow text-xs px-4 py-2 rounded-sm bg-brass text-ink font-semibold w-fit disabled:opacity-50"
                  >
                    {updateStatus.isPending ? "Guardando..." : "Guardar"}
                  </button>
                  <button
                    type="button"
                    onClick={() => select({ category: "profesionales" })}
                    className="section-eyebrow text-xs px-4 py-2 rounded-sm border border-ink-line text-bone-muted w-fit"
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
          placeholder="Rol (ej: Estilista, Barbero, Colorista)"
        />
        <textarea
          name="bio"
          rows={2}
          className={adminInputClassesCompact}
          placeholder="Breve trayectoria/especialidad"
        />
        <label className="flex items-center gap-2 text-xs text-bone-muted">
          <input name="active" type="checkbox" defaultChecked />
          Activo
        </label>
        <SaveStatus status={createStatus.status} error={createStatus.error} />
        <button
          type="submit"
          disabled={createStatus.isPending}
          className="section-eyebrow text-xs px-4 py-2.5 rounded-sm border border-ink-line text-bone hover:border-brass transition-colors w-fit disabled:opacity-50"
        >
          {createStatus.isPending ? "Agregando..." : "+ Agregar"}
        </button>
      </form>
    </div>
  );
}
