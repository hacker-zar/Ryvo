import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getBusinessProfile } from "@/lib/data/business-repository";
import { canManageBusiness, getAdminSession } from "@/lib/admin/session";
import BusinessSite from "@/components/BusinessSite";
import PublicSiteAdminBar from "@/components/admin/PublicSiteAdminBar";
import ComingSoon from "./coming-soon";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getBusinessProfile(slug);
  if (!profile) return {};

  // Favicon propio si existe; si no, el logo del negocio; si tampoco hay
  // logo, `icons` queda sin definir y la ruta hereda el ícono global de
  // RYVO (src/app/icon.png) — generateMetadata de un segmento hijo
  // REEMPLAZA (no combina) el campo `icons` heredado, así que definirlo
  // acá alcanza para que sea específico de este negocio sin tocar nada
  // del layout raíz. Se aplica también al negocio sin publicar (mismo
  // `profile` ya cargado en ambos casos).
  const iconUrl = profile.business.favicon || profile.business.logo || undefined;
  const icons = iconUrl ? { icon: iconUrl } : undefined;

  if (profile.business.published === false) {
    return { icons };
  }

  return {
    title: profile.business.name,
    description: profile.business.description,
    icons,
  };
}

export default async function BusinessPage({ params }: PageProps) {
  const { slug } = await params;
  const profile = await getBusinessProfile(slug);

  // Slug que directamente no existe → 404 de RYVO (no hay negocio del
  // cual tomar identidad).
  if (!profile) notFound();

  // Menú de administración: solo se calcula/renderiza si hay sesión
  // autorizada sobre ESTE negocio puntual — sin sesión, o con sesión de
  // otro negocio, la página se comporta exactamente igual que para
  // cualquier visitante (ni se consulta canManageBusiness de más).
  const session = await getAdminSession();
  const isAuthorized = await canManageBusiness(session, profile.business.id);

  const adminBar = isAuthorized ? (
    <PublicSiteAdminBar
      businessId={profile.business.id}
      businessName={profile.business.name}
      slug={slug}
    />
  ) : null;

  // Un negocio creado por registro self-service empieza sin publicar
  // (ver onboarding) — no da 404 (existe, solo no terminó de
  // configurarse) sino una pantalla "próximamente" con su propia marca.
  // La preview autenticada (/admin/negocios/[id]/preview) no pasa por
  // esta ruta, así que no le aplica este gate — tiene que funcionar
  // antes de publicar.
  if (profile.business.published === false) {
    return (
      <>
        {adminBar}
        <div className={isAuthorized ? "pt-9" : undefined}>
          <ComingSoon business={profile.business} />
        </div>
      </>
    );
  }

  return (
    <>
      {adminBar}
      <div className={isAuthorized ? "pt-9" : undefined}>
        <BusinessSite profile={profile} slug={slug} />
      </div>
    </>
  );
}
