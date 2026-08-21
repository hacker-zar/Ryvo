"use client";

import { Business, Product, ProfessionalWithServices, Service } from "@/types/business";
import { EditorSelectionProvider } from "@/lib/admin/editor-selection-context";
import GlobalSaveBar from "../(chrome)/global-save-bar";
import PreviewPane from "../(chrome)/preview-pane";
import TwoColumnLayout from "../(chrome)/two-column-layout";
import QuickCategoryPanel from "./quick-category-panel";

interface QuickEditorShellProps {
  business: Business;
  professional: ProfessionalWithServices;
  services: Service[];
  products: Product[];
}

/**
 * Shell del Editor rápido — reutiliza EditorSelectionProvider,
 * GlobalSaveBar, TwoColumnLayout y PreviewPane TAL CUAL como el editor
 * completo (ver editor-shell.tsx): ninguno de los cuatro sabe (ni le
 * importa) si quien los usa es el dueño o un profesional.
 */
export default function QuickEditorShell({
  business,
  professional,
  services,
  products,
}: QuickEditorShellProps) {
  return (
    <EditorSelectionProvider>
      <p className="section-eyebrow text-brass">Editor rápido</p>
      <h1 className="section-title mt-2 text-2xl text-bone">{professional.name}</h1>
      <p className="text-xs text-bone-muted mt-1 mb-8 max-w-sm">
        Actualizá tu perfil, tus servicios, la galería y el catálogo de{" "}
        {business.name}.
      </p>

      <GlobalSaveBar />

      <TwoColumnLayout
        left={
          <QuickCategoryPanel
            business={business}
            professional={professional}
            services={services}
            products={products}
          />
        }
        right={<PreviewPane businessId={business.id} />}
      />
    </EditorSelectionProvider>
  );
}
