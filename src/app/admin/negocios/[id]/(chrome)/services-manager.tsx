"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Service } from "@/types/business";
import { formatPrice } from "@/lib/format";
import {
  adminCreateService,
  adminDeleteService,
  adminUpdateService,
} from "@/lib/admin/actions";
import { useEditorSelection } from "@/lib/admin/editor-selection-context";
import { useAsyncStatus } from "@/lib/useAsyncStatus";
import { adminInputClassesCompact } from "@/lib/ui-classes";
import SaveStatus from "@/components/ui/SaveStatus";
import EmptyState from "@/components/ui/EmptyState";

interface ServicesManagerProps {
  businessId: string;
  services: Service[];
}

export default function ServicesManager({
  businessId,
  services,
}: ServicesManagerProps) {
  const router = useRouter();
  const { target, select, refreshPreview } = useEditorSelection();
  const [items, setItems] = useState(services);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const editingId =
    target?.category === "servicios" ? target.itemId ?? null : null;

  const createStatus = useAsyncStatus();
  const updateStatus = useAsyncStatus();

  async function handleCreate(formData: FormData) {
    const result = await createStatus.run(() =>
      adminCreateService(businessId, formData)
    );
    if (result.success) {
      router.refresh();
      refreshPreview();
    }
  }

  async function handleUpdate(serviceId: string, formData: FormData) {
    const result = await updateStatus.run(() =>
      adminUpdateService(businessId, serviceId, formData)
    );
    if (result.success) {
      select({ category: "servicios" });
      router.refresh();
      refreshPreview();
    }
  }

  async function handleDelete(serviceId: string) {
    if (!confirm("¿Borrar este servicio?")) return;
    setDeletingId(serviceId);
    const result = await adminDeleteService(businessId, serviceId);
    setDeletingId(null);
    if (result.success) {
      setItems((prev) => prev.filter((s) => s.id !== serviceId));
      refreshPreview();
    }
  }

  return (
    <div className="mt-6">
      <div className="divide-y divide-ink-line border-t border-b border-ink-line">
        {items.length === 0 ? (
          <EmptyState
            title="Todavía no hay servicios cargados."
            hint="Agregá al menos uno abajo para que tus clientes puedan reservar."
          />
        ) : (
          items.map((service) =>
            editingId === service.id ? (
              <form
                key={service.id}
                action={(fd) => handleUpdate(service.id, fd)}
                className="py-4 grid gap-3"
              >
                <input
                  name="name"
                  defaultValue={service.name}
                  required
                  className={adminInputClassesCompact}
                  placeholder="Nombre"
                />
                <textarea
                  name="description"
                  defaultValue={service.description}
                  rows={2}
                  className={adminInputClassesCompact}
                  placeholder="Descripción"
                />
                <div className="grid grid-cols-3 gap-3">
                  <input
                    name="price"
                    type="number"
                    step="1"
                    min="0"
                    defaultValue={service.price ?? ""}
                    className={adminInputClassesCompact}
                    placeholder="Precio (opcional)"
                  />
                  <input
                    name="duration"
                    type="number"
                    step="5"
                    min="5"
                    defaultValue={service.duration ?? ""}
                    className={adminInputClassesCompact}
                    placeholder="Duración en min (opcional)"
                  />
                  <label className="flex items-center gap-2 text-xs text-bone-muted">
                    <input
                      name="active"
                      type="checkbox"
                      defaultChecked={service.active}
                    />
                    Activo
                  </label>
                </div>
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
                    onClick={() => select({ category: "servicios" })}
                    className="section-eyebrow text-xs px-4 py-2 radius-sm border border-ink-line text-bone-muted w-fit"
                  >
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <div
                key={service.id}
                className="py-4 flex items-start justify-between gap-4"
              >
                <div>
                  <p className="text-bone font-medium">
                    {service.name}
                    {!service.active ? (
                      <span className="ml-2 text-xs text-bone-muted">
                        (inactivo)
                      </span>
                    ) : null}
                  </p>
                  {service.description ? (
                    <p className="text-sm text-bone-muted mt-1">
                      {service.description}
                    </p>
                  ) : null}
                  <p className="ticket-number text-xs text-bone-muted mt-1">
                    {formatPrice(service.price)}
                    {service.duration != null ? ` · ${service.duration} min` : ""}
                  </p>
                </div>
                <div className="flex gap-3 shrink-0">
                  <button
                    onClick={() =>
                      select({ category: "servicios", itemId: service.id })
                    }
                    className="text-xs text-bone-muted hover:text-brass transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    disabled={deletingId === service.id}
                    onClick={() => handleDelete(service.id)}
                    className="text-xs text-bone-muted hover:text-red-400 transition-colors disabled:opacity-50"
                  >
                    {deletingId === service.id ? "Borrando..." : "Borrar"}
                  </button>
                </div>
              </div>
            )
          )
        )}
      </div>

      <form action={handleCreate} className="mt-6 grid gap-3 max-w-md">
        <p className="section-eyebrow text-bone-muted">Agregar servicio</p>
        <input
          name="name"
          required
          className={adminInputClassesCompact}
          placeholder="Nombre"
        />
        <textarea
          name="description"
          rows={2}
          className={adminInputClassesCompact}
          placeholder="Descripción"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            name="price"
            type="number"
            step="1"
            min="0"
            className={adminInputClassesCompact}
            placeholder="Precio (opcional)"
          />
          <input
            name="duration"
            type="number"
            step="5"
            min="5"
            className={adminInputClassesCompact}
            placeholder="Duración en min (opcional)"
          />
        </div>
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
