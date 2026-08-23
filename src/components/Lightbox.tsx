"use client";

import Icon from "@/components/ui/Icon";
import { useEffect } from "react";
import Image from "next/image";

interface LightboxProps {
  images: string[];
  index: number;
  altPrefix: string;
  onClose: () => void;
  onNavigate: (index: number) => void;
}

/**
 * Visor de imagen ampliada. Mismo lenguaje visual que BookingModal (overlay
 * + entrada fadeIn/slideUp) para que se sienta parte del mismo sistema, no
 * un plugin aparte. Genérico a propósito: no depende de Gallery.
 */
export default function Lightbox({
  images,
  index,
  altPrefix,
  onClose,
  onNavigate,
}: LightboxProps) {
  useEffect(() => {
    const original = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = original;
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
      if (e.key === "ArrowRight") onNavigate((index + 1) % images.length);
      if (e.key === "ArrowLeft") onNavigate((index - 1 + images.length) % images.length);
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [index, images.length, onClose, onNavigate]);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center"
      role="dialog"
      aria-modal="true"
    >
      <button
        type="button"
        aria-label="Cerrar"
        onClick={onClose}
        className="absolute inset-0 bg-black/85 backdrop-blur-sm anim-fade"
      />

      <div className="relative w-full h-full max-w-4xl max-h-[85vh] mx-4 my-auto anim-slide-up">
        <Image
          key={index}
          src={images[index]}
          alt={`${altPrefix} - foto ${index + 1}`}
          fill
          sizes="90vw"
          className="object-contain"
        />
      </div>

      <button
        type="button"
        onClick={onClose}
        aria-label="Cerrar"
        className="absolute top-4 right-4 sm:top-6 sm:right-6 h-11 w-11 rounded-full bg-black/50 text-bone flex items-center justify-center hover:bg-black/70 focus-visible:ring-2 focus-visible:ring-brass transition-colors"
      >
        <Icon name="close" size={20} />
      </button>

      {images.length > 1 ? (
        <>
          <button
            type="button"
            onClick={() => onNavigate((index - 1 + images.length) % images.length)}
            aria-label="Foto anterior"
            className="absolute left-2 sm:left-6 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-black/50 text-bone text-xl flex items-center justify-center hover:bg-black/70 focus-visible:ring-2 focus-visible:ring-brass transition-colors"
          >
            <Icon name="chevron" size={24} rotate={90} />
          </button>
          <button
            type="button"
            onClick={() => onNavigate((index + 1) % images.length)}
            aria-label="Foto siguiente"
            className="absolute right-2 sm:right-6 top-1/2 -translate-y-1/2 h-11 w-11 rounded-full bg-black/50 text-bone text-xl flex items-center justify-center hover:bg-black/70 focus-visible:ring-2 focus-visible:ring-brass transition-colors"
          >
            <Icon name="chevron" size={24} rotate={270} />
          </button>
        </>
      ) : null}
    </div>
  );
}
