import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getAcademyForAdmin,
  getBusinessById,
  listAcademyCategoriesForAdmin,
  listLocationsByBusiness,
  listProfessionalsByBusiness,
} from "@/lib/data/business-repository";
import BusinessNav from "../../business-nav";
import AcademyConfigForm from "./academy-config-form";
import AcademyCategoriesManager from "./academy-categories-manager";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AcademiaConfiguracionPage({ params }: PageProps) {
  const { id } = await params;

  const [business, academy, categories, professionals, locations] = await Promise.all([
    getBusinessById(id),
    getAcademyForAdmin(id),
    listAcademyCategoriesForAdmin(id),
    listProfessionalsByBusiness(id),
    listLocationsByBusiness(id),
  ]);
  if (!business) notFound();

  return (
    <>
      <Link
        href={`/admin/negocios/${id}/academia`}
        className="section-eyebrow text-xs text-bone-muted hover:text-brass transition-colors"
      >
        ← Volver a Academia
      </Link>

      <p className="section-eyebrow text-brass mt-6">Academia</p>
      <h1 className="section-title mt-2 text-2xl text-bone">Configuración</h1>
      <div className="mt-8">
        <BusinessNav businessId={id} active="academia" />
      </div>

      <AcademyConfigForm businessId={id} academy={academy} />

      {academy ? (
        <div className="mt-12">
          <p className="section-eyebrow text-brass">Categorías</p>
          <h2 className="section-title mt-2 text-xl text-bone">Grupos de la academia</h2>
          <AcademyCategoriesManager
            businessId={id}
            categories={categories}
            professionals={professionals}
            locations={locations}
          />
        </div>
      ) : null}
    </>
  );
}
