"use client";

import { useConfirm } from "@/lib/useConfirm";
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
import Icon from "@/components/ui/Icon";

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
  const { ask, dialog } = useConfirm();
  const [items, setItems] = useState(services);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState<{
    serviceId: string;
    message: string;
    canDeactivate: boolean;
  } | null>(null);
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

  /**
   * El servidor es quien decide si este borrado se puede hacer (ver
   * deleteService): un servicio con turnos NO se borra, porque la FK
   * `bookings.service_id` es ON DELETE CASCADE y se llevaría puesto todo
   * el historial y las reservas futuras. Acá no se duplica esa regla —
   * solo se muestra el motivo que devuelve, con la salida real al lado
   * ("Desactivar"), en vez de un error que deja al dueño sin saber qué
   * hacer.
   */
  function handleDelete(serviceId: string) {
    const service = items.find((s) => s.id === serviceId);
    ask({
      title: "¿Borrar este servicio?",
      description: `${
        service ? service.name : "Este servicio"
      } solo se puede borrar si no tiene ningún turno asociado. Si tiene, te vamos a ofrecer desactivarlo. No se puede deshacer.`,
      confirmLabel: "Borrar servicio",
      onConfirm: () => removeService(serviceId),
    });
  }

  async function removeService(serviceId: string) {
    setDeleteError(null);
    setDeletingId(serviceId);
    const result = await adminDeleteService(businessId, serviceId);
    setDeletingId(null);
    if (result.success) {
      setItems((prev) => prev.filter((s) => s.id !== serviceId));
      refreshPreview();
      return;
    }
    setDeleteError({
      serviceId,
      message: result.error ?? "No se pudo borrar el servicio.",
      canDeactivate: Boolean(result.bookingCount),
    });
  }

  /** Alternativa segura al borrado bloqueado: lo saca de la web pública y
   *  del wizard de reserva sin tocar un solo turno. Reusa la misma acción
   *  de edición de siempre, mandando solo `active`. */
  async function handleDeactivate(service: Service) {
    const formData = new FormData();
    formData.set("name", service.name);
    formData.set("description", service.description ?? "");
    formData.set("price", String(service.price ?? ""));
    formData.set("duration", String(service.duration ?? ""));
    // `active` ausente = checkbox destildado, que es como lo lee la acción.
    const result = await adminUpdateService(businessId, service.id, formData);
    if (!result.success) return;
    setItems((prev) =>
      prev.map((s) => (s.id === service.id ? { ...s, active: false } : s))
    );
    setDeleteError(null);
    refreshPreview();
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

                  {deleteError?.serviceId === service.id ? (
                    <div className="mt-3 radius-sm border border-warn/40 bg-warn/10 px-3 py-2.5 max-w-sm">
                      <p className="text-xs text-warn flex items-start gap-1.5">
                        <Icon name="alert" size={16} className="shrink-0 mt-px" />
                        <span>{deleteError.message}</span>
                      </p>
                      {deleteError.canDeactivate ? (
                        <div className="mt-2.5 flex gap-3">
                          <button
                            type="button"
                            onClick={() => handleDeactivate(service)}
                            className="section-eyebrow text-xs text-bone hover:text-brass transition-colors"
                          >
                            Desactivar servicio
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeleteError(null)}
                            className="section-eyebrow text-xs text-bone-muted hover:text-bone transition-colors"
                          >
                            Cancelar
                          </button>
                        </div>
                      ) : null}
                    </div>
                  ) : null}
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
                    className="text-xs text-bone-muted hover:text-danger transition-colors disabled:opacity-50"
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
      {dialog}
    </div>
  );
}
