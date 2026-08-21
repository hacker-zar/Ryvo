import { notFound, redirect } from "next/navigation";
import { getAdminSession } from "@/lib/admin/session";
import {
  getBusinessById,
  listProductsByBusiness,
  listProfessionalsByBusiness,
  listServicesForProfessional,
} from "@/lib/data/business-repository";
import QuickEditorShell from "./quick-editor-shell";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Página única del Editor rápido — el layout (`rapido/layout.tsx`) ya
 * garantizó que la sesión es "worker" para este negocio; acá solo se
 * resuelve a QUÉ profesional (siempre `session.professionalId`, nunca
 * algo de la URL) y se cargan los datos que ese profesional puede tocar.
 */
export default async function QuickEditorPage({ params }: PageProps) {
  const { id } = await params;
  const session = await getAdminSession();
  if (!session || session.role !== "owner" || !session.professionalId) {
    redirect("/admin/login");
  }

  const [business, professionals, services, products] = await Promise.all([
    getBusinessById(id),
    listProfessionalsByBusiness(id),
    listServicesForProfessional(id, session.professionalId),
    listProductsByBusiness(id),
  ]);
  if (!business) notFound();

  const professional = professionals.find((p) => p.id === session.professionalId);
  if (!professional) notFound();

  return (
    <QuickEditorShell
      business={business}
      professional={professional}
      services={services}
      products={products}
    />
  );
}
