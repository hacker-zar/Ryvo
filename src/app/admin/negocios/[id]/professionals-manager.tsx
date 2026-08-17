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
import ImageUploadField from "@/components/admin/ImageUploadField";

const inputClasses =
  "rounded-sm border border-ink-line bg-ink-elevated px-3 py-2 text-sm text-bone placeholder:text-bone-muted/60 focus:outline-none focus:border-brass transition-colors";

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
  const editingId =
    target?.category === "profesionales" ? target.itemId ?? null : null;

  async function handleCreate(formData: FormData) {
    const result = await adminCreateProfessional(businessId, formData);
    if (result.success) {
      router.refresh();
      refreshPreview();
    }
  }

  async function handleUpdate(professionalId: string, formData: FormData) {
    const result = await adminUpdateProfessional(
      businessId,
      professionalId,
      formData
    );
    if (result.success) {
      select({ category: "profesionales" });
      router.refresh();
      refreshPreview();
    }
  }

  async function handleDelete(professionalId: string) {
    if (!confirm("¿Borrar este profesional?")) return;
    const result = await adminDeleteProfessional(businessId, professionalId);
    if (result.success) {
      setItems((prev) => prev.filter((p) => p.id !== professionalId));
      refreshPreview();
    }
  }

  return (
    <div className="mt-6">
      <div className="divide-y divide-ink-line border-t border-b border-ink-line">
        {items.length === 0 ? (
          <p className="py-6 text-sm text-bone-muted">
            Todavía no hay profesionales cargados.
          </p>
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
                  className={inputClasses}
                  placeholder="Nombre"
                />
                <input
                  name="role"
                  defaultValue={professional.role}
                  className={inputClasses}
                  placeholder="Rol (ej: Estilista, Barbero, Colorista)"
                />
                <textarea
                  name="bio"
                  defaultValue={professional.bio}
                  rows={2}
                  className={inputClasses}
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
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="section-eyebrow text-xs px-4 py-2 rounded-sm bg-brass text-ink font-semibold w-fit"
                  >
                    Guardar
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
                    onClick={() => handleDelete(professional.id)}
                    className="text-xs text-bone-muted hover:text-red-400 transition-colors"
                  >
                    Borrar
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
          className={inputClasses}
          placeholder="Nombre"
        />
        <input
          name="role"
          className={inputClasses}
          placeholder="Rol (ej: Estilista, Barbero, Colorista)"
        />
        <textarea
          name="bio"
          rows={2}
          className={inputClasses}
          placeholder="Breve trayectoria/especialidad"
        />
        <label className="flex items-center gap-2 text-xs text-bone-muted">
          <input name="active" type="checkbox" defaultChecked />
          Activo
        </label>
        <button
          type="submit"
          className="section-eyebrow text-xs px-4 py-2.5 rounded-sm border border-ink-line text-bone hover:border-brass transition-colors w-fit"
        >
          + Agregar
        </button>
      </form>
    </div>
  );
}
