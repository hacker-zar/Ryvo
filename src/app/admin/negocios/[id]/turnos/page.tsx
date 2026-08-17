import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { canManageBusiness, getAdminSession } from "@/lib/admin/session";
import {
  getBusinessById,
  listBookingsByBusiness,
} from "@/lib/data/business-repository";
import { isSupabaseConfigured } from "@/lib/supabase";
import AdminChrome from "@/components/admin/AdminChrome";
import BookingsList from "./bookings-list";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ date?: string }>;
}

export default async function AdminBookingsPage({
  params,
  searchParams,
}: PageProps) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const { id } = await params;
  if (!canManageBusiness(session, id)) redirect("/admin");

  const { date } = await searchParams;

  const business = await getBusinessById(id);
  if (!business) notFound();

  const bookings = await listBookingsByBusiness(id, date);

  return (
    <AdminChrome>
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

      {!isSupabaseConfigured ? (
        <div className="mt-6 rounded-sm border border-brass/40 bg-ink-elevated p-4 text-sm text-bone-muted">
          Supabase no está configurado: no hay turnos reales para mostrar en
          modo demo.
        </div>
      ) : (
        <BookingsList businessId={id} bookings={bookings} selectedDate={date} />
      )}
    </AdminChrome>
  );
}
