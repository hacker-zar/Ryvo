"use client";

import { Business, Location, Product, ProfessionalWithServices, Service, Template } from "@/types/business";
import {
  EditorCategory,
  useEditorSelection,
} from "@/lib/admin/editor-selection-context";
import InformacionPanel from "./informacion-panel";
import SectionsManager from "./sections-manager";
import FotosPanel from "./fotos-panel";
import ServicesManager from "./services-manager";
import ProfessionalsManager from "./professionals-manager";
import ProductsManager from "./products-manager";
import LocationsManager from "./locations-manager";
import AppearanceForm from "./appearance-form";
import TemplatePanel from "./template-panel";
import ComingSoonRow from "@/components/ui/ComingSoonRow";

interface CategoryPanelProps {
  business: Business;
  services: Service[];
  professionals: ProfessionalWithServices[];
  locations: Location[];
  products: Product[];
  officialTemplates: Template[];
  businessTemplates: Template[];
}

// "plantilla" deliberadamente al final — el pedido es que la sección
// quede debajo de TODO lo demás, sin mover ni tocar el resto del editor.
const CATEGORIES: { key: EditorCategory; label: string }[] = [
  { key: "apariencia", label: "Apariencia" },
  { key: "pagina", label: "Página" },
  { key: "servicios", label: "Servicios" },
  { key: "profesionales", label: "Profesionales" },
  { key: "productos", label: "Productos" },
  { key: "reservas", label: "Reservas" },
  { key: "automatizaciones", label: "Automatizaciones" },
  { key: "plantilla", label: "Plantilla" },
];

/** Acordeón de categorías — solo una abierta a la vez. Qué categoría está
 *  abierta vive en EditorSelectionContext, así que un click en la preview
 *  (ver PreviewPane) abre la categoría correspondiente acá también.
 *
 *  Reorganizado en 7 categorías (antes: Información/Servicios/
 *  Profesionales/Horarios/Fotos/Apariencia, sin agrupar): Apariencia
 *  fusiona Fotos con lo que ya tenía (colores/tipografía/botones) — se
 *  muestran los dos paneles existentes bajo un mismo acordeón, sin
 *  fusionar su código; Página reemplaza a Información; Reservas
 *  reemplaza a Horarios (locales); Productos/Automatizaciones son nuevas,
 *  todavía sin funcionalidad real (ver ComingSoonRow). */
export default function CategoryPanel({
  business,
  services,
  professionals,
  locations,
  products,
  officialTemplates,
  businessTemplates,
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
                {key === "apariencia" ? (
                  <div className="grid gap-8">
                    <div>
                      <p className="section-eyebrow text-bone-muted mb-3">
                        Imágenes
                      </p>
                      <FotosPanel
                        businessId={business.id}
                        logo={business.logo}
                        heroImage={business.hero_image ?? ""}
                        gallery={business.gallery ?? []}
                        favicon={business.favicon ?? ""}
                        heroVideo={business.hero_video ?? ""}
                        heroVideoEnabled={business.hero_video_enabled ?? false}
                        heroVideoPosition={business.hero_video_position ?? "center"}
                      />
                    </div>
                    <div>
                      <p className="section-eyebrow text-bone-muted mb-3">
                        Colores y tipografía
                      </p>
                      <AppearanceForm business={business} />
                    </div>
                  </div>
                ) : null}
                {key === "pagina" ? (
                  <>
                    <InformacionPanel business={business} />
                    <SectionsManager
                      businessId={business.id}
                      sectionOrder={business.section_order}
                    />
                  </>
                ) : null}
                {key === "servicios" ? (
                  <ServicesManager businessId={business.id} services={services} />
                ) : null}
                {key === "profesionales" ? (
                  <ProfessionalsManager
                    businessId={business.id}
                    professionals={professionals}
                    services={services}
                    singleSpecialistMode={business.single_specialist_mode ?? false}
                  />
                ) : null}
                {key === "productos" ? (
                  <ProductsManager businessId={business.id} products={products} />
                ) : null}
                {key === "reservas" ? (
                  <div className="grid gap-6">
                    <LocationsManager
                      businessId={business.id}
                      locations={locations}
                    />
                    <div>
                      <p className="text-xs text-bone-muted mb-3 max-w-sm">
                        Tus clientes ya pueden cancelar o reprogramar su
                        turno desde el link que reciben al reservar.
                      </p>
                      <ComingSoonRow label="Anticipación mínima" />
                      <ComingSoonRow label="Política de cancelación" />
                    </div>
                  </div>
                ) : null}
                {key === "automatizaciones" ? (
                  <div className="mt-2">
                    <p className="text-xs text-bone-muted mb-4 max-w-sm">
                      RYVO ya detecta oportunidades de recontacto (ver
                      Oportunidades) — enviarlas automáticamente todavía no
                      está disponible.
                    </p>
                    <ComingSoonRow label="Recordatorios" />
                    <ComingSoonRow label="Rebooking automático" />
                    <ComingSoonRow label="Solicitud de reseñas" />
                    <ComingSoonRow label="Recuperación de clientes" />
                  </div>
                ) : null}
                {key === "plantilla" ? (
                  <TemplatePanel
                    businessId={business.id}
                    templateId={business.template_id ?? null}
                    templateLayout={business.template_layout ?? null}
                    officialTemplates={officialTemplates}
                    businessTemplates={businessTemplates}
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
