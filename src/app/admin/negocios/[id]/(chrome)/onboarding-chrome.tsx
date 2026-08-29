"use client";

import Icon from "@/components/ui/Icon";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Business,
  Location,
  OpeningHours,
  ProfessionalWithServices,
  Service,
} from "@/types/business";
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
import GlobalSaveBar from "./global-save-bar";
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

  /**
   * Lo mínimo real para que la web pueda tomar una reserva. No es una
   * lista de "buenas prácticas": cada ítem es una condición que, si
   * falta, hace que el wizard de reserva no produzca ni un solo turno
   * disponible.
   *
   * El equipo NO está acá a propósito: el wizard ya se adapta a un
   * negocio sin profesionales cargados (ver BookingModal), así que su
   * ausencia no rompe las reservas.
   */
  const tieneDiaAbierto = (horarios: OpeningHours[] | undefined) =>
    (horarios ?? []).some((oh) => !oh.closed && oh.open && oh.close);

  // Sin filas en `locations`, el sitio arma un "local virtual" con
  // `businesses.opening_hours` (compatibilidad hacia atrás, ver
  // getBusinessProfile) — mirar solo `locations` daría un aviso falso a
  // un negocio que en realidad sí puede tomar reservas.
  const horariosCargados =
    locations.length > 0
      ? locations.some((l) => tieneDiaAbierto(l.opening_hours))
      : tieneDiaAbierto(business.opening_hours);

  const pendientes = [
    services.length === 0
      ? { label: "Cargá al menos un servicio", step: 1 }
      : null,
    !horariosCargados
      ? { label: "Definí los horarios de atención", step: 3 }
      : null,
  ].filter((p): p is { label: string; step: number } => p !== null);

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
          {/* Los pasos son navegables: antes eran <span> y para volver a
              Apariencia había que apretar "Continuar" cuatro veces. Pasan
              por goToStep, o sea por guardNavigation, así que el diálogo
              de cambios sin guardar sigue protegiendo igual que con los
              botones Anterior/Continuar. */}
          {STEPS.map((s, i) => {
            const isActive = i === step;
            const isDone = i < step;
            return (
              <div key={s.label} className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => goToStep(i)}
                  aria-current={isActive ? "step" : undefined}
                  className="section-eyebrow whitespace-nowrap transition-colors hover:opacity-80 focus-visible:ring-2 focus-visible:ring-brass focus-visible:ring-offset-2 focus-visible:ring-offset-ink radius-sm px-1"
                  style={{
                    color: isActive || isDone ? "var(--brass)" : "var(--bone-muted)",
                  }}
                >
                  {i + 1} {s.label}
                </button>
                {i < LAST_STEP ? (
                  <Icon
                    name="chevron"
                    size={16}
                    rotate={270}
                    className="text-bone-muted/40 shrink-0"
                  />
                ) : null}
              </div>
            );
          })}
        </div>
      </div>

      {step < LAST_STEP ? (
        <>
          <GlobalSaveBar />
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
                      galleryLayout={business.gallery_layout ?? "editorial"}
                      aboutImage={business.about_image ?? ""}
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
                className="section-eyebrow text-xs px-5 py-3 radius-sm border border-ink-line text-bone-muted hover:text-bone transition-colors"
              >
                Anterior
              </button>
            ) : null}
            <button
              type="button"
              onClick={() => goToStep(step + 1)}
              className="section-eyebrow text-xs px-6 py-3 radius-sm bg-brass text-ink font-semibold hover:opacity-90 transition-opacity"
            >
              Continuar
            </button>
          </div>
        </>
      ) : (
        <div className="max-w-2xl">
          <h1 className="section-title text-2xl text-bone mb-2">Tu web</h1>
          {/* La copia anterior decía "podés seguir editando cualquier
              cosa después de publicar", y era falsa: el editor completo
              (apariencia, plantilla, orden de secciones) es exclusivo de
              RYVO, así que al publicar el dueño pasa a "Mi web", que
              cubre contenido y no diseño. Prometer de más justo en el
              momento de mayor entusiasmo es peor que acotar bien. */}
          <p className="text-sm text-bone-muted mb-8 max-w-md">
            Así se ve {business.name} en RYVO. Después de publicar vas a
            poder actualizar tus servicios, equipo, fotos y horarios
            cuando quieras desde <strong className="text-bone">Mi web</strong>.
            Del diseño nos ocupamos nosotros — escribinos y lo ajustamos.
          </p>

          {/* Verificación antes de publicar.
              Los pasos de Servicios/Equipo/Horarios dicen "podés
              completar esto más tarde" y nada impedía llegar hasta acá
              sin ninguno — pero una web sin servicios no muestra la
              sección ni puede tomar una reserva, y sin horarios el
              wizard no genera un solo turno disponible. El peor
              resultado posible es publicar algo que parece andar y no
              toma reservas.

              Avisa, no bloquea: publicar sigue siendo decisión del
              dueño, y hay negocios que quieren la web arriba antes de
              tener todo cargado. */}
          {pendientes.length > 0 ? (
            <div className="mb-6 radius-sm border border-warn/40 bg-warn/10 px-4 py-3.5">
              <p className="text-sm text-warn flex items-start gap-2">
                <Icon name="alert" size={16} className="shrink-0 mt-0.5" />
                <span>
                  Podés publicar igual, pero con esto sin cargar tu web no
                  va a poder tomar reservas.
                </span>
              </p>
              <ul className="mt-3 grid gap-2">
                {pendientes.map((p) => (
                  <li key={p.label}>
                    <button
                      type="button"
                      onClick={() => goToStep(p.step)}
                      className="text-xs text-bone hover:text-brass transition-colors inline-flex items-center gap-1.5"
                    >
                      {p.label}
                      <Icon name="arrow" size={16} className="shrink-0" />
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <PreviewPane businessId={business.id} />

          {publishError ? (
            <p className="mt-4 text-sm text-red-400">{publishError}</p>
          ) : null}

          <div className="mt-8 flex gap-3">
            <button
              type="button"
              onClick={() => goToStep(LAST_STEP - 1)}
              className="section-eyebrow text-xs px-5 py-3 radius-sm border border-ink-line text-bone-muted hover:text-bone transition-colors"
            >
              Anterior
            </button>
            <button
              type="button"
              disabled={publishing}
              onClick={handlePublish}
              className="section-eyebrow text-xs px-6 py-3 radius-sm bg-brass text-ink font-semibold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {publishing ? "Publicando..." : "Publicar mi web"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
