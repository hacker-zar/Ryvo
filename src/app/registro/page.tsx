import { redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";
import RegistrationWizard from "./registration-wizard";

/**
 * Punto de entrada del registro self-service ("Quiero mi web" en la
 * landing). Toda la lógica de "¿ya está autenticado?" vive acá, en un
 * solo lugar — no se duplica en el CTA de la landing ni en el wizard.
 *
 * Una cuenta "owner" siempre tiene exactamente un negocio (accounts.
 * business_id es NOT NULL) — por eso no hace falta distinguir "tiene
 * negocio incompleto" de "tiene negocio completo" acá: en cualquiera de
 * los dos casos el destino es el mismo, /admin/negocios/[id], que decide
 * internamente si mostrar el onboarding o el editor normal según
 * business.published.
 */
export default async function RegistroPage() {
  const session = await getAdminSession();

  if (session?.role === "owner") {
    redirect(`/admin/negocios/${session.businessId}`);
  }
  if (session?.role === "super") {
    redirect("/admin");
  }

  return (
    <main className="min-h-screen bg-graphite flex items-center justify-center px-4 py-12">
      <RegistrationWizard />
    </main>
  );
}
