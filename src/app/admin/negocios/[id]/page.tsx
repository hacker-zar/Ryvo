import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { canManageBusiness, getAdminSession } from "@/lib/admin/session";
import {
  businessHasAdminPassword,
  getBusinessById,
  listLocationsByBusiness,
  listProfessionalsByBusiness,
  listServicesByBusiness,
} from "@/lib/data/business-repository";
import AdminChrome from "@/components/admin/AdminChrome";
import GalleryUploadField from "@/components/admin/GalleryUploadField";
import BusinessEditForm from "./business-edit-form";
import ServicesManager from "./services-manager";
import ProfessionalsManager from "./professionals-manager";
import LocationsManager from "./locations-manager";
import AppearanceForm from "./appearance-form";
import AdminPasswordForm from "./admin-password-form";

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
  const hasPassword = await businessHasAdminPassword(id);

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

      <div className="mt-14">
        <p className="section-eyebrow text-brass">Acceso</p>
        <h2 className="section-title mt-2 text-xl text-bone">
          Contraseña del panel
        </h2>
        <p className="text-xs text-bone-muted mt-2 max-w-md">
          {hasPassword
            ? "Este negocio ya tiene una contraseña propia — quien la tenga puede entrar solo a este panel, sin ver otros negocios."
            : "Este negocio todavía no tiene contraseña propia asignada. Sin una, solo RYVO puede gestionarlo."}
        </p>
        <div className="mt-6">
          <AdminPasswordForm businessId={business.id} hasPassword={hasPassword} />
        </div>
      </div>

      <div className="mt-14">
        <p className="section-eyebrow text-brass">Negocio</p>
        <BusinessEditForm business={business} />
      </div>

      <div className="mt-14">
        <p className="section-eyebrow text-brass">Apariencia</p>
        <h2 className="section-title mt-2 text-xl text-bone">
          Colores, tipografía y botones
        </h2>
        <div className="mt-6">
          <AppearanceForm business={business} />
        </div>
      </div>

      <div className="mt-14">
        <p className="section-eyebrow text-brass">Locales y horarios</p>
        <h2 className="section-title mt-2 text-xl text-bone">
          Dónde y cuándo atendés
        </h2>
        <p className="text-xs text-bone-muted mt-2 max-w-md">
          Sin al menos un local con horario cargado, los clientes no van a
          poder reservar turno.
        </p>
        <LocationsManager businessId={business.id} locations={locations} />
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

      <div className="mt-14">
        <p className="section-eyebrow text-brass">Profesionales</p>
        <h2 className="section-title mt-2 text-xl text-bone">
          Tu equipo
        </h2>
        <p className="text-xs text-bone-muted mt-2 max-w-md">
          Se muestra en la web pública como señal de confianza. No está
          ligado a las reservas — el cliente no elige profesional al
          reservar.
        </p>
        <ProfessionalsManager businessId={business.id} professionals={professionals} />
      </div>
    </AdminChrome>
  );
}
