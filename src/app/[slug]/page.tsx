import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBusinessProfile } from "@/lib/data/business-repository";
import BusinessSite from "@/components/BusinessSite";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getBusinessProfile(slug);
  if (!profile || profile.business.published === false) return {};

  return {
    title: profile.business.name,
    description: profile.business.description,
  };
}

export default async function BusinessPage({ params }: PageProps) {
  const { slug } = await params;
  const profile = await getBusinessProfile(slug);

  // Un negocio recién creado por registro self-service empieza sin
  // publicar (ver onboarding) — no debe ser visible en su URL pública
  // hasta que el dueño confirme "Publicar". La preview autenticada
  // (/admin/negocios/[id]/preview) no pasa por esta ruta, así que no le
  // aplica este gate — tiene que funcionar antes de publicar.
  if (!profile || profile.business.published === false) notFound();

  return <BusinessSite profile={profile} slug={slug} />;
}
