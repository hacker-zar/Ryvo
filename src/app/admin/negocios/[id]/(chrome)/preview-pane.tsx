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

// Categorías con contenido real en la preview (las de solo estructura —
// productos/automatizaciones — no tienen ningún elemento clickeable en el
// sitio público todavía, así que no forman parte de este puente).
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

  const loaded = readyKey === currentKey;
  const loadError = errorKey === currentKey;

  useEffect(() => {
    currentKeyRef.current = currentKey;
  }, [currentKey]);

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

      <div
        className={
          viewport === "mobile"
            ? "relative mx-auto w-[390px] rounded-2xl border border-ink-line overflow-hidden bg-ink"
            : "relative w-full radius-sm border border-ink-line overflow-hidden bg-ink"
        }
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
          className={
            viewport === "mobile"
              ? "w-[390px] h-[760px]"
              : "w-full h-[80vh] min-h-[600px]"
          }
        />
      </div>
    </div>
  );
}
