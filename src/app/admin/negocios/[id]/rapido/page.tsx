import { notFound, redirect } from "next/navigation";
import { canManageBusiness, getAdminSession } from "@/lib/admin/session";
import {
  getBusinessById,
  listProfessionalsByBusiness,
} from "@/lib/data/business-repository";
import { getAccountGoogleLink } from "@/lib/data/accounts-repository";
import { getMyBookings } from "@/lib/admin/actions";
import GoogleLinkPanel from "@/components/admin/GoogleLinkPanel";
import MyBookingsList from "./my-bookings-list";
import QuickChangesHub from "./quick-changes-hub";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Página única de `/rapido` — el layout (`rapido/layout.tsx`) ya
 * garantizó que la sesión puede gestionar este negocio; acá se decide QUÉ
 * mostrar según el rol dentro de él:
 *
 * - "worker" (Barber): "Mis turnos" — solo lectura, filtrada en el server
 *   por `session.professionalId` (nunca algo de la URL). Sin ninguna otra
 *   herramienta: ni servicios, ni fotos, ni catálogo (ver plan RBAC).
 * - Cualquier otra sesión autorizada (dueño, partner con este negocio
 *   asignado, superadmin): "Cambios rápidos" — el hub de tarjetas hacia
 *   las 6 sub-rutas (ver quick-changes-hub.tsx), cada una re-chequeando
 *   por su cuenta que no sea "worker" (ver require-quick-access.ts).
 */
export default async function QuickEditorPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (!(await canManageBusiness(session, id))) redirect("/admin");

  const isWorker = session.role === "owner" && session.accountRole === "worker";

  if (!isWorker) {
    const business = await getBusinessById(id);
    if (!business) notFound();
    return <QuickChangesHub businessId={id} slug={business.slug} />;
  }

  if (!session.professionalId) redirect("/admin/login");

  const [business, professionals, bookings, googleLink] = await Promise.all([
    getBusinessById(id),
    listProfessionalsByBusiness(id),
    getMyBookings(id),
    getAccountGoogleLink(session.accountId),
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

      <div className="mt-12 border-t border-ink-line pt-6">
        <p className="section-eyebrow text-brass mb-4">Mi cuenta</p>
        <GoogleLinkPanel
          linkedEmail={googleLink?.googleEmail ?? null}
          nextPath={`/admin/negocios/${business.id}/rapido`}
        />
      </div>
    </div>
  );
}
