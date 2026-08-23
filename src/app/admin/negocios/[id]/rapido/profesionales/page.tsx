import {
  listProfessionalsByBusiness,
  listServicesByBusiness,
} from "@/lib/data/business-repository";
import { EditorSelectionProvider } from "@/lib/admin/editor-selection-context";
import { requireQuickChangesAccess } from "../require-quick-access";
import QuickChangesPageHeader from "../quick-changes-page-header";
import ProfessionalsManager from "../../(chrome)/professionals-manager";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function QuickProfessionalsPage({ params }: PageProps) {
  const { id } = await params;
  const { business } = await requireQuickChangesAccess(id);
  const [professionals, services] = await Promise.all([
    listProfessionalsByBusiness(id),
    listServicesByBusiness(id),
  ]);

  return (
    <div>
      <QuickChangesPageHeader businessId={business.id} title="Profesionales" />
      <EditorSelectionProvider>
        <ProfessionalsManager
          businessId={business.id}
          professionals={professionals}
          services={services}
          singleSpecialistMode={business.single_specialist_mode ?? false}
        />
      </EditorSelectionProvider>
    </div>
  );
}
