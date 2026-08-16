import { Business } from "@/types/business";

interface AppearanceScopeProps {
  business: Pick<
    Business,
    | "typography_preset"
    | "button_style"
    | "background_color"
    | "text_color"
    | "primary_color"
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
  return (
    <div
      data-typography={business.typography_preset ?? "elegante"}
      data-button-style={business.button_style ?? "recto"}
      style={
        {
          "--ink": business.background_color || "#1a1815",
          "--bone": business.text_color || "#f7f4ee",
          "--brass": business.primary_color,
        } as React.CSSProperties
      }
    >
      {children}
    </div>
  );
}
