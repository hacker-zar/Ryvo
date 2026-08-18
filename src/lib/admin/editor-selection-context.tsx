"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from "react";
import UnsavedChangesDialog from "@/components/ui/UnsavedChangesDialog";

// Renombrado como parte de la reorganización del editor: "informacion" →
// "pagina" (absorbe también redes sociales), "horarios" → "reservas"
// (absorbe locales), "fotos" se fusiona dentro de "apariencia" (deja de
// ser categoría propia). "productos"/"automatizaciones" son nuevas,
// todavía sin funcionalidad real (ver category-panel.tsx). Estos strings
// también son la clave que usa el puente de postMessage con la preview en
// vivo (ver data-editable-category en los componentes públicos) — se
// renombraron ahí también, en el mismo cambio.
export type EditorCategory =
  | "apariencia"
  | "pagina"
  | "servicios"
  | "profesionales"
  | "productos"
  | "reservas"
  | "automatizaciones";

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
  /** El panel activo reporta acá su propio `dirty` de useAsyncStatus — no
   *  es un segundo estado paralelo, es el mismo que ya usa el panel,
   *  levantado un nivel para que la navegación (cambiar de categoría,
   *  cerrar el editor) pueda protegerlo. */
  isDirty: boolean;
  setDirty: (dirty: boolean) => void;
  /** El panel activo registra acá cómo guardarse a sí mismo, para que el
   *  diálogo de "cambios sin guardar" pueda ofrecer "Guardar y continuar"
   *  sin conocer los detalles de cada formulario. Devuelve si guardó bien. */
  setSaveHandler: (handler: (() => Promise<boolean>) | null) => void;
  /** Primitiva genérica: ejecuta `apply` directo si no hay cambios sin
   *  guardar; si los hay, abre el diálogo de confirmación y `apply` queda
   *  pendiente hasta que el usuario decida. `select`/`clear` ya la usan
   *  internamente — se expone también para navegación que no pasa por
   *  `target` (por ejemplo los pasos del onboarding). */
  guardNavigation: (apply: () => void) => void;
}

const EditorSelectionContext =
  createContext<EditorSelectionContextValue | null>(null);

/**
 * Coordina qué categoría/campo/ítem está "seleccionado" entre el panel de
 * configuración y la preview del sitio (que vive en un iframe aparte y se
 * conecta vía postMessage — ver PreviewPane/PreviewBridge). Mismo patrón
 * que BookingModalProvider (booking-modal-context.tsx).
 *
 * También centraliza el guardrail de "cambios sin guardar": guardarlo acá
 * (en vez de en cada panel) es lo que permite que CUALQUIER forma de
 * navegar — click en el menú de categorías, click dentro de la preview
 * (que dispara `select` vía postMessage), o los pasos del onboarding —
 * quede protegida por igual, sin que cada una tenga que acordarse de
 * preguntar.
 */
export function EditorSelectionProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [target, setTarget] = useState<EditorTarget | null>({
    category: "pagina",
  });
  const [previewVersion, setPreviewVersion] = useState(0);

  const [isDirty, setIsDirty] = useState(false);
  const isDirtyRef = useRef(false);
  const saveHandlerRef = useRef<(() => Promise<boolean>) | null>(null);
  // Espejo en estado de `saveHandlerRef.current !== null`, solo para poder
  // decidir en el render si mostrar "Guardar y continuar" — leer un ref
  // durante el render no es seguro (ver regla react-hooks/refs).
  const [hasSaveHandler, setHasSaveHandler] = useState(false);
  const [pendingApply, setPendingApply] = useState<(() => void) | null>(null);
  const [dialogStatus, setDialogStatus] = useState<"idle" | "saving" | "error">(
    "idle"
  );

  const setDirty = useCallback((value: boolean) => {
    isDirtyRef.current = value;
    setIsDirty(value);
  }, []);

  const setSaveHandler = useCallback(
    (handler: (() => Promise<boolean>) | null) => {
      saveHandlerRef.current = handler;
      setHasSaveHandler(handler !== null);
    },
    []
  );

  const guardNavigation = useCallback((apply: () => void) => {
    if (!isDirtyRef.current) {
      apply();
      return;
    }
    setDialogStatus("idle");
    setPendingApply(() => apply);
  }, []);

  const select = useCallback(
    (t: EditorTarget) => guardNavigation(() => setTarget(t)),
    [guardNavigation]
  );
  const clear = useCallback(
    () => guardNavigation(() => setTarget(null)),
    [guardNavigation]
  );

  // Salir de la página con cambios sin guardar: el navegador ya muestra su
  // propio diálogo nativo ante beforeunload con preventDefault (el texto
  // de `returnValue` no es configurable en los navegadores modernos) — no
  // hace falta ni se puede reemplazarlo por el nuestro. Solo se engancha
  // mientras hay algo sin guardar, para no interceptar salidas normales.
  useEffect(() => {
    if (!isDirty) return;
    function handleBeforeUnload(e: BeforeUnloadEvent) {
      e.preventDefault();
      e.returnValue = "";
    }
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () =>
      window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [isDirty]);

  async function handleSaveAndContinue() {
    const save = saveHandlerRef.current;
    if (!save) return;
    setDialogStatus("saving");
    try {
      const ok = await save();
      if (ok) {
        pendingApply?.();
        setPendingApply(null);
        setDialogStatus("idle");
      } else {
        setDialogStatus("error");
      }
    } catch {
      setDialogStatus("error");
    }
  }

  function handleDiscard() {
    setDirty(false);
    pendingApply?.();
    setPendingApply(null);
    setDialogStatus("idle");
  }

  function handleCancel() {
    setPendingApply(null);
    setDialogStatus("idle");
  }

  const refreshPreview = useCallback(() => setPreviewVersion((v) => v + 1), []);

  // Memoizado para que un cambio de estado que a un consumidor no le
  // importa (ej. dialogStatus mientras se guarda) no le fuerce un
  // re-render por una referencia de `value` nueva — solo importa cuando
  // alguno de estos campos realmente cambia.
  const value = useMemo(
    () => ({
      target,
      select,
      clear,
      previewVersion,
      refreshPreview,
      isDirty,
      setDirty,
      setSaveHandler,
      guardNavigation,
    }),
    [
      target,
      select,
      clear,
      previewVersion,
      refreshPreview,
      isDirty,
      setDirty,
      setSaveHandler,
      guardNavigation,
    ]
  );

  return (
    <EditorSelectionContext.Provider value={value}>
      {children}
      <UnsavedChangesDialog
        open={pendingApply !== null}
        canSave={hasSaveHandler}
        status={dialogStatus}
        onSaveAndContinue={handleSaveAndContinue}
        onDiscard={handleDiscard}
        onCancel={handleCancel}
      />
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
