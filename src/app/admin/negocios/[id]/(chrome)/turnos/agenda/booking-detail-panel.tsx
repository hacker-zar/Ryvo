"use client";

import Icon from "@/components/ui/Icon";
import { useEffect, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { BookingWithDetails } from "@/lib/data/business-repository";
import { ClientProfile, Location, ProfessionalWithServices } from "@/types/business";
import { adminGetClientProfile, adminUpdateBookingStatus } from "@/lib/admin/actions";
import { whatsappLink } from "@/lib/format";
import { minutesToTime, timeToMinutes } from "@/lib/agenda";
import { STATUS_COLOR, STATUS_LABELS, isPastBooking } from "../booking-status";
import ReschedulePanel from "./reschedule-panel";

interface BookingDetailPanelProps {
  businessId: string;
  booking: BookingWithDetails;
  professionals: ProfessionalWithServices[];
  locations: Location[];
  today: string;
  nowTime: string;
  onClose: () => void;
}

function formatDateLong(dateStr: string): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  const date = new Date(y, m - 1, d);
  return date.toLocaleDateString("es-AR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-xs text-bone-muted">{label}</dt>
      <dd className="text-sm text-bone mt-0.5">{value}</dd>
    </div>
  );
}

function ActionButton({
  onClick,
  disabled,
  danger,
  children,
}: {
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`section-eyebrow text-xs px-4 py-2.5 radius-sm border transition-colors disabled:opacity-50 ${
        danger
          ? "border-ink-line text-bone-muted hover:text-red-400 hover:border-red-400"
          : "border-ink-line text-bone hover:border-brass"
      }`}
    >
      {children}
    </button>
  );
}

/**
 * Panel lateral de un turno — cliente/servicio/profesional/fecha/hora/
 * duración/estado + acciones válidas para ESE estado. Todas las acciones
 * llaman Server Actions ya existentes (adminUpdateBookingStatus) o
 * extendidas mínimamente (adminRescheduleBooking, ver reschedule-panel) —
 * nada nuevo se inventa acá.
 */
export default function BookingDetailPanel({
  businessId,
  booking,
  professionals,
  locations,
  today,
  nowTime,
  onClose,
}: BookingDetailPanelProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [showReschedule, setShowReschedule] = useState(false);

  // Mismo patrón "key vs. resultado" que ReschedulePanel/StepDateTime en
  // vez de un booleano `loading` seteado a mano al principio del efecto
  // (dispara renders en cascada) — `loadingClient` se DERIVA de comparar
  // para qué client_id es el resultado ya cargado, el efecto solo llama
  // setState adentro del callback async.
  const [clientResult, setClientResult] = useState<{
    clientId: string;
    profile: ClientProfile | null;
  } | null>(null);
  const loadingClient =
    booking.client_id !== null &&
    booking.client_id !== undefined &&
    clientResult?.clientId !== booking.client_id;
  const clientProfile =
    clientResult && clientResult.clientId === booking.client_id
      ? clientResult.profile
      : null;

  useEffect(() => {
    if (!booking.client_id) return;
    const clientId = booking.client_id;
    let cancelled = false;
    adminGetClientProfile(businessId, clientId).then((result) => {
      if (cancelled) return;
      setClientResult({ clientId, profile: result.success ? result.profile : null });
    });
    return () => {
      cancelled = true;
    };
  }, [businessId, booking.client_id]);

  function handleStatusChange(
    status: "confirmed" | "completed" | "cancelled" | "no_show"
  ) {
    startTransition(async () => {
      await adminUpdateBookingStatus(businessId, booking.id, status);
      router.refresh();
      onClose();
    });
  }

  const past = isPastBooking(booking, today, nowTime);
  const endTime = minutesToTime(
    timeToMinutes(booking.time.slice(0, 5)) + booking.duration_min
  );
  const canReschedule =
    !past && (booking.status === "pending" || booking.status === "confirmed");
  const canCancel =
    !past && (booking.status === "pending" || booking.status === "confirmed");
  const canConfirm = !past && booking.status === "pending";
  const canResolvePast =
    past && (booking.status === "pending" || booking.status === "confirmed");

  return (
    <div className="fixed inset-0 z-[100] flex justify-end" role="dialog" aria-modal="true">
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-black/60 anim-fade"
      />

      <div className="relative w-full sm:max-w-sm h-full bg-ink border-l border-ink-line overflow-y-auto p-5 anim-slide-up">
        <button
          type="button"
          onClick={onClose}
          aria-label="Cerrar"
          className="text-bone-muted hover:text-bone transition-colors float-right"
        >
          <Icon name="close" size={20} />
        </button>

        {showReschedule ? (
          <ReschedulePanel
            businessId={businessId}
            booking={booking}
            professionals={professionals}
            locations={locations}
            onCancel={() => setShowReschedule(false)}
            onDone={() => {
              router.refresh();
              onClose();
            }}
          />
        ) : (
          <>
            <p className="section-eyebrow text-brass">Turno</p>
            <h3 className="section-title mt-1 text-lg text-bone pr-6">
              {booking.customer_name}
            </h3>
            <div className="mt-2 flex items-center gap-2">
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full shrink-0"
                style={{ backgroundColor: STATUS_COLOR[booking.status] }}
              />
              <span className="text-xs text-bone-muted">
                {STATUS_LABELS[booking.status]}
              </span>
            </div>

            <dl className="mt-5 grid grid-cols-2 gap-4">
              <Row label="Servicio" value={booking.service_name} />
              <Row label="Profesional" value={booking.professional_name ?? "Sin asignar"} />
              <Row label="Fecha" value={formatDateLong(booking.date)} />
              <Row label="Hora" value={`${booking.time.slice(0, 5)} – ${endTime}`} />
              <Row label="Duración" value={`${booking.duration_min} min`} />
              <Row label="Teléfono" value={booking.customer_phone} />
            </dl>

            {booking.client_id ? (
              <div className="mt-5 radius-sm border border-ink-line p-3">
                {loadingClient ? (
                  <p className="text-xs text-bone-muted">Buscando cliente...</p>
                ) : clientProfile ? (
                  <div className="grid gap-1 text-xs text-bone-muted">
                    <p>
                      Última visita:{" "}
                      {clientProfile.last_visit
                        ? formatDateLong(clientProfile.last_visit)
                        : "esta es la primera"}
                    </p>
                    <p>
                      Visitas totales: {clientProfile.visit_count}
                    </p>
                  </div>
                ) : null}
                <Link
                  href={`/admin/negocios/${businessId}/clientes/${booking.client_id}`}
                  className="section-eyebrow text-xs text-brass mt-2 inline-block hover:opacity-80 transition-opacity"
                >
                  Ver cliente
                  <Icon name="arrow" size={16} className="shrink-0" />
                </Link>
              </div>
            ) : null}

            <div className="mt-6 grid gap-2">
              {canConfirm ? (
                <ActionButton onClick={() => handleStatusChange("confirmed")} disabled={isPending}>
                  Confirmar
                </ActionButton>
              ) : null}
              {canResolvePast ? (
                <>
                  <ActionButton onClick={() => handleStatusChange("completed")} disabled={isPending}>
                    Completar
                  </ActionButton>
                  <ActionButton onClick={() => handleStatusChange("no_show")} disabled={isPending}>
                    No asistió
                  </ActionButton>
                </>
              ) : null}
              {canReschedule ? (
                <ActionButton onClick={() => setShowReschedule(true)} disabled={isPending}>
                  Reprogramar
                </ActionButton>
              ) : null}
              {canCancel ? (
                <ActionButton danger onClick={() => handleStatusChange("cancelled")} disabled={isPending}>
                  Cancelar
                </ActionButton>
              ) : null}
              <a
                href={whatsappLink(
                  booking.customer_phone,
                  `Hola ${booking.customer_name}! Te escribo por tu turno de ${booking.service_name}.`
                )}
                target="_blank"
                rel="noopener noreferrer"
                className="section-eyebrow text-xs px-4 py-2.5 radius-sm border border-ink-line text-bone-muted hover:text-brass hover:border-brass transition-colors text-center"
              >
                Contactar por WhatsApp
              </a>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
