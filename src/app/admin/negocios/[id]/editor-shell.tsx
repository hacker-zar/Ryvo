"use client";

import { useState } from "react";
import { Business, Location, Professional, Service } from "@/types/business";
import { EditorSelectionProvider } from "@/lib/admin/editor-selection-context";
import CategoryPanel from "./category-panel";
import PreviewPane from "./preview-pane";

interface EditorShellProps {
  business: Business;
  services: Service[];
  professionals: Professional[];
  locations: Location[];
}

const MOBILE_TABS = [
  { key: "config", label: "Configuración" },
  { key: "preview", label: "Vista previa" },
] as const;

type MobileTab = (typeof MOBILE_TABS)[number]["key"];

/**
 * Shell del editor visual: panel de configuración por categorías +
 * preview en vivo, lado a lado desde `md:`. En mobile no hay espacio para
 * dos columnas, así que se muestra una a la vez con un switch simple.
 */
export default function EditorShell({
  business,
  services,
  professionals,
  locations,
}: EditorShellProps) {
  const [mobileTab, setMobileTab] = useState<MobileTab>("config");

  return (
    <EditorSelectionProvider>
      <div className="md:hidden flex gap-2 mb-6">
        {MOBILE_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setMobileTab(tab.key)}
            className="section-eyebrow text-xs px-4 py-2 rounded-sm border transition-colors"
            style={{
              borderColor:
                mobileTab === tab.key ? "var(--brass)" : "var(--ink-line)",
              color:
                mobileTab === tab.key ? "var(--brass)" : "var(--bone-muted)",
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="md:grid md:grid-cols-[400px_1fr] md:gap-10 md:items-start">
        <div className={mobileTab === "config" ? "block" : "hidden md:block"}>
          <CategoryPanel
            business={business}
            services={services}
            professionals={professionals}
            locations={locations}
          />
        </div>
        <div className={mobileTab === "preview" ? "block" : "hidden md:block"}>
          <PreviewPane businessId={business.id} />
        </div>
      </div>
    </EditorSelectionProvider>
  );
}
