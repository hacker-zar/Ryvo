"use client";

import { Business, Location, Product, ProfessionalWithServices, Service, Template } from "@/types/business";
import { EditorSelectionProvider } from "@/lib/admin/editor-selection-context";
import CategoryPanel from "./category-panel";
import PreviewPane from "./preview-pane";
import TwoColumnLayout from "./two-column-layout";

interface EditorShellProps {
  business: Business;
  services: Service[];
  professionals: ProfessionalWithServices[];
  locations: Location[];
  products: Product[];
  officialTemplates: Template[];
  businessTemplates: Template[];
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
  products,
  officialTemplates,
  businessTemplates,
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
            products={products}
            officialTemplates={officialTemplates}
            businessTemplates={businessTemplates}
          />
        }
        right={<PreviewPane businessId={business.id} />}
      />
    </EditorSelectionProvider>
  );
}
