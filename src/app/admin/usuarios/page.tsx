import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";
import { listAllAccounts } from "@/lib/data/accounts-repository";
import { listBusinesses } from "@/lib/data/business-repository";
import AdminChrome from "@/components/admin/AdminChrome";
import UsersPanel from "./users-panel";

/**
 * Vista global de RYVO — exclusiva de superadmin (`session.role === "super"`,
 * el único rol con acceso a cualquier dato de cualquier negocio). Reutiliza
 * `listAllAccounts`/`listBusinesses` (ya existían para /admin y
 * account-manager.tsx) en vez de un endpoint/paginado nuevo — dataset chico
 * hoy, no hace falta más que esto.
 */
export default async function UsersPage() {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");
  if (session.role !== "super") redirect("/admin");

  const [accounts, businesses] = await Promise.all([
    listAllAccounts(),
    listBusinesses(),
  ]);

  return (
    <AdminChrome>
      <p className="section-eyebrow text-brass">RYVO</p>
      <h1 className="section-title mt-2 text-2xl text-bone">
        Usuarios y partners
      </h1>
      <p className="text-xs text-bone-muted mt-1 mb-8 max-w-md">
        Todas las cuentas de la plataforma: dueños y Barbers de cada
        negocio, más los Partners y los negocios que tienen asignados.
      </p>

      <UsersPanel accounts={accounts} businesses={businesses} />
    </AdminChrome>
  );
}
