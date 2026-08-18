import { notFound } from "next/navigation";
import Link from "next/link";
import { getClientProfile } from "@/lib/data/business-repository";
import { formatPrice, whatsappLink } from "@/lib/format";
import { BookingStatus } from "@/types/business";
import ClientNotesForm from "./client-notes-form";

interface PageProps {
  params: Promise<{ id: string; clientId: string }>;
}

const STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Pendiente",
  confirmed: "Confirmado",
  completed: "Completado",
  cancelled: "Cancelado",
  no_show: "No asistió",
};

export default async function ClientProfilePage({ params }: PageProps) {
  const { id, clientId } = await params;

  const profile = await getClientProfile(id, clientId);
  if (!profile) notFound();

  const { client, history } = profile;

  return (
    <>
      <Link
        href={`/admin/negocios/${id}/clientes`}
        className="section-eyebrow text-xs text-bone-muted hover:text-brass transition-colors"
      >
        ← Volver a Clientes
      </Link>

      <p className="section-eyebrow text-brass mt-6">Ficha del cliente</p>
      <h1 className="section-title mt-2 text-2xl text-bone">{client.name}</h1>
      <div className="flex items-center gap-3 flex-wrap mt-2">
        <p className="text-sm text-bone-muted">{client.phone}</p>
        {client.email ? (
          <p className="text-sm text-bone-muted">{client.email}</p>
        ) : null}
        <a
          href={whatsappLink(client.phone)}
          target="_blank"
          rel="noopener noreferrer"
          className="section-eyebrow text-[11px] px-3 py-1 rounded-sm border border-ink-line text-bone hover:border-brass transition-colors"
        >
          WhatsApp
        </a>
      </div>

      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-2xl">
        <Stat label="Visitas" value={String(profile.visit_count)} />
        <Stat
          label="Última visita"
          value={profile.last_visit ? formatDate(profile.last_visit) : "—"}
        />
        <Stat
          label="Gasto acumulado"
          value={formatPrice(profile.total_spent)}
        />
        <Stat
          label="Ticket promedio"
          value={profile.visit_count > 0 ? formatPrice(profile.average_ticket) : "—"}
        />
      </div>

      <div className="mt-6 grid gap-1.5">
        <p className="text-xs text-bone-muted">
          <span className="text-bone-muted/70">Próximo turno: </span>
          {profile.next_appointment
            ? `${formatDate(profile.next_appointment.date)} · ${profile.next_appointment.time.slice(0, 5)} · ${profile.next_appointment.service_name}`
            : "Sin turno agendado"}
        </p>
        <p className="text-xs text-bone-muted">
          <span className="text-bone-muted/70">Servicio favorito: </span>
          {profile.favorite_service ?? "—"}
        </p>
        <p className="text-xs text-bone-muted">
          <span className="text-bone-muted/70">Profesional habitual: </span>
          {profile.usual_professional ?? "—"}
        </p>
      </div>

      <div className="mt-10">
        <p className="section-eyebrow text-bone-muted mb-3">
          Notas y preferencias
        </p>
        <ClientNotesForm
          businessId={id}
          clientId={clientId}
          notes={client.notes ?? ""}
        />
      </div>

      <div className="mt-10">
        <p className="section-eyebrow text-bone-muted mb-3">
          Historial de servicios
        </p>
        {history.length === 0 ? (
          <p className="text-sm text-bone-muted">Todavía no tiene turnos.</p>
        ) : (
          <div className="divide-y divide-ink-line border-t border-b border-ink-line">
            {history.map((item) => (
              <div
                key={item.id}
                className="py-3 flex items-center justify-between gap-4 flex-wrap"
              >
                <div>
                  <p className="text-sm text-bone">
                    {item.service_name}
                    {item.professional_name ? ` · ${item.professional_name}` : ""}
                  </p>
                  <p className="text-xs text-bone-muted mt-0.5">
                    {formatDate(item.date)} · {item.time.slice(0, 5)}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-bone-muted">
                    {STATUS_LABELS[item.status]}
                  </span>
                  <span className="ticket-number text-xs text-bone-muted">
                    {formatPrice(item.price)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="ticket-number text-xl text-brass">{value}</p>
      <p className="text-[11px] text-bone-muted mt-0.5">{label}</p>
    </div>
  );
}

function formatDate(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString("es-AR", {
    day: "numeric",
    month: "short",
  });
}
