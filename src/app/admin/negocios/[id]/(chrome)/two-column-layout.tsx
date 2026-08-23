"use client";

import { ReactNode, useState } from "react";

interface TwoColumnLayoutProps {
  /** Panel de configuración (izquierda en desktop). */
  left: ReactNode;
  /** Preview (derecha en desktop). */
  right: ReactNode;
}

const MOBILE_TABS = [
  { key: "config", label: "Configuración" },
  { key: "preview", label: "Vista previa" },
] as const;

type MobileTab = (typeof MOBILE_TABS)[number]["key"];

/**
 * Grid responsive compartido por el editor normal (EditorShell) y el
 * onboarding (OnboardingChrome): configuración + preview lado a lado
 * desde `md:`, un switch de tabs en mobile (no hay espacio para dos
 * columnas en una pantalla de celular).
 */
export default function TwoColumnLayout({ left, right }: TwoColumnLayoutProps) {
  const [mobileTab, setMobileTab] = useState<MobileTab>("config");

  return (
    <div>
      <div className="md:hidden flex gap-2 mb-6">
        {MOBILE_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setMobileTab(tab.key)}
            className="section-eyebrow text-xs px-4 py-2 radius-sm border transition-colors"
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
          {left}
        </div>
        <div className={mobileTab === "preview" ? "block" : "hidden md:block"}>
          {right}
        </div>
      </div>
    </div>
  );
}
