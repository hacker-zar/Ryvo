"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Location, OpeningHours } from "@/types/business";
import { dayLabel } from "@/lib/format";
import {
  adminCreateLocation,
  adminDeleteLocation,
  adminUpdateLocation,
} from "@/lib/admin/actions";
import { useEditorSelection } from "@/lib/admin/editor-selection-context";
import WeekScheduleEditor from "@/components/admin/WeekScheduleEditor";

const inputClasses =
  "rounded-sm border border-ink-line bg-ink-elevated px-3 py-2 text-sm text-bone placeholder:text-bone-muted/60 focus:outline-none focus:border-brass transition-colors";

interface LocationsManagerProps {
  businessId: string;
  locations: Location[];
}

interface LocationFormState {
  name: string;
  address: string;
  is_primary: boolean;
  opening_hours: OpeningHours[];
}

const EMPTY_FORM: LocationFormState = {
  name: "",
  address: "",
  is_primary: false,
  opening_hours: [],
};

function summarizeSchedule(hours: OpeningHours[]): string {
  const openDays = hours.filter((h) => !h.closed);
  if (openDays.length === 0) return "Sin horario cargado";
  return openDays
    .map((h) => `${dayLabel(h.day)} ${h.open}–${h.close}`)
    .join(" · ");
}

export default function LocationsManager({
  businessId,
  locations,
}: LocationsManagerProps) {
  const router = useRouter();
  const { refreshPreview } = useEditorSelection();
  const [items, setItems] = useState(locations);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<LocationFormState>(EMPTY_FORM);
  const [newForm, setNewForm] = useState<LocationFormState>(EMPTY_FORM);
  const [creating, setCreating] = useState(false);

  function startEditing(location: Location) {
    setEditingId(location.id);
    setEditForm({
      name: location.name,
      address: location.address,
      is_primary: location.is_primary,
      opening_hours: location.opening_hours,
    });
  }

  async function handleCreate() {
    if (!newForm.name.trim()) return;
    setCreating(true);

    const formData = new FormData();
    formData.set("name", newForm.name);
    formData.set("address", newForm.address);
    if (newForm.is_primary) formData.set("is_primary", "on");
    formData.set("opening_hours", JSON.stringify(newForm.opening_hours));

    const result = await adminCreateLocation(businessId, formData);
    setCreating(false);
    if (result.success) {
      router.refresh();
      refreshPreview();
    }
  }

  async function handleUpdate(locationId: string) {
    const formData = new FormData();
    formData.set("name", editForm.name);
    formData.set("address", editForm.address);
    if (editForm.is_primary) formData.set("is_primary", "on");
    formData.set("opening_hours", JSON.stringify(editForm.opening_hours));

    const result = await adminUpdateLocation(businessId, locationId, formData);
    if (result.success) {
      setEditingId(null);
      router.refresh();
      refreshPreview();
    }
  }

  async function handleDelete(locationId: string) {
    if (!confirm("¿Borrar este local?")) return;
    const result = await adminDeleteLocation(businessId, locationId);
    if (result.success) {
      setItems((prev) => prev.filter((l) => l.id !== locationId));
      refreshPreview();
    }
  }

  return (
    <div className="mt-6">
      <div className="divide-y divide-ink-line border-t border-b border-ink-line">
        {items.length === 0 ? (
          <p className="py-6 text-sm text-bone-muted">
            Todavía no hay locales cargados. Sin al menos uno con horario, no
            se puede reservar turno.
          </p>
        ) : (
          items.map((location) =>
            editingId === location.id ? (
              <div key={location.id} className="py-4 grid gap-3">
                <input
                  value={editForm.name}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, name: e.target.value }))
                  }
                  required
                  className={inputClasses}
                  placeholder="Nombre del local"
                />
                <input
                  value={editForm.address}
                  onChange={(e) =>
                    setEditForm((f) => ({ ...f, address: e.target.value }))
                  }
                  className={inputClasses}
                  placeholder="Dirección"
                />
                <label className="flex items-center gap-2 text-xs text-bone-muted">
                  <input
                    type="checkbox"
                    checked={editForm.is_primary}
                    onChange={(e) =>
                      setEditForm((f) => ({
                        ...f,
                        is_primary: e.target.checked,
                      }))
                    }
                  />
                  Local principal
                </label>

                <p className="section-eyebrow text-bone-muted mt-2">
                  Horario de atención
                </p>
                <WeekScheduleEditor
                  value={editForm.opening_hours}
                  onChange={(next) =>
                    setEditForm((f) => ({ ...f, opening_hours: next }))
                  }
                />

                <div className="flex gap-3 mt-2">
                  <button
                    type="button"
                    onClick={() => handleUpdate(location.id)}
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
              </div>
            ) : (
              <div
                key={location.id}
                className="py-4 flex items-start justify-between gap-4"
              >
                <div>
                  <p className="text-bone font-medium">
                    {location.name}
                    {location.is_primary ? (
                      <span className="ml-2 text-xs text-brass">
                        (principal)
                      </span>
                    ) : null}
                  </p>
                  {location.address ? (
                    <p className="text-sm text-bone-muted mt-1">
                      {location.address}
                    </p>
                  ) : null}
                  <p className="text-xs text-bone-muted mt-1">
                    {summarizeSchedule(location.opening_hours)}
                  </p>
                </div>
                <div className="flex gap-3 shrink-0">
                  <button
                    onClick={() => startEditing(location)}
                    className="text-xs text-bone-muted hover:text-brass transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    onClick={() => handleDelete(location.id)}
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

      <div className="mt-6 grid gap-3 max-w-md">
        <p className="section-eyebrow text-bone-muted">Agregar local</p>
        <input
          value={newForm.name}
          onChange={(e) => setNewForm((f) => ({ ...f, name: e.target.value }))}
          className={inputClasses}
          placeholder="Nombre del local"
        />
        <input
          value={newForm.address}
          onChange={(e) =>
            setNewForm((f) => ({ ...f, address: e.target.value }))
          }
          className={inputClasses}
          placeholder="Dirección"
        />
        <label className="flex items-center gap-2 text-xs text-bone-muted">
          <input
            type="checkbox"
            checked={newForm.is_primary}
            onChange={(e) =>
              setNewForm((f) => ({ ...f, is_primary: e.target.checked }))
            }
          />
          Local principal
        </label>

        <p className="section-eyebrow text-bone-muted mt-2">
          Horario de atención
        </p>
        <WeekScheduleEditor
          value={newForm.opening_hours}
          onChange={(next) =>
            setNewForm((f) => ({ ...f, opening_hours: next }))
          }
        />

        <button
          type="button"
          disabled={creating || !newForm.name.trim()}
          onClick={handleCreate}
          className="section-eyebrow text-xs px-4 py-2.5 rounded-sm border border-ink-line text-bone hover:border-brass transition-colors w-fit disabled:opacity-50"
        >
          {creating ? "Agregando..." : "+ Agregar local"}
        </button>
      </div>
    </div>
  );
}
