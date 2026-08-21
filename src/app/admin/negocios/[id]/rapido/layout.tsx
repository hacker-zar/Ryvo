import { redirect, notFound } from "next/navigation";
import { canManageBusiness, getAdminSession } from "@/lib/admin/session";
import { getBusinessById } from "@/lib/data/business-repository";
import AdminChrome from "@/components/admin/AdminChrome";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

/**
 * Boundary de acceso del Editor rápido — exclusivo de cuentas "worker"
 * (Editor rápido, un profesional puntual). Dueño/admin/superadmin que
 * lleguen acá (por link viejo, favorito, etc.) van directo al editor
 * completo — el espejo exacto del redirect que agregamos en
 * `(chrome)/layout.tsx` para el caso inverso. Ninguna página de acá
 * abajo vuelve a chequear esto: es el único lugar.
 */
export default async function QuickEditorLayout({
  children,
  params,
}: LayoutProps) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const { id } = await params;

  if (!canManageBusiness(session, id)) redirect("/admin");

  if (!(session.role === "owner" && session.accountRole === "worker")) {
    redirect(`/admin/negocios/${id}`);
  }

  const business = await getBusinessById(id);
  if (!business) notFound();

  return <AdminChrome>{children}</AdminChrome>;
}
