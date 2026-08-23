"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  AcademyCategoryWithRelations,
  Location,
  OpeningHours,
  ProfessionalWithServices,
} from "@/types/business";
import {
  adminCreateAcademyCategory,
  adminDeleteAcademyCategory,
  adminUpdateAcademyCategory,
} from "@/lib/admin/actions";
import { dayLabel } from "@/lib/format";
import { useAsyncStatus } from "@/lib/useAsyncStatus";
import { adminInputClassesCompact } from "@/lib/ui-classes";
import SaveStatus from "@/components/ui/SaveStatus";
import EmptyState from "@/components/ui/EmptyState";

interface AcademyCategoriesManagerProps {
  businessId: string;
  categories: AcademyCategoryWithRelations[];
  professionals: ProfessionalWithServices[];
  locations: Location[];
}

const DAYS: OpeningHours["day"][] = ["lun", "mar", "mie", "jue", "vie", "sab", "dom"];

interface CategoryFormFields {
  name: string;
  age_level: string;
  description: string;
  days: string[];
  schedule_time: string;
  location_id: string;
  instructor_id: string;
  capacity: string;
  active: boolean;
}

const EMPTY_FORM: CategoryFormFields = {
  name: "",
  age_level: "",
  description: "",
  days: [],
  schedule_time: "",
  location_id: "",
  instructor_id: "",
  capacity: "",
  active: true,
};

function toFormFields(category: AcademyCategoryWithRelations): CategoryFormFields {
  return {
    name: category.name,
    age_level: category.age_level,
    description: category.description,
    days: category.days,
    schedule_time: category.schedule_time,
    location_id: category.location_id ?? "",
    instructor_id: category.instructor_id ?? "",
    capacity: category.capacity != null ? String(category.capacity) : "",
    active: category.active,
  };
}

function buildFormData(fields: CategoryFormFields): FormData {
  const fd = new FormData();
  fd.set("name", fields.name);
  fd.set("age_level", fields.age_level);
  fd.set("description", fields.description);
  fields.days.forEach((d) => fd.append("days", d));
  fd.set("schedule_time", fields.schedule_time);
  fd.set("location_id", fields.location_id);
  fd.set("instructor_id", fields.instructor_id);
  fd.set("capacity", fields.capacity);
  if (fields.active) fd.set("active", "on");
  return fd;
}

/**
 * Mismo patrón inline-edit + "+ Nueva categoría" que ServicesManager/
 * ProfessionalsManager, pero con estado local propio (`editingId`) en vez
 * de EditorSelectionContext — Academia no tiene panel de preview en vivo
 * que coordinar.
 */
export default function AcademyCategoriesManager({
  businessId,
  categories,
  professionals,
  locations,
}: AcademyCategoriesManagerProps) {
  const router = useRouter();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);
  const [newForm, setNewForm] = useState<CategoryFormFields>(EMPTY_FORM);
  const updateStatus = useAsyncStatus();
  const createStatus = useAsyncStatus();

  async function handleUpdate(categoryId: string, fields: CategoryFormFields) {
    const result = await updateStatus.run(() =>
      adminUpdateAcademyCategory(businessId, categoryId, buildFormData(fields))
    );
    if (result.success) {
      setEditingId(null);
      router.refresh();
    }
  }

  async function handleDelete(categoryId: string) {
    if (!confirm("¿Eliminar esta categoría?\n\nEsta acción no se puede deshacer.")) return;
    setDeletingId(categoryId);
    const result = await adminDeleteAcademyCategory(businessId, categoryId);
    setDeletingId(null);
    if (result.success) router.refresh();
  }

  async function handleCreate() {
    const result = await createStatus.run(() =>
      adminCreateAcademyCategory(businessId, buildFormData(newForm))
    );
    if (result.success) {
      setNewForm(EMPTY_FORM);
      setCreating(false);
      router.refresh();
    }
  }

  return (
    <div className="mt-4">
      <div className="divide-y divide-ink-line border-t border-b border-ink-line">
        {categories.length === 0 ? (
          <EmptyState
            title="Todavía no hay categorías cargadas."
            hint="Agregá al menos una abajo — Sub 12, Adultos, lo que corresponda."
          />
        ) : (
          categories.map((category) =>
            editingId === category.id ? (
              <CategoryForm
                key={category.id}
                fields={toFormFields(category)}
                professionals={professionals}
                locations={locations}
                status={updateStatus.status}
                error={updateStatus.error}
                isPending={updateStatus.isPending}
                onCancel={() => setEditingId(null)}
                onSubmit={(fields) => handleUpdate(category.id, fields)}
                submitLabel="Guardar"
              />
            ) : (
              <div key={category.id} className="py-4 flex items-start justify-between gap-4">
                <div>
                  <p className="text-bone font-medium">
                    {category.name}
                    {!category.active ? (
                      <span className="ml-2 text-xs text-bone-muted">(inactiva)</span>
                    ) : null}
                  </p>
                  {category.age_level ? (
                    <p className="text-xs text-bone-muted mt-0.5">{category.age_level}</p>
                  ) : null}
                  <p className="text-xs text-bone-muted mt-1">
                    {[category.days.map((d) => dayLabel(d)).join(", "), category.schedule_time]
                      .filter(Boolean)
                      .join(" — ")}
                  </p>
                  {category.location_name || category.instructor_name ? (
                    <p className="text-xs text-bone-muted mt-1">
                      {[category.location_name, category.instructor_name]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  ) : null}
                </div>
                <div className="flex gap-3 shrink-0">
                  <button
                    onClick={() => setEditingId(category.id)}
                    className="text-xs text-bone-muted hover:text-brass transition-colors"
                  >
                    Editar
                  </button>
                  <button
                    disabled={deletingId === category.id}
                    onClick={() => handleDelete(category.id)}
                    className="text-xs text-bone-muted hover:text-red-400 transition-colors disabled:opacity-50"
                  >
                    {deletingId === category.id ? "Borrando..." : "Borrar"}
                  </button>
                </div>
              </div>
            )
          )
        )}
      </div>

      {creating ? (
        <div className="mt-6 max-w-md">
          <p className="section-eyebrow text-bone-muted mb-3">Nueva categoría</p>
          <CategoryForm
            fields={newForm}
            professionals={professionals}
            locations={locations}
            status={createStatus.status}
            error={createStatus.error}
            isPending={createStatus.isPending}
            onCancel={() => {
              setCreating(false);
              setNewForm(EMPTY_FORM);
            }}
            onSubmit={handleCreate}
            onChange={setNewForm}
            submitLabel="Agregar"
          />
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setCreating(true)}
          className="mt-6 section-eyebrow text-xs px-5 py-3 radius-sm border border-ink-line text-bone hover:border-brass transition-colors"
        >
          + Nueva categoría
        </button>
      )}
    </div>
  );
}

interface CategoryFormProps {
  fields: CategoryFormFields;
  professionals: ProfessionalWithServices[];
  locations: Location[];
  status: ReturnType<typeof useAsyncStatus>["status"];
  error: string;
  isPending: boolean;
  onCancel: () => void;
  onSubmit: (fields: CategoryFormFields) => void;
  /** Solo el form de "Nueva categoría" necesita reportar cambios hacia
   *  arriba (para poder resetearlo desde afuera) — el de edición inline
   *  maneja su propio estado y no necesita este callback. */
  onChange?: (fields: CategoryFormFields) => void;
  submitLabel: string;
}

function CategoryForm({
  fields: initialFields,
  professionals,
  locations,
  status,
  error,
  isPending,
  onCancel,
  onSubmit,
  onChange,
  submitLabel,
}: CategoryFormProps) {
  const [fields, setFields] = useState(initialFields);

  function update(patch: Partial<CategoryFormFields>) {
    const next = { ...fields, ...patch };
    setFields(next);
    onChange?.(next);
  }

  function toggleDay(day: string) {
    const days = fields.days.includes(day)
      ? fields.days.filter((d) => d !== day)
      : [...fields.days, day];
    update({ days });
  }

  return (
    <form
      action={() => onSubmit(fields)}
      className="py-4 grid gap-3 max-w-md"
    >
      <input
        name="name"
        value={fields.name}
        onChange={(e) => update({ name: e.target.value })}
        required
        className={adminInputClassesCompact}
        placeholder="Nombre (ej: Sub 12)"
      />
      <input
        name="age_level"
        value={fields.age_level}
        onChange={(e) => update({ age_level: e.target.value })}
        className={adminInputClassesCompact}
        placeholder="Edad / nivel (opcional)"
      />
      <textarea
        name="description"
        value={fields.description}
        onChange={(e) => update({ description: e.target.value })}
        rows={2}
        className={adminInputClassesCompact}
        placeholder="Descripción (opcional)"
      />

      <div>
        <p className="text-xs text-bone-muted mb-1.5">Días</p>
        <div className="flex flex-wrap gap-2">
          {DAYS.map((day) => (
            <button
              key={day}
              type="button"
              onClick={() => toggleDay(day)}
              className="section-eyebrow text-[10px] px-2.5 py-1.5 radius-sm border transition-colors"
              style={{
                borderColor: fields.days.includes(day) ? "var(--brass)" : "var(--ink-line)",
                color: fields.days.includes(day) ? "var(--brass)" : "var(--bone-muted)",
              }}
            >
              {dayLabel(day)}
            </button>
          ))}
        </div>
      </div>

      <input
        name="schedule_time"
        value={fields.schedule_time}
        onChange={(e) => update({ schedule_time: e.target.value })}
        className={adminInputClassesCompact}
        placeholder="Horario (ej: 18:00 hs)"
      />

      <div className="grid grid-cols-2 gap-3">
        <select
          name="location_id"
          value={fields.location_id}
          onChange={(e) => update({ location_id: e.target.value })}
          className={adminInputClassesCompact}
        >
          <option value="">Sede (opcional)</option>
          {locations.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name}
            </option>
          ))}
        </select>
        <select
          name="instructor_id"
          value={fields.instructor_id}
          onChange={(e) => update({ instructor_id: e.target.value })}
          className={adminInputClassesCompact}
        >
          <option value="">Profesor (opcional)</option>
          {professionals.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-2 gap-3 items-center">
        <input
          name="capacity"
          type="number"
          min="0"
          value={fields.capacity}
          onChange={(e) => update({ capacity: e.target.value })}
          className={adminInputClassesCompact}
          placeholder="Cupos (opcional)"
        />
        <label className="flex items-center gap-2 text-xs text-bone-muted">
          <input
            type="checkbox"
            checked={fields.active}
            onChange={(e) => update({ active: e.target.checked })}
          />
          Activa
        </label>
      </div>

      <SaveStatus status={status} error={error} />
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="section-eyebrow text-xs px-4 py-2 radius-sm bg-brass text-ink font-semibold disabled:opacity-50"
        >
          {isPending ? "Guardando..." : submitLabel}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="section-eyebrow text-xs px-4 py-2 radius-sm border border-ink-line text-bone-muted"
        >
          Cancelar
        </button>
      </div>
    </form>
  );
}
