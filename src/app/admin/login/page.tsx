import { redirect } from "next/navigation";
import { canManageBusiness, getAdminSession } from "@/lib/admin/session";
import { getBusinessIdBySlug } from "@/lib/data/business-repository";
import { adminThemeDataAttrs, adminThemeStyle } from "@/lib/ui-classes";
import LoginForm from "./login-form";

interface PageProps {
  searchParams: Promise<{ business?: string }>;
}

export default async function AdminLoginPage({ searchParams }: PageProps) {
  const { business: businessSlug } = await searchParams;
  const session = await getAdminSession();

  const business = businessSlug
    ? await getBusinessIdBySlug(businessSlug)
    : null;

  if (session) {
    if (business) {
      if (await canManageBusiness(session, business.id)) {
        redirect(`/admin/negocios/${business.id}`);
      }
      // Sesión válida pero de otra cuenta/negocio: se queda en el form para
      // loguearse de nuevo con la cuenta correcta.
    } else if (session.role === "super" || session.role === "partner") {
      redirect("/admin");
    }
  }

  // El slug (si vino desde "¿Trabajás aquí?") es solo para el título y para
  // que "Cerrar sesión" sepa a qué sitio público volver — nunca se usa para
  // decidir a qué negocio pertenece la cuenta que se loguea. Eso lo
  // determina el server a partir del usuario ingresado.
  return (
    <main
      className="flex-1 flex items-center justify-center px-4 bg-ink min-h-screen"
      style={adminThemeStyle}
      {...adminThemeDataAttrs}
    >
      <div className="w-full max-w-sm">
        <p className="section-eyebrow text-brass text-center">
          Administración
        </p>
        <h1 className="section-title mt-2 text-xl text-bone text-center">
          {business ? `Ingresar a ${business.name}` : "Ingresar"}
        </h1>
        <LoginForm isOwnerLogin={Boolean(business)} businessSlug={businessSlug} />
      </div>
    </main>
  );
}
