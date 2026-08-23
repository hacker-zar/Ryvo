import { EditorSelectionProvider } from "@/lib/admin/editor-selection-context";
import { requireQuickChangesAccess } from "../require-quick-access";
import QuickChangesPageHeader from "../quick-changes-page-header";
import GlobalSaveBar from "../../(chrome)/global-save-bar";
import InformacionPanel from "../../(chrome)/informacion-panel";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function QuickInfoPage({ params }: PageProps) {
  const { id } = await params;
  const { business } = await requireQuickChangesAccess(id);

  return (
    <div>
      <QuickChangesPageHeader businessId={business.id} title="Información del negocio" />
      <EditorSelectionProvider>
        {/* InformacionPanel tampoco tiene botón propio — mismo motivo que
            Fotos, ver ese comentario. */}
        <GlobalSaveBar />
        <InformacionPanel business={business} />
      </EditorSelectionProvider>
    </div>
  );
}
