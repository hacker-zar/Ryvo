"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  adminPublishBusiness,
  adminUnpublishBusiness,
} from "@/lib/admin/actions";
import Icon from "@/components/ui/Icon";
import { useConfirm } from "@/lib/useConfirm";

interface PublishToggleProps {
  businessId: string;
  slug: string;
  published: boolean;
}

/**
 * Estado de publicación de la web, visible y reversible desde
 * Configuración.
 *
 * Antes publicar era de ida: `adminPublishBusiness` solo existía dentro
 * del último paso del onboarding y no había ninguna forma de volver
 * atrás desde la interfaz. Un cliente que dejaba de pagar, o una web con
 * datos mal ya indexada, obligaban a entrar a SQL contra producción.
 *
 * Ocultar pide confirmación (deja de ser visible para clientes reales);
 * publicar no, porque es la acción no destructiva.
 */
export default function PublishToggle({
  businessId,
  slug,
  published,
}: PublishToggleProps) {
  const router = useRouter();
  const { ask, dialog } = useConfirm();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  function handleToggle() {
    // Publicar no pide confirmación: es la acción no destructiva.
    if (!published) {
      void applyToggle();
      return;
    }
    ask({
      title: "¿Ocultar tu web?",
      description: `${slug} deja de ser visible: quien entre va a ver una pantalla de “próximamente” y las reservas quedan cerradas. Podés volver a publicarla cuando quieras.`,
      confirmLabel: "Ocultar web",
      onConfirm: applyToggle,
    });
  }

  async function applyToggle() {
    setPending(true);
    setError("");
    const result = published
      ? await adminUnpublishBusiness(businessId)
      : await adminPublishBusiness(businessId);
    setPending(false);

    if (result.success) {
      router.refresh();
      return;
    }
    setError(result.error ?? "No se pudo cambiar el estado de la web.");
  }

  return (
    <div className="radius-sm border border-ink-line p-5 max-w-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-bone font-medium flex items-center gap-2">
            <Icon
              name={published ? "eye" : "close"}
              size={16}
              className={published ? "text-ok shrink-0" : "text-bone-muted shrink-0"}
            />
            {published ? "Publicada" : "Oculta"}
          </p>
          <p className="text-xs text-bone-muted mt-1.5">
            {published
              ? "Cualquiera puede ver la web y reservar turnos."
              : "Quien entre va a ver una pantalla de “próximamente”. Las reservas están cerradas."}
          </p>
        </div>
        <button
          type="button"
          disabled={pending}
          onClick={handleToggle}
          className="section-eyebrow text-xs px-4 py-2.5 radius-sm border border-ink-line text-bone shrink-0 hover:border-brass hover:text-brass transition-colors disabled:opacity-50"
        >
          {pending ? "Guardando…" : published ? "Ocultar" : "Publicar"}
        </button>
      </div>

      {error ? <p className="mt-3 text-xs text-danger">{error}</p> : null}
      {dialog}
    </div>
  );
}
