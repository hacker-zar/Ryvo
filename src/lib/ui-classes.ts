import type { CSSProperties } from "react";

// Clases de input compartidas por el admin — antes duplicadas casi
// textuales en 8+ archivos (informacion-panel, fotos-panel,
// account-manager, services/professionals/locations-manager,
// new-business-form, login-form, StepDetails). Un solo lugar para
// arreglar foco/contraste en todos a la vez. Dos variantes de padding
// (ya existían las dos, no es una elección nueva): "full" para
// formularios de una sola columna, "compact" para las filas más densas
// de las listas de servicios/profesionales/locales.
const FOCUS_RING =
  "focus-visible:ring-2 focus-visible:ring-brass/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink";

export const adminInputClasses =
  `rounded-sm border border-ink-line bg-ink-elevated px-3 py-2.5 text-sm text-bone placeholder:text-bone-muted/60 focus:outline-none focus:border-brass transition-colors ${FOCUS_RING}`;

export const adminInputClassesCompact =
  `rounded-sm border border-ink-line bg-ink-elevated px-3 py-2 text-sm text-bone placeholder:text-bone-muted/60 focus:outline-none focus:border-brass transition-colors ${FOCUS_RING}`;

// Misma idea para la paleta de marketing (graphite/porcelain/signal) —
// hoy solo la usa registration-wizard.tsx, pero queda acá para no
// reintroducir el mismo string suelto si se agrega otra pantalla pública
// de RYVO (no la de un negocio) más adelante.
export const marketingInputClasses =
  "rounded-sm border border-graphite-line bg-graphite-elevated px-3 py-2.5 text-sm text-porcelain placeholder:text-porcelain-muted/50 focus:outline-none focus:border-signal transition-colors focus-visible:ring-2 focus-visible:ring-signal/60 focus-visible:ring-offset-2 focus-visible:ring-offset-graphite";

// El chrome del admin (AdminChrome + /admin/login) es "software de RYVO",
// no la web de un negocio — debe verse igual que la landing
// (graphite/porcelain/signal), no con la paleta cuero+bronce por
// defecto de las plantillas de negocio. En vez de reescribir cada
// className bg-ink/text-bone/text-brass de las ~20 pantallas del admin
// (que ya usan esos tokens de forma consistente), remapeamos los
// tokens en el punto de entrada — mismo mecanismo que ya usa
// AppearanceScope.tsx para la identidad de cada negocio, aplicado acá
// para la identidad de RYVO. La preview del negocio vive en un
// <iframe> aparte (documento independiente) y AppearanceScope define
// sus propias variables ahí adentro, así que nunca hereda esto.
export const adminThemeStyle = {
  "--ink": "var(--graphite)",
  "--ink-elevated": "var(--graphite-elevated)",
  "--ink-line": "var(--graphite-line)",
  "--bone": "var(--porcelain)",
  "--bone-muted": "var(--porcelain-muted)",
  "--brass": "var(--signal)",
} as CSSProperties;

export const adminThemeDataAttrs = { "data-typography": "moderna" } as const;
