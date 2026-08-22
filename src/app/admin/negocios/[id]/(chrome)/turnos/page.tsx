import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getBusinessById,
  listBookingsByBusiness,
  listLocationsByBusiness,
  listProfessionalsByBusiness,
  listServicesByBusiness,
} from "@/lib/data/business-repository";
import { nowTimeString, todayDateString } from "@/lib/format";
import { addDaysToDateString, mondayOfWeek } from "@/lib/agenda";
import { virtualLocationFromBusiness } from "@/lib/availability";
import BookingsList from "./bookings-list";
import AgendaView from "./agenda/agenda-view";
import BusinessNav from "../business-nav";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{
    date?: string;
    view?: string;
    mode?: string;
    prof?: string;
  }>;
}

/**
 * "Agenda" es ahora la vista principal (evolución visual de lo que antes
 * era solo una lista) — la Lista original (`bookings-list.tsx`) sigue
 * intacta y accesible vía `?view=lista`, sin ningún cambio funcional,
 * hasta que QA confirme que la Agenda la cubre por completo (ver el
 * pedido original). Ambas leen los mismos `bookings` reales, nunca datos
 * paralelos.
 */
export default async function AdminBookingsPage({
  params,
  searchParams,
}: PageProps) {
  const [{ id }, sp] = await Promise.all([params, searchParams]);
  const today = todayDateString();
  const view = sp.view === "lista" ? "lista" : "agenda";

  const business = await getBusinessById(id);
  if (!business) notFound();

  const header = (
    <>
      <Link
        href={`/admin/negocios/${id}`}
        className="section-eyebrow text-xs text-bone-muted hover:text-brass transition-colors"
      >
        ← Volver a {business.name}
      </Link>

      <p className="section-eyebrow text-brass mt-6">
        {view === "lista" ? "Turnos" : "Agenda"}
      </p>
      <h1 className="section-title mt-2 text-2xl text-bone">
        {business.name}
      </h1>

      <div className="mt-8">
        <BusinessNav businessId={id} active="turnos" />
      </div>

      <div className="flex gap-2 mt-2">
        <Link
          href={`/admin/negocios/${id}/turnos`}
          className="section-eyebrow text-xs px-3 py-1.5 rounded-sm border transition-colors"
          style={{
            borderColor: view === "agenda" ? "var(--brass)" : "var(--ink-line)",
            color: view === "agenda" ? "var(--brass)" : "var(--bone-muted)",
          }}
        >
          Agenda
        </Link>
        <Link
          href={`/admin/negocios/${id}/turnos?view=lista`}
          className="section-eyebrow text-xs px-3 py-1.5 rounded-sm border transition-colors"
          style={{
            borderColor: view === "lista" ? "var(--brass)" : "var(--ink-line)",
            color: view === "lista" ? "var(--brass)" : "var(--bone-muted)",
          }}
        >
          Lista
        </Link>
      </div>
    </>
  );

  if (view === "lista") {
    // Idéntico al comportamiento histórico — cero cambios funcionales.
    const date = sp.date;
    const viewAll = date === "all";
    const effectiveDate = date === undefined ? today : viewAll ? undefined : date;
    const bookings = await listBookingsByBusiness(id, effectiveDate);

    return (
      <>
        {header}
        <BookingsList
          businessId={id}
          bookings={bookings}
          selectedDate={effectiveDate}
          today={today}
          nowTime={nowTimeString()}
          viewAll={viewAll}
        />
      </>
    );
  }

  const mode = sp.mode === "week" ? "week" : "day";
  const selectedDate = sp.date ?? today;
  const weekStart = mondayOfWeek(selectedDate);
  const weekEnd = addDaysToDateString(weekStart, 6);

  const [bookings, professionals, services, rawLocations] = await Promise.all([
    listBookingsByBusiness(
      id,
      mode === "week" ? { from: weekStart, to: weekEnd } : selectedDate
    ),
    listProfessionalsByBusiness(id),
    listServicesByBusiness(id),
    listLocationsByBusiness(id),
  ]);

  // Mismo fallback que ya usa getBusinessProfile para el sitio público —
  // un negocio sin filas en `locations` opera con un único local virtual
  // armado desde su horario legado (business.opening_hours).
  const locations =
    rawLocations.length > 0 ? rawLocations : [virtualLocationFromBusiness(business)];

  return (
    <>
      {header}
      <AgendaView
        businessId={id}
        businessSlug={business.slug}
        businessName={business.name}
        primaryColor={business.primary_color}
        whatsapp={business.whatsapp}
        today={today}
        nowTime={nowTimeString()}
        selectedDate={selectedDate}
        mode={mode}
        bookings={bookings}
        professionals={professionals}
        services={services}
        locations={locations}
        selectedProfessionalId={sp.prof}
      />
    </>
  );
}
