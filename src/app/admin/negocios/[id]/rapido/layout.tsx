import { redirect } from "next/navigation";
import { canManageBusiness, getAdminSession } from "@/lib/admin/session";
import AdminChrome from "@/components/admin/AdminChrome";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

/**
 * Boundary de acceso de `/rapido` — cualquier sesión que pueda gestionar
 * ESTE negocio (dueño, partner con el negocio asignado, o superadmin)
 * entra. Ninguna cuenta ajena al negocio llega más allá de acá.
 *
 * Qué se muestra adentro varía por rol, no acá sino en cada page.tsx:
 * una cuenta "worker" (Barber) ve "Mis turnos" (solo lectura, ver
 * page.tsx); el resto ve "Cambios rápidos" (accesos directos a Servicios/
 * Profesionales/Locales/Fotos/Catálogo/Información, cada uno en su propia
 * sub-ruta — ver quick-changes-hub.tsx). Las 6 sub-rutas de Cambios
 * rápidos vuelven a chequear por su cuenta que la sesión NO sea "worker"
 * (ver require-quick-access.ts) — este layout no alcanza para eso solo,
 * porque no sabe a qué sub-ruta puntual se está entrando.
 */
export default async function QuickEditorLayout({
  children,
  params,
}: LayoutProps) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const { id } = await params;

  if (!(await canManageBusiness(session, id))) redirect("/admin");

  return <AdminChrome>{children}</AdminChrome>;
}
