"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { BookingWithDetails } from "@/lib/data/business-repository";
import { Location, ProfessionalWithServices, Service } from "@/types/business";
import { BookingModalProvider, useBookingModal } from "@/lib/booking-modal-context";
import BookingModalLazy from "@/components/booking/BookingModalLazy";
import { addDaysToDateString, mondayOfWeek } from "@/lib/agenda";
import AgendaDay from "./agenda-day";
import AgendaWeek from "./agenda-week";
import DaySummary from "./day-summary";
import ProfessionalFilter from "./professional-filter";
import BookingDetailPanel from "./booking-detail-panel";
import Icon from "@/components/ui/Icon";

export type AgendaMode = "day" | "week";

interface AgendaViewProps {
  businessId: string;
  businessSlug: string;
  businessName: string;
  primaryColor: string;
  whatsapp: string;
  today: string;
  nowTime: string;
  selectedDate: string;
  mode: AgendaMode;
  bookings: BookingWithDetails[];
  professionals: ProfessionalWithServices[];
  services: Service[];
  locations: Location[];
  selectedProfessionalId?: string;
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

function NewBookingButton({ primaryColor }: { primaryColor: string }) {
  const { open } = useBookingModal();
  return (
    <button
      type="button"
      onClick={open}
      className="section-eyebrow text-xs px-4 py-2.5 radius-sm font-semibold shrink-0 hover:opacity-90 transition-opacity"
      style={{ backgroundColor: primaryColor, color: "var(--ink)" }}
    >
      + Nuevo turno
    </button>
  );
}

/** Reutiliza el wizard público de reserva tal cual (BookingModal no
 *  necesitó NINGÚN cambio interno: ya acepta cualquier
 *  business/slug/services/locations/professionals por props, y
 *  `submitBooking` no asume que quien completa el formulario es el
 *  propio cliente — el dueño puede cargar los datos de un cliente real a
 *  mano). Lo único nuevo es este host: monta el modal con datos del
 *  negocio actual y refresca la Agenda al cerrarlo, para que el turno
 *  recién creado aparezca sin que el dueño tenga que recargar a mano. */
function NewBookingModalHost(props: {
  businessId: string;
  businessName: string;
  primaryColor: string;
  whatsapp: string;
  businessSlug: string;
  services: Service[];
  locations: Location[];
  professionals: ProfessionalWithServices[];
}) {
  const { isOpen } = useBookingModal();
  const router = useRouter();
  const wasOpen = useRef(false);

  useEffect(() => {
    if (wasOpen.current && !isOpen) router.refresh();
    wasOpen.current = isOpen;
  }, [isOpen, router]);

  return (
    <BookingModalLazy
      business={{
        id: props.businessId,
        name: props.businessName,
        primary_color: props.primaryColor,
        whatsapp: props.whatsapp,
      }}
      slug={props.businessSlug}
      services={props.services}
      locations={props.locations}
      professionals={props.professionals}
    />
  );
}

/**
 * Shell de la Agenda: navegación de fecha, toggle Día/Semana, resumen,
 * filtro de profesional y el timeline en sí. Coordina un único estado
 * local (turno seleccionado → panel de detalle) — todo lo demás vive en
 * la URL (fecha/modo/profesional), igual que ya hacía bookings-list.tsx,
 * así que volver atrás/adelante del navegador funciona gratis.
 */
export default function AgendaView({
  businessId,
  businessSlug,
  businessName,
  primaryColor,
  whatsapp,
  today,
  nowTime,
  selectedDate,
  mode,
  bookings,
  professionals,
  services,
  locations,
  selectedProfessionalId,
}: AgendaViewProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [selectedBookingId, setSelectedBookingId] = useState<string | null>(null);

  function navigate(patch: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(patch)) {
      if (value === undefined) params.delete(key);
      else params.set(key, value);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  function goToDate(date: string) {
    navigate({ date: date === today ? undefined : date });
  }

  function goPrev() {
    goToDate(addDaysToDateString(selectedDate, mode === "week" ? -7 : -1));
  }

  function goNext() {
    goToDate(addDaysToDateString(selectedDate, mode === "week" ? 7 : 1));
  }

  const activeProfessionals = professionals.filter((p) => p.active);
  const filteredBookings =
    !selectedProfessionalId || selectedProfessionalId === "all"
      ? bookings
      : bookings.filter((b) => b.professional_id === selectedProfessionalId);

  const selectedBooking =
    bookings.find((b) => b.id === selectedBookingId) ?? null;

  return (
    <BookingModalProvider>
      <div className="mt-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={goPrev}
              aria-label={mode === "week" ? "Semana anterior" : "Día anterior"}
              className="h-11 w-11 radius-sm border border-ink-line text-bone-muted hover:border-brass hover:text-bone transition-colors flex items-center justify-center"
            >
              <Icon name="chevron" size={20} rotate={90} />
            </button>
            <button
              type="button"
              onClick={() => goToDate(today)}
              className="section-eyebrow text-xs px-3 py-1.5 radius-sm border border-ink-line text-bone-muted hover:border-brass hover:text-bone transition-colors"
            >
              Hoy
            </button>
            <button
              type="button"
              onClick={goNext}
              aria-label={mode === "week" ? "Semana siguiente" : "Día siguiente"}
              className="h-11 w-11 radius-sm border border-ink-line text-bone-muted hover:border-brass hover:text-bone transition-colors flex items-center justify-center"
            >
              <Icon name="chevron" size={20} rotate={270} />
            </button>
            <p className="text-sm text-bone-muted capitalize">
              {mode === "day"
                ? formatDateLong(selectedDate)
                : `Semana del ${formatDateLong(mondayOfWeek(selectedDate))}`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => navigate({ mode: undefined })}
                className="section-eyebrow text-xs px-3 py-1.5 radius-sm border transition-colors"
                style={{
                  borderColor: mode === "day" ? "var(--brass)" : "var(--ink-line)",
                  color: mode === "day" ? "var(--brass)" : "var(--bone-muted)",
                }}
              >
                Día
              </button>
              <button
                type="button"
                onClick={() => navigate({ mode: "week" })}
                className="section-eyebrow text-xs px-3 py-1.5 radius-sm border transition-colors"
                style={{
                  borderColor: mode === "week" ? "var(--brass)" : "var(--ink-line)",
                  color: mode === "week" ? "var(--brass)" : "var(--bone-muted)",
                }}
              >
                Semana
              </button>
            </div>
            <NewBookingButton primaryColor={primaryColor} />
          </div>
        </div>

        <div className="mt-5">
          <DaySummary bookings={mode === "day" ? bookings : filteredBookings} />
        </div>

        {activeProfessionals.length > 1 ? (
          <div className="mt-5">
            <ProfessionalFilter
              professionals={activeProfessionals}
              selectedId={selectedProfessionalId ?? "all"}
              onSelect={(profId) =>
                navigate({ prof: profId === "all" ? undefined : profId })
              }
            />
          </div>
        ) : null}

        <div className="mt-6">
          {mode === "day" ? (
            <AgendaDay
              today={today}
              nowTime={nowTime}
              bookings={filteredBookings}
              professionals={
                selectedProfessionalId && selectedProfessionalId !== "all"
                  ? activeProfessionals.filter((p) => p.id === selectedProfessionalId)
                  : activeProfessionals
              }
              locations={locations}
              selectedDate={selectedDate}
              onSelectBooking={setSelectedBookingId}
            />
          ) : (
            <AgendaWeek
              bookings={filteredBookings}
              professionals={
                selectedProfessionalId && selectedProfessionalId !== "all"
                  ? activeProfessionals.filter((p) => p.id === selectedProfessionalId)
                  : activeProfessionals
              }
              weekStartDate={mondayOfWeek(selectedDate)}
              onSelectDay={(date) => {
                navigate({ mode: undefined, date: date === today ? undefined : date });
              }}
            />
          )}
        </div>

        <NewBookingModalHost
          businessId={businessId}
          businessName={businessName}
          primaryColor={primaryColor}
          whatsapp={whatsapp}
          businessSlug={businessSlug}
          services={services}
          locations={locations}
          professionals={professionals}
        />

        {selectedBooking ? (
          <BookingDetailPanel
            // Remonta con cada turno distinto — así el sub-panel de
            // reprogramación y el perfil de cliente cargado nunca quedan
            // pegados de un turno anterior sin necesidad de resetearlos
            // a mano en un efecto.
            key={selectedBooking.id}
            businessId={businessId}
            booking={selectedBooking}
            professionals={professionals}
            locations={locations}
            today={today}
            nowTime={nowTime}
            onClose={() => setSelectedBookingId(null)}
          />
        ) : null}
      </div>
    </BookingModalProvider>
  );
}
