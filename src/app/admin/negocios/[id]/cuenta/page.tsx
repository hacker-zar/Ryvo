import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { canManageBusiness, getAdminSession } from "@/lib/admin/session";
import { getBusinessById } from "@/lib/data/business-repository";
import { listAccountsByBusiness } from "@/lib/data/accounts-repository";
import AdminChrome from "@/components/admin/AdminChrome";
import AccountManager from "../account-manager";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Separada del editor de negocio a propósito: la cuenta (usuario +
 * contraseña de acceso) no es contenido del sitio del negocio, es
 * configuración de acceso al panel — no debe vivir mezclada con
 * Información/Servicios/etc.
 */
export default async function AccountPage({ params }: PageProps) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const { id } = await params;
  if (!canManageBusiness(session, id)) redirect("/admin");

  const business = await getBusinessById(id);
  if (!business) notFound();

  const accounts = await listAccountsByBusiness(id);

  return (
    <AdminChrome>
      <Link
        href={`/admin/negocios/${id}`}
        className="section-eyebrow text-xs text-bone-muted hover:text-brass transition-colors"
      >
        ← Volver al editor
      </Link>

      <p className="section-eyebrow text-brass mt-6">Acceso</p>
      <h1 className="section-title mt-2 text-2xl text-bone">Cuenta</h1>
      <p className="text-xs text-bone-muted mt-2 max-w-md">
        Con esta cuenta el dueño de {business.name} entra directo a este
        panel — sin ver otros negocios.
      </p>

      <div className="mt-8">
        <AccountManager businessId={business.id} accounts={accounts} />
      </div>
    </AdminChrome>
  );
}
