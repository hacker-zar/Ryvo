import { notFound, redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";
import {
  getBusinessById,
  listProfessionalsByBusiness,
} from "@/lib/data/business-repository";
import { getMyBookings } from "@/lib/admin/actions";
import MyBookingsList from "./my-bookings-list";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Página única del Editor rápido — el layout (`rapido/layout.tsx`) ya
 * garantizó que la sesión es "worker" (Barber) para este negocio. Acá
 * solo se resuelve a QUÉ profesional (siempre `session.professionalId`,
 * nunca algo de la URL) y se muestran sus propios turnos — de solo
 * lectura, filtrados en el server (ver getMyBookings en actions.ts). Un
 * Barber no tiene ninguna otra herramienta acá: ni servicios, ni
 * galería, ni catálogo, ni su propio perfil (ver plan RBAC).
 */
export default async function QuickEditorPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getAdminSession();
  if (!session || session.role !== "owner" || !session.professionalId) {
    redirect("/admin/login");
  }

  const [business, professionals, bookings] = await Promise.all([
    getBusinessById(id),
    listProfessionalsByBusiness(id),
    getMyBookings(id),
  ]);
  if (!business) notFound();

  const professional = professionals.find((p) => p.id === session.professionalId);
  if (!professional) notFound();

  return (
    <div>
      <p className="section-eyebrow text-brass">Mis turnos</p>
      <h1 className="section-title mt-2 text-2xl text-bone">{professional.name}</h1>
      <p className="text-xs text-bone-muted mt-1 mb-8 max-w-sm">
        Turnos asignados a vos en {business.name}.
      </p>

      <MyBookingsList bookings={bookings} />
    </div>
  );
}
