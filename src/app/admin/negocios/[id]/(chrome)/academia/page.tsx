import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getAcademyForAdmin,
  getAcademySummary,
  getBusinessById,
} from "@/lib/data/business-repository";
import BusinessNav from "../business-nav";
import { ACADEMY_INTEREST_STATUS_LABELS } from "./interest-status";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function AcademiaPage({ params }: PageProps) {
  const { id } = await params;

  const [business, academy, summary] = await Promise.all([
    getBusinessById(id),
    getAcademyForAdmin(id),
    getAcademySummary(id),
  ]);
  if (!business) notFound();

  return (
    <>
      <Link
        href={`/admin/negocios/${id}`}
        className="section-eyebrow text-xs text-bone-muted hover:text-brass transition-colors"
      >
        ← Volver a {business.name}
      </Link>

      <p className="section-eyebrow text-brass mt-6">Academia</p>
      <h1 className="section-title mt-2 text-2xl text-bone">{business.name}</h1>
      <div className="mt-8">
        <BusinessNav businessId={id} active="academia" />
      </div>

      {!academy ? (
        <div className="radius-sm border border-ink-line p-8 text-center max-w-md">
          <p className="text-bone font-medium">Todavía no activaste Academia.</p>
          <p className="text-sm text-bone-muted mt-2">
            Activala desde Configuración y en minutos tenés la sección
            publicada en tu sitio.
          </p>
          <Link
            href={`/admin/negocios/${id}/academia/configuracion`}
            className="section-eyebrow mt-6 inline-flex radius-sm bg-brass text-ink font-semibold text-xs px-6 py-3.5 hover:opacity-90 transition-opacity"
          >
            Ir a Configuración
          </Link>
        </div>
      ) : (
        <>
          <div className="mt-2 grid gap-4 sm:grid-cols-3 max-w-2xl">
            <div className="radius-sm border border-ink-line p-5">
              <p className="text-3xl font-semibold text-bone">{summary.interests_new}</p>
              <p className="text-xs text-bone-muted mt-1">Interesados nuevos</p>
            </div>
            <div className="radius-sm border border-ink-line p-5">
              <p className="text-3xl font-semibold text-bone">{summary.interests_total}</p>
              <p className="text-xs text-bone-muted mt-1">Interesados totales</p>
            </div>
            <div className="radius-sm border border-ink-line p-5">
              <p className="text-3xl font-semibold text-bone">{summary.categories_active}</p>
              <p className="text-xs text-bone-muted mt-1">Categorías activas</p>
            </div>
          </div>

          <div className="mt-10 flex gap-3">
            <Link
              href={`/admin/negocios/${id}/academia/interesados`}
              className="section-eyebrow text-xs px-5 py-3 radius-sm border border-ink-line text-bone hover:border-brass transition-colors"
            >
              Ver interesados
            </Link>
            <Link
              href={`/admin/negocios/${id}/academia/configuracion`}
              className="section-eyebrow text-xs px-5 py-3 radius-sm border border-ink-line text-bone hover:border-brass transition-colors"
            >
              Configuración
            </Link>
          </div>

          <div className="mt-10">
            <p className="section-eyebrow text-bone-muted mb-3">Solicitudes recientes</p>
            {summary.recent_interests.length === 0 ? (
              <p className="text-sm text-bone-muted">Todavía no hay solicitudes.</p>
            ) : (
              <div className="divide-y divide-ink-line border-t border-b border-ink-line max-w-2xl">
                {summary.recent_interests.map((interest) => (
                  <Link
                    key={interest.id}
                    href={`/admin/negocios/${id}/academia/interesados/${interest.id}`}
                    className="py-3 flex items-center justify-between gap-4 hover:bg-ink-elevated -mx-2 px-2 transition-colors"
                  >
                    <div>
                      <p className="text-sm text-bone">{interest.name}</p>
                      <p className="text-xs text-bone-muted mt-0.5">
                        {interest.category_name ?? "Categoría eliminada"}
                      </p>
                    </div>
                    <span className="text-xs text-bone-muted shrink-0">
                      {ACADEMY_INTEREST_STATUS_LABELS[interest.status]}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </>
  );
}
