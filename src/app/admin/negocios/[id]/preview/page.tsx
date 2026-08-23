import { redirect, notFound } from "next/navigation";
import { canManageBusiness, getAdminSession } from "@/lib/admin/session";
import {
  getBusinessById,
  getBusinessProfile,
} from "@/lib/data/business-repository";
import BusinessSite from "@/components/BusinessSite";
import PreviewBridge from "./preview-bridge";

// Siempre datos frescos: esta ruta se usa como preview en vivo dentro del
// editor, no tiene sentido servir una versión cacheada.
export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Vista embebida en un <iframe> dentro del editor (`EditorShell` /
 * `PreviewPane`). Mismo guard de sesión que la página del editor —
 * nadie que no pueda administrar este negocio puede cargarla, ni por URL
 * directa. Renderiza el mismo árbol que la web pública (`BusinessSite`)
 * con datos reales, envuelto en `data-editor-preview` para que el CSS de
 * hover/click de los elementos editables (globals.css) se active solo acá
 * y nunca en el sitio público real.
 */
export default async function BusinessPreviewPage({ params }: PageProps) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const { id } = await params;
  if (!(await canManageBusiness(session, id))) redirect("/admin");

  const business = await getBusinessById(id);
  if (!business) notFound();

  const profile = await getBusinessProfile(business.slug);
  if (!profile) notFound();

  return (
    <div data-editor-preview>
      <BusinessSite profile={profile} slug={business.slug} />
      <PreviewBridge />
    </div>
  );
}
