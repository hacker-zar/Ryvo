"use client";

import { useState } from "react";
import Link from "next/link";
import { registerBusiness } from "@/lib/actions/register-business";
import { marketingInputClasses } from "@/lib/ui-classes";
import { Template } from "@/types/business";
import TemplatePicker from "@/components/admin/TemplatePicker";

type Step = 1 | 2 | 3;

const BUSINESS_TYPES = [
  { value: "peluqueria", label: "Peluquería" },
  { value: "barberia", label: "Barbería" },
  { value: "estilista", label: "Estilista independiente" },
  { value: "otro", label: "Otro" },
];

interface RegistrationWizardProps {
  officialTemplates: Template[];
}

/**
 * Wizard de registro self-service: tres pantallas (Plantilla → Cuenta →
 * Negocio), una sola confirmación al final. No hay guardado intermedio en
 * el server — accounts.business_id es NOT NULL, así que no existe una
 * cuenta "sin negocio todavía" a medio camino (ver registerBusiness). El
 * paso de plantilla es puramente una elección en memoria (`selectedTemplateId`)
 * hasta el submit final, igual que el resto de los campos de este wizard.
 * Mismo patrón visual de pasos que el wizard de reserva
 * (BookingModal/StepIndicator): step-forward/step-backward ya definidos
 * en globals.css.
 */
export default function RegistrationWizard({
  officialTemplates,
}: RegistrationWizardProps) {
  const [step, setStep] = useState<Step>(1);
  const [direction, setDirection] = useState<"forward" | "backward">(
    "forward"
  );
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(
    null
  );

  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [businessName, setBusinessName] = useState("");
  const [businessType, setBusinessType] = useState("peluqueria");
  const [city, setCity] = useState("");
  const [whatsapp, setWhatsapp] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function goToStep(next: Step, dir: "forward" | "backward") {
    setError("");
    setDirection(dir);
    setStep(next);
  }

  const canContinueStep2 =
    ownerName.trim() && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) &&
    password.length >= 8;
  const canSubmitStep3 = businessName.trim().length > 0;

  async function handleSubmit() {
    setSubmitting(true);
    setError("");

    const formData = new FormData();
    formData.set("owner_name", ownerName);
    formData.set("email", email);
    formData.set("password", password);
    formData.set("business_name", businessName);
    formData.set("business_type", businessType);
    formData.set("city", city);
    formData.set("whatsapp", whatsapp);
    formData.set("template_id", selectedTemplateId ?? "");

    const result = await registerBusiness(formData);
    // Si salió bien, registerBusiness hace redirect() server-side y esta
    // línea no se alcanza (mismo patrón que loginAdmin/LoginForm).
    setSubmitting(false);
    if (result && !result.success) {
      setError(result.error ?? "No se pudo crear tu negocio.");
    }
  }

  const stepTitles: Record<Step, [string, string]> = {
    1: ["Paso 1 de 3 · Tu plantilla", "Elegí el estilo de tu página"],
    2: ["Paso 2 de 3 · Tu cuenta", "Creá tu cuenta"],
    3: ["Paso 3 de 3 · Tu negocio", "Creemos tu espacio en RYVO."],
  };

  return (
    <div className={`w-full ${step === 1 ? "max-w-3xl" : "max-w-md"}`}>
      <p className="text-xs uppercase tracking-[0.25em] text-signal text-center">
        {stepTitles[step][0]}
      </p>
      <h1 className="mt-3 text-2xl md:text-3xl font-semibold text-porcelain text-center">
        {stepTitles[step][1]}
      </h1>

      <div
        key={step}
        className={`mt-8 ${step === 1 ? "" : "grid gap-4"} ${
          direction === "forward" ? "step-forward" : "step-backward"
        }`}
      >
        {step === 1 ? (
          <TemplatePicker
            officialTemplates={officialTemplates}
            currentTemplateId={selectedTemplateId}
            onSelect={(id) => {
              setSelectedTemplateId(id);
              goToStep(2, "forward");
            }}
          />
        ) : step === 2 ? (
          <>
            <div className="grid gap-1.5">
              <label htmlFor="owner_name" className="text-xs text-porcelain-muted">
                Nombre
              </label>
              <input
                id="owner_name"
                type="text"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                autoFocus
                className={marketingInputClasses}
              />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="email" className="text-xs text-porcelain-muted">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={marketingInputClasses}
              />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="password" className="text-xs text-porcelain-muted">
                Contraseña
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres"
                className={marketingInputClasses}
              />
            </div>
          </>
        ) : (
          <>
            <div className="grid gap-1.5">
              <label htmlFor="business_name" className="text-xs text-porcelain-muted">
                Nombre del negocio
              </label>
              <input
                id="business_name"
                type="text"
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                autoFocus
                placeholder="Ej: Bella Vista Peluquería"
                className={marketingInputClasses}
              />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="business_type" className="text-xs text-porcelain-muted">
                Tipo de negocio
              </label>
              <select
                id="business_type"
                value={businessType}
                onChange={(e) => setBusinessType(e.target.value)}
                className={marketingInputClasses}
              >
                {BUSINESS_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="city" className="text-xs text-porcelain-muted">
                Ciudad
              </label>
              <input
                id="city"
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                className={marketingInputClasses}
              />
            </div>
            <div className="grid gap-1.5">
              <label htmlFor="whatsapp" className="text-xs text-porcelain-muted">
                WhatsApp
              </label>
              <input
                id="whatsapp"
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="Con código de país, solo números"
                className={marketingInputClasses}
              />
            </div>
          </>
        )}
      </div>

      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

      <div className="mt-8 flex gap-3">
        {step === 2 ? (
          <button
            type="button"
            onClick={() => goToStep(1, "backward")}
            className="rounded-full border border-graphite-line text-porcelain text-sm px-6 py-3 hover:border-porcelain-muted focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-graphite transition-colors"
          >
            Atrás
          </button>
        ) : null}
        {step === 3 ? (
          <button
            type="button"
            onClick={() => goToStep(2, "backward")}
            className="rounded-full border border-graphite-line text-porcelain text-sm px-6 py-3 hover:border-porcelain-muted focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-graphite transition-colors"
          >
            Atrás
          </button>
        ) : null}

        {step === 2 ? (
          <button
            type="button"
            disabled={!canContinueStep2}
            onClick={() => goToStep(3, "forward")}
            className="flex-1 rounded-full bg-porcelain text-graphite text-sm font-semibold px-7 py-3 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-graphite transition-opacity disabled:opacity-40"
          >
            Continuar
          </button>
        ) : null}
        {step === 3 ? (
          <button
            type="button"
            disabled={!canSubmitStep3 || submitting}
            onClick={handleSubmit}
            className="flex-1 rounded-full bg-porcelain text-graphite text-sm font-semibold px-7 py-3 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-graphite transition-opacity disabled:opacity-40"
          >
            {submitting ? "Creando..." : "Crear mi negocio"}
          </button>
        ) : null}
      </div>

      <p className="mt-6 text-center text-xs text-porcelain-muted">
        ¿Ya tenés cuenta?{" "}
        <Link href="/admin/login" className="text-porcelain hover:text-signal transition-colors">
          Ingresá
        </Link>
      </p>
    </div>
  );
}
