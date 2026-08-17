import Image from "next/image";
import { Business } from "@/types/business";
import AppearanceScope from "@/components/AppearanceScope";

interface ComingSoonProps {
  business: Pick<
    Business,
    | "name"
    | "logo"
    | "primary_color"
    | "background_color"
    | "text_color"
    | "typography_preset"
    | "button_style"
  >;
}

/**
 * Un negocio creado por registro self-service existe (tiene id, nombre,
 * cuenta) pero todavía no terminó el onboarding — su URL pública no debe
 * dar 404 (eso es para slugs que directamente no existen, ver
 * src/app/not-found.tsx) ni mostrar el sitio a medio cargar. Esta
 * pantalla sí usa la identidad *del negocio* (los datos ya están en
 * mano acá) — a diferencia del 404 global, que es de RYVO. Reutiliza
 * AppearanceScope para resolver fondo/texto/tipografía exactamente
 * igual que el sitio público real, en vez de reimplementar esa lógica.
 */
export default function ComingSoon({ business }: ComingSoonProps) {
  return (
    <AppearanceScope business={business}>
      <div className="min-h-screen flex flex-col items-center justify-center px-4 text-center">
        {business.logo ? (
          <Image
            src={business.logo}
            alt={business.name}
            width={56}
            height={56}
            className="rounded-full object-cover mb-6"
          />
        ) : null}
        <p className="section-eyebrow" style={{ color: business.primary_color }}>
          Próximamente
        </p>
        <h1 className="display-title mt-3 text-2xl md:text-3xl text-bone">
          {business.name}
        </h1>
        <p className="mt-4 max-w-sm text-sm text-bone-muted leading-relaxed">
          Estamos preparando esta web. Volvé pronto.
        </p>
      </div>
    </AppearanceScope>
  );
}
