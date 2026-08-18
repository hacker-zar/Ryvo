"use client";

import { adminUpdateClientNotes } from "@/lib/admin/actions";
import { useAsyncStatus } from "@/lib/useAsyncStatus";
import { adminInputClasses } from "@/lib/ui-classes";
import SaveStatus from "@/components/ui/SaveStatus";

interface ClientNotesFormProps {
  businessId: string;
  clientId: string;
  notes: string;
}

/** Notas/preferencias del cliente — lo único editable de la ficha (el
 *  resto se arma solo a partir de las reservas). Mismo patrón
 *  useAsyncStatus/SaveStatus que el resto del admin. */
export default function ClientNotesForm({
  businessId,
  clientId,
  notes,
}: ClientNotesFormProps) {
  const { status, error, run, isPending } = useAsyncStatus();

  async function handleSubmit(formData: FormData) {
    await run(() => adminUpdateClientNotes(businessId, clientId, formData));
  }

  return (
    <form action={handleSubmit} className="grid gap-3 max-w-lg">
      <textarea
        name="notes"
        defaultValue={notes}
        rows={4}
        placeholder="Preferencias, alergias, lo que sea útil recordar la próxima vez que venga."
        className={adminInputClasses}
      />
      <SaveStatus status={status} error={error} />
      <button
        type="submit"
        disabled={isPending}
        className="section-eyebrow text-xs px-4 py-2.5 rounded-sm bg-brass text-ink font-semibold w-fit disabled:opacity-50"
      >
        {isPending ? "Guardando..." : "Guardar notas"}
      </button>
    </form>
  );
}
