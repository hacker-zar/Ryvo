export function formatPrice(price: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0,
  }).format(price);
}

export function formatDuration(minutes: number): string {
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

export function whatsappLink(phone: string, message = ""): string {
  const cleanPhone = phone.replace(/[^\d]/g, "");
  const encoded = encodeURIComponent(message);
  return `https://wa.me/${cleanPhone}${message ? `?text=${encoded}` : ""}`;
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

  const hex = backgroundHex.trim().replace("#", "");
  const full =
    hex.length === 3
      ? hex
          .split("")
          .map((c) => c + c)
          .join("")
      : hex;

  if (!/^[0-9a-fA-F]{6}$/.test(full)) return dark;

  const [r, g, b] = [0, 2, 4].map(
    (i) => parseInt(full.slice(i, i + 2), 16) / 255
  );

  const linear = (c: number) =>
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  const luminance =
    0.2126 * linear(r) + 0.7152 * linear(g) + 0.0722 * linear(b);

  // ~0.179 es el punto donde el contraste contra negro puro e contra
  // blanco puro se cruza (fórmula de contraste WCAG); por encima, texto
  // oscuro contrasta mejor; por debajo, texto claro.
  return luminance > 0.179 ? dark : light;
}
