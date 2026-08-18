import { Business } from "@/types/business";
import { BACKGROUND_VARIANTS, backgroundVariantFor } from "@/lib/appearance-presets";

interface AppearanceScopeProps {
  business: Pick<
    Business,
    | "typography_preset"
    | "button_style"
    | "background_color"
    | "text_color"
    | "primary_color"
    | "animation_preset"
  >;
  children: React.ReactNode;
}

/**
 * Aplica la apariencia configurable del negocio (tipografía, estilo de
 * botones, colores de fondo/texto) a todo lo que esté dentro. No usa
 * fuentes o CSS arbitrario del cliente — solo activa uno de los presets
 * ya definidos en globals.css vía data-attributes, y sobreescribe las
 * variables de color con lo que haya cargado el negocio.
 *
 * También sobreescribe "--brass" con el primary_color real del negocio:
 * es el mismo mecanismo que ya usa BookingModal para su propio scope,
 * aplicado acá a toda la página. Sin esto, clases como hover:text-brass
 * (Header, Contact) mostrarían siempre el dorado de demo en vez del
 * color que el negocio eligió.
 */
export default function AppearanceScope({
  business,
  children,
}: AppearanceScopeProps) {
  // El fondo es una de dos variantes prediseñadas (oscuro/claro), no un
  // color libre — ver appearance-presets.ts. Además de --ink/--bone,
  // hace falta ajustar --ink-elevated/--ink-line (superficies alternadas,
  // bordes) para que la variante clara no quede con bordes/tarjetas
  // pensados para fondo oscuro encima de un fondo claro.
  const preset = BACKGROUND_VARIANTS[backgroundVariantFor(business.background_color)];

  return (
    <div
      data-typography={business.typography_preset ?? "elegante"}
      data-button-style={business.button_style ?? "recto"}
      data-animation={business.animation_preset ?? "sutil"}
      // Pinta el fondo acá explícitamente: <body> usa --background/
      // --foreground definidos en :root (siempre el default oscuro), y
      // las variables de acá abajo solo alcanzan a los descendientes de
      // este div, no a body. Sin esto, la variante clara dejaría un
      // fondo oscuro asomando (overscroll, huecos entre secciones).
      className="bg-ink text-bone min-h-screen"
      style={
        {
          "--ink": business.background_color || preset.background,
          "--bone": business.text_color || preset.text,
          "--ink-elevated": preset.elevated,
          "--ink-line": preset.line,
          "--brass": business.primary_color,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
