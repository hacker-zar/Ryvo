// El fondo es un color libre (input type="color" en appearance-form.tsx) —
// business.text_color se deriva automáticamente de él vía readableTextColor
// para garantizar contraste, y --ink-elevated/--ink-line se calculan en
// AppearanceScope.tsx a partir del mismo color con color-mix(). Estos son
// solo los valores por defecto para un negocio sin background_color
// cargado todavía (mismo tono oscuro de siempre).
export const DEFAULT_BACKGROUND_COLOR = "#1a1815";
export const DEFAULT_TEXT_COLOR = "#f7f4ee";

/**
 * Presets de animación que se ofrecen en el editor. Son tres, no cinco:
 * `dinamica` y `escalonada` se retiraron porque no eran direcciones
 * distintas — la primera era la misma entrada con más intensidad, y el
 * escalonado pasó a ser el comportamiento automático de cualquier grilla
 * (ver `.reveal:nth-of-type` en globals.css). Cinco opciones era pedirle
 * al dueño de una barbería una decisión de dirección de arte que no tiene
 * cómo evaluar.
 *
 * `revelado` se muestra como "Editorial": el valor almacenado NO cambia a
 * propósito. El CHECK de `businesses.animation_preset` en la base acepta
 * exactamente los cinco valores viejos (ver supabase/schema.sql), así que
 * inventar un `"editorial"` nuevo exigiría una migración. Los negocios
 * que tengan `dinamica`/`escalonada` guardadas siguen siendo válidos y
 * caen visualmente en "Sutil", sin tocar un solo registro.
 */
export const PUBLIC_ANIMATION_PRESETS = [
  "ninguna",
  "sutil",
  "revelado",
] as const;

/** Todos los valores que la base acepta — incluye los dos retirados del
 *  editor, que siguen existiendo en filas ya guardadas. */
export const STORED_ANIMATION_PRESETS = [
  "ninguna",
  "sutil",
  "dinamica",
  "revelado",
  "escalonada",
] as const;
