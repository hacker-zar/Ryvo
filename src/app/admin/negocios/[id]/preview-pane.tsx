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

const VALID_CATEGORIES: EditorCategory[] = [
  "informacion",
  "servicios",
  "profesionales",
  "horarios",
  "fotos",
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
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      if (event.origin !== window.location.origin) return;
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
            className="section-eyebrow text-xs px-3 py-1.5 rounded-sm border transition-colors"
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
            ? "mx-auto w-[390px] rounded-2xl border border-ink-line overflow-hidden bg-ink"
            : "w-full rounded-sm border border-ink-line overflow-hidden bg-ink"
        }
      >
        <iframe
          key={previewVersion}
          ref={iframeRef}
          src={`/admin/negocios/${businessId}/preview`}
          title="Vista previa del sitio"
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
