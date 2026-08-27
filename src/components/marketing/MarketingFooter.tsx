import Image from "next/image";
import Link from "next/link";

const FOOTER_LINKS = [
  { href: "#inicio", label: "Inicio" },
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#ejemplos", label: "Ejemplos" },
  { href: "/solicitar", label: "Solicitar página" },
];

export default function MarketingFooter() {
  return (
    <footer className="border-t border-graphite-line">
      <div className="mx-auto max-w-5xl px-4 py-14">
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-10">
          <div>
            <Image
              src="/ryvo-logo-light.png"
              alt="RYVO"
              width={307}
              height={204}
              className="h-6 w-auto opacity-90"
            />
            <p className="mt-3 text-sm text-porcelain-muted">
              Páginas web para negocios locales.
            </p>
          </div>

          <nav className="flex flex-col gap-2.5">
            {FOOTER_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm text-porcelain-muted hover:text-porcelain transition-colors"
              >
                {link.label}
              </a>
            ))}
            {/* Secundario a propósito, sin destacarlo por encima de
                "Solicitar página" — mismo criterio que el header. */}
            <Link
              href="/admin/login"
              className="text-xs uppercase tracking-[0.15em] text-porcelain-muted/70 hover:text-porcelain transition-colors mt-1"
            >
              Iniciar sesión
            </Link>
          </nav>

          <div className="flex flex-col gap-2.5">
            <a
              href="https://instagram.com/ryvo.ar"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-porcelain-muted hover:text-porcelain transition-colors"
            >
              Instagram
            </a>
          </div>
        </div>

        <p className="mt-12 text-xs text-porcelain-muted/70">© {new Date().getFullYear()} RYVO</p>
      </div>
    </footer>
  );
}
