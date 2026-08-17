import Link from "next/link";
import { Business } from "@/types/business";

interface FooterProps {
  business: Pick<Business, "name" | "slug">;
}

export default function Footer({ business }: FooterProps) {
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
      </div>
    </footer>
  );
}
