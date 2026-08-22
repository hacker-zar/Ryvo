"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import Reveal from "@/components/Reveal";

// Slider interactivo antes/después — exclusiva de la plantilla Editorial.
// Reutiliza las 2 primeras fotos de la galería ya cargada (sin campo
// nuevo, sin tabla nueva) — no se muestra si el negocio no tiene al
// menos 2 fotos.
interface BeforeAfterProps {
  images: string[];
  accentColor: string;
}

export default function BeforeAfter({ images, accentColor }: BeforeAfterProps) {
  const [position, setPosition] = useState(50); // % — cuánto de la foto "después" se revela desde la derecha
  const containerRef = useRef<HTMLDivElement>(null);
  const draggingRef = useRef(false);

  if (images.length < 2) return null;
  const [before, after] = images;

  function updateFromClientX(clientX: number) {
    const el = containerRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const pct = ((clientX - rect.left) / rect.width) * 100;
    setPosition(Math.min(100, Math.max(0, pct)));
  }

  return (
    <section className="mx-auto max-w-4xl px-4 py-16 md:py-24">
      <Reveal>
        <p className="section-eyebrow" style={{ color: accentColor }}>
          Transformaciones
        </p>
        <h2 className="display-title mt-2 text-3xl md:text-5xl text-bone">
          Antes / Después
        </h2>
      </Reveal>

      <Reveal delay={100}>
        <div
          ref={containerRef}
          className="image-frame relative mt-10 aspect-[4/3] md:aspect-[16/9] overflow-hidden select-none touch-none cursor-ew-resize bg-ink-elevated"
          onPointerDown={(e) => {
            draggingRef.current = true;
            (e.target as HTMLElement).setPointerCapture(e.pointerId);
            updateFromClientX(e.clientX);
          }}
          onPointerMove={(e) => {
            if (draggingRef.current) updateFromClientX(e.clientX);
          }}
          onPointerUp={() => {
            draggingRef.current = false;
          }}
        >
          <Image src={before} alt="Antes" fill sizes="(min-width:768px) 60vw, 100vw" className="object-cover" />
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ clipPath: `inset(0 0 0 ${position}%)` }}
          >
            <Image src={after} alt="Después" fill sizes="(min-width:768px) 60vw, 100vw" className="object-cover" />
          </div>
          {/* Divisor + handle */}
          <div
            className="absolute inset-y-0 w-0.5 bg-bone/80"
            style={{ left: `${position}%` }}
          >
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-9 w-9 rounded-full flex items-center justify-center text-xs font-semibold"
              style={{ backgroundColor: accentColor, color: "var(--ink)" }}
            >
              ⇔
            </div>
          </div>
          <span className="absolute bottom-3 left-3 section-eyebrow text-[10px] bg-ink/70 px-2 py-1 text-bone">
            Antes
          </span>
          <span className="absolute bottom-3 right-3 section-eyebrow text-[10px] bg-ink/70 px-2 py-1 text-bone">
            Después
          </span>
        </div>
      </Reveal>
    </section>
  );
}
