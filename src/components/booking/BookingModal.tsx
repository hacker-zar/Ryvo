"use client";

import { useEffect, useState } from "react";
import { Business, Location, Service } from "@/types/business";
import { useBookingModal } from "@/lib/booking-modal-context";
import { submitBooking } from "@/lib/actions/booking-actions";
import { readableTextColor } from "@/lib/format";
import StepIndicator from "./StepIndicator";
import StepService from "./StepService";
import StepDateTime from "./StepDateTime";
import StepDetails from "./StepDetails";
import StepSuccess from "./StepSuccess";

interface BookingModalProps {
  business: Pick<Business, "id" | "primary_color">;
  services: Service[];
  locations: Location[];
}

export default function BookingModal(props: BookingModalProps) {
  const { isOpen, openCount } = useBookingModal();

  if (!isOpen) return null;

  // La key fuerza a remontar el contenido cada vez que se abre, así el
  // wizard arranca limpio sin necesidad de resetear estado en un efecto.
  return <BookingModalContent key={openCount} {...props} />;
}

type WizardStep = 1 | 2 | 3 | "success";

function BookingModalContent({
  business,
  services,
  locations,
}: BookingModalProps) {
  const { close } = useBookingModal();

  const [step, setStep] = useState<WizardStep>(1);
  const [direction, setDirection] = useState<"forward" | "backward">(
    "forward"
  );
  const [selectedService, setSelectedService] = useState<Service | null>(
    null
  );
  const [locationId, setLocationId] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

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

  if (services.length === 0) return null;

  const activeLocation =
    locations.find((l) => l.id === locationId) ?? locations[0];

  function goToStep(next: WizardStep, dir: "forward" | "backward") {
    setDirection(dir);
    setStep(next);
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
      customer_name: customerName,
      customer_phone: customerPhone,
      customer_email: customerEmail || undefined,
      date,
      time,
    });

    setSubmitting(false);

    if (result.success) {
      goToStep("success", "forward");
    } else {
      setSubmitError(result.error ?? "No se pudo completar la reserva.");
    }
  }

  const canContinueStep1 = Boolean(selectedService);
  const canContinueStep2 = Boolean(activeLocation && date && time);
  const canConfirmStep3 = customerName.trim() && customerPhone.trim();
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
          <div className="shrink-0 border-b border-ink-line px-5 py-4 flex items-center justify-between gap-3">
            <StepIndicator
              currentStep={step}
              primaryColor={business.primary_color}
            />
            <button
              type="button"
              onClick={close}
              aria-label="Cerrar"
              className="text-bone-muted hover:text-bone transition-colors text-lg leading-none shrink-0"
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
          {step === 1 ? (
            <StepService
              services={services}
              selectedServiceId={selectedService?.id ?? null}
              onSelect={setSelectedService}
              primaryColor={business.primary_color}
            />
          ) : null}

          {step === 2 && selectedService ? (
            <StepDateTime
              business={business}
              locations={locations}
              service={selectedService}
              selectedLocationId={locationId}
              selectedDate={date}
              selectedTime={time}
              onSelectLocation={setLocationId}
              onSelectDate={setDate}
              onSelectTime={setTime}
            />
          ) : null}

          {step === 3 && selectedService && activeLocation && date && time ? (
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
            {step === 3 && submitError ? (
              <p className="text-sm text-red-400 mb-3">{submitError}</p>
            ) : null}
            <div className="flex gap-3">
              {step !== 1 ? (
                <button
                  type="button"
                  onClick={() =>
                    goToStep(step === 3 ? 2 : step === 2 ? 1 : step, "backward")
                  }
                  className="section-eyebrow text-xs px-5 py-3 btn-radius border border-ink-line text-bone-muted hover:text-bone transition-colors"
                >
                  Atrás
                </button>
              ) : null}

              {step === 1 ? (
                <button
                  type="button"
                  disabled={!canContinueStep1}
                  onClick={() => goToStep(2, "forward")}
                  className="section-eyebrow flex-1 text-xs px-5 py-3 btn-radius font-semibold disabled:opacity-40 transition-opacity"
                  style={{
                    backgroundColor: business.primary_color,
                    color: ctaTextColor,
                  }}
                >
                  Continuar
                </button>
              ) : null}

              {step === 2 ? (
                <button
                  type="button"
                  disabled={!canContinueStep2}
                  onClick={() => goToStep(3, "forward")}
                  className="section-eyebrow flex-1 text-xs px-5 py-3 btn-radius font-semibold disabled:opacity-40 transition-opacity"
                  style={{
                    backgroundColor: business.primary_color,
                    color: ctaTextColor,
                  }}
                >
                  Continuar
                </button>
              ) : null}

              {step === 3 ? (
                <button
                  type="button"
                  disabled={!canConfirmStep3 || submitting}
                  onClick={handleConfirm}
                  className="section-eyebrow flex-1 text-xs px-5 py-3 btn-radius font-semibold disabled:opacity-40 transition-opacity"
                  style={{
                    backgroundColor: business.primary_color,
                    color: ctaTextColor,
                  }}
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
