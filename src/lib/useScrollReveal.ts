"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Marca `visible` en true una sola vez cuando el elemento entra en
 * viewport, para animar secciones al hacer scroll. Si el usuario prefiere
 * menos movimiento, arranca visible directamente en vez de depender de un
 * scroll que dispare la animación.
 */
export function useScrollReveal<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T | null>(null);
  // El chequeo de prefers-reduced-motion se resuelve en el inicializador
  // (durante el render), no en un efecto — así nunca hay un setState
  // síncrono dentro del cuerpo del efecto.
  const [visible, setVisible] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );

  useEffect(() => {
    if (visible) return;
    const node = ref.current;
    if (!node) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: "0px 0px -60px 0px" }
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [visible]);

  return { ref, visible };
}
