import { redirect } from "next/navigation";
import { canManageBusiness, getAdminSession } from "@/lib/admin/session";
import { getBusinessIdBySlug } from "@/lib/data/business-repository";
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
      if (canManageBusiness(session, business.id)) {
        redirect(`/admin/negocios/${business.id}`);
      }
      // Sesión válida pero de otro negocio/rol: se queda en el form para
      // loguearse de nuevo, esta vez contra el negocio pedido.
    } else if (session.role === "super") {
      redirect("/admin");
    }
  }

  return (
    <main className="flex-1 flex items-center justify-center px-4 bg-ink min-h-screen">
      <div className="w-full max-w-sm">
        <p className="section-eyebrow text-brass text-center">
          Administración
        </p>
        <h1 className="section-title mt-2 text-xl text-bone text-center">
          {business ? `Ingresar a ${business.name}` : "Ingresar"}
        </h1>
        <LoginForm businessSlug={businessSlug} />
      </div>
    </main>
  );
}
