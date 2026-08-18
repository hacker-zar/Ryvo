import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getBusinessById,
  listBookingsByBusiness,
} from "@/lib/data/business-repository";
import { nowTimeString, todayDateString } from "@/lib/format";
import BookingsList from "./bookings-list";
import BusinessNav from "../business-nav";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string }>;
}

export default async function AdminBookingsPage({
  params,
  searchParams,
}: PageProps) {
  const [{ id }, { date }] = await Promise.all([params, searchParams]);
  const today = todayDateString();

  // Sin ?date en la URL: por defecto se muestran los turnos de HOY (lo que
  // el dueño quiere ver primero). ?date=all es el "ver todos" explícito;
  // cualquier otra fecha filtra por ese día puntual.
  const viewAll = date === "all";
  const effectiveDate = date === undefined ? today : viewAll ? undefined : date;

  // No dependen entre sí — business ya viene cacheado por request (el
  // layout lo pidió primero), así que en la práctica esto es 1 consulta
  // real (bookings) en vez de 2 secuenciales.
  const [business, bookings] = await Promise.all([
    getBusinessById(id),
    listBookingsByBusiness(id, effectiveDate),
  ]);
  if (!business) notFound();

  return (
    <>
      <Link
        href={`/admin/negocios/${id}`}
        className="section-eyebrow text-xs text-bone-muted hover:text-brass transition-colors"
      >
        ← Volver a {business.name}
      </Link>

      <p className="section-eyebrow text-brass mt-6">Turnos</p>
      <h1 className="section-title mt-2 text-2xl text-bone">
        {business.name}
      </h1>

      <div className="mt-8">
        <BusinessNav businessId={id} active="turnos" />
      </div>

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
