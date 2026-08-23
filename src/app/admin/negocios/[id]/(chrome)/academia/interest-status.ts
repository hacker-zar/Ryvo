import { AcademyInterestStatus } from "@/types/business";

// Única fuente de verdad de labels/colores de estado de un interesado —
// mismo criterio que STATUS_LABELS/STATUS_COLOR de turnos (booking-status.ts).

export const ACADEMY_INTEREST_STATUS_LABELS: Record<AcademyInterestStatus, string> = {
  new: "Nuevo",
  contacted: "Contactado",
  enrolled: "Inscripto",
  discarded: "Descartado",
};

export const ACADEMY_INTEREST_STATUS_COLOR: Record<AcademyInterestStatus, string> = {
  new: "var(--bone-muted)",
  contacted: "var(--brass)",
  enrolled: "var(--ok)",
  discarded: "var(--danger)",
};

// Progresión sugerida (nuevo → contactado → inscripto/descartado) — se
// usa para ordenar los botones de cambio de estado en el detalle, no
// para restringir transiciones (cualquier cambio de estado es válido,
// el pedido no exige una máquina de estados estricta).
export const ACADEMY_INTEREST_STATUS_ORDER: AcademyInterestStatus[] = [
  "new",
  "contacted",
  "enrolled",
  "discarded",
];
