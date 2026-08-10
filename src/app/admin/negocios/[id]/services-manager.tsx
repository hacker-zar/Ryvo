"use client";

import { useState } from "react";
import { Service } from "@/types/business";
import { formatPrice } from "@/lib/format";
import {
  adminCreateService,
  adminDeleteService,
  adminUpdateService,
} from "@/lib/admin/actions";

const inputClasses =
  "rounded-sm border border-ink-line bg-ink-elevated px-3 py-2 text-sm text-bone placeholder:text-bone-muted/60 focus:outline-none focus:border-brass transition-colors";

interface ServicesManagerProps {
  businessId: string;
  services: Service[];
}

export default function ServicesManager({
  businessId,
  services,
}: ServicesManagerProps) {
  const [items, setItems] = useState(services);
  const [editingId, setEditingId] = useState<string | null>(null);

  async function handleCreate(formData: FormData) {
    const result = await adminCreateService(businessId, formData);
    if (result.success) {
      // Refrescamos la página para traer el nuevo registro con su id real.
      window.location.reload();
    }
  }

  async function handleUpdate(serviceId: string, formData: FormData) {
    const result = await adminUpdateService(businessId, serviceId, formData);
    if (result.success) {
      setEditingId(null);
      window.location.reload();
    }
  }

  async function handleDelete(serviceId: string) {
    if (!confirm("¿Borrar este servicio?")) return;
    const result = await adminDeleteService(businessId, serviceId);
    if (result.success) {
      setItems((prev) => prev.filter((s) => s.id !== serviceId));
    }
  }

  return (
    <div className="mt-6">
      <div className="divide-y divide-ink-line border-t border-b border-ink-line">
        {items.length === 0 ? (
          <p className="py-6 text-sm text-bone-muted">
            Todavía no hay servicios cargados.
          </p>
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
                  className={inputClasses}
                  placeholder="Nombre"
                />
                <textarea
                  name="description"
                  defaultValue={service.description}
                  rows={2}
                  className={inputClasses}
                  placeholder="Descripción"
                />
                <div className="grid grid-cols-3 gap-3">
                  <input
                    name="price"
                    type="number"
                    step="1"
                    min="0"
                    defaultValue={service.price}
                    className={inputClasses}
                    placeholder="Precio"
                  />
                  <input
                    name="duration"
                    type="number"
                    step="5"
                    min="5"
                    defaultValue={service.duration}
                    className={inputClasses}
                    placeholder="Duración (min)"
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
                <div className="flex gap-3">
                  <button
                    type="submit"
                    className="section-eyebrow text-xs px-4 py-2 rounded-sm bg-brass text-ink font-semibold w-fit"
                  >
                    Guardar
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingId(null)}
                    className="section-eyebrow text-xs px-4 py-2 rounded-sm border border-ink-line text-bone-muted w-fit"
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
                    {formatPrice(service.price)} · {service.duration} min
                  </p>
                </div>
                <div className="flex gap-3 shrink-0">
                  <button
                    onClick={() => setEditingId(service.id)}
                    className="text-xs text-bone-muted hover:text-brass transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(service.id)}
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
        <p className="section-eyebrow text-bone-muted">Agregar servicio</p>
        <input
          name="name"
          required
          className={inputClasses}
          placeholder="Nombre"
        />
        <textarea
          name="description"
          rows={2}
          className={inputClasses}
          placeholder="Descripción"
        />
        <div className="grid grid-cols-2 gap-3">
          <input
            name="price"
            type="number"
            step="1"
            min="0"
            required
            className={inputClasses}
            placeholder="Precio"
          />
          <input
            name="duration"
            type="number"
            step="5"
            min="5"
            defaultValue={30}
            required
            className={inputClasses}
            placeholder="Duración (min)"
          />
        </div>
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
