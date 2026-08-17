import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { canManageBusiness, getAdminSession } from "@/lib/admin/session";
import {
  getBusinessById,
  listBookingsByBusiness,
  listLocationsByBusiness,
  listProfessionalsByBusiness,
  listServicesByBusiness,
} from "@/lib/data/business-repository";
import { nowTimeString, todayDateString } from "@/lib/format";
import AdminChrome from "@/components/admin/AdminChrome";
import BusinessNav from "./business-nav";
import EditorShell from "./editor-shell";
import OnboardingChrome from "./onboarding-chrome";
import TodaySummary from "./today-summary";

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

  // Un negocio creado por registro self-service arranca sin publicar
  // (ver src/lib/actions/register-business.ts) — hasta que el dueño
  // confirme "Publicar", esta misma página muestra el onboarding en vez
  // del editor normal. Los negocios creados por el superadmin
  // (adminCreateBusiness) nacen publicados y nunca pasan por acá.
  if (business.published === false) {
    return (
      <AdminChrome>
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
      </AdminChrome>
    );
  }

  const todayBookings = await listBookingsByBusiness(id, todayDateString());

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
        />
      </div>
    </AdminChrome>
  );
}
