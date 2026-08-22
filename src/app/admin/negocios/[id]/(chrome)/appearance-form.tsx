"use client";

import { useEffect, useRef, useState } from "react";
import {
  AnimationPreset,
  Business,
  ButtonStyle,
  ImageRadiusPreset,
  ImageShadowPreset,
  TypographyPreset,
} from "@/types/business";
import { adminUpdateAppearance } from "@/lib/admin/actions";
import { contrastRatio, readableTextColor } from "@/lib/format";
import { DEFAULT_BACKGROUND_COLOR } from "@/lib/appearance-presets";
import { useEditorSelection } from "@/lib/admin/editor-selection-context";
import { useAsyncStatus } from "@/lib/useAsyncStatus";

// Clave estable de este panel en el registro de guardado global (ver
// EditorSelectionContext.setFormDirty/setFormSaveHandler) — comparte la
// categoría "Apariencia" con FotosPanel, que se registra bajo su propia
// clave distinta, así ninguno de los dos pisa al otro.
const FORM_KEY = "apariencia";

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
    | "animation_preset"
    | "image_radius"
    | "image_shadow"
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

const ANIMATION_OPTIONS: { value: AnimationPreset; label: string; hint: string }[] = [
  { value: "ninguna", label: "Ninguna", hint: "Todo visible de entrada, sin movimiento" },
  { value: "sutil", label: "Sutil", hint: "Aparición suave al hacer scroll (recomendado)" },
  { value: "dinamica", label: "Dinámica", hint: "Un poco más de movimiento y escala" },
  { value: "revelado", label: "Reveal", hint: "Aparece como si se descorriera una cortina" },
  { value: "escalonada", label: "Stagger", hint: "Los elementos de una sección aparecen en cadena" },
];

const IMAGE_RADIUS_OPTIONS: { value: ImageRadiusPreset; label: string; hint: string }[] = [
  { value: "recto", label: "Recto", hint: "0px" },
  { value: "suave", label: "Suave", hint: "8px" },
  { value: "redondeado", label: "Redondeado", hint: "16px" },
  { value: "muy-redondeado", label: "Muy redondeado", hint: "24px" },
];

const IMAGE_SHADOW_OPTIONS: { value: ImageShadowPreset; label: string }[] = [
  { value: "ninguna", label: "Ninguna" },
  { value: "suave", label: "Suave" },
  { value: "media", label: "Media" },
  { value: "marcada", label: "Marcada" },
];

const colorInputClasses =
  "h-10 w-full rounded-sm border border-ink-line bg-ink-elevated";

export default function AppearanceForm({ business }: AppearanceFormProps) {
  const { refreshPreview, setFormDirty, setFormSaveHandler } = useEditorSelection();
  const formRef = useRef<HTMLFormElement>(null);
  const [primaryColor, setPrimaryColor] = useState(business.primary_color);
  const [secondaryColor, setSecondaryColor] = useState(
    business.secondary_color
  );
  const [backgroundColor, setBackgroundColor] = useState(
    business.background_color || DEFAULT_BACKGROUND_COLOR
  );
  const [typography, setTypography] = useState<TypographyPreset>(
    business.typography_preset || "elegante"
  );
  const [buttonStyle, setButtonStyle] = useState<ButtonStyle>(
    business.button_style || "recto"
  );
  const [animationPreset, setAnimationPreset] = useState<AnimationPreset>(
    business.animation_preset || "sutil"
  );
  const [imageRadius, setImageRadius] = useState<ImageRadiusPreset>(
    business.image_radius || "recto"
  );
  const [imageShadow, setImageShadow] = useState<ImageShadowPreset>(
    business.image_shadow || "ninguna"
  );
  const { run, dirty, markDirty } = useAsyncStatus();

  // El texto se deriva automáticamente del fondo elegido (el más legible
  // entre claro/oscuro, ver readableTextColor) — no es un color libre
  // aparte: con un fondo totalmente libre, dejar el texto también libre
  // podría producir combinaciones ilegibles sin que nada lo evite.
  const textColor = readableTextColor(backgroundColor);

  // Aviso de contraste (no bloquea el guardado — es la elección del dueño,
  // solo lo alertamos si va a costar leerlo).
  const accentContrast = contrastRatio(primaryColor, backgroundColor);
  const lowAccentContrast = accentContrast !== null && accentContrast < 3;

  async function save(formData: FormData) {
    const result = await run(() => adminUpdateAppearance(business.id, formData));
    if (result.success) refreshPreview();
    return result.success;
  }

  useEffect(() => {
    setFormDirty(FORM_KEY, dirty);
  }, [dirty, setFormDirty]);

  useEffect(() => {
    setFormSaveHandler(FORM_KEY, async () => {
      if (!formRef.current) return false;
      return save(new FormData(formRef.current));
    });
    return () => setFormSaveHandler(FORM_KEY, null);
  });

  return (
    <form
      ref={formRef}
      action={async (formData) => {
        await save(formData);
      }}
      onChange={markDirty}
      className="grid gap-6 max-w-lg"
    >
      <p className="text-xs text-bone-muted -mt-1">
        Personalizá los colores, la tipografía y el fondo de tu web. La
        estructura y el diseño general son de RYVO — así se mantiene
        profesional sin importar qué elijas.
      </p>

      {/* Fondo: color libre — el texto (text_color) se deriva
          automáticamente del que se elija acá (ver readableTextColor),
          así siempre queda legible sin exponer un segundo picker. */}
      <input type="hidden" name="text_color" value={textColor} />
      <div>
        <p className="section-eyebrow text-bone-muted mb-3">Fondo</p>
        <input
          id="background_color"
          name="background_color"
          type="color"
          value={backgroundColor}
          onChange={(e) => setBackgroundColor(e.target.value)}
          className={colorInputClasses}
        />
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

      {/* Estilo de imágenes: presets cerrados (radio + sombra), nunca CSS
          libre — se aplican con .image-frame en Galería/Profesionales/
          Productos/contenido de plantilla (ver globals.css). La preview
          de acá usa el mismo mecanismo data-image-radius/data-image-shadow
          que la página pública (AppearanceScope), así el efecto que se ve
          acá es EXACTAMENTE el real, no una aproximación aparte. */}
      <div>
        <p className="section-eyebrow text-bone-muted mb-3">
          Estilo de imágenes
        </p>
        <div className="grid gap-4 sm:grid-cols-[1fr_auto] sm:items-start">
          <div className="grid gap-4">
            <div>
              <p className="text-xs text-bone-muted mb-2">Radio de borde</p>
              <div className="grid grid-cols-2 gap-2">
                {IMAGE_RADIUS_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 rounded-sm border px-3 py-2 text-sm text-bone cursor-pointer"
                    style={{
                      borderColor:
                        imageRadius === opt.value ? primaryColor : "var(--ink-line)",
                    }}
                  >
                    <input
                      type="radio"
                      name="image_radius"
                      value={opt.value}
                      checked={imageRadius === opt.value}
                      onChange={() => setImageRadius(opt.value)}
                    />
                    {opt.label}
                    <span className="text-xs text-bone-muted">{opt.hint}</span>
                  </label>
                ))}
              </div>
            </div>

            <div>
              <p className="text-xs text-bone-muted mb-2">Sombra</p>
              <div className="grid grid-cols-2 gap-2">
                {IMAGE_SHADOW_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 rounded-sm border px-3 py-2 text-sm text-bone cursor-pointer"
                    style={{
                      borderColor:
                        imageShadow === opt.value ? primaryColor : "var(--ink-line)",
                    }}
                  >
                    <input
                      type="radio"
                      name="image_shadow"
                      value={opt.value}
                      checked={imageShadow === opt.value}
                      onChange={() => setImageShadow(opt.value)}
                    />
                    {opt.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          <div
            data-image-radius={imageRadius}
            data-image-shadow={imageShadow}
            className="justify-self-center sm:justify-self-start"
          >
            <div
              className="image-frame h-24 w-24 bg-ink-elevated bg-cover bg-center"
              style={{
                backgroundImage:
                  "linear-gradient(135deg, color-mix(in srgb, var(--brass) 35%, transparent), transparent)",
              }}
              aria-hidden="true"
            />
            <p className="mt-2 text-center text-[11px] text-bone-muted">Vista previa</p>
          </div>
        </div>
      </div>

      {/* Animaciones: preset único global, sin parámetros por elemento —
          RYVO controla la calidad visual, no hay un panel de animaciones
          "a la Webflow". */}
      <div>
        <p className="section-eyebrow text-bone-muted mb-3">Animaciones</p>
        <div className="grid gap-2">
          {ANIMATION_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-3 rounded-sm border border-ink-line px-3 py-2.5 cursor-pointer"
              style={{
                borderColor:
                  animationPreset === opt.value ? primaryColor : "var(--ink-line)",
              }}
            >
              <input
                type="radio"
                name="animation_preset"
                value={opt.value}
                checked={animationPreset === opt.value}
                onChange={() => setAnimationPreset(opt.value)}
              />
              <div>
                <p className="text-sm text-bone">{opt.label}</p>
                <p className="text-xs text-bone-muted">{opt.hint}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

    </form>
  );
}
