"use client";

import { useState } from "react";
import Link from "next/link";
import { marketingInputClasses } from "@/lib/ui-classes";
import { submitPageRequest } from "@/lib/actions/page-request-actions";

const BUSINESS_TYPE_SUGGESTIONS = [
  "Peluquería",
  "Barbería",
  "Estudio de belleza",
  "Otro negocio local",
];

/**
 * Formulario de una sola pantalla — a propósito no es un wizard como
 * /registro: esto es un lead ("contactame"), no un alta de cuenta, así
 * que no hay pasos que justificar. Estado de éxito reemplaza el form en
 * el mismo componente (sin redirect), mismo criterio que StepSuccess de
 * BookingModal/AcademyInterestModal.
 */
export default function RequestForm() {
  const [status, setStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [error, setError] = useState("");

  async function handleSubmit(formData: FormData) {
    setStatus("submitting");
    setError("");
    const result = await submitPageRequest({
      owner_name: String(formData.get("owner_name") || ""),
      business_name: String(formData.get("business_name") || ""),
      whatsapp: String(formData.get("whatsapp") || ""),
      instagram: String(formData.get("instagram") || ""),
      business_type: String(formData.get("business_type") || ""),
      what_you_want: String(formData.get("what_you_want") || ""),
      comments: String(formData.get("comments") || ""),
    });
    if (result.success) {
      setStatus("success");
    } else {
      setStatus("error");
      setError(result.error ?? "No se pudo enviar la solicitud.");
    }
  }

  if (status === "success") {
    return (
      <div className="text-center anim-fade">
        <p className="text-xs uppercase tracking-[0.25em] text-signal">Listo</p>
        <h1 className="mt-4 text-3xl md:text-4xl font-semibold text-porcelain">
          Recibimos tu solicitud.
        </h1>
        <p className="mt-4 text-porcelain-muted leading-relaxed max-w-md mx-auto">
          Vamos a revisar la información de tu negocio y nos vamos a poner
          en contacto con vos.
        </p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-full border border-graphite-line text-porcelain text-sm px-7 py-3.5 hover:border-porcelain-muted transition-colors"
        >
          Volver al inicio
        </Link>
      </div>
    );
  }

  return (
    <div>
      <p className="text-xs uppercase tracking-[0.25em] text-signal text-center">
        Solicitar mi página
      </p>
      <h1 className="mt-4 text-3xl md:text-4xl font-semibold text-porcelain text-center">
        Contanos sobre tu negocio.
      </h1>
      <p className="mt-3 text-porcelain-muted text-center max-w-sm mx-auto">
        Te contactamos para coordinar los detalles y armar tu página.
      </p>

      <form action={handleSubmit} className="mt-10 grid gap-4">
        <div className="grid gap-1.5">
          <label htmlFor="owner_name" className="text-xs text-porcelain-muted">
            Nombre
          </label>
          <input id="owner_name" name="owner_name" required className={marketingInputClasses} />
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="business_name" className="text-xs text-porcelain-muted">
            Nombre del negocio
          </label>
          <input
            id="business_name"
            name="business_name"
            required
            className={marketingInputClasses}
          />
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="whatsapp" className="text-xs text-porcelain-muted">
            WhatsApp
          </label>
          <input
            id="whatsapp"
            name="whatsapp"
            required
            placeholder="341 1234567"
            className={marketingInputClasses}
          />
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="instagram" className="text-xs text-porcelain-muted">
            Instagram
          </label>
          <input
            id="instagram"
            name="instagram"
            placeholder="@tunegocio"
            className={marketingInputClasses}
          />
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="business_type" className="text-xs text-porcelain-muted">
            Tipo de negocio
          </label>
          <input
            id="business_type"
            name="business_type"
            list="business_type_suggestions"
            className={marketingInputClasses}
          />
          <datalist id="business_type_suggestions">
            {BUSINESS_TYPE_SUGGESTIONS.map((s) => (
              <option key={s} value={s} />
            ))}
          </datalist>
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="what_you_want" className="text-xs text-porcelain-muted">
            ¿Qué querés que tenga tu página?
          </label>
          <textarea
            id="what_you_want"
            name="what_you_want"
            rows={3}
            className={marketingInputClasses}
          />
        </div>

        <div className="grid gap-1.5">
          <label htmlFor="comments" className="text-xs text-porcelain-muted">
            Comentarios adicionales
          </label>
          <textarea id="comments" name="comments" rows={2} className={marketingInputClasses} />
        </div>

        {error ? <p className="text-sm text-red-400">{error}</p> : null}

        <button
          type="submit"
          disabled={status === "submitting"}
          className="mt-2 rounded-full bg-porcelain text-graphite text-sm font-semibold px-7 py-3.5 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-graphite transition-opacity disabled:opacity-60"
        >
          {status === "submitting" ? "Enviando..." : "Solicitar mi página"}
        </button>
      </form>
    </div>
  );
}
