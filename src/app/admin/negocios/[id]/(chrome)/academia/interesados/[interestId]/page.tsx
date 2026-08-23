import { notFound } from "next/navigation";
import Link from "next/link";
import { getAcademyInterestById, getBusinessById } from "@/lib/data/business-repository";
import BusinessNav from "../../../business-nav";
import InterestDetail from "./interest-detail";

interface PageProps {
  params: Promise<{ id: string; interestId: string }>;
}

export default async function AcademiaInteresadoPage({ params }: PageProps) {
  const { id, interestId } = await params;

  const [business, interest] = await Promise.all([
    getBusinessById(id),
    getAcademyInterestById(interestId),
  ]);
  if (!business || !interest || interest.business_id !== id) notFound();

  return (
    <>
      <Link
        href={`/admin/negocios/${id}/academia/interesados`}
        className="section-eyebrow text-xs text-bone-muted hover:text-brass transition-colors"
      >
        ← Volver a Interesados
      </Link>

      <p className="section-eyebrow text-brass mt-6">Academia</p>
      <h1 className="section-title mt-2 text-2xl text-bone">{interest.name}</h1>
      <div className="mt-8">
        <BusinessNav businessId={id} active="academia" />
      </div>

      <InterestDetail businessId={id} interest={interest} />
    </>
  );
}
