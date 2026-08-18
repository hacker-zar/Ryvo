// Sistema de paletas — mismo patrón que src/lib/appearance-presets.ts
// (preset cerrado, no editor de color libre por token). 11 paletas: las
// 6 "globales" intercambiables entre cualquier plantilla, más una
// paleta "de firma" propia de cada una de las 5 plantillas oficiales
// (usada como default al aplicarlas por primera vez, pero también
// queda disponible para elegir en cualquier otra plantilla).
export interface PaletteTokens {
  label: string;
  background: string;
  surface: string;
  text: string;
  textMuted: string;
  accent: string;
  secondary: string;
  border: string;
}

export const PALETTE_PRESETS = {
  // === Globales (Sección 2 del pedido) ===
  // El pedido da 5 valores (Background/Surface/Primary/Secondary/Accent)
  // por paleta global — "Primary" ahí significa el color de texto
  // principal, no un acento de marca (el accent es el 5to valor). Los
  // valores de `secondary`/`border` no vienen dados: se completan con
  // un tono intermedio razonable entre `surface` y el texto, coherente
  // con el resto de la paleta (documentado acá, no inventado en cada
  // template-específico).
  obsidian: {
    label: "Obsidian",
    background: "#0C0C0C",
    surface: "#171717",
    text: "#F5F2EA",
    textMuted: "#AAA49A",
    accent: "#C6925B",
    secondary: "#8C867C",
    border: "#2A2A2A",
  },
  ivory: {
    label: "Ivory",
    background: "#FAF8F3",
    surface: "#F0ECE3",
    text: "#1A1A18",
    textMuted: "#706C63",
    accent: "#A87852",
    secondary: "#8A867C",
    border: "#DDD4C4",
  },
  sage: {
    label: "Sage",
    background: "#F1F3ED",
    surface: "#E0E5DA",
    text: "#20251F",
    textMuted: "#687064",
    accent: "#758A68",
    secondary: "#838D7D",
    border: "#CBD2C1",
  },
  terracotta: {
    label: "Terracotta",
    background: "#F6F0E9",
    surface: "#E9DED2",
    text: "#251C18",
    textMuted: "#75645A",
    accent: "#B85F43",
    secondary: "#8C7A6E",
    border: "#DCCBBC",
  },
  midnight: {
    label: "Midnight",
    background: "#111827",
    surface: "#1C2535",
    text: "#F5F5F0",
    textMuted: "#A7AFBA",
    accent: "#C59A63",
    secondary: "#8791A0",
    border: "#2A3448",
  },
  blush: {
    label: "Blush",
    background: "#FBF4F2",
    surface: "#F3E4E1",
    text: "#2A2222",
    textMuted: "#756A68",
    accent: "#C98282",
    secondary: "#8F827F",
    border: "#E8D3CE",
  },
  // === De firma, una por plantilla oficial (Sección 1) ===
  // 7 valores cada una en el pedido, mapeados posicionalmente:
  // background, surface, text, textMuted, accent, secondary, border.
  "atelier-signature": {
    label: "Atelier",
    background: "#F6F3EE",
    surface: "#EDE8DF",
    text: "#171717",
    textMuted: "#6F675D",
    accent: "#A77B50",
    secondary: "#777067",
    border: "#D9D2C7",
  },
  "noir-signature": {
    label: "Noir",
    background: "#0D0D0D",
    surface: "#171717",
    text: "#F4F1EA",
    textMuted: "#B9B3A8",
    accent: "#C79A68",
    secondary: "#8E8A82",
    border: "#2A2A2A",
  },
  "studio-signature": {
    label: "Studio",
    background: "#FFFFFF",
    surface: "#F5F5F3",
    text: "#202020",
    textMuted: "#6B6B66",
    accent: "#D99A7A",
    secondary: "#777772",
    border: "#E5E5E2",
  },
  "editorial-signature": {
    label: "Editorial",
    background: "#F1EEE8",
    surface: "#E3DED4",
    text: "#151515",
    textMuted: "#676158",
    accent: "#B65F42",
    secondary: "#77716A",
    border: "#CEC7BC",
  },
  "bold-signature": {
    label: "Bold",
    background: "#F2EFE7",
    surface: "#E4DFD4",
    text: "#151515",
    textMuted: "#3F3F3C",
    accent: "#E85D3F",
    secondary: "#6E6B65",
    border: "#D1CABD",
  },
} as const satisfies Record<string, PaletteTokens>;

export type PaletteId = keyof typeof PALETTE_PRESETS;

export function isKnownPaletteId(id: string | null | undefined): id is PaletteId {
  return !!id && id in PALETTE_PRESETS;
}

export function resolvePalette(id: string | null | undefined): PaletteTokens | null {
  return isKnownPaletteId(id) ? PALETTE_PRESETS[id] : null;
}

// Las 6 globales, para el selector "Aplicar paleta" — las 5 "de firma"
// también son técnicamente elegibles (PALETTE_PRESETS completo), pero
// no se muestran ahí por defecto para no saturar la lista con paletas
// pensadas como identidad exclusiva de una plantilla.
export const SWAPPABLE_PALETTE_IDS: PaletteId[] = [
  "obsidian",
  "ivory",
  "sage",
  "terracotta",
  "midnight",
  "blush",
];
