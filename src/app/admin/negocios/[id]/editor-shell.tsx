"use client";

import { Business, Location, Professional, Service } from "@/types/business";
import { EditorSelectionProvider } from "@/lib/admin/editor-selection-context";
import CategoryPanel from "./category-panel";
import PreviewPane from "./preview-pane";
import TwoColumnLayout from "./two-column-layout";

interface EditorShellProps {
  business: Business;
  services: Service[];
  professionals: Professional[];
  locations: Location[];
}

/**
 * Shell del editor visual: panel de configuración por categorías +
 * preview en vivo (ver TwoColumnLayout para el responsive).
 */
export default function EditorShell({
  business,
  services,
  professionals,
  locations,
}: EditorShellProps) {
  return (
    <EditorSelectionProvider>
      <TwoColumnLayout
        left={
          <CategoryPanel
            business={business}
            services={services}
            professionals={professionals}
            locations={locations}
          />
        }
        right={<PreviewPane businessId={business.id} />}
      />
    </EditorSelectionProvider>
  );
}
