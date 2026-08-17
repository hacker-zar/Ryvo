import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBusinessProfile } from "@/lib/data/business-repository";
import BusinessSite from "@/components/BusinessSite";
import ComingSoon from "./coming-soon";

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

  // Slug que directamente no existe → 404 de RYVO (no hay negocio del
  // cual tomar identidad).
  if (!profile) notFound();

  // Un negocio creado por registro self-service empieza sin publicar
  // (ver onboarding) — no da 404 (existe, solo no terminó de
  // configurarse) sino una pantalla "próximamente" con su propia marca.
  // La preview autenticada (/admin/negocios/[id]/preview) no pasa por
  // esta ruta, así que no le aplica este gate — tiene que funcionar
  // antes de publicar.
  if (profile.business.published === false) {
    return <ComingSoon business={profile.business} />;
  }

  return <BusinessSite profile={profile} slug={slug} />;
}
