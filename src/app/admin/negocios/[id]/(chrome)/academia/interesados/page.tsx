import { notFound } from "next/navigation";
import Link from "next/link";
import { getBusinessById, listAcademyInterests } from "@/lib/data/business-repository";
import BusinessNav from "../../business-nav";
import InterestsList from "./interests-list";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AcademiaInteresadosPage({ params }: PageProps) {
  const { id } = await params;

  const [business, interests] = await Promise.all([
    getBusinessById(id),
    listAcademyInterests(id),
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
      <h1 className="section-title mt-2 text-2xl text-bone">Interesados</h1>
      <div className="mt-8">
        <BusinessNav businessId={id} active="academia" />
      </div>

      <InterestsList businessId={id} interests={interests} />
    </>
  );
}
