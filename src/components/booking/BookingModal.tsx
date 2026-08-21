"use client";

import { useEffect, useMemo, useState } from "react";
import { Business, Location, ProfessionalWithServices, Service } from "@/types/business";
import { BookingSeed, useBookingModal } from "@/lib/booking-modal-context";
import { submitBooking } from "@/lib/actions/booking-actions";
import { isLikelyPhone, readableTextColor } from "@/lib/format";
import { qualifiedProfessionalIds } from "@/lib/availability";
import StepIndicator, { WizardStepId } from "./StepIndicator";
import StepService from "./StepService";
import StepProfessional from "./StepProfessional";
import StepDateTime from "./StepDateTime";
import StepDetails from "./StepDetails";
import StepSuccess from "./StepSuccess";

interface BookingModalProps {
  business: Pick<Business, "id" | "name" | "primary_color" | "whatsapp">;
  slug: string;
  services: Service[];
  locations: Location[];
  professionals: ProfessionalWithServices[];
}

// El gate de `isOpen` vive en BookingModalLazy (afuera de este módulo, que
// se carga con next/dynamic): si estuviera acá adentro, React igual
// tendría que cargar y ejecutar todo este archivo (con los 5 pasos del
// wizard importados arriba) solo para descubrir que devuelve null — el
// code-splitting no serviría de nada. Este componente asume que ya está
// abierto cuando se monta.
export default function BookingModal(
  props: BookingModalProps & { openCount: number; seed: BookingSeed | null }
) {
  const { openCount, seed, ...rest } = props;
  // Chequeo ANTES de montar BookingModalContent, no adentro: si estuviera
  // después de sus hooks (como estaba antes), un negocio sin servicios
  // igual dispara el efecto que bloquea el scroll del body (y el listener
  // de Escape) para después renderizar null — deja la página trabada sin
  // ningún botón visible para cerrar. Acá evita que esos efectos lleguen
  // a registrarse siquiera.
  if (rest.services.length === 0) return null;
  // La key fuerza a remontar el contenido cada vez que se abre, así el
  // wizard arranca limpio sin necesidad de resetear estado en un efecto.
  return <BookingModalContent key={openCount} {...rest} seed={seed} />;
}

type Step = WizardStepId | "success";

function BookingModalContent({
  business,
  slug,
  services,
  locations,
  professionals,
  seed,
}: BookingModalProps & { seed: ReturnType<typeof useBookingModal>["seed"] }) {
  const { close } = useBookingModal();

  const activeProfessionals = useMemo(
    () => professionals.filter((p) => p.active),
    [professionals]
  );

  const seededService = useMemo(
    () => services.find((s) => s.id === seed?.serviceId) ?? null,
    [services, seed?.serviceId]
  );

  const [step, setStep] = useState<Step>(seededService ? "datetime" : "service");
  const [direction, setDirection] = useState<"forward" | "backward">(
    "forward"
  );
  const [selectedService, setSelectedService] = useState<Service | null>(
    seededService
  );
  const [selectedProfessionalId, setSelectedProfessionalId] = useState<
    string | "any"
  >(() => {
    if (seed?.professionalId) return seed.professionalId;
    if (activeProfessionals.length === 1) return activeProfessionals[0].id;
    return "any";
  });
  const [locationId, setLocationId] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [bookingId, setBookingId] = useState<string | null>(null);
  // Si el horario se ocupó justo antes de confirmar (ver submitBooking /
  // createBooking, campo `conflict`), en vez de un error genérico en el
  // paso de datos volvemos al paso de horario con este mensaje.
  const [conflictMessage, setConflictMessage] = useState("");

  // El paso "professional" solo existe si el servicio elegido tiene 2+
  // profesionales calificados — no es una elección visual, cambia de
  // verdad qué disponibilidad se consulta en el paso siguiente.
  const steps: WizardStepId[] = useMemo(() => {
    const qualifiedCount = selectedService
      ? qualifiedProfessionalIds(activeProfessionals, selectedService.id).length
      : activeProfessionals.length;
    return qualifiedCount >= 2
      ? ["service", "professional", "datetime", "details"]
      : ["service", "datetime", "details"];
  }, [selectedService, activeProfessionals]);

  // Si cambia el servicio elegido, un profesional específico ya elegido
  // podría no calificar más para el nuevo servicio — vuelve a "cualquiera
  // disponible" en vez de dejar seleccionado a alguien que no puede hacer
  // el servicio nuevo. Ajuste de estado durante el render (no en un
  // efecto) siguiendo el patrón recomendado por React para "resetear
  // estado cuando cambia otro valor" — evita el render en cascada extra
  // que produciría un setState dentro de un efecto.
  const [lastServiceIdForProfessionalCheck, setLastServiceIdForProfessionalCheck] =
    useState(selectedService?.id);
  if (selectedService?.id !== lastServiceIdForProfessionalCheck) {
    setLastServiceIdForProfessionalCheck(selectedService?.id);
    if (selectedProfessionalId !== "any") {
      const qualified = qualifiedProfessionalIds(
        activeProfessionals,
        selectedService?.id ?? ""
      );
      if (!qualified.includes(selectedProfessionalId)) {
        setSelectedProfessionalId("any");
      }
    }
  }

  // Bloquea el scroll del body mientras el modal está abierto.
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  // Cierra con la tecla Escape.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") close();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [close]);

  const activeLocation =
    locations.find((l) => l.id === locationId) ?? locations[0];

  const stepIndex = step === "success" ? -1 : steps.indexOf(step);

  function goToStep(next: Step, dir: "forward" | "backward") {
    setDirection(dir);
    setStep(next);
  }

  function goNext() {
    const next = steps[stepIndex + 1];
    if (next) goToStep(next, "forward");
  }

  function goBack() {
    const prev = steps[stepIndex - 1];
    if (prev) goToStep(prev, "backward");
  }

  async function handleConfirm() {
    if (!selectedService || !activeLocation || !date || !time) return;
    setSubmitting(true);
    setSubmitError("");

    const result = await submitBooking({
      business_id: business.id,
      service_id: selectedService.id,
      location_id: activeLocation.id.startsWith("virtual-")
        ? null
        : activeLocation.id,
      // Negocio sin profesionales configurados → null, mismo camino de
      // siempre. Con profesionales, "any" se resuelve server-side.
      professional_id:
        activeProfessionals.length > 0 ? selectedProfessionalId : null,
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail || undefined,
      date,
      time,
    });

    setSubmitting(false);

    if (result.success) {
      setBookingId(result.id ?? null);
      goToStep("success", "forward");
    } else if (result.conflict) {
      setTime(null);
      setConflictMessage(
        result.error ?? "Este horario acaba de ocuparse — elegí otro."
      );
      goToStep("datetime", "backward");
    } else {
      setSubmitError(result.error ?? "No se pudo completar la reserva.");
    }
  }

  const professionalIdForQuery =
    selectedProfessionalId !== "any" ? selectedProfessionalId : undefined;
  const qualifiedIdsForQuery =
    selectedProfessionalId === "any" &&
    activeProfessionals.length > 0 &&
    selectedService
      ? qualifiedProfessionalIds(activeProfessionals, selectedService.id)
      : undefined;

  const canContinueService = Boolean(selectedService);
  const canContinueDatetime = Boolean(activeLocation && date && time);
  const canConfirmDetails = customerName.trim() && isLikelyPhone(customerPhone);
  const ctaTextColor = readableTextColor(business.primary_color);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      {/* Overlay */}
      <button
        type="button"
        aria-label="Cerrar"
        onClick={close}
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-[fadeIn_0.2s_ease-out]"
      />

      {/* Modal */}
      <div
        className="relative w-full sm:max-w-md sm:mx-4 bg-ink border border-ink-line sm:rounded-sm max-h-[92vh] sm:max-h-[85vh] flex flex-col animate-[slideUp_0.25s_ease-out] rounded-t-2xl sm:rounded-t-sm"
        style={{ ["--brass" as string]: business.primary_color }}
      >
        {/* Header con progreso */}
        {step !== "success" ? (
          <div className="shrink-0 border-b border-ink-line px-5 py-4 flex items-center justify-between gap-3 min-w-0">
            <StepIndicator
              steps={steps}
              currentStepId={step}
              primaryColor={business.primary_color}
            />
            <button
              type="button"
              onClick={close}
              aria-label="Cerrar"
              className="text-bone-muted hover:text-bone focus-visible:ring-2 focus-visible:ring-brass rounded-sm transition-colors text-lg leading-none shrink-0"
            >
              ✕
            </button>
          </div>
        ) : null}

        {/* Contenido */}
        <div
          key={step}
          className={`overflow-y-auto px-5 py-6 flex-1 ${
            direction === "forward" ? "step-forward" : "step-backward"
          }`}
        >
          {step === "service" ? (
            <StepService
              services={services}
              selectedServiceId={selectedService?.id ?? null}
              onSelect={setSelectedService}
              primaryColor={business.primary_color}
            />
          ) : null}

          {step === "professional" ? (
            <StepProfessional
              professionals={activeProfessionals}
              selectedProfessionalId={selectedProfessionalId}
              onSelect={setSelectedProfessionalId}
              primaryColor={business.primary_color}
              stepNumber={steps.indexOf("professional") + 1}
            />
          ) : null}

          {step === "datetime" && selectedService ? (
            <StepDateTime
              business={business}
              locations={locations}
              service={selectedService}
              selectedLocationId={locationId}
              selectedDate={date}
              selectedTime={time}
              conflictMessage={conflictMessage}
              professionalId={professionalIdForQuery}
              qualifiedProfessionalIds={qualifiedIdsForQuery}
              stepNumber={steps.indexOf("datetime") + 1}
              onSelectLocation={setLocationId}
              onSelectDate={(d) => {
                setDate(d);
                setConflictMessage("");
              }}
              onSelectTime={(t) => {
                setTime(t);
                setConflictMessage("");
              }}
            />
          ) : null}

          {step === "details" && selectedService && activeLocation && date && time ? (
            <StepDetails
              business={business}
              service={selectedService}
              location={activeLocation}
              date={date}
              time={time}
              customerName={customerName}
              customerPhone={customerPhone}
              customerEmail={customerEmail}
              onChangeName={setCustomerName}
              onChangePhone={setCustomerPhone}
              onChangeEmail={setCustomerEmail}
            />
          ) : null}

          {step === "success" &&
          selectedService &&
          activeLocation &&
          date &&
          time ? (
            <StepSuccess
              business={business}
              slug={slug}
              bookingId={bookingId}
              service={selectedService}
              location={activeLocation}
              date={date}
              time={time}
              onClose={close}
            />
          ) : null}
        </div>

        {/* Footer con acciones */}
        {step !== "success" ? (
          <div className="shrink-0 border-t border-ink-line px-5 py-4">
            {step === "details" && submitError ? (
              <p className="text-sm text-red-400 mb-3">{submitError}</p>
            ) : null}
            <div className="flex gap-3">
              {stepIndex > 0 ? (
                <button
                  type="button"
                  onClick={goBack}
                  className="section-eyebrow text-xs px-5 py-3 btn-radius border border-ink-line text-bone-muted hover:text-bone focus-visible:ring-2 focus-visible:ring-brass transition-colors"
                >
                  Atrás
                </button>
              ) : null}

              {step === "service" ? (
                <button
                  type="button"
                  disabled={!canContinueService}
                  onClick={goNext}
                  className="section-eyebrow flex-1 text-xs px-5 py-3 btn-radius font-semibold disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-ink focus-visible:ring-brass transition-opacity"
                  style={{ backgroundColor: business.primary_color, color: ctaTextColor }}
                >
                  Continuar
                </button>
              ) : null}

              {step === "professional" ? (
                <button
                  type="button"
                  onClick={goNext}
                  className="section-eyebrow flex-1 text-xs px-5 py-3 btn-radius font-semibold focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-ink focus-visible:ring-brass transition-opacity"
                  style={{ backgroundColor: business.primary_color, color: ctaTextColor }}
                >
                  Continuar
                </button>
              ) : null}

              {step === "datetime" ? (
                <button
                  type="button"
                  disabled={!canContinueDatetime}
                  onClick={goNext}
                  className="section-eyebrow flex-1 text-xs px-5 py-3 btn-radius font-semibold disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-ink focus-visible:ring-brass transition-opacity"
                  style={{ backgroundColor: business.primary_color, color: ctaTextColor }}
                >
                  Continuar
                </button>
              ) : null}

              {step === "details" ? (
                <button
                  type="button"
                  disabled={!canConfirmDetails || submitting}
                  onClick={handleConfirm}
                  className="section-eyebrow flex-1 text-xs px-5 py-3 btn-radius font-semibold disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-ink focus-visible:ring-brass transition-opacity"
                  style={{ backgroundColor: business.primary_color, color: ctaTextColor }}
                >
                  {submitting ? "Confirmando..." : "Confirmar turno"}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
