// price null/undefined = el servicio no tiene precio cargado (ver Service.price)
// — nunca se muestra "$0" en ese caso, se pide consultarlo directamente.
export function formatPrice(price: number | null | undefined): string {
  if (price == null) return "Consultar precio";
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(price);
}

// null = sin duración configurada (ver Service.duration) — quien llama
// decide si ocultar el elemento entero en vez de mostrar un texto vacío.
export function formatDuration(minutes: number | null | undefined): string | null {
  if (minutes == null) return null;
  if (minutes < 60) return `${minutes} min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m === 0 ? `${h} h` : `${h} h ${m} min`;
}

const DAY_LABELS: Record<string, string> = {
  lun: "Lunes",
  mar: "Martes",
  mie: "Miércoles",
  jue: "Jueves",
  vie: "Viernes",
  sab: "Sábado",
  dom: "Domingo",
};

export function dayLabel(day: string): string {
  return DAY_LABELS[day] ?? day;
}

/** Al menos unos pocos dígitos — deliberadamente laxo (no valida
 *  formato/código de país): el objetivo es atajar un typo obvio en el
 *  teléfono de una reserva, no imponer un formato único internacional. */
export function isLikelyPhone(value: string): boolean {
  return value.replace(/\D/g, "").length >= 6;
}

/** Sugiere (nunca fuerza) el código de área para precargar el campo del
 *  formulario de reserva, a partir del WhatsApp que el propio negocio ya
 *  cargó (nunca por geolocalización del cliente). No hay un campo
 *  estructurado de "código de área" en el negocio — se aprovecha que
 *  quien lo tipeó ya lo separó con espacios/guiones (ej. "+54 9 341
 *  123-4567", "341 123-4567"): se descartan el código de país (54) y el
 *  prefijo de celular (9) si aparecen como token propio, y se toma el
 *  token que sigue. Si el formato no es reconocible, devuelve "" — el
 *  cliente lo completa a mano, nunca se inventa un valor. */
export function suggestAreaCode(businessPhone: string | null | undefined): string {
  if (!businessPhone) return "";
  const tokens = businessPhone
    .split(/[^\d]+/)
    .map((t) => t.trim())
    .filter(Boolean);
  let i = 0;
  if (tokens[i] === "54") i++;
  if (tokens[i] === "9") i++;
  const candidate = tokens[i];
  if (candidate && candidate.length >= 2 && candidate.length <= 4) {
    return candidate;
  }
  return "";
}

/** Arma un teléfono de cliente en un formato consistente y ya compatible
 *  con wa.me (ver whatsappLink) — mismo criterio que ya usa
 *  `business.whatsapp` en producción (código de país 54 + 9 de celular +
 *  área + número). Si no hay código de área, no lo inventa: arma el
 *  número sin ese segmento en vez de adivinar uno. */
export function composeCustomerPhone(areaCode: string, localNumber: string): string {
  const area = areaCode.replace(/\D/g, "");
  const number = localNumber.replace(/\D/g, "");
  if (!number) return "";
  return area ? `+54 9 ${area} ${number}` : `+54 9 ${number}`;
}

/** Fecha de hoy en hora local del servidor, formato "YYYY-MM-DD" — mismo
 *  formato que usa la columna `bookings.date`. */
export function todayDateString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** Hora actual en hora local del servidor, formato "HH:MM" — mismo
 *  formato que usa la columna `bookings.time`. */
export function nowTimeString(): string {
  const now = new Date();
  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

/** `toDateStr - fromDateStr` en días. */
export function daysBetween(fromDateStr: string, toDateStr: string): number {
  const a = new Date(`${fromDateStr}T00:00:00`);
  const b = new Date(`${toDateStr}T00:00:00`);
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

/** "hace N días"/"en N días", relativo a hoy — usado en CRM/oportunidades
 *  para "última visita"/"próximo turno" sin repetir el cálculo en cada
 *  componente nuevo. */
export function daysAgoLabel(dateStr: string): string {
  const diff = daysBetween(dateStr, todayDateString());
  if (diff === 0) return "hoy";
  if (diff === 1) return "ayer";
  if (diff > 1) return `hace ${diff} días`;
  if (diff === -1) return "mañana";
  return `en ${-diff} días`;
}

export function whatsappLink(phone: string, message = ""): string {
  const cleanPhone = phone.replace(/[^\d]/g, "");
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}${message ? `?text=${encoded}` : ""}`;
}

/** Normaliza "#abc"/"abc"/"#aabbcc" a "aabbcc", o null si no es un hex válido. */
function normalizeHex(hex: string): string | null {
  const cleaned = hex.trim().replace("#", "");
  const full =
    cleaned.length === 3
      ? cleaned
          .split("")
          .map((c) => c + c)
          .join("")
      : cleaned;
  return /^[0-9a-fA-F]{6}$/.test(full) ? full : null;
}

/** Luminancia relativa WCAG 2.x (0 = negro, 1 = blanco) de un color hex. */
function relativeLuminance(hex: string): number | null {
  const full = normalizeHex(hex);
  if (!full) return null;

  const [r, g, b] = [0, 2, 4].map(
    (i) => parseInt(full.slice(i, i + 2), 16) / 255
  );

  const linear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  return 0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);
}

/**
 * Devuelve el color de texto (oscuro o claro) que mejor contrasta sobre
 * un color de fondo arbitrario, usando la fórmula de luminancia relativa
 * de WCAG 2.x. Necesario porque business.primary_color lo elige cada
 * dueño de negocio con un <input type="color"> sin restricciones: no
 * podemos asumir que un texto oscuro fijo (como "--ink") siempre va a
 * leerse bien. Si el negocio elige, por ejemplo, un primary_color oscuro
 * (azul marino, negro, etc.), esta función devuelve el tono claro.
 *
 * Se usa para el texto de los botones rellenos con primary_color
 * (Header, Hero, wizard de reserva) — no para el resto del sitio, donde
 * primary_color se usa como acento sobre el fondo oscuro del template,
 * un problema de contraste distinto y fuera del alcance de este cambio.
 */
export function readableTextColor(
  backgroundHex: string,
  options?: { dark?: string; light?: string }
): string {
  const dark = options?.dark ?? "#1a1815";
  const light = options?.light ?? "#f7f4ee";

  const luminance = relativeLuminance(backgroundHex);
  if (luminance === null) return dark;

  // ~0.179 es el punto donde el contraste contra negro puro e contra
  // blanco puro se cruza (fórmula de contraste WCAG); por encima, texto
  // oscuro contrasta mejor; por debajo, texto claro.
  return luminance > 0.179 ? dark : light;
}

/**
 * true si un color hex es "claro" (más cerca de blanco que de negro),
 * mismo punto de corte de luminancia que readableTextColor. Usado para
 * decidir hacia dónde mezclar las superficies derivadas de un
 * background_color elegido libremente (ver AppearanceScope): sobre un
 * fondo oscuro, "elevar" una superficie es aclararla un poco; sobre uno
 * claro, es oscurecerla — así funciona con cualquier color, no solo con
 * los dos presets que existían antes.
 */
export function isLightColor(hex: string): boolean {
  const luminance = relativeLuminance(hex);
  return luminance !== null && luminance > 0.179;
}

/**
 * Ratio de contraste WCAG 2.x entre dos colores hex (1 = sin contraste,
 * 21 = máximo posible, negro sobre blanco). Devuelve null si algún color
 * no es un hex válido. Usada en el admin (AppearanceForm) para avisarle
 * al dueño del negocio si la combinación que eligió es difícil de leer —
 * es un aviso, no un bloqueo: el color final sigue siendo su elección.
 */
export function contrastRatio(hexA: string, hexB: string): number | null {
  const lumA = relativeLuminance(hexA);
  const lumB = relativeLuminance(hexB);
  if (lumA === null || lumB === null) return null;

  const lighter = Math.max(lumA, lumB);
  const darker = Math.min(lumA, lumB);
  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Iniciales de un nombre (máximo dos), para los monogramas que ocupan el
 * lugar de una foto que falta — hoy, las tarjetas y el detalle del
 * catálogo. Vive acá y no en un componente porque ya lo necesitan dos
 * archivos distintos de `components/catalog`; Professionals.tsx tiene su
 * propia copia local de antes, que puede migrar a esta cuando se toque.
 */
export function initials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join("");
}
