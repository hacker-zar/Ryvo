"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";

interface BrowserMockupFrameProps {
  slug: string;
  domainLabel?: string;
  className?: string;
}

// Ancho al que se renderiza el sitio real adentro del iframe (desktop) —
// después se lo escala con CSS transform al ancho real que mida el
// contenedor. Sin esto (o rendereando a un ancho angosto) el sitio real
// se vería con su propio layout mobile en miniatura, no como una captura
// de la versión desktop.
const SOURCE_WIDTH = 1280;
// Relación de aspecto del recorte visible — el resto de la página real
// (más larga) queda oculta por el overflow-hidden del contenedor, no
// escalada ni distorsionada.
const ASPECT_RATIO = 3 / 4;

/**
 * "Mockup" de un sitio real de RYVO: mismo lenguaje visual de ventana de
 * navegador que ya tenía ProductPreview.tsx (3 puntos + barra de URL),
 * pero con un <iframe> real de `/${slug}` adentro en vez de divs
 * abstractos — siempre muestra el sitio actual, sin mantener capturas de
 * pantalla como archivo. Decorativo (pointer-events-none, tabIndex -1,
 * aria-hidden): el `<Link>` que envuelve todo el marco es la única forma
 * de interactuar, lleva al sitio real.
 *
 * El iframe se renderiza a SOURCE_WIDTH fijo y se escala con
 * `transform: scale()` al ancho real del contenedor (medido con
 * ResizeObserver, así funciona igual en cualquier breakpoint sin
 * variantes de Tailwind por tamaño) — técnica estándar para miniaturizar
 * una página completa sin que se reflowee a su propio layout mobile.
 */
export default function BrowserMockupFrame({
  slug,
  domainLabel,
  className = "",
}: BrowserMockupFrameProps) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(0);

  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;
    // Medición síncrona al montar (no todos los navegadores disparan el
    // primer callback de ResizeObserver antes del primer paint) —
    // ResizeObserver abajo solo cubre resizes posteriores.
    setScale(el.getBoundingClientRect().width / SOURCE_WIDTH);
    const observer = new ResizeObserver(([entry]) => {
      setScale(entry.contentRect.width / SOURCE_WIDTH);
    });
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Link
      href={`/${slug}`}
      className={`block rounded-2xl border border-graphite-line bg-graphite-elevated shadow-[0_40px_80px_-40px_rgba(0,0,0,0.6)] overflow-hidden hover:border-porcelain-muted transition-colors ${className}`}
    >
      <div className="flex items-center gap-2 px-4 py-3 border-b border-graphite-line">
        <span className="h-2.5 w-2.5 rounded-full bg-graphite-line" />
        <span className="h-2.5 w-2.5 rounded-full bg-graphite-line" />
        <span className="h-2.5 w-2.5 rounded-full bg-graphite-line" />
        <div className="ml-3 flex-1 rounded-full bg-graphite px-3 py-1 text-[11px] text-porcelain-muted truncate">
          {domainLabel ?? `ryvo.ar/${slug}`}
        </div>
      </div>

      <div ref={viewportRef} className="relative w-full aspect-[4/3] overflow-hidden bg-graphite">
        {scale > 0 ? (
          <iframe
            src={`/${slug}`}
            tabIndex={-1}
            aria-hidden
            loading="lazy"
            title=""
            style={{
              width: SOURCE_WIDTH,
              height: SOURCE_WIDTH * ASPECT_RATIO,
              border: "none",
              transform: `scale(${scale})`,
              transformOrigin: "top left",
              pointerEvents: "none",
            }}
          />
        ) : null}
      </div>
    </Link>
  );
}
