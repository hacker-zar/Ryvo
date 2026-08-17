"use client";

import { createContext, useContext, useState, ReactNode } from "react";

export type EditorCategory =
  | "informacion"
  | "servicios"
  | "profesionales"
  | "horarios"
  | "fotos"
  | "apariencia";

export interface EditorTarget {
  category: EditorCategory;
  field?: string;
  itemId?: string;
}

interface EditorSelectionContextValue {
  target: EditorTarget | null;
  select: (target: EditorTarget) => void;
  clear: () => void;
  /** Se incrementa cada vez que un panel guarda con éxito. PreviewPane lo
   *  usa como `key` del iframe para recargarlo con datos frescos, sin que
   *  cada panel necesite saber que la preview existe. */
  previewVersion: number;
  refreshPreview: () => void;
}

const EditorSelectionContext =
  createContext<EditorSelectionContextValue | null>(null);

/**
 * Coordina qué categoría/campo/ítem está "seleccionado" entre el panel de
 * configuración y la preview del sitio (que vive en un iframe aparte y se
 * conecta vía postMessage — ver PreviewPane/PreviewBridge). Mismo patrón
 * que BookingModalProvider (booking-modal-context.tsx).
 */
export function EditorSelectionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [target, setTarget] = useState<EditorTarget | null>({
    category: "informacion",
  });
  const [previewVersion, setPreviewVersion] = useState(0);

  return (
    <EditorSelectionContext.Provider
      value={{
        target,
        select: setTarget,
        clear: () => setTarget(null),
        previewVersion,
        refreshPreview: () => setPreviewVersion((v) => v + 1),
      }}
    >
      {children}
    </EditorSelectionContext.Provider>
  );
}

export function useEditorSelection() {
  const ctx = useContext(EditorSelectionContext);
  if (!ctx) {
    throw new Error(
      "useEditorSelection debe usarse dentro de <EditorSelectionProvider>"
    );
  }
  return ctx;
}
