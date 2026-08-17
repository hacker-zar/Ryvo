"use client";

import { useState } from "react";
import { Business, ButtonStyle, TypographyPreset } from "@/types/business";
import { adminUpdateAppearance } from "@/lib/admin/actions";
import { contrastRatio } from "@/lib/format";
import { useEditorSelection } from "@/lib/admin/editor-selection-context";

interface AppearanceFormProps {
  business: Pick<
    Business,
    | "id"
    | "primary_color"
    | "secondary_color"
    | "background_color"
    | "text_color"
    | "typography_preset"
    | "button_style"
  >;
}

const TYPOGRAPHY_OPTIONS: { value: TypographyPreset; label: string; sample: string }[] = [
  { value: "clasica", label: "Clásica", sample: "Georgia, serif" },
  { value: "moderna", label: "Moderna", sample: "sans-serif geométrica" },
  { value: "elegante", label: "Elegante", sample: "display condensada" },
];

const BUTTON_STYLE_OPTIONS: { value: ButtonStyle; label: string }[] = [
  { value: "redondeado", label: "Redondeado" },
  { value: "suave", label: "Suave" },
  { value: "recto", label: "Recto" },
];

const colorInputClasses =
  "h-10 w-full rounded-sm border border-ink-line bg-ink-elevated";

export default function AppearanceForm({ business }: AppearanceFormProps) {
  const { refreshPreview } = useEditorSelection();
  const [primaryColor, setPrimaryColor] = useState(business.primary_color);
  const [secondaryColor, setSecondaryColor] = useState(
    business.secondary_color
  );
  const [backgroundColor, setBackgroundColor] = useState(
    business.background_color || "#1a1815"
  );
  const [textColor, setTextColor] = useState(business.text_color || "#f7f4ee");
  const [typography, setTypography] = useState<TypographyPreset>(
    business.typography_preset || "elegante"
  );
  const [buttonStyle, setButtonStyle] = useState<ButtonStyle>(
    business.button_style || "recto"
  );
  const [status, setStatus] = useState<"idle" | "submitting" | "saved" | "error">(
    "idle"
  );
  const [error, setError] = useState("");

  // Avisos de contraste (no bloquean el guardado — es la elección del
  // dueño, solo lo alertamos si va a costar leerlo). Umbrales WCAG: 4.5:1
  // para texto de cuerpo, 3:1 para el acento (eyebrows/bordes, texto corto).
  const textContrast = contrastRatio(textColor, backgroundColor);
  const accentContrast = contrastRatio(primaryColor, backgroundColor);
  const lowTextContrast = textContrast !== null && textContrast < 4.5;
  const lowAccentContrast = accentContrast !== null && accentContrast < 3;

  async function handleSubmit(formData: FormData) {
    setStatus("submitting");
    setError("");
    const result = await adminUpdateAppearance(business.id, formData);
    if (result.success) {
      setStatus("saved");
      refreshPreview();
    } else {
      setStatus("error");
      setError(result.error ?? "No se pudo guardar.");
    }
  }

  return (
    <form action={handleSubmit} className="grid gap-6 max-w-lg">
      {/* Colores */}
      <div>
        <p className="section-eyebrow text-bone-muted mb-3">Colores</p>
        <div className="grid grid-cols-2 gap-4">
          <div className="grid gap-1.5">
            <label htmlFor="primary_color" className="text-xs text-bone-muted">
              Principal
            </label>
            <input
              id="primary_color"
              name="primary_color"
              type="color"
              value={primaryColor}
              onChange={(e) => setPrimaryColor(e.target.value)}
              className={colorInputClasses}
            />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="secondary_color" className="text-xs text-bone-muted">
              Secundario
            </label>
            <input
              id="secondary_color"
              name="secondary_color"
              type="color"
              value={secondaryColor}
              onChange={(e) => setSecondaryColor(e.target.value)}
              className={colorInputClasses}
            />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="background_color" className="text-xs text-bone-muted">
              Fondo
            </label>
            <input
              id="background_color"
              name="background_color"
              type="color"
              value={backgroundColor}
              onChange={(e) => setBackgroundColor(e.target.value)}
              className={colorInputClasses}
            />
          </div>
          <div className="grid gap-1.5">
            <label htmlFor="text_color" className="text-xs text-bone-muted">
              Texto
            </label>
            <input
              id="text_color"
              name="text_color"
              type="color"
              value={textColor}
              onChange={(e) => setTextColor(e.target.value)}
              className={colorInputClasses}
            />
          </div>
        </div>

        {lowTextContrast ? (
          <p className="mt-3 text-xs text-red-400">
            ⚠️ El color de texto contrasta poco contra el fondo (
            {textContrast?.toFixed(1)}:1) — puede costar leerlo. Se
            recomienda al menos 4.5:1.
          </p>
        ) : null}
        {lowAccentContrast ? (
          <p className="mt-3 text-xs text-red-400">
            ⚠️ El color principal contrasta poco contra el fondo (
            {accentContrast?.toFixed(1)}:1) — se usa en títulos y bordes,
            puede costar verlo. Se recomienda al menos 3:1.
          </p>
        ) : null}
      </div>

      {/* Tipografía */}
      <div>
        <p className="section-eyebrow text-bone-muted mb-3">Tipografía</p>
        <div className="grid gap-2">
          {TYPOGRAPHY_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-3 rounded-sm border border-ink-line px-3 py-2.5 cursor-pointer"
              style={{
                borderColor:
                  typography === opt.value ? primaryColor : "var(--ink-line)",
              }}
            >
              <input
                type="radio"
                name="typography_preset"
                value={opt.value}
                checked={typography === opt.value}
                onChange={() => setTypography(opt.value)}
              />
              <div>
                <p className="text-sm text-bone">{opt.label}</p>
                <p className="text-xs text-bone-muted">{opt.sample}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {/* Estilo de botones */}
      <div>
        <p className="section-eyebrow text-bone-muted mb-3">
          Estilo de botones
        </p>
        <div className="flex gap-3">
          {BUTTON_STYLE_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-2 text-sm text-bone cursor-pointer"
            >
              <input
                type="radio"
                name="button_style"
                value={opt.value}
                checked={buttonStyle === opt.value}
                onChange={() => setButtonStyle(opt.value)}
              />
              {opt.label}
            </label>
          ))}
        </div>
      </div>

      {status === "error" ? (
        <p className="text-sm text-red-400">{error}</p>
      ) : null}
      {status === "saved" ? (
        <p className="text-sm" style={{ color: primaryColor }}>
          Guardado. Los cambios ya se ven en el sitio público.
        </p>
      ) : null}

      <button
        type="submit"
        disabled={status === "submitting"}
        className="section-eyebrow rounded-sm text-ink font-semibold text-xs px-6 py-3.5 hover:opacity-90 transition-opacity disabled:opacity-50 w-fit"
        style={{ backgroundColor: primaryColor }}
      >
        {status === "submitting" ? "Guardando..." : "Guardar apariencia"}
      </button>
    </form>
  );
}
