"use client";

import { useState } from "react";
import { Business, ButtonStyle, TypographyPreset } from "@/types/business";
import { adminUpdateAppearance } from "@/lib/admin/actions";
import { contrastRatio } from "@/lib/format";
import {
  BACKGROUND_VARIANTS,
  BackgroundVariant,
  backgroundVariantFor,
} from "@/lib/appearance-presets";
import { useEditorSelection } from "@/lib/admin/editor-selection-context";
import { useAsyncStatus } from "@/lib/useAsyncStatus";
import SaveStatus from "@/components/ui/SaveStatus";

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

const BACKGROUND_OPTIONS = Object.entries(BACKGROUND_VARIANTS) as [
  BackgroundVariant,
  (typeof BACKGROUND_VARIANTS)[BackgroundVariant],
][];

const colorInputClasses =
  "h-10 w-full rounded-sm border border-ink-line bg-ink-elevated";

export default function AppearanceForm({ business }: AppearanceFormProps) {
  const { refreshPreview } = useEditorSelection();
  const [primaryColor, setPrimaryColor] = useState(business.primary_color);
  const [secondaryColor, setSecondaryColor] = useState(
    business.secondary_color
  );
  const [backgroundVariant, setBackgroundVariant] = useState<BackgroundVariant>(
    backgroundVariantFor(business.background_color)
  );
  const [typography, setTypography] = useState<TypographyPreset>(
    business.typography_preset || "elegante"
  );
  const [buttonStyle, setButtonStyle] = useState<ButtonStyle>(
    business.button_style || "recto"
  );
  const { status, error, run, isPending } = useAsyncStatus();

  const backgroundPreset = BACKGROUND_VARIANTS[backgroundVariant];

  // Aviso de contraste (no bloquea el guardado — es la elección del dueño,
  // solo lo alertamos si va a costar leerlo). El fondo/texto ya vienen
  // curados por RYVO con buen contraste entre sí; lo único que puede
  // quedar bajo es el color principal elegido libremente contra ese fondo.
  const accentContrast = contrastRatio(primaryColor, backgroundPreset.background);
  const lowAccentContrast = accentContrast !== null && accentContrast < 3;

  async function handleSubmit(formData: FormData) {
    const result = await run(() => adminUpdateAppearance(business.id, formData));
    if (result.success) refreshPreview();
  }

  return (
    <form action={handleSubmit} className="grid gap-6 max-w-lg">
      <p className="text-xs text-bone-muted -mt-1">
        Personalizá los colores, la tipografía y el fondo de tu web. La
        estructura y el diseño general son de RYVO — así se mantiene
        profesional sin importar qué elijas.
      </p>

      {/* Fondo: variante prediseñada, no un color libre — ver
          appearance-presets.ts. Se guarda en las mismas columnas
          background_color/text_color de siempre. */}
      <input type="hidden" name="background_color" value={backgroundPreset.background} />
      <input type="hidden" name="text_color" value={backgroundPreset.text} />
      <div>
        <p className="section-eyebrow text-bone-muted mb-3">Fondo</p>
        <div className="flex gap-3">
          {BACKGROUND_OPTIONS.map(([value, preset]) => (
            <label
              key={value}
              className="flex-1 flex items-center gap-3 rounded-sm border px-3 py-2.5 cursor-pointer"
              style={{
                borderColor:
                  backgroundVariant === value ? primaryColor : "var(--ink-line)",
              }}
            >
              <input
                type="radio"
                name="background_variant"
                checked={backgroundVariant === value}
                onChange={() => setBackgroundVariant(value)}
              />
              <span
                aria-hidden="true"
                className="h-6 w-6 rounded-full border border-ink-line shrink-0"
                style={{ backgroundColor: preset.background }}
              />
              <span className="text-sm text-bone">{preset.label}</span>
            </label>
          ))}
        </div>
      </div>

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
        </div>

        {lowAccentContrast ? (
          <p className="mt-3 text-xs text-red-400">
            ⚠️ El color principal contrasta poco contra el fondo elegido (
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

      <SaveStatus
        status={status}
        error={error}
        savedLabel="Guardado. Los cambios ya se ven en el sitio público."
        successColor={primaryColor}
      />

      <button
        type="submit"
        disabled={isPending}
        className="section-eyebrow rounded-sm text-ink font-semibold text-xs px-6 py-3.5 hover:opacity-90 transition-opacity disabled:opacity-50 w-fit"
        style={{ backgroundColor: primaryColor }}
      >
        {isPending ? "Guardando..." : "Guardar apariencia"}
      </button>
    </form>
  );
}
