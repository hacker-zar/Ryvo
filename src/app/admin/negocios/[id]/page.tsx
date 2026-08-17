import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { canManageBusiness, getAdminSession } from "@/lib/admin/session";
import {
  getBusinessById,
  listLocationsByBusiness,
  listProfessionalsByBusiness,
  listServicesByBusiness,
} from "@/lib/data/business-repository";
import AdminChrome from "@/components/admin/AdminChrome";
import EditorShell from "./editor-shell";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminBusinessDetailPage({ params }: PageProps) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const { id } = await params;

  // Un dueño solo puede ver/editar SU negocio — si el id no es el suyo, lo
  // mandamos a /admin (que a un dueño lo rebota directo a su propia
  // página), en vez de mostrar un error que confirme si ese id existe.
  if (!canManageBusiness(session, id)) redirect("/admin");

  const business = await getBusinessById(id);
  if (!business) notFound();

  const services = await listServicesByBusiness(id);
  const locations = await listLocationsByBusiness(id);
  const professionals = await listProfessionalsByBusiness(id);

  return (
    <AdminChrome>
      <Link
        href="/admin"
        className="section-eyebrow text-xs text-bone-muted hover:text-brass transition-colors"
      >
        ← Volver
      </Link>

      <div className="mt-6 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <p className="section-eyebrow text-brass">Editor</p>
          <h1 className="section-title mt-2 text-2xl text-bone">
            {business.name}
          </h1>
          <a
            href={`/${business.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-bone-muted hover:text-brass transition-colors"
          >
            Ver sitio público →
          </a>
        </div>
        <div className="flex gap-4">
          <Link
            href={`/admin/negocios/${business.id}/turnos`}
            className="text-xs text-bone-muted hover:text-brass transition-colors"
          >
            Turnos →
          </Link>
          <Link
            href={`/admin/negocios/${business.id}/cuenta`}
            className="text-xs text-bone-muted hover:text-brass transition-colors"
          >
            Cuenta →
          </Link>
        </div>
      </div>

      <div className="mt-10">
        <EditorShell
          business={business}
          services={services}
          professionals={professionals}
          locations={locations}
        />
      </div>
    </AdminChrome>
  );
}
