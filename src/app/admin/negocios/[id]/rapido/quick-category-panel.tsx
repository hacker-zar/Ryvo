"use client";

import Icon from "@/components/ui/Icon";
import { Business, Product, ProfessionalWithServices, Service } from "@/types/business";
import {
  EditorCategory,
  useEditorSelection,
} from "@/lib/admin/editor-selection-context";
import ServicesManager from "../(chrome)/services-manager";
import ProductsManager from "../(chrome)/products-manager";
import MyProfilePanel from "./my-profile-panel";
import QuickGalleryPanel from "./quick-gallery-panel";

interface QuickCategoryPanelProps {
  business: Business;
  professional: ProfessionalWithServices;
  services: Service[];
  products: Product[];
}

// Solo 4 categorías, deliberadamente — sin Apariencia, Página, Plantilla,
// Configuración general, Automatizaciones ni gestión de otros
// profesionales. Mismo patrón de acordeón visual que category-panel.tsx
// (el editor completo), reutilizando el mismo EditorSelectionContext
// (target/select/clear) — por eso "servicios"/"productos" reusan las
// claves de EditorCategory que ya existían, y solo "perfil"/"galeria"
// son nuevas.
const CATEGORIES: { key: EditorCategory; label: string }[] = [
  { key: "perfil", label: "Mi perfil" },
  { key: "servicios", label: "Servicios" },
  { key: "galeria", label: "Galería" },
  { key: "productos", label: "Catálogo" },
];

export default function QuickCategoryPanel({
  business,
  professional,
  services,
  products,
}: QuickCategoryPanelProps) {
  const { target, select, clear } = useEditorSelection();
  const openCategory = target?.category ?? null;

  return (
    <div className="divide-y divide-ink-line border-t border-b border-ink-line">
      {CATEGORIES.map(({ key, label }) => {
        const isOpen = openCategory === key;
        return (
          <div key={key}>
            <button
              type="button"
              onClick={() => (isOpen ? clear() : select({ category: key }))}
              className="w-full flex items-center justify-between py-4 text-left"
            >
              <span className="section-title text-sm text-bone">{label}</span>
              <Icon
                name="chevron"
                size={16}
                rotate={isOpen ? 0 : 270}
                className="text-bone-muted shrink-0"
              />
            </button>

            {isOpen ? (
              <div className="pb-6">
                {key === "perfil" ? (
                  <MyProfilePanel
                    businessId={business.id}
                    professional={professional}
                    services={services}
                  />
                ) : null}
                {key === "servicios" ? (
                  <ServicesManager
                    businessId={business.id}
                    services={services}
                    readOnlyCreateDelete
                  />
                ) : null}
                {key === "galeria" ? (
                  <QuickGalleryPanel
                    businessId={business.id}
                    gallery={business.gallery ?? []}
                  />
                ) : null}
                {key === "productos" ? (
                  <ProductsManager
                    businessId={business.id}
                    products={products}
                    canDelete={false}
                  />
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
