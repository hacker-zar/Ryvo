"use client";

import { QRCodeSVG } from "qrcode.react";

interface SiteQrBlockProps {
  /** URL pública absoluta actual del negocio (ver getPublicSiteUrl) — se
   *  codifica tal cual en el QR, nunca una imagen guardada: cambia sola
   *  si cambia el slug o el dominio. */
  url: string;
  className?: string;
}

/**
 * QR de demo para mostrar el sitio desde una notebook/desktop: "andá
 * directo a esto desde tu celular". Vive como columna al lado de
 * Contacto (ver Contact.tsx) — ahí es donde la página tenía más aire de
 * sobra para algo de este tamaño, en vez de un bloque propio suelto.
 * Oculto en mobile a propósito (`hidden md:flex`, mismo breakpoint que ya
 * usan Header/Hero/MobileBookingBar) — quien ya está en el celular no
 * necesita escanear nada. Colores fijos (ink sobre bone) en vez de
 * `primary_color`: un QR tiene que poder escanearse sí o sí, así que la
 * legibilidad no queda a merced del color que haya elegido cada negocio.
 */
export default function SiteQrBlock({ url, className = "" }: SiteQrBlockProps) {
  const displayUrl = url.replace(/^https?:\/\//, "");

  return (
    <div className={`hidden md:flex flex-col items-center justify-center gap-4 ${className}`}>
      <div className="bg-bone p-5 radius-sm">
        <QRCodeSVG value={url} size={168} level="M" fgColor="#1a1815" bgColor="#f7f4ee" />
      </div>
      <div className="text-center">
        <p className="section-eyebrow text-bone-muted text-xs">
          Escaneá para verla en tu celular
        </p>
        <p className="mt-1 text-[11px] text-bone-muted/60">{displayUrl}</p>
      </div>
    </div>
  );
}
