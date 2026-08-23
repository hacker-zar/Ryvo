import type { CSSProperties } from "react";

/**
 * Sistema de iconos propio — SVG inline, sin dependencias externas.
 *
 * Reemplaza los glifos tipográficos (▶ ▼ ‹ › ▾ → ★ ☆ ✓ ⚠) y el emoji
 * 📞 que se usaban antes como iconos. El problema de aquellos no era
 * estético sino sistémico: un glifo hereda la métrica de la fuente, así
 * que cambiaba de peso, tamaño y alineación óptica según la tipografía
 * que hubiera elegido cada negocio, y el emoji se renderizaba con los
 * colores del sistema operativo, imposible de tematizar.
 *
 * Especificación única, sin excepciones:
 * - grilla 24×24, `stroke` 1.5, sin relleno (salvo `star-filled`)
 * - `currentColor` siempre: el color lo decide el contexto, nunca el icono
 * - 3 tamaños (16/20/24) — no hay tamaños intermedios a propósito
 *
 * WhatsApp e Instagram estaban dibujados como paths sólidos en
 * Contact.tsx. Acá se redibujan como contorno para que pertenezcan al
 * mismo set: un icono relleno al lado de diecisiete de contorno se lee
 * como pegado de otra librería, que es exactamente lo que se está
 * corrigiendo.
 */

export type IconName =
  | "chevron"
  | "arrow"
  | "close"
  | "check"
  | "alert"
  | "star"
  | "star-filled"
  | "phone"
  | "whatsapp"
  | "instagram"
  | "mail"
  | "pin"
  | "clock"
  | "calendar"
  | "image"
  | "plus"
  | "trash"
  | "drag"
  | "eye";

export type IconSize = 16 | 20 | 24;

/** Rotación en grados. `chevron` apunta abajo y `arrow` a la derecha en
 *  su orientación base — cualquier otra dirección es una rotación, no un
 *  icono nuevo. */
export type IconRotate = 0 | 90 | 180 | 270;

interface IconProps {
  name: IconName;
  size?: IconSize;
  rotate?: IconRotate;
  className?: string;
  style?: CSSProperties;
  /** Solo para iconos que comunican algo por sí solos (un botón sin
   *  texto). Con `title` el SVG deja de ser decorativo y pasa a exponer
   *  ese nombre accesible; sin él queda `aria-hidden`, que es lo correcto
   *  cuando el texto de al lado ya dice lo mismo. */
  title?: string;
}

const PATHS: Record<IconName, React.ReactNode> = {
  chevron: <path d="m6 9 6 6 6-6" />,
  arrow: (
    <>
      <path d="M4 12h15" />
      <path d="m12.5 5.5 7 6.5-7 6.5" />
    </>
  ),
  close: (
    <>
      <path d="M6 6l12 12" />
      <path d="M18 6 6 18" />
    </>
  ),
  check: <path d="m5 12.5 4.5 4.5L19 7" />,
  alert: (
    <>
      <path d="M12 4.2 2.8 20.3h18.4L12 4.2Z" />
      <path d="M12 10v4.2" />
      <path d="M12 17.6h.01" />
    </>
  ),
  star: <path d="m12 3.6 2.65 5.68 6.1.72-4.5 4.24 1.2 6.16L12 17.3l-5.45 3.1 1.2-6.16-4.5-4.24 6.1-.72L12 3.6Z" />,
  "star-filled": (
    <path
      d="m12 3.6 2.65 5.68 6.1.72-4.5 4.24 1.2 6.16L12 17.3l-5.45 3.1 1.2-6.16-4.5-4.24 6.1-.72L12 3.6Z"
      fill="currentColor"
    />
  ),
  phone: (
    <path d="M6.2 3.5h3.1l1.5 3.9-2 1.4a12.4 12.4 0 0 0 5.9 5.9l1.4-2 3.9 1.5v3.1a2 2 0 0 1-2.2 2A16.9 16.9 0 0 1 4.2 5.7a2 2 0 0 1 2-2.2Z" />
  ),
  whatsapp: (
    <>
      <path d="M12 3.4a8.6 8.6 0 0 0-7.4 12.9l-1.2 4.3 4.4-1.2A8.6 8.6 0 1 0 12 3.4Z" />
      <path d="M9.1 8.4h1l.9 2.2-1 .8a7 7 0 0 0 2.9 2.9l.8-1 2.2.9v1a1.4 1.4 0 0 1-1.5 1.4 8.6 8.6 0 0 1-6.7-6.7 1.4 1.4 0 0 1 1.4-1.5Z" />
    </>
  ),
  instagram: (
    <>
      <rect x="3.4" y="3.4" width="17.2" height="17.2" rx="5" />
      <circle cx="12" cy="12" r="3.8" />
      <path d="M17 7h.01" />
    </>
  ),
  mail: (
    <>
      <rect x="3" y="5.2" width="18" height="13.6" rx="2.2" />
      <path d="m3.8 6.6 8.2 5.8 8.2-5.8" />
    </>
  ),
  pin: (
    <>
      <path d="M12 21c0 0 6.8-5.4 6.8-10.8a6.8 6.8 0 1 0-13.6 0C5.2 15.6 12 21 12 21Z" />
      <circle cx="12" cy="10.1" r="2.5" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="8.8" />
      <path d="M12 6.9V12l3.4 2" />
    </>
  ),
  calendar: (
    <>
      <rect x="3.2" y="5" width="17.6" height="15.8" rx="2.2" />
      <path d="M8 3.2v3.6" />
      <path d="M16 3.2v3.6" />
      <path d="M3.2 10.2h17.6" />
    </>
  ),
  image: (
    <>
      <rect x="3.2" y="4.2" width="17.6" height="15.6" rx="2.2" />
      <circle cx="8.7" cy="9.5" r="1.6" />
      <path d="m3.6 17.2 4.9-4.9 4.6 4.6 2.9-2.6 4.4 4" />
    </>
  ),
  plus: (
    <>
      <path d="M12 5.2v13.6" />
      <path d="M5.2 12h13.6" />
    </>
  ),
  trash: (
    <>
      <path d="M4.2 6.9h15.6" />
      <path d="M9.2 6.9V5.2a1.2 1.2 0 0 1 1.2-1.2h3.2a1.2 1.2 0 0 1 1.2 1.2v1.7" />
      <path d="m6.6 6.9.8 12a1.5 1.5 0 0 0 1.5 1.4h6.2a1.5 1.5 0 0 0 1.5-1.4l.8-12" />
    </>
  ),
  drag: (
    <>
      <path d="M9 6.2h.01" />
      <path d="M15 6.2h.01" />
      <path d="M9 12h.01" />
      <path d="M15 12h.01" />
      <path d="M9 17.8h.01" />
      <path d="M15 17.8h.01" />
    </>
  ),
  eye: (
    <>
      <path d="M2.6 12S6.4 5.8 12 5.8 21.4 12 21.4 12 17.6 18.2 12 18.2 2.6 12 2.6 12Z" />
      <circle cx="12" cy="12" r="3.1" />
    </>
  ),
};

export default function Icon({
  name,
  size = 20,
  rotate = 0,
  className,
  style,
  title,
}: IconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      // `shrink-0` no va acá: se aplica desde el consumidor cuando el
      // icono vive en un flex — meterlo adentro obligaría a pelearlo con
      // `!important` en los pocos casos donde sí debe encogerse.
      style={rotate ? { ...style, transform: `rotate(${rotate}deg)` } : style}
      role={title ? "img" : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      focusable="false"
    >
      {PATHS[name]}
    </svg>
  );
}
