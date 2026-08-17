import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { canManageBusiness, getAdminSession } from "@/lib/admin/session";
import {
  getBusinessById,
  getOpportunities,
} from "@/lib/data/business-repository";
import AdminChrome from "@/components/admin/AdminChrome";
import OpportunityCard from "./opportunity-card";
import BusinessNav from "../business-nav";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OportunidadesPage({ params }: PageProps) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const { id } = await params;
  if (!canManageBusiness(session, id)) redirect("/admin");

  const business = await getBusinessById(id);
  if (!business) notFound();

  const opportunities = await getOpportunities(id);

  return (
    <AdminChrome>
      <Link
        href={`/admin/negocios/${id}`}
        className="section-eyebrow text-xs text-bone-muted hover:text-brass transition-colors"
      >
        ← Volver a {business.name}
      </Link>

      <p className="section-eyebrow text-brass mt-6">Oportunidades</p>
      <h1 className="section-title mt-2 text-2xl text-bone">
        {business.name}
      </h1>
      <div className="mt-8">
        <BusinessNav businessId={id} active="oportunidades" />
      </div>

      <p className="text-xs text-bone-muted max-w-md">
        RYVO detecta estas situaciones a partir de tus turnos — todavía no
        envía nada automáticamente, solo te las muestra para que decidas qué
        hacer.
      </p>

      <div className="mt-8 divide-y divide-ink-line border-t border-b border-ink-line">
        {opportunities.map((opportunity) => (
          <OpportunityCard key={opportunity.type} opportunity={opportunity} />
        ))}
      </div>
    </AdminChrome>
  );
}
