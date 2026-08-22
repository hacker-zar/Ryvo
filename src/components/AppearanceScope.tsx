import { Business } from "@/types/business";
import { DEFAULT_BACKGROUND_COLOR, DEFAULT_TEXT_COLOR } from "@/lib/appearance-presets";
import { isLightColor } from "@/lib/format";
import { resolvePalette } from "@/lib/palette-presets";
import { LAYOUT_BLUEPRINTS } from "@/lib/templates/blueprints";

interface AppearanceScopeProps {
  business: Pick<
    Business,
    | "typography_preset"
    | "button_style"
    | "background_color"
    | "text_color"
    | "primary_color"
    | "animation_preset"
    | "template_layout"
    | "palette_id"
    | "image_radius"
    | "image_shadow"
  >;
  children: React.ReactNode;
}

/**
 * Aplica la apariencia configurable del negocio (tipografía, estilo de
 * botones, estilo de imágenes, colores de fondo/texto) a todo lo que
 * esté dentro. No usa fuentes o CSS arbitrario del cliente — solo activa
 * uno de los presets ya definidos en globals.css vía data-attributes, y
 * sobreescribe las variables de color con lo que haya cargado el negocio.
 * `data-image-radius`/`data-image-shadow` siguen exactamente el mismo
 * mecanismo que `data-button-style` (ver `.btn-radius`): fijan
 * `--image-radius`/`--image-shadow` en globals.css, y cualquier foto
 * pública con la clase `.image-frame` los toma solos — cero condicional
 * por componente.
 *
 * También sobreescribe "--brass" con el primary_color real del negocio:
 * es el mismo mecanismo que ya usa BookingModal para su propio scope,
 * aplicado acá a toda la página. Sin esto, clases como hover:text-brass
 * (Header, Contact) mostrarían siempre el dorado de demo en vez del
 * color que el negocio eligió.
 *
 * El fondo (background_color) es un color libre, no un preset — ver
 * appearance-form.tsx. --ink-elevated/--ink-line (superficies alternadas,
 * bordes) se calculan a partir de ese mismo color con color-mix(),
 * mezclando hacia blanco o negro según si el fondo elegido es oscuro o
 * claro (isLightColor) — funciona para cualquier hex, no solo para los
 * dos presets que existían antes.
 *
 * Sistema de plantillas: si el negocio tiene `palette_id`, esa paleta
 * (11 posibles, ver palette-presets.ts) reemplaza lo de arriba para
 * ink/ink-elevated/bone/bone-muted/brass. Si tiene `template_layout`, la
 * fuente de esa plantilla
 * sobreescribe --font-display-stack/--font-sans-stack por encima del
 * sistema de 3 presets de tipografía (un inline style gana por
 * especificidad sobre el bloque [data-typography] sin tocar ese
 * mecanismo). Ninguno de los dos es obligatorio — sin ellos, el
 * comportamiento es idéntico al de un negocio sin plantilla.
 */
export default function AppearanceScope({
  business,
  children,
}: AppearanceScopeProps) {
  const palette = resolvePalette(business.palette_id);
  const layoutFonts = business.template_layout
    ? LAYOUT_BLUEPRINTS[business.template_layout]
    : null;

  const background = business.background_color || DEFAULT_BACKGROUND_COLOR;
  // Mezclar hacia blanco "eleva" un fondo oscuro; mezclar hacia negro
  // "eleva" uno claro — así cualquier color libre elegido por el negocio
  // termina con una superficie/borde ligeramente distinguibles del fondo,
  // sin necesitar un preset para cada tono posible.
  const mixTarget = isLightColor(background) ? "#000000" : "#ffffff";

  const colorVars: Record<string, string> = palette
    ? {
        "--ink": palette.background,
        "--bone": palette.text,
        "--ink-elevated": palette.surface,
        "--ink-line": palette.border,
        "--bone-muted": palette.textMuted,
        "--brass": palette.accent,
      }
    : {
        "--ink": background,
        "--bone": business.text_color || DEFAULT_TEXT_COLOR,
        "--ink-elevated": `color-mix(in srgb, ${background}, ${mixTarget} 6%)`,
        "--ink-line": `color-mix(in srgb, ${background}, ${mixTarget} 14%)`,
        "--brass": business.primary_color,
      };

  const fontVars: Record<string, string> = layoutFonts
    ? {
        "--font-display-stack": `var(${layoutFonts.headingFont.cssVar}), var(--font-fraunces), serif`,
        "--font-sans-stack": `var(${layoutFonts.bodyFont.cssVar}), var(--font-inter), sans-serif`,
      }
    : {};

  return (
    <div
      data-typography={business.typography_preset ?? "elegante"}
      data-button-style={business.button_style ?? "recto"}
      data-animation={business.animation_preset ?? "sutil"}
      data-layout={business.template_layout ?? undefined}
      data-image-radius={business.image_radius ?? "recto"}
      data-image-shadow={business.image_shadow ?? "ninguna"}
      // Pinta el fondo acá explícitamente: <body> usa --background/
      // --foreground definidos en :root (siempre el default oscuro), y
      // las variables de acá abajo solo alcanzan a los descendientes de
      // este div, no a body. Sin esto, la variante clara dejaría un
      // fondo oscuro asomando (overscroll, huecos entre secciones).
      className="bg-ink text-bone min-h-screen"
      style={{ ...colorVars, ...fontVars } as React.CSSProperties}
    >
      {children}
    </div>
  );
}
