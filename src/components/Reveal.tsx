"use client";

import { ReactNode } from "react";
import { useScrollReveal } from "@/lib/useScrollReveal";

interface RevealProps {
  children: ReactNode;
  /** Retraso en ms, para escalonar dos bloques dentro de la misma sección. */
  delay?: number;
  className?: string;
}

/**
 * Envoltorio genérico para el scroll-reveal de secciones públicas. Un solo
 * punto de control para el efecto (ver .reveal en globals.css) en vez de
 * repetir la lógica de IntersectionObserver en cada sección.
 */
export default function Reveal({ children, delay = 0, className = "" }: RevealProps) {
  const { ref, visible } = useScrollReveal();

  return (
    <div
      ref={ref}
      className={`reveal ${visible ? "reveal-visible" : ""} ${className}`.trim()}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
