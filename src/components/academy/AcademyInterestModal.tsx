"use client";

import Icon from "@/components/ui/Icon";
import { useEffect, useMemo, useState } from "react";
import { Academy, AcademyCategoryWithRelations, Business } from "@/types/business";
import {
  AcademyInterestSeed,
  useAcademyInterestModal,
} from "@/lib/academy-interest-modal-context";
import { submitAcademyInterest } from "@/lib/actions/academy-actions";
import { readableTextColor } from "@/lib/format";
import AcademyStepIndicator, { AcademyStepId } from "./AcademyStepIndicator";
import StepCategory from "./steps/StepCategory";
import StepDetails from "./steps/StepDetails";
import StepConfirm from "./steps/StepConfirm";
import StepSuccess from "./steps/StepSuccess";

interface AcademyInterestModalProps {
  business: Pick<Business, "name" | "primary_color" | "whatsapp">;
  academy: Academy;
  categories: AcademyCategoryWithRelations[];
}

const STEPS: AcademyStepId[] = ["category", "details", "confirm"];

// Mismo motivo que BookingModal: el gate de `isOpen` vive en
// AcademyInterestModalLazy (afuera de este módulo, cargado con
// next/dynamic) para que el code-splitting sirva de algo.
export default function AcademyInterestModal(
  props: AcademyInterestModalProps & { openCount: number; seed: AcademyInterestSeed | null }
) {
  const { openCount, seed, ...rest } = props;
  if (rest.categories.length === 0) return null;
  return <AcademyInterestModalContent key={openCount} {...rest} seed={seed} />;
}

type Step = AcademyStepId | "success";

function AcademyInterestModalContent({
  business,
  academy,
  categories,
  seed,
}: AcademyInterestModalProps & { seed: AcademyInterestSeed | null }) {
  const { close } = useAcademyInterestModal();

  const seededCategory = useMemo(
    () => categories.find((c) => c.id === seed?.categoryId) ?? null,
    [categories, seed?.categoryId]
  );

  const [step, setStep] = useState<Step>("category");
  const [direction, setDirection] = useState<"forward" | "backward">("forward");
  const [selectedCategory, setSelectedCategory] =
    useState<AcademyCategoryWithRelations | null>(seededCategory);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
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

  const stepIndex = step === "success" ? -1 : STEPS.indexOf(step);

  function goToStep(next: Step, dir: "forward" | "backward") {
    setDirection(dir);
    setStep(next);
  }

  function goNext() {
    const next = STEPS[stepIndex + 1];
    if (next) goToStep(next, "forward");
  }

  function goBack() {
    const prev = STEPS[stepIndex - 1];
    if (prev) goToStep(prev, "backward");
  }

  async function handleSubmit() {
    if (!selectedCategory) return;
    setSubmitting(true);
    setSubmitError("");

    const result = await submitAcademyInterest({
      business_id: academy.business_id,
      academy_category_id: selectedCategory.id,
      name,
      phone,
      email: email || undefined,
    });

    setSubmitting(false);

    if (result.success) {
      goToStep("success", "forward");
    } else {
      setSubmitError(result.error ?? "No se pudo enviar la solicitud.");
    }
  }

  const canContinueCategory = Boolean(selectedCategory);
  const canContinueDetails = name.trim().length > 0 && phone.trim().length > 0;
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
        className="absolute inset-0 bg-black/70 backdrop-blur-sm anim-fade"
      />

      {/* Modal */}
      <div
        className="relative w-full sm:max-w-md sm:mx-4 bg-ink border border-ink-line sheet-radius max-h-[92vh] sm:max-h-[85vh] flex flex-col anim-slide-up"
        style={{ ["--brass" as string]: business.primary_color }}
      >
        {/* Header con progreso */}
        {step !== "success" ? (
          <div className="shrink-0 border-b border-ink-line px-5 py-4 flex items-center justify-between gap-3 min-w-0">
            <AcademyStepIndicator currentStepId={step} primaryColor={business.primary_color} />
            <button
              type="button"
              onClick={close}
              aria-label="Cerrar"
              className="text-bone-muted hover:text-bone focus-visible:ring-2 focus-visible:ring-brass radius-sm transition-colors shrink-0"
            >
              <Icon name="close" size={20} />
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
          {step === "category" ? (
            <StepCategory
              categories={categories}
              selectedCategoryId={selectedCategory?.id ?? null}
              onSelect={setSelectedCategory}
              primaryColor={business.primary_color}
              preselected={Boolean(seededCategory)}
            />
          ) : null}

          {step === "details" ? (
            <StepDetails
              business={business}
              primaryColor={business.primary_color}
              name={name}
              phone={phone}
              email={email}
              onChangeName={setName}
              onChangePhone={setPhone}
              onChangeEmail={setEmail}
            />
          ) : null}

          {step === "confirm" && selectedCategory ? (
            <StepConfirm
              category={selectedCategory}
              name={name}
              phone={phone}
              primaryColor={business.primary_color}
            />
          ) : null}

          {step === "success" && selectedCategory ? (
            <StepSuccess
              business={business}
              contactPhone={academy.contact_phone}
              categoryName={selectedCategory.name}
              onClose={close}
            />
          ) : null}
        </div>

        {/* Footer con acciones */}
        {step !== "success" ? (
          <div className="shrink-0 border-t border-ink-line px-5 py-4">
            {step === "confirm" && submitError ? (
              <p className="text-sm text-red-400 mb-3">{submitError}</p>
            ) : null}
            <div className="flex gap-3">
              {stepIndex > 0 ? (
                <button
                  type="button"
                  onClick={goBack}
                  className="section-eyebrow text-xs px-5 py-3 btn-radius border border-ink-line text-bone-muted hover:text-bone focus-visible:ring-2 focus-visible:ring-brass transition-colors"
                >
                  Volver
                </button>
              ) : null}

              {step === "category" ? (
                <button
                  type="button"
                  disabled={!canContinueCategory}
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
                  disabled={!canContinueDetails}
                  onClick={goNext}
                  className="section-eyebrow flex-1 text-xs px-5 py-3 btn-radius font-semibold disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-ink focus-visible:ring-brass transition-opacity"
                  style={{ backgroundColor: business.primary_color, color: ctaTextColor }}
                >
                  Continuar
                </button>
              ) : null}

              {step === "confirm" ? (
                <button
                  type="button"
                  disabled={submitting}
                  onClick={handleSubmit}
                  className="section-eyebrow flex-1 text-xs px-5 py-3 btn-radius font-semibold disabled:opacity-40 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-ink focus-visible:ring-brass transition-opacity"
                  style={{ backgroundColor: business.primary_color, color: ctaTextColor }}
                >
                  {submitting ? "Enviando..." : "Enviar solicitud"}
                </button>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </div>
  );
}
