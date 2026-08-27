"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { PageRequestStatus, PageRequestWithBusiness } from "@/types/business";
import { adminInputClasses } from "@/lib/ui-classes";
import { whatsappLink } from "@/lib/format";
import {
  adminConvertPageRequestToBusiness,
  adminUpdatePageRequestStatus,
} from "@/lib/admin/page-request-actions";
import EmptyState from "@/components/ui/EmptyState";

const STATUS_LABELS: Record<PageRequestStatus, string> = {
  new: "Nueva",
  contacted: "Contactada",
  converted: "Convertida",
  discarded: "Descartada",
};

const STATUS_ORDER: PageRequestStatus[] = ["new", "contacted", "converted", "discarded"];

interface SolicitudesListProps {
  requests: PageRequestWithBusiness[];
}

export default function SolicitudesList({ requests: initialRequests }: SolicitudesListProps) {
  const [requests, setRequests] = useState(initialRequests);
  const [statusFilter, setStatusFilter] = useState<PageRequestStatus | "todos">("todos");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);
  const [errorById, setErrorById] = useState<Record<string, string>>({});
  const [warningById, setWarningById] = useState<Record<string, string>>({});

  const filtered = useMemo(() => {
    if (statusFilter === "todos") return requests;
    return requests.filter((r) => r.status === statusFilter);
  }, [requests, statusFilter]);

  async function handleStatusChange(id: string, status: PageRequestStatus) {
    setPendingId(id);
    setErrorById((e) => ({ ...e, [id]: "" }));
    const previous = requests;
    setRequests((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)));
    const result = await adminUpdatePageRequestStatus(id, status);
    setPendingId(null);
    if (!result.success) {
      setRequests(previous);
      setErrorById((e) => ({ ...e, [id]: result.error ?? "No se pudo actualizar." }));
    }
  }

  async function handleConvert(id: string) {
    setPendingId(id);
    setErrorById((e) => ({ ...e, [id]: "" }));
    const result = await adminConvertPageRequestToBusiness(id);
    setPendingId(null);
    if (result.success) {
      setRequests((rs) =>
        rs.map((r) =>
          r.id === id
            ? {
                ...r,
                status: "converted",
                business_id: result.businessId ?? null,
                // La conversión siempre deja el negocio sin publicar (ver
                // adminConvertPageRequestToBusiness) — optimista, sin
                // esperar el próximo listPageRequests para saberlo.
                business_published: false,
              }
            : r
        )
      );
      if (result.warning) {
        setWarningById((w) => ({ ...w, [id]: result.warning! }));
      }
    } else {
      setErrorById((e) => ({ ...e, [id]: result.error ?? "No se pudo convertir." }));
    }
  }

  return (
    <div>
      <select
        value={statusFilter}
        onChange={(e) => setStatusFilter(e.target.value as PageRequestStatus | "todos")}
        className={adminInputClasses}
      >
        <option value="todos">Todos los estados</option>
        {STATUS_ORDER.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABELS[s]}
          </option>
        ))}
      </select>

      <div className="mt-6 divide-y divide-ink-line border-t border-b border-ink-line">
        {requests.length === 0 ? (
          <EmptyState
            title="Todavía no hay solicitudes."
            hint="En cuanto alguien complete 'Quiero mi página' en la home, va a aparecer acá."
          />
        ) : filtered.length === 0 ? (
          <EmptyState title="Ninguna solicitud coincide con este filtro." />
        ) : (
          filtered.map((request) => {
            const isPending = pendingId === request.id;
            const isExpanded = expandedId === request.id;
            const error = errorById[request.id];
            const warning = warningById[request.id];

            return (
              <div key={request.id} className="py-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-bone font-medium text-sm">{request.business_name}</p>
                    <p className="text-xs text-bone-muted mt-1">
                      {request.owner_name}
                      {request.business_type ? ` · ${request.business_type}` : ""} ·{" "}
                      {request.whatsapp}
                      {request.instagram ? ` · @${request.instagram.replace(/^@/, "")}` : ""}
                    </p>
                    <p className="text-[11px] text-bone-muted/70 mt-1">
                      {new Date(request.created_at).toLocaleDateString("es-AR")}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                    <button
                      type="button"
                      onClick={() => setExpandedId(isExpanded ? null : request.id)}
                      className="section-eyebrow text-xs px-3 py-2 radius-sm border border-ink-line text-bone-muted hover:border-brass hover:text-brass transition-colors"
                    >
                      {isExpanded ? "Ocultar" : "Ver"}
                    </button>

                    {request.status === "converted" ? (
                      <>
                        <span
                          className="section-eyebrow text-xs px-3 py-2 radius-sm border"
                          style={{ borderColor: "var(--ok, var(--brass))", color: "var(--ok, var(--brass))" }}
                        >
                          Negocio creado
                        </span>
                        {request.business_id ? (
                          // Mismo destino en los dos casos: /admin/negocios/[id]
                          // ya decide sola si mostrar el onboarding o el editor
                          // completo según published (ver (chrome)/page.tsx) —
                          // no hay dos rutas distintas que ofrecer, solo texto
                          // distinto según en qué etapa está.
                          <Link
                            href={`/admin/negocios/${request.business_id}`}
                            className="section-eyebrow text-xs px-3 py-2 radius-sm bg-brass text-ink font-semibold hover:opacity-90 transition-opacity"
                          >
                            {request.business_published ? "Ir al negocio →" : "Continuar con la página →"}
                          </Link>
                        ) : null}
                      </>
                    ) : request.status === "discarded" ? (
                      <span className="section-eyebrow text-xs px-3 py-2 radius-sm border border-ink-line text-bone-muted">
                        Descartada
                      </span>
                    ) : (
                      <>
                        <a
                          href={whatsappLink(
                            request.whatsapp,
                            `Hola ${request.owner_name}! Te escribimos de RYVO por tu solicitud para ${request.business_name}.`
                          )}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="section-eyebrow text-xs px-3 py-2 radius-sm border border-ink-line text-bone hover:border-brass transition-colors"
                        >
                          WhatsApp
                        </a>
                        {request.status === "new" ? (
                          <button
                            type="button"
                            disabled={isPending}
                            onClick={() => handleStatusChange(request.id, "contacted")}
                            className="section-eyebrow text-xs px-3 py-2 radius-sm border border-ink-line text-bone hover:border-brass transition-colors disabled:opacity-50"
                          >
                            Contactar
                          </button>
                        ) : null}
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleConvert(request.id)}
                          className="section-eyebrow text-xs px-3 py-2 radius-sm bg-brass text-ink font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
                        >
                          {isPending ? "Convirtiendo..." : "Convertir"}
                        </button>
                        <button
                          type="button"
                          disabled={isPending}
                          onClick={() => handleStatusChange(request.id, "discarded")}
                          className="section-eyebrow text-xs px-3 py-2 radius-sm border border-ink-line text-bone-muted hover:border-red-400 hover:text-red-400 transition-colors disabled:opacity-50"
                        >
                          Descartar
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {isExpanded ? (
                  <div className="mt-3 grid gap-2 text-xs text-bone-muted radius-sm border border-ink-line p-3 max-w-lg">
                    <p>
                      <span className="text-bone">¿Qué quiere?</span>{" "}
                      {request.what_you_want || "—"}
                    </p>
                    <p>
                      <span className="text-bone">Comentarios</span> {request.comments || "—"}
                    </p>
                  </div>
                ) : null}

                {warning ? (
                  <p className="mt-2 text-xs text-brass max-w-lg">
                    Negocio creado, pero: {warning}
                  </p>
                ) : null}
                {error ? <p className="mt-2 text-xs text-red-400 max-w-lg">{error}</p> : null}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
