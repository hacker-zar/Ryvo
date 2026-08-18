"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Business, Location, ProfessionalWithServices, Service } from "@/types/business";
import { adminPublishBusiness, adminSetOnboardingStep } from "@/lib/admin/actions";
import {
  EditorSelectionProvider,
  useEditorSelection,
} from "@/lib/admin/editor-selection-context";
import InformacionPanel from "./informacion-panel";
import FotosPanel from "./fotos-panel";
import ServicesManager from "./services-manager";
import ProfessionalsManager from "./professionals-manager";
import LocationsManager from "./locations-manager";
import AppearanceForm from "./appearance-form";
import PreviewPane from "./preview-pane";
import TwoColumnLayout from "./two-column-layout";

interface OnboardingChromeProps {
  business: Business;
  services: Service[];
  professionals: ProfessionalWithServices[];
  locations: Location[];
}

const STEPS = [
  { label: "Tu negocio", helper: "Contanos de tu negocio." },
  { label: "Servicios", helper: "Podés completar esto más tarde." },
  { label: "Equipo", helper: "Podés completar esto más tarde." },
  { label: "Horarios", helper: "Podés completar esto más tarde." },
  { label: "Apariencia", helper: "Elegí colores, fondo y tus fotos." },
  { label: "Tu web", helper: "" },
] as const;

const LAST_STEP = STEPS.length - 1;

/**
 * Chrome del onboarding self-service: mismo editor visual de siempre
 * (los paneles de cada categoría + PreviewPane), presentado paso a paso
 * en vez de como acordeón — para que un dueño nuevo vea su web tomar
 * forma sin tener que entender el panel completo de entrada. Al llegar
 * al final, "Publicar" hace visible el negocio en /[slug] y la página
 * pasa a mostrar el editor normal (ver admin/negocios/[id]/page.tsx).
 */
export default function OnboardingChrome(props: OnboardingChromeProps) {
  return (
    <EditorSelectionProvider>
      <OnboardingSteps {...props} />
    </EditorSelectionProvider>
  );
}

function OnboardingSteps({
  business,
  services,
  professionals,
  locations,
}: OnboardingChromeProps) {
  const router = useRouter();
  const { guardNavigation } = useEditorSelection();
  const initialStep = Math.min(
    Math.max(business.onboarding_step ?? 0, 0),
    LAST_STEP
  );
  const [step, setStep] = useState(initialStep);
  const [publishing, setPublishing] = useState(false);
  const [publishError, setPublishError] = useState("");

  async function commitStep(next: number) {
    setStep(next);
    await adminSetOnboardingStep(business.id, next);
  }

  function goToStep(next: number) {
    guardNavigation(() => commitStep(next));
  }

  async function handlePublish() {
    setPublishing(true);
    setPublishError("");
    const result = await adminPublishBusiness(business.id);
    if (result.success) {
      router.refresh();
    } else {
      setPublishing(false);
      setPublishError(result.error ?? "No se pudo publicar tu web.");
    }
  }

  return (
    <>
      <div className="mb-10">
        <div className="flex items-center gap-1.5 flex-wrap text-xs">
          {STEPS.map((s, i) => {
            const isActive = i === step;
            const isDone = i < step;
            return (
              <div key={s.label} className="flex items-center gap-1.5">
                <span
                  className="section-eyebrow whitespace-nowrap transition-colors"
                  style={{
                    color: isActive || isDone ? "var(--brass)" : "var(--bone-muted)",
                  }}
                >
                  {i + 1} {s.label}
                </span>
                {i < LAST_STEP ? (
                  <span className="text-bone-muted/40">→</span>
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {step < LAST_STEP ? (
        <>
          <TwoColumnLayout
            left={
              <div>
                <h1 className="section-title text-xl text-bone mb-1">
                  {STEPS[step].label}
                </h1>
                {STEPS[step].helper ? (
                  <p className="text-xs text-bone-muted mb-6">
                    {STEPS[step].helper}
                  </p>
                ) : (
                  <div className="mb-6" />
                )}

                {step === 0 ? <InformacionPanel business={business} /> : null}
                {step === 1 ? (
                  <ServicesManager businessId={business.id} services={services} />
                ) : null}
                {step === 2 ? (
                  <ProfessionalsManager
                    businessId={business.id}
                    professionals={professionals}
                    services={services}
                    singleSpecialistMode={business.single_specialist_mode ?? false}
                  />
                ) : null}
                {step === 3 ? (
                  <LocationsManager
                    businessId={business.id}
                    locations={locations}
                  />
                ) : null}
                {step === 4 ? (
                  <div className="grid gap-8">
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
                    <AppearanceForm business={business} />
                  </div>
                ) : null}
              </div>
            }
            right={<PreviewPane businessId={business.id} />}
          />

          <div className="mt-8 flex gap-3">
            {step > 0 ? (
              <button
                type="button"
                onClick={() => goToStep(step - 1)}
                className="section-eyebrow text-xs px-5 py-3 rounded-sm border border-ink-line text-bone-muted hover:text-bone transition-colors"
              >
                Anterior
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => goToStep(step + 1)}
              className="section-eyebrow text-xs px-6 py-3 rounded-sm bg-brass text-ink font-semibold hover:opacity-90 transition-opacity"
            >
              Continuar
            </button>
          </div>
        </>
      ) : (
        <div className="max-w-2xl">
          <h1 className="section-title text-2xl text-bone mb-2">Tu web</h1>
          <p className="text-sm text-bone-muted mb-8 max-w-md">
            Así se ve {business.name} en RYVO. Podés seguir editando
            cualquier cosa después de publicar.
          </p>

          <PreviewPane businessId={business.id} />

          {publishError ? (
            <p className="mt-4 text-sm text-red-400">{publishError}</p>
          ) : null}

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={() => goToStep(LAST_STEP - 1)}
              className="section-eyebrow text-xs px-5 py-3 rounded-sm border border-ink-line text-bone-muted hover:text-bone transition-colors"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={publishing}
              onClick={handlePublish}
              className="section-eyebrow text-xs px-6 py-3 rounded-sm bg-brass text-ink font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {publishing ? "Publicando..." : "Publicar mi web"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
