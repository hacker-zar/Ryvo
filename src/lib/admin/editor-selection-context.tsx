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
// "perfil"/"galeria" son exclusivas del Editor rápido (ver
// app/admin/negocios/[id]/rapido/) — "servicios"/"productos" ya
// existían y se reutilizan tal cual ahí, con datos acotados al
// profesional en vez de al negocio entero.
export type EditorCategory =
  | "apariencia"
  | "pagina"
  | "servicios"
  | "profesionales"
  | "productos"
  | "reservas"
  | "automatizaciones"
  | "plantilla"
  | "perfil"
  | "galeria";

export interface EditorTarget {
  category: EditorCategory;
  field?: string;
  itemId?: string;
}

// Nombre distinto de AsyncStatus (useAsyncStatus.ts) y del componente
// SaveStatus (components/ui/SaveStatus.tsx) a propósito — GlobalSaveBar
// importa los tres en el mismo archivo.
export type GlobalSaveStatus = "idle" | "saving" | "success" | "error";

interface RegisteredForm {
  dirty: boolean;
  save: (() => Promise<boolean>) | null;
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
  /** true si CUALQUIER formulario registrado (Página/Fotos/Apariencia)
   *  tiene cambios sin guardar — es la unión de todos, no de uno solo:
   *  varias secciones pueden estar sucias al mismo tiempo (ver
   *  setFormDirty). */
  isDirty: boolean;
  /** Cada formulario de configuración (Página/Fotos/Apariencia) reporta
   *  acá su propio `dirty` de useAsyncStatus, bajo una clave estable y
   *  propia (ej. "pagina", "fotos", "apariencia") — NO uno global
   *  compartido, para que dos formularios abiertos a la vez (Fotos +
   *  Apariencia, ambos dentro de "Apariencia") no se pisen entre sí. */
  setFormDirty: (key: string, dirty: boolean) => void;
  /** Cada formulario registra acá cómo guardarse a sí mismo, bajo la
   *  misma clave que usa en setFormDirty. `saveChanges()` (más abajo) es
   *  quien de verdad los invoca — ni el botón global ni Ctrl+S llaman
   *  directo a un `save` individual. */
  setFormSaveHandler: (key: string, save: (() => Promise<boolean>) | null) => void;
  /** Estado del guardado global — lo consume GlobalSaveBar. */
  saveStatus: GlobalSaveStatus;
  saveError: string;
  /** LA función centralizada: guarda todos los formularios sucios (en
   *  paralelo, uno por sección con cambios pendientes) y devuelve si
   *  todos salieron bien. El botón "Guardar cambios", el atajo Ctrl+S/
   *  Cmd+S y "Guardar y continuar" del diálogo de cambios sin guardar
   *  llaman exactamente a esta misma función — no hay una segunda
   *  implementación de guardado en ningún lado. No-op (no dispara
   *  ninguna request) si no hay nada sucio. */
  saveChanges: () => Promise<boolean>;
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
 * También centraliza el guardado de los formularios de configuración
 * (Página/Fotos/Apariencia — ver GlobalSaveBar): cada uno se registra acá
 * con una clave propia (`setFormDirty`/`setFormSaveHandler`) en vez de
 * tener su propio botón "Guardar", y `saveChanges()` es la única función
 * que de verdad dispara los guardados — la usan el botón global, Ctrl+S/
 * Cmd+S y el diálogo de "cambios sin guardar" por igual. Las listas CRUD
 * (Servicios/Profesionales/Productos/Locales) NO se registran acá — sus
 * acciones (crear/editar/borrar un ítem) siguen siendo inmediatas, fuera
 * del guardado global (decisión explícita, no un olvido).
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

  const formsRef = useRef<Map<string, RegisteredForm>>(new Map());
  const [isDirty, setIsDirty] = useState(false);
  const isDirtyRef = useRef(false);
  // Espejo en estado de "hay al menos un formulario sucio con save
  // registrado", solo para poder decidir en el render si el diálogo
  // ofrece "Guardar y continuar" — leer el ref durante el render no es
  // seguro (ver regla react-hooks/refs).
  const [hasSaveHandler, setHasSaveHandler] = useState(false);
  const [saveStatus, setSaveStatus] = useState<GlobalSaveStatus>("idle");
  const [saveError, setSaveError] = useState("");
  const [pendingApply, setPendingApply] = useState<(() => void) | null>(null);
  const [dialogStatus, setDialogStatus] = useState<"idle" | "saving" | "error">(
    "idle"
  );

  // Recalcula los dos agregados (isDirty/hasSaveHandler) a partir del
  // registro completo — se llama después de cualquier cambio a
  // formsRef, sea por dirty o por save handler.
  const recomputeAggregates = useCallback(() => {
    let anyDirty = false;
    let anySaveable = false;
    for (const entry of formsRef.current.values()) {
      if (entry.dirty) {
        anyDirty = true;
        if (entry.save) anySaveable = true;
      }
    }
    isDirtyRef.current = anyDirty;
    setIsDirty(anyDirty);
    setHasSaveHandler(anySaveable);
  }, []);

  const setFormDirty = useCallback(
    (key: string, dirty: boolean) => {
      const existing = formsRef.current.get(key) ?? { dirty: false, save: null };
      formsRef.current.set(key, { ...existing, dirty });
      recomputeAggregates();
    },
    [recomputeAggregates]
  );

  const setFormSaveHandler = useCallback(
    (key: string, save: (() => Promise<boolean>) | null) => {
      const existing = formsRef.current.get(key) ?? { dirty: false, save: null };
      formsRef.current.set(key, { ...existing, save });
      recomputeAggregates();
    },
    [recomputeAggregates]
  );

  const saveChanges = useCallback(async (): Promise<boolean> => {
    const dirtyEntries = Array.from(formsRef.current.values()).filter(
      (f) => f.dirty && f.save
    );
    if (dirtyEntries.length === 0) return true;

    setSaveStatus("saving");
    setSaveError("");
    try {
      const results = await Promise.all(dirtyEntries.map((f) => f.save!()));
      const allOk = results.every(Boolean);
      if (allOk) {
        setSaveStatus("success");
      } else {
        setSaveStatus("error");
        setSaveError("No se pudieron guardar algunos cambios. Reintentá.");
      }
      return allOk;
    } catch {
      setSaveStatus("error");
      setSaveError("No se pudieron guardar algunos cambios. Reintentá.");
      return false;
    }
  }, []);

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

  // Ctrl+S (Windows/Linux) / Cmd+S (macOS) ejecuta EXACTAMENTE la misma
  // función que el botón global (ver GlobalSaveBar) — nunca una segunda
  // implementación de guardado. Siempre intercepta el atajo (incluso sin
  // nada sucio) para que el navegador nunca llegue a abrir su propio
  // diálogo de "Guardar página"; `saveChanges` en sí es un no-op si no
  // hay cambios pendientes. Se excluye Shift/Alt para no pisar otros
  // atajos del navegador que también usan la tecla S. Vive acá (no en
  // GlobalSaveBar) para funcionar en cualquier pantalla que use este
  // provider, incluido el onboarding paso a paso.
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const isSaveShortcut =
        (e.ctrlKey || e.metaKey) &&
        !e.shiftKey &&
        !e.altKey &&
        e.key.toLowerCase() === "s";
      if (!isSaveShortcut) return;
      e.preventDefault();
      saveChanges();
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [saveChanges]);

  async function handleSaveAndContinue() {
    setDialogStatus("saving");
    const ok = await saveChanges();
    if (ok) {
      pendingApply?.();
      setPendingApply(null);
      setDialogStatus("idle");
    } else {
      setDialogStatus("error");
    }
  }

  function handleDiscard() {
    // Descarta el registro entero, no solo el flag global: si no,
    // formularios individuales seguirían reportándose sucios la próxima
    // vez que se recalculen los agregados.
    for (const [key, entry] of formsRef.current) {
      formsRef.current.set(key, { ...entry, dirty: false });
    }
    recomputeAggregates();
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
      setFormDirty,
      setFormSaveHandler,
      saveStatus,
      saveError,
      saveChanges,
      guardNavigation,
    }),
    [
      target,
      select,
      clear,
      previewVersion,
      refreshPreview,
      isDirty,
      setFormDirty,
      setFormSaveHandler,
      saveStatus,
      saveError,
      saveChanges,
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
