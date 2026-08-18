import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getBusinessById,
  listBookingsByBusiness,
  listBusinessTemplates,
  listLocationsByBusiness,
  listOfficialTemplates,
  listProductsByBusiness,
  listProfessionalsByBusiness,
  listServicesByBusiness,
} from "@/lib/data/business-repository";
import { nowTimeString, todayDateString } from "@/lib/format";
import BusinessNav from "./business-nav";
import EditorShell from "./editor-shell";
import OnboardingChrome from "./onboarding-chrome";
import TodaySummary from "./today-summary";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AdminBusinessDetailPage({ params }: PageProps) {
  const { id } = await params;

  // Las 3 listas no dependen entre sí (solo de `id`, ya conocido) ni de
  // `business` — antes se pedían una tras otra (~1.2s de espera
  // acumulada, medido); en paralelo el tiempo total queda acotado por la
  // más lenta, no por la suma. getBusinessById está cacheado por request
  // (ver business-repository.ts), así que aunque el layout ya lo haya
  // pedido, esta llamada no dispara una segunda consulta real.
  const [
    business,
    services,
    locations,
    professionals,
    products,
    officialTemplates,
    businessTemplates,
  ] = await Promise.all([
    getBusinessById(id),
    listServicesByBusiness(id),
    listLocationsByBusiness(id),
    listProfessionalsByBusiness(id),
    listProductsByBusiness(id),
    listOfficialTemplates(),
    listBusinessTemplates(id),
  ]);
  if (!business) notFound();

  // Un negocio creado por registro self-service arranca sin publicar
  // (ver src/lib/actions/register-business.ts) — hasta que el dueño
  // confirme "Publicar", esta misma página muestra el onboarding en vez
  // del editor normal. Los negocios creados por el superadmin
  // (adminCreateBusiness) nacen publicados y nunca pasan por acá.
  if (business.published === false) {
    return (
      <>
        <p className="section-eyebrow text-brass">Creando tu web</p>
        <h1 className="section-title mt-2 text-2xl text-bone">
          {business.name}
        </h1>
        <div className="mt-10">
          <OnboardingChrome
            business={business}
            services={services}
            professionals={professionals}
            locations={locations}
          />
        </div>
      </>
    );
  }

  const todayBookings = await listBookingsByBusiness(id, todayDateString());

  return (
    <>
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
          <p className="text-xs text-bone-muted mt-1 max-w-sm">
            Tu web ya está diseñada por RYVO — personalizala con tu
            contenido, fotos y colores en el panel de abajo.
          </p>
          <a
            href={`/${business.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-bone-muted hover:text-brass transition-colors"
          >
            Ver sitio público →
          </a>
        </div>
      </div>

      <div className="mt-8">
        <BusinessNav businessId={business.id} active="editor" />
      </div>

      <TodaySummary
        businessId={business.id}
        bookings={todayBookings}
        nowTime={nowTimeString()}
      />

      <div className="mt-10">
        <EditorShell
          business={business}
          services={services}
          professionals={professionals}
          locations={locations}
          products={products}
          officialTemplates={officialTemplates}
          businessTemplates={businessTemplates}
        />
      </div>
    </>
  );
}
