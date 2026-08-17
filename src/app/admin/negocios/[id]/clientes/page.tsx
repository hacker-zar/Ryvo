import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import { canManageBusiness, getAdminSession } from "@/lib/admin/session";
import {
  getBusinessById,
  listClientsByBusiness,
} from "@/lib/data/business-repository";
import AdminChrome from "@/components/admin/AdminChrome";
import ClientsList from "./clients-list";
import BusinessNav from "../business-nav";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function ClientesPage({ params }: PageProps) {
  const session = await getAdminSession();
  if (!session) redirect("/admin/login");

  const { id } = await params;
  if (!canManageBusiness(session, id)) redirect("/admin");

  const business = await getBusinessById(id);
  if (!business) notFound();

  const clients = await listClientsByBusiness(id);

  return (
    <AdminChrome>
      <Link
        href={`/admin/negocios/${id}`}
        className="section-eyebrow text-xs text-bone-muted hover:text-brass transition-colors"
      >
        ← Volver a {business.name}
      </Link>

      <p className="section-eyebrow text-brass mt-6">Clientes</p>
      <h1 className="section-title mt-2 text-2xl text-bone">
        {business.name}
      </h1>
      <div className="mt-8">
        <BusinessNav businessId={id} active="clientes" />
      </div>

      <p className="text-xs text-bone-muted max-w-md">
        Se arman solos a partir de las reservas — cada nuevo teléfono es un
        cliente nuevo, cada reserva siguiente con el mismo teléfono se suma a
        su ficha.
      </p>

      <ClientsList businessId={id} clients={clients} />
    </AdminChrome>
  );
}
