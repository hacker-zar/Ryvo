import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";
import { listPageRequests } from "@/lib/data/page-requests-repository";
import AdminChrome from "@/components/admin/AdminChrome";
import SolicitudesList from "./solicitudes-list";

/**
 * Solicitudes de página nueva desde la home pública ("Quiero mi
 * página") — exclusiva de superadmin, mismo gate que /admin/usuarios:
 * son leads de RYVO como plataforma, no de un negocio puntual, así que
 * ni owner ni partner tienen nada que ver acá.
 */
export default async function SolicitudesPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (session.role !== "super") redirect("/admin");

  const requests = await listPageRequests();

  return (
    <AdminChrome>
      <p className="section-eyebrow text-brass">RYVO</p>
      <h1 className="section-title mt-2 text-2xl text-bone">Solicitudes</h1>
      <p className="text-xs text-bone-muted mt-1 mb-8 max-w-md">
        Pedidos de &quot;Quiero mi página&quot; desde la home pública —
        todavía no son cuentas ni negocios, solo un lead a contactar.
      </p>

      <SolicitudesList requests={requests} />
    </AdminChrome>
  );
}
