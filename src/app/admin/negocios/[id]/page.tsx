import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { hasValidAdminSession } from "@/lib/admin/session";
import {
  getBusinessById,
  listServicesByBusiness,
} from "@/lib/data/business-repository";
import AdminChrome from "@/components/admin/AdminChrome";
import GalleryUploadField from "@/components/admin/GalleryUploadField";
import BusinessEditForm from "./business-edit-form";
import ServicesManager from "./services-manager";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminBusinessDetailPage({ params }: PageProps) {
  const isLoggedIn = await hasValidAdminSession();
  if (!isLoggedIn) redirect("/admin/login");

  const { id } = await params;
  const business = await getBusinessById(id);
  if (!business) notFound();

  const services = await listServicesByBusiness(id);

  return (
    <AdminChrome>
      <Link
        href="/admin"
        className="section-eyebrow text-xs text-bone-muted hover:text-brass transition-colors"
      >
        ← Volver
      </Link>

      <p className="section-eyebrow text-brass mt-6">Negocio</p>
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
      <br />
      <Link
        href={`/admin/negocios/${business.id}/turnos`}
        className="text-xs text-bone-muted hover:text-brass transition-colors"
      >
        Ver turnos →
      </Link>

      <div className="mt-8">
        <BusinessEditForm business={business} />
      </div>

      <div className="mt-14">
        <p className="section-eyebrow text-brass">Galería</p>
        <h2 className="section-title mt-2 text-xl text-bone">Fotos</h2>
        <div className="mt-6">
          <GalleryUploadField
            businessId={business.id}
            initialImages={business.gallery ?? []}
          />
        </div>
      </div>

      <div className="mt-14">
        <p className="section-eyebrow text-brass">Servicios</p>
        <h2 className="section-title mt-2 text-xl text-bone">
          Servicios y precios
        </h2>
        <ServicesManager businessId={business.id} services={services} />
      </div>
    </AdminChrome>
  );
}
