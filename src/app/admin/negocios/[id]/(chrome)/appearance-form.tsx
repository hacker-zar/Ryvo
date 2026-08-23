"use client";

import Icon from "@/components/ui/Icon";
import { useEffect, useRef, useState } from "react";
import {
  AnimationPreset,
  Business,
  ButtonStyle,
  Density,
  ImageRadiusPreset,
  ImageShadowPreset,
  ImageTreatment,
  TypographyPreset,
} from "@/types/business";
import { adminUpdateAppearance } from "@/lib/admin/actions";
import { contrastRatio, readableTextColor } from "@/lib/format";
import {
  DEFAULT_BACKGROUND_COLOR,
  PUBLIC_ANIMATION_PRESETS,
} from "@/lib/appearance-presets";
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
    | "image_treatment"
    | "density"
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

// Tres opciones, no cinco — ver PUBLIC_ANIMATION_PRESETS. "Editorial"
// guarda el valor histórico `revelado` a propósito (el CHECK de la base
// no acepta valores nuevos sin migración). Un negocio con `dinamica` o
// `escalonada` guardadas de antes no aparece seleccionado en ninguna de
// estas tres, y al guardar pasa a "Sutil" — que es exactamente cómo ya
// se estaba viendo.
const ANIMATION_OPTIONS: { value: AnimationPreset; label: string; hint: string }[] = [
  { value: "ninguna", label: "Ninguna", hint: "Todo visible de entrada, sin movimiento" },
  { value: "sutil", label: "Sutil", hint: "Aparición suave al hacer scroll (recomendado)" },
  { value: "revelado", label: "Editorial", hint: "El contenido se descorre como una cortina" },
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

const IMAGE_TREATMENT_OPTIONS: { value: ImageTreatment; label: string }[] = [
  { value: "natural", label: "Natural" },
  { value: "byn", label: "Blanco y negro" },
  { value: "contraste", label: "Alto contraste" },
  { value: "calido", label: "Cálido" },
];

// "" = heredar de la plantilla. Es un valor real, no "sin valor": ver
// AppearanceScope — guardarlo así hace que cambiar de plantilla también
// cambie el aire, en vez de quedar clavado en el de la plantilla vieja.
const DENSITY_OPTIONS: { value: Density | ""; label: string; hint: string }[] = [
  { value: "", label: "Automática", hint: "según tu plantilla" },
  { value: "compacta", label: "Compacta", hint: "más contenido a la vista" },
  { value: "estandar", label: "Estándar", hint: "equilibrada" },
  { value: "amplia", label: "Amplia", hint: "más aire, más editorial" },
];

/** Muestra para la vista previa de imagen: un degradado con dos matices
 *  distintos (cálido y frío) para que Blanco y negro / Alto contraste /
 *  Cálido se distingan entre sí. SVG inline, sin request de red. */
const IMAGE_SAMPLE_SRC =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c9a15a"/><stop offset="0.55" stop-color="#8a6b4f"/><stop offset="1" stop-color="#3f5670"/></linearGradient></defs><rect width="96" height="96" fill="url(#g)"/><circle cx="30" cy="34" r="16" fill="#f2e6d2" opacity="0.75"/></svg>`
  );

const colorInputClasses =
  "h-10 w-full radius-sm border border-ink-line bg-ink-elevated";

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
  // `dinamica`/`escalonada` ya no se ofrecen: un negocio que las tenga
  // guardadas arranca mostrando "Sutil" seleccionada, que es como ya se
  // venía viendo su sitio (ver globals.css — esos dos valores caen en el
  // `.reveal` base).
  const [animationPreset, setAnimationPreset] = useState<AnimationPreset>(() =>
    PUBLIC_ANIMATION_PRESETS.includes(
      business.animation_preset as (typeof PUBLIC_ANIMATION_PRESETS)[number]
    )
      ? (business.animation_preset as AnimationPreset)
      : "sutil"
  );
  const [imageRadius, setImageRadius] = useState<ImageRadiusPreset>(
    business.image_radius || "recto"
  );
  const [imageShadow, setImageShadow] = useState<ImageShadowPreset>(
    business.image_shadow || "ninguna"
  );
  const [imageTreatment, setImageTreatment] = useState<ImageTreatment>(
    business.image_treatment || "natural"
  );
  // `?? ""` y no `|| ""`: son equivalentes acá porque "" es el default,
  // pero deja explícito que la cadena vacía es un valor elegible.
  const [density, setDensity] = useState<Density | "">(business.density ?? "");
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
          <p className="mt-3 text-xs text-danger flex items-start gap-1.5">
            <Icon name="alert" size={16} className="shrink-0 mt-px" />
            <span>
            El color principal contrasta poco contra el fondo elegido (
            {accentContrast?.toFixed(1)}:1) — se usa en títulos y bordes,
            puede costar verlo. Se recomienda al menos 3:1.
            </span>
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
              className="flex items-center gap-3 radius-sm border border-ink-line px-3 py-2.5 cursor-pointer"
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
                    className="flex items-center gap-2 radius-sm border px-3 py-2 text-sm text-bone cursor-pointer"
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
                    className="flex items-center gap-2 radius-sm border px-3 py-2 text-sm text-bone cursor-pointer"
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

            <div>
              <p className="text-xs text-bone-muted mb-2">Tratamiento</p>
              <div className="grid grid-cols-2 gap-2">
                {IMAGE_TREATMENT_OPTIONS.map((opt) => (
                  <label
                    key={opt.value}
                    className="flex items-center gap-2 radius-sm border px-3 py-2 text-sm text-bone cursor-pointer"
                    style={{
                      borderColor:
                        imageTreatment === opt.value ? primaryColor : "var(--ink-line)",
                    }}
                  >
                    <input
                      type="radio"
                      name="image_treatment"
                      value={opt.value}
                      checked={imageTreatment === opt.value}
                      onChange={() => setImageTreatment(opt.value)}
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
            data-image-treatment={imageTreatment}
            className="justify-self-center sm:justify-self-start"
          >
            {/* <img> real y no un div con background-image: el filtro de
                tratamiento se aplica sobre `.image-frame img` (ver
                globals.css), que es exactamente el mismo selector que
                corre en el sitio público. Así la vista previa no puede
                mentir — usa el mismo camino de CSS, no una imitación.
                eslint-disable porque es un data URI inline de 1 muestra,
                no un asset que next/image pueda optimizar. */}
            <div className="image-frame h-24 w-24 overflow-hidden bg-ink-elevated">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={IMAGE_SAMPLE_SRC}
                alt=""
                aria-hidden="true"
                className="h-full w-full object-cover"
              />
            </div>
            <p className="mt-2 text-center text-[11px] text-bone-muted">Vista previa</p>
          </div>
        </div>
      </div>

      {/* Densidad: el eje que más separa "lujo" de "catálogo". Es lo
          único que hace que dos plantillas con la misma composición
          (Atelier y Studio comparten blueprint) se lean distinto. */}
      <div>
        <p className="section-eyebrow text-bone-muted mb-1">Densidad</p>
        <p className="text-[11px] text-bone-muted/70 mb-3 max-w-sm">
          Cuánto aire hay entre secciones. Por defecto sigue a tu
          plantilla.
        </p>
        <div className="grid gap-2">
          {DENSITY_OPTIONS.map((opt) => (
            <label
              key={opt.value}
              className="flex items-center gap-3 radius-sm border px-3 py-2.5 cursor-pointer"
              style={{
                borderColor:
                  density === opt.value ? primaryColor : "var(--ink-line)",
              }}
            >
              <input
                type="radio"
                name="density"
                value={opt.value}
                checked={density === opt.value}
                onChange={() => setDensity(opt.value)}
              />
              <span className="text-sm text-bone">{opt.label}</span>
              <span className="text-xs text-bone-muted">{opt.hint}</span>
            </label>
          ))}
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
              className="flex items-center gap-3 radius-sm border border-ink-line px-3 py-2.5 cursor-pointer"
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
