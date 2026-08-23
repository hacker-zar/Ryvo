import { notFound } from "next/navigation";
import Link from "next/link";
import { getBusinessById, listProfessionalsByBusiness } from "@/lib/data/business-repository";
import { listAccountsByBusiness } from "@/lib/data/accounts-repository";
import { logoutAdmin } from "@/lib/admin/auth-actions";
import AccountManager from "../account-manager";
import BusinessNav from "../business-nav";

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
  const { id } = await params;

  const [business, accounts, professionals] = await Promise.all([
    getBusinessById(id),
    listAccountsByBusiness(id),
    listProfessionalsByBusiness(id),
  ]);
  if (!business) notFound();

  return (
    <>
      <Link
        href={`/admin/negocios/${id}`}
        className="section-eyebrow text-xs text-bone-muted hover:text-brass transition-colors"
      >
        ← Volver al editor
      </Link>

      <p className="section-eyebrow text-brass mt-6">Configuración</p>
      <h1 className="section-title mt-2 text-2xl text-bone">
        {business.name}
      </h1>

      <div className="mt-8">
        <BusinessNav businessId={business.id} active="cuenta" />
      </div>

      <p className="section-eyebrow text-bone-muted">Acceso</p>
      <p className="text-xs text-bone-muted mt-2 max-w-md">
        Cuentas de acceso a {business.name} — el dueño entra directo al
        editor completo; un Barbero vinculado entra a /rapido, donde solo
        puede ver sus propios turnos.
      </p>

      <div className="mt-6">
        <AccountManager
          businessId={business.id}
          accounts={accounts}
          professionals={professionals}
        />
      </div>

      <div className="mt-12 border-t border-ink-line pt-6">
        <p className="section-eyebrow text-brass">Sesión</p>
        <p className="text-xs text-bone-muted mt-2 max-w-md">
          Para probar con otra cuenta (otro negocio, u otro rol de acceso)
          cerrá esta sesión primero.
        </p>
        <form action={logoutAdmin} className="mt-4">
          <button
            type="submit"
            className="section-eyebrow text-xs px-4 py-2 radius-sm border border-ink-line text-bone hover:border-brass hover:text-brass focus-visible:ring-2 focus-visible:ring-brass/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink transition-colors"
          >
            Cerrar sesión
          </button>
        </form>
      </div>
    </>
  );
}
