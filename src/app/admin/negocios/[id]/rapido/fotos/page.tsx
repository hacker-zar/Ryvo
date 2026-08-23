import { EditorSelectionProvider } from "@/lib/admin/editor-selection-context";
import { requireQuickChangesAccess } from "../require-quick-access";
import QuickChangesPageHeader from "../quick-changes-page-header";
import GlobalSaveBar from "../../(chrome)/global-save-bar";
import FotosPanel from "../../(chrome)/fotos-panel";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function QuickPhotosPage({ params }: PageProps) {
  const { id } = await params;
  const { business } = await requireQuickChangesAccess(id);

  return (
    <div>
      <QuickChangesPageHeader businessId={business.id} title="Fotos" />
      <EditorSelectionProvider>
        {/* FotosPanel no tiene botón "Guardar" propio — se registra en el
            guardado global (ver editor-selection-context.tsx), por eso
            necesita esta barra acá, a diferencia de los managers CRUD
            (Servicios/Profesionales/Locales/Catálogo), que guardan al
            instante por ítem. */}
        <GlobalSaveBar />
        <FotosPanel
          businessId={business.id}
          logo={business.logo}
          heroImage={business.hero_image ?? ""}
          gallery={business.gallery ?? []}
          galleryLayout={business.gallery_layout ?? "editorial"}
          aboutImage={business.about_image ?? ""}
          favicon={business.favicon ?? ""}
          heroVideo={business.hero_video ?? ""}
          heroVideoEnabled={business.hero_video_enabled ?? false}
          heroVideoPosition={business.hero_video_position ?? "center"}
        />
      </EditorSelectionProvider>
    </div>
  );
}
