import { notFound } from "next/navigation";
import Link from "next/link";
import {
  getBusinessById,
  getBusinessStats,
} from "@/lib/data/business-repository";
import { formatPrice } from "@/lib/format";
import StatTile from "@/components/ui/StatTile";
import BarChart from "@/components/ui/BarChart";
import BusinessNav from "../business-nav";

interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ range?: string }>;
}

const RANGE_OPTIONS = [7, 30, 90] as const;

export default async function EstadisticasPage({
  params,
  searchParams,
}: PageProps) {
  const [{ id }, { range }] = await Promise.all([params, searchParams]);
  const rangeDays = RANGE_OPTIONS.includes(Number(range) as (typeof RANGE_OPTIONS)[number])
    ? Number(range)
    : 30;

  const [business, stats] = await Promise.all([
    getBusinessById(id),
    getBusinessStats(id, rangeDays),
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

      <p className="section-eyebrow text-brass mt-6">Estadísticas</p>
      <h1 className="section-title mt-2 text-2xl text-bone">
        {business.name}
      </h1>

      <div className="mt-8">
        <BusinessNav businessId={id} active="estadisticas" />
      </div>

      <div className="flex justify-end">
        <div className="flex gap-2">
          {RANGE_OPTIONS.map((days) => (
            <Link
              key={days}
              href={`/admin/negocios/${id}/estadisticas?range=${days}`}
              className="section-eyebrow text-xs px-3 py-1.5 rounded-sm border transition-colors"
              style={{
                borderColor: rangeDays === days ? "var(--brass)" : "var(--ink-line)",
                color: rangeDays === days ? "var(--brass)" : "var(--bone-muted)",
              }}
            >
              {days} días
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 sm:grid-cols-4 gap-4">
        <StatTile label="Clientes totales" value={String(stats.clients_total)} />
        <StatTile label="Clientes nuevos" value={String(stats.clients_new)} />
        <StatTile label="Clientes recurrentes" value={String(stats.clients_returning)} />
        <StatTile label="Turnos totales" value={String(stats.bookings_total)} />
        <StatTile label="Completados" value={String(stats.bookings_completed)} />
        <StatTile label="Cancelados" value={String(stats.bookings_cancelled)} />
        <StatTile label="No-shows" value={String(stats.bookings_no_show)} />
        <StatTile label="Ingresos estimados" value={formatPrice(stats.revenue_estimated)} />
      </div>

      <div className="mt-10 grid gap-8 max-w-lg">
        <div>
          <p className="section-eyebrow text-bone-muted mb-3">
            Estado de los turnos
          </p>
          <BarChart
            items={[
              { label: "Pendientes", value: stats.bookings_pending, color: "var(--bone-muted)" },
              { label: "Confirmados", value: stats.bookings_confirmed, color: "var(--brass)" },
              { label: "Completados", value: stats.bookings_completed, color: "#4ade80" },
              { label: "Cancelados", value: stats.bookings_cancelled, color: "#f87171" },
              { label: "No asistió", value: stats.bookings_no_show, color: "#fb923c" },
            ]}
          />
        </div>

        <div>
          <p className="section-eyebrow text-bone-muted mb-3">
            Ocupación de la agenda
          </p>
          <div className="flex items-center justify-between text-xs text-bone-muted mb-1">
            <span>Últimos {rangeDays} días</span>
            <span className="ticket-number">
              {Math.round(stats.occupancy_rate * 100)}%
            </span>
          </div>
          <div className="h-2 rounded-full bg-ink-line overflow-hidden">
            <div
              className="h-full rounded-full bg-brass"
              style={{ width: `${Math.round(stats.occupancy_rate * 100)}%` }}
            />
          </div>
        </div>

        <div>
          <p className="section-eyebrow text-bone-muted mb-1">
            Servicio más solicitado
          </p>
          <p className="text-sm text-bone">
            {stats.top_service
              ? `${stats.top_service.name} (${stats.top_service.count} turno${stats.top_service.count === 1 ? "" : "s"})`
              : "Todavía no hay suficientes turnos."}
          </p>
        </div>
      </div>
    </>
  );
}
