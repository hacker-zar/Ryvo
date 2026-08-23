import { listServicesByBusiness } from "@/lib/data/business-repository";
import { EditorSelectionProvider } from "@/lib/admin/editor-selection-context";
import { requireQuickChangesAccess } from "../require-quick-access";
import QuickChangesPageHeader from "../quick-changes-page-header";
import ServicesManager from "../../(chrome)/services-manager";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function QuickServicesPage({ params }: PageProps) {
  const { id } = await params;
  const { business } = await requireQuickChangesAccess(id);
  const services = await listServicesByBusiness(id);

  return (
    <div>
      <QuickChangesPageHeader businessId={business.id} title="Servicios" />
      <EditorSelectionProvider>
        <ServicesManager businessId={business.id} services={services} />
      </EditorSelectionProvider>
    </div>
  );
}
