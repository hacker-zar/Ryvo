import Link from "next/link";
import { Business } from "@/types/business";

interface FooterProps {
  business: Pick<Business, "name" | "slug">;
  /** Atribución "Powered by RYVO". Default true — no requiere configurarse
   *  desde el editor, aparece sola en toda web generada por RYVO. Prop
   *  explícita (en vez de un `if` hardcodeado) para que el día que haya un
   *  plan que permita ocultarla, alcance con pasar
   *  `showPoweredBy={business.plan !== "white_label"}` (o el campo que
   *  corresponda) sin tocar este componente ni el resto del footer. */
  showPoweredBy?: boolean;
}

export default function Footer({ business, showPoweredBy = true }: FooterProps) {
  return (
    // Padding inferior extra en mobile: deja lugar a la barra fija de
    // reserva (MobileBookingBar) para que no tape el texto del footer.
    <footer className="border-t border-ink-line pt-8 pb-24 md:pb-8">
      <div className="mx-auto max-w-5xl px-4 flex flex-col items-center gap-2 text-center text-xs text-bone-muted/70">
        <p>
          © {new Date().getFullYear()} {business.name}
        </p>
        {/* Acceso discreto al panel del negocio — deliberadamente en el
            footer, no arriba de todo, para no competir con la experiencia
            del cliente. Sigue siendo el mismo flujo de siempre. */}
        <Link
          href={`/admin/entrar?from=${business.slug}`}
          className="hover:text-bone-muted transition-colors"
        >
          ¿Trabajás aquí?
        </Link>

        {showPoweredBy ? (
          // Fila separada, más chica y con menos opacidad que el resto del
          // footer: se lee como atribución de plataforma, no como parte
          // del contenido del negocio. Usa los mismos tokens de tema
          // (--bone-muted, vía AppearanceScope) que el resto del footer,
          // así siempre contrasta bien sea cual sea la paleta que haya
          // elegido el negocio. Mismo tab a propósito: es una salida del
          // sitio del negocio a RYVO, no algo que deba abrir aparte.
          <Link
            href="/"
            className="mt-2 pt-2 border-t border-ink-line/60 text-[11px] text-bone-muted/50 hover:text-bone-muted transition-colors"
          >
            Powered by <span className="font-semibold">RYVO</span>
          </Link>
        ) : null}
      </div>
    </footer>
  );
}
