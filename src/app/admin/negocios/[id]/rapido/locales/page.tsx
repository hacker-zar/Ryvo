import { listLocationsByBusiness } from "@/lib/data/business-repository";
import { EditorSelectionProvider } from "@/lib/admin/editor-selection-context";
import { requireQuickChangesAccess } from "../require-quick-access";
import QuickChangesPageHeader from "../quick-changes-page-header";
import LocationsManager from "../../(chrome)/locations-manager";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function QuickLocationsPage({ params }: PageProps) {
  const { id } = await params;
  const { business } = await requireQuickChangesAccess(id);
  const locations = await listLocationsByBusiness(id);

  return (
    <div>
      <QuickChangesPageHeader businessId={business.id} title="Locales" />
      <EditorSelectionProvider>
        <LocationsManager businessId={business.id} locations={locations} />
      </EditorSelectionProvider>
    </div>
  );
}
