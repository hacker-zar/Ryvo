"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";

const NAV_LINKS = [
  { href: "#inicio", label: "Inicio" },
  { href: "#como-funciona", label: "Cómo funciona" },
  { href: "#ejemplos", label: "Ejemplos" },
  { href: "#faq", label: "Preguntas frecuentes" },
];

/**
 * Header de la landing de RYVO como plataforma ("/"). Dos CTAs a
 * propósito desiguales: "Iniciar sesión" es un link chico (acceso para
 * clientes que ya existen), "Quiero mi página" es el botón lleno — RYVO
 * es un servicio que se solicita, no un editor al que se "entra". Nunca
 * el mismo peso visual entre los dos, ni en desktop ni en el menú mobile.
 */
export default function MarketingHeader() {
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-50 bg-graphite/80 backdrop-blur border-b border-graphite-line">
      <div className="mx-auto max-w-5xl px-4 py-4 flex items-center justify-between">
        <Link href="#inicio" className="shrink-0">
          <Image
            src="/ryvo-logo-light.png"
            alt="RYVO"
            width={307}
            height={204}
            className="h-7 w-auto"
            priority
          />
        </Link>

        <nav className="hidden md:flex items-center gap-7">
          {NAV_LINKS.slice(1).map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm text-porcelain-muted hover:text-porcelain transition-colors"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-6">
          <Link
            href="/admin/login"
            className="text-xs uppercase tracking-[0.15em] text-porcelain-muted hover:text-porcelain transition-colors"
          >
            Iniciar sesión
          </Link>
          <Link
            href="/solicitar"
            className="rounded-full bg-porcelain text-graphite text-sm font-semibold px-5 py-2.5 hover:opacity-90 focus-visible:ring-2 focus-visible:ring-signal focus-visible:ring-offset-2 focus-visible:ring-offset-graphite transition-opacity"
          >
            Quiero mi página →
          </Link>
        </div>

        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Cerrar menú" : "Abrir menú"}
          aria-expanded={open}
          className="md:hidden flex h-9 w-9 items-center justify-center text-porcelain"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden>
            {open ? (
              <path
                d="M5 5L15 15M15 5L5 15"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            ) : (
              <path
                d="M3 6H17M3 10H17M3 14H17"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            )}
          </svg>
        </button>
      </div>

      {open ? (
        <div className="md:hidden border-t border-graphite-line px-4 py-5 flex flex-col gap-4">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className="text-sm text-porcelain-muted hover:text-porcelain transition-colors"
            >
              {link.label}
            </a>
          ))}
          <Link
            href="/solicitar"
            onClick={() => setOpen(false)}
            className="mt-2 rounded-full bg-porcelain text-graphite text-sm font-semibold px-5 py-3 text-center hover:opacity-90 transition-opacity"
          >
            Quiero mi página →
          </Link>
          <Link
            href="/admin/login"
            onClick={() => setOpen(false)}
            className="text-xs uppercase tracking-[0.15em] text-porcelain-muted/70 hover:text-porcelain transition-colors"
          >
            Iniciar sesión
          </Link>
        </div>
      ) : null}
    </header>
  );
}
