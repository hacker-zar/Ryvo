import { redirect, notFound } from "next/navigation";
import { canManageBusiness, getAdminSession } from "@/lib/admin/session";
import { getBusinessById } from "@/lib/data/business-repository";
import AdminChrome from "@/components/admin/AdminChrome";

interface LayoutProps {
  children: React.ReactNode;
  params: Promise<{ id: string }>;
}

/**
 * Layout compartido por las 6 pantallas de un negocio (Editor, Turnos,
 * Clientes, Estadísticas, Oportunidades, Configuración). Antes cada una
 * repetía su propio chequeo de sesión + fetch de negocio + <AdminChrome>
 * — no solo era código duplicado, sino que Next.js trataba cada
 * navegación entre ellas como una página completamente nueva sin nada en
 * común, en vez de aprovechar que el "chrome" no cambia. `getBusinessById`
 * está envuelto en `cache()` (ver business-repository.ts), así que aunque
 * cada page.tsx siga pidiendo `business` para lo que necesita mostrar, es
 * como máximo una consulta real a Supabase por navegación, no dos.
 */
export default async function BusinessLayout({ children, params }: LayoutProps) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const { id } = await params;

  // Un dueño solo puede ver/editar SU negocio — si el id no es el suyo, lo
  // mandamos a /admin (que a un dueño lo rebota directo a su propia
  // página), en vez de mostrar un error que confirme si ese id existe.
  if (!canManageBusiness(session, id)) redirect("/admin");

  // Ninguna de las 6 pantallas de acá abajo (Editor completo, Turnos,
  // Clientes, Estadísticas, Oportunidades, Configuración) es alcanzable
  // por una cuenta "worker" (Editor rápido) — ni por navegación ni por
  // URL directa, sea cual sea la pantalla. Boundary estructural, un solo
  // lugar: no depende de que cada page.tsx se acuerde de chequearlo.
  if (session.role === "owner" && session.accountRole === "worker") {
    redirect(`/admin/negocios/${id}/rapido`);
  }

  const business = await getBusinessById(id);
  if (!business) notFound();

  return <AdminChrome>{children}</AdminChrome>;
}
