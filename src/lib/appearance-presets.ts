// El fondo es un color libre (input type="color" en appearance-form.tsx) —
// business.text_color se deriva automáticamente de él vía readableTextColor
// para garantizar contraste, y --ink-elevated/--ink-line se calculan en
// AppearanceScope.tsx a partir del mismo color con color-mix(). Estos son
// solo los valores por defecto para un negocio sin background_color
// cargado todavía (mismo tono oscuro de siempre).
export const DEFAULT_BACKGROUND_COLOR = "#1a1815";
export const DEFAULT_TEXT_COLOR = "#f7f4ee";
