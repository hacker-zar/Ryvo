"use client";

import { useEffect, useRef, useState } from "react";
import {
  EditorCategory,
  useEditorSelection,
} from "@/lib/admin/editor-selection-context";

const VIEWPORTS = [
  { key: "desktop", label: "Desktop" },
  { key: "mobile", label: "Mobile" },
] as const;

type Viewport = (typeof VIEWPORTS)[number]["key"];

// Margen para una preview lenta (consulta fría + render del sitio
// completo) sin dejar al usuario esperando indefinidamente si falló.
const PREVIEW_TIMEOUT_MS = 10000;

/**
 * Ancho REAL del iframe en modo Desktop.
 *
 * Antes el iframe medía lo que sobraba en el panel (~552px con el
 * contenedor de 1024px), y como un iframe tiene su propio viewport, a
 * ese ancho se disparaban los breakpoints de mobile/tablet: la pestaña
 * decía "Desktop" y mostraba otra cosa. Era la única pantalla del editor
 * que desinformaba activamente — y con la revisión previa a publicar
 * hecha acá, se aprobaban layouts que ningún visitante de escritorio
 * iba a ver.
 *
 * Ahora el iframe SIEMPRE mide 1280px de verdad y se reduce con
 * transform: scale() hasta entrar en el hueco disponible. El navegador
 * de adentro cree que está en un monitor y resuelve los breakpoints
 * correctos; lo único que cambia es el tamaño con que lo vemos.
 */
const DESKTOP_PREVIEW_WIDTH = 1280;
const MOBILE_PREVIEW_WIDTH = 390;
const MOBILE_PREVIEW_HEIGHT = 760;

const VALID_CATEGORIES: EditorCategory[] = [
  "pagina",
  "servicios",
  "profesionales",
  "reservas",
  "apariencia",
];

interface PreviewPaneProps {
  businessId: string;
}

/**
 * La preview vive en un <iframe> same-origin apuntando a
 * /admin/negocios/[id]/preview (mismo árbol de componentes que el sitio
 * público, ver BusinessSite). Un iframe tiene su propio viewport real, así
 * que cambiar su ancho dispara los breakpoints `md:` de siempre — no hace
 * falta ninguna versión "mobile" paralela de los componentes.
 *
 * Coordinación con el panel de configuración vía postMessage:
 * - Click en la preview → "ryvo-editor-select" → actualiza la selección acá.
 * - Selección cambia (desde acá o desde el panel) → "ryvo-editor-highlight"
 *   al iframe, para que resalte/scrollee al elemento correspondiente.
 */
export default function PreviewPane({ businessId }: PreviewPaneProps) {
  const { target, select, previewVersion } = useEditorSelection();
  const [viewport, setViewport] = useState<Viewport>("desktop");
  const [localRetry, setLocalRetry] = useState(0);
  // previewVersion cambia cuando se guarda algo (refreshPreview) y
  // localRetry cuando se toca "Reintentar" — cualquiera de los dos
  // remonta el iframe (mismo `key`). "Listo"/"con error" se derivan
  // comparando contra esta key en vez de guardarse como booleanos que
  // haya que resetear a mano en un efecto (mismo patrón que slotsKey en
  // StepDateTime) — así una key nueva nunca arrastra el estado anterior.
  const currentKey = `${previewVersion}-${localRetry}`;
  const [readyKey, setReadyKey] = useState<string | null>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const currentKeyRef = useRef(currentKey);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const frameBoxRef = useRef<HTMLDivElement>(null);
  // Ancho disponible para la preview. Empieza en null (todavía no medido)
  // y no en un número inventado: con un valor supuesto, el primer render
  // mostraría la preview a una escala incorrecta y saltaría al medirse.
  const [availableWidth, setAvailableWidth] = useState<number | null>(null);

  // ResizeObserver y no un listener de `resize` de window: el hueco de la
  // preview cambia por cosas que no son un resize de ventana — abrir una
  // categoría del acordeón, o el propio ensanche del editor a partir de
  // 1700px (ver TwoColumnLayout).
  useEffect(() => {
    const node = frameBoxRef.current;
    if (!node) return;
    const observer = new ResizeObserver(([entry]) => {
      setAvailableWidth(entry.contentRect.width);
    });
    observer.observe(node);
    return () => observer.disconnect();
  }, []);

  const frameWidth =
    viewport === "mobile" ? MOBILE_PREVIEW_WIDTH : DESKTOP_PREVIEW_WIDTH;

  // Nunca se agranda (tope en 1), solo se reduce: mostrar el sitio más
  // grande que su tamaño real sería otra forma de mentir.
  const scale =
    availableWidth === null ? 1 : Math.min(1, availableWidth / frameWidth);

  // El alto visible es el del contenedor; el iframe necesita ser más alto
  // en proporción inversa a la escala para llenarlo después de reducirse.
  const visibleHeight =
    viewport === "mobile" ? MOBILE_PREVIEW_HEIGHT * scale : 640;

  const loaded = readyKey === currentKey;
  const loadError = errorKey === currentKey;

  useEffect(() => {
    currentKeyRef.current = currentKey;
  }, [currentKey]);

  /**
   * "Listo" depende de que el iframe mande `ryvo-editor-ready`. Si la
   * página de preview falla en el server, ese mensaje no llega nunca — y
   * `onError` de un <iframe> no dispara para respuestas HTTP de error,
   * así que el panel se quedaba en "Cargando vista previa..." para
   * siempre, sin salida. Este timeout hace alcanzable el estado de error
   * que el componente ya tenía construido (con su botón "Reintentar"),
   * en vez de agregar uno nuevo.
   */
  useEffect(() => {
    if (loaded || loadError) return;
    const timer = window.setTimeout(() => {
      setErrorKey(currentKeyRef.current);
    }, PREVIEW_TIMEOUT_MS);
    return () => window.clearTimeout(timer);
  }, [currentKey, loaded, loadError]);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;

      if (event.data?.type === "ryvo-editor-ready") {
        setReadyKey(currentKeyRef.current);
        return;
      }

      if (event.data?.type !== "ryvo-editor-select") return;
      const { category, field, itemId } = event.data as {
        category?: string;
        field?: string;
        itemId?: string;
      };
      if (!category || !VALID_CATEGORIES.includes(category as EditorCategory))
        return;
      select({
        category: category as EditorCategory,
        field: field || undefined,
        itemId: itemId || undefined,
      });
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [select]);

  useEffect(() => {
    if (!target) return;
    iframeRef.current?.contentWindow?.postMessage(
      { type: "ryvo-editor-highlight", ...target },
      window.location.origin
    );
  }, [target]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-4">
        {VIEWPORTS.map((v) => (
          <button
            key={v.key}
            type="button"
            onClick={() => setViewport(v.key)}
            className="section-eyebrow text-xs px-3 py-1.5 radius-sm border focus-visible:ring-2 focus-visible:ring-brass/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink transition-colors"
            style={{
              borderColor:
                viewport === v.key ? "var(--brass)" : "var(--ink-line)",
              color: viewport === v.key ? "var(--brass)" : "var(--bone-muted)",
            }}
          >
            {v.label}
          </button>
        ))}
      </div>

      {/* Caja medida por el ResizeObserver — siempre al 100% del hueco,
          para que `availableWidth` sea el ancho real disponible y no el
          del marco ya escalado. */}
      <div ref={frameBoxRef} className="w-full">
      <div
        className={
          viewport === "mobile"
            ? "relative mx-auto rounded-2xl border border-ink-line overflow-hidden bg-ink"
            : "relative w-full radius-sm border border-ink-line overflow-hidden bg-ink"
        }
        style={{
          height: visibleHeight,
          width:
            viewport === "mobile" ? MOBILE_PREVIEW_WIDTH * scale : undefined,
        }}
      >
        {!loaded && !loadError ? (
          <div className="absolute inset-0 z-10 flex items-center justify-center bg-ink">
            <p className="section-eyebrow text-bone-muted text-xs animate-pulse">
              Cargando vista previa...
            </p>
          </div>
        ) : null}

        {loadError ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-3 bg-ink px-4 text-center">
            <p className="text-sm text-bone-muted">
              No pudimos cargar la vista previa.
            </p>
            <button
              type="button"
              onClick={() => setLocalRetry((n) => n + 1)}
              className="section-eyebrow text-xs px-4 py-2 radius-sm border border-ink-line text-bone hover:border-brass focus-visible:ring-2 focus-visible:ring-brass/60 focus-visible:ring-offset-2 focus-visible:ring-offset-ink transition-colors"
            >
              Reintentar
            </button>
          </div>
        ) : null}

        <iframe
          key={currentKey}
          ref={iframeRef}
          src={`/admin/negocios/${businessId}/preview`}
          title="Vista previa del sitio"
          onError={() => setErrorKey(currentKey)}
          className="border-0"
          style={{
            width: frameWidth,
            // Alto compensado: al reducirse por `scale`, termina ocupando
            // exactamente `visibleHeight`.
            height: visibleHeight / scale,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
          }}
        />
      </div>
      </div>

      {viewport === "desktop" && scale < 1 ? (
        <p className="mt-2 text-[11px] text-bone-muted/70">
          Escritorio real de {DESKTOP_PREVIEW_WIDTH}px, mostrado al{" "}
          {Math.round(scale * 100)}%.
        </p>
      ) : null}
    </div>
  );
}
