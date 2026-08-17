"use client";

import { Business, Location, Professional, Service } from "@/types/business";
import {
  EditorCategory,
  useEditorSelection,
} from "@/lib/admin/editor-selection-context";
import InformacionPanel from "./informacion-panel";
import FotosPanel from "./fotos-panel";
import ServicesManager from "./services-manager";
import ProfessionalsManager from "./professionals-manager";
import LocationsManager from "./locations-manager";
import AppearanceForm from "./appearance-form";

interface CategoryPanelProps {
  business: Business;
  services: Service[];
  professionals: Professional[];
  locations: Location[];
}

const CATEGORIES: { key: EditorCategory; label: string }[] = [
  { key: "informacion", label: "Información" },
  { key: "servicios", label: "Servicios" },
  { key: "profesionales", label: "Profesionales" },
  { key: "horarios", label: "Horarios" },
  { key: "fotos", label: "Fotos" },
  { key: "apariencia", label: "Apariencia" },
];

/** Acordeón de categorías — solo una abierta a la vez. Qué categoría está
 *  abierta vive en EditorSelectionContext, así que un click en la preview
 *  (ver PreviewPane) abre la categoría correspondiente acá también. */
export default function CategoryPanel({
  business,
  services,
  professionals,
  locations,
}: CategoryPanelProps) {
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
              <span className="text-bone-muted text-xs" aria-hidden="true">
                {isOpen ? "▼" : "▶"}
              </span>
            </button>

            {isOpen ? (
              <div className="pb-6">
                {key === "informacion" ? (
                  <InformacionPanel business={business} />
                ) : null}
                {key === "servicios" ? (
                  <ServicesManager businessId={business.id} services={services} />
                ) : null}
                {key === "profesionales" ? (
                  <ProfessionalsManager
                    businessId={business.id}
                    professionals={professionals}
                  />
                ) : null}
                {key === "horarios" ? (
                  <LocationsManager
                    businessId={business.id}
                    locations={locations}
                  />
                ) : null}
                {key === "fotos" ? (
                  <FotosPanel
                    businessId={business.id}
                    logo={business.logo}
                    heroImage={business.hero_image ?? ""}
                    gallery={business.gallery ?? []}
                  />
                ) : null}
                {key === "apariencia" ? (
                  <AppearanceForm business={business} />
                ) : null}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
